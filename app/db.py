from collections.abc import AsyncIterator

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import get_settings


client: AsyncIOMotorClient | None = None


async def connect_to_mongo() -> None:
    global client

    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongo_url, tz_aware=True)
    await client.admin.command("ping")


async def close_mongo_connection() -> None:
    global client

    if client is not None:
        client.close()
        client = None


def get_database() -> AsyncIOMotorDatabase:
    if client is None:
        raise RuntimeError("MongoDB client is not initialized")

    settings = get_settings()
    return client[settings.mongo_db_name]


async def database() -> AsyncIterator[AsyncIOMotorDatabase]:
    yield get_database()
