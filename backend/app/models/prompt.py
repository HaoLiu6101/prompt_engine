import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

JSONDict = JSON().with_variant(JSONB, "postgresql")


class PromptStatus(str, enum.Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"


class PromptVersionStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    DEPRECATED = "deprecated"


class Prompt(Base):
    __tablename__ = "prompts"
    __table_args__ = (
        UniqueConstraint("name", name="idx_prompts_name_unique"),
        CheckConstraint("status in ('active', 'archived')", name="chk_prompts_status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    collection_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    owner_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    status: Mapped[PromptStatus] = mapped_column(
        String(32), nullable=False, default=PromptStatus.ACTIVE.value
    )
    current_version_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("prompt_versions.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # Explicitly tie versions to prompt_versions.prompt_id to avoid ambiguity with current_version_id
    versions: Mapped[list["PromptVersion"]] = relationship(
        back_populates="prompt",
        cascade="all, delete-orphan",
        order_by="PromptVersion.version_number",
        foreign_keys="PromptVersion.prompt_id",
    )
    current_version: Mapped[Optional["PromptVersion"]] = relationship(
        "PromptVersion", foreign_keys=[current_version_id], post_update=True
    )


class PromptVersion(Base):
    __tablename__ = "prompt_versions"
    __table_args__ = (
        UniqueConstraint("prompt_id", "version_number", name="uq_prompt_versions_prompt_version"),
        CheckConstraint(
            "status in ('draft', 'pending_approval', 'approved', 'rejected', 'deprecated')",
            name="chk_prompt_versions_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prompt_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("prompts.id"), nullable=False
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[PromptVersionStatus] = mapped_column(
        String(32), nullable=False, default=PromptVersionStatus.APPROVED.value
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    input_schema: Mapped[Optional[dict]] = mapped_column(JSONDict, nullable=True)
    parameters: Mapped[Optional[dict]] = mapped_column(JSONDict, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    approved_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Disambiguate the relationship path for SQLAlchemy (multiple FK paths exist)
    prompt: Mapped[Prompt] = relationship(
        back_populates="versions", foreign_keys=[prompt_id]
    )
