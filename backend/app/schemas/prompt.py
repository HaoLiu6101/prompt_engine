from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.prompt import PromptStatus, PromptVersionStatus


class PromptVersionResponse(BaseModel):
    id: UUID
    version_number: int
    status: PromptVersionStatus
    content: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PromptResponse(BaseModel):
    id: UUID
    name: str
    display_name: str
    description: Optional[str] = None
    status: PromptStatus
    current_version: Optional[PromptVersionResponse] = Field(
        None, description="Current approved version"
    )
    updated_at: datetime

    model_config = {"from_attributes": True}


class PromptCreate(BaseModel):
    name: str = Field(..., description="Machine-readable name, unique")
    display_name: str
    description: Optional[str] = None
    content: str = Field(..., description="Prompt body")
    notes: Optional[str] = None


class PromptListResponse(BaseModel):
    items: list[PromptResponse]
    next_cursor: Optional[str] = None
