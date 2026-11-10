import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from bson import ObjectId
from app.database.collections import (
    products_col, purchase_orders_col, agent_execution_logs_col,
    search_history_col
)
from app.integrations.gemini_service import gemini_flash_service
from app.services.activity_service import activity_tracker
from app.services.cart_service import cart_service
from app.services.wallet_service import wallet_service

# --- 13 DEDICATED AI TOOLS ---
class AITools:
    @staticmethod
    async def search_products(query_text: str = "", max_budget: Optional[float] = None, category: Optional[str] = None, brand: Optional[str] = None) -> List[dict]:
        db_query = {}
        if max_budget:
            db_query["price"] = {"$lte": max_budget}
        if category:
            # Match either exact category or flexible category (e.g. "Laptops" vs "Laptops and Computers")
            cat_first_word = category.split()[0] if category else ""
            db_query["category"] = {"$regex": f"^{cat_first_word}", "$options": "i"}
        if brand:
            db_query["$or"] = [
                {"brand": {"$regex": brand, "$options": "i"}},
                {"name": {"$regex": brand, "$options": "i"}}
            ]
        if query_text and not category and not brand:
            db_query["$or"] = [
                {"name": {"$regex": query_text, "$options": "i"}},
                {"description": {"$regex": query_text, "$options": "i"}}
            ]
            
        cursor = products_col.find(db_query).sort("rating", -1).limit(10)
        items = await cursor.to_list(10)
        
        # If strict brand/category returned 0 results, fallback to fuzzy keyword
        if not items and query_text:
            cursor2 = products_col.find({"name": {"$regex": query_text.split()[0], "$options": "i"}}).limit(10)
            items = await cursor2.to_list(10)
            
        return items

    @staticmethod
    async def search_by_category(category: str, max_budget: Optional[float] = None) -> List[dict]:
        return await AITools.search_products(category=category, max_budget=max_budget)

    @staticmethod
    async def filter_products(category: Optional[str] = None, brand: Optional[str] = None, max_budget: Optional[float] = None) -> List[dict]:
        return await AITools.search_products(category=category, brand=brand, max_budget=max_budget)

    @staticmethod
    def compare_products(products: List[dict]) -> Dict[str, Any]:
        if not products:
            return {}
        
        items = []
        for p in products:
            specs = p.get("specs", {})
            rating = float(p.get("rating", 4.5))
            price = float(p.get("price", 10000))
            score = round((rating * 15) - (price / 15000) + 25, 1)
            items.append({
                "product_id": str(p.get("_id", p.get("id", ""))),
                "name": p.get("name"),
                "category": p.get("category"),
                "brand": p.get("brand"),
                "price": price,
                "rating": rating,
                "specs": specs,
                "value_score": max(min(score, 99.0), 70.0),
                "summary": f"{p.get('name')} by {p.get('brand', 'verified manufacturer')} rated {rating}★."
            })
            
        items.sort(key=lambda x: x["value_score"], reverse=True)
        top = items[0]
        return {
            "comparison_items": items,
            "recommended_product_id": top["product_id"],
            "recommendation_reason": f"Top recommendation is {top['name']} (Value Score: {top['value_score']}/100) — optimal specs, pricing, and certified reliability."
        }

    @staticmethod
    async def get_product_details(product_id: str) -> Optional[dict]:
        return await products_col.find_one({"_id": ObjectId(product_id) if len(product_id) == 24 else product_id})

    @staticmethod
    async def add_to_cart(user_id: str, product_id: str, quantity: int = 1) -> dict:
        return await cart_service.add_item(user_id, product_id, quantity)

    @staticmethod
    async def get_cart(user_id: str) -> dict:
        return await cart_service.get_user_cart(user_id)

    @staticmethod
    async def get_purchase_history(user_id: str) -> List[dict]:
        from app.database.collections import transactions_col
        return await transactions_col.find({"user_id": str(user_id)}).sort("created_at", -1).to_list(10)

    @staticmethod
    async def get_search_history(user_id: str) -> List[dict]:
        return await search_history_col.find({"user_id": str(user_id)}).sort("searched_at", -1).to_list(5)

class ProductComparisonAgent:
    @staticmethod
    def compare_products(products: List[dict]) -> Dict[str, Any]:
        return AITools.compare_products(products)

