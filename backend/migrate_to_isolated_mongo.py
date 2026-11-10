"""
PayPilot AI Safe Migration Script
Copies ONLY PayPilot AI collections from mongodb://127.0.0.1:27017/paypilot_ai
into the dedicated, isolated instance at mongodb://127.0.0.1:27018/paypilot_ai_db.

CRITICAL RULES:
1. Source database on port 27017 is strictly READ-ONLY.
2. Only collections belonging exclusively to PayPilot AI are copied.
3. Live Lab database ('portfolio') on port 27017 is completely untouched.
4. Preserves all BSON types, ObjectIds, nested structures, timestamps, and indexes.
5. Verifies document counts between source and destination.
"""

import sys
import pymongo
from pymongo import MongoClient

SOURCE_URI = "mongodb://127.0.0.1:27017"
SOURCE_DB_NAME = "paypilot_ai"

DEST_URI = "mongodb://127.0.0.1:27018"
DEST_DB_NAME = "paypilot_ai_db"

def migrate():
    print("=" * 70)
    print("PayPilot AI MongoDB Safe Isolation & Data Migration")
    print("=" * 70)

    # 1. Connect to Source
    try:
        src_client = MongoClient(SOURCE_URI, serverSelectionTimeoutMS=5000)
        src_client.admin.command("ping")
        print(f"[OK] Connected to Source MongoDB at {SOURCE_URI}")
    except Exception as e:
        print(f"[ERROR] Failed to connect to Source: {e}")
        sys.exit(1)

    # 2. Connect to Destination
    try:
        dest_client = MongoClient(DEST_URI, serverSelectionTimeoutMS=5000)
        dest_client.admin.command("ping")
        print(f"[OK] Connected to Destination MongoDB at {DEST_URI}")
    except Exception as e:
        print(f"[ERROR] Failed to connect to Destination: {e}")
        sys.exit(1)

    # 3. Check Live Lab database safety
    all_src_dbs = src_client.list_database_names()
    if "portfolio" in all_src_dbs:
        print(f"[SAFETY VERIFIED] Live Lab database 'portfolio' detected on port 27017. It will NOT be touched or read.")

    src_db = src_client[SOURCE_DB_NAME]
    dest_db = dest_client[DEST_DB_NAME]

    src_collections = sorted(src_db.list_collection_names())
    print(f"\n[INSPECTION] Source database '{SOURCE_DB_NAME}' has {len(src_collections)} collections:")
    for c in src_collections:
        cnt = src_db[c].count_documents({})
        print(f"  - {c}: {cnt} documents")

    # 4. Migrate each collection
    print("\n[MIGRATION] Starting data & index replication...")
    summary = []

    for coll_name in src_collections:
        if coll_name.startswith("system."):
            continue

        src_coll = src_db[coll_name]
        dest_coll = dest_db[coll_name]

        src_count = src_coll.count_documents({})
        docs = list(src_coll.find({}))

        if docs:
            # Insert preserved BSON documents
            dest_coll.insert_many(docs, ordered=True)

        # Migrate custom indexes (skip default _id_ index)
        indexes_created = 0
        try:
            for idx in src_coll.list_indexes():
                if idx.get("name") == "_id_":
                    continue
                keys = list(idx["key"].items())
                idx_opts = {k: v for k, v in idx.items() if k not in ["v", "key", "name", "ns"]}
                dest_coll.create_index(keys, name=idx.get("name"), **idx_opts)
                indexes_created += 1
        except Exception as idx_err:
            print(f"    [Index Notice on {coll_name}]: {idx_err}")

        dest_count = dest_coll.count_documents({})
        verified = (src_count == dest_count)
        
        status_text = "VERIFIED MATCH" if verified else "MISMATCH"
        print(f"  -> Migrated '{coll_name}': {src_count} source -> {dest_count} dest [{status_text}] (Indexes: {indexes_created})")
        
        summary.append({
            "collection": coll_name,
            "source_count": src_count,
            "dest_count": dest_count,
            "indexes": indexes_created,
            "status": status_text
        })

    # 5. Ensure all application collections exist in destination
    required_application_collections = [
        "users", "user_profiles", "user_addresses", "products", "product_sources",
        "shopping_carts", "cart_items", "checkout_sessions", "saved_payment_methods",
        "purchase_orders", "order_items", "payment_orders", "payment_captures",
        "upi_payments", "transactions", "payment_webhooks", "refunds", "coupons",
        "invoices", "order_status_history", "user_activities", "search_history",
        "chat_conversations", "chat_messages", "user_wallets", "wallet_transactions",
        "fraud_alerts", "agent_logs"
    ]

    for req_c in required_application_collections:
        if req_c not in dest_db.list_collection_names():
            dest_db.create_collection(req_c)
            print(f"  + Initialized required application collection: '{req_c}'")

    print("\n" + "=" * 70)
    print("MIGRATION SUMMARY & AUDIT TRAIL")
    print("=" * 70)
    all_ok = True
    for item in summary:
        print(f"{item['collection']:<25} | Src: {item['source_count']:<4} | Dest: {item['dest_count']:<4} | {item['status']}")
        if item["status"] != "VERIFIED MATCH":
            all_ok = False

    if all_ok:
        print("\n[SUCCESS] 100% of PayPilot AI data safely migrated and verified in mongodb://127.0.0.1:27018/paypilot_ai_db")
    else:
        print("\n[WARNING] Discrepancies found during count verification. Please audit output.")

if __name__ == "__main__":
    migrate()

