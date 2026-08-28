"""
chroma_client.py

Single shared Chroma client + collection getter.
Uses a local persistent store (no external server needed).

IMPORTANT: the storage path is anchored to this file's own location
(not the current working directory) so that running scripts from
different folders (e.g. `uvicorn` vs an interactive shell) always
point at the SAME Chroma database on disk.
"""

import os
import chromadb

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_CHROMA_PATH = os.path.join(_THIS_DIR, "chroma_data")

_client = chromadb.PersistentClient(path=_CHROMA_PATH)

_collection = _client.get_or_create_collection(
    name="knowledge_base",
    metadata={"hnsw:space": "cosine"},  # distance = 1 - cosine_similarity
)


def get_collection():
    return _collection