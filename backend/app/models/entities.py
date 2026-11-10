from datetime import datetime, timezone
import enum
from typing import Optional, List
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, 
    Text, Enum, JSON
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class OrderStatus(str, enum.Enum):
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class PaymentStatus(str, enum.Enum):
    CREATED = "CREATED"
    SAVED = "SAVED"
    APPROVED = "APPROVED"
    VOIDED = "VOIDED"
    COMPLETED = "COMPLETED"
    PAYER_ACTION_REQUIRED = "PAYER_ACTION_REQUIRED"

class FraudRiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    orders = relationship("PurchaseOrder", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    shopping_sessions = relationship("ShoppingSession", back_populates="user")
    invoices = relationship("Invoice", back_populates="user")
    fraud_alerts = relationship("FraudAlert", back_populates="user")
    cart_items = relationship("CartItem", back_populates="user")

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), index=True, nullable=False)
    price = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    specs = Column(JSON, default=dict)  # RAM, CPU, Storage, GPU, Battery, etc.
    rating = Column(Float, default=4.5)
    review_count = Column(Integer, default=120)
    source = Column(String(100), default="Verified Tech Partner")
    in_stock = Column(Boolean, default=True)
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class ShoppingSession(Base):
    __tablename__ = "shopping_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), default="Shopping Session")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="shopping_sessions")
    messages = relationship("ShoppingMessage", back_populates="session", cascade="all, delete-orphan")

class ShoppingMessage(Base):
    __tablename__ = "shopping_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("shopping_sessions.id"), nullable=False)
    sender = Column(String(50), nullable=False)  # "user", "assistant", "agent"
    agent_name = Column(String(100), nullable=True)  # "IntentAgent", "ComparisonAgent", etc.
    content = Column(Text, nullable=False)
    metadata_json = Column(JSON, default=dict)  # Product recommendations, comparison table, etc.
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    session = relationship("ShoppingSession", back_populates="messages")

class CartItem(Base):
    __tablename__ = "cart_items"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="cart_items")
    product = relationship("Product")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0.0)
    shipping_fee = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING_APPROVAL)
    
    paypal_order_id = Column(String(255), index=True, nullable=True)
    user_authorized = Column(Boolean, default=False)
    authorized_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="orders")
    product = relationship("Product")
    transaction = relationship("Transaction", back_populates="purchase_order", uselist=False)

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=True)
    paypal_capture_id = Column(String(255), unique=True, index=True, nullable=True)
    paypal_order_id = Column(String(255), index=True, nullable=True)
    payer_email = Column(String(255), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    status = Column(Enum(PaymentStatus), default=PaymentStatus.COMPLETED)
    category = Column(String(100), default="Electronics & Hardware")
    item_title = Column(String(255), nullable=False)
    receipt_number = Column(String(100), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="transactions")
    purchase_order = relationship("PurchaseOrder", back_populates="transaction")

class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    invoice_number = Column(String(100), unique=True, index=True, nullable=False)
    client_name = Column(String(255), nullable=False)
    client_email = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    status = Column(String(50), default="UNPAID")  # UNPAID, PAID, OVERDUE
    due_date = Column(DateTime, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="invoices")

class FraudAlert(Base):
    __tablename__ = "fraud_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)
    risk_score = Column(Float, nullable=False)  # 0 to 100
    risk_level = Column(Enum(FraudRiskLevel), default=FraudRiskLevel.LOW)
    trigger_reason = Column(String(255), nullable=False)
    explanation = Column(Text, nullable=False)
    suggested_action = Column(String(255), nullable=False)
    status = Column(String(50), default="FLAGGED")  # FLAGGED, REVIEWED, DISMISSED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="fraud_alerts")

class AgentExecutionLog(Base):
    __tablename__ = "agent_execution_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, nullable=True)
    agent_name = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)
    input_data = Column(JSON, default=dict)
    output_data = Column(JSON, default=dict)
    latency_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

