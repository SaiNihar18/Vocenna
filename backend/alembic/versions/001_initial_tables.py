"""initial_tables

Revision ID: 001_initial_tables
Revises: 
Create Date: 2026-07-24

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial_tables'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ensure pgvector extension exists
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    # 1. users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=True),
        sa.Column('preferred_language', sa.String(length=10), server_default='en', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('is_superuser', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # 2. voice_rooms table
    op.create_table(
        'voice_rooms',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('room_code', sa.String(length=64), nullable=False),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('is_private', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('passcode_hash', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('max_participants', sa.Integer(), server_default='50', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_voice_rooms_id'), 'voice_rooms', ['id'], unique=False)
    op.create_index(op.f('ix_voice_rooms_room_code'), 'voice_rooms', ['room_code'], unique=True)

    # 3. room_participants table
    op.create_table(
        'room_participants',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('room_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('voice_rooms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.String(length=32), server_default='speaker', nullable=False),
        sa.Column('is_muted', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('hand_raised', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_connected', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('joined_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('left_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_room_participants_id'), 'room_participants', ['id'], unique=False)
    op.create_index(op.f('ix_room_participants_room_id'), 'room_participants', ['room_id'], unique=False)
    op.create_index(op.f('ix_room_participants_user_id'), 'room_participants', ['user_id'], unique=False)

    # 4. chat_messages table
    op.create_table(
        'chat_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('room_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('voice_rooms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('original_language', sa.String(length=10), server_default='en', nullable=False),
        sa.Column('translations', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_chat_messages_id'), 'chat_messages', ['id'], unique=False)
    op.create_index(op.f('ix_chat_messages_room_id'), 'chat_messages', ['room_id'], unique=False)
    op.create_index(op.f('ix_chat_messages_user_id'), 'chat_messages', ['user_id'], unique=False)

    # 5. transcripts table
    op.create_table(
        'transcripts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('room_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('voice_rooms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('speaker_name', sa.String(length=255), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('language', sa.String(length=10), server_default='en', nullable=False),
        sa.Column('start_time', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('end_time', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('sentiment', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_transcripts_id'), 'transcripts', ['id'], unique=False)
    op.create_index(op.f('ix_transcripts_room_id'), 'transcripts', ['room_id'], unique=False)


def downgrade() -> None:
    op.drop_table('transcripts')
    op.drop_table('chat_messages')
    op.drop_table('room_participants')
    op.drop_table('voice_rooms')
    op.drop_table('users')
