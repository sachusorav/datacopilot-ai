import os
import uuid
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.dataset import DatasetMeta
from app.schemas.schemas import DatasetUploadResponse
from app.config import settings

router = APIRouter(prefix="/api/upload", tags=["Upload"])

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB

@router.post("", response_model=DatasetUploadResponse)
async def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    filename = file.filename or "dataset.csv"
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in [".csv", ".xlsx", ".xls"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{ext}'. Only .csv, .xlsx, and .xls files are supported."
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum limit of 25MB (File size: {len(content)/(1024*1024):.2f}MB)."
        )

    dataset_id = str(uuid.uuid4())[:8]
    save_path = os.path.join(settings.UPLOAD_DIR, f"{dataset_id}_{filename}")
    
    with open(save_path, "wb") as f:
        f.write(content)

    try:
        if ext == ".csv":
            df = pd.read_csv(save_path)
        else:
            df = pd.read_excel(save_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse data file: {str(e)}")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Convert non-serializable objects (like Timestamp or NaN) for JSON response
    column_types = {str(col): str(df[col].dtype) for col in df.columns}
    
    # Store metadata in DB
    meta = DatasetMeta(
        id=dataset_id,
        filename=filename,
        file_path=save_path,
        total_rows_raw=len(df),
        total_columns=len(df.columns),
        columns_info=column_types
    )
    db.add(meta)
    db.commit()

    # Top 10 Preview Data
    preview_df = df.head(10).fillna("")
    preview_data = preview_df.to_dict(orient="records")

    return DatasetUploadResponse(
        dataset_id=dataset_id,
        filename=filename,
        total_rows=len(df),
        total_columns=len(df.columns),
        columns=[str(c) for c in df.columns],
        column_types=column_types,
        preview_data=preview_data
    )
