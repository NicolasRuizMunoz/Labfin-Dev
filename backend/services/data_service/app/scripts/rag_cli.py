# app/scripts/rag_cli.py
import argparse
import logging
from sqlalchemy.orm import Session
from app.database.db import SessionLocal
from app.services.index_service import _EMBEDDER
from app.services.vector_store_faiss import FaissStore

logging.basicConfig(level=logging.INFO)

def main():
    parser = argparse.ArgumentParser(description="RAG quick search (FAISS)")
    parser.add_argument("--org", type=int, required=True, help="organization_id")
    parser.add_argument("--q", type=str, required=True, help="query")
    parser.add_argument("--k", type=int, default=5, help="top_k")
    args = parser.parse_args()

    store = FaissStore(org_id=args.org, dim=_EMBEDDER.dim)
    qvec = _EMBEDDER.embed_query(args.q)
    results = store.search(qvec, top_k=args.k)

    print(f"\n== Query: {args.q}")
    for rank, (score, meta) in enumerate(results, 1):
        preview = (meta.get("content_preview") or "")[:200].replace("\n", " ")
        print(f"[{rank}] score={score:.4f} file_id={meta.get('file_id')}  chunk={meta.get('chunk_index')}")
        print(f"     {preview}\n")

if __name__ == "__main__":
    main()
