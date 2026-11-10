import asyncio
from app.database.connection import MongoDBManager

async def create_indexes():
    """
    Creates indexes across MongoDB Atlas collections:
    - User email (unique)
    - Order reference IDs
    - PayPal capture IDs (unique)
    - Timestamps
    """
    if MongoDBManager.db is None:
        print("[MongoDB Atlas Indexes] Running in local fallback mode; index constraints enforced in software layer.")
        return

    db = MongoDBManager.db
    try:
        # Users
        await db.users.create_index("email", unique=True)
        # Transactions
        await db.transactions.create_index("user_id")
        await db.transactions.create_index("paypal_capture_id", unique=True, sparse=True)
        await db.transactions.create_index("created_at")
        # Purchase Orders
        await db.purchase_orders.create_index("user_id")
        await db.purchase_orders.create_index("paypal_order_id", sparse=True)
        # Products
        await db.products.create_index("category")
        await db.products.create_index("price")
        # Invoices
        await db.invoices.create_index("invoice_number", unique=True)
        print("[MongoDB Atlas Indexes] Indexes verified successfully.")
    except Exception as e:
        print(f"[MongoDB Atlas Indexes Warning]: {e}")