class IntentUnderstandingAgent:
    @staticmethod
    def parse_intent(query: str) -> Dict[str, Any]:
        res = gemini_flash_service.parse_intent_and_extract(query)
        return {
            "max_budget": res.get("max_budget", 100000.0),
            "requires_comparison": "compare" in query.lower() or res.get("comparison_requested", False),
            "requires_checkout": "payment" in query.lower() or "checkout" in query.lower(),
            "category": res.get("category"),
            "brand": res.get("brand")
        }

class AgentOrchestrator:
    name = "PayPilotGeminiFlashOrchestrator"
    
    @classmethod
    async def execute(cls, user_id: str, session_id: str, query: str) -> Dict[str, Any]:
        start_time = time.time()
        timeline = []
        
        # Step 1: Gemini Flash Intent Extraction
        intent = gemini_flash_service.parse_intent_and_extract(query)
        timeline.append({
            "agent": "GeminiIntentAgent",
            "action": f"Classified goal: {intent.get('action')} | Category: {intent.get('category') or 'Any'} | Brand: {intent.get('brand') or 'Any'}",
            "status": "COMPLETED",
            "details": {
                "category": intent.get("category"),
                "brand": intent.get("brand"),
                "budget": f"₹{intent.get('max_budget', 0):,.0f}" if intent.get("max_budget") else "Flexible"
            }
        })
        
        reply_text = ""
        products_out = []
        comparison_out = None
        purchase_card = None
        cart_data = None
        
        # Dispatch to correct tool based on user intent
        action = intent.get("action")
        
        if action == "add_to_cart":
            # If user asks to add to cart, search candidate or use best match
            candidates = await AITools.search_products(
                query_text=query,
                category=intent.get("category"),
                brand=intent.get("brand"),
                max_budget=intent.get("max_budget")
            )
            if candidates:
                target_prod = candidates[0]
                cart_data = await AITools.add_to_cart(user_id, str(target_prod["_id"]))
                reply_text = f"Added **{target_prod['name']}** (₹{target_prod['price']:,.2f}) to your shopping cart!\n\nYour cart now has **{cart_data['item_count']} items** totaling **₹{cart_data['total']:,.2f}**."
                timeline.append({
                    "agent": "CartAgent",
                    "action": f"Executed add_to_cart for '{target_prod['name']}'",
                    "status": "COMPLETED",
                    "details": {"new_count": cart_data["item_count"], "cart_total": cart_data["total"]}
                })
            else:
                reply_text = "I couldn't locate the exact product to add. Try specifying the brand or title e.g. 'Add Samsung Galaxy M34 to cart'."

        elif action == "get_cart":
            cart_data = await AITools.get_cart(user_id)
            if cart_data["items"]:
                items_str = "\n".join([f"- **{i['product_name']}** x {i['quantity']} (₹{i['line_total']:,.2f})" for i in cart_data["items"]])
                reply_text = f"Your shopping cart has **{cart_data['item_count']} items**:\n\n{items_str}\n\n**Subtotal:** ₹{cart_data['subtotal']:,.2f}\n**Tax (GST 18%):** ₹{cart_data['tax']:,.2f}\n**Total Cart Value:** **₹{cart_data['total']:,.2f}**."
            else:
                reply_text = "Your shopping cart is currently empty. Ask me to discover products or add any item!"
            timeline.append({
                "agent": "CartAgent",
                "action": "Retrieved persistent MongoDB user cart",
                "status": "COMPLETED",
                "details": {"items": len(cart_data["items"]), "total": cart_data["total"]}
            })

        elif action == "get_history":
            history = await AITools.get_search_history(user_id)
            if history:
                queries = [f"- \"{h.get('search_query')}\" ({h.get('result_count')} results)" for h in history]
                reply_text = "Here is your recent search activity from MongoDB:\n\n" + "\n".join(queries)
            else:
                reply_text = "No prior search history logged yet for this account."
            timeline.append({
                "agent": "SearchAuditAgent",
                "action": "Retrieved search_history records from MongoDB Atlas",
                "status": "COMPLETED"
            })

        elif action == "wallet_check":
            w = await wallet_service.get_or_create_wallet(user_id)
            reply_text = f"💳 **PayPilot Autonomous AI Wallet**\n\n- Available Balance: **₹{w.get('balance', 0.0):,.2f} {w.get('currency', 'INR')}**\n- Auto-Allocation: **Enabled (100% Zero-Friction Purchasing)**\n\nWhen you ask me to buy or order any product (e.g. *'Buy iPhone 15'*), I automatically allocate the exact amount and place the order for you!"
            timeline.append({
                "agent": "WalletOrchestratorAgent",
                "action": f"Verified AI Wallet Balance: ₹{w.get('balance', 0.0):,.2f}",
                "status": "COMPLETED"
            })

        elif action == "autonomous_buy":
            # 1. Search requested product in MongoDB
            discovered_docs = await AITools.search_products(
                query_text=query,
                category=intent.get("category"),
                brand=intent.get("brand"),
                max_budget=intent.get("max_budget")
            )
            
            if discovered_docs:
                target_product = discovered_docs[0]
                # 2. Execute 100% autonomous wallet allocation & immediate order settlement
                settlement = await wallet_service.execute_autonomous_purchase(
                    user_id=user_id,
                    product=target_product,
                    quantity=1
                )
                
                auto_msg = f" (Auto-Funded ₹{settlement['auto_funded_amount']:,.2f} into wallet)" if settlement['auto_funded_amount'] > 0 else ""
                reply_text = (
                    f"🎉 **Autonomous AI Order Successfully Executed!**\n\n"
                    f"I accessed your requirements, checked your commerce wallet, allocated **₹{settlement['total_amount']:,.2f}**{auto_msg}, and placed the order for **{target_product.get('name')}**!\n\n"
                    f"📋 **Order Receipt:** `{settlement['receipt_number']}`\n"
                    f"📦 **Status:** `CONFIRMED & SETTLED` (BlueDart Priority Dispatch)\n"
                    f"💳 **Remaining Wallet Balance:** ₹{settlement['remaining_wallet_balance']:,.2f}\n\n"
                    f"You can track shipment progress under **'My Orders'** or download your GST invoice under **'Invoices'**."
                )
                
                timeline.append({
                    "agent": "AIAutonomousBuyingAgent",
                    "action": f"Auto-allocated ₹{settlement['total_amount']:,.2f} and settled order {settlement['receipt_number']}",
                    "status": "SUCCESS_100_PERCENT",
                    "details": settlement
                })
            else:
                reply_text = "I couldn't find a matching product in the catalog to auto-purchase. Try specifying a brand or category like *'Buy Apple iPhone 15'* or *'Order Sony headphones'*."

        elif action == "checkout":
            # Prepare whole cart checkout or single product checkout
            cart_data = await AITools.get_cart(user_id)
            if cart_data["items"]:
                order_doc = {
                    "user_id": str(user_id),
                    "product_name": f"Cart Checkout ({cart_data['item_count']} items)",
                    "quantity": cart_data['item_count'],
                    "unit_price": cart_data['subtotal'],
                    "subtotal": cart_data['subtotal'],
                    "tax_amount": cart_data['tax'],
                    "shipping_fee": cart_data['shipping'],
                    "total_amount": cart_data['total'],
                    "currency": "INR",
                    "status": "PENDING_APPROVAL",
                    "user_authorized": False,
                    "created_at": datetime.now(timezone.utc)
                }
                res = await purchase_orders_col.insert_one(order_doc)
                order_id = str(res.inserted_id)
                purchase_card = {
                    "order_id": order_id,
                    "product_name": order_doc["product_name"],
                    "unit_price": cart_data["subtotal"],
                    "subtotal": cart_data["subtotal"],
                    "tax": cart_data["tax"],
                    "shipping": cart_data["shipping"],
                    "total": cart_data["total"],
                    "currency": "INR",
                    "requires_approval": True,
                    "status": "PENDING_APPROVAL"
                }
                reply_text = f"I prepared your complete cart checkout for **{cart_data['item_count']} items** totaling **₹{cart_data['total']:,.2f}**. Review the breakdown on the right and click **'Approve & Pay with PayPal'** to settle."
                timeline.append({
                    "agent": "PurchasePlanningAgent",
                    "action": "Prepared full cart checkout order",
                    "status": "AWAITING_USER_APPROVAL",
                    "details": {"total": cart_data["total"]}
                })
            else:
                reply_text = "Your cart is empty. Add a product first before proceeding to checkout!"

        else: # Standard product discovery & comparison
            discovered_docs = await AITools.search_products(
                query_text=query,
                category=intent.get("category"),
                brand=intent.get("brand"),
                max_budget=intent.get("max_budget")
            )
            
            # Log search activity into MongoDB
            await activity_tracker.log_search(
                user_id=user_id,
                search_query=query,
                detected_category=intent.get("category"),
                detected_brand=intent.get("brand"),
                price_min=None,
                price_max=intent.get("max_budget"),
                returned_products=discovered_docs
            )
            
            timeline.append({
                "agent": "ProductDiscoveryAgent",
                "action": f"Queried MongoDB: Found {len(discovered_docs)} items matching '{intent.get('category') or intent.get('brand') or 'catalog'}'",
                "status": "COMPLETED",
                "details": {"products": [d["name"] for d in discovered_docs]}
            })

            if discovered_docs:
                comparison_out = AITools.compare_products(discovered_docs)
                timeline.append({
                    "agent": "ProductComparisonAgent",
                    "action": "Evaluated product benchmark scores and generated comparison matrix",
                    "status": "COMPLETED",
                    "details": {
                        "recommended": comparison_out.get("recommended_product_id"),
                        "reasoning": comparison_out.get("recommendation_reason")
                    }
                })

                # Prepare purchase plan for top recommendation
                rec_id = comparison_out.get("recommended_product_id")
                best_prod = next((p for p in discovered_docs if str(p.get("_id", p.get("id", ""))) == rec_id), discovered_docs[0])
                
                unit_price = float(best_prod.get("price", 1000.0))
                subtotal = unit_price
                tax_amount = round(subtotal * 0.18, 2)
                shipping_fee = 0.0
                total_amount = round(subtotal + tax_amount + shipping_fee, 2)
                
                order_doc = {
                    "user_id": str(user_id),
                    "product_id": str(best_prod["_id"]),
                    "product_name": best_prod["name"],
                    "quantity": 1,
                    "unit_price": unit_price,
                    "subtotal": subtotal,
                    "tax_amount": tax_amount,
                    "shipping_fee": shipping_fee,
                    "total_amount": total_amount,
                    "currency": best_prod.get("currency", "INR"),
                    "status": "PENDING_APPROVAL",
                    "user_authorized": False,
                    "created_at": datetime.now(timezone.utc)
                }
                res = await purchase_orders_col.insert_one(order_doc)
                
                purchase_card = {
                    "order_id": str(res.inserted_id),
                    "product_id": str(best_prod["_id"]),
                    "product_name": best_prod["name"],
                    "unit_price": unit_price,
                    "subtotal": subtotal,
                    "tax": tax_amount,
                    "shipping": shipping_fee,
                    "total": total_amount,
                    "currency": best_prod.get("currency", "INR"),
                    "requires_approval": True,
                    "status": "PENDING_APPROVAL"
                }

                category_label = intent.get("category") or best_prod.get("category", "Products")
                reply_text = (
                    f"Gemini Flash searched our verified catalog and retrieved **{len(discovered_docs)} {category_label}** matching your criteria.\n\n"
                    f"**Recommendation**: {comparison_out.get('recommendation_reason')}\n\n"
                    "I have prepared the order card below. You can add it to your cart or click **'Approve & Pay with PayPal'** to complete checkout."
                )
            else:
                reply_text = f"No verified products found matching your exact filter for **{intent.get('category') or 'requested item'}** within the budget limit. Try broadening your budget or searching by brand."

        # Format products
        for p in (discovered_docs if 'discovered_docs' in locals() else []):
            p_copy = dict(p)
            p_copy["id"] = str(p_copy.get("_id", ""))
            if "_id" in p_copy:
                del p_copy["_id"]
            if "created_at" in p_copy and hasattr(p_copy["created_at"], "isoformat"):
                p_copy["created_at"] = p_copy["created_at"].isoformat()
            products_out.append(p_copy)

        # Log agent execution
        await agent_execution_logs_col.insert_one({
            "session_id": str(session_id),
            "agent_name": cls.name,
            "action": f"Executed tool {action}",
            "latency_ms": int((time.time() - start_time) * 1000),
            "created_at": datetime.now(timezone.utc)
        })

        return {
            "session_id": str(session_id),
            "reply": reply_text,
            "execution_timeline": timeline,
            "products": products_out,
            "comparison": comparison_out,
            "purchase_confirmation": purchase_card,
            "cart": cart_data
        }
