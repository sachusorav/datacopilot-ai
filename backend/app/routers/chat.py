import os
import pandas as pd
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.dataset import DatasetMeta, ChatMessageModel
from app.schemas.schemas import ChatRequest, ChatResponse
from app.services.rag_service import answer_rag_chat

router = APIRouter(prefix="/api/chat", tags=["Chat"])

def get_loaded_dataframe(meta: DatasetMeta) -> pd.DataFrame:
    path = meta.cleaned_path if meta.is_cleaned and meta.cleaned_path and os.path.exists(meta.cleaned_path) else meta.file_path
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Dataset file not found.")
    ext = os.path.splitext(path)[1].lower()
    return pd.read_csv(path) if ext == ".csv" else pd.read_excel(path)


@router.post("", response_model=ChatResponse)
async def chat_with_data(req: ChatRequest, db: Session = Depends(get_db)):
    meta = db.query(DatasetMeta).filter(DatasetMeta.id == req.dataset_id).first()
    if not meta:
        raise HTTPException(status_code=404, detail="No dataset uploaded yet. Please upload a dataset first.")

    df = get_loaded_dataframe(meta)

    # Save user message to DB
    user_msg = ChatMessageModel(
        dataset_id=req.dataset_id,
        sender="user",
        text=req.message
    )
    db.add(user_msg)
    db.commit()

    # Process RAG query
    response = answer_rag_chat(req.dataset_id, df, req.message)

    # Save AI response to DB
    ai_msg = ChatMessageModel(
        dataset_id=req.dataset_id,
        sender="ai",
        text=response.reply,
        route_used=response.route_used,
        sources=[s.model_dump() for s in response.sources]
    )
    db.add(ai_msg)
    db.commit()

    return response


@router.get("/history/{dataset_id}")
async def get_chat_history(dataset_id: str, db: Session = Depends(get_db)):
    messages = db.query(ChatMessageModel).filter(ChatMessageModel.dataset_id == dataset_id).order_by(ChatMessageModel.id.asc()).all()
    return [
        {
            "id": m.id,
            "sender": m.sender,
            "text": m.text,
            "route_used": m.route_used,
            "sources": m.sources,
            "timestamp": m.timestamp.isoformat() if m.timestamp else None
        }
        for m in messages
    ]
