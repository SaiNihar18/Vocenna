import os
import tempfile
import asyncio
from typing import Dict, Any, Optional
from app.services.stt.base import BaseSTTService
from app.core.config import settings


class FasterWhisperSTTService(BaseSTTService):
    """Local STT driver powered by faster-whisper."""

    def __init__(self, model_size: Optional[str] = None):
        self.model_size = model_size or settings.WHISPER_MODEL_SIZE
        self._model = None

    def _get_model(self):
        if self._model is None:
            try:
                from faster_whisper import WhisperModel
                # Run on CPU with float32 or INT8 by default for universal compatibility
                self._model = WhisperModel(self.model_size, device="cpu", compute_type="int8")
            except ImportError:
                print("Warning: faster-whisper not installed. Falling back to mock transcription mode.")
                self._model = "mock"
        return self._model

    async def transcribe_bytes(
        self,
        audio_bytes: bytes,
        language: Optional[str] = None
    ) -> Dict[str, Any]:
        if not audio_bytes:
            return {"text": "", "language": language or "en", "segments": []}

        model = self._get_model()

        if model == "mock":
            # Mock fallback for lightweight development environments without faster-whisper binary
            await asyncio.sleep(0.05)
            return {
                "text": f"[Mock STT]: Transcribed audio chunk ({len(audio_bytes)} bytes)",
                "language": language or "en",
                "segments": [{"start": 0.0, "end": 2.0, "text": f"[Mock STT]: Transcribed audio chunk ({len(audio_bytes)} bytes)"}]
            }

        # Write bytes to temporary file for faster-whisper to process
        def _sync_transcribe():
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name

            try:
                segments, info = model.transcribe(tmp_path, language=language, beam_size=5)
                segment_list = []
                full_text_parts = []
                for s in segments:
                    segment_list.append({
                        "start": s.start,
                        "end": s.end,
                        "text": s.text.strip()
                    })
                    full_text_parts.append(s.text.strip())

                return {
                    "text": " ".join(full_text_parts),
                    "language": info.language if hasattr(info, "language") else (language or "en"),
                    "segments": segment_list
                }
            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)

        return await asyncio.to_thread(_sync_transcribe)
