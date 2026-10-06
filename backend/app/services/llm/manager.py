import time
import logging
from typing import AsyncGenerator, Dict, Any, List, Optional
from app.config import settings
from app.services.llm.provider import BaseLLMProvider
from app.services.llm.ollama_provider import OllamaProvider
from app.services.llm.groq_provider import GroqProvider

logger = logging.getLogger(__name__)

class LLMManager:
    """
    Manages LLM providers with automatic failover, a 60-second circuit breaker,
    streaming support, and health status reporting.
    """

    def __init__(self):
        self.providers: Dict[str, BaseLLMProvider] = {
            "ollama": OllamaProvider(),
            "groq": GroqProvider()
        }
        self.circuit_breakers: Dict[str, float] = {}  # provider_name -> disabled_until_timestamp
        self.cooldown_seconds: float = 60.0

    def _get_provider_order(self) -> List[str]:
        raw = settings.LLM_PROVIDER_ORDER or "ollama,groq"
        return [p.strip().lower() for p in raw.split(",") if p.strip()]

    def is_circuit_open(self, provider_name: str) -> bool:
        """Returns True if provider is currently disabled by circuit breaker."""
        until = self.circuit_breakers.get(provider_name, 0.0)
        if time.time() < until:
            return True
        return False

    def trip_circuit(self, provider_name: str):
        """Mark provider disabled for 60 seconds."""
        self.circuit_breakers[provider_name] = time.time() + self.cooldown_seconds
        logger.warning(f"Circuit breaker tripped for LLM provider '{provider_name}'. Disabled for {self.cooldown_seconds}s.")

    async def get_status(self) -> Dict[str, Any]:
        """
        Check health and status of all configured providers for GET /api/llm/status.
        """
        status_list = []
        active_provider = None
        active_model = None

        order = self._get_provider_order()
        for p_name in order:
            provider = self.providers.get(p_name)
            if not provider:
                continue

            circuit_open = self.is_circuit_open(p_name)
            if circuit_open:
                status_list.append({
                    "provider": p_name,
                    "model": provider.model_name,
                    "reachable": False,
                    "circuit_open": True,
                    "latency_ms": 0.0,
                    "cooldown_remaining": round(self.circuit_breakers[p_name] - time.time(), 1)
                })
                continue

            reachable, latency = await provider.is_reachable()
            status_list.append({
                "provider": p_name,
                "model": provider.model_name,
                "reachable": reachable,
                "circuit_open": False,
                "latency_ms": latency,
                "cooldown_remaining": 0.0
            })

            if reachable and active_provider is None:
                active_provider = p_name
                active_model = provider.model_name

        return {
            "online": active_provider is not None,
            "active_provider": active_provider or "none (fallback mode)",
            "active_model": active_model or "deterministic local synthesizer",
            "providers": status_list
        }

    async def generate(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: Optional[int] = None
    ) -> tuple[str, str]:
        """
        Attempts text generation across configured providers in order.
        Returns tuple: (generated_text, provider_name_used)
        If all fail, returns ("", "fallback").
        """
        tokens = max_tokens or settings.LLM_MAX_TOKENS
        order = self._get_provider_order()

        for p_name in order:
            if self.is_circuit_open(p_name):
                logger.info(f"Skipping LLM provider '{p_name}' (circuit open).")
                continue

            provider = self.providers.get(p_name)
            if not provider:
                continue

            try:
                text = await provider.generate(messages, temperature=temperature, max_tokens=tokens)
                if text:
                    return text, p_name
            except Exception as e:
                logger.error(f"Error calling LLM provider '{p_name}': {e}")
                self.trip_circuit(p_name)
                continue

        logger.warning("All LLM providers failed or are unavailable. Using deterministic local fallback.")
        return "", "fallback"

    async def generate_stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: Optional[int] = None
    ) -> AsyncGenerator[tuple[str, str], None]:
        """
        Streams token chunks asynchronously across providers.
        Yields tuple: (token_chunk, provider_name)
        """
        tokens = max_tokens or settings.LLM_MAX_TOKENS
        order = self._get_provider_order()

        for p_name in order:
            if self.is_circuit_open(p_name):
                continue

            provider = self.providers.get(p_name)
            if not provider:
                continue

            try:
                streamed_any = False
                async for chunk in provider.generate_stream(messages, temperature=temperature, max_tokens=tokens):
                    streamed_any = True
                    yield chunk, p_name
                
                if streamed_any:
                    return
            except Exception as e:
                logger.error(f"Error streaming from LLM provider '{p_name}': {e}")
                self.trip_circuit(p_name)
                continue

        # If all stream attempts fail, yield empty token with provider 'fallback'
        yield "", "fallback"

llm_manager = LLMManager()
