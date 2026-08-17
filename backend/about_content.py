"""
about_content.py
Static content mirrored from the /about page, so /api/ask can answer
questions about the product itself (mission, how it works, security)
using the same retrieval approach as FAQs.

This is NOT stored in the database and NOT editable through the admin UI —
it's just Python data. If you change the wording on the About page, update
it here too so the chatbot stays in sync with what's actually displayed.

Each entry is embedded once, when this module is first imported (server
startup), since this content never changes at runtime.
"""

from embeddings import embed_text

ABOUT_SECTIONS = [
    {
        "question": "What is your mission?",
        "answer": (
            "Knowledge Base AI helps you turn your documents into an interactive "
            "assistant. Upload files and ask questions to get instant, accurate "
            "answers grounded in your own content."
        ),
    },
    {
        "question": "How does this work?",
        "answer": (
            "We use Retrieval-Augmented Generation (RAG) to find the most relevant "
            "parts of your uploaded documents and combine them with AI to generate "
            "helpful, context-aware responses."
        ),
    },
    {
        "question": "How do you protect my security and privacy?",
        "answer": (
            "Your passwords are encrypted with bcrypt, and your session is protected "
            "with secure, HttpOnly cookies that JavaScript cannot access."
        ),
    },
]


def _build_about_knowledge() -> list[dict]:
    """
    Embeds just the QUESTION text for each section — same pattern as FAQs —
    so a short user question compares against another short question,
    not a full paragraph. This is what makes matching actually work.
    """
    items = []
    for section in ABOUT_SECTIONS:
        items.append(
            {
                "question": section["question"],
                "answer": section["answer"],
                "embedding": embed_text(section["question"]),
                "source": "about",
            }
        )
    return items


# Computed once at import time (server startup), not per-request.
ABOUT_KNOWLEDGE = _build_about_knowledge()