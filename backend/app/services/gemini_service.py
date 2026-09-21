import logging
import time
from typing import List, Optional
from google import genai
from google.genai import types
from app.config import settings

logger = logging.getLogger(__name__)

# Initialize Google GenAI client if API key is set
client = None
if settings.GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
    except Exception as e:
        logger.warning(f"Failed to initialize Gemini Client: {e}")

TEXT_MODELS = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-flash-latest"]
EMBEDDING_MODEL = "models/gemini-embedding-001"

_last_request_time = 0.0

def _rate_limit_backoff():
    global _last_request_time
    now = time.time()
    elapsed = now - _last_request_time
    if elapsed < 0.3:
        time.sleep(0.3 - elapsed)
    _last_request_time = time.time()

def generate_text_response(prompt: str, system_instruction: Optional[str] = None) -> str:
    """
    Calls Gemini API using google-genai SDK to generate text responses.
    """
    if not settings.GEMINI_API_KEY or not client:
        return "Gemini API key is not configured. Please set GEMINI_API_KEY in backend environment."

    _rate_limit_backoff()

    config = None
    if system_instruction:
        config = types.GenerateContentConfig(system_instruction=system_instruction)

    for model_name in TEXT_MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config
            )
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            logger.warning(f"Failed to generate text with model {model_name}: {str(e)}")
            continue

    return "I'm having trouble connecting to the Gemini AI API right now. Please verify your GEMINI_API_KEY or network connection."

def get_embeddings(texts: List[str]) -> Optional[List[List[float]]]:
    """
    Generates embedding vectors for a list of strings using text-embedding-004.
    """
    if not settings.GEMINI_API_KEY or not client or not texts:
        return None

    _rate_limit_backoff()

    try:
        embeddings = []
        batch_size = 20
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i+batch_size]
            res = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=batch
            )
            if hasattr(res, "embeddings") and res.embeddings:
                for emb in res.embeddings:
                    embeddings.append(emb.values)
        return embeddings if len(embeddings) == len(texts) else None
    except Exception as e:
        logger.warning(f"Gemini embedding API failed: {str(e)}. Falling back to local TF-IDF vectorizer.")
        return None
