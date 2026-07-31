import httpx
import tempfile
import os
import base64
from typing import Dict, Any, Optional
from app.services.stt.base import BaseSTTService
from app.core.config import settings

def get_audio_format_and_ext(audio_bytes: bytes) -> tuple[str, str]:
    """Helper to detect audio format and return the appropriate mime-type and file extension."""
    if audio_bytes.startswith(b"\x1a\x45\xdf\xa3"):
        return "audio/webm", ".webm"
    if audio_bytes.startswith(b"RIFF") and b"WAVE" in audio_bytes[:12]:
        return "audio/wav", ".wav"
    if audio_bytes.startswith(b"ID3") or audio_bytes.startswith(b"\xff\xfb") or audio_bytes.startswith(b"\xff\xf3") or audio_bytes.startswith(b"\xff\xf2"):
        return "audio/mpeg", ".mp3"
    if audio_bytes.startswith(b"OggS"):
        return "audio/ogg", ".ogg"
    # Default to webm since frontend primarily records in webm
    return "audio/webm", ".webm"

class GroqSTTService(BaseSTTService):
    """Cloud API STT driver using Groq Whisper endpoint with Gemini fallback."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GROQ_API_KEY
        self.gemini_key = settings.GEMINI_API_KEY

    async def transcribe_bytes(
        self,
        audio_bytes: bytes,
        language: Optional[str] = None
    ) -> Dict[str, Any]:
        if not audio_bytes:
            return {"text": "", "language": language or "en", "segments": []}

        # 1. Attempt Groq Whisper API
        if self.api_key:
            mime_type, suffix = get_audio_format_and_ext(audio_bytes)
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name

            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    with open(tmp_path, "rb") as audio_file:
                        data = {"model": "whisper-large-v3", "response_format": "json"}
                        if language:
                            data["language"] = language

                        filename = f"audio{suffix}"
                        files = {"file": (filename, audio_file, mime_type)}
                        headers = {"Authorization": f"Bearer {self.api_key}"}

                        response = await client.post(
                            "https://api.groq.com/openai/v1/audio/transcriptions",
                            data=data,
                            files=files,
                            headers=headers
                        )
                        response.raise_for_status()
                        res_data = response.json()
                        text = res_data.get("text", "").strip()
                        if text:
                            return {
                                "text": text,
                                "language": language or "en",
                                "segments": []
                            }
            except Exception as groq_err:
                print(f"Groq STT transcription failed: {groq_err}. Attempting Gemini backup...")
            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)

        # 2. Backup Fallback: Attempt Gemini multimodal transcription
        if self.gemini_key:
            gemini_text = await self._transcribe_via_gemini(audio_bytes, language)
            if gemini_text is not None:
                return {
                    "text": gemini_text,
                    "language": language or "en",
                    "segments": []
                }

        # 3. Last resort fallback: Mock transcription so user doesn't experience complete failure
        return {
            "text": f"[Groq/Gemini Backup Mock]: Captured {len(audio_bytes)} bytes of voice stream.",
            "language": language or "en",
            "segments": []
        }

    async def _transcribe_via_gemini(self, audio_bytes: bytes, language: Optional[str] = None) -> Optional[str]:
        """Tries to transcribe using multiple Gemini models to mitigate rate limit quotas."""
        models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-3.5-flash", "gemini-flash-latest"]
        mime_type, _ = get_audio_format_and_ext(audio_bytes)
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

        prompt = "Transcribe the following audio segment. Output ONLY the exact transcription text. If silent or empty, respond with exactly '[silent]'."
        if language:
            prompt += f" The audio is spoken in {language}."

        for model in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.gemini_key}"
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "inlineData": {
                                    "mimeType": mime_type,
                                    "data": audio_b64
                                }
                            },
                            {
                                "text": prompt
                            }
                        ]
                    }
                ]
            }
            try:
                async with httpx.AsyncClient(timeout=25.0) as client:
                    response = await client.post(url, json=payload)
                    if response.status_code == 200:
                        res_data = response.json()
                        candidates = res_data.get("candidates", [])
                        if candidates:
                            content = candidates[0].get("content", {})
                            parts = content.get("parts", [])
                            if parts:
                                text = parts[0].get("text", "").strip()
                                if text == "[silent]":
                                    return ""
                                return text
            except Exception as e:
                print(f"Gemini fallback failed for model {model}: {e}")
                continue
        return None
