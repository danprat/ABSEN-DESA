"""Update audit enums for new entity types and actions

Revision ID: 003_update_audit_enums
Revises: 
Create Date: 2026-01-04

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003_update_audit_enums'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Alter action enum to add REORDER and EXPORT
    op.execute("""
        ALTER TABLE audit_logs
        MODIFY COLUMN action ENUM('CREATE','UPDATE','DELETE','CORRECT','REORDER','EXPORT')
    """)
    
    # Alter entity_type enum to add new entity types
    op.execute("""
        ALTER TABLE audit_logs
        MODIFY COLUMN entity_type ENUM('EMPLOYEE','ATTENDANCE','SETTINGS','HOLIDAY','DAILY_SCHEDULE','ADMIN','SERVICE_TYPE','SURVEY_QUESTION','SURVEY_RESPONSE','GUESTBOOK')
    """)


def downgrade() -> None:
    # Revert action enum
    op.execute("""
        ALTER TABLE audit_logs
        MODIFY COLUMN action ENUM('CREATE','UPDATE','DELETE','CORRECT')
    """)
    
    # Revert entity_type enum
    op.execute("""
        ALTER TABLE audit_logs
        MODIFY COLUMN entity_type ENUM('EMPLOYEE','ATTENDANCE','SETTINGS','HOLIDAY','DAILY_SCHEDULE','ADMIN')
    """)
