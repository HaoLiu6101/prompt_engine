from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.prompt import Prompt, PromptStatus, PromptVersion, PromptVersionStatus

Cursor = str


async def list_prompts(
    db: AsyncSession,
    *,
    limit: int = 50,
    since: Optional[datetime] = None,
) -> tuple[list[Prompt], Optional[Cursor]]:
    query: Select[tuple[Prompt]] = select(Prompt).options(selectinload(Prompt.current_version))
    if since is not None:
        query = query.where(Prompt.updated_at > since)

    query = query.order_by(Prompt.updated_at.desc()).limit(limit + 1)
    result = await db.execute(query)
    prompts = result.scalars().all()

    next_cursor = None
    if len(prompts) > limit:
        last_prompt = prompts[limit]
        next_cursor = last_prompt.updated_at.isoformat()
        prompts = prompts[:limit]

    return prompts, next_cursor


async def get_prompt(db: AsyncSession, prompt_id: UUID) -> Optional[Prompt]:
    result = await db.execute(
        select(Prompt)
        .options(selectinload(Prompt.current_version))
        .where(Prompt.id == prompt_id)
    )
    return result.scalar_one_or_none()


async def create_prompt(
    db: AsyncSession,
    *,
    name: str,
    display_name: str,
    description: Optional[str],
    content: str,
    notes: Optional[str],
    created_by: Optional[UUID] = None,
) -> Prompt:
    prompt = Prompt(
        name=name,
        display_name=display_name,
        description=description,
        status=PromptStatus.ACTIVE,
    )

    version = PromptVersion(
        prompt=prompt,
        version_number=1,
        status=PromptVersionStatus.APPROVED,
        content=content,
        notes=notes,
        created_by=created_by,
        approved_by=created_by,
        approved_at=func.now(),
    )
    prompt.current_version = version

    db.add(prompt)
    await db.flush()
    await db.refresh(prompt)
    return prompt
