// Cost model constants, hardcoded against real published AWS pricing
// (us-east-1, on-demand, as published on aws.amazon.com/elasticache/pricing
// and aws.amazon.com/rds/pricing at time of writing). Simulation-scale, not
// production billing.

// ElastiCache for Redis, cache.m6g.large: $0.156/hr, 6.38 GiB memory.
const ELASTICACHE_HOURLY_USD = 0.156;
const ELASTICACHE_MEMORY_GB = 6.38;
const ELASTICACHE_BYTES = ELASTICACHE_MEMORY_GB * 1024 * 1024 * 1024;
export const COST_PER_BYTE_SECOND = ELASTICACHE_HOURLY_USD / 3600 / ELASTICACHE_BYTES;

// RDS db.t3.medium (proxy for backing DB compute): $0.068/hr.
// A cache miss is charged proportional to the simulated query's wall time.
const RDS_HOURLY_USD = 0.068;
export const COST_PER_DB_MS = RDS_HOURLY_USD / 3600 / 1000;

export function missCost(dbCostMs) {
  return dbCostMs * COST_PER_DB_MS;
}

export function storageCost(payloadKB, ttlSeconds) {
  const bytes = payloadKB * 1024;
  return bytes * ttlSeconds * COST_PER_BYTE_SECOND;
}
