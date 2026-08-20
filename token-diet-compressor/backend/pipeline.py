"""
Core RAG + compression pipeline: chunking, vector retrieval (Chroma),
sentence splitting, relevance scoring (cross-encoder or BM25), and
threshold-based sentence compression.
"""
import math
import re

import chromadb
from chromadb.utils import embedding_functions
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder

import tiktoken

from corpus import DOCS

TOKENIZER = tiktoken.get_encoding("cl100k_base")
CHUNK_MAX_TOKENS = 400

_SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9])")


def count_tokens(text: str) -> int:
    if not text:
        return 0
    return len(TOKENIZER.encode(text))


def split_sentences(text: str) -> list[str]:
    """Regex-based sentence splitter (avoids an nltk/punkt network dependency
    at request time while still doing real sentence-boundary detection)."""
    text = text.strip()
    if not text:
        return []
    parts = _SENTENCE_SPLIT_RE.split(text)
    return [p.strip() for p in parts if p.strip()]


def chunk_document(doc: dict) -> list[dict]:
    """Split a document into ~200-400 token chunks on sentence boundaries.
    Most seed docs are already within this range and become a single chunk."""
    sentences = split_sentences(doc["text"])
    chunks = []
    current: list[str] = []
    current_tokens = 0
    for sent in sentences:
        sent_tokens = count_tokens(sent)
        if current and current_tokens + sent_tokens > CHUNK_MAX_TOKENS:
            chunks.append(" ".join(current))
            current, current_tokens = [], 0
        current.append(sent)
        current_tokens += sent_tokens
    if current:
        chunks.append(" ".join(current))

    return [
        {
            "chunk_id": f"{doc['id']}-c{i}",
            "doc_id": doc["id"],
            "title": doc["title"],
            "text": chunk_text,
        }
        for i, chunk_text in enumerate(chunks)
    ]


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "upload"


class RagStore:
    _COLLECTION_NAME = "lean_context_corpus"

    def __init__(self):
        self._client = chromadb.EphemeralClient()
        self._embed_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        self._collection = self._client.get_or_create_collection(
            name=self._COLLECTION_NAME, embedding_function=self._embed_fn
        )
        self._cross_encoder: CrossEncoder | None = None
        self._loaded_docs: list[dict] = []
        self._active_source = "demo"

    def seed(self):
        self.reset_to_demo()

    def reset_to_demo(self):
        all_chunks = []
        for doc in DOCS:
            all_chunks.extend(chunk_document(doc))
        self._load_chunks(all_chunks, source_label="demo")

    def load_custom_text(self, source_name: str, raw_text: str) -> int:
        """Replace the active corpus with chunks parsed from an uploaded
        PDF/text file. Returns the number of chunks indexed."""
        pseudo_doc = {"id": _slugify(source_name), "title": source_name, "text": raw_text}
        raw_chunks = chunk_document(pseudo_doc)
        multi_part = len(raw_chunks) > 1
        chunks = [
            {
                **c,
                "title": f"{source_name} — part {i + 1}" if multi_part else source_name,
            }
            for i, c in enumerate(raw_chunks)
        ]
        self._load_chunks(chunks, source_label=source_name)
        return len(chunks)

    def _load_chunks(self, chunks: list[dict], source_label: str):
        self._client.delete_collection(self._COLLECTION_NAME)
        self._collection = self._client.get_or_create_collection(
            name=self._COLLECTION_NAME, embedding_function=self._embed_fn
        )
        if chunks:
            self._collection.add(
                ids=[c["chunk_id"] for c in chunks],
                documents=[c["text"] for c in chunks],
                metadatas=[
                    {"doc_id": c["doc_id"], "title": c["title"]} for c in chunks
                ],
            )
        self._loaded_docs = [
            {"id": c["chunk_id"], "title": c["title"], "text": c["text"]}
            for c in chunks
        ]
        self._active_source = source_label

    def corpus_summary(self) -> dict:
        return {"source": self._active_source, "documents": self._loaded_docs}

    def retrieve(self, query: str, k: int = 5) -> list[dict]:
        result = self._collection.query(query_texts=[query], n_results=k)
        chunks = []
        ids = result["ids"][0]
        docs = result["documents"][0]
        metas = result["metadatas"][0]
        dists = result["distances"][0]
        for chunk_id, text, meta, dist in zip(ids, docs, metas, dists):
            chunks.append(
                {
                    "chunk_id": chunk_id,
                    "doc_id": meta["doc_id"],
                    "title": meta["title"],
                    "text": text,
                    "similarity": 1 - dist,
                }
            )
        return chunks

    @property
    def cross_encoder(self) -> CrossEncoder:
        if self._cross_encoder is None:
            self._cross_encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
        return self._cross_encoder


def _sigmoid(x: float) -> float:
    return 1 / (1 + math.exp(-x))


def score_sentences_cross_encoder(
    store: RagStore, query: str, sentences: list[str]
) -> list[float]:
    if not sentences:
        return []
    pairs = [[query, s] for s in sentences]
    raw_scores = store.cross_encoder.predict(pairs)
    return [float(_sigmoid(s)) for s in raw_scores]


def score_sentences_bm25(query: str, sentences: list[str]) -> list[float]:
    if not sentences:
        return []
    tokenized_corpus = [s.lower().split() for s in sentences]
    bm25 = BM25Okapi(tokenized_corpus)
    query_tokens = query.lower().split()
    raw_scores = list(bm25.get_scores(query_tokens))
    max_score = max(raw_scores) if raw_scores else 0.0
    if max_score <= 0:
        return [0.0 for _ in raw_scores]
    return [s / max_score for s in raw_scores]


def score_sentences(
    store: RagStore, query: str, sentences: list[str], mode: str
) -> list[float]:
    if mode == "bm25":
        return score_sentences_bm25(query, sentences)
    return score_sentences_cross_encoder(store, query, sentences)


def compress_chunk(
    store: RagStore, query: str, chunk: dict, mode: str, threshold: float
) -> dict:
    sentences = split_sentences(chunk["text"])
    scores = score_sentences(store, query, sentences, mode)
    sentence_results = [
        {
            "text": sent,
            "score": round(float(score), 4),
            "kept": bool(score >= threshold),
        }
        for sent, score in zip(sentences, scores)
    ]
    kept_text = " ".join(s["text"] for s in sentence_results if s["kept"])
    return {
        "chunk_id": chunk["chunk_id"],
        "doc_id": chunk["doc_id"],
        "title": chunk["title"],
        "raw_text": chunk["text"],
        "compressed_text": kept_text,
        "sentences": sentence_results,
    }
