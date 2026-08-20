// Zipfian sampler: rank k has weight 1/k^s. Precomputes a CDF over `n` ranks
// then samples in O(log n) per draw via binary search.
export class ZipfSampler {
  constructor(n, s = 1.1) {
    this.n = n;
    this.s = s;
    this._build();
  }

  _build() {
    const weights = new Array(this.n);
    let total = 0;
    for (let k = 1; k <= this.n; k++) {
      const w = 1 / Math.pow(k, this.s);
      weights[k - 1] = w;
      total += w;
    }
    const cdf = new Array(this.n);
    let acc = 0;
    for (let i = 0; i < this.n; i++) {
      acc += weights[i] / total;
      cdf[i] = acc;
    }
    cdf[this.n - 1] = 1;
    this.cdf = cdf;
  }

  // Returns a rank index in [0, n). Ranks map to shuffled product indices
  // by the caller, so "rank 0 is hottest" doesn't mean "product 0 is hottest".
  sample() {
    const r = Math.random();
    let lo = 0;
    let hi = this.n - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.cdf[mid] < r) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }
}
