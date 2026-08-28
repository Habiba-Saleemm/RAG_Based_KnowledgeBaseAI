"""
check_files.py

Quick script to list every distinct filename currently stored in Chroma,
along with how many chunks each one has.

Run with:  python check_files.py
"""

from chroma_client import get_collection

if __name__ == "__main__":
    collection = get_collection()

    results = collection.get(where={"source": "document"})
    all_filenames = [m.get("filename", "unknown") for m in results["metadatas"]]

    if not all_filenames:
        print("No document chunks found in Chroma.")
    else:
        distinct_filenames = sorted(set(all_filenames))
        print(f"{len(distinct_filenames)} file(s) found in Chroma:\n")
        for name in distinct_filenames:
            chunk_count = all_filenames.count(name)
            print(f"  - {name}  ({chunk_count} chunks)")