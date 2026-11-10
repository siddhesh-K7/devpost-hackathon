from datetime import datetime, timezone
from bson import ObjectId
from typing import List, Dict, Any, Optional
from app.database.collections import cart_items_col, products_col

class CartService:
    @staticmethod
    async def get_user_cart(user_id: str) -> Dict[str, Any]:
        cursor = cart_items_col.find({"user_id": str(user_id)})
        items = await cursor.to_list(length=100)
        
        cart_items = []
        subtotal = 0.0
        
        for item in items:
            p_id = item.get("product_id")
            # Fetch fresh product price & image from database
            prod = await products_col.find_one({
                "_id": ObjectId(p_id) if len(str(p_id)) == 24 else p_id
            })
            if not prod:
                # Lookup by string ID
                all_prods = await products_col.find({}).to_list(100)
                prod = next((p for p in all_prods if str(p.get("_id")) == str(p_id)), None)

            current_price = float(prod.get("price", item.get("unit_price", 0.0))) if prod else float(item.get("unit_price", 0.0))
            quantity = int(item.get("quantity", 1))
            line_total = round(current_price * quantity, 2)
            subtotal += line_total
            
            cart_items.append({
                "item_id": str(item.get("_id", "")),
                "product_id": str(p_id),
                "product_name": prod.get("name", item.get("product_name", "Product")) if prod else item.get("product_name"),
                "image_url": prod.get("image_url") if prod else None,
                "category": prod.get("category") if prod else "General",
                "brand": prod.get("brand") if prod else None,
                "unit_price": current_price,
                "quantity": quantity,
                "currency": prod.get("currency", "INR") if prod else "INR",
                "line_total": line_total
            })
            
        tax_amount = round(subtotal * 0.18, 2)
        shipping_fee = 0.0 if subtotal > 1000 or len(cart_items) == 0 else 99.0
        total_amount = round(subtotal + tax_amount + shipping_fee, 2)
        
        return {
            "items": cart_items,
            "item_count": sum(i["quantity"] for i in cart_items),
            "subtotal": round(subtotal, 2),
            "tax": tax_amount,
            "shipping": shipping_fee,
            "total": total_amount,
            "currency": "INR"
        }

    @staticmethod
    async def add_item(user_id: str, product_id: str, quantity: int = 1) -> Dict[str, Any]:
        prod = await products_col.find_one({
            "_id": ObjectId(product_id) if len(str(product_id)) == 24 else product_id
        })
        if not prod:
            all_prods = await products_col.find({}).to_list(100)
            prod = next((p for p in all_prods if str(p.get("_id")) == str(product_id)), None)
            
        if not prod:
            raise ValueError(f"Product ID {product_id} not found in database.")
            
        # Check if product is already in user's cart -> increment quantity
        existing = await cart_items_col.find_one({
            "user_id": str(user_id),
            "product_id": str(product_id)
        })
        
        if existing:
            new_qty = existing.get("quantity", 1) + quantity
            await cart_items_col.update_one(
                {"_id": existing["_id"]},
                {"$set": {"quantity": new_qty, "updated_at": datetime.now(timezone.utc)}}
            )
        else:
            await cart_items_col.insert_one({
                "user_id": str(user_id),
                "product_id": str(product_id),
                "product_name": prod["name"],
                "unit_price": float(prod["price"]),
                "quantity": quantity,
                "currency": prod.get("currency", "INR"),
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            })
            
        return await CartService.get_user_cart(user_id)

    @staticmethod
    async def update_item_quantity(user_id: str, item_id: str, quantity: int) -> Dict[str, Any]:
        if quantity <= 0:
            await cart_items_col.delete_one({
                "_id": ObjectId(item_id) if len(item_id) == 24 else item_id,
                "user_id": str(user_id)
            })
        else:
            await cart_items_col.update_one(
                {
                    "_id": ObjectId(item_id) if len(item_id) == 24 else item_id,
                    "user_id": str(user_id)
                },
                {"$set": {"quantity": quantity, "updated_at": datetime.now(timezone.utc)}}
            )
        return await CartService.get_user_cart(user_id)

    @staticmethod
    async def remove_item(user_id: str, item_id: str) -> Dict[str, Any]:
        await cart_items_col.delete_one({
            "_id": ObjectId(item_id) if len(item_id) == 24 else item_id,
            "user_id": str(user_id)
        })
        return await CartService.get_user_cart(user_id)

    @staticmethod
    async def clear_cart(user_id: str):
        await cart_items_col.delete_many({"user_id": str(user_id)})

cart_service = CartService()

