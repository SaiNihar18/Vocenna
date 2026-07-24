import uuid
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.db import get_db
from app.models.room import VoiceRoom
from app.models.user import User
from app.services.transcript_service import TranscriptService
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/rooms/{room_id}/transcripts", summary="Get Room Transcripts")
async def get_transcripts(
    room_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get live transcription history for a specific voice room."""
    stmt = select(VoiceRoom).where(VoiceRoom.id == room_id)
    room = (await db.execute(stmt)).scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Voice room not found")

    transcripts = await TranscriptService.get_room_transcripts(db, room_id, skip=skip, limit=limit)
    return [
        {
            "id": str(t.id),
            "speaker_name": t.speaker_name,
            "text": t.text,
            "language": t.language,
            "start_time": t.start_time,
            "end_time": t.end_time,
            "sentiment": t.sentiment,
            "created_at": t.created_at
        }
        for t in transcripts
    ]


@router.get("/rooms/{room_id}/transcripts/export", summary="Export Room Transcript Report")
async def export_transcript(
    room_id: uuid.UUID,
    format: str = Query("txt", pattern="^(txt|json)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Download clean transcript report in TXT or JSON format."""
    stmt = select(VoiceRoom).where(VoiceRoom.id == room_id)
    room = (await db.execute(stmt)).scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Voice room not found")

    content = await TranscriptService.format_export(db, room_id, format_type=format)
    media_type = "application/json" if format == "json" else "text/plain"
    filename = f"vocenna_transcript_{room.room_code}.{format}"

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
