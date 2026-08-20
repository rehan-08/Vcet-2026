import { createClient } from "redis";

const url = process.env.REDIS_URL || "redis://localhost:6379";
export const redis = createClient({ url });
redis.on("error", (err) => console.error("Redis error:", err.message));

export async function connectRedis() {
  await redis.connect();
  console.log(`Connected to Redis at ${url}`);
}
