"""
chroma_query.py

A scratchpad script for poking around your Chroma collection,
similar to running ad-hoc SELECT queries in MySQL Workbench.

Run with: python chroma_query.py
Edit the bottom section to try different things.
"""

from chroma_client import get_collection
from embeddings import embed_text

collection = get_collection()


def show_all(limit=20):
    """Like: SELECT * FROM knowledge_base LIMIT 20;"""
    results = collection.get(limit=limit)
    for i, id_ in enumerate(results["ids"]):
        print(f"\n--- {id_} ---")
        print("metadata:", results["metadatas"][i])
        print("document:", results["documents"][i][:150])


def show_by_source(source: str, limit=20):
    """Like: SELECT * FROM knowledge_base WHERE source = 'faq' LIMIT 20;"""
    results = collection.get(where={"source": source}, limit=limit)
    for i, id_ in enumerate(results["ids"]):
        print(f"\n--- {id_} ---")
        print("metadata:", results["metadatas"][i])
        print("document:", results["documents"][i][:150])


def show_by_id(chroma_id: str):
    """Like: SELECT * FROM knowledge_base WHERE id = 'faq_3';"""
    results = collection.get(ids=[chroma_id])
    if not results["ids"]:
        print(f"No item found with id {chroma_id}")
        return
    print("metadata:", results["metadatas"][0])
    print("document:", results["documents"][0])


def search(question: str, n=3, source_filter=None):
    """Like running your /api/ask matching logic manually, top N results."""
    where = {"source": source_filter} if source_filter else None
    vector = embed_text(question)
    results = collection.query(
        query_embeddings=[vector],
        n_results=n,
        where=where,
    )
    for i in range(len(results["ids"][0])):
        score = 1 - results["distances"][0][i]
        print(f"\n#{i+1}  score={score:.3f}")
        print("metadata:", results["metadatas"][0][i])
        print("document:", results["documents"][0][i][:200])


def count():
    """Like: SELECT COUNT(*) FROM knowledge_base;"""
    print("Total items in Chroma:", collection.count())


def show_chunks_by_filename(filename: str):
    """
    Show every chunk belonging to a specific uploaded file, in order.
    Like: SELECT * FROM document_chunks WHERE filename = '...' ORDER BY chunk_index;
    """
    results = collection.get(where={"filename": filename})

    if not results["ids"]:
        print(f"No chunks found for filename: {filename}")
        return

    print(f"\n{len(results['ids'])} chunk(s) found for '{filename}':")

    # Pair up id/metadata/document so we can sort by sql_id (roughly upload order)
    rows = list(zip(results["ids"], results["metadatas"], results["documents"]))
    rows.sort(key=lambda r: r[1].get("sql_id", 0))

    for chroma_id, meta, doc_text in rows:
        print(f"\n--- {chroma_id} ---")
        print("question:", meta.get("question") or "(none — raw text chunk)")
        print("chunk text:", doc_text[:300])


def list_uploaded_filenames():
    """
    Shows every distinct filename currently chunked in Chroma.
    Like: SELECT DISTINCT filename FROM document_chunks;
    """
    results = collection.get(where={"source": "document"})
    filenames = sorted({m.get("filename", "unknown") for m in results["metadatas"]})

    print(f"\n{len(filenames)} file(s) found in Chroma:")
    for name in filenames:
        chunk_count = sum(1 for m in results["metadatas"] if m.get("filename") == name)
        print(f"  - {name}  ({chunk_count} chunks)")


if __name__ == "__main__":
    # ---- Edit these lines to try different queries ----

    count()

    print("\n===== ALL ITEMS (first 20) =====")
    show_all(limit=20)

    print("\n===== ONLY FAQs =====")
    show_by_source("faq")

    print("\n===== SEARCH TEST =====")
    search("how do I reset my password", n=3)

    print("\n===== UPLOADED FILES =====")
    list_uploaded_filenames()

    # Uncomment and set an actual filename to see its chunks:
    # print("\n===== CHUNKS FOR A SPECIFIC FILE =====")
    # show_chunks_by_filename("example.pdf")