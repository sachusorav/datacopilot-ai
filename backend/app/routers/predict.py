import os
import pandas as pd
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.dataset import DatasetMeta
from app.schemas.schemas import SalesPredictResponse, ChurnPredictResponse
from app.services.ml_models import train_sales_forecast, train_churn_prediction

router = APIRouter(prefix="/api/predict", tags=["Predict"])

def get_loaded_dataframe(meta: DatasetMeta) -> pd.DataFrame:
    path = meta.cleaned_path if meta.is_cleaned and meta.cleaned_path and os.path.exists(meta.cleaned_path) else meta.file_path
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Dataset file not found.")
    ext = os.path.splitext(path)[1].lower()
    return pd.read_csv(path) if ext == ".csv" else pd.read_excel(path)


@router.get("/sales/{dataset_id}", response_model=SalesPredictResponse)
async def predict_sales(dataset_id: str, db: Session = Depends(get_db)):
    meta = db.query(DatasetMeta).filter(DatasetMeta.id == dataset_id).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = get_loaded_dataframe(meta)
    return train_sales_forecast(df)


@router.get("/churn/{dataset_id}", response_model=ChurnPredictResponse)
async def predict_churn(dataset_id: str, db: Session = Depends(get_db)):
    meta = db.query(DatasetMeta).filter(DatasetMeta.id == dataset_id).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = get_loaded_dataframe(meta)
    return train_churn_prediction(df)
