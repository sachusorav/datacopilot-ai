import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON, Text, Boolean
from app.database import Base

class DatasetMeta(Base):
    __tablename__ = "datasets"

    id = Column(String, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    cleaned_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    total_rows_raw = Column(Integer, default=0)
    total_columns = Column(Integer, default=0)
    columns_info = Column(JSON, default=dict)  # {col_name: dtype}
    
    is_cleaned = Column(Boolean, default=False)
    cleaning_summary = Column(JSON, default=dict) # {duplicate_rows_removed, missing_values_filled, inferred_types}


class ChatMessageModel(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dataset_id = Column(String, index=True)
    sender = Column(String)  # 'user' or 'ai'
    text = Column(Text)
    route_used = Column(String, nullable=True)  # 'aggregate', 'lookup', 'both'
    sources = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
