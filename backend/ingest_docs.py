"""
ingest_docs.py — Chunk and vectorize the 3 DOCX knowledge base documents into a FAISS index.
Run once: python ingest_docs.py
Produces: backend/vector_store/  (saved FAISS index)
"""
import os
import sys
from pathlib import Path

# Activate the venv if running directly
BASE_DIR = Path(__file__).parent
DOCS_DIR = BASE_DIR / "docs" / "category_a_rag_knowledge_base"
VECTOR_STORE_DIR = BASE_DIR / "vector_store"

# -----------------------------------------------------------------------
# Imports (must be inside venv)
# -----------------------------------------------------------------------
import docx2txt
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from dotenv import load_dotenv

load_dotenv(BASE_DIR / ".env")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyBtfybE6blmH9fpUrWhr4FrXeU-ok0fiTo")

# -----------------------------------------------------------------------
# 1. Load documents
# -----------------------------------------------------------------------
DOCS = [
    ("CHD_Municipal_Bylaws_and_Acts.docx",   "Municipal Bylaws"),
    ("CHD_PWD_PublicHealth_SOPs.docx",        "PWD & Public Health SOPs"),
    ("CHD_Govt_Schemes_RTI_Guidelines.docx",  "Govt Schemes & RTI Guidelines"),
]

def load_all_docs() -> list[Document]:
    all_docs = []
    for filename, label in DOCS:
        filepath = DOCS_DIR / filename
        if not filepath.exists():
            print(f"⚠️  Missing: {filepath}. Skipping.")
            continue
        print(f"  Loading {label}...")
        text = docx2txt.process(str(filepath))
        doc = Document(
            page_content=text,
            metadata={"source": label, "filename": filename}
        )
        all_docs.append(doc)
    return all_docs

# -----------------------------------------------------------------------
# 2. Chunk documents
# -----------------------------------------------------------------------
def chunk_docs(docs: list[Document]) -> list[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=700,
        chunk_overlap=120,
        separators=["\n\n", "\n", ".", " "]
    )
    chunks = splitter.split_documents(docs)
    print(f"  Split into {len(chunks)} chunks.")
    return chunks

# -----------------------------------------------------------------------
# 3. Embed and store
# -----------------------------------------------------------------------
def build_vector_store(chunks: list[Document]) -> None:
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/text-embedding-004",
        google_api_key=GEMINI_API_KEY
    )
    print(f"  Building FAISS index for {len(chunks)} chunks...")
    # FAISS.from_documents can be slow for many chunks, try batching if it hangs
    batch_size = 50
    vector_store = None
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        print(f"    Embedding batch {i//batch_size + 1}/{(len(chunks)-1)//batch_size + 1} ({len(batch)} chunks)...")
        if vector_store is None:
            vector_store = FAISS.from_documents(batch, embeddings)
        else:
            vector_store.add_documents(batch)
    
    VECTOR_STORE_DIR.mkdir(parents=True, exist_ok=True)
    vector_store.save_local(str(VECTOR_STORE_DIR))
    print(f"  ✅ Vector store saved to {VECTOR_STORE_DIR}/")

if __name__ == "__main__":
    print("🗂️  LOKSETU RAG Ingestion Pipeline Starting...")
    docs = load_all_docs()
    if not docs:
        print("❌ No documents loaded. Exiting.")
        sys.exit(1)
    chunks = chunk_docs(docs)
    build_vector_store(chunks)
    print("🎉 Ingestion complete! FAISS index is ready for tool queries.")
