import pandas as pd
import numpy as np
from typing import Tuple, Dict, Any
from app.schemas.schemas import CleanOptions, CleaningSummary

def clean_dataset(df: pd.DataFrame, options: CleanOptions) -> Tuple[pd.DataFrame, CleaningSummary]:
    initial_rows = len(df)
    
    # 1. Drop exact duplicate rows
    df_cleaned = df.drop_duplicates().copy()
    duplicates_removed = initial_rows - len(df_cleaned)
    
    # Track nulls filled per column
    nulls_filled: Dict[str, int] = {}
    total_nulls = 0
    
    # 2. Type Inference & Conversion
    inferred_types: Dict[str, str] = {}
    
    for col in df_cleaned.columns:
        # Check if column looks like a date
        if df_cleaned[col].dtype == 'object':
            # Try parsing date strings if string contains date hints or format matches
            sample_non_null = df_cleaned[col].dropna().astype(str)
            if not sample_non_null.empty:
                # Check for common date patterns or try pd.to_datetime safely
                first_val = sample_non_null.iloc[0]
                if any(char in first_val for char in ['-', '/', ' ']) and len(first_val) >= 6:
                    try:
                        converted = pd.to_datetime(df_cleaned[col], errors='coerce', format='mixed')
                        # If more than 60% of non-nulls converted successfully, accept datetime
                        if converted.notnull().sum() / len(sample_non_null) > 0.6:
                            df_cleaned[col] = converted
                    except Exception:
                        pass
        
        # Check if numeric strings can be numbers
        if df_cleaned[col].dtype == 'object':
            try:
                # remove currency symbols or commas if present
                cleaned_str = df_cleaned[col].astype(str).str.replace('$', '', regex=False).str.replace(',', '', regex=False).str.strip()
                numeric_converted = pd.to_numeric(cleaned_str, errors='coerce')
                if numeric_converted.notnull().sum() / max(1, len(df_cleaned[col].dropna())) > 0.7:
                    df_cleaned[col] = numeric_converted
            except Exception:
                pass
        
        # Record final type
        if pd.api.types.is_datetime64_any_dtype(df_cleaned[col]):
            inferred_types[col] = "datetime"
        elif pd.api.types.is_numeric_dtype(df_cleaned[col]):
            inferred_types[col] = "numeric"
        else:
            inferred_types[col] = "categorical"

    # 3. Missing Value Imputation
    for col in df_cleaned.columns:
        null_count = int(df_cleaned[col].isnull().sum())
        if null_count > 0:
            nulls_filled[col] = null_count
            total_nulls += null_count
            
            if pd.api.types.is_numeric_dtype(df_cleaned[col]):
                if options.numeric_strategy == "median":
                    fill_val = df_cleaned[col].median()
                elif options.numeric_strategy == "mean":
                    fill_val = df_cleaned[col].mean()
                else:
                    fill_val = 0
                df_cleaned[col] = df_cleaned[col].fillna(fill_val)
                
            elif pd.api.types.is_datetime64_any_dtype(df_cleaned[col]):
                # Fill missing dates with forward fill or mode date
                df_cleaned[col] = df_cleaned[col].ffill().bfill()
                
            else:
                if options.categorical_strategy == "mode":
                    mode_vals = df_cleaned[col].mode()
                    fill_val = mode_vals.iloc[0] if not mode_vals.empty else "Unknown"
                else:
                    fill_val = "Unknown"
                df_cleaned[col] = df_cleaned[col].fillna(fill_val)

    summary = CleaningSummary(
        duplicate_rows_removed=duplicates_removed,
        null_values_filled=nulls_filled,
        total_nulls_filled=total_nulls,
        inferred_column_types=inferred_types,
        rows_after_cleaning=len(df_cleaned)
    )
    
    return df_cleaned, summary
