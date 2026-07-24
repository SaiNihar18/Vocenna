import uuid
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.memory import TranscriptEmbedding
from app.services.embeddings import embedding_service
from app.services.llm import get_llm_service


class RAGService:
    @staticmethod
    async def index_transcript(
        db: AsyncSession,
        room_id: uuid.UUID,
        transcript_id: uuid.UUID,
        speaker_name: str,
        text: str
    ) -> TranscriptEmbedding:
        """Generate embedding and index transcript in pgvector store."""
        vector = embedding_service.generate_embedding(text)
        embedding_record = TranscriptEmbedding(
            room_id=room_id,
            transcript_id=transcript_id,
            speaker_name=speaker_name,
            text_content=text,
            embedding=vector
        )
        db.add(embedding_record)
        await db.commit()
        await db.refresh(embedding_record)
        return embedding_record

    @staticmethod
    async def query_memory(
        db: AsyncSession,
        room_id: uuid.UUID,
        question: str,
        top_k: int = 5
    ) -> Dict[str, Any]:
        """Perform semantic search using pgvector and synthesize an LLM answer."""
        query_vector = embedding_service.generate_embedding(question)

        # Distance query using pgvector l2_distance or cosine, with SQLite fallback
        try:
            stmt = (
                select(TranscriptEmbedding)
                .where(TranscriptEmbedding.room_id == room_id)
                .order_by(TranscriptEmbedding.embedding.l2_distance(query_vector))
                .limit(top_k)
            )
            result = await db.execute(stmt)
            matched_records = result.scalars().all()
        except Exception:
            # Fall back to returning standard records for local SQLite testing
            stmt = (
                select(TranscriptEmbedding)
                .where(TranscriptEmbedding.room_id == room_id)
                .limit(top_k)
            )
            result = await db.execute(stmt)
            matched_records = result.scalars().all()


        if not matched_records:
            return {
                "question": question,
                "answer": "I don't have enough recorded context from past meetings to answer this question.",
                "sources": []
            }

        context_lines = [f"[{r.speaker_name}]: {r.text_content}" for r in matched_records]
        context_str = "\n".join(context_lines)

        system_prompt = (
            "You are Vocenna's Conversation Memory AI. Answer the user's question based strictly on the provided "
            "meeting context. If the answer is not mentioned, say so politely."
        )
        prompt = f"Meeting Context:\n{context_str}\n\nUser Question: {question}"

        llm = get_llm_service()
        answer = await llm.generate_completion(prompt, system_prompt=system_prompt)

        sources = [
            {"speaker": r.speaker_name, "text": r.text_content, "transcript_id": str(r.transcript_id)}
            for r in matched_records
        ]

        return {
            "question": question,
            "answer": answer,
            "sources": sources
        }
