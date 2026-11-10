from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str
    phone: Optional[str] = None

class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    picture: Optional[str] = None
    google_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    is_active: bool
    created_at: Optional[datetime] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Product Schemas
class ProductResponse(BaseModel):
    id: str
    name: str
    description: str
    category: str
    brand: Optional[str] = None
    price: float
    currency: str
    specs: Dict[str, Any]
    rating: float
    review_count: int
    source: str
    in_stock: bool
    image_url: Optional[str] = None

class ProductCompareRequest(BaseModel):
    product_ids: List[str]

# AI Chat Schemas
class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str

class AgentStep(BaseModel):
    agent: str
    action: str
    status: str
    details: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    session_id: str
    reply: str
    execution_timeline: List[AgentStep]
    products: Optional[List[Dict[str, Any]]] = None
    comparison: Optional[Dict[str, Any]] = None
    purchase_confirmation: Optional[Dict[str, Any]] = None
    cart: Optional[Dict[str, Any]] = None

# Cart Schemas
class CartItemAddRequest(BaseModel):
    product_id: str
    quantity: int = 1

class CartItemUpdateRequest(BaseModel):
    quantity: int

# Order & Payment Schemas
class OrderPrepareRequest(BaseModel):
    product_id: str
    quantity: int = 1

class OrderApprovalRequest(BaseModel):
    order_id: str
    approved: bool

class PayPalCreateOrderRequest(BaseModel):
    purchase_order_id: str

class PayPalCaptureRequest(BaseModel):
    paypal_order_id: str
    purchase_order_id: str

# Invoice Schemas
class InvoiceCreate(BaseModel):
    client_name: str
    client_email: EmailStr
    amount: float
    currency: str = "INR"
    due_date: datetime
    notes: Optional[str] = None

# Address Schemas
class AddressCreate(BaseModel):
    full_name: str
    phone_number: str
    street: str
    city: str
    state: str
    pin_code: str
    country: str = "India"
    is_default: bool = False
    delivery_instructions: Optional[str] = None

class AddressUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pin_code: Optional[str] = None
    country: Optional[str] = "India"
    is_default: Optional[bool] = None
    delivery_instructions: Optional[str] = None

# Checkout & Payment Schemas
class CheckoutSessionCreate(BaseModel):
    address_id: Optional[str] = None
    coupon_code: Optional[str] = None
    delivery_method: str = "standard"

class UPIVPAPaymentRequest(BaseModel):
    order_id: str
    vpa: str

class UPIQRPaymentRequest(BaseModel):
    order_id: str

class CardPaymentRequest(BaseModel):
    order_id: str
    cardholder_name: str
    card_number_masked: str  # e.g. "•••• •••• •••• 4242"
    card_brand: str          # Visa, Mastercard, RuPay
    expiry_month: str
    expiry_year: str
    save_card: bool = False

class PaymentVerifyRequest(BaseModel):
    order_id: str
    gateway_order_id: Optional[str] = None
    gateway_payment_id: str
    signature: Optional[str] = None
    provider: str = "razorpay"

class RefundRequest(BaseModel):
    reason: str
    amount: Optional[float] = None

