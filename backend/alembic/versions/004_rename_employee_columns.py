"""Rename nip to nik and email to address in employees table

Revision ID: 004_rename_employee_columns
Revises: 003_update_audit_enums
Create Date: 2025-01-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '004_rename_employee_columns'
down_revision: Union[str, None] = '003_update_audit_enums'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename nip to nik
    op.alter_column('employees', 'nip',
                    new_column_name='nik',
                    existing_type=sa.String(50),
                    existing_nullable=True)
    
    # Rename email to address and change type to TEXT for longer addresses
    op.alter_column('employees', 'email',
                    new_column_name='address',
                    existing_type=sa.String(100),
                    type_=sa.Text(),
                    existing_nullable=True)


def downgrade() -> None:
    # Revert address back to email
    op.alter_column('employees', 'address',
                    new_column_name='email',
                    existing_type=sa.Text(),
                    type_=sa.String(100),
                    existing_nullable=True)
    
    # Revert nik back to nip
    op.alter_column('employees', 'nik',
                    new_column_name='nip',
                    existing_type=sa.String(50),
                    existing_nullable=True)
