import os
import uuid
import pandas as pd
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.dataset import DatasetMeta, UserModel
from app.core.security import get_current_user_optional

router = APIRouter(prefix="/api/upload", tags=["Upload"])

MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}
DISALLOWED_EXTENSIONS = {".xlsm", ".xltm", ".exe", ".sh", ".bat", ".py"}
MAX_ROWS = 500_000
MAX_COLS = 200

def sanitize_formula_injection(df: pd.DataFrame) -> pd.DataFrame:
    """
    Sanitizes string cells starting with dangerous formula triggers (=, +, -, @).
    """
    sanitized = df.copy()
    for col in sanitized.select_dtypes(include=['object']):
        sanitized[col] = sanitized[col].astype(str).apply(
            lambda val: f"'{val}" if val.startswith(('=', '+', '-', '@')) else val
        )
    return sanitized

@router.post("")
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: Optional[UserModel] = Depends(get_current_user_optional)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext in DISALLOWED_EXTENSIONS or ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension '{ext}'. Only standard CSV (.csv) and Excel (.xlsx) files are allowed."
        )

    # Read content & check size limit
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 50 MB.")

    # Random server-side filename (prevents path traversal)
    dataset_id = str(uuid.uuid4())
    safe_raw_path = os.path.join(settings.UPLOAD_DIR, f"{dataset_id}{ext}")
    
    with open(safe_raw_path, "wb") as f:
        f.write(content)

    # Load DataFrame
    try:
        if ext == ".csv":
            df = pd.read_csv(safe_raw_path)
        else:
            df = pd.read_excel(safe_raw_path)
    except Exception as e:
        if os.path.exists(safe_raw_path):
            os.remove(safe_raw_path)
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    # Enforce row and column limits
    if len(df) > MAX_ROWS:
        os.remove(safe_raw_path)
        raise HTTPException(status_code=400, detail=f"Dataset exceeds maximum limit of {MAX_ROWS:,} rows.")
    if len(df.columns) > MAX_COLS:
        os.remove(safe_raw_path)
        raise HTTPException(status_code=400, detail=f"Dataset exceeds maximum limit of {MAX_COLS} columns.")

    # Sanitize CSV formula injection
    df = sanitize_formula_injection(df)

    # Save as fast Parquet format
    parquet_path = os.path.join(settings.PROCESSED_DIR, f"{dataset_id}.parquet")
    df.to_parquet(parquet_path, index=False)

    columns_info = {col: str(dtype) for col, dtype in df.dtypes.items()}

    meta = DatasetMeta(
        id=dataset_id,
        owner_id=user.id if user else None,
        filename=file.filename,
        file_path=safe_raw_path,
        parquet_path=parquet_path,
        total_rows_raw=len(df),
        total_columns=len(df.columns),
        columns_info=columns_info
    )
    db.add(meta)
    db.commit()

    return {
        "dataset_id": dataset_id,
        "filename": file.filename,
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "columns_info": columns_info
    }
