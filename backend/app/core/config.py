import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings(BaseSettings):
    PROJECT_NAME: str = "PayPilot AI"
    API_V1_STR: str = "/api"
    
    # MongoDB
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27018/paypilot_ai_db")
    MONGODB_DATABASE: str = os.getenv("MONGODB_DATABASE", os.getenv("DATABASE_NAME", "paypilot_ai_db"))
    DATABASE_NAME: str = os.getenv("MONGODB_DATABASE", os.getenv("DATABASE_NAME", "paypilot_ai_db"))
    
    # JWT & Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "paypilot-super-secret-jwt-key-2026-hackathon")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    
    # Google Gemini AI
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")
    
    # PayPal Sandbox
    PAYPAL_CLIENT_ID: str = os.getenv("PAYPAL_CLIENT_ID", "AeA1QIZXiflr1__30svdpA6auTNd3Wjhbv8wBDukEbpKdW5m0bqaDCBP38NUHRmpWNX2_2mTATP4A13a")
    PAYPAL_CLIENT_SECRET: str = os.getenv("PAYPAL_CLIENT_SECRET", "ECF_U12-k0y_W2Zg3B7QG55T6yWp8Y65m3eY-D9qT1zQvQ5rK3")
    PAYPAL_BASE_URL: str = os.getenv("PAYPAL_BASE_URL", "https://api-m.sandbox.paypal.com")
    PAYPAL_WEBHOOK_ID: str = os.getenv("PAYPAL_WEBHOOK_ID", "")

    # Payment Gateway: Razorpay
    PAYMENT_GATEWAY_PROVIDER: str = os.getenv("PAYMENT_GATEWAY_PROVIDER", "razorpay")
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_paypilot_sandbox")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "secret_paypilot_key_2026")
    RAZORPAY_WEBHOOK_SECRET: str = os.getenv("RAZORPAY_WEBHOOK_SECRET", "whsec_paypilot_razorpay_2026")
    
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
