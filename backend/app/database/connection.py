import os
import asyncio
from typing import Optional, Dict, Any
from pymongo import AsyncMongoClient
from app.core.config import settings

class MongoDBManager:
    client: Optional[AsyncMongoClient] = None
    db: Optional[Any] = None
    
    # In-memory document fallback store for resilient local offline testing if URI is not yet provisioned
    _fallback_store: Dict[str, list] = {}

    @classmethod
    async def connect(cls):
        uri = settings.MONGODB_URI or "mongodb://127.0.0.1:27018/paypilot_ai_db"
        database_name = settings.MONGODB_DATABASE or "paypilot_ai_db"

        # Explicit enforcement: Do NOT connect to 27017
        if ":27017" in uri:
            raise RuntimeError(
                "[SECURITY BOUNDARY VIOLATION]: PayPilot AI is strictly prohibited from connecting to port 27017 "
                "which belongs to the Live Lab Project. Please update your connection to port 27018."
            )

        try:
            cls.client = AsyncMongoClient(uri, serverSelectionTimeoutMS=5000)
            # Verify connectivity via ping
            await cls.client.admin.command('ping')
            cls.db = cls.client[database_name]
            print(f"[PayPilot MongoDB Isolated Instance] Connected successfully to '{database_name}' on {uri}")
            return
        except Exception as e:
            print(f"[PayPilot MongoDB Error]: Could not connect to dedicated MongoDB instance at {uri} ({e}).")
            raise ConnectionError(
                f"Failed to connect to isolated PayPilot MongoDB on port 27018: {e}. "
                "Ensure the dedicated mongod instance is running via `mongod --config C:\\data\\paypilot-mongodb\\mongod.cfg`."
            )

    @classmethod
    async def disconnect(cls):
        if cls.client:
            await cls.client.close()
            cls.client = None
            cls.db = None
            print("[PayPilot MongoDB Isolated Instance] Connection closed gracefully.")

def get_database():
    return MongoDBManager.db

