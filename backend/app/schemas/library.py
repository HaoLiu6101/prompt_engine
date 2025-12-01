from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.prompt import PromptItemType


class LibraryItemResponse(BaseModel):
    id: UUID
    title: str
    body: str
    item_type: PromptItemType
    tags: list[str] = []
    version: int
    created_at: datetime
    updated_at: datetime
    source: str = "db"


class LibrarySearchResponse(BaseModel):
    items: list[LibraryItemResponse]
