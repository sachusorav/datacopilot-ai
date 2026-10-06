import time
import json
import logging
import httpx
from typing import AsyncGenerator, Dict, Any, List
from app.services.llm.provider import BaseLLMProvider
from app.config import settings

logger = logging.getLogger(__name__)

class GroqProvider(BaseLLMProvider):
    """Hosted Groq free-tier provider using OpenAI-compatible /v1/chat/completions endpoint."""

    def __init__(self, api_key: str = None, model: str = None, timeout: float = None):
        self.api_key = api_key or settings.GROQ_API_KEY
        self.model = model or settings.GROQ_MODEL
        self.base_url = "https://api.groq.com/openai/v1"
        self.timeout = timeout or settings.LLM_TIMEOUT_SECONDS

    @property
    def name(self) -> str:
        return "groq"

    @property
    def model_name(self) -> str:
        return self.model

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    async def is_reachable(self) -> tuple[bool, float]:
        if not self.api_key:
            return False, 0.0
        start = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                url = f"{self.base_url}/models"
                res = await client.get(url, headers=self._headers())
                latency_ms = round((time.perf_counter() - start) * 1000, 2)
                if res.status_code == 200:
                    return True, latency_ms
                return False, latency_ms
        except Exception as e:
            latency_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.debug(f"Groq health check failed: {e}")
            return False, latency_ms

    async def generate(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 1024
    ) -> str:
        if not self.api_key:
            raise ValueError("GROQ_API_KEY is not configured.")
        url = f"{self.base_url}/chat/completions"
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            res = await client.post(url, json=payload, headers=self._headers())
            res.raise_for_status()
            data = res.json()
            return data["choices"][0]["message"]["content"].strip()

    async def generate_stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 1024
    ) -> AsyncGenerator[str, None]:
        if not self.api_key:
            raise ValueError("GROQ_API_KEY is not configured.")
        url = f"{self.base_url}/chat/completions"
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            async with client.stream("POST", url, json=payload, headers=self._headers()) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            parsed = json.loads(data_str)
                            delta = parsed["choices"][0]["delta"]
                            if "content" in delta and delta["content"]:
                                yield delta["content"]
                        except Exception:
                            continue
