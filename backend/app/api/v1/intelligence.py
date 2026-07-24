import uuid
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.db import get_db
from app.models.room import VoiceRoom
from app.models.user import User
from app.services.transcript_service import TranscriptService
from app.services.llm import get_llm_service
from app.api.deps import get_current_user

router = APIRouter()


class TranslationRequest(BaseModel):
    text: str
    target_language: str
    source_language: Optional[str] = None


class SentimentRequest(BaseModel):
    text: Optional[str] = None


@router.post("/rooms/{room_id}/summary", summary="Generate Meeting Summary & Action Items")
async def generate_room_summary(
    room_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Generate intelligent meeting summary, key decisions, and action items from room transcripts."""
    stmt = select(VoiceRoom).where(VoiceRoom.id == room_id)
    room = (await db.execute(stmt)).scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Voice room not found")

    transcripts = await TranscriptService.get_room_transcripts(db, room_id, limit=500)
    if not transcripts:
        return {
            "room_id": str(room_id),
            "summary": "No transcript records found for this room yet.",
            "key_decisions": [],
            "action_items": []
        }

    full_transcript_text = "\n".join([f"{t.speaker_name}: {t.text}" for t in transcripts])

    llm = get_llm_service()
    result = await llm.summarize_transcript(full_transcript_text)
    result["room_id"] = str(room_id)
    result["room_title"] = room.title
    return result


@router.post("/rooms/{room_id}/translate", summary="Translate Text")
async def translate_text_endpoint(
    room_id: uuid.UUID,
    request: TranslationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Translate text into target language."""
    llm = get_llm_service()
    translated = await llm.translate_text(
        text=request.text,
        target_language=request.target_language,
        source_language=request.source_language
    )
    return {
        "original_text": request.text,
        "translated_text": translated,
        "target_language": request.target_language
    }


@router.post("/rooms/{room_id}/sentiment", summary="Analyze Room Sentiment")
async def analyze_room_sentiment(
    room_id: uuid.UUID,
    request: Optional[SentimentRequest] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Analyze basic mood/emotion indicators for room transcript history or text payload."""
    if request and request.text:
        text_to_analyze = request.text
    else:
        transcripts = await TranscriptService.get_room_transcripts(db, room_id, limit=50)
        if not transcripts:
            return {"sentiment": "neutral", "confidence_score": 0.5, "message": "No room transcripts available"}
        text_to_analyze = " ".join([t.text for t in transcripts])

    llm = get_llm_service()
    sentiment_info = await llm.analyze_sentiment(text_to_analyze)
    return sentiment_info
