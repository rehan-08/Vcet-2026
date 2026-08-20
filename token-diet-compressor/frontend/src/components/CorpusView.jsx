import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { fetchCorpus, resetCorpus, uploadCorpus } from "../api";

const ACCENTS = ["violet", "coral", "sage", "gold"];
const ACCEPTED = ".pdf,.txt,.md";

export default function CorpusView({ onSourceChange }) {
  const [docs, setDocs] = useState(null);
  const [source, setSource] = useState("demo");
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);

  const [pendingFile, setPendingFile] = useState(null);
  const [uploadState, setUploadState] = useState("idle"); // idle | uploading | error
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  function applyCorpus(data) {
    setDocs(data.documents);
    setSource(data.source);
    onSourceChange?.(data.source);
  }

  useEffect(() => {
    fetchCorpus().then(applyCorpus).catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpload() {
    if (!pendingFile) return;
    setUploadState("uploading");
    setUploadError(null);
    try {
      await uploadCorpus(pendingFile);
      const data = await fetchCorpus();
      applyCorpus(data);
      setUploadState("idle");
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setUploadState("error");
      setUploadError(err.message);
    }
  }

  async function handleReset() {
    setUploadState("uploading");
    setUploadError(null);
    try {
      const data = await resetCorpus();
      applyCorpus(data);
      setUploadState("idle");
    } catch (err) {
      setUploadState("error");
      setUploadError(err.message);
    }
  }

  const filtered = useMemo(() => {
    if (!docs) return [];
    const q = search.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter(
      (d) => d.title.toLowerCase().includes(q) || d.text.toLowerCase().includes(q)
    );
  }, [docs, search]);

  const openDoc = docs?.find((d) => d.id === openId);
  const isCustom = source !== "demo";

  return (
    <div className="corpus-view">
      <div className="card upload-card">
        <div className="mode-toggle-head">
          <span className="mode-toggle-emoji">📤</span>
          <span>Use your own dataset</span>
        </div>
        <p className="upload-hint">
          Upload a PDF or text file to replace the demo corpus — queries on the Compress tab
          will run against it instead.
        </p>
        <div className="upload-row">
          <label className="upload-file-label">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED}
              onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
              hidden
            />
            {pendingFile ? pendingFile.name : "Choose PDF or text file…"}
          </label>
          <motion.button
            type="button"
            className="upload-btn"
            whileTap={{ scale: 0.96 }}
            disabled={!pendingFile || uploadState === "uploading"}
            onClick={handleUpload}
          >
            {uploadState === "uploading" ? <span className="spinner" aria-hidden="true" /> : "Index it"}
          </motion.button>
        </div>
        {uploadState === "error" && <p className="upload-error">⚠️ {uploadError}</p>}
        <div className="upload-source-row">
          <span className={`source-badge${isCustom ? " source-badge--custom" : ""}`}>
            {isCustom ? `📄 Using: ${source}` : "🥗 Using: demo corpus"}
          </span>
          {isCustom && (
            <button type="button" className="reset-link" onClick={handleReset}>
              Reset to demo corpus
            </button>
          )}
        </div>
      </div>

      <div className="corpus-header">
        <div>
          <h2>{isCustom ? "Your dataset" : "The demo corpus"}</h2>
          <p className="corpus-sub">
            {docs ? `${docs.length} chunks` : "Loading…"}
            {!isCustom &&
              " — deliberately mixing real technical sentences with marketing fluff, so compression has something obvious to cut."}
          </p>
        </div>
        <input
          type="text"
          className="corpus-search"
          placeholder="Search titles or text…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <div className="card error-card">Error loading corpus: {error}</div>}

      <div className="corpus-grid">
        {filtered.map((doc, i) => {
          const accent = ACCENTS[i % ACCENTS.length];
          return (
            <motion.button
              key={doc.id}
              type="button"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: (i % 6) * 0.03 }}
              whileHover={{ y: -4 }}
              className={`corpus-card corpus-card--${accent}`}
              onClick={() => setOpenId(doc.id)}
            >
              <span className="corpus-card-id">{doc.id}</span>
              <h3>{doc.title}</h3>
              <p>{doc.text.slice(0, 110)}…</p>
            </motion.button>
          );
        })}
      </div>

      {openDoc && (
        <div className="corpus-modal-backdrop" onClick={() => setOpenId(null)}>
          <motion.div
            className="corpus-modal"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="corpus-modal-header">
              <span className="corpus-card-id">{openDoc.id}</span>
              <button type="button" className="corpus-modal-close" onClick={() => setOpenId(null)}>
                ✕
              </button>
            </div>
            <h3>{openDoc.title}</h3>
            <p>{openDoc.text}</p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
