from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.schemas import PromptCreate, PromptListResponse, PromptResponse
from app.services import prompt_service

router = APIRouter(prefix="/prompts", tags=["prompts"])


@router.get("", response_model=PromptListResponse)
async def list_prompts(
    since: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    since_dt = None
    if since:
        try:
            since_dt = datetime.fromisoformat(since)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid since cursor") from exc

    prompts, next_cursor = await prompt_service.list_prompts(db, since=since_dt)
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
            content=payload.content,
            notes=payload.notes,
        )
        await db.commit()
        # Ensure related current_version is loaded to avoid async lazy-load during response serialization
        await db.refresh(prompt, attribute_names=["current_version"])
        return prompt
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Prompt name already exists") from exc
