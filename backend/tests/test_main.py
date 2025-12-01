import pytest

from app import main

pytestmark = pytest.mark.asyncio


async def test_startup_runs_init_models(monkeypatch: pytest.MonkeyPatch) -> None:
    called = False

    async def fake_init_models() -> None:
        nonlocal called
        called = True

    monkeypatch.setattr(main, "init_models", fake_init_models)
    monkeypatch.setattr(main.settings, "app_env", "dev")

    async with main.lifespan(main.app):
        assert called is True
