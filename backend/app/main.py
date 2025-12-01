from fastapi import FastAPI

from app.api.v1 import api_router
from app.core.config import get_settings
from app.db.session import init_models

settings = get_settings()
app = FastAPI(title=settings.app_name)


@app.on_event("startup")
async def on_startup() -> None:
    if settings.is_dev:
        await init_models()


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(api_router, prefix=settings.api_v1_prefix)
