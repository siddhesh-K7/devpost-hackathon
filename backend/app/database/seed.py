from datetime import datetime, timezone
from bson import ObjectId
from app.database.collections import (
    products_col, users_col, transactions_col
)
from app.core.security import get_password_hash
from app.database.catalog_data import EXPANDED_PRODUCTS

async def seed_mongo_data():
    # Ensure all products from the multi-category catalog exist in MongoDB
    for p in EXPANDED_PRODUCTS:
        existing = await products_col.find_one({"name": p["name"]})
        if not existing:
            await products_col.insert_one(dict(p))
    print(f"[Multi-Category Seeding] Seeded/Verified {len(EXPANDED_PRODUCTS)} products across 15+ Amazon & Flipkart categories.")

    # Seed Default User
    demo_user = await users_col.find_one({"email": "demo@paypilot.ai"})
    if not demo_user:
        user_doc = {
            "email": "demo@paypilot.ai",
            "hashed_password": get_password_hash("password123"),
            "full_name": "Alex Mercer",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        }
        res = await users_col.insert_one(user_doc)
        user_id = str(res.inserted_id)
        print("[MongoDB Seeding] Created demo account: demo@paypilot.ai / password123")
        
        # Baseline transactions for financial analytics
        await transactions_col.insert_one({
            "user_id": user_id,
            "paypal_capture_id": "CAP-HISTORICAL-9812",
            "paypal_order_id": "ORD-HIST-001",
            "payer_email": "demo@paypilot.ai",
            "amount": 16999.0,
            "currency": "INR",
            "status": "COMPLETED",
            "category": "Mobiles and Smartphones",
            "item_title": "Samsung Galaxy M34 5G (Prism Silver, 128 GB)",
            "receipt_number": "REC-2026-1001",
            "created_at": datetime.now(timezone.utc)
        })
        await transactions_col.insert_one({
            "user_id": user_id,
            "paypal_capture_id": "CAP-HISTORICAL-9813",
            "paypal_order_id": "ORD-HIST-002",
            "payer_email": "demo@paypilot.ai",
            "amount": 26990.0,
            "currency": "INR",
            "status": "COMPLETED",
            "category": "Headphones and Earphones",
            "item_title": "Sony WH-1000XM5 Wireless Active Noise Cancelling Headphones",
            "receipt_number": "REC-2026-1002",
            "created_at": datetime.now(timezone.utc)
        })
        print("[MongoDB Seeding] Baseline transactions initialized.")
