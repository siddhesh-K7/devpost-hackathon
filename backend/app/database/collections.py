import copy
import re
from datetime import datetime, timezone
from bson import ObjectId
from typing import Dict, Any, List, Optional
from app.database.connection import MongoDBManager

# All 30 Comprehensive Collections
COLLECTION_NAMES = [
    "users",
    "user_profiles",
    "user_addresses",
    "search_history",
    "products",
    "product_sources",
    "product_views",
    "shopping_sessions",
    "chat_conversations",
    "chat_messages",
    "shopping_messages",
    "shopping_carts",
    "cart_items",
    "saved_products",
    "saved_payment_methods",
    "purchase_orders",
    "order_items",
    "payment_orders",
    "payment_captures",
    "transactions",
    "checkout_sessions",
    "invoices",
    "invoice_items",
    "refunds",
    "coupons",
    "upi_payments",
    "order_status_history",
    "fraud_alerts",
    "expense_categories",
    "user_activities",
    "agent_logs",
    "webhook_events",
    "user_wallets",
    "wallet_transactions"
]

class AsyncCollectionWrapper:
    """Provides uniform async collection API whether querying MongoDB Atlas or in-memory fallback."""
    def __init__(self, name: str):
        self.name = name
        if name not in MongoDBManager._fallback_store:
            MongoDBManager._fallback_store[name] = []

    def _matches(self, doc: dict, query: dict) -> bool:
        for k, v in query.items():
            if k == "$or" and isinstance(v, list):
                if not any(self._matches(doc, cond) for cond in v):
                    return False
                continue
            if isinstance(v, dict):
                if "$in" in v:
                    if doc.get(k) not in v["$in"]:
                        return False
                elif "$lte" in v:
                    val = doc.get(k)
                    if val is None or float(val) > float(v["$lte"]):
                        return False
                elif "$gte" in v:
                    val = doc.get(k)
                    if val is None or float(val) < float(v["$gte"]):
                        return False
                elif "$regex" in v:
                    pattern = v["$regex"]
                    flags = re.IGNORECASE if v.get("$options") == "i" else 0
                    if not re.search(pattern, str(doc.get(k, "")), flags):
                        return False
            else:
                if str(doc.get(k)) != str(v):
                    return False
        return True

    async def find_one(self, query: dict) -> Optional[dict]:
        if MongoDBManager.db is not None:
            return await MongoDBManager.db[self.name].find_one(query)
        for doc in MongoDBManager._fallback_store[self.name]:
            if self._matches(doc, query):
                return copy.deepcopy(doc)
        return None

    def find(self, query: Optional[dict] = None):
        target_query = query or {}
        return AsyncCursorWrapper(self.name, target_query)

    async def insert_one(self, doc: dict):
        if MongoDBManager.db is not None:
            return await MongoDBManager.db[self.name].insert_one(doc)
        item = copy.deepcopy(doc)
        if "_id" not in item:
            item["_id"] = ObjectId()
        MongoDBManager._fallback_store[self.name].append(item)
        class InsertResult:
            inserted_id = item["_id"]
        return InsertResult()

    async def update_one(self, query: dict, update: dict):
        if MongoDBManager.db is not None:
            return await MongoDBManager.db[self.name].update_one(query, update)
        for doc in MongoDBManager._fallback_store[self.name]:
            if self._matches(doc, query):
                if "$set" in update:
                    doc.update(update["$set"])
                return
        return

    async def update_many(self, query: dict, update: dict):
        if MongoDBManager.db is not None:
            return await MongoDBManager.db[self.name].update_many(query, update)
        for doc in MongoDBManager._fallback_store[self.name]:
            if self._matches(doc, query):
                if "$set" in update:
                    doc.update(update["$set"])
        return

    async def count_documents(self, query: dict = {}) -> int:
        if MongoDBManager.db is not None:
            return await MongoDBManager.db[self.name].count_documents(query)
        return sum(1 for doc in MongoDBManager._fallback_store[self.name] if self._matches(doc, query))

    async def delete_one(self, query: dict):
        if MongoDBManager.db is not None:
            return await MongoDBManager.db[self.name].delete_one(query)
        for i, doc in enumerate(MongoDBManager._fallback_store[self.name]):
            if self._matches(doc, query):
                del MongoDBManager._fallback_store[self.name][i]
                break

    async def delete_many(self, query: dict):
        if MongoDBManager.db is not None:
            return await MongoDBManager.db[self.name].delete_many(query)
        MongoDBManager._fallback_store[self.name] = [
            doc for doc in MongoDBManager._fallback_store[self.name]
            if not self._matches(doc, query)
        ]

class AsyncCursorWrapper:
    def __init__(self, name: str, query: dict):
        self.name = name
        self.query = query
        self._sort_field = None
        self._sort_dir = 1
        self._limit_val = None

    def sort(self, field: str, direction: int = 1):
        self._sort_field = field
        self._sort_dir = direction
        return self

    def limit(self, val: int):
        self._limit_val = val
        return self

    async def to_list(self, length: Optional[int] = None) -> List[dict]:
        if MongoDBManager.db is not None:
            cursor = MongoDBManager.db[self.name].find(self.query)
            if self._sort_field:
                cursor = cursor.sort(self._sort_field, self._sort_dir)
            if self._limit_val:
                cursor = cursor.limit(self._limit_val)
            return await cursor.to_list(length=length or 100)
        
        # In-memory execution
        matched = [
            copy.deepcopy(d) for d in MongoDBManager._fallback_store[self.name] 
            if AsyncCollectionWrapper(self.name)._matches(d, self.query)
        ]
        if self._sort_field:
            matched.sort(
                key=lambda x: str(x.get(self._sort_field, "")),
                reverse=(self._sort_dir == -1)
            )
        limit = self._limit_val or length or len(matched)
        return matched[:limit]

# Expose collections
collections = {name: AsyncCollectionWrapper(name) for name in COLLECTION_NAMES}

users_col = collections["users"]
user_profiles_col = collections["user_profiles"]
user_addresses_col = collections["user_addresses"]
products_col = collections["products"]
shopping_sessions_col = collections["shopping_sessions"]
shopping_messages_col = collections["shopping_messages"]
purchase_orders_col = collections["purchase_orders"]
order_items_col = collections["order_items"]
payment_orders_col = collections["payment_orders"]
payment_captures_col = collections["payment_captures"]
transactions_col = collections["transactions"]
invoices_col = collections["invoices"]
invoice_items_col = collections["invoice_items"]
refunds_col = collections["refunds"]
coupons_col = collections["coupons"]
upi_payments_col = collections["upi_payments"]
saved_payment_methods_col = collections["saved_payment_methods"]
checkout_sessions_col = collections["checkout_sessions"]
order_status_history_col = collections["order_status_history"]
fraud_alerts_col = collections["fraud_alerts"]
agent_execution_logs_col = collections["agent_logs"]
search_history_col = collections["search_history"]
product_views_col = collections["product_views"]
cart_items_col = collections["cart_items"]
shopping_carts_col = collections["shopping_carts"]
user_activities_col = collections["user_activities"]
webhook_events_col = collections["webhook_events"]
user_wallets_col = collections["user_wallets"]
wallet_transactions_col = collections["wallet_transactions"]
