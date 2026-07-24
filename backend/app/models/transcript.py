import uuid
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.room import VoiceRoom


class Transcript(BaseModel):
    __tablename__ = "transcripts"

    room_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("voice_rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    speaker_name: Mapped[str] = mapped_column(String(255), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    start_time: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    end_time: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    sentiment: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Relationships
    room: Mapped["VoiceRoom"] = relationship("VoiceRoom", back_populates="transcripts")
