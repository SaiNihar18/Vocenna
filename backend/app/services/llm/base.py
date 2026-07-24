from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List


class BaseLLMService(ABC):
    """Abstract interface for LLM services."""

    @abstractmethod
    async def generate_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None
    ) -> str:
        """Generate raw completion from LLM."""
        pass

    @abstractmethod
    async def summarize_transcript(
        self,
        transcript_text: str
    ) -> Dict[str, Any]:
        """Generate structured summary, key decisions, and action items from transcript."""
        pass

    @abstractmethod
    async def translate_text(
        self,
        text: str,
        target_language: str,
        source_language: Optional[str] = None
    ) -> str:
        """Translate text into target language."""
        pass

    @abstractmethod
    async def analyze_sentiment(
        self,
        text: str
    ) -> Dict[str, Any]:
        """Analyze basic mood/emotion indicators (positive, confused, energetic, neutral)."""
        pass
