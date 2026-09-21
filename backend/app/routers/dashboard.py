import os
import pandas as pd
import numpy as np
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.dataset import DatasetMeta
from app.schemas.schemas import DashboardResponse, KPICard, ChartSpec

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

def get_loaded_dataframe(meta: DatasetMeta) -> pd.DataFrame:
    path = meta.cleaned_path if meta.is_cleaned and meta.cleaned_path and os.path.exists(meta.cleaned_path) else meta.file_path
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Dataset file not found.")
    ext = os.path.splitext(path)[1].lower()
    return pd.read_csv(path) if ext == ".csv" else pd.read_excel(path)


@router.get("/{dataset_id}", response_model=DashboardResponse)
async def get_dashboard_data(dataset_id: str, db: Session = Depends(get_db)):
    meta = db.query(DatasetMeta).filter(DatasetMeta.id == dataset_id).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = get_loaded_dataframe(meta)
    if df.empty:
        raise HTTPException(status_code=400, detail="Dataset is empty.")

    # Convert date columns
    for col in df.columns:
        if "date" in col.lower() or "time" in col.lower() or "day" in col.lower():
            try:
                df[col] = pd.to_datetime(df[col], errors='coerce')
            except Exception:
                pass

    # 1. Fuzzy Column Mapping for KPIs
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()

    # Sales / Revenue column
    rev_col = next((c for c in numeric_cols if any(k in c.lower() for k in ["sales", "revenue", "total", "amount", "price"])), None)
    # Customer column
    cust_col = next((c for c in df.columns if any(k in c.lower() for k in ["customer", "client", "user", "buyer"])), None)
    # Date column
    date_col = next((c for c in df.columns if pd.api.types.is_datetime64_any_dtype(df[c])), None)
    # Category column
    cat_col = next((c for c in cat_cols if any(k in c.lower() for k in ["category", "product", "item", "type"])), cat_cols[0] if cat_cols else None)
    # Segment / Region column
    segment_col = next((c for c in cat_cols if any(k in c.lower() for k in ["segment", "region", "country", "state", "city"]) and c != cat_col), cat_cols[1] if len(cat_cols) > 1 else None)

    # 2. Build KPI Cards
    kpis: List[KPICard] = []

    # KPI 1: Total Revenue
    if rev_col:
        tot_rev = float(df[rev_col].sum())
        kpis.append(KPICard(
            title="Total Revenue",
            value=f"${tot_rev:,.2f}",
            subtext=f"Sum of '{rev_col}' column",
            trend="positive"
        ))
    else:
        kpis.append(KPICard(
            title="Total Records",
            value=f"{len(df):,}",
            subtext="Total rows in dataset",
            trend="neutral"
        ))

    # KPI 2: Total Orders / Records
    order_col = next((c for c in df.columns if "order" in c.lower() or "id" in c.lower()), None)
    tot_orders = df[order_col].nunique() if order_col else len(df)
    kpis.append(KPICard(
        title="Total Orders / Records",
        value=f"{tot_orders:,}",
        subtext=f"Unique {order_col}" if order_col else "Total Dataset Rows",
        trend="positive"
    ))

    # KPI 3: Average Order Value
    if rev_col and tot_orders > 0:
        aov = float(df[rev_col].sum()) / tot_orders
        kpis.append(KPICard(
            title="Average Order Value",
            value=f"${aov:,.2f}",
            subtext="Revenue divided by Total Orders",
            trend="positive"
        ))

    # KPI 4: Unique Customers
    if cust_col:
        uniq_cust = df[cust_col].nunique()
        kpis.append(KPICard(
            title="Unique Customers",
            value=f"{uniq_cust:,}",
            subtext=f"Distinct values in '{cust_col}'",
            trend="positive"
        ))

    # 3. Build Plotly Chart Specs
    charts: List[ChartSpec] = []

    # Chart 1: Revenue Trend over Time (Line Chart)
    if date_col and rev_col:
        df_trend = df.dropna(subset=[date_col, rev_col]).copy()
        df_trend = df_trend.groupby(df_trend[date_col].dt.date)[rev_col].sum().reset_index()
        df_trend = df_trend.sort_values(by=date_col)

        charts.append(ChartSpec(
            id="revenue_trend",
            title=f"Revenue Trend over Time ({rev_col} by {date_col})",
            chart_type="line",
            supported=True,
            data={
                "x": [str(d) for d in df_trend[date_col]],
                "y": [round(float(v), 2) for v in df_trend[rev_col]],
                "type": "scatter",
                "mode": "lines+markers",
                "name": rev_col,
                "line": {"color": "#3b82f6", "width": 3},
                "marker": {"size": 6}
            }
        ))
    else:
        charts.append(ChartSpec(
            id="revenue_trend",
            title="Revenue Trend over Time",
            chart_type="line",
            supported=False,
            message="Time trend chart skipped: Requires both a valid Date column and a numeric Revenue/Sales column.",
            data={}
        ))

    # Chart 2: Top Product Categories (Bar Chart)
    if cat_col:
        val_col = rev_col if rev_col else (numeric_cols[0] if numeric_cols else None)
        if val_col:
            top_cat = df.groupby(cat_col)[val_col].sum().sort_values(ascending=False).head(8).reset_index()
            charts.append(ChartSpec(
                id="top_categories",
                title=f"Top Categories by {val_col} ('{cat_col}')",
                chart_type="bar",
                supported=True,
                data={
                    "x": [str(x) for x in top_cat[cat_col]],
                    "y": [round(float(y), 2) for y in top_cat[val_col]],
                    "type": "bar",
                    "marker": {"color": "#6366f1"}
                }
            ))
        else:
            cat_counts = df[cat_col].value_counts().head(8).reset_index()
            y_vals = [int(v) for v in cat_counts["count"]] if "count" in cat_counts else [int(v) for v in cat_counts.iloc[:,1]]
            charts.append(ChartSpec(
                id="top_categories",
                title=f"Distribution of '{cat_col}'",
                chart_type="bar",
                supported=True,
                data={
                    "x": [str(x) for x in cat_counts[cat_col]],
                    "y": y_vals,
                    "marker": {"color": "#6366f1"}
                }
            ))
    else:
        charts.append(ChartSpec(
            id="top_categories",
            title="Top Product Categories",
            chart_type="bar",
            supported=False,
            message="Category bar chart skipped: No categorical column detected in dataset.",
            data={}
        ))

    # Chart 3: Segment / Region Breakdown (Pie/Donut Chart)
    if segment_col:
        val_col = rev_col if rev_col else (numeric_cols[0] if numeric_cols else None)
        if val_col:
            seg_data = df.groupby(segment_col)[val_col].sum().reset_index()
            charts.append(ChartSpec(
                id="segment_breakdown",
                title=f"Share by {segment_col} ({val_col})",
                chart_type="pie",
                supported=True,
                data={
                    "labels": [str(x) for x in seg_data[segment_col]],
                    "values": [round(float(y), 2) for y in seg_data[val_col]],
                    "type": "pie",
                    "hole": 0.4
                }
            ))
        else:
            seg_counts = df[segment_col].value_counts().reset_index()
            charts.append(ChartSpec(
                id="segment_breakdown",
                title=f"Distribution of '{segment_col}'",
                chart_type="pie",
                supported=True,
                data={
                    "labels": [str(x) for x in seg_counts.iloc[:, 0]],
                    "values": [int(y) for y in seg_counts.iloc[:, 1]],
                    "type": "pie",
                    "hole": 0.4
                }
            ))
    else:
        charts.append(ChartSpec(
            id="segment_breakdown",
            title="Customer Segment Breakdown",
            chart_type="pie",
            supported=False,
            message="Segment chart skipped: No secondary breakdown column (Segment/Region/Country) found.",
            data={}
        ))

    # Chart 4: Metric Distribution / Scatter Plot
    if len(numeric_cols) >= 2:
        x_c, y_c = numeric_cols[0], numeric_cols[1]
        sample_df = df.sample(min(200, len(df)), random_state=42)
        charts.append(ChartSpec(
            id="correlation_scatter",
            title=f"Correlation: {x_c} vs {y_c}",
            chart_type="scatter",
            supported=True,
            data={
                "x": [round(float(v), 2) for v in sample_df[x_c]],
                "y": [round(float(v), 2) for v in sample_df[y_c]],
                "mode": "markers",
                "type": "scatter",
                "marker": {"color": "#10b981", "opacity": 0.7, "size": 8}
            }
        ))
    elif len(numeric_cols) == 1:
        num_c = numeric_cols[0]
        charts.append(ChartSpec(
            id="correlation_scatter",
            title=f"Value Distribution of '{num_c}'",
            chart_type="distribution",
            supported=True,
            data={
                "x": [round(float(v), 2) for v in df[num_c].dropna()],
                "type": "histogram",
                "marker": {"color": "#10b981"}
            }
        ))
    else:
        charts.append(ChartSpec(
            id="correlation_scatter",
            title="Metric Distribution",
            chart_type="scatter",
            supported=False,
            message="Distribution chart skipped: At least 1 numeric column required.",
            data={}
        ))

    return DashboardResponse(
        dataset_id=dataset_id,
        kpis=kpis,
        charts=charts
    )
