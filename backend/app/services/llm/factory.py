from app.core.config import settings
from app.services.llm.base import BaseLLMService
from app.services.llm.ollama import OllamaLLMService
from app.services.llm.cloud_api import CloudOpenAILLMService
from app.services.llm.huggingface import HuggingFaceLLMService


def get_llm_service() -> BaseLLMService:
    """Factory function returning active LLM service driver based on configuration."""
    driver_type = settings.LLM_SERVICE_TYPE.lower()
    if driver_type == "cloud_api":
        return CloudOpenAILLMService()
    elif driver_type == "huggingface":
        return HuggingFaceLLMService()
    else:
        # Default to local Ollama (Llama 3)
        return OllamaLLMService()
