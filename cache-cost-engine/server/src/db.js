// Simulated backing database: resolves after an artificial delay matching
// the product's simulated fetch cost.
export function fetchFromDb(product) {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ id: product.id, payload: "x".repeat(product.payloadKB) }), product.dbCostMs);
  });
}
