import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class UserModel(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    datasets = relationship("DatasetMeta", back_populates="owner")

class DatasetMeta(Base):
    __tablename__ = "datasets"

    id = Column(String, primary_key=True, index=True)
    owner_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    parquet_path = Column(String, nullable=True)
    cleaned_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    total_rows_raw = Column(Integer, default=0)
    total_columns = Column(Integer, default=0)
    columns_info = Column(JSON, default=dict)  # {col_name: dtype}

    is_cleaned = Column(Boolean, default=False)
    cleaning_summary = Column(JSON, default=dict)

    owner = relationship("UserModel", back_populates="datasets")

class ChatMessageModel(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dataset_id = Column(String, index=True)
    sender = Column(String)  # 'user' or 'ai'
    text = Column(Text)
    route_used = Column(String, nullable=True)
    sources = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
