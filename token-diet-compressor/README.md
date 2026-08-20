# Lean Context — Dynamic Context Compressor

A full-stack RAG demo with a post-retrieval compression layer: retrieved chunks are
split into sentences, scored for relevance against the query, and filler/irrelevant
sentences are stripped out before the context is sent to an LLM — cutting token
count and time-to-first-token latency. A live dashboard visualizes the before/after
compression, the token/latency/cost savings, and the final LLM answer.

## Stack

- **Backend**: FastAPI, Chroma (in-process/ephemeral vector store), a
  `sentence-transformers` embedding model (`all-MiniLM-L6-v2`), a cross-encoder
  relevance scorer (`cross-encoder/ms-marco-MiniLM-L-6-v2`) with `rank_bm25` as a
  fast fallback mode, `tiktoken` for token counts, and the Anthropic API for answer
  generation (mocked automatically if no API key is set).
- **Frontend**: React + Vite.

## Run it

Two terminals, backend first.

**Backend** (from `backend/`):

```bash
python -m venv venv
venv\Scripts\activate      # on macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Optional: copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY` to get real LLM
answers instead of the mocked ones. First run downloads two small models
(embedding + cross-encoder, ~150MB total) from Hugging Face — needs internet once.

**Frontend** (from `frontend/`):

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). It talks to the backend
at `http://localhost:8000` by default — override with a `VITE_API_URL` env var if
you run the backend elsewhere.

## How it works

1. **Seed corpus**: 20 short blog-style docs about backend/cloud engineering topics
   (`backend/corpus.py`), each deliberately mixing factual sentences with marketing
   filler, chunked to ~200-400 tokens and embedded into Chroma on startup.
2. **Retrieve**: `POST /query` embeds the question and pulls the top-k (default 5)
   most similar chunks from Chroma.
3. **Split**: each chunk is split into sentences (regex-based sentence-boundary
   splitter — avoids an nltk/punkt network fetch at request time while still
   splitting on real sentence boundaries for this corpus's prose).
4. **Score**: every sentence is scored against the query, either with the
   cross-encoder (slower, reads query+sentence jointly, higher accuracy) or BM25
   (near-instant lexical scoring, fast fallback).
5. **Compress**: sentences scoring below the threshold (0-1, configurable per
   request and via the frontend slider) are dropped.
6. **Metrics**: `tiktoken`-based token counts before/after, compression ratio,
   measured LLM latency for a raw-context call vs a compressed-context call, and
   an estimated dollar cost saved (`tokens_saved × $3/1M`, Anthropic's published
   Claude Sonnet input-token rate).
7. **Answer**: the compressed context + query go to the LLM (or the mock) for the
   actual answer shown in the UI.

### Frontend behavior worth knowing

- The compression-aggressiveness **slider recomputes the before/after view and
  ratio locally**, using the per-sentence scores already returned by the last real
  query — no backend round-trip per drag tick. It only re-hits the backend when you
  submit a new question. Token counts shown while dragging are a fast client-side
  estimate; the authoritative `tiktoken` counts come back on the next real query.
- Switching the **BM25 / Cross-Encoder toggle** re-runs the last query
  automatically, since relevance scores aren't comparable across modes.
- **Tokens Saved (session)** accumulates across real queries only (not slider
  drags) and resets on page reload — there's no persistence layer, by design.

## Bring your own dataset

The **Dataset** tab has an upload panel: pick a PDF or plain-text (`.txt`/`.md`) file
(max 8MB) and hit "Index it" — it replaces the demo corpus with chunks parsed from
that file, embedded into the same Chroma collection. Every subsequent query on the
Compress tab runs against your uploaded content instead, with a banner reminding you
which dataset is active. "Reset to demo corpus" swaps the original 20 docs back in.
PDF text is extracted with `pypdf`, so scanned/image-only PDFs won't yield usable
text — it needs a real text layer.

## API

- `GET /corpus` — `{ source, documents }` for whatever corpus is currently active
  (demo or an uploaded file).
- `POST /corpus/upload` — multipart form with a `file` field (PDF or text, ≤8MB).
  Parses, chunks, and re-embeds it as the active corpus. Returns `{ source, chunks }`.
- `POST /corpus/reset` — reloads the original 20-doc demo corpus.
- `POST /query` — body: `{ query, mode: "bm25" | "cross-encoder", threshold: 0-1, k? }`.
  Returns retrieved chunks, compressed chunks (with per-sentence kept/dropped flags
  and scores), all metrics, and the LLM answer. Always runs against whichever corpus
  is currently active.

## Out of scope (by design)

No auth, no persistent storage beyond the in-memory Chroma instance, single vector
DB backend, sentence-level (not word-level) compression only.
