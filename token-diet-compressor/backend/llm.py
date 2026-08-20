"""
LLM answer generation via the Anthropic API, with a graceful mock fallback
when no ANTHROPIC_API_KEY is configured so the full pipeline still runs
end-to-end for demos.
"""
import os
import time

import anthropic

MODEL = "claude-sonnet-5"
MAX_TOKENS = 400

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic | None:
    global _client
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    if _client is None:
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


def _mock_answer(query: str, context: str) -> str:
    snippet = context.strip().split(". ")[0].strip()
    if snippet and not snippet.endswith("."):
        snippet += "."
    return (
        f"[Mock answer — no ANTHROPIC_API_KEY set] Based on the retrieved context, "
        f"here's a plausible answer to \"{query}\": {snippet} "
        f"(Set ANTHROPIC_API_KEY in the backend environment to get a real LLM-generated answer.)"
    )


def _mock_latency_seconds(context_tokens: int) -> float:
    # Approximates real prefill scaling (more context tokens -> more time-to-first-token)
    # so the before/after latency comparison stays meaningful even without a live API key.
    base_seconds = 0.15
    per_token_seconds = 0.0006
    return base_seconds + context_tokens * per_token_seconds


def generate_answer(query: str, context: str) -> dict:
    """Returns {"answer": str, "latency_ms": float, "mocked": bool}."""
    client = _get_client()

    if client is None:
        from pipeline import count_tokens

        start = time.perf_counter()
        time.sleep(_mock_latency_seconds(count_tokens(context)))
        answer = _mock_answer(query, context)
        latency_ms = (time.perf_counter() - start) * 1000
        return {"answer": answer, "latency_ms": latency_ms, "mocked": True}

    prompt = (
        f"Answer the question using only the context below. Be concise.\n\n"
        f"Context:\n{context}\n\nQuestion: {query}"
    )
    start = time.perf_counter()
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            messages=[{"role": "user", "content": prompt}],
        )
        latency_ms = (time.perf_counter() - start) * 1000
        answer = "".join(
            block.text for block in response.content if block.type == "text"
        )
        return {"answer": answer, "latency_ms": latency_ms, "mocked": False}
    except Exception as exc:  # noqa: BLE001 - demo app: fall back instead of 500ing
        latency_ms = (time.perf_counter() - start) * 1000
        answer = _mock_answer(query, context) + f" (LLM call failed: {exc})"
        return {"answer": answer, "latency_ms": latency_ms, "mocked": True}
