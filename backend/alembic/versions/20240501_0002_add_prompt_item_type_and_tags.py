"""add prompt item_type and tags

Revision ID: 20240501_0002
Revises: 20240418_0001
Create Date: 2024-05-01 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20240501_0002"
down_revision = "20240418_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("prompts", sa.Column("item_type", sa.String(length=32), nullable=True))
    op.execute("UPDATE prompts SET item_type = 'prompt' WHERE item_type IS NULL")
    op.alter_column("prompts", "item_type", nullable=False)
    op.create_check_constraint(
        "chk_prompts_item_type",
        "prompts",
        "item_type in ('prompt', 'snippet', 'faq')",
    )
    op.create_index("idx_prompts_item_type", "prompts", ["item_type"])

    op.create_table(
        "prompt_tags",
        sa.Column(
            "prompt_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("prompts.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
        ),
        sa.Column("tag", sa.String(length=64), primary_key=True, nullable=False),
        sa.UniqueConstraint("prompt_id", "tag", name="uq_prompt_tags_prompt_tag"),
    )
    op.create_index("idx_prompt_tags_tag", "prompt_tags", ["tag"])


def downgrade() -> None:
    op.drop_index("idx_prompt_tags_tag", table_name="prompt_tags")
    op.drop_table("prompt_tags")

    op.drop_index("idx_prompts_item_type", table_name="prompts")
    op.drop_constraint("chk_prompts_item_type", "prompts", type_="check")
    op.drop_column("prompts", "item_type")
