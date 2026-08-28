"""
embeddings.py

Loads a small, free Hugging Face sentence-embedding model once at import time.

The model runs locally. No API key is required.

FAQ and document embeddings are stored in the database so /api/ask
only needs to embed the incoming question.
"""

import json

import numpy as np
from sentence_transformers import SentenceTransformer
from chroma_client import get_collection


# ---------------------------------------------------------
# MODEL
# ---------------------------------------------------------

_model = SentenceTransformer("all-MiniLM-L6-v2")


# ---------------------------------------------------------
# SIMILARITY THRESHOLD
# ---------------------------------------------------------

SIMILARITY_THRESHOLD = 0.5


# ---------------------------------------------------------
# CREATE EMBEDDING
# ---------------------------------------------------------

def embed_text(text: str) -> list[float]:
    vector = _model.encode(
        [text],
        normalize_embeddings=True
    )[0]

    return vector.tolist()


# ---------------------------------------------------------
# SERIALIZE / DESERIALIZE
# ---------------------------------------------------------

def serialize_embedding(vector: list[float]) -> str:
    return json.dumps(vector)


def deserialize_embedding(raw: str) -> np.ndarray:
    return np.array(
        json.loads(raw),
        dtype=np.float32
    )


# ---------------------------------------------------------
# COSINE SIMILARITY
# ---------------------------------------------------------

def cosine_similarity(
    vector1: np.ndarray,
    vector2: np.ndarray
) -> float:

    norm1 = np.linalg.norm(vector1)
    norm2 = np.linalg.norm(vector2)

    if norm1 == 0 or norm2 == 0:
        return 0.0

    return float(
        np.dot(vector1, vector2) /
        (norm1 * norm2)
    )


# ---------------------------------------------------------
# OLD FAQ MATCH FUNCTION
# ---------------------------------------------------------

def find_best_faq_match(
    question: str,
    faqs: list[dict]
) -> dict | None:

    usable_faqs = [
        f for f in faqs
        if f.get("embedding")
    ]

    if not usable_faqs:
        return None

    question_vector = np.array(
        embed_text(question),
        dtype=np.float32
    )

    best_faq = None
    best_score = -1.0

    for faq in usable_faqs:

        faq_vector = deserialize_embedding(
            faq["embedding"]
        )

        score = cosine_similarity(
            faq_vector,
            question_vector
        )

        if score > best_score:
            best_score = score
            best_faq = faq

    if (
        best_faq is None
        or best_score < SIMILARITY_THRESHOLD
    ):
        return None

    match = dict(best_faq)
    match["score"] = best_score

    return match


# ---------------------------------------------------------
# GREETINGS
# ---------------------------------------------------------

GREETING_WORDS = {
    "hi",
    "hey",
    "hello",
    "yo",
    "hola",
    "thanks",
    "thank you",
    "thankyou",
    "ty",
    "bye",
    "goodbye",
    "see you",
}

GREETING_RESPONSE = (
    "Hi there! Ask me anything from our About and FAQs "
    "sections and I'll do my best to help."
)


def is_greeting(question: str) -> bool:

    normalized = (
        question
        .strip()
        .lower()
        .rstrip("!?. ")
    )

    return normalized in GREETING_WORDS


# ---------------------------------------------------------
# CONVERT EMBEDDING TO NUMPY VECTOR
# ---------------------------------------------------------

def _to_vector(embedding) -> np.ndarray:

    """
    Accepts either:

    1. JSON string from database
    2. Python list from in-memory data

    and converts both to numpy arrays.
    """

    if isinstance(embedding, str):

        return deserialize_embedding(embedding)

    return np.array(
        embedding,
        dtype=np.float32
    )


# ---------------------------------------------------------
# CHROMA-BACKED MATCH FUNCTION
# ---------------------------------------------------------

def find_best_match(
    question: str,
    source_filter: dict | None = None,
) -> dict | None:
    """
    Finds the most semantically similar item using Chroma.

    source_filter example: {"source": "faq"} to search only FAQs.
    Pass None to search everything (faq + document + about).
    """

    collection = get_collection()

    question_vector = embed_text(question)

    results = collection.query(
        query_embeddings=[question_vector],
        n_results=1,
        where=source_filter,
    )

    ids = results.get("ids", [[]])[0]
    if not ids:
        return None

    distance = results["distances"][0][0]
    score = 1 - distance  # cosine distance -> cosine similarity

    if score < SIMILARITY_THRESHOLD:
        return None

    metadata = results["metadatas"][0][0]
    document_text = results["documents"][0][0]

    return {
        "id": metadata.get("sql_id"),
        "source": metadata.get("source"),
        "question": metadata.get("question"),
        "answer": document_text,
        "score": score,
    }


def find_best_faq_match(question: str) -> dict | None:
    return find_best_match(question, source_filter={"source": "faq"})