from fastapi import APIRouter
from app.services.llm.manager import llm_manager

router = APIRouter(prefix="/api/llm", tags=["LLM Status"])

@router.get("/status")
async def get_llm_status():
    """
    Returns reachable status, active provider, model name, and latency
    so the UI can display an LLM status indicator.
    """
    return await llm_manager.get_status()
