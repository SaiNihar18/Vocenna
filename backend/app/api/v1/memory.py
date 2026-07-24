import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.db import get_db
from app.models.room import VoiceRoom
from app.models.user import User
from app.services.rag_service import RAGService
from app.services.voice_commands import VoiceCommandParser
from app.api.deps import get_current_user

router = APIRouter()


class RAGQueryRequest(BaseModel):
    question: str
    top_k: int = 5


class VoiceCommandRequest(BaseModel):
    text: str


@router.post("/rooms/{room_id}/memory/query", summary="Conversation Memory RAG Query")
async def query_room_memory(
    room_id: uuid.UUID,
    request: RAGQueryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Query past meeting history using RAG + pgvector cosine similarity search."""
    stmt = select(VoiceRoom).where(VoiceRoom.id == room_id)
    room = (await db.execute(stmt)).scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Voice room not found")

    res = await RAGService.query_memory(
        db=db,
        room_id=room_id,
        question=request.question,
        top_k=request.top_k
    )
    return res


@router.post("/rooms/{room_id}/command", summary="Parse and Execute Voice Command")
async def execute_voice_command(
    room_id: uuid.UUID,
    request: VoiceCommandRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Process natural language voice commands."""
    parsed = VoiceCommandParser.parse_command(request.text)
    return {
        "input_text": request.text,
        "parsed_command": parsed
    }
