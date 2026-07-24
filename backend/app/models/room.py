import uuid
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Boolean, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.participant import RoomParticipant
    from app.models.message import ChatMessage
    from app.models.transcript import Transcript


class VoiceRoom(BaseModel):
    __tablename__ = "voice_rooms"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    room_code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_private: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    passcode_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    max_participants: Mapped[int] = mapped_column(Integer, default=50, nullable=False)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="owned_rooms")
    participants: Mapped[List["RoomParticipant"]] = relationship("RoomParticipant", back_populates="room", cascade="all, delete-orphan")
    messages: Mapped[List["ChatMessage"]] = relationship("ChatMessage", back_populates="room", cascade="all, delete-orphan")
    transcripts: Mapped[List["Transcript"]] = relationship("Transcript", back_populates="room", cascade="all, delete-orphan")
