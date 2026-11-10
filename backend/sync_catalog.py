import asyncio
from app.services.product_sync import product_sync_service
from app.database.connection import connect_to_mongo, close_mongo_connection
from app.database.collections import products_col

async def main():
    await connect_to_mongo()
    count = await product_sync_service.sync_live_catalog()
    total = await products_col.count_documents({})
    print(f"Sync complete! Added: {count}, Total products in database: {total}")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(main())
