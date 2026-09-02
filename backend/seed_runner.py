import asyncio
from app.database import init_db, AsyncSessionLocal
from app.services.generator import generate_synthetic_data

async def main():
    print("Initializing Database tables...")
    await init_db()
    print("Seeding 1,000 synthetic transaction records...")
    async with AsyncSessionLocal() as session:
        res = await generate_synthetic_data(session, count=1000)
        print(f"RESULT: {res}")

if __name__ == "__main__":
    asyncio.run(main())
