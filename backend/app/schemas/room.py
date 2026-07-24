import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.user import UserResponse


class ParticipantControlRequest(BaseModel):
    is_muted: Optional[bool] = None
    hand_raised: Optional[bool] = None
    role: Optional[str] = None


class RoomParticipantResponse(BaseModel):
    id: uuid.UUID
    room_id: uuid.UUID
    user_id: uuid.UUID
    role: str
    is_muted: bool
    hand_raised: bool
    is_connected: bool
    joined_at: datetime
    left_at: Optional[datetime] = None
    user: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


class RoomCreate(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    is_private: bool = False
    passcode: Optional[str] = None
    max_participants: int = Field(50, ge=2, le=500)


class RoomUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    is_private: Optional[bool] = None
    passcode: Optional[str] = None
    is_active: Optional[bool] = None
    max_participants: Optional[int] = Field(None, ge=2, le=500)


class RoomJoinRequest(BaseModel):
    passcode: Optional[str] = None


class RoomResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str] = None
    room_code: str
    owner_id: uuid.UUID
    is_private: bool
    is_active: bool
    max_participants: int
    created_at: datetime
    updated_at: datetime
    owner: Optional[UserResponse] = None
    participants: List[RoomParticipantResponse] = []

    model_config = ConfigDict(from_attributes=True)
