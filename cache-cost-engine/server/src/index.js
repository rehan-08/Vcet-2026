import express from "express";
import cors from "cors";
import { connectRedis, redis } from "./redisClient.js";
import { Simulation } from "./simulation.js";

const PORT = process.env.PORT || 4000;
const app = express();
app.use(cors());
app.use(express.json());

const sim = new Simulation();

app.post("/simulation/start", async (req, res) => {
  const { rate } = req.body || {};
  if (rate) sim.setRate(Number(rate));
  sim.start();
  res.json({ ok: true, running: sim.running, requestRate: sim.requestRate });
});

app.post("/simulation/stop", (req, res) => {
  sim.stop();
  res.json({ ok: true, running: sim.running });
});

app.post("/simulation/shift-traffic", (req, res) => {
  sim.shiftTraffic();
  res.json({ ok: true, lastShiftAt: sim.lastShiftAt });
});

app.post("/simulation/rate", (req, res) => {
  const { rate } = req.body || {};
  sim.setRate(Number(rate));
  res.json({ ok: true, requestRate: sim.requestRate });
});

app.get("/simulation/state", (req, res) => {
  res.json(sim.getState());
});

async function main() {
  await connectRedis();
  await redis.flushDb();
  app.listen(PORT, () => console.log(`API listening on :${PORT}`));
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
