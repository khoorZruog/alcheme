"""Seed sample inventory data into Firestore.

Usage:
    python -m scripts.seed_inventory

Requires ADC authentication (no service account key needed).
"""

import json
from pathlib import Path

from google.cloud import firestore

PROJECT_ID = "alcheme-c36ef"
TEST_USER_ID = "test-user-001"
SAMPLE_PATH = Path(__file__).resolve().parents[2] / "shared" / "sample_inventory.json"


def seed_inventory() -> None:
    db = firestore.Client(project=PROJECT_ID)
    inventory_ref = db.collection("users").document(TEST_USER_ID).collection("inventory")

    with open(SAMPLE_PATH, encoding="utf-8") as f:
        items: list[dict] = json.load(f)

    print(f"Seeding {len(items)} items into users/{TEST_USER_ID}/inventory/ ...")

    for item in items:
        item_id = item.pop("id")
        # Convert ISO date strings to keep them as-is (Firestore stores as strings)
        inventory_ref.document(item_id).set(item)
        print(f"  [OK] {item_id}: {item.get('brand', '?')} {item.get('product_name', '?')}")

    print(f"\nDone! {len(items)} items seeded successfully.")


if __name__ == "__main__":
    seed_inventory()
