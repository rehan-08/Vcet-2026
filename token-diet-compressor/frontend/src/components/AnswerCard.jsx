import { useState } from "react";
import { motion } from "framer-motion";

export default function AnswerCard({ answer, mocked }) {
  const [copied, setCopied] = useState(false);
  if (!answer) return null;

  function handleCopy() {
    navigator.clipboard.writeText(answer).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  }

  return (
    <motion.div
      className="card answer-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="answer-card-header">
        <span className="mode-toggle-emoji">🤖</span>
        <h3>LLM Answer</h3>
        {mocked && <span className="badge badge-mock">mocked · no API key</span>}
        <button type="button" className="copy-btn" onClick={handleCopy}>
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <p>{answer}</p>
    </motion.div>
  );
}
