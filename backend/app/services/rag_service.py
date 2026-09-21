import re
import logging
import numpy as np
import pandas as pd
import faiss
from typing import Dict, Any, List, Tuple, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from app.services.gemini_service import get_embeddings, generate_text_response
from app.schemas.schemas import ChatSource, ChatResponse

logger = logging.getLogger(__name__)

class DatasetRAGIndex:
    """
    In-memory RAG Index for an uploaded dataset.
    Combines FAISS vector search for lookup questions and Pandas aggregate executor for analytical queries.
    """
    def __init__(self, dataset_id: str, df: pd.DataFrame):
        self.dataset_id = dataset_id
        self.df = df.copy()
        self.row_summaries: List[str] = []
        self.faiss_index: Optional[faiss.IndexFlatL2] = None
        self.use_tfidf = False
        self.tfidf_vectorizer: Optional[TfidfVectorizer] = None
        self.tfidf_matrix = None
        
        self._build_index()

    def _build_index(self):
        """Build row summaries and vector embeddings for FAISS index."""
        if self.df.empty:
            return

        # 1. Create Row Summaries
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

        self.row_summaries = summaries

        # 2. Embed via Gemini Embedding API or TF-IDF Fallback
        gemini_vectors = get_embeddings(summaries[:150])  # limit batch for speed
        if gemini_vectors and len(gemini_vectors) == len(summaries[:150]):
            vec_arr = np.array(gemini_vectors, dtype=np.float32)
            # Normalize for cosine similarity
            faiss.normalize_L2(vec_arr)
            d = vec_arr.shape[1]
            self.faiss_index = faiss.IndexFlatL2(d)
            self.faiss_index.add(vec_arr)
            self.use_tfidf = False
        else:
            # Fallback to Scikit-Learn TF-IDF for lightning-fast local vector search
            self.use_tfidf = True
            self.tfidf_vectorizer = TfidfVectorizer(stop_words='english')
            self.tfidf_matrix = self.tfidf_vectorizer.fit_transform(summaries)
            d = self.tfidf_matrix.shape[1]
            vec_arr = self.tfidf_matrix.toarray().astype(np.float32)
            faiss.normalize_L2(vec_arr)
            self.faiss_index = faiss.IndexFlatL2(d)
            self.faiss_index.add(vec_arr)

    def search_similar_rows(self, query: str, top_k: int = 5) -> List[Tuple[int, str, float]]:
        """Search FAISS index for top_k most relevant rows."""
        if self.faiss_index is None or not self.row_summaries:
            return []

        try:
            if not self.use_tfidf:
                query_embeddings = get_embeddings([query])
                if not query_embeddings:
                    return self._tfidf_search(query, top_k)
                q_vec = np.array(query_embeddings, dtype=np.float32)
            else:
                return self._tfidf_search(query, top_k)

            faiss.normalize_L2(q_vec)
            distances, indices = self.faiss_index.search(q_vec, min(top_k, len(self.row_summaries)))
            
            results = []
            for idx, dist in zip(indices[0], distances[0]):
                if 0 <= idx < len(self.row_summaries):
                    results.append((int(idx), self.row_summaries[idx], float(dist)))
            return results
        except Exception as e:
            logger.warning(f"FAISS search failed: {e}")
            return self._tfidf_search(query, top_k)

    def _tfidf_search(self, query: str, top_k: int = 5) -> List[Tuple[int, str, float]]:
        if not self.tfidf_vectorizer or self.tfidf_matrix is None:
            return []
        q_vec = self.tfidf_vectorizer.transform([query]).toarray().astype(np.float32)
        if q_vec.shape[1] != self.faiss_index.d:
            return []
        faiss.normalize_L2(q_vec)
        distances, indices = self.faiss_index.search(q_vec, min(top_k, len(self.row_summaries)))
        results = []
        for idx, dist in zip(indices[0], distances[0]):
            if 0 <= idx < len(self.row_summaries):
                results.append((int(idx), self.row_summaries[idx], float(dist)))
        return results


# Global in-memory registry of active RAG indexes per dataset
_active_rag_indexes: Dict[str, DatasetRAGIndex] = {}

def register_dataset_rag(dataset_id: str, df: pd.DataFrame) -> DatasetRAGIndex:
    rag_index = DatasetRAGIndex(dataset_id, df)
    _active_rag_indexes[dataset_id] = rag_index
    return rag_index

def get_dataset_rag(dataset_id: str) -> Optional[DatasetRAGIndex]:
    return _active_rag_indexes.get(dataset_id)


def route_query_intent(query: str) -> str:
    """
    Classifies user question into 'aggregate', 'lookup', or 'both'.
    Uses regex heuristic first for maximum speed, falling back to lightweight intent classification.
    """
    q_lower = query.lower()
    
    # Aggregation signals
    agg_keywords = ["total", "sum", "average", "avg", "mean", "count", "how many", "highest", "lowest", "max", "min", "top", "overall", "revenue", "sales"]
    lookup_keywords = ["find", "who", "show me order", "details", "specific", "customer", "search", "lookup", "where"]

    has_agg = any(kw in q_lower for kw in agg_keywords)
    has_lookup = any(kw in q_lower for kw in lookup_keywords)

    if has_agg and has_lookup:
        return "both"
    elif has_agg:
        return "aggregate"
    elif has_lookup:
        return "lookup"
    else:
        return "both"  # Default to hybrid RAG for thorough context


