from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, selectinload

from app.models.prompt import (
    Prompt,
    PromptItemType,
    PromptStatus,
    PromptTag,
    PromptVersion,
    PromptVersionStatus,
)

Cursor = str


async def list_prompts(
    db: AsyncSession,
    *,
    limit: int = 50,
    since: Optional[datetime] = None,
) -> tuple[list[Prompt], Optional[Cursor]]:
    query: Select[tuple[Prompt]] = select(Prompt).options(
        selectinload(Prompt.current_version), selectinload(Prompt.tag_links)
    )
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
        .options(selectinload(Prompt.current_version), selectinload(Prompt.tag_links))
        .where(Prompt.id == prompt_id)
    )
    return result.scalar_one_or_none()


async def create_prompt(
    db: AsyncSession,
    *,
    name: str,
    display_name: str,
    description: Optional[str],
    item_type: PromptItemType = PromptItemType.PROMPT,
    tags: Optional[list[str]] = None,
    content: str,
    notes: Optional[str],
    created_by: Optional[UUID] = None,
) -> Prompt:
    now = datetime.now(timezone.utc)
    prompt = Prompt(
        name=name,
        display_name=display_name,
        description=description,
        item_type=item_type,
        status=PromptStatus.ACTIVE,
        created_at=now,
        updated_at=now,
    )

    if tags:
        # Deduplicate while preserving order
        seen = set()
        prompt.tags = [tag for tag in tags if not (tag in seen or seen.add(tag))]

    version = PromptVersion(
        prompt=prompt,
        version_number=1,
        status=PromptVersionStatus.APPROVED,
        content=content,
        notes=notes,
        created_by=created_by,
        approved_by=created_by,
        approved_at=now,
        created_at=now,
        updated_at=now,
    )
    prompt.current_version = version

    db.add(prompt)
    await db.flush()
    await db.refresh(version)
    await db.refresh(
        prompt,
        attribute_names=["current_version", "tag_links", "created_at", "updated_at"],
    )
    return prompt


async def search_library(
    db: AsyncSession,
    *,
    query: str = "",
    limit: int = 30,
) -> list[Prompt]:
    term = query.strip().lower()
    current_version = aliased(PromptVersion)
    stmt: Select[Prompt] = (
        select(Prompt)
        .join(current_version, Prompt.current_version_id == current_version.id)
        .options(selectinload(Prompt.current_version), selectinload(Prompt.tag_links))
    )

    if term:
        pattern = f"%{term}%"
        stmt = stmt.where(
            or_(
                func.lower(Prompt.display_name).like(pattern),
                func.lower(Prompt.description).like(pattern),
                func.lower(current_version.content).like(pattern),
                Prompt.tag_links.any(func.lower(PromptTag.tag).like(pattern)),
            )
        )

    # Fetch a window ordered by recency, then score in Python for simple relevance ranking.
    stmt = stmt.order_by(Prompt.updated_at.desc()).limit(limit * 3)
    result = await db.execute(stmt)
    prompts = result.scalars().unique().all()

    def score(p: Prompt) -> int:
        if not term:
            return 0
        lower = term
        title_hit = 3 if lower in p.display_name.lower() else 0
        tag_hit = 2 if any(lower in tag.lower() for tag in p.tags) else 0
        body_hit = 1 if p.current_version and lower in p.current_version.content.lower() else 0
        return title_hit + tag_hit + body_hit

    min_dt = datetime.min.replace(tzinfo=timezone.utc)
    ranked = sorted(
        prompts,
        key=lambda p: (
            score(p),
            p.updated_at or min_dt,
            p.created_at or min_dt,
            str(p.id),
        ),
        reverse=True,
    )
    return ranked[:limit]
