import time
import json
import logging
import httpx
from typing import AsyncGenerator, Dict, Any, List
from app.services.llm.provider import BaseLLMProvider
from app.config import settings

logger = logging.getLogger(__name__)

class OllamaProvider(BaseLLMProvider):
    """Local Ollama provider using OpenAI-compatible /v1/chat/completions endpoint."""

    def __init__(self, base_url: str = None, model: str = None, timeout: float = None):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.model = model or settings.OLLAMA_MODEL
        self.timeout = timeout or settings.LLM_TIMEOUT_SECONDS

    @property
    def name(self) -> str:
        return "ollama"

    @property
    def model_name(self) -> str:
        return self.model

    async def is_reachable(self) -> tuple[bool, float]:
        start = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                # Ping models list or tags endpoint
                url = f"{self.base_url}/models"
                res = await client.get(url)
                latency_ms = round((time.perf_counter() - start) * 1000, 2)
                if res.status_code == 200:
                    return True, latency_ms
                return False, latency_ms
        except Exception as e:
            latency_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.debug(f"Ollama health check failed: {e}")
            return False, latency_ms

    async def generate(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 1024
    ) -> str:
        url = f"{self.base_url}/chat/completions"
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            res = await client.post(url, json=payload)
            res.raise_for_status()
            data = res.json()
            return data["choices"][0]["message"]["content"].strip()

    async def generate_stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 1024
    ) -> AsyncGenerator[str, None]:
        url = f"{self.base_url}/chat/completions"
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            async with client.stream("POST", url, json=payload) as response:
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
