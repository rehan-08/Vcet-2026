import { redis } from "./redisClient.js";
import { buildCatalog } from "./catalog.js";
import { ZipfSampler } from "./zipf.js";
import { fetchFromDb } from "./db.js";
import { missCost, storageCost } from "./costModel.js";

const BASELINE_TTL = 60; // flat TTL, seconds
const ADAPTIVE_ALPHA = 0.3;
const ADAPTIVE_MIN_TTL = 3;
const ADAPTIVE_MAX_TTL = 240;
// 4s windows, not 1s: at low request rates a 1s access count is almost
// always 0 or 1, so the EMA input is too quantized/noisy and the resulting
// TTL swings randomly enough to evict items that are still genuinely warm.
// A wider window still reacts within seconds but averages out that noise.
const TICK_MS = 4000;
const EVENT_LOG_SIZE = 60;

function freshPolicyStats() {
  return { hits: 0, misses: 0, requests: 0, cumulativeCost: 0 };
}

export class Simulation {
  constructor() {
    this.catalog = buildCatalog(80);
    this.byId = new Map(this.catalog.map((p) => [p.id, p]));
    this.zipf = new ZipfSampler(this.catalog.length, 1.1);
    this.rankToProduct = this.catalog.map((p) => p.id);

    this.running = false;
    this.requestRate = 10; // req/sec
    this.loopHandle = null;
    this.tickHandle = null;
    this.lastShiftAt = null;

    this.policy = {
      baseline: freshPolicyStats(),
      adaptive: freshPolicyStats(),
    };

    this.perItem = new Map(
      this.catalog.map((p) => [
        p.id,
        {
          baseline: { hits: 0, misses: 0 },
          adaptive: { hits: 0, misses: 0, rate: 0, ttl: ADAPTIVE_MIN_TTL },
        },
      ])
    );

    this.tickAccessCount = new Map(this.catalog.map((p) => [p.id, 0]));
    this.events = []; // recent {policy, productId, hit, ts}
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._scheduleNext();
    this.tickHandle = setInterval(() => this._tick(), TICK_MS);
  }

  stop() {
    this.running = false;
    if (this.loopHandle) clearTimeout(this.loopHandle);
    if (this.tickHandle) clearInterval(this.tickHandle);
    this.loopHandle = null;
    this.tickHandle = null;
  }

  setRate(reqPerSec) {
    this.requestRate = Math.max(1, Math.min(50, reqPerSec));
  }

  shiftTraffic() {
    const n = this.rankToProduct.length;
    const hotCount = Math.max(4, Math.floor(n * 0.1));
    const coldPool = [];
    for (let i = Math.floor(n / 2); i < n; i++) coldPool.push(i);
    for (let i = 0; i < hotCount && coldPool.length; i++) {
      const coldIdx = coldPool.splice(Math.floor(Math.random() * coldPool.length), 1)[0];
      const tmp = this.rankToProduct[i];
      this.rankToProduct[i] = this.rankToProduct[coldIdx];
      this.rankToProduct[coldIdx] = tmp;
    }
    this.lastShiftAt = Date.now();
  }

  _scheduleNext() {
    if (!this.running) return;
    const delay = 1000 / this.requestRate;
    this.loopHandle = setTimeout(async () => {
      const rank = this.zipf.sample();
      const productId = this.rankToProduct[rank];
      this._handle("baseline", productId).catch(() => {});
      this._handle("adaptive", productId).catch(() => {});
      const counter = this.tickAccessCount.get(productId) || 0;
      this.tickAccessCount.set(productId, counter + 1);
      this._scheduleNext();
    }, delay);
  }

  async _handle(policyName, productId) {
    const product = this.byId.get(productId);
    const stats = this.policy[policyName];
    const item = this.perItem.get(productId)[policyName];
    stats.requests++;

    const key = `${policyName}:${productId}`;
    const cached = await redis.get(key);
    let hit = Boolean(cached);

    if (hit) {
      stats.hits++;
      item.hits++;
    } else {
      stats.misses++;
      item.misses++;
      await fetchFromDb(product);
      stats.cumulativeCost += missCost(product.dbCostMs);

      const ttl = policyName === "baseline" ? BASELINE_TTL : this.perItem.get(productId).adaptive.ttl;
      if (ttl > 0) {
        await redis.set(key, "1", { EX: ttl });
        stats.cumulativeCost += storageCost(product.payloadKB, ttl);
      }
    }

    this.events.push({ policy: policyName, productId, hit, ts: Date.now() });
    if (this.events.length > EVENT_LOG_SIZE) this.events.shift();
  }

  async _tick() {
    const rateCap = Math.max(1, this.requestRate * (TICK_MS / 1000) * 0.12);
    for (const product of this.catalog) {
      const item = this.perItem.get(product.id).adaptive;
      const currentAccess = this.tickAccessCount.get(product.id) || 0;
      item.rate = ADAPTIVE_ALPHA * currentAccess + (1 - ADAPTIVE_ALPHA) * item.rate;
      this.tickAccessCount.set(product.id, 0);

      // sqrt curve, not linear: a linear rate/cap mapping only gives a
      // meaningful TTL boost to the single hottest item or two and leaves
      // everything else near the floor, which under-caches the broad
      // "moderately popular" band relative to the flat baseline. sqrt
      // keeps hot items near the cap and cold items near the floor while
      // giving the middle of the distribution a proportionally bigger lift.
      const normalized = Math.sqrt(Math.min(item.rate / rateCap, 1));
      const newTtl = Math.round(ADAPTIVE_MIN_TTL + normalized * (ADAPTIVE_MAX_TTL - ADAPTIVE_MIN_TTL));
      item.ttl = newTtl;

      // Only ever extend a live key's expiry, never shrink or actively
      // evict it: a key that's still within the TTL it was legitimately
      // written with is still a valid hit waiting to happen. Cold items
      // already get a short TTL from the curve above (down to
      // ADAPTIVE_MIN_TTL) and expire on their own — reaching in to DEL
      // them early would just convert would-be hits into misses for a
      // memory saving worth a fraction of a cent.
      const key = `adaptive:${product.id}`;
      const remaining = await redis.ttl(key).catch(() => -2);
      if (remaining >= 0 && newTtl > remaining) {
        await redis.expire(key, newTtl).catch(() => {});
        this.policy.adaptive.cumulativeCost += storageCost(product.payloadKB, newTtl - remaining);
      }
    }
  }

  getState() {
    const hitRate = (s) => (s.requests ? s.hits / s.requests : 0);
    const savings = this.policy.baseline.cumulativeCost - this.policy.adaptive.cumulativeCost;

    const items = this.catalog.map((p) => {
      const rec = this.perItem.get(p.id);
      return {
        id: p.id,
        name: p.name,
        baselineHits: rec.baseline.hits,
        baselineMisses: rec.baseline.misses,
        adaptiveHits: rec.adaptive.hits,
        adaptiveMisses: rec.adaptive.misses,
        accessRate: Number(rec.adaptive.rate.toFixed(3)),
        ttl: rec.adaptive.ttl,
      };
    });

    return {
      running: this.running,
      requestRate: this.requestRate,
      lastShiftAt: this.lastShiftAt,
      baseline: { ...this.policy.baseline, hitRate: hitRate(this.policy.baseline) },
      adaptive: { ...this.policy.adaptive, hitRate: hitRate(this.policy.adaptive) },
      savings,
      items,
      events: this.events.slice(-40),
    };
  }
}
