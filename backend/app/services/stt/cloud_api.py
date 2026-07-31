import httpx
import tempfile
import os
from typing import Dict, Any, Optional
from app.services.stt.base import BaseSTTService
from app.core.config import settings
from app.services.stt.groq import get_audio_format_and_ext

class CloudOpenAISTTService(BaseSTTService):
    """Cloud API STT driver using OpenAI Whisper endpoint."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY

    async def transcribe_bytes(
        self,
        audio_bytes: bytes,
        language: Optional[str] = None
    ) -> Dict[str, Any]:
        if not audio_bytes:
            return {"text": "", "language": language or "en", "segments": []}

        if not self.api_key:
            return {
                "text": f"[Cloud STT Mock - No API Key]: Transcribed {len(audio_bytes)} bytes",
                "language": language or "en",
                "segments": []
            }

        mime_type, suffix = get_audio_format_and_ext(audio_bytes)
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                with open(tmp_path, "rb") as audio_file:
                    data = {"model": "whisper-1", "response_format": "json"}
                    if language:
                        data["language"] = language

                    filename = f"audio{suffix}"
                    files = {"file": (filename, audio_file, mime_type)}
                    headers = {"Authorization": f"Bearer {self.api_key}"}

                    response = await client.post(
                        "https://api.openai.com/v1/audio/transcriptions",
                        data=data,
                        files=files,
                        headers=headers
                    )
                    response.raise_for_status()
                    res_data = response.json()
                    return {
                        "text": res_data.get("text", ""),
                        "language": language or "en",
                        "segments": []
                    }
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
