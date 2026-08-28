"""
cleanup_orphans.py

One-off script to delete specific orphaned chunk ids from Chroma.
Run with:  python cleanup_orphans.py

Make sure uvicorn is NOT running while you run this.
"""

from chroma_client import get_collection

ORPHANED_SQL_IDS = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    17, 18, 19, 20, 21, 22, 23, 25, 26, 27, 28, 29, 30, 31, 32,
    93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105,
    106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116,
    117, 118, 119, 120, 121, 122,
]

if __name__ == "__main__":
    collection = get_collection()

    print("Total items BEFORE delete:", collection.count())

    ids_to_delete = [f"doc_{sql_id}" for sql_id in ORPHANED_SQL_IDS]
    collection.delete(ids=ids_to_delete)

    print(f"Requested deletion of {len(ids_to_delete)} ids.")
    print("Total items AFTER delete:", collection.count())