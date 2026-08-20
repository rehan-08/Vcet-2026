import io
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pypdf import PdfReader

load_dotenv()

from llm import generate_answer
from metrics import compute_token_metrics
from pipeline import RagStore, compress_chunk

MAX_UPLOAD_BYTES = 8 * 1024 * 1024

store = RagStore()


@asynccontextmanager
async def lifespan(app: FastAPI):
    store.seed()
    yield


app = FastAPI(title="Lean Context Dynamic Context Compressor", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    query: str
    mode: str = Field(default="cross-encoder", pattern="^(bm25|cross-encoder)$")
    threshold: float = Field(default=0.5, ge=0.0, le=1.0)
    k: int = Field(default=5, ge=1, le=10)


@app.get("/corpus")
def get_corpus():
    return store.corpus_summary()


@app.post("/corpus/upload")
async def upload_corpus(file: UploadFile = File(...)):
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File too large (max 8MB).")

    filename = file.filename or "uploaded file"
    if filename.lower().endswith(".pdf"):
        try:
            reader = PdfReader(io.BytesIO(content))
            text = "\n\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as exc:  # noqa: BLE001 - surface as a clean 400, not a 500
            raise HTTPException(status_code=400, detail=f"Could not read PDF: {exc}") from exc
    else:
        text = content.decode("utf-8", errors="ignore")

    text = text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Could not extract any text from that file.")

    num_chunks = store.load_custom_text(filename, text)
    return {"source": filename, "chunks": num_chunks}


@app.post("/corpus/reset")
def reset_corpus():
    store.reset_to_demo()
    return store.corpus_summary()


@app.post("/query")
def query(req: QueryRequest):
    retrieved_chunks = store.retrieve(req.query, k=req.k)

    compressed_chunks = [
        compress_chunk(store, req.query, chunk, req.mode, req.threshold)
        for chunk in retrieved_chunks
    ]

    raw_texts = [c["raw_text"] for c in compressed_chunks]
    compressed_texts = [c["compressed_text"] for c in compressed_chunks]
    token_metrics = compute_token_metrics(raw_texts, compressed_texts)

    raw_context = "\n\n".join(raw_texts)
    compressed_context = "\n\n".join(t for t in compressed_texts if t.strip())

    before_call = generate_answer(req.query, raw_context)
    after_call = generate_answer(req.query, compressed_context)

    return {
        "query": req.query,
        "mode": req.mode,
        "threshold": req.threshold,
        "retrieved_chunks": retrieved_chunks,
        "compressed_chunks": compressed_chunks,
        "metrics": {
            **token_metrics,
            "latency_before_ms": round(before_call["latency_ms"], 1),
            "latency_after_ms": round(after_call["latency_ms"], 1),
            "latency_drop_ms": round(
                before_call["latency_ms"] - after_call["latency_ms"], 1
            ),
        },
        "answer": after_call["answer"],
        "mocked": after_call["mocked"],
    }
