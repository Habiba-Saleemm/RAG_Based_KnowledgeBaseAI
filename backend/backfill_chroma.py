"""
backfill_chroma.py

One-time script: copies existing FAQ rows, DocumentChunk rows, and
ABOUT_KNOWLEDGE into Chroma. Safe to re-run (uses upsert).

Run from inside the same folder as main.py / models.py / chroma_client.py
(e.g. your "backend" folder):

    python backfill_chroma.py
"""

from database import SessionLocal
from models import FAQ, DocumentChunk, Document
from about_content import ABOUT_KNOWLEDGE
from embeddings import embed_text
from chroma_client import get_collection


def main():
    db = SessionLocal()
    collection = get_collection()

    ids, embeddings, documents, metadatas = [], [], [], []

    # --- FAQs ---
    faqs = db.query(FAQ).all()
    for faq in faqs:
        ids.append(f"faq_{faq.id}")
        embeddings.append(embed_text(faq.question))
        documents.append(faq.answer)
        metadatas.append({
            "source": "faq",
            "sql_id": faq.id,
            "question": faq.question,
        })
    print(f"Prepared {len(faqs)} FAQs")

    # --- Document chunks (with filename attached) ---
    documents_by_id = {d.id: d.filename for d in db.query(Document).all()}

    chunks = db.query(DocumentChunk).all()
    for chunk in chunks:
        text_to_embed = chunk.question or chunk.chunk_text
        ids.append(f"doc_{chunk.id}")
        embeddings.append(embed_text(text_to_embed))
        documents.append(chunk.chunk_text)
        metadatas.append({
            "source": "document",
            "sql_id": chunk.id,
            "question": chunk.question or "",
            "document_id": chunk.document_id,
            "filename": documents_by_id.get(chunk.document_id, "unknown"),
        })
    print(f"Prepared {len(chunks)} document chunks")

    # --- About knowledge (static list, no DB row) ---
    for i, item in enumerate(ABOUT_KNOWLEDGE):
        ids.append(f"about_{i}")
        text_to_embed = item.get("question") or item.get("answer", "")
        embeddings.append(embed_text(text_to_embed))
        documents.append(item.get("answer", ""))
        metadatas.append({
            "source": "about",
            "sql_id": i,
            "question": item.get("question", ""),
        })
    print(f"Prepared {len(ABOUT_KNOWLEDGE)} about-knowledge items")

    if ids:
        collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas,
        )
        print(f"Upserted {len(ids)} total items into Chroma.")
    else:
        print("Nothing to backfill.")

    db.close()


if __name__ == "__main__":
    main()