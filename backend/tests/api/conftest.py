import asyncio
import os
from collections.abc import AsyncIterator

import pytest
import pytest_asyncio
from httpx import AsyncClient


API_READY_PATH = "/health"


async def _wait_for_service(client: AsyncClient, retries: int = 15, delay: float = 1.0) -> None:
    """Poll the API until the health endpoint responds."""

    for attempt in range(retries):
        try:
            response = await client.get(API_READY_PATH)
            if response.status_code == 200:
                return
        except Exception:
            pass
        await asyncio.sleep(delay)

    raise RuntimeError(
        f"API not reachable at {client.base_url}{API_READY_PATH} after {retries} attempts"
    )


@pytest.fixture
def api_base_url() -> str:
    """Base URL for the running API service (override with API_BASE_URL env)."""

    return os.getenv("API_BASE_URL", "http://localhost:8000")


@pytest_asyncio.fixture
async def api_client(api_base_url: str) -> AsyncIterator[AsyncClient]:
    async with AsyncClient(base_url=api_base_url, timeout=10.0) as client:
        await _wait_for_service(client)
        yield client
