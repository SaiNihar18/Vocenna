from app.core.config import settings
from app.services.stt.base import BaseSTTService
from app.services.stt.whisper_local import FasterWhisperSTTService
from app.services.stt.cloud_api import CloudOpenAISTTService
from app.services.stt.groq import GroqSTTService


def get_stt_service() -> BaseSTTService:
    """Factory function returning active STT service driver based on configuration."""
    driver_type = settings.STT_SERVICE_TYPE.lower()
    if driver_type == "cloud_api":
        return CloudOpenAISTTService()
    elif driver_type == "groq":
        return GroqSTTService()
    else:
        # Default to local faster-whisper
        return FasterWhisperSTTService()
