import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.transcript import Transcript
from app.models.user import User


class TranscriptService:
    @staticmethod
    async def create_transcript(
        db: AsyncSession,
        room_id: uuid.UUID,
        user_id: Optional[uuid.UUID],
        speaker_name: str,
        text: str,
        language: str = "en",
        start_time: float = 0.0,
        end_time: float = 0.0,
        sentiment: Optional[str] = None
    ) -> Transcript:
        """Create and store a transcript entry in PostgreSQL."""
        transcript = Transcript(
            room_id=room_id,
            user_id=user_id,
            speaker_name=speaker_name,
            text=text,
            language=language,
            start_time=start_time,
            end_time=end_time,
            sentiment=sentiment
        )
        db.add(transcript)
        await db.commit()
        await db.refresh(transcript)
        return transcript

    @staticmethod
    async def get_room_transcripts(
        db: AsyncSession,
        room_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100
    ) -> List[Transcript]:
        """Fetch transcripts for a specific room ordered by creation time."""
        stmt = (
            select(Transcript)
            .where(Transcript.room_id == room_id)
            .order_by(Transcript.created_at.asc())
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def format_export(
        db: AsyncSession,
        room_id: uuid.UUID,
        format_type: str = "txt"
    ) -> str:
        """Format room transcripts into downloadable TXT or JSON string."""
        transcripts = await TranscriptService.get_room_transcripts(db, room_id, limit=1000)

        if format_type.lower() == "json":
            import json
            data = [
                {
                    "id": str(t.id),
                    "speaker": t.speaker_name,
                    "text": t.text,
                    "language": t.language,
                    "start_time": t.start_time,
                    "end_time": t.end_time,
                    "timestamp": t.created_at.isoformat()
                }
                for t in transcripts
            ]
            return json.dumps(data, indent=2)

        # Default TXT format
        lines = []
        for t in transcripts:
            timestamp = t.created_at.strftime("%H:%M:%S")
            lines.append(f"[{timestamp}] {t.speaker_name} ({t.language}): {t.text}")
        return "\n".join(lines)
