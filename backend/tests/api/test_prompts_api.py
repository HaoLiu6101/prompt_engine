import uuid

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_health(api_client: AsyncClient) -> None:
    response = await api_client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_create_and_fetch_prompt(api_client: AsyncClient) -> None:
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "name": f"smoke-{suffix}",
        "display_name": f"Smoke Test {suffix}",
        "description": "created via CI smoke test",
        "content": "return the input untouched",
        "notes": "initial version",
    }

    create_response = await api_client.post("/api/v1/prompts", json=payload)
    assert create_response.status_code == 201

    created = create_response.json()
    prompt_id = created["id"]
    assert created["name"] == payload["name"]
    assert created["current_version"]["version_number"] == 1
    assert created["current_version"]["content"] == payload["content"]

    detail_response = await api_client.get(f"/api/v1/prompts/{prompt_id}")
    assert detail_response.status_code == 200

    detail = detail_response.json()
    assert detail["name"] == payload["name"]
    assert detail["display_name"] == payload["display_name"]
    assert detail["current_version"]["content"] == payload["content"]

    list_response = await api_client.get("/api/v1/prompts")
    assert list_response.status_code == 200

    items = list_response.json()["items"]
    assert any(item["id"] == prompt_id for item in items)


async def test_prompts_requires_valid_since_cursor(api_client: AsyncClient) -> None:
    response = await api_client.get("/api/v1/prompts", params={"since": "not-a-date"})

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid since cursor"
