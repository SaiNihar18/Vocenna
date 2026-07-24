from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class BaseSTTService(ABC):
    """Abstract interface for Speech-To-Text services."""

    @abstractmethod
    async def transcribe_bytes(
        self,
        audio_bytes: bytes,
        language: Optional[str] = None
    ) -> Dict[str, Any]:
        """Transcribe raw audio bytes into text.
        
        Returns:
            dict with keys:
                - text (str): Transcribed text
                - language (str): Identified or specified language
                - segments (list): Detailed segment timestamps
        """
        pass
