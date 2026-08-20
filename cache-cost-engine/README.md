# Cachefront — Predictive Cloud-Cost Caching Engine

Adaptive TTL cache policy engine vs a flat-TTL baseline, run side by side against the same simulated Zipfian e-commerce traffic, with live hit-rate and dollar-cost comparison.

## Stack

- **Server**: Node.js + Express, `redis` client
- **Cache**: real Redis
- **Frontend**: React + Vite, polling `/simulation/state`

## Run it

**1. Start Redis** (Docker):

```bash
docker compose up -d
```

**2. Start the server** (port 4000):

```bash
cd server
npm install
npm start
```

**3. Start the client** (port 5173):

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173.

## How it works

- **Catalog**: 80 synthetic products, each with a simulated DB fetch cost (15-200ms) and payload size (5-100KB) — [server/src/catalog.js](server/src/catalog.js).
- **Traffic**: a Zipfian sampler (`s = 1.1`) drives request rank selection, so a small set of products absorbs most traffic — [server/src/zipf.js](server/src/zipf.js). "Shift Traffic" swaps part of the hot set with previously-cold ranks live.
- **Baseline policy**: every key cached with a flat 60s TTL (`SET key val EX 60`).
- **Adaptive policy**: every second, each product's access rate is updated via EMA (`rate = α·current + (1-α)·rate_old`, α=0.3), normalized against the current traffic rate, and mapped to a TTL between 3s and 240s. The TTL is pushed onto the live Redis key via `EXPIRE`, and cold keys (rate below threshold) are actively evicted with `DEL` — see [server/src/simulation.js](server/src/simulation.js).
- **Cost model**: hardcoded constants from published AWS pricing (ElastiCache `cache.m6g.large` $0.156/hr for storage-held cost, RDS `db.t3.medium` $0.068/hr as a proxy for DB compute on a miss) — [server/src/costModel.js](server/src/costModel.js). Both tracks see the identical request stream, so the running cost delta is a fair before/after.

## API

- `POST /simulation/start` `{ rate?: number }`
- `POST /simulation/stop`
- `POST /simulation/rate` `{ rate: number }`
- `POST /simulation/shift-traffic`
- `GET /simulation/state`
