import os
import pandas as pd
from fastapi import APIRouter, HTTPException, Depends, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.dataset import DatasetMeta
from app.services.pdf_report import generate_pdf_report
from app.routers.dashboard import get_dashboard_data
from app.services.ml_models import train_sales_forecast, train_churn_prediction

router = APIRouter(prefix="/api/report", tags=["Report"])

def get_loaded_dataframe(meta: DatasetMeta) -> pd.DataFrame:
    path = meta.cleaned_path if meta.is_cleaned and meta.cleaned_path and os.path.exists(meta.cleaned_path) else meta.file_path
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Dataset file not found.")
    ext = os.path.splitext(path)[1].lower()
    return pd.read_csv(path) if ext == ".csv" else pd.read_excel(path)


@router.get("/download/{dataset_id}")
async def download_report(dataset_id: str, db: Session = Depends(get_db)):
    meta = db.query(DatasetMeta).filter(DatasetMeta.id == dataset_id).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = get_loaded_dataframe(meta)

    # Gather data for report
    dash_resp = await get_dashboard_data(dataset_id, db)
    kpi_dicts = [k.model_dump() for k in dash_resp.kpis]
    
    ml_sales = train_sales_forecast(df).model_dump()
    ml_churn = train_churn_prediction(df).model_dump()

    pdf_bytes = generate_pdf_report(
        dataset_filename=meta.filename,
        df=df,
        kpi_list=kpi_dicts,
        ml_sales_info=ml_sales,
        ml_churn_info=ml_churn
    )

    headers = {
        "Content-Disposition": f"attachment; filename=DataCopilot_Report_{dataset_id}.pdf"
    }

    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)
