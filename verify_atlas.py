import sys
import asyncio
sys.path.insert(0, 'backend')

from app.database.connection import MongoDBManager
from app.database.seed import seed_mongo_data

async def main():
    await MongoDBManager.connect()
    await seed_mongo_data()
    print(">>> VERIFICATION SUCCESS: MongoDB Atlas Cluster0 is connected, seeded, and ready!")
    await MongoDBManager.disconnect()

if __name__ == "__main__":
    asyncio.run(main())

