import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from bson import ObjectId
from app.core.security import get_password_hash, verify_password, create_access_token, get_current_user
from app.database.collections import (
    users_col, products_col, shopping_sessions_col, shopping_messages_col,
    purchase_orders_col, transactions_col, invoices_col, fraud_alerts_col,
    search_history_col, product_views_col, user_activities_col, cart_items_col,
    user_addresses_col, checkout_sessions_col, upi_payments_col, saved_payment_methods_col,
    refunds_col, coupons_col, order_status_history_col, webhook_events_col
)
from app.database.catalog_data import ALL_CATEGORIES
from app.schemas.all_schemas import (
    UserRegister, UserLogin, UserResponse, Token, GoogleAuthRequest,
    ProductCompareRequest, ChatRequest,
    CartItemAddRequest, CartItemUpdateRequest,
    OrderPrepareRequest, OrderApprovalRequest, PayPalCreateOrderRequest, PayPalCaptureRequest,
    InvoiceCreate, AddressCreate, AddressUpdate, CheckoutSessionCreate,
    UPIVPAPaymentRequest, UPIQRPaymentRequest, CardPaymentRequest, PaymentVerifyRequest,
    RefundRequest
)
from app.agents.orchestrator import AgentOrchestrator, AITools
from app.agents.intelligence import FinancialIntelligenceAgent, FraudMonitoringAgent
from app.services.cart_service import cart_service
from app.services.activity_service import activity_tracker
from app.services.invoice_service import invoice_service
from app.services.wallet_service import wallet_service
from app.integrations.paypal_client import paypal_service
from app.integrations.payment_service import payment_service

router = APIRouter()

def clean_doc(doc: dict) -> dict:
    if not doc:
        return {}
    res = dict(doc)
    if "_id" in res:
        res["id"] = str(res["_id"])
        del res["_id"]
    return res

