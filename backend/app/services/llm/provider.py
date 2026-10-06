import abc
from typing import AsyncGenerator, Dict, Any, Optional, List

class BaseLLMProvider(abc.ABC):
    """Abstract Base Class for OpenAI-compatible LLM providers."""

    @property
    @abc.abstractmethod
    def name(self) -> str:
        """Provider name string (e.g. 'ollama', 'groq')."""
        pass

    @property
    @abc.abstractmethod
    def model_name(self) -> str:
        """Model identifier name (e.g. 'llama3.2:3b', 'llama-3.3-70b-versatile')."""
        pass

    @abc.abstractmethod
    async def is_reachable(self) -> tuple[bool, float]:
        """
        Check if the provider is reachable.
        Returns: (is_healthy, latency_ms)
        """
        pass

    @abc.abstractmethod
    async def generate(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 1024
    ) -> str:
        """
        Generate complete text response from messages.
        """
        pass

    @abc.abstractmethod
    async def generate_stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 1024
    ) -> AsyncGenerator[str, None]:
        """
        Stream text response chunks asynchronously.
        """
        pass
