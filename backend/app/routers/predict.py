import os
import pandas as pd
from fastapi import APIRouter, HTTPException, Depends
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.dataset import DatasetMeta
from app.services.ml_models import (
    train_sales_forecast,
    train_churn_prediction,
    detect_anomalies,
    calculate_data_quality_score
)

router = APIRouter(prefix="/api/predict", tags=["Predict"])

def _load_df_sync(meta: DatasetMeta) -> pd.DataFrame:
    path = meta.parquet_path if meta.parquet_path and os.path.exists(meta.parquet_path) else (meta.cleaned_path if meta.is_cleaned and meta.cleaned_path and os.path.exists(meta.cleaned_path) else meta.file_path)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Dataset file not found.")
    ext = os.path.splitext(path)[1].lower()
    if ext == ".parquet":
        return pd.read_parquet(path)
    elif ext == ".csv":
        return pd.read_csv(path)
    else:
        return pd.read_excel(path)

@router.get("/sales/{dataset_id}")
async def predict_sales(dataset_id: str, db: Session = Depends(get_db)):
    meta = await run_in_threadpool(lambda: db.query(DatasetMeta).filter(DatasetMeta.id == dataset_id).first())
    if not meta:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = await run_in_threadpool(_load_df_sync, meta)
    return await run_in_threadpool(train_sales_forecast, df)

@router.get("/churn/{dataset_id}")
async def predict_churn(dataset_id: str, db: Session = Depends(get_db)):
    meta = await run_in_threadpool(lambda: db.query(DatasetMeta).filter(DatasetMeta.id == dataset_id).first())
    if not meta:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = await run_in_threadpool(_load_df_sync, meta)
    return await run_in_threadpool(train_churn_prediction, df)

@router.get("/anomalies/{dataset_id}")
async def get_anomalies(dataset_id: str, db: Session = Depends(get_db)):
    meta = await run_in_threadpool(lambda: db.query(DatasetMeta).filter(DatasetMeta.id == dataset_id).first())
    if not meta:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = await run_in_threadpool(_load_df_sync, meta)
    return await run_in_threadpool(detect_anomalies, df)

@router.get("/quality/{dataset_id}")
async def get_data_quality(dataset_id: str, db: Session = Depends(get_db)):
    meta = await run_in_threadpool(lambda: db.query(DatasetMeta).filter(DatasetMeta.id == dataset_id).first())
    if not meta:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = await run_in_threadpool(_load_df_sync, meta)
    return await run_in_threadpool(calculate_data_quality_score, df)
