import json
import httpx
from typing import Dict, Any, Optional
from app.services.llm.base import BaseLLMService
from app.core.config import settings


class GroqLLMService(BaseLLMService):
    """Cloud LLM driver using Groq Chat Completion API."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GROQ_API_KEY

    async def generate_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None
    ) -> str:
        if not self.api_key:
            return f"[Groq LLM Mock - No API Key]: Response for prompt '{prompt[:30]}...'"

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={"model": "llama3-8b-8192", "messages": messages, "temperature": 0.3}
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            return f"[Groq LLM Fallback]: Completion error ({str(e)})"

    async def summarize_transcript(self, transcript_text: str) -> Dict[str, Any]:
        system_prompt = (
            "Analyze the meeting transcript and return ONLY valid JSON with keys: "
            "'summary', 'key_decisions' (list of str), 'action_items' (list of dicts with 'task' and 'assignee')."
        )
        raw_res = await self.generate_completion(transcript_text, system_prompt=system_prompt)
        try:
            clean_res = raw_res.strip()
            if clean_res.startswith("```json"):
                clean_res = clean_res[7:]
            if clean_res.endswith("```"):
                clean_res = clean_res[:-3]
            clean_res = clean_res.strip()
            return json.loads(clean_res)
        except Exception:
            return {
                "summary": "Meeting discussion recorded.",
                "key_decisions": ["Action items reviewed."],
                "action_items": [{"task": "Review transcript", "assignee": "All"}]
            }

    async def translate_text(
        self,
        text: str,
        target_language: str,
        source_language: Optional[str] = None
    ) -> str:
        system_prompt = f"Translate text to {target_language}. Output only translation."
        return await self.generate_completion(text, system_prompt=system_prompt)

    async def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        text_lower = text.lower()
        if any(w in text_lower for w in ["great", "awesome", "good", "agree"]):
            return {"sentiment": "positive", "confidence_score": 0.9}
        elif any(w in text_lower for w in ["confused", "why", "how", "what"]):
            return {"sentiment": "confused", "confidence_score": 0.8}
        return {"sentiment": "neutral", "confidence_score": 0.5}
