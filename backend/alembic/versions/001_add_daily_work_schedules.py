"""Add daily_work_schedules table

Revision ID: 001
Revises:
Create Date: 2025-12-18

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from datetime import time


# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create daily_work_schedules table
    op.create_table(
        'daily_work_schedules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('day_of_week', sa.Integer(), nullable=False),
        sa.Column('is_workday', sa.Boolean(), nullable=False, default=True),
        sa.Column('check_in_start', sa.Time(), nullable=False),
        sa.Column('check_in_end', sa.Time(), nullable=False),
        sa.Column('check_out_start', sa.Time(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('day_of_week')
    )
    op.create_index(op.f('ix_daily_work_schedules_id'), 'daily_work_schedules', ['id'], unique=False)

    # Insert default schedules
    op.execute("""
        INSERT INTO daily_work_schedules (day_of_week, is_workday, check_in_start, check_in_end, check_out_start)
        VALUES
            (0, TRUE, '07:00:00', '08:00:00', '16:00:00'),
            (1, TRUE, '07:00:00', '08:00:00', '16:00:00'),
            (2, TRUE, '07:00:00', '08:00:00', '16:00:00'),
            (3, TRUE, '07:00:00', '08:00:00', '16:00:00'),
            (4, TRUE, '07:00:00', '08:00:00', '11:30:00'),
            (5, FALSE, '07:00:00', '08:00:00', '16:00:00'),
            (6, FALSE, '07:00:00', '08:00:00', '16:00:00')
    """)


def downgrade() -> None:
    op.drop_index(op.f('ix_daily_work_schedules_id'), table_name='daily_work_schedules')
    op.drop_table('daily_work_schedules')
