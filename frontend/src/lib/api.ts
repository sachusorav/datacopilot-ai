import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface DatasetUploadResponse {
  dataset_id: string;
  filename: string;
  total_rows: number;
  total_columns: number;
  columns: string[];
  column_types: Record<string, string>;
  preview_data: Record<string, any>[];
}

export interface CleanOptions {
  numeric_strategy?: 'median' | 'mean' | 'zero';
  categorical_strategy?: 'mode' | 'unknown';
}

export interface CleaningSummary {
  duplicate_rows_removed: number;
  null_values_filled: Record<string, number>;
  total_nulls_filled: number;
  inferred_column_types: Record<string, string>;
  rows_after_cleaning: number;
}

export interface CleanResponse {
  dataset_id: string;
  is_cleaned: boolean;
  summary: CleaningSummary;
  preview_data: Record<string, any>[];
}

export interface KPICardData {
  title: string;
  value: string;
  subtext: string;
  change?: string;
  trend?: 'positive' | 'negative' | 'neutral';
}

export interface ChartSpecData {
  id: string;
  title: string;
  chart_type: string;
  data: any;
  supported: boolean;
  message?: string;
}

export interface DashboardResponse {
  dataset_id: string;
  kpis: KPICardData[];
  charts: ChartSpecData[];
}

export interface ForecastPoint {
  date: string;
  historical_sales?: number;
  forecast_sales?: number;
}

export interface SalesPredictResponse {
  supported: boolean;
  message: string;
  r2_score?: number;
  mae?: number;
  cv_score?: number;
  date_column?: string;
  target_column?: string;
  forecast_data: ForecastPoint[];
}

export interface ChurnCustomerRisk {
  customer_id: string;
  customer_name?: string;
  recency_days: number;
  purchase_frequency: number;
  churn_probability: number;
  risk_tier: 'High' | 'Medium' | 'Low';
}

export interface ChurnPredictResponse {
  supported: boolean;
  message: string;
  accuracy?: number;
  total_customers_analyzed: number;
  high_risk_count: number;
  risk_table: ChurnCustomerRisk[];
}

export interface ChatSource {
  type: 'faiss_row' | 'pandas_aggregate';
  summary: string;
  details?: Record<string, any>;
}

export interface ChatResponse {
  reply: string;
  route_used: 'aggregate' | 'lookup' | 'both' | 'deflection';
  sources: ChatSource[];
}

export interface ChatMessage {
  id?: number;
  sender: 'user' | 'ai';
  text: string;
  route_used?: string;
  sources?: ChatSource[];
  timestamp?: string;
}

export const api = {
  uploadFile: async (file: File): Promise<DatasetUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post(`${API_BASE}/api/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  cleanDataset: async (datasetId: string, options?: CleanOptions): Promise<CleanResponse> => {
    const res = await axios.post(`${API_BASE}/api/clean/${datasetId}`, options || {});
    return res.data;
  },

  getDashboard: async (datasetId: string): Promise<DashboardResponse> => {
    const res = await axios.get(`${API_BASE}/api/dashboard/${datasetId}`);
    return res.data;
  },

  getSalesPrediction: async (datasetId: string): Promise<SalesPredictResponse> => {
    const res = await axios.get(`${API_BASE}/api/predict/sales/${datasetId}`);
    return res.data;
  },

  getChurnPrediction: async (datasetId: string): Promise<ChurnPredictResponse> => {
    const res = await axios.get(`${API_BASE}/api/predict/churn/${datasetId}`);
    return res.data;
  },

  sendChatMessage: async (datasetId: string, message: string): Promise<ChatResponse> => {
    const res = await axios.post(`${API_BASE}/api/chat`, {
      dataset_id: datasetId,
      message,
    });
    return res.data;
  },

  getChatHistory: async (datasetId: string): Promise<ChatMessage[]> => {
    const res = await axios.get(`${API_BASE}/api/chat/history/${datasetId}`);
    return res.data;
  },

  getReportDownloadUrl: (datasetId: string): string => {
    return `${API_BASE}/api/report/download/${datasetId}`;
  },
};
