import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.database.collections import user_wallets_col, wallet_transactions_col, transactions_col, purchase_orders_col

class WalletService:
    """
    Autonomous AI Wallet Engine:
    Maintains persistent user wallets in MongoDB, auto-allocates or tops up required 
    amounts when user instructs AI to buy/order a product, and executes instant zero-friction settlement.
    """
    
    @staticmethod
    async def get_or_create_wallet(user_id: str) -> Dict[str, Any]:
        wallet = await user_wallets_col.find_one({"user_id": str(user_id)})
        if not wallet:
            new_wallet = {
                "user_id": str(user_id),
                "balance": 50000.0, # Pre-funded smart commerce credit for seamless autonomous demonstration
                "currency": "INR",
                "auto_topup_enabled": True,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            res = await user_wallets_col.insert_one(new_wallet)
            new_wallet["id"] = str(res.inserted_id)
            if "_id" in new_wallet:
                del new_wallet["_id"]
            return new_wallet
        
        wallet_copy = dict(wallet)
        wallet_copy["id"] = str(wallet_copy.get("_id", ""))
        if "_id" in wallet_copy:
            del wallet_copy["_id"]
        return wallet_copy

    @staticmethod
    async def add_funds(user_id: str, amount: float, source: str = "Auto Top-Up (Autonomous AI Allocation)", note: str = "") -> Dict[str, Any]:
        wallet = await WalletService.get_or_create_wallet(user_id)
        current_balance = float(wallet.get("balance", 0.0))
        new_balance = round(current_balance + amount, 2)
        
        await user_wallets_col.update_one(
            {"user_id": str(user_id)},
            {"$set": {"balance": new_balance, "updated_at": datetime.now(timezone.utc)}}
        )
        
        # Log wallet transaction in MongoDB
        tx_doc = {
            "user_id": str(user_id),
            "amount": amount,
            "currency": wallet.get("currency", "INR"),
            "type": "CREDIT",
            "source": source,
            "note": note,
            "balance_after": new_balance,
            "timestamp": datetime.now(timezone.utc),
            "created_at": datetime.now(timezone.utc)
        }
        await wallet_transactions_col.insert_one(tx_doc)
        
        wallet["balance"] = new_balance
        if "_id" in wallet:
            del wallet["_id"]
        return wallet

    @staticmethod
    async def execute_autonomous_purchase(user_id: str, product: dict, quantity: int = 1) -> Dict[str, Any]:
        """
        100% Autonomous AI Buying:
        1. Calculates item total + GST (18%)
        2. Inspects wallet; if balance is insufficient, automatically tops up the exact required funds
        3. Debits the wallet balance
        4. Creates settled purchase order and transaction receipt in MongoDB
        """
        wallet = await WalletService.get_or_create_wallet(user_id)
        unit_price = float(product.get("price", 1000.0))
        subtotal = round(unit_price * quantity, 2)
        tax = round(subtotal * 0.18, 2)
        shipping = 0.0
        total_amount = round(subtotal + tax + shipping, 2)
        
        # Auto-fund wallet if balance is lower than total required
        current_balance = float(wallet.get("balance", 0.0))
        auto_funded_amount = 0.0
        if current_balance < total_amount:
            shortfall = round(total_amount - current_balance, 2)
            await WalletService.add_funds(
                user_id=user_id,
                amount=shortfall,
                source=f"AI Auto-Allocation for {product.get('name')[:30]}"
            )
            auto_funded_amount = shortfall
            current_balance = total_amount

        # Debit wallet
        new_balance = round(current_balance - total_amount, 2)
        await user_wallets_col.update_one(
            {"user_id": str(user_id)},
            {"$set": {"balance": new_balance, "updated_at": datetime.now(timezone.utc)}}
        )
        
        order_id = f"ord_ai_{uuid.uuid4().hex[:12]}"
        receipt_number = f"PAYPILOT-AI-{uuid.uuid4().hex[:8].upper()}"
        
        # Save purchase order in MongoDB
        order_doc = {
            "order_id": order_id,
            "user_id": str(user_id),
            "product_id": str(product.get("_id", product.get("id", ""))),
            "product_name": product.get("name"),
            "quantity": quantity,
            "unit_price": unit_price,
            "subtotal": subtotal,
            "tax_amount": tax,
            "shipping_fee": shipping,
            "total_amount": total_amount,
            "currency": "INR",
            "payment_method": "AI_SMART_WALLET",
            "order_status": "CONFIRMED",
            "payment_status": "COMPLETED",
            "status": "COMPLETED",
            "gateway_payment_id": f"wallet_{order_id}",
            "created_at": datetime.now(timezone.utc),
            "completed_at": datetime.now(timezone.utc)
        }
        await purchase_orders_col.insert_one(order_doc)
        
        # Save settled transaction in MongoDB
        tx_doc = {
            "user_id": str(user_id),
            "purchase_order_id": order_id,
            "receipt_number": receipt_number,
            "amount": total_amount,
            "currency": "INR",
            "status": "COMPLETED",
            "category": product.get("category", "Electronics"),
            "item_title": product.get("name"),
            "payment_method": "PayPilot AI Autonomous Wallet",
            "created_at": datetime.now(timezone.utc)
        }
        await transactions_col.insert_one(tx_doc)
        
        return {
            "order_id": order_id,
            "receipt_number": receipt_number,
            "product_name": product.get("name"),
            "quantity": quantity,
            "total_amount": total_amount,
            "auto_funded_amount": auto_funded_amount,
            "remaining_wallet_balance": new_balance,
            "status": "ORDER_PLACED_AND_SETTLED"
        }

wallet_service = WalletService()

