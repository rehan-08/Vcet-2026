"""
Token, latency, and cost metrics for a single compression run.
"""
from pipeline import count_tokens

# Published input-token rate for Claude Sonnet (Anthropic API pricing,
# https://www.anthropic.com/pricing — "Claude Sonnet", input tokens).
# Used only to turn "tokens saved" into an illustrative dollar figure.
COST_PER_INPUT_TOKEN_USD = 3.00 / 1_000_000


def compute_token_metrics(raw_texts: list[str], compressed_texts: list[str]) -> dict:
    tokens_before = sum(count_tokens(t) for t in raw_texts)
    tokens_after = sum(count_tokens(t) for t in compressed_texts)
    tokens_saved = max(tokens_before - tokens_after, 0)
    compression_ratio = (tokens_saved / tokens_before) if tokens_before else 0.0
    estimated_cost_saved = tokens_saved * COST_PER_INPUT_TOKEN_USD

    return {
        "tokens_before": tokens_before,
        "tokens_after": tokens_after,
        "tokens_saved": tokens_saved,
        "compression_ratio": round(compression_ratio, 4),
        "estimated_cost_saved_usd": round(estimated_cost_saved, 6),
    }
