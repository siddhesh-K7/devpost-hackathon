from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from app.database.collections import (
    search_history_col, product_views_col, user_activities_col,
    cart_items_col, products_col
)

class ActivityTrackingService:
    @staticmethod
    async def log_search(
        user_id: str,
        search_query: str,
        detected_category: Optional[str],
        detected_brand: Optional[str],
        price_min: Optional[float],
        price_max: Optional[float],
        returned_products: List[dict]
    ):
        doc = {
            "user_id": str(user_id),
            "search_query": search_query,
            "detected_category": detected_category,
            "detected_brand": detected_brand,
            "price_min": price_min,
            "price_max": price_max,
            "returned_product_ids": [str(p.get("_id", p.get("id", ""))) for p in returned_products],
            "result_count": len(returned_products),
            "provider_sources": list(set([p.get("source", "Amazon/Flipkart Verified") for p in returned_products])),
            "searched_at": datetime.now(timezone.utc)
        }
        await search_history_col.insert_one(doc)
        return doc

    @staticmethod
    async def log_product_view(user_id: str, product: dict):
        doc = {
            "user_id": str(user_id),
            "product_id": str(product.get("_id", product.get("id", ""))),
            "product_name": product.get("name"),
            "category": product.get("category"),
            "brand": product.get("brand"),
            "source": product.get("source"),
            "displayed_price": product.get("price"),
            "viewed_at": datetime.now(timezone.utc)
        }
        await product_views_col.insert_one(doc)
        return doc

    @staticmethod
    async def log_user_activity(user_id: str, activity_type: str, details: Dict[str, Any]):
        doc = {
            "user_id": str(user_id),
            "activity_type": activity_type,
            "details": details,
            "created_at": datetime.now(timezone.utc)
        }
        await user_activities_col.insert_one(doc)
        return doc

activity_tracker = ActivityTrackingService()

