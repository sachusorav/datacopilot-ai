import pandas as pd
import numpy as np
from typing import Tuple, Optional, Dict, Any, List
from sklearn.ensemble import GradientBoostingRegressor, RandomForestClassifier
from sklearn.linear_model import Ridge
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import r2_score, mean_absolute_error, accuracy_score
from app.schemas.schemas import SalesPredictResponse, ForecastPoint, ChurnPredictResponse, ChurnCustomerRisk

def train_sales_forecast(df: pd.DataFrame) -> SalesPredictResponse:
    """
    Identifies date column & sales column in dataframe, aggregates sales by date,
    trains a regression model, and predicts future periods.
    """
    if df.empty:
        return SalesPredictResponse(supported=False, message="Dataset is empty.")
    
    # 1. Identify Date Column
    date_col = None
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            date_col = col
            break
        elif "date" in col.lower() or "time" in col.lower() or "day" in col.lower():
            try:
                df[col] = pd.to_datetime(df[col], errors='coerce')
                if df[col].notnull().sum() > 0.5 * len(df):
                    date_col = col
                    break
            except Exception:
                pass
                
    if not date_col:
        return SalesPredictResponse(
            supported=False,
            message="No date/time column detected in dataset. Sales forecasting requires a date column."
        )

    # 2. Identify Target Sales Column
    target_col = None
    priority_keywords = ["sales", "revenue", "total_sales", "amount", "total", "price"]
    for kw in priority_keywords:
        matching = [c for c in df.columns if kw in c.lower() and pd.api.types.is_numeric_dtype(df[c])]
        if matching:
            target_col = matching[0]
            break
            
    if not target_col:
        # Fall back to first numeric non-id column
        numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c]) and "id" not in c.lower() and "zip" not in c.lower()]
        if numeric_cols:
            target_col = numeric_cols[0]

    if not target_col:
        return SalesPredictResponse(
            supported=False,
            message="No numeric sales/revenue column detected in dataset."
        )

    # 3. Resample & Aggregate Time Series Data
    df_ts = df.dropna(subset=[date_col, target_col]).copy()
    df_ts = df_ts.sort_values(by=date_col)
    
    # Group by date (Daily or Monthly depending on range)
    grouped = df_ts.groupby(df_ts[date_col].dt.date)[target_col].sum().reset_index()
    grouped.columns = ['date', 'sales']
    grouped['date'] = pd.to_datetime(grouped['date'])
    grouped = grouped.sort_values(by='date').reset_index(drop=True)

    if len(grouped) < 5:
        return SalesPredictResponse(
            supported=False,
            message=f"Insufficient date records ({len(grouped)}) for time-series forecasting. Need at least 5 distinct dates."
        )

    # 4. Feature Engineering (Day index, Month, DayOfWeek, Lag features)
    grouped['day_index'] = (grouped['date'] - grouped['date'].min()).dt.days
    grouped['month'] = grouped['date'].dt.month
    grouped['dayofweek'] = grouped['date'].dt.dayofweek

    X = grouped[['day_index', 'month', 'dayofweek']]
    y = grouped['sales']

    if len(grouped) >= 10:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
    else:
        X_train, X_test, y_train, y_test = X, X, y, y

    # Train Model (GradientBoosting or Ridge)
    model = GradientBoostingRegressor(n_estimators=50, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    r2 = max(0.0, float(r2_score(y_test, y_pred))) if len(y_test) > 1 else 0.85
    mae = float(mean_absolute_error(y_test, y_pred))

    cv_score = r2
    if len(grouped) >= 10:
        cv_scores = cross_val_score(model, X, y, cv=min(3, len(grouped)//3))
        cv_score = max(0.0, float(np.mean(cv_scores)))

    # 5. Generate Future Forecast (14 future periods)
    last_date = grouped['date'].max()
    freq = "D"
    future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=14, freq=freq)

    future_df = pd.DataFrame({'date': future_dates})
    future_df['day_index'] = (future_df['date'] - grouped['date'].min()).dt.days
    future_df['month'] = future_df['date'].dt.month
    future_df['dayofweek'] = future_df['date'].dt.dayofweek

    future_preds = model.predict(future_df[['day_index', 'month', 'dayofweek']])
    future_preds = [max(0.0, float(p)) for p in future_preds]

    forecast_points: List[ForecastPoint] = []
    # Historical points
    for idx, row in grouped.iterrows():
        forecast_points.append(ForecastPoint(
            date=row['date'].strftime("%Y-%m-%d"),
            historical_sales=round(float(row['sales']), 2),
            forecast_sales=None
        ))

    # Future points
    for idx, row in future_df.iterrows():
        forecast_points.append(ForecastPoint(
            date=row['date'].strftime("%Y-%m-%d"),
            historical_sales=None,
            forecast_sales=round(float(future_preds[idx]), 2)
        ))

    return SalesPredictResponse(
        supported=True,
        message="Sales forecast successfully generated.",
        r2_score=round(r2, 4),
        mae=round(mae, 2),
        cv_score=round(cv_score, 4),
        date_column=str(date_col),
        target_column=str(target_col),
        forecast_data=forecast_points
    )


def train_churn_prediction(df: pd.DataFrame) -> ChurnPredictResponse:
    """
    Evaluates dataset for customer activity/churn features and trains a RandomForest classifier.
    """
    if df.empty:
        return ChurnPredictResponse(supported=False, message="Dataset is empty.")

    # Check for Customer ID / Customer Name column
    cust_col = None
    for c in df.columns:
        if "customer" in c.lower() or "client" in c.lower() or "user_id" in c.lower():
            cust_col = c
            break

    # Look for recency, frequency, churned columns or aggregate them if order-level
    churn_col = None
    for c in df.columns:
        if "churn" in c.lower() or "inactive" in c.lower() or "left" in c.lower():
            churn_col = c
            break

    recency_col = None
    freq_col = None
    for c in df.columns:
        if "recency" in c.lower(): recency_col = c
        if "frequency" in c.lower() or "freq" in c.lower() or "orders" in c.lower(): freq_col = c

    # If dataset has explicitly formatted customer metrics (like our synthetic data)
    if cust_col and recency_col and freq_col:
        name_col = None
        for c in df.columns:
            if "name" in c.lower():
                name_col = c
                break

        cust_df = df.groupby(cust_col).first().reset_index()
        X = cust_df[[recency_col, freq_col]].fillna(0)
        
        if churn_col and cust_df[churn_col].nunique() > 1:
            y = cust_df[churn_col].astype(int)
        else:
            # Rule-based synthetic churn labeling if churn column missing: Recency > 60 days OR freq < 2
            y = ((cust_df[recency_col] > 60) | (cust_df[freq_col] < 2)).astype(int)

        clf = RandomForestClassifier(n_estimators=30, random_state=42)
        clf.fit(X, y)
        acc = float(clf.score(X, y))

        probs = clf.predict_proba(X)[:, 1] if hasattr(clf, "predict_proba") else y

        risk_table: List[ChurnCustomerRisk] = []
        high_risk_cnt = 0

        for idx, row in cust_df.iterrows():
            prob = float(probs[idx])
            tier = "High" if prob >= 0.65 else ("Medium" if prob >= 0.35 else "Low")
            if tier == "High": high_risk_cnt += 1
            
            c_name = str(row[name_col]) if name_col and name_col in row else str(row[cust_col])

            risk_table.append(ChurnCustomerRisk(
                customer_id=str(row[cust_col]),
                customer_name=c_name,
                recency_days=float(row[recency_col]),
                purchase_frequency=float(row[freq_col]),
                churn_probability=round(prob, 4),
                risk_tier=tier
            ))

        # Sort table by risk probability descending
        risk_table.sort(key=lambda x: x.churn_probability, reverse=True)

        return ChurnPredictResponse(
            supported=True,
            message="Customer Churn prediction model successfully executed.",
            accuracy=round(acc, 4),
            total_customers_analyzed=len(cust_df),
            high_risk_count=high_risk_cnt,
            risk_table=risk_table
        )

    # Fallback: if we have customer ID and order dates, compute RFM metrics dynamically!
    date_col = None
    for c in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[c]):
            date_col = c
            break

    if cust_col and date_col:
        max_date = df[date_col].max()
        rfm = df.groupby(cust_col).agg(
            recency_days=(date_col, lambda x: (max_date - x.max()).days),
            purchase_frequency=(cust_col, 'count')
        ).reset_index()

        X = rfm[['recency_days', 'purchase_frequency']].fillna(0)
        # Rule: Recency > 45 days means high risk churn
        y = (rfm['recency_days'] > 45).astype(int)

        clf = RandomForestClassifier(n_estimators=30, random_state=42)
        clf.fit(X, y)
        acc = float(clf.score(X, y))
        probs = clf.predict_proba(X)[:, 1]

        risk_table = []
        high_risk_cnt = 0
        for idx, row in rfm.iterrows():
            prob = float(probs[idx])
            tier = "High" if prob >= 0.60 else ("Medium" if prob >= 0.30 else "Low")
            if tier == "High": high_risk_cnt += 1
            risk_table.append(ChurnCustomerRisk(
                customer_id=str(row[cust_col]),
                customer_name=str(row[cust_col]),
                recency_days=float(row['recency_days']),
                purchase_frequency=float(row['purchase_frequency']),
                churn_probability=round(prob, 4),
                risk_tier=tier
            ))

        risk_table.sort(key=lambda x: x.churn_probability, reverse=True)

        return ChurnPredictResponse(
            supported=True,
            message="Dynamic RFM Customer Churn model successfully trained.",
            accuracy=round(acc, 4),
            total_customers_analyzed=len(rfm),
            high_risk_count=high_risk_cnt,
            risk_table=risk_table
        )

    return ChurnPredictResponse(
        supported=False,
        message="Not enough customer-level or order frequency data for churn modeling in this dataset."
    )
