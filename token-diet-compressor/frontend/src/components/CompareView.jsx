import { motion } from "framer-motion";

function ScoreBar({ score, kept }) {
  return (
    <span className={`score-bar${kept ? " score-bar--kept" : ""}`}>
      <span className="score-bar-fill" style={{ width: `${Math.round(score * 100)}%` }} />
    </span>
  );
}

function RawSide({ sentences }) {
  return (
    <div className="chunk-text">
      {sentences.map((s, i) => (
        <span key={i} className={`sent-wrap${s.kept ? "" : " sent-wrap--dropped"}`}>
          <span className={s.kept ? "sent-kept" : "sent-dropped"}>{s.text} </span>
          <ScoreBar score={s.score} kept={s.kept} />
        </span>
      ))}
    </div>
  );
}

function CompressedSide({ sentences }) {
  const kept = sentences.filter((s) => s.kept);
  if (kept.length === 0) {
    return <p className="chunk-text chunk-empty">🫙 All sentences dropped at this threshold.</p>;
  }
  return (
    <div className="chunk-text">
      {kept.map((s, i) => (
        <motion.span
          key={i}
          className="sent-highlight"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.04 }}
        >
          {s.text}{" "}
        </motion.span>
      ))}
    </div>
  );
}

export default function CompareView({ chunks }) {
  if (!chunks || chunks.length === 0) {
    return (
      <div className="card compare-empty">
        🔍 Ask a question above to see retrieved chunks and their compression, side by side.
      </div>
    );
  }

  return (
    <div className="compare-view">
      <div className="compare-columns-header">
        <h3>📄 Retrieved (before)</h3>
        <h3>✨ Compressed (after)</h3>
      </div>
      {chunks.map((chunk, idx) => (
        <motion.div
          className="card chunk-pair"
          key={chunk.chunk_id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: idx * 0.05 }}
        >
          <div className="chunk-pair-title">{chunk.title}</div>
          <div className="chunk-pair-columns">
            <RawSide sentences={chunk.sentences} />
            <CompressedSide sentences={chunk.sentences} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
