from collections.abc import AsyncGenerator

from motor.motor_asyncio import AsyncIOMotorClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import get_settings

settings = get_settings()

mongo_client = None

DATABASE_URL = (
    f"postgresql+asyncpg://"
    f"{settings.postgres_user}:"
    f"{settings.postgres_password}@"
    f"{settings.postgres_host}:"
    f"{settings.postgres_port}/"
    f"{settings.postgres_db}"
)

engine = create_async_engine(DATABASE_URL)

AsyncSessionLocal = async_sessionmaker(
    engine,
    expire_on_commit=False,
)


async def connect_to_mongo():
    global mongo_client

    mongo_client = AsyncIOMotorClient(settings.mongo_url)


async def close_mongo_connection():
    global mongo_client

    if mongo_client:
        mongo_client.close()


async def database():
    yield mongo_client[settings.mongo_db_name]


async def postgres_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session