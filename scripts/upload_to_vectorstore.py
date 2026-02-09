#!/usr/bin/env python3
"""
Vector store feltöltő script.

1. Törli a meglévő fájlokat a vector store-ból
2. Feltölti az annotált fájlokat
3. Konfigurálható chunking stratégiával

Használat:
    python3 upload_to_vectorstore.py <input_dir> [--store-id=vs_xxx] [--delete-first]
"""

import os
import sys
import time
import json
from pathlib import Path
from openai import OpenAI

API_KEY = os.environ.get("OPENAI_API_KEY",
    "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"
)

DEFAULT_STORE_ID = "vs_698a0859caa081918c62fcf51a98bffa"

# Chunking konfig
MAX_CHUNK_SIZE_TOKENS = 2000
CHUNK_OVERLAP_TOKENS = 500

# Upload batch méret (OpenAI max 500 fájl/batch)
BATCH_SIZE = 500


def delete_all_files(client: OpenAI, store_id: str):
    """Törli az összes fájlt a vector store-ból."""
    print(f"Fájlok törlése a store-ból: {store_id}")

    deleted = 0
    has_more = True
    after = None

    while has_more:
        kwargs = {"vector_store_id": store_id, "limit": 100}
        if after:
            kwargs["after"] = after

        file_list = client.vector_stores.files.list(**kwargs)

        if not file_list.data:
            break

        for vs_file in file_list.data:
            try:
                client.vector_stores.files.delete(
                    vector_store_id=store_id,
                    file_id=vs_file.id
                )
                # Also delete the underlying file
                try:
                    client.files.delete(vs_file.id)
                except:
                    pass
                deleted += 1
                if deleted % 100 == 0:
                    print(f"  {deleted} fájl törölve...")
            except Exception as e:
                print(f"  Hiba törléskor ({vs_file.id}): {e}")

        has_more = file_list.has_more
        if file_list.data:
            after = file_list.data[-1].id

    print(f"  Összesen {deleted} fájl törölve.")
    return deleted


def upload_files(client: OpenAI, store_id: str, input_dir: Path):
    """Feltölti a fájlokat a vector store-ba batch-ekben."""
    files = sorted(input_dir.glob("*.txt"))
    print(f"\nFeltöltendő fájlok: {len(files)}")

    total_uploaded = 0
    total_batches = (len(files) + BATCH_SIZE - 1) // BATCH_SIZE

    for batch_idx in range(total_batches):
        start = batch_idx * BATCH_SIZE
        end = min(start + BATCH_SIZE, len(files))
        batch_files = files[start:end]

        print(f"\n--- Batch {batch_idx + 1}/{total_batches} ({len(batch_files)} fájl) ---")

        # Fájlok feltöltése az OpenAI Files API-ba
        file_ids = []
        for i, filepath in enumerate(batch_files):
            try:
                with open(filepath, "rb") as f:
                    uploaded = client.files.create(file=f, purpose="assistants")
                file_ids.append(uploaded.id)
                if (i + 1) % 50 == 0:
                    print(f"  {i + 1}/{len(batch_files)} fájl feltöltve...")
            except Exception as e:
                print(f"  HIBA feltöltéskor ({filepath.name}): {e}")

        if not file_ids:
            print("  Nincs feltöltött fájl ebben a batch-ben.")
            continue

        print(f"  {len(file_ids)} fájl feltöltve, batch indítása...")

        # Batch hozzáadás a vector store-hoz custom chunking-gel
        try:
            batch = client.vector_stores.file_batches.create(
                vector_store_id=store_id,
                file_ids=file_ids,
                chunking_strategy={
                    "type": "static",
                    "static": {
                        "max_chunk_size_tokens": MAX_CHUNK_SIZE_TOKENS,
                        "chunk_overlap_tokens": CHUNK_OVERLAP_TOKENS,
                    }
                }
            )
            print(f"  Batch ID: {batch.id}, status: {batch.status}")

            # Várunk a feldolgozásra
            while batch.status in ("in_progress", "queued"):
                time.sleep(5)
                batch = client.vector_stores.file_batches.retrieve(
                    vector_store_id=store_id,
                    file_batch_id=batch.id
                )
                counts = batch.file_counts
                print(f"  Feldolgozás: {counts.completed}/{counts.total} kész, "
                      f"{counts.in_progress} folyamatban, {counts.failed} hiba")

            print(f"  Batch kész: {batch.status}")
            total_uploaded += counts.completed

        except Exception as e:
            print(f"  HIBA batch létrehozáskor: {e}")

    print(f"\n=== Összesen feltöltve: {total_uploaded} fájl ===")
    return total_uploaded


def main():
    args = sys.argv[1:]
    store_id = DEFAULT_STORE_ID
    delete_first = False
    input_dir = None

    for a in args:
        if a.startswith("--store-id="):
            store_id = a.split("=", 1)[1]
        elif a == "--delete-first":
            delete_first = True
        elif not a.startswith("--"):
            input_dir = Path(a)

    if not input_dir or not input_dir.is_dir():
        print("Használat: python3 upload_to_vectorstore.py <input_dir> [--store-id=vs_xxx] [--delete-first]")
        sys.exit(1)

    client = OpenAI(api_key=API_KEY)

    # Store info
    store = client.vector_stores.retrieve(store_id)
    print(f"Vector store: {store.id}")
    print(f"  Név: {store.name}")
    print(f"  Jelenlegi fájlok: {store.file_counts.total}")
    print(f"  Chunking: max={MAX_CHUNK_SIZE_TOKENS} tokens, overlap={CHUNK_OVERLAP_TOKENS} tokens")

    if delete_first:
        delete_all_files(client, store_id)

    upload_files(client, store_id, input_dir)

    # Végső állapot
    store = client.vector_stores.retrieve(store_id)
    print(f"\nVégső állapot:")
    print(f"  Fájlok: {store.file_counts.completed} kész, {store.file_counts.failed} hiba")
    print(f"  Méret: {store.usage_bytes / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()
