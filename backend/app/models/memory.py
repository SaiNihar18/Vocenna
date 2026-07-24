import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.room import VoiceRoom
    from app.models.transcript import Transcript


class TranscriptEmbedding(BaseModel):
    __tablename__ = "transcript_embeddings"

    room_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("voice_rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    transcript_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("transcripts.id", ondelete="CASCADE"), nullable=False, index=True)
    speaker_name: Mapped[str] = mapped_column(String(255), nullable=False)
    text_content: Mapped[str] = mapped_column(Text, nullable=False)
    # 384-dimensional vector embedding column using pgvector
    embedding: Mapped[Vector] = mapped_column(Vector(384), nullable=False)

    # Relationships
    room: Mapped["VoiceRoom"] = relationship("VoiceRoom")
    transcript: Mapped["Transcript"] = relationship("Transcript")
