from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1 import api_router
from app.core.config import get_settings
from app.db.session import init_models

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables automatically in development environments.
    if settings.is_dev:
        await init_models()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(api_router, prefix=settings.api_v1_prefix)
