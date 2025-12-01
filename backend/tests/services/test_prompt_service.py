from datetime import datetime, timedelta, timezone
import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.prompt import PromptStatus, PromptVersionStatus
from app.services import prompt_service

pytestmark = pytest.mark.asyncio


async def test_create_prompt_sets_defaults(db_session: AsyncSession) -> None:
    prompt = await prompt_service.create_prompt(
        db_session,
        name="svc-test",
        display_name="Service Test",
        description="desc",
        content="content",
        notes="notes",
    )
    await db_session.commit()
    await db_session.refresh(prompt, attribute_names=["current_version"])

    assert prompt.status == PromptStatus.ACTIVE
    assert prompt.current_version is not None
    assert prompt.current_version.version_number == 1
    assert prompt.current_version.status == PromptVersionStatus.APPROVED
    assert prompt.current_version.content == "content"
    assert prompt.current_version.approved_at is not None


async def test_get_prompt_returns_none_for_missing(db_session: AsyncSession) -> None:
    result = await prompt_service.get_prompt(db_session, uuid.uuid4())
    assert result is None


async def test_list_prompts_paginates_and_orders(db_session: AsyncSession) -> None:
    now = datetime.now(timezone.utc)
    prompts = []
    for idx in range(3):
        prompt = await prompt_service.create_prompt(
            db_session,
            name=f"prompt-{idx}",
            display_name=f"Prompt {idx}",
            description=None,
            content=f"content-{idx}",
            notes=None,
        )
        prompt.updated_at = now + timedelta(seconds=idx)
        prompts.append(prompt)
    await db_session.commit()

    items, next_cursor = await prompt_service.list_prompts(db_session, limit=2)
    assert len(items) == 2
    assert items[0].name == "prompt-2"  # newest first
    assert items[1].name == "prompt-1"
    assert next_cursor is not None

    # Filter using since cursor to only get newest item
    items_filtered, next_cursor_filtered = await prompt_service.list_prompts(
        db_session, since=items[1].updated_at
    )
    assert [p.name for p in items_filtered] == ["prompt-2"]
    assert next_cursor_filtered is None
