import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse


class ChatMessageCreate(BaseModel):
    content: str
    original_language: str = "en"


class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    room_id: uuid.UUID
    user_id: uuid.UUID
    content: str
    original_language: str
    translations: Optional[Dict[str, Any]] = None
    created_at: datetime
    user: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)
