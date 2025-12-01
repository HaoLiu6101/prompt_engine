from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.schemas import (
    LibrarySearchResponse,
    PromptCreate,
    PromptListResponse,
    PromptResponse,
)
from app.services import prompt_service

router = APIRouter(prefix="/prompts", tags=["prompts"])


@router.get("/search", response_model=LibrarySearchResponse)
async def search_library(
    query: str = "",
    limit: int = 30,
    db: AsyncSession = Depends(get_db),
):
    prompts = await prompt_service.search_library(db, query=query, limit=limit)
    items = []
    for prompt in prompts:
        version = prompt.current_version
        if version is None:
            continue

        items.append(
            {
                "id": prompt.id,
                "title": prompt.display_name,
                "body": version.content,
                "item_type": prompt.item_type,
                "tags": list(prompt.tags),
                "version": version.version_number,
                "created_at": prompt.created_at,
                "updated_at": prompt.updated_at,
                "source": "db",
            }
        )

    return {"items": items}


@router.get("", response_model=PromptListResponse)
async def list_prompts(
    since: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    since_dt = None
    if since:
        try:
            since_dt = datetime.fromisoformat(since)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid since cursor") from exc

    prompts, next_cursor = await prompt_service.list_prompts(db, since=since_dt, limit=limit)
    return {"items": prompts, "next_cursor": next_cursor}


@router.get("/{prompt_id}", response_model=PromptResponse)
async def get_prompt(prompt_id: UUID, db: AsyncSession = Depends(get_db)):
    prompt = await prompt_service.get_prompt(db, prompt_id)
    if not prompt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found")
    return prompt


@router.post("", response_model=PromptResponse, status_code=status.HTTP_201_CREATED)
async def create_prompt(payload: PromptCreate, db: AsyncSession = Depends(get_db)):
    try:
        prompt = await prompt_service.create_prompt(
            db,
            name=payload.name,
            display_name=payload.display_name,
            description=payload.description,
            item_type=payload.item_type,
            tags=payload.tags,
            content=payload.content,
            notes=payload.notes,
        )
        await db.commit()
        # Ensure related current_version is loaded to avoid async lazy-load during response serialization
        await db.refresh(
            prompt,
            attribute_names=["current_version", "tag_links", "created_at", "updated_at"],
        )
        return prompt
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Prompt name already exists") from exc


@router.post("", response_model=PromptResponse, status_code=status.HTTP_201_CREATED)
async def create_prompt(payload: PromptCreate, db: AsyncSession = Depends(get_db)):
    try:
        prompt = await prompt_service.create_prompt(
            db,
            name=payload.name,
            display_name=payload.display_name,
            description=payload.description,
            item_type=payload.item_type,
            tags=payload.tags,
            content=payload.content,
            notes=payload.notes,
        )
        await db.commit()
        # Ensure related current_version is loaded to avoid async lazy-load during response serialization
        await db.refresh(
            prompt,
            attribute_names=["current_version", "tag_links", "created_at", "updated_at"],
        )
        return prompt
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Prompt name already exists") from exc
