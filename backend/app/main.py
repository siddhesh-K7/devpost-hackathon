from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.connection import MongoDBManager
from app.database.indexes import create_indexes
from app.database.seed import seed_mongo_data
from app.services.product_sync import product_sync_service
from app.api.endpoints import router as api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB Atlas, create indexes and seed
    await MongoDBManager.connect()
    await create_indexes()
    await seed_mongo_data()
    try:
        await product_sync_service.sync_live_catalog()
    except Exception as e:
        print(f"[ProductSync Warning]: {e}")
    yield
    # Shutdown: Cleanly disconnect
    await MongoDBManager.disconnect()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Intelligent Autonomous Commerce & Payment Agent for PayPal AI Hackathon 2026",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "project": "PayPilot AI",
        "tagline": "Your Intelligent Autonomous Commerce & Payment Agent",
        "hackathon": "PayPal AI Hackathon 2026",
        "database": "MongoDB Atlas",
        "ai_engine": "Google Gemini",
        "status": "ONLINE",
        "docs_url": "/docs"
    }
