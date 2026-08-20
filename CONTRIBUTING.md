# Contributing

This repo hosts two independent hackathon projects. Please keep changes scoped to one project per pull request where possible.

## Workflow
1. Create a branch off `main`: `git checkout -b feature/short-description`
2. Make your changes inside the relevant project folder (`token-diet-context-compressor/` or `predictive-cache-engine/`).
3. Update that project's `README.md` if setup steps or environment variables changed.
4. Open a pull request using the provided template.

## Commit messages
Use short, imperative commit messages, e.g. `Add BM25 fallback scorer`, `Fix TTL formula rounding`.

## Code style
- Python: `flake8` (see CI workflow)
- JavaScript/React: keep components small and colocate styles where possible
