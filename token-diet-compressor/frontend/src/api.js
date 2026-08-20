const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function fetchCorpus() {
  const res = await fetch(`${BASE_URL}/corpus`);
  if (!res.ok) throw new Error(`GET /corpus failed: ${res.status}`);
  return res.json();
}

export async function uploadCorpus(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/corpus/upload`, { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || `POST /corpus/upload failed: ${res.status}`);
  }
  return res.json();
}

export async function resetCorpus() {
  const res = await fetch(`${BASE_URL}/corpus/reset`, { method: "POST" });
  if (!res.ok) throw new Error(`POST /corpus/reset failed: ${res.status}`);
  return res.json();
}

export async function runQuery({ query, mode, threshold, k = 5 }) {
  const res = await fetch(`${BASE_URL}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, mode, threshold, k }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`POST /query failed: ${res.status} ${body}`);
  }
  return res.json();
}
