import logging
import pandas as pd
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

ALLOWED_OPERATIONS = {"sum", "mean", "count", "min", "max", "group_by_sum", "overview"}

class QueryPlan(BaseModel):
    operation: str = Field(description="One of: sum, mean, count, min, max, group_by_sum, overview")
    column: Optional[str] = None
    group_by: Optional[str] = None
    limit: int = 5

def validate_and_execute_query_plan(df: pd.DataFrame, plan_dict: Dict[str, Any]) -> tuple[Optional[str], Optional[Dict[str, Any]]]:
    """
    Validates a constrained JSON query plan against real DataFrame column names and allowed operations.
    Executes using safe, predefined Pandas calculations.
    Returns: (summary_text, metadata_dict)
    """
    try:
        plan = QueryPlan(**plan_dict)
    except Exception as e:
        logger.warning(f"Invalid query plan structure: {e}")
        return None, None

    if plan.operation not in ALLOWED_OPERATIONS:
        logger.warning(f"Rejected query plan operation: {plan.operation}")
        return None, None

    valid_cols = set(df.columns)
    numeric_cols = set(df.select_dtypes(include=['number']).columns)
    cat_cols = set(df.select_dtypes(include=['object', 'category']).columns)

    # Validate column parameters
    if plan.column and plan.column not in valid_cols:
        logger.warning(f"Column '{plan.column}' not in dataset.")
        return None, None
    if plan.group_by and plan.group_by not in valid_cols:
        logger.warning(f"Group-by column '{plan.group_by}' not in dataset.")
        return None, None

    # Overview Operation
    if plan.operation == "overview":
        meta = {
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "missing_values": int(df.isnull().sum().sum()),
            "duplicate_rows": int(df.duplicated().sum())
        }
        text = f"Dataset Overview: {len(df):,} records across {len(df.columns)} columns."
        return text, meta

    # Count Operation
    if plan.operation == "count":
        cnt = len(df)
        return f"Total Record Count: {cnt:,}", {"Total_Records": cnt}

    # Sum / Mean / Min / Max Operations
    if plan.operation in {"sum", "mean", "min", "max"}:
        col = plan.column or (list(numeric_cols)[0] if numeric_cols else None)
        if not col or col not in numeric_cols:
            return None, None
        
        if plan.operation == "sum":
            val = float(df[col].sum())
            return f"Total {col}: {val:,.2f}", {f"Total_{col}": val}
        elif plan.operation == "mean":
            val = float(df[col].mean())
            return f"Average {col}: {val:,.2f}", {f"Average_{col}": val}
        elif plan.operation == "min":
            val = float(df[col].min())
            return f"Minimum {col}: {val:,.2f}", {f"Minimum_{col}": val}
        elif plan.operation == "max":
            val = float(df[col].max())
            return f"Maximum {col}: {val:,.2f}", {f"Maximum_{col}": val}

    # Group By Sum Operation
    if plan.operation == "group_by_sum":
        group_c = plan.group_by or (list(cat_cols)[0] if cat_cols else None)
        num_c = plan.column or (list(numeric_cols)[0] if numeric_cols else None)
        
        if group_c and num_c and num_c in numeric_cols:
            grouped = df.groupby(group_c)[num_c].sum().sort_values(ascending=False).head(plan.limit)
            top_str = ", ".join([f"{k}: {v:,.2f}" for k, v in grouped.items()])
            text = f"Top {plan.limit} by {group_c} ({num_c}): {top_str}"
            meta = {f"Top_{plan.limit}_{group_c}": grouped.to_dict()}
            return text, meta

    return None, None
