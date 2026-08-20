// Simulated product catalog. DB fetch cost and payload size are randomized
// per product within realistic e-commerce ranges.
const ADJECTIVES = ["Classic", "Pro", "Ultra", "Compact", "Deluxe", "Eco", "Smart", "Mini", "Heavy-Duty", "Wireless"];
const NOUNS = ["Blender", "Backpack", "Headphones", "Kettle", "Sneakers", "Monitor", "Desk Lamp", "Water Bottle", "Charger", "Notebook"];

export function buildCatalog(count = 80, seed = 42) {
  const rand = mulberry32(seed);
  const products = [];
  for (let i = 0; i < count; i++) {
    const adj = ADJECTIVES[Math.floor(rand() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(rand() * NOUNS.length)];
    products.push({
      id: `p${i + 1}`,
      name: `${adj} ${noun} ${i + 1}`,
      dbCostMs: Math.round(15 + rand() * 185), // 15-200ms simulated query cost
      payloadKB: Math.round(5 + rand() * 95), // 5-100KB simulated payload
    });
  }
  return products;
}

function mulberry32(seed) {
  let t = seed;
  return function () {
    t |= 0;
    t = (t + 0x6d2b79f5) | 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
