from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class DatasetUploadResponse(BaseModel):
    dataset_id: str
    filename: str
    total_rows: int
    total_columns: int
    columns: List[str]
    column_types: Dict[str, str]
    preview_data: List[Dict[str, Any]]

class CleanOptions(BaseModel):
    numeric_strategy: str = "median"  # median, mean, zero
    categorical_strategy: str = "mode"  # mode, unknown

class CleaningSummary(BaseModel):
    duplicate_rows_removed: int
    null_values_filled: Dict[str, int]
    total_nulls_filled: int
    inferred_column_types: Dict[str, str]
    rows_after_cleaning: int

class CleanResponse(BaseModel):
    dataset_id: str
    is_cleaned: bool
    summary: CleaningSummary
    preview_data: List[Dict[str, Any]]

class KPICard(BaseModel):
    title: str
    value: str
    subtext: str
    change: Optional[str] = None
    trend: Optional[str] = "neutral"

class ChartSpec(BaseModel):
    id: str
    title: str
    chart_type: str  # line, bar, pie, scatter, distribution
    data: Dict[str, Any]  # Plotly spec JSON
    supported: bool
    message: Optional[str] = None

class DashboardResponse(BaseModel):
    dataset_id: str
    kpis: List[KPICard]
    charts: List[ChartSpec]

class ForecastPoint(BaseModel):
    date: str
    historical_sales: Optional[float] = None
    forecast_sales: Optional[float] = None

class SalesPredictResponse(BaseModel):
    supported: bool
    message: str
    r2_score: Optional[float] = None
    mae: Optional[float] = None
    cv_score: Optional[float] = None
    date_column: Optional[str] = None
    target_column: Optional[str] = None
    forecast_data: List[ForecastPoint] = []

class ChurnCustomerRisk(BaseModel):
    customer_id: str
    customer_name: Optional[str] = None
    recency_days: float
    purchase_frequency: float
    churn_probability: float
    risk_tier: str  # High, Medium, Low

class ChurnPredictResponse(BaseModel):
    supported: bool
    message: str
    accuracy: Optional[float] = None
    total_customers_analyzed: int = 0
    high_risk_count: int = 0
    risk_table: List[ChurnCustomerRisk] = []

class ChatRequest(BaseModel):
    dataset_id: str
    message: str

class ChatSource(BaseModel):
    type: str  # 'faiss_row' or 'pandas_aggregate'
    summary: str
    details: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    reply: str
    route_used: str  # 'aggregate', 'lookup', 'both'
    sources: List[ChatSource] = []

class ReportRequest(BaseModel):
    dataset_id: str
