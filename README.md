# Pixels to Possibilities — VCET Hack-A-Thon 2026 Submission

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Made with Python](https://img.shields.io/badge/backend-Python%20%2F%20FastAPI-3776AB)](#)
[![Made with Node](https://img.shields.io/badge/backend-Node.js%20%2F%20Express-339933)](#)
[![Made with React](https://img.shields.io/badge/frontend-React-61DAFB)](#)

Two independent full-stack projects built for VCET Hack-A-Thon 2026, submitted from a single repository for ease of review. Each project has its own README, architecture diagram, setup instructions, and live dashboard demo.

| # | Project | Domain | One-liner |
|---|---------|--------|-----------|
| PS04 | [**Token-Diet Dynamic Context Compressor**](./token-diet-context-compressor) | Application Data Search — Smart Context Compression | Strips irrelevant sentences out of RAG context before it reaches the LLM, cutting tokens and latency. |
| PS01 | [**Predictive Cloud-Cost Caching Engine**](./predictive-cache-engine) | Application Scaling — Smart Cache Eviction & Cost Savings | Replaces flat cache TTLs with a per-item adaptive TTL driven by real access patterns. |

---

## Repository Structure

```
.
├── token-diet-context-compressor/   # PS04 — RAG context compression middleware
│   ├── backend/
│   ├── frontend/
│   ├── docs/architecture/
│   └── README.md
├── predictive-cache-engine/         # PS01 — Adaptive cache TTL policy engine
│   ├── backend/
│   ├── frontend/
│   ├── docs/architecture/
│   └── README.md
├── docs/
│   └── abstracts/                   # Submitted abstract PDFs for both problem statements
├── .github/                         # Issue/PR templates + CI workflow
├── LICENSE
└── README.md                        # you are here
```

## Quick Start

Each project is self-contained with its own dependencies and setup steps — see:
- [`token-diet-context-compressor/README.md`](./token-diet-context-compressor/README.md)
- [`predictive-cache-engine/README.md`](./predictive-cache-engine/README.md)

## Team

| Name | Role | GitHub |
|------|------|--------|
| [Your Name] | [Role] | [@handle](https://github.com/) |
| [Your Name] | [Role] | [@handle](https://github.com/) |
| [Your Name] | [Role] | [@handle](https://github.com/) |

## License

This project is licensed under the [MIT License](./LICENSE).
