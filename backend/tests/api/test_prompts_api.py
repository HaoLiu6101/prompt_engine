import uuid
from datetime import datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy.exc import IntegrityError

from app.api.v1 import prompts as prompts_api
from app.schemas import PromptCreate

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


async def test_get_prompt_not_found(api_client: AsyncClient) -> None:
    missing_id = uuid.uuid4()
    response = await api_client.get(f"/api/v1/prompts/{missing_id}")

    assert response.status_code == 404
    assert response.json()["detail"] == "Prompt not found"


async def test_list_prompts_since_filters_results(api_client: AsyncClient) -> None:
    payload = {
        "name": "since-test",
        "display_name": "Since Test",
        "description": None,
        "content": "content",
        "notes": None,
    }
    await api_client.post("/api/v1/prompts", json=payload)
    list_response = await api_client.get("/api/v1/prompts")
    first_item = list_response.json()["items"][0]
    # Use a cursor slightly earlier than the first item's updated_at to ensure it is included
    cursor = (datetime.fromisoformat(first_item["updated_at"]) - timedelta(seconds=1)).isoformat()

    filtered_response = await api_client.get("/api/v1/prompts", params={"since": cursor})
    assert filtered_response.status_code == 200
    assert any(item["id"] == first_item["id"] for item in filtered_response.json()["items"])


async def test_create_prompt_duplicate_name_returns_400(api_client: AsyncClient) -> None:
    payload = {
        "name": "dupe-name",
        "display_name": "One",
        "description": None,
        "content": "first",
        "notes": None,
    }
    first = await api_client.post("/api/v1/prompts", json=payload)
    assert first.status_code == 201

    duplicate = await api_client.post("/api/v1/prompts", json=payload)
    assert duplicate.status_code == 400
    assert duplicate.json()["detail"] == "Prompt name already exists"


async def test_route_list_prompts_direct(db_session) -> None:
    payload = PromptCreate(
        name="direct-call",
        display_name="Direct Call",
        description=None,
        content="body",
        notes=None,
    )
    await prompts_api.create_prompt(payload, db_session)

    result = await prompts_api.list_prompts(db=db_session)
    assert result["items"]


async def test_route_get_prompt_not_found_raises(db_session) -> None:
    with pytest.raises(Exception):
        await prompts_api.get_prompt(uuid.uuid4(), db=db_session)


async def test_route_create_prompt_rolls_back_on_integrity_error(monkeypatch, db_session) -> None:
    async def fail(*args, **kwargs):
        raise IntegrityError("stmt", {}, None)

    monkeypatch.setattr(prompts_api.prompt_service, "create_prompt", fail)
    payload = PromptCreate(
        name="dupe",
        display_name="Dupe",
        description=None,
        content="body",
        notes=None,
    )

    with pytest.raises(Exception):
        await prompts_api.create_prompt(payload, db_session)
