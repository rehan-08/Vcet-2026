import { motion } from "framer-motion";

export default function ModeToggle({ mode, onChange }) {
  const isCrossEncoder = mode === "cross-encoder";

  return (
    <div className="mode-toggle card">
      <div className="mode-toggle-head">
        <span className="mode-toggle-emoji">⚖️</span>
        <span>Relevance scorer</span>
      </div>
      <div className="mode-toggle-track">
        <button
          type="button"
          className={`mode-toggle-btn${!isCrossEncoder ? " active" : ""}`}
          onClick={() => onChange("bm25")}
        >
          {!isCrossEncoder && (
            <motion.span className="mode-toggle-pill" layoutId="mode-pill" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
          )}
          <span className="mode-toggle-btn-label">BM25</span>
        </button>
        <button
          type="button"
          className={`mode-toggle-btn${isCrossEncoder ? " active" : ""}`}
          onClick={() => onChange("cross-encoder")}
        >
          {isCrossEncoder && (
            <motion.span className="mode-toggle-pill" layoutId="mode-pill" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
          )}
          <span className="mode-toggle-btn-label">Cross-Encoder</span>
        </button>
      </div>
      <p className="mode-toggle-note">
        {isCrossEncoder
          ? "Slower — reads the query and each sentence together for higher-accuracy relevance scoring."
          : "Near-instant lexical scoring — a fast fallback when latency matters more than precision."}
      </p>
    </div>
  );
}
