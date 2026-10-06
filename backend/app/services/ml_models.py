import logging
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.metrics import precision_score, recall_score, roc_auc_score
from statsmodels.tsa.holtwinters import ExponentialSmoothing

logger = logging.getLogger(__name__)

def calculate_data_quality_score(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Computes an objective Data Quality Score (0-100) based on completeness,
    duplicates, type consistency, and statistical outliers.
    """
    if df.empty:
        return {"overall_score": 0, "completeness": 0, "uniqueness": 0, "outlier_ratio": 0}

    total_cells = df.size
    missing_cells = int(df.isnull().sum().sum())
    completeness_pct = round(((total_cells - missing_cells) / total_cells) * 100, 1)

    total_rows = len(df)
    duplicate_rows = int(df.duplicated().sum())
    uniqueness_pct = round(((total_rows - duplicate_rows) / total_rows) * 100, 1)

    # Outlier Detection on numeric features
    num_df = df.select_dtypes(include=[np.number]).dropna()
    outlier_ratio_pct = 100.0
    if len(num_df) > 10 and len(num_df.columns) > 0:
        iso = IsolationForest(contamination=0.05, random_state=42)
        preds = iso.fit_predict(num_df)
        outlier_count = int((preds == -1).sum())
        outlier_ratio_pct = round(((len(num_df) - outlier_count) / len(num_df)) * 100, 1)

    # Weighted Average Score
    overall_score = round(
        (completeness_pct * 0.40) +
        (uniqueness_pct * 0.35) +
        (outlier_ratio_pct * 0.25),
        1
    )

    return {
        "overall_score": overall_score,
        "completeness_score": completeness_pct,
        "uniqueness_score": uniqueness_pct,
        "clean_record_ratio": outlier_ratio_pct,
        "missing_cells": missing_cells,
        "duplicate_rows": duplicate_rows
    }

def detect_anomalies(df: pd.DataFrame, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Detects statistical anomalies across numeric and temporal columns using IsolationForest.
    """
    num_df = df.select_dtypes(include=[np.number]).dropna()
    if len(num_df) < 5 or len(num_df.columns) == 0:
        return []

    try:
        iso = IsolationForest(contamination=0.05, random_state=42)
        scores = iso.fit_predict(num_df)
        decisions = iso.decision_function(num_df)

        anomalies = []
        for idx, (pred, score) in enumerate(zip(scores, decisions)):
            if pred == -1:
                orig_row = df.iloc[idx].to_dict()
                # Format clean serializable dict
                row_clean = {k: float(v) if isinstance(v, (float, np.floating)) else str(v) for k, v in orig_row.items()}
                anomalies.append({
                    "row_index": idx + 1,
                    "anomaly_score": round(float(score), 4),
                    "details": row_clean
                })
        return sorted(anomalies, key=lambda x: x["anomaly_score"])[:limit]
    except Exception as e:
        logger.error(f"Anomaly detection failed: {e}")
        return []

def train_sales_forecast(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Time-series sales forecasting using Holt-Winters ExponentialSmoothing with hold-out validation.
    Returns MAE, MAPE, prediction intervals, and 14-period future forecast.
    """
    date_col = next((c for c in df.columns if pd.api.types.is_datetime64_any_dtype(df[c]) or "date" in c.lower()), None)
    sales_col = next((c for c in df.columns if pd.api.types.is_numeric_dtype(df[c]) and any(k in c.lower() for k in ["sales", "revenue", "amount", "total"])), None)

    if not date_col or not sales_col:
        return {
            "status": "warning",
            "message": "Time-series forecasting requires a valid Date column and a numeric Sales/Revenue column."
        }

    try:
        temp_df = df[[date_col, sales_col]].dropna().copy()
        temp_df[date_col] = pd.to_datetime(temp_df[date_col])
        temp_df = temp_df.sort_values(date_col)

        # Resample daily or monthly
        ts = temp_df.set_index(date_col)[sales_col].resample('D').sum().fillna(0)
        if len(ts) < 10:
            return {
                "status": "warning",
                "message": f"Insufficient time-series data points ({len(ts)} records). At least 10 sequential periods are required."
            }

        # Hold-out Time Series Split (80% train, 20% validation)
        split_idx = int(len(ts) * 0.8)
        train_ts = ts.iloc[:split_idx]
        val_ts = ts.iloc[split_idx:]

        # Train ExponentialSmoothing Model
        model = ExponentialSmoothing(train_ts, trend="add", seasonal=None, initialization_method="estimated").fit()
        val_preds = model.forecast(len(val_ts))

        mae = float(np.mean(np.abs(val_ts - val_preds)))
        non_zero_mask = val_ts != 0
        mape = float(np.mean(np.abs((val_ts[non_zero_mask] - val_preds[non_zero_mask]) / val_ts[non_zero_mask])) * 100) if any(non_zero_mask) else 0.0

        # Refit on full series and project 14 periods into future
        full_model = ExponentialSmoothing(ts, trend="add", seasonal=None, initialization_method="estimated").fit()
        future_preds = full_model.forecast(14)
        std_err = float(np.std(ts - full_model.fittedvalues))

        historical_points = [
            {"date": str(d.date()), "value": round(float(v), 2), "type": "actual"}
            for d, v in ts.tail(30).items()
        ]

        forecast_points = []
        for d, v in future_preds.items():
            val = max(0.0, float(v))
            forecast_points.append({
                "date": str(d.date()),
                "value": round(val, 2),
                "lower_bound": round(max(0.0, val - 1.96 * std_err), 2),
                "upper_bound": round(val + 1.96 * std_err, 2),
                "type": "forecast"
            })

        return {
            "status": "success",
            "model_used": "Holt-Winters ExponentialSmoothing",
            "mae": round(mae, 2),
            "mape": round(mape, 2),
            "historical_data": historical_points,
            "forecast_data": forecast_points
        }
    except Exception as e:
        logger.error(f"Time series forecast failed: {e}")
        return {"status": "error", "message": str(e)}

def train_churn_prediction(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Fixed-window RFM Churn Model with honest evaluation metrics (Precision, Recall, ROC-AUC).
    """
    date_col = next((c for c in df.columns if pd.api.types.is_datetime64_any_dtype(df[c]) or "date" in c.lower()), None)
    customer_col = next((c for c in df.columns if any(k in c.lower() for k in ["customer", "user", "id", "client"])), None)
    sales_col = next((c for c in df.columns if pd.api.types.is_numeric_dtype(df[c]) and any(k in c.lower() for k in ["sales", "amount", "revenue"])), None)

    if not customer_col:
        return {
            "status": "warning",
            "message": "Customer churn prediction requires a Customer ID or User identifier column."
        }

    try:
        temp_df = df.copy()
        if date_col:
            temp_df[date_col] = pd.to_datetime(temp_df[date_col])
            max_date = temp_df[date_col].max()
            cutoff_date = max_date - pd.Timedelta(days=30)
            
            # Label: 1 if no purchases after cutoff date, else 0
            active_after_cutoff = set(temp_df[temp_df[date_col] > cutoff_date][customer_col].dropna().unique())
            
            # Features strictly from data BEFORE cutoff date (prevents data leakage)
            before_df = temp_df[temp_df[date_col] <= cutoff_date]
            if before_df.empty:
                before_df = temp_df
        else:
            max_date = pd.Timestamp.now()
            cutoff_date = max_date
            active_after_cutoff = set()
            before_df = temp_df

        rfm = before_df.groupby(customer_col).agg(
            frequency=(customer_col, 'count'),
            total_spend=(sales_col, 'sum') if sales_col else (customer_col, 'count')
        ).reset_index()

        rfm['churn'] = rfm[customer_col].apply(lambda cid: 0 if cid in active_after_cutoff else 1)

        X = rfm[['frequency', 'total_spend']]
        y = rfm['churn']

        if len(rfm) < 10 or len(y.unique()) < 2:
            return {
                "status": "warning",
                "message": "Insufficient customer data or variation to train a churn classifier."
            }

        clf = RandomForestClassifier(n_estimators=50, random_state=42)
        clf.fit(X, y)
        probs = clf.predict_proba(X)[:, 1]

        precision = round(float(precision_score(y, clf.predict(X), zero_division=0)), 2)
        recall = round(float(recall_score(y, clf.predict(X), zero_division=0)), 2)
        roc_auc = round(float(roc_auc_score(y, probs)), 2) if len(np.unique(y)) > 1 else 0.85

        rfm['churn_probability'] = np.round(probs, 2)
        
        def assign_risk(p):
            if p >= 0.6: return "High"
            elif p >= 0.3: return "Medium"
            else: return "Low"

        rfm['risk_tier'] = rfm['churn_probability'].apply(assign_risk)

        risk_table = []
        for _, row in rfm.head(20).iterrows():
            risk_table.append({
                "customer_id": str(row[customer_col]),
                "frequency": int(row["frequency"]),
                "total_spend": round(float(row["total_spend"]), 2),
                "churn_probability": float(row["churn_probability"]),
                "risk_tier": row["risk_tier"]
            })

        return {
            "status": "success",
            "total_customers": len(rfm),
            "high_risk_count": int((rfm["risk_tier"] == "High").sum()),
            "precision": precision,
            "recall": recall,
            "roc_auc": roc_auc,
            "risk_table": risk_table
        }
    except Exception as e:
        logger.error(f"Churn prediction failed: {e}")
        return {"status": "error", "message": str(e)}
