import os
import pandas as pd
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.dataset import DatasetMeta
from app.schemas.schemas import CleanOptions, CleanResponse
from app.services.cleaning import clean_dataset
from app.services.rag_service import register_dataset_rag
from app.config import settings

router = APIRouter(prefix="/api/clean", tags=["Clean"])

@router.post("/{dataset_id}", response_model=CleanResponse)
async def clean_dataset_endpoint(
    dataset_id: str,
    options: CleanOptions = CleanOptions(),
    db: Session = Depends(get_db)
):
    meta = db.query(DatasetMeta).filter(DatasetMeta.id == dataset_id).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    if not os.path.exists(meta.file_path):
        raise HTTPException(status_code=404, detail="Dataset file missing on disk.")

    ext = os.path.splitext(meta.file_path)[1].lower()
    df = pd.read_csv(meta.file_path) if ext == ".csv" else pd.read_excel(meta.file_path)

    cleaned_df, summary = clean_dataset(df, options)

    cleaned_path = os.path.join(settings.PROCESSED_DIR, f"cleaned_{dataset_id}.csv")
    cleaned_df.to_csv(cleaned_path, index=False)

    meta.cleaned_path = cleaned_path
    meta.is_cleaned = True
    meta.cleaning_summary = summary.model_dump()
    db.commit()

    # Rebuild RAG index with cleaned data automatically
    register_dataset_rag(dataset_id, cleaned_df)

    preview_df = cleaned_df.head(10).fillna("")
    preview_data = preview_df.to_dict(orient="records")

    return CleanResponse(
        dataset_id=dataset_id,
        is_cleaned=True,
        summary=summary,
        preview_data=preview_data
    )
