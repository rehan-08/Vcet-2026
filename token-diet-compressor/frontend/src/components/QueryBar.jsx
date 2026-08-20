import { motion } from "framer-motion";

const SAMPLE_QUERIES = [
  "How does rate limiting protect an API?",
  "What is the difference between cache-aside and write-through caching?",
  "How do containers differ from virtual machines?",
  "What is retrieval-augmented generation?",
];

export default function QueryBar({ query, onQueryChange, onSubmit, loading }) {
  return (
    <form
      className="query-bar card"
      onSubmit={(e) => {
        e.preventDefault();
        if (query.trim() && !loading) onSubmit();
      }}
    >
      <div className="mode-toggle-head">
        <span className="mode-toggle-emoji">💬</span>
        <span>Ask the corpus</span>
      </div>
      <div className="query-bar-row">
        <input
          type="text"
          value={query}
          placeholder="Ask a question about the demo corpus…"
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <motion.button
          type="submit"
          disabled={loading || !query.trim()}
          whileTap={{ scale: 0.96 }}
        >
          {loading ? (
            <span className="spinner" aria-hidden="true" />
          ) : (
            "Compress ✨"
          )}
        </motion.button>
      </div>
      <div className="query-bar-samples">
        {SAMPLE_QUERIES.map((q) => (
          <motion.button
            type="button"
            key={q}
            className="sample-chip"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onQueryChange(q)}
          >
            {q}
          </motion.button>
        ))}
      </div>
    </form>
  );
}
