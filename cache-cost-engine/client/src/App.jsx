import { useEffect, useRef, useState } from "react";

const POLL_MS = 700;
const FLASH_MS = 900;

function fmtUsd(v, decimals = 4) {
  return `$${v.toFixed(decimals)}`;
}

function fmtPct(v) {
  return `${(v * 100).toFixed(1)}%`;
}

export default function App() {
  const [state, setState] = useState(null);
  const [rate, setRate] = useState(10);
  const [shiftPulse, setShiftPulse] = useState(false);
  const lastEventRef = useRef(new Map()); // key: policy:id -> {hit, ts}
  const [, forceTick] = useState(0);

  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        const res = await fetch("/simulation/state");
        const data = await res.json();
        if (!alive) return;
        setState(data);
        for (const ev of data.events) {
          const key = `${ev.policy}:${ev.productId}`;
          const existing = lastEventRef.current.get(key);
          if (!existing || existing.ts < ev.ts) lastEventRef.current.set(key, ev);
        }
      } catch (e) {
        // server not up yet — ignore, keep polling
      }
    }
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // periodic re-render so flash animations expire even without new events
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 300);
    return () => clearInterval(id);
  }, []);

  async function start() {
    await fetch("/simulation/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rate }),
    });
  }

  async function stop() {
    await fetch("/simulation/stop", { method: "POST" });
  }

  async function shiftTraffic() {
    await fetch("/simulation/shift-traffic", { method: "POST" });
    setShiftPulse(true);
    setTimeout(() => setShiftPulse(false), 1400);
  }

  async function changeRate(v) {
    setRate(v);
    await fetch("/simulation/rate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rate: v }),
    });
  }

  if (!state) {
    return (
      <div className="shell">
        <p style={{ color: "var(--text-faint)", fontFamily: "var(--mono)" }}>connecting to simulation…</p>
      </div>
    );
  }

  const { baseline, adaptive, savings, items } = state;
  const sortedByRate = [...items].sort((a, b) => b.accessRate - a.accessRate);
  const hottest = sortedByRate.slice(0, 6);
  const coldest = sortedByRate.slice(-6).reverse();

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" />
          <h1>Cachefront</h1>
          <span className="sub">adaptive TTL vs flat-TTL cache simulation</span>
        </div>
        <div className="controls">
          <span style={{ fontSize: 12, color: "var(--text-faint)", fontFamily: "var(--mono)" }}>
            <span className={`status-dot ${state.running ? "live" : ""}`} />
            {state.running ? "running" : "stopped"}
          </span>
          <select className="rate-select" value={rate} onChange={(e) => changeRate(Number(e.target.value))}>
            {[5, 10, 15, 20].map((r) => (
              <option key={r} value={r}>
                {r} req/s
              </option>
            ))}
          </select>
          {state.running ? (
            <button className="btn btn-stop" onClick={stop}>
              Stop
            </button>
          ) : (
            <button className="btn btn-primary" onClick={start}>
              Start Simulation
            </button>
          )}
          <button className="btn" onClick={shiftTraffic}>
            Shift Traffic
          </button>
        </div>
      </header>

      <section className={`savings-banner ${shiftPulse ? "shift-flash" : ""}`}>
        <div>
          <div className="savings-label">Database Cost Savings</div>
          <div className="savings-value">{fmtUsd(Math.max(0, savings), 4)}</div>
        </div>
        <div className="savings-meta">
          <div className="stat">
            <div className="k">Baseline Cost</div>
            <div className="v">{fmtUsd(baseline.cumulativeCost)}</div>
          </div>
          <div className="stat">
            <div className="k">Adaptive Cost</div>
            <div className="v">{fmtUsd(adaptive.cumulativeCost)}</div>
          </div>
          <div className="stat">
            <div className="k">Requests Served</div>
            <div className="v">{(baseline.requests + adaptive.requests).toLocaleString()}</div>
          </div>
        </div>
      </section>

      <section className="panels">
        <Panel label="Flat TTL Baseline" tagText="60s FIXED" accent="teal" data={baseline} barClass="teal" />
        <Panel label="Adaptive Engine" tagText="EMA α=0.3" accent="gold" data={adaptive} barClass="gold" />
      </section>

      <section className="maingrid">
        <div className="card">
          <div className="card-head">
            <h3>Cache Slots — Adaptive Engine</h3>
            <div className="legend">
              <span>
                <span className="sw" style={{ background: "var(--teal)" }} /> hit
              </span>
              <span>
                <span className="sw" style={{ background: "var(--red)" }} /> miss
              </span>
              <span>
                <span className="sw" style={{ background: "var(--border-soft)", border: "1px solid var(--border)" }} /> idle
              </span>
            </div>
          </div>
          <div className="heat-grid">
            {items.map((it) => {
              const ev = lastEventRef.current.get(`adaptive:${it.id}`);
              const isRecent = ev && Date.now() - ev.ts < FLASH_MS;
              const cls = !ev ? "" : ev.hit ? "hit" : "miss";
              return (
                <div
                  key={it.id}
                  className={`heat-cell ${cls} ${isRecent ? "flash" : ""}`}
                  title={`${it.name} · TTL ${it.ttl}s · rate ${it.accessRate}`}
                />
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="items-section">
            <h4>Hottest — TTL Reacting</h4>
            {hottest.map((it) => (
              <ItemRow key={it.id} item={it} />
            ))}
          </div>
          <div className="items-section">
            <h4>Coldest — Fast Eviction</h4>
            {coldest.map((it) => (
              <ItemRow key={it.id} item={it} />
            ))}
          </div>
        </div>
      </section>

      <p className="footer-note">
        Simulated traffic · Zipfian popularity · costs modeled against published AWS ElastiCache + RDS pricing
      </p>
    </div>
  );
}

function Panel({ label, tagText, accent, data, barClass }) {
  return (
    <div className={`panel accent-${accent}`}>
      <div className="panel-head">
        <div className="panel-title">{label}</div>
        <span className={`tag ${accent === "gold" ? "gold" : ""}`}>{tagText}</span>
      </div>
      <div className="metric-row">
        <div>
          <div className="metric-big">{fmtPct(data.hitRate)}</div>
          <div className="metric-sub">hit rate</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="metric-big" style={{ fontSize: 22 }}>
            {fmtUsd(data.cumulativeCost)}
          </div>
          <div className="metric-sub">cumulative cost</div>
        </div>
      </div>
      <div className="hitbar">
        <div className={`hitbar-fill ${barClass}`} style={{ width: `${data.hitRate * 100}%` }} />
      </div>
      <div className="foot-stats">
        <div className="stat">
          <div className="k">Requests</div>
          <div className="v">{data.requests.toLocaleString()}</div>
        </div>
        <div className="stat">
          <div className="k">Hits</div>
          <div className="v">{data.hits.toLocaleString()}</div>
        </div>
        <div className="stat">
          <div className="k">Misses</div>
          <div className="v">{data.misses.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

function ItemRow({ item }) {
  const pct = Math.min(100, (item.accessRate / 5) * 100);
  return (
    <div className="item-row">
      <div className="item-name">{item.name}</div>
      <div className="rate-bar-wrap">
        <div className="rate-bar" style={{ width: `${pct}%` }} />
      </div>
      <div className="ttl-chip">{item.ttl}s</div>
    </div>
  );
}
