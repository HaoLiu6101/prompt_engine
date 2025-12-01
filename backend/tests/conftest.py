import os
import sys
from collections.abc import AsyncIterator
from pathlib import Path
import importlib

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

# Force the app to use an in-memory sqlite URL and "test" env before modules are imported.
os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")

from app.core import config as app_config
from app.db import session as app_session

app_config._get_settings.cache_clear()
importlib.reload(app_config)
importlib.reload(app_session)

from app.api.deps import get_db
from app.db.base import Base
from app import main


@pytest.fixture(scope="session")
def anyio_backend() -> str:
    # Keep httpx/pytest-asyncio aligned on asyncio backend
    return "asyncio"


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    # Reuse the session module's engine so startup/init_models use the same sqlite database.
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    app_session.engine = engine
    app_session.AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncIterator[AsyncSession]:
    SessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
    async with SessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def app_client(db_session: AsyncSession) -> AsyncIterator[AsyncClient]:
    async def _override_get_db():
        yield db_session

    main.app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=main.app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client
    main.app.dependency_overrides.clear()
