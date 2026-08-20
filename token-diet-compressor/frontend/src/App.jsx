import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { runQuery } from "./api";
import { estimateTokens } from "./tokenEstimate";
import GaugeRing from "./components/GaugeRing";
import StatCard from "./components/StatCard";
import CountUp from "./components/CountUp";
import ModeToggle from "./components/ModeToggle";
import ThresholdSlider from "./components/ThresholdSlider";
import QueryBar from "./components/QueryBar";
import CompareView from "./components/CompareView";
import AnswerCard from "./components/AnswerCard";
import CorpusView from "./components/CorpusView";
import "./App.css";

const TABS = [
  { id: "compress", label: "Compress", emoji: "🗜️" },
  { id: "dataset", label: "Dataset", emoji: "📚" },
];

export default function App() {
  const [tab, setTab] = useState("compress");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("cross-encoder");
  const [threshold, setThreshold] = useState(0.5);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cumulativeTokensSaved, setCumulativeTokensSaved] = useState(0);
  const [queryCount, setQueryCount] = useState(0);
  const [corpusSource, setCorpusSource] = useState("demo");

  async function handleSubmit(overrides = {}) {
    const effectiveQuery = overrides.query ?? query;
    const effectiveMode = overrides.mode ?? mode;
    if (!effectiveQuery.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await runQuery({ query: effectiveQuery, mode: effectiveMode, threshold });
      setResult(data);
      setCumulativeTokensSaved((prev) => prev + data.metrics.tokens_saved);
      setQueryCount((prev) => prev + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleModeChange(newMode) {
    setMode(newMode);
    if (result) handleSubmit({ mode: newMode });
  }

  const liveChunks = useMemo(() => {
    if (!result) return [];
    return result.compressed_chunks.map((chunk) => ({
      ...chunk,
      sentences: chunk.sentences.map((s) => ({ ...s, kept: s.score >= threshold })),
    }));
  }, [result, threshold]);

  const liveMetrics = useMemo(() => {
    if (!result) return null;
    const tokensBefore = liveChunks.reduce((sum, c) => sum + estimateTokens(c.raw_text), 0);
    const tokensAfter = liveChunks.reduce(
      (sum, c) =>
        sum +
        estimateTokens(
          c.sentences
            .filter((s) => s.kept)
            .map((s) => s.text)
            .join(" ")
        ),
      0
    );
    const tokensSaved = Math.max(tokensBefore - tokensAfter, 0);
    const ratio = tokensBefore ? tokensSaved / tokensBefore : 0;
    return { tokensBefore, tokensAfter, tokensSaved, ratio };
  }, [liveChunks]);

  const usingLiveThreshold = result && threshold !== result.threshold;

  function handleHeaderMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    e.currentTarget.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  }

  return (
    <>
      <div className="aurora"><span /></div>
      <div className="grain" />
      <div className="app">
        <header className="app-header" onMouseMove={handleHeaderMove}>
          <div className="app-header-badge">🥗 lean context</div>
          <h1>Feed your LLM less. Say more.</h1>
          <p>Dynamic Context Compressor — strip filler from retrieved chunks before they hit the LLM.</p>
        </header>

      <nav className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab-btn${tab === t.id ? " active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {tab === t.id && (
              <motion.span
                className="tab-btn-pill"
                layoutId="tab-pill"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="tab-btn-label">
              {t.emoji} {t.label}
            </span>
          </button>
        ))}
      </nav>

      {tab === "compress" ? (
          <motion.div
            key="compress"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="tab-panel"
          >
            {corpusSource !== "demo" && (
              <div className="corpus-active-banner">
                📄 Querying your uploaded dataset: <strong>{corpusSource}</strong> — switch to the
                Dataset tab to reset to the demo corpus.
              </div>
            )}

            <section className="controls-row">
              <QueryBar
                query={query}
                onQueryChange={setQuery}
                onSubmit={handleSubmit}
                loading={loading}
              />
              <div className="controls-side">
                <ModeToggle mode={mode} onChange={handleModeChange} />
                <ThresholdSlider threshold={threshold} onChange={setThreshold} />
              </div>
            </section>

            {error && <div className="card error-card">⚠️ Error: {error}</div>}

            <section className="stats-row">
              <StatCard
                icon="🗜️"
                label="Context Compression Ratio"
                value={
                  liveMetrics ? <CountUp value={liveMetrics.ratio * 100} decimals={0} suffix="% saved" /> : "—"
                }
                sublabel={usingLiveThreshold ? "live preview at current slider" : "last query"}
                accent="violet"
              >
                <GaugeRing value={liveMetrics ? liveMetrics.ratio * 100 : 0} color="var(--violet)" />
              </StatCard>

              <StatCard
                icon="⚡"
                label="Latency Drop"
                value={
                  result ? (
                    <CountUp value={Math.max(result.metrics.latency_drop_ms, 0)} decimals={0} suffix=" ms" />
                  ) : (
                    "—"
                  )
                }
                sublabel={
                  result
                    ? `${result.metrics.latency_before_ms.toFixed(0)} ms → ${result.metrics.latency_after_ms.toFixed(0)} ms`
                    : "before → after LLM call"
                }
                accent="coral"
              />

              <StatCard
                icon="🌱"
                label="Tokens Saved (session)"
                value={<CountUp value={cumulativeTokensSaved} decimals={0} />}
                sublabel={`across ${queryCount} ${queryCount === 1 ? "query" : "queries"}`}
                accent="sage"
              />

              <StatCard
                icon="💸"
                label="Est. Cost Saved"
                value={result ? `$${result.metrics.estimated_cost_saved_usd.toFixed(6)}` : "—"}
                sublabel="this query, input tokens @ $3/MTok"
                accent="gold"
              />
            </section>

            <CompareView chunks={liveChunks} />

            <AnswerCard answer={result?.answer} mocked={result?.mocked} />
          </motion.div>
        ) : (
          <motion.div
            key="dataset"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="tab-panel"
          >
            <CorpusView onSourceChange={setCorpusSource} />
          </motion.div>
        )}

        <footer className="app-footer">
          Mode: {mode === "cross-encoder" ? "Cross-Encoder (ms-marco-MiniLM-L-6-v2)" : "BM25"} · Threshold: {(threshold * 100).toFixed(0)}%
        </footer>
      </div>
    </>
  );
}
