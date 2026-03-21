"""
test_rag.py — Quick smoke test for the FAISS RAG vector store
Run: source venv/bin/activate && python test_rag.py
"""
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).parent
load_dotenv(BASE_DIR / ".env")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyBtfybE6blmH9fpUrWhr4FrXeU-ok0fiTo")
VECTOR_STORE_PATH = str(BASE_DIR / "vector_store")

if not (BASE_DIR / "vector_store").exists():
    print("❌ Vector store not found. Run: python ingest_docs.py first.")
    exit(1)

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS

print("Loading FAISS index...")
embeddings = GoogleGenerativeAIEmbeddings(
    model="models/text-embedding-004",
    google_api_key=GEMINI_API_KEY
)
vs = FAISS.load_local(VECTOR_STORE_PATH, embeddings, allow_dangerous_deserialization=True)
print("✅ Vector store loaded.\n")

TESTS = [
    ("bylaws", "pothole road repair municipal responsibility"),
    ("sops",   "SLA timeline for water supply complaint"),
    ("schemes","RTI application rights citizen"),
]

for label, query in TESTS:
    print(f"--- [{label.upper()}] Query: '{query}' ---")
    results = vs.similarity_search(query, k=2)
    for i, r in enumerate(results, 1):
        src = r.metadata.get("source", "?")
        print(f"  [{i}] [{src}] {r.page_content[:300].replace(chr(10), ' ').strip()}...")
    print()

print("🎉 RAG test complete. All 3 document sources searched successfully.")
