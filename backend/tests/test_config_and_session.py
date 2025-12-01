import importlib

import pytest
from sqlalchemy import inspect
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core import config
from app.db import session
from app.db.base import Base


def test_settings_env_overrides(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "prod")
    monkeypatch.setenv("APP_NAME", "custom-app")
    monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")

    config._get_settings.cache_clear()
    settings = config.get_settings()

    assert settings.is_prod is True
    assert settings.is_dev is False
    assert settings.app_name == "custom-app"
    assert settings.database_url.startswith("sqlite+aiosqlite")

    config._get_settings.cache_clear()


@pytest.mark.asyncio
async def test_get_db_uses_injected_session(monkeypatch: pytest.MonkeyPatch) -> None:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    monkeypatch.setattr(session, "AsyncSessionLocal", SessionLocal)

    gen = session.get_db()
    db = await anext(gen)
    assert isinstance(db, AsyncSession)
    await gen.aclose()
    await engine.dispose()


@pytest.mark.asyncio
async def test_init_models_creates_tables(monkeypatch: pytest.MonkeyPatch) -> None:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    monkeypatch.setattr(session, "engine", engine)

    await session.init_models()

    async with engine.begin() as conn:
        table_names = await conn.run_sync(lambda c: inspect(c).get_table_names())
    assert "prompts" in table_names
    assert "prompt_versions" in table_names
    await engine.dispose()
