import os
import pickle
import logging
import numpy as np
import pandas as pd
from typing import List, Tuple, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.config import settings

logger = logging.getLogger(__name__)

class LocalTFIDFIndex:
    """Disk-persisted TF-IDF vector index for fast local dataset row retrieval."""

    def __init__(self, dataset_id: str, df: pd.DataFrame):
        self.dataset_id = dataset_id
        self.df = df.copy()
        self.index_file = os.path.join(settings.PROCESSED_DIR, f"{dataset_id}.tfidf.pkl")
        self.row_summaries: List[str] = []
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.matrix = None

        if os.path.exists(self.index_file):
            self._load_from_disk()
        else:
            self._build_and_save()

    def _build_summaries(self) -> List[str]:
        summaries = []
        for idx, row in self.df.iterrows():
            parts = []
            for col in self.df.columns:
                val = row[col]
                if pd.notnull(val):
                    if isinstance(val, (float, np.floating)):
                        parts.append(f"{col}: {val:.2f}")
                    else:
                        parts.append(f"{col}: {val}")
            summaries.append(f"Row #{idx+1}: " + ", ".join(parts))
        return summaries

    def _build_and_save(self):
        if self.df.empty:
            return
        logger.info(f"Building local TF-IDF index for dataset '{self.dataset_id}'...")
        self.row_summaries = self._build_summaries()
        self.vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
        self.matrix = self.vectorizer.fit_transform(self.row_summaries)

        try:
            with open(self.index_file, "wb") as f:
                pickle.dump({
                    "row_summaries": self.row_summaries,
                    "vectorizer": self.vectorizer,
                    "matrix": self.matrix
                }, f)
            logger.info(f"Persisted index to '{self.index_file}'.")
        except Exception as e:
            logger.error(f"Failed to persist index to disk: {e}")

    def _load_from_disk(self):
        try:
            with open(self.index_file, "rb") as f:
                data = pickle.load(f)
                self.row_summaries = data["row_summaries"]
                self.vectorizer = data["vectorizer"]
                self.matrix = data["matrix"]
            logger.info(f"Loaded persisted TF-IDF index from '{self.index_file}'.")
        except Exception as e:
            logger.warning(f"Error loading index from disk: {e}. Rebuilding...")
            self._build_and_save()

    def search(self, query: str, top_k: int = 5) -> List[Tuple[int, str, float]]:
        if not self.vectorizer or self.matrix is None or not self.row_summaries:
            return []
        try:
            q_vec = self.vectorizer.transform([query])
            sims = cosine_similarity(q_vec, self.matrix)[0]
            top_indices = np.argsort(sims)[::-1][:top_k]
            
            results = []
            for idx in top_indices:
                score = float(sims[idx])
                if score > 0.01:
                    results.append((int(idx), self.row_summaries[idx], round(score, 4)))
            return results
        except Exception as e:
            logger.error(f"TF-IDF search error: {e}")
            return []

_index_cache: dict[str, LocalTFIDFIndex] = {}

def get_or_create_index(dataset_id: str, df: pd.DataFrame) -> LocalTFIDFIndex:
    if dataset_id not in _index_cache:
        _index_cache[dataset_id] = LocalTFIDFIndex(dataset_id, df)
    return _index_cache[dataset_id]
