"""
embeddings.py
Loads a small, free Hugging Face sentence-embedding model once at import time.

No API key needed — the model runs locally. The first run downloads it
(~80MB) from Hugging Face; after that it's cached on disk and works offline.

FAQ embeddings are precomputed once (on create/update) and stored as JSON
text in the database, so /api/ask only has to embed the incoming question —
not re-embed every FAQ on every request.
"""

import json

from sentence_transformers import SentenceTransformer
import numpy as np

_model = SentenceTransformer("all-MiniLM-L6-v2")

SIMILARITY_THRESHOLD = 0.7


def embed_text(text: str) -> list[float]:
    vector = _model.encode([text], normalize_embeddings=True)[0]
    return vector.tolist()


def serialize_embedding(vector: list[float]) -> str:
    return json.dumps(vector)


def deserialize_embedding(raw: str) -> np.ndarray:
    return np.array(json.loads(raw), dtype=np.float32)


def find_best_faq_match(question: str, faqs: list[dict]) -> dict | None:
    usable_faqs = [f for f in faqs if f.get("embedding")]
    if not usable_faqs:
        return None

    question_vector = np.array(embed_text(question), dtype=np.float32)

    best_faq = None
    best_score = -1.0

    for faq in usable_faqs:
        faq_vector = deserialize_embedding(faq["embedding"])
        score = float(np.dot(faq_vector, question_vector))
        if score > best_score:
            best_score = score
            best_faq = faq

    if best_faq is None or best_score < SIMILARITY_THRESHOLD:
        return None

    match = dict(best_faq)
    match["score"] = best_score
    return match

GREETING_WORDS = {
    "hi", "hey", "hello", "yo", "hola",
    "thanks", "thank you", "thankyou", "ty",
    "bye", "goodbye", "see you",
}

GREETING_RESPONSE = "Hi there! Ask me anything from our About and FAQs sections and I'll do my best to help."


def is_greeting(question: str) -> bool:
    normalized = question.strip().lower().rstrip("!?. ")
    return normalized in GREETING_WORDS


# ABOUT SECTION EMBEDDINGS
def _to_vector(embedding) -> np.ndarray:
    """Accepts either a JSON string (from DB) or a plain list (in-memory) and
    normalizes both into a numpy array."""
    if isinstance(embedding, str):
        return deserialize_embedding(embedding)
    return np.array(embedding, dtype=np.float32)


def find_best_match(question: str, items: list[dict]) -> dict | None:
    """
    Generalized version of find_best_faq_match — works across ANY mix of
    sources (FAQs from the DB, About sections from memory, etc.) as long as
    each item has "answer" and "embedding" keys.
    """
    usable = [i for i in items if i.get("embedding")]
    if not usable:
        return None

    question_vector = np.array(embed_text(question), dtype=np.float32)

    best_item = None
    best_score = -1.0

    for item in usable:
        item_vector = _to_vector(item["embedding"])
        score = float(np.dot(item_vector, question_vector))
        if score > best_score:
            best_score = score
            best_item = item

    if best_item is None or best_score < SIMILARITY_THRESHOLD:
        return None

    match = dict(best_item)
    match["score"] = best_score
    return match