# --- 1. AUTHENTICATION ---
@router.post("/auth/register")
async def register(payload: UserRegister):
    existing = await users_col.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    doc = {
        "email": payload.email,
        "hashed_password": get_password_hash(payload.password),
        "full_name": payload.full_name,
        "phone": payload.phone or "",
        "auth_provider": "local",
        "preferred_currency": "INR",
        "preferred_payment_method": "UPI",
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    res = await users_col.insert_one(doc)
    token = create_access_token({"sub": payload.email})
    user_out = clean_doc(doc)
    user_out["id"] = str(res.inserted_id)
    return {"access_token": token, "token_type": "bearer", "user": user_out}

@router.post("/auth/google")
async def google_auth(payload: GoogleAuthRequest):
    """
    Continue with Google OAuth / ID Token sign-in & sign-up:
    Synchronizes profile, email, name, and avatar directly into MongoDB Atlas/Local.
    """
    email = payload.email
    name = payload.name or "Google User"
    picture = payload.picture or ""
    google_id = payload.google_id or str(uuid.uuid4())

    if not email:
        raise HTTPException(status_code=400, detail="Google email is required")

    user = await users_col.find_one({"email": email})
    if not user:
        # Create new Google OAuth user in MongoDB
        doc = {
            "email": email,
            "full_name": name,
            "avatar_url": picture,
            "google_id": google_id,
            "auth_provider": "google",
            "phone": "",
            "preferred_currency": "INR",
            "preferred_payment_method": "UPI",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        }
        res = await users_col.insert_one(doc)
        user_out = clean_doc(doc)
        user_out["id"] = str(res.inserted_id)
    else:
        # Update existing user profile with latest Google data
        update_fields = {"last_login": datetime.now(timezone.utc)}
        if picture and not user.get("avatar_url"):
            update_fields["avatar_url"] = picture
        await users_col.update_one({"_id": user["_id"]}, {"$set": update_fields})
        user_out = clean_doc(user)

    token = create_access_token({"sub": email})
    return {"access_token": token, "token_type": "bearer", "user": user_out}

@router.post("/auth/login")
async def login(payload: UserLogin):
    user = await users_col.find_one({"email": payload.email})
    if not user or not verify_password(payload.password, user.get("hashed_password", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    token = create_access_token({"sub": user["email"]})
    user_out = clean_doc(user)
    return {"access_token": token, "token_type": "bearer", "user": user_out}

@router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return clean_doc(current_user)

@router.put("/auth/profile")
async def update_profile(payload: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    update_data = {}
    if "full_name" in payload:
        update_data["full_name"] = payload["full_name"]
    if "phone" in payload:
        update_data["phone"] = payload["phone"]
    if "preferred_currency" in payload:
        update_data["preferred_currency"] = payload["preferred_currency"]
    if "preferred_payment_method" in payload:
        update_data["preferred_payment_method"] = payload["preferred_payment_method"]
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await users_col.update_one({"_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id}, {"$set": update_data})
    
    updated = await users_col.find_one({"_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id})
    return clean_doc(updated)

# --- 1.1 USER WALLET & AUTONOMOUS BALANCES ---
@router.get("/wallet")
async def get_wallet(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    return await wallet_service.get_or_create_wallet(user_id)

@router.post("/wallet/topup")
async def topup_wallet(payload: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    amount = float(payload.get("amount", 5000.0))
    return await wallet_service.add_funds(user_id, amount, source="Manual Top-Up")

# --- 1.2 USER ADDRESSES ---
@router.get("/users/addresses")
async def list_addresses(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    addresses = await user_addresses_col.find({"user_id": user_id}).to_list(20)
    return [clean_doc(a) for a in addresses]

@router.post("/users/addresses")
async def create_address(payload: AddressCreate, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    if payload.is_default:
        await user_addresses_col.update_many({"user_id": user_id}, {"$set": {"is_default": False}})
        
    doc = {
        "user_id": user_id,
        "full_name": payload.full_name,
        "phone_number": payload.phone_number,
        "street": payload.street,
        "city": payload.city,
        "state": payload.state,
        "pin_code": payload.pin_code,
        "country": payload.country,
        "is_default": payload.is_default,
        "delivery_instructions": payload.delivery_instructions,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    res = await user_addresses_col.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    return clean_doc(doc)

@router.put("/users/addresses/{address_id}")
async def update_address(address_id: str, payload: AddressUpdate, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    query = {"_id": ObjectId(address_id) if ObjectId.is_valid(address_id) else address_id, "user_id": user_id}
    existing = await user_addresses_col.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Address not found")
        
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    if update_data.get("is_default"):
        await user_addresses_col.update_many({"user_id": user_id}, {"$set": {"is_default": False}})
        
    update_data["updated_at"] = datetime.now(timezone.utc)
    await user_addresses_col.update_one(query, {"$set": update_data})
    updated = await user_addresses_col.find_one(query)
    return clean_doc(updated)

@router.delete("/users/addresses/{address_id}")
async def delete_address(address_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    query = {"_id": ObjectId(address_id) if ObjectId.is_valid(address_id) else address_id, "user_id": user_id}
    res = await user_addresses_col.delete_one(query)
    if not res:
        raise HTTPException(status_code=404, detail="Address not found")
    return {"message": "Address deleted successfully"}

# --- 2. MULTI-CATEGORY PRODUCT DISCOVERY ---
@router.get("/products/categories")
async def list_categories():
    return {"categories": ALL_CATEGORIES}

@router.get("/products/search")
async def search_products(
    q: Optional[str] = None,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: Optional[str] = "rating", # "rating", "price_asc", "price_desc", "popularity"
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    query = {}
    if category:
        query["category"] = category
    if brand:
        query["brand"] = brand
    if min_price or max_price:
        query["price"] = {}
        if min_price is not None:
            query["price"]["$gte"] = min_price
        if max_price is not None:
            query["price"]["$lte"] = max_price
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"brand": {"$regex": q, "$options": "i"}}
        ]

    cursor = products_col.find(query)
    
    # Sorting
    if sort_by == "price_asc":
        cursor = cursor.sort("price", 1)
    elif sort_by == "price_desc":
        cursor = cursor.sort("price", -1)
    elif sort_by == "popularity":
        cursor = cursor.sort("review_count", -1)
    else:
        cursor = cursor.sort("rating", -1)

    skip = (page - 1) * limit
    docs = await cursor.to_list(length=100)
    total_count = len(docs)
    paginated_docs = docs[skip:skip+limit]

    return {
        "products": [clean_doc(d) for d in paginated_docs],
        "total": total_count,
        "page": page,
        "limit": limit
    }

@router.get("/products/{product_id}")
async def get_product_details(product_id: str, current_user: Optional[dict] = Depends(get_current_user)):
    doc = await products_col.find_one({"_id": ObjectId(product_id) if len(product_id) == 24 else product_id})
    if not doc:
        all_prods = await products_col.find({}).to_list(100)
        doc = next((d for d in all_prods if str(d.get("_id")) == product_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")

    # Record product view in MongoDB
    if current_user:
        await activity_tracker.log_product_view(str(current_user["_id"]), doc)

    # Similar products in same category
    similar_cursor = products_col.find({
        "category": doc.get("category"),
        "_id": {"$ne": doc.get("_id")}
    }).limit(4)
    similar_docs = await similar_cursor.to_list(4)

    return {
        "product": clean_doc(doc),
        "similar_products": [clean_doc(s) for s in similar_docs]
    }

@router.post("/products/compare")
async def compare_products_api(payload: ProductCompareRequest):
    prods = []
    for pid in payload.product_ids:
        doc = await products_col.find_one({"_id": ObjectId(pid) if len(str(pid)) == 24 else str(pid)})
        if doc:
            prods.append(doc)
    return AITools.compare_products(prods)

# --- 3. SHOPPING CART (SYNCHRONIZED WITH MONGODB) ---
@router.get("/cart")
async def get_cart_api(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    return await cart_service.get_user_cart(user_id)

@router.post("/cart/items")
async def add_to_cart_api(payload: CartItemAddRequest, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    try:
        cart = await cart_service.add_item(user_id, payload.product_id, payload.quantity)
        await activity_tracker.log_user_activity(user_id, "ADD_TO_CART", {"product_id": payload.product_id, "quantity": payload.quantity})
        return cart
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/cart/items/{item_id}")
async def update_cart_item_api(item_id: str, payload: CartItemUpdateRequest, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    return await cart_service.update_item_quantity(user_id, item_id, payload.quantity)

@router.delete("/cart/items/{item_id}")
async def remove_cart_item_api(item_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    return await cart_service.remove_item(user_id, item_id)

# --- 4. AI SHOPPING ASSISTANT (GEMINI FLASH) ---
@router.post("/ai/chat")
async def chat_with_agent(payload: ChatRequest, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    session_id = payload.session_id or str(uuid.uuid4())
    
    # Save user message in MongoDB
    await shopping_messages_col.insert_one({
        "session_id": session_id,
        "sender": "user",
        "content": payload.message,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Execute Gemini Flash Orchestrator
    result = await AgentOrchestrator.execute(user_id, session_id, payload.message)
    
    # Save assistant reply in MongoDB
    await shopping_messages_col.insert_one({
        "session_id": session_id,
        "sender": "assistant",
        "content": result["reply"],
        "metadata": {
            "timeline": result["execution_timeline"],
            "purchase_confirmation": result.get("purchase_confirmation")
        },
        "created_at": datetime.now(timezone.utc)
    })
    
    return result

@router.get("/ai/conversations")
async def list_conversations(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    cursor = shopping_sessions_col.find({"user_id": user_id}).sort("created_at", -1)
    sessions = await cursor.to_list(length=50)
    return [clean_doc(s) for s in sessions]

# --- 5. ORDERS & CHECKOUT ---
@router.post("/orders/prepare")
async def prepare_order_api(payload: OrderPrepareRequest, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    prod = await products_col.find_one({"_id": ObjectId(payload.product_id) if len(payload.product_id) == 24 else payload.product_id})
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
        
    unit_price = float(prod["price"])
    subtotal = unit_price * payload.quantity
    tax_amount = round(subtotal * 0.18, 2)
    shipping_fee = 0.0
    total_amount = round(subtotal + tax_amount + shipping_fee, 2)
    
    order_doc = {
        "user_id": user_id,
        "product_id": str(prod["_id"]),
        "product_name": prod["name"],
        "quantity": payload.quantity,
        "unit_price": unit_price,
        "subtotal": subtotal,
        "tax_amount": tax_amount,
        "shipping_fee": shipping_fee,
        "total_amount": total_amount,
        "currency": prod.get("currency", "INR"),
        "status": "PENDING_APPROVAL",
        "user_authorized": False,
        "created_at": datetime.now(timezone.utc)
    }
    res = await purchase_orders_col.insert_one(order_doc)
    order_doc["id"] = str(res.inserted_id)
    return clean_doc(order_doc)

@router.post("/orders/approve")
async def approve_order_api(payload: OrderApprovalRequest, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    query = {"_id": ObjectId(payload.order_id) if len(payload.order_id) == 24 else payload.order_id, "user_id": user_id}
    order = await purchase_orders_col.find_one(query)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    new_status = "APPROVED" if payload.approved else "CANCELLED"
    await purchase_orders_col.update_one(query, {"$set": {
        "user_authorized": payload.approved,
        "status": new_status,
        "authorized_at": datetime.now(timezone.utc) if payload.approved else None
    }})
    order["user_authorized"] = payload.approved
    order["status"] = new_status
    return clean_doc(order)

@router.get("/orders")
@router.get("/orders/my-orders")
async def list_orders(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    orders = await purchase_orders_col.find({"user_id": user_id}).sort("created_at", -1).to_list(50)
    return [clean_doc(o) for o in orders]

# --- 6. PAYPAL SANDBOX PAYMENT INTEGRATION ---
@router.post("/payments/create-order")
async def create_paypal_order(payload: PayPalCreateOrderRequest, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    query = {"_id": ObjectId(payload.purchase_order_id) if len(payload.purchase_order_id) == 24 else payload.purchase_order_id, "user_id": user_id}
    order = await purchase_orders_col.find_one(query)
    if not order:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    if not order.get("user_authorized"):
        raise HTTPException(status_code=403, detail="Order has not received explicit user approval.")
        
    paypal_res = await paypal_service.create_order(
        amount=order["total_amount"],
        currency=order.get("currency", "INR"),
        reference_id=str(order["_id"]),
        item_title=order.get("product_name", "PayPilot Order")
    )
    
    paypal_id = paypal_res.get("id")
    await purchase_orders_col.update_one(query, {"$set": {"paypal_order_id": paypal_id}})
    
    return {
        "paypal_order_id": paypal_id,
        "purchase_order_id": str(order["_id"]),
        "total_amount": order["total_amount"],
        "currency": order.get("currency", "INR"),
        "approval_url": next((l["href"] for l in paypal_res.get("links", []) if l.get("rel") == "approve"), None)
    }

@router.post("/payments/capture")
async def capture_paypal_order(payload: PayPalCaptureRequest, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    query = {"_id": ObjectId(payload.purchase_order_id) if len(payload.purchase_order_id) == 24 else payload.purchase_order_id, "user_id": user_id}
    order = await purchase_orders_col.find_one(query)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.get("status") == "COMPLETED":
        raise HTTPException(status_code=400, detail="Order has already been captured.")
        
    capture_res = await paypal_service.capture_order(payload.paypal_order_id)
    
    capture_id = f"CAP-{uuid.uuid4().hex[:10].upper()}"
    try:
        capture_id = capture_res["purchase_units"][0]["payments"]["captures"][0]["id"]
    except Exception:
        pass
        
    receipt_no = f"REC-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    
    txn_doc = {
        "user_id": user_id,
        "purchase_order_id": str(order["_id"]),
        "paypal_capture_id": capture_id,
        "paypal_order_id": payload.paypal_order_id,
        "payer_email": current_user.get("email"),
        "amount": order["total_amount"],
        "currency": order.get("currency", "INR"),
        "status": "COMPLETED",
        "category": order.get("category", "Retail Commerce"),
        "item_title": order.get("product_name", "PayPilot Order"),
        "receipt_number": receipt_no,
        "created_at": datetime.now(timezone.utc)
    }
    await transactions_col.insert_one(txn_doc)
    await purchase_orders_col.update_one(query, {"$set": {"status": "COMPLETED"}})
    
    # Clear cart after verified successful payment
    await cart_service.clear_cart(user_id)
    
    # Fraud anomaly evaluation
    fraud_eval = await FraudMonitoringAgent.analyze_transaction(user_id, order["total_amount"], txn_doc["item_title"])
    
    return {
        "status": "COMPLETED",
        "receipt_number": receipt_no,
        "paypal_capture_id": capture_id,
        "amount": order["total_amount"],
        "currency": order.get("currency", "INR"),
        "item_title": txn_doc["item_title"],
        "date": txn_doc["created_at"],
        "fraud_assessment": fraud_eval
    }

@router.get("/payments/transactions")
async def list_transactions(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    txns = await transactions_col.find({"user_id": user_id}).sort("created_at", -1).to_list(100)
    return [clean_doc(t) for t in txns]

# --- 6.1 MULTI-PAYMENT GATEWAY (UPI, DYNAMIC QR, CARDS, RAZORPAY) ---
@router.post("/checkout/initiate")
async def initiate_checkout_session(payload: CheckoutSessionCreate, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    cart = await cart_service.get_user_cart(user_id)
    if not cart["items"]:
        raise HTTPException(status_code=400, detail="Cannot checkout an empty shopping cart")

    # Fetch delivery address snapshot
    address_doc = None
    if payload.address_id:
        address_doc = await user_addresses_col.find_one({"_id": ObjectId(payload.address_id) if len(payload.address_id) == 24 else payload.address_id, "user_id": user_id})
    if not address_doc:
        address_doc = await user_addresses_col.find_one({"user_id": user_id, "is_default": True})
        
    # Backend pricing & coupon calculation
    subtotal = float(cart["subtotal"])
    discount = 0.0
    applied_coupon = None
    if payload.coupon_code:
        code_upper = payload.coupon_code.strip().upper()
        if code_upper in ["SAVE10", "WELCOME10"]:
            discount = round(subtotal * 0.10, 2)
            applied_coupon = code_upper
        elif code_upper in ["PAYPILOT500", "FESTIVE500"]:
            discount = 500.0 if subtotal > 1500 else 0.0
            applied_coupon = code_upper
            
    tax_amount = round((subtotal - discount) * 0.18, 2)
    shipping_fee = 0.0 if payload.delivery_method == "standard" else 150.0
    final_total = round(max(0.0, subtotal - discount + tax_amount + shipping_fee), 2)

    # Create Internal Order in purchase_orders
    order_doc = {
        "user_id": user_id,
        "product_name": f"PayPilot Cart Checkout ({cart['item_count']} items)",
        "quantity": cart["item_count"],
        "unit_price": subtotal,
        "subtotal": subtotal,
        "discount_amount": discount,
        "coupon_code": applied_coupon,
        "tax_amount": tax_amount,
        "shipping_fee": shipping_fee,
        "delivery_method": payload.delivery_method,
        "delivery_address": clean_doc(address_doc) if address_doc else None,
        "total_amount": final_total,
        "currency": "INR",
        "items": cart["items"],
        "order_status": "PENDING_PAYMENT",
        "payment_status": "CREATED",
        "user_authorized": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    order_res = await purchase_orders_col.insert_one(order_doc)
    order_id = str(order_res.inserted_id)

    # Persist checkout_session
    session_doc = {
        "user_id": user_id,
        "order_id": order_id,
        "cart_id": cart.get("cart_id", f"cart_{user_id}"),
        "status": "ACTIVE",
        "subtotal": subtotal,
        "discount": discount,
        "tax": tax_amount,
        "shipping": shipping_fee,
        "total": final_total,
        "currency": "INR",
        "created_at": datetime.now(timezone.utc)
    }
    session_res = await checkout_sessions_col.insert_one(session_doc)

    return {
        "checkout_session_id": str(session_res.inserted_id),
        "order_id": order_id,
        "items": cart["items"],
        "item_count": cart["item_count"],
        "subtotal": subtotal,
        "discount": discount,
        "coupon": applied_coupon,
        "tax": tax_amount,
        "shipping": shipping_fee,
        "total": final_total,
        "currency": "INR",
        "address": clean_doc(address_doc) if address_doc else None
    }

@router.post("/payments/upi/qr")
async def generate_upi_qr(payload: UPIQRPaymentRequest, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    query = {"_id": ObjectId(payload.order_id) if len(payload.order_id) == 24 else payload.order_id, "user_id": user_id}
    order = await purchase_orders_col.find_one(query)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    rzp_adapter = payment_service.get_adapter("razorpay")
    qr_data = await rzp_adapter.create_dynamic_upi_qr(
        order_id=payload.order_id,
        amount=order["total_amount"],
        merchant_vpa="paypilot@upi"
    )

    # Store in upi_payments collection
    upi_record = {
        "user_id": user_id,
        "order_id": payload.order_id,
        "method_type": "DYNAMIC_QR",
        "merchant_vpa": qr_data["merchant_vpa"],
        "amount": order["total_amount"],
        "currency": "INR",
        "upi_uri": qr_data["upi_uri"],
        "status": "INITIATED",
        "created_at": datetime.now(timezone.utc)
    }
    await upi_payments_col.insert_one(upi_record)

    return qr_data

@router.post("/payments/upi/vpa")
async def process_upi_vpa(payload: UPIVPAPaymentRequest, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    query = {"_id": ObjectId(payload.order_id) if len(payload.order_id) == 24 else payload.order_id, "user_id": user_id}
    order = await purchase_orders_col.find_one(query)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    vpa = payload.vpa.strip()
    if "@" not in vpa or len(vpa) < 5:
        raise HTTPException(status_code=400, detail="Invalid UPI VPA format. Must be like username@bank or mobile@upi")

    # In live Razorpay: collects request or intent
    # Mask VPA for strict compliance (never leak full details in logs)
    parts = vpa.split("@")
    masked_vpa = f"{parts[0][:2]}***@{parts[1]}"

    upi_record = {
        "user_id": user_id,
        "order_id": payload.order_id,
        "method_type": "VPA_COLLECT",
        "customer_vpa_masked": masked_vpa,
        "amount": order["total_amount"],
        "currency": "INR",
        "status": "PENDING_CUSTOMER_APPROVAL",
        "created_at": datetime.now(timezone.utc)
    }
    await upi_payments_col.insert_one(upi_record)

    return {
        "order_id": payload.order_id,
        "masked_vpa": masked_vpa,
        "amount": order["total_amount"],
        "currency": "INR",
        "status": "COLLECT_REQUEST_SENT",
        "message": f"Collect request for INR {order['total_amount']:,.2f} sent to {masked_vpa}. Please approve inside your UPI app (GPay/PhonePe/Paytm)."
    }

@router.post("/payments/card")
async def process_card_payment(payload: CardPaymentRequest, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    query = {"_id": ObjectId(payload.order_id) if len(payload.order_id) == 24 else payload.order_id, "user_id": user_id}
    order = await purchase_orders_col.find_one(query)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # PCI Compliance: Ensure no full card numbers or CVV are accepted
    last_four = payload.card_number_masked[-4:] if len(payload.card_number_masked) >= 4 else "4242"
    masked_card = f"•••• •••• •••• {last_four}"

    token_ref = f"tok_rzp_{uuid.uuid4().hex[:12]}"

    if payload.save_card:
        await saved_payment_methods_col.insert_one({
            "user_id": user_id,
            "provider": "razorpay",
            "token_reference": token_ref,
            "card_brand": payload.card_brand,
            "cardholder_name": payload.cardholder_name,
            "card_masked": masked_card,
            "last_four": last_four,
            "expiry_month": payload.expiry_month,
            "expiry_year": payload.expiry_year,
            "created_at": datetime.now(timezone.utc)
        })

    # Create Razorpay gateway order
    rzp_adapter = payment_service.get_adapter("razorpay")
    rzp_order = await rzp_adapter.create_order({
        "amount": order["total_amount"],
        "currency": "INR",
        "receipt": payload.order_id
    })

    return {
        "order_id": payload.order_id,
        "gateway_order_id": rzp_order["gateway_order_id"],
        "card_brand": payload.card_brand,
        "card_masked": masked_card,
        "amount": order["total_amount"],
        "currency": "INR",
        "requires_3ds_verification": True,
        "status": "READY_FOR_3DS"
    }

@router.post("/payments/verify")
async def verify_payment(payload: PaymentVerifyRequest, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    query = {"_id": ObjectId(payload.order_id) if len(payload.order_id) == 24 else payload.order_id, "user_id": user_id}
    order = await purchase_orders_col.find_one(query)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.get("payment_status") == "COMPLETED":
        return {"status": "COMPLETED", "message": "Order already verified and completed."}

    rzp_adapter = payment_service.get_adapter("razorpay")
    verify_result = await rzp_adapter.verify_payment({
        "gateway_order_id": payload.gateway_order_id or f"order_{payload.order_id}",
        "gateway_payment_id": payload.gateway_payment_id,
        "signature": payload.signature or "sandbox_verified_signature"
    })

    if not verify_result.get("verified"):
        raise HTTPException(status_code=400, detail=f"Payment verification failed: {verify_result.get('reason')}")

    # Generate receipt & invoice
    receipt_no = f"REC-PAYPILOT-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    txn_doc = {
        "user_id": user_id,
        "order_id": payload.order_id,
        "payment_provider": payload.provider,
        "payment_method_type": "UPI / CARD (Razorpay)",
        "gateway_payment_reference": payload.gateway_payment_id,
        "gateway_order_reference": payload.gateway_order_id,
        "amount": order["total_amount"],
        "currency": order.get("currency", "INR"),
        "status": "COMPLETED",
        "receipt_number": receipt_no,
        "item_title": order.get("product_name", "PayPilot Order"),
        "created_at": datetime.now(timezone.utc)
    }
    await transactions_col.insert_one(txn_doc)

    # Update order statuses
    await purchase_orders_col.update_one(query, {
        "$set": {
            "payment_status": "COMPLETED",
            "order_status": "CONFIRMED",
            "status": "COMPLETED",
            "gateway_payment_id": payload.gateway_payment_id,
            "completed_at": datetime.now(timezone.utc)
        }
    })

    # Clear shopping cart
    await cart_service.clear_cart(user_id)

    # Record status transition history
    await order_status_history_col.insert_one({
        "order_id": payload.order_id,
        "from_status": "PENDING_PAYMENT",
        "to_status": "CONFIRMED",
        "timestamp": datetime.now(timezone.utc)
    })

    return {
        "status": "COMPLETED",
        "receipt_number": receipt_no,
        "gateway_payment_id": payload.gateway_payment_id,
        "amount": order["total_amount"],
        "currency": order.get("currency", "INR"),
        "item_title": order.get("product_name"),
        "date": txn_doc["created_at"]
    }

@router.get("/orders")
async def list_user_orders(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    orders = await purchase_orders_col.find({"user_id": user_id}).sort("created_at", -1).to_list(50)
    return [clean_doc(o) for o in orders]

@router.get("/orders/{order_id}")
async def get_order_details(order_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    query = {"_id": ObjectId(order_id) if len(order_id) == 24 else order_id, "user_id": user_id}
    order = await purchase_orders_col.find_one(query)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return clean_doc(order)

@router.get("/orders/{order_id}/tracking")
async def get_order_tracking(order_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    query = {"_id": ObjectId(order_id) if len(order_id) == 24 else order_id, "user_id": user_id}
    order = await purchase_orders_col.find_one(query)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    is_paid = order.get("payment_status") == "COMPLETED" or order.get("status") == "COMPLETED"
    milestones = [
        {"title": "Order Placed", "status": "COMPLETED", "date": order.get("created_at")},
        {"title": "Payment Confirmed", "status": "COMPLETED" if is_paid else "PENDING", "date": order.get("completed_at")},
        {"title": "Processing & Warehouse Dispatch", "status": "COMPLETED" if is_paid else "PENDING", "date": None},
        {"title": "Shipped (Express Logistics)", "status": "IN_PROGRESS" if is_paid else "PENDING", "date": None},
        {"title": "Out for Delivery", "status": "PENDING", "date": None},
        {"title": "Delivered", "status": "PENDING", "date": None}
    ]
    return {
        "order_id": order_id,
        "order_status": order.get("order_status", "CONFIRMED" if is_paid else "PENDING_PAYMENT"),
        "milestones": milestones,
        "carrier": "BlueDart Express / Delhivery Air",
        "tracking_number": f"BLUEDART-{str(order['_id'])[:8].upper()}"
    }

@router.get("/orders/{order_id}/invoice")
async def download_invoice_pdf(order_id: str, current_user: dict = Depends(get_current_user)):
    from fastapi.responses import Response
    user_id = str(current_user["_id"])
    query = {"_id": ObjectId(order_id) if len(order_id) == 24 else order_id, "user_id": user_id}
    order = await purchase_orders_col.find_one(query)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.get("payment_status") != "COMPLETED" and order.get("status") != "COMPLETED":
        raise HTTPException(status_code=400, detail="Invoice can only be issued for verified, completed orders.")

    txn = await transactions_col.find_one({"purchase_order_id": order_id}) or await transactions_col.find_one({"order_id": order_id}) or {}
    pdf_bytes = invoice_service.generate_pdf(
        order=order,
        transaction=txn,
        user=current_user,
        address=order.get("delivery_address")
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=PayPilot_Invoice_{order_id[:8]}.pdf"}
    )

@router.post("/orders/{order_id}/refund")
async def initiate_refund(order_id: str, payload: RefundRequest, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    query = {"_id": ObjectId(order_id) if len(order_id) == 24 else order_id, "user_id": user_id}
    order = await purchase_orders_col.find_one(query)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if order is eligible for refund (Paid via Wallet, UPI, PayPal, or Cards)
    is_paid = (
        order.get("payment_status") in ["COMPLETED", "PAID"] or
        order.get("order_status") in ["CONFIRMED", "COMPLETED"] or
        order.get("status") in ["COMPLETED", "APPROVED"]
    )
    if not is_paid:
        raise HTTPException(status_code=400, detail="Cannot refund an unpaid or incomplete order.")

    refund_amount = payload.amount or order.get("total_amount", 0.0)
    payment_method = order.get("payment_method", "")
    
    # If ordered via PayPilot AI Smart Wallet, credit the money directly back to the wallet
    if payment_method in ["AI_SMART_WALLET", "PayPilot AI Autonomous Wallet", "wallet"]:
        await wallet_service.add_funds(
            user_id=user_id,
            amount=refund_amount,
            note=f"Refund credited for Order #{str(order['_id'])[-8:].upper()}: {payload.reason or 'User requested'}"
        )
        refund_id = f"rfnd_wlt_{uuid.uuid4().hex[:10].upper()}"
    else:
        # Gateway refund (Razorpay/PayPal)
        rzp_adapter = payment_service.get_adapter("razorpay")
        refund_res = await rzp_adapter.refund_payment(
            payment_id=order.get("gateway_payment_id", f"pay_{order_id}"),
            amount=refund_amount,
            reason=payload.reason
        )
        refund_id = refund_res.get("refund_id", f"rfnd_{uuid.uuid4().hex[:10].upper()}")

    refund_doc = {
        "user_id": user_id,
        "order_id": order_id,
        "refund_id": refund_id,
        "amount": refund_amount,
        "currency": order.get("currency", "INR"),
        "reason": payload.reason,
        "status": "COMPLETED",
        "created_at": datetime.now(timezone.utc)
    }
    await refunds_col.insert_one(refund_doc)
    await purchase_orders_col.update_one(query, {"$set": {"payment_status": "REFUNDED", "order_status": "CANCELLED", "status": "REFUNDED"}})

    return clean_doc(refund_doc)

@router.get("/payment-methods")
async def list_saved_payment_methods(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    cards = await saved_payment_methods_col.find({"user_id": user_id}).to_list(10)
    return [clean_doc(c) for c in cards]

@router.delete("/payment-methods/{method_id}")
async def delete_saved_payment_method(method_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    await saved_payment_methods_col.delete_one({"_id": ObjectId(method_id) if len(method_id) == 24 else method_id, "user_id": user_id})
    return {"message": "Payment method removed safely"}

@router.get("/coupons/validate/{code}")
async def validate_coupon(code: str, current_user: dict = Depends(get_current_user)):
    code_upper = code.strip().upper()
    if code_upper in ["SAVE10", "WELCOME10"]:
        return {"valid": True, "code": code_upper, "type": "PERCENTAGE", "discount": 10, "description": "10% Off on entire order"}
    if code_upper in ["PAYPILOT500", "FESTIVE500"]:
        return {"valid": True, "code": code_upper, "type": "FLAT", "discount": 500, "description": "₹500 Flat Off on orders over ₹1,500"}
    raise HTTPException(status_code=400, detail="Invalid or expired coupon code")

# --- 7. EXPENSE ANALYTICS & FRAUD ---
@router.get("/expenses/analytics")
async def get_expense_analytics(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    return await FinancialIntelligenceAgent.get_analytics(user_id)

@router.get("/fraud/alerts")
async def get_fraud_alerts(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    alerts = await fraud_alerts_col.find({"user_id": user_id}).sort("created_at", -1).to_list(50)
    return [clean_doc(a) for a in alerts]

# --- 8. INVOICES ---
@router.post("/invoices")
async def create_invoice_api(payload: InvoiceCreate, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    inv_no = f"INV-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}"
    doc = {
        "user_id": user_id,
        "invoice_number": inv_no,
        "client_name": payload.client_name,
        "client_email": payload.client_email,
        "amount": payload.amount,
        "currency": payload.currency,
        "due_date": payload.due_date,
        "notes": payload.notes,
        "status": "UNPAID",
        "created_at": datetime.now(timezone.utc)
    }
    res = await invoices_col.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    return clean_doc(doc)

@router.get("/invoices")
async def list_invoices(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    invoices = await invoices_col.find({"user_id": user_id}).sort("created_at", -1).to_list(50)
    return [clean_doc(i) for i in invoices]

# --- 9. MONGODB SYNC & ACTIVITY AUDIT VERIFICATION ENDPOINT ---
@router.get("/system/database-verification")
async def database_verification(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    return {
        "status": "ONLINE",
        "database": "MongoDB Atlas",
        "user_id": user_id,
        "counts": {
            "products": await products_col.count_documents({}),
            "cart_items": await cart_items_col.count_documents({"user_id": user_id}),
            "searches_logged": await search_history_col.count_documents({"user_id": user_id}),
            "product_views_logged": await product_views_col.count_documents({"user_id": user_id}),
            "transactions": await transactions_col.count_documents({"user_id": user_id}),
            "user_activities": await user_activities_col.count_documents({"user_id": user_id})
        }
    }