def execute_pandas_aggregate(df: pd.DataFrame, query: str) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
    """
    Executes Pandas operations to calculate exact statistics based on the user query.
    Returns formatted calculation summary string and calculation dictionary.
    """
    q_lower = query.lower()
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
    date_cols = [c for c in df.columns if pd.api.types.is_datetime64_any_dtype(df[c])]

    res_parts = []
    meta = {}

    # Total Sales / Revenue
    sales_col = next((c for c in numeric_cols if any(k in c.lower() for k in ["sales", "revenue", "amount", "total"])), None)
    if sales_col and any(k in q_lower for k in ["sales", "revenue", "amount", "total"]):
        total_val = float(df[sales_col].sum())
        avg_val = float(df[sales_col].mean())
        res_parts.append(f"Total {sales_col}: ${total_val:,.2f} (Average per row: ${avg_val:,.2f})")
        meta[f"Total_{sales_col}"] = total_val
        meta[f"Average_{sales_col}"] = avg_val

    # Row count / Order count
    if "how many" in q_lower or "count" in q_lower or "total orders" in q_lower or "total records" in q_lower:
        count_val = len(df)
        res_parts.append(f"Total Records/Orders Count: {count_val}")
        meta["Total_Records"] = count_val

    # Top Category / Product breakdown
    if ("top" in q_lower or "highest" in q_lower or "best" in q_lower or "category" in q_lower) and cat_cols:
        group_col = next((c for c in cat_cols if any(k in c.lower() for k in ["category", "product", "region", "segment"])), cat_cols[0])
        if sales_col:
            top_grouped = df.groupby(group_col)[sales_col].sum().sort_values(ascending=False).head(5)
            top_str = ", ".join([f"{k}: ${v:,.2f}" for k, v in top_grouped.items()])
            res_parts.append(f"Top 5 by {group_col} ({sales_col}): {top_str}")
            meta[f"Top_5_{group_col}"] = top_grouped.to_dict()
        else:
            top_counts = df[group_col].value_counts().head(5)
            top_str = ", ".join([f"{k}: {v} orders" for k, v in top_counts.items()])
            res_parts.append(f"Top 5 {group_col} by frequency: {top_str}")
            meta[f"Top_5_{group_col}_counts"] = top_counts.to_dict()

    if res_parts:
        summary_text = "\n".join(res_parts)
        return summary_text, meta

    # General descriptive stats fallback
    if numeric_cols:
        summary_dict = {}
        for c in numeric_cols[:4]:
            summary_dict[c] = {"sum": round(float(df[c].sum()), 2), "mean": round(float(df[c].mean()), 2)}
        return f"Dataset Summary Metrics: {summary_dict}", summary_dict

    return None, None


def answer_rag_chat(dataset_id: str, df: pd.DataFrame, user_message: str) -> ChatResponse:
    """
    Main RAG pipeline handler executing intent routing, Pandas analytics, FAISS lookup, and Gemini prompt assembly.
    """
    # Check out-of-scope question
    out_of_scope_keywords = ["weather", "president", "capital of", "recipe", "joke", "tell me a story", "sports score"]
    if any(kw in user_message.lower() for kw in out_of_scope_keywords) and not any(k in user_message.lower() for k in ["sales", "data", "revenue", "order"]):
        return ChatResponse(
            reply="I am your DataCopilot AI assistant focused specifically on analyzing your uploaded business dataset. Please ask a question related to your dataset's sales, revenue, orders, customers, or trends!",
            route_used="deflection",
            sources=[]
        )

    # Get or create RAG index for this dataset
    rag_index = get_dataset_rag(dataset_id)
    if not rag_index:
        rag_index = register_dataset_rag(dataset_id, df)

    intent = route_query_intent(user_message)
    sources: List[ChatSource] = []
    context_chunks = []

    # 1. Aggregate Path
    if intent in ["aggregate", "both"]:
        agg_summary, agg_meta = execute_pandas_aggregate(df, user_message)
        if agg_summary:
            context_chunks.append(f"=== EXACT CALCULATED METRICS (COMPUTED SERVER-SIDE) ===\n{agg_summary}")
            sources.append(ChatSource(
                type="pandas_aggregate",
                summary="Exact Server-Side Pandas Aggregation",
                details=agg_meta
            ))

    # 2. Lookup / FAISS Semantic Path
    if intent in ["lookup", "both"]:
        similar_rows = rag_index.search_similar_rows(user_message, top_k=5)
        if similar_rows:
            row_texts = [row_str for _, row_str, _ in similar_rows]
            context_chunks.append(f"=== RETRIEVED RELEVANT DATASET ROWS (FAISS VECTOR SEARCH) ===\n" + "\n".join(row_texts))
            for idx, row_str, dist in similar_rows:
                sources.append(ChatSource(
                    type="faiss_row",
                    summary=row_str,
                    details={"row_index": idx, "similarity_distance": round(dist, 4)}
                ))

    # Assemble Prompt for Gemini
    combined_context = "\n\n".join(context_chunks) if context_chunks else "No specific matching rows or aggregates found."
    
    system_prompt = (
        "You are DataCopilot AI, an expert Business Intelligence assistant.\n"
        "Your task is to answer the user's question clearly, professionally, and concisely.\n"
        "STRICT GROUNDING RULES:\n"
        "1. Base your answer ONLY on the provided calculated metrics and retrieved rows.\n"
        "2. DO NOT invent or extrapolate numbers that are not present in the calculated metrics or retrieved rows.\n"
        "3. Always reference specific numbers, products, customers, or categories when answering.\n"
        "4. Format your response cleanly using markdown bullet points or bold text."
    )

    user_prompt = f"Data Context:\n{combined_context}\n\nUser Question: {user_message}"

    ai_reply = generate_text_response(user_prompt, system_instruction=system_prompt)

    return ChatResponse(
        reply=ai_reply,
        route_used=intent,
        sources=sources
    )
