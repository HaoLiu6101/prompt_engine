from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.db.base import Base

settings = get_settings()
engine = create_async_engine(settings.database_url, echo=settings.is_dev, future=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a DB session."""

    async with AsyncSessionLocal() as session:
        yield session


async def init_models() -> None:
    """Create tables in dev environments without running migrations explicitly."""

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
