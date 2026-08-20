// Rough client-side token estimate (~1.3 tokens/word), used only to keep the
// before/after view and ratio live while the threshold slider is dragged,
// without round-tripping to the backend on every tick. The authoritative
// tiktoken-based counts come back from /query on each real submission.
export function estimateTokens(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const words = trimmed.split(/\s+/).length;
  return Math.ceil(words * 1.3);
}
