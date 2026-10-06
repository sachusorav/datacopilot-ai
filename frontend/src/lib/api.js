import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
});

// Interceptor to attach JWT token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('datacopilot_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (email, password) => api.post('/auth/register', { email, password }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
};

export const uploadAPI = {
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const cleanAPI = {
  cleanData: (datasetId, options = {}) => api.post(`/clean/${datasetId}`, options),
};

export const dashboardAPI = {
  getDashboard: (datasetId) => api.get(`/dashboard/${datasetId}`),
};

export const predictAPI = {
  getSalesForecast: (datasetId) => api.get(`/predict/sales/${datasetId}`),
  getChurnRisk: (datasetId) => api.get(`/predict/churn/${datasetId}`),
  getAnomalies: (datasetId) => api.get(`/predict/anomalies/${datasetId}`),
  getQualityScore: (datasetId) => api.get(`/predict/quality/${datasetId}`),
};

export const llmAPI = {
  getStatus: () => api.get('/llm/status'),
};

export const chatAPI = {
  getHistory: (datasetId) => api.get(`/chat/history/${datasetId}`),
  sendMessage: (datasetId, message) => api.post('/chat', { dataset_id: datasetId, message }),

  // Streaming SSE Chat
  streamMessage: (datasetId, message, onStart, onToken, onSources, onError) => {
    const controller = new AbortController();
    const token = localStorage.getItem('datacopilot_token');

    fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ dataset_id: datasetId, message }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace(/^data:\s*/, '').trim();
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.event === 'start') onStart?.(parsed);
                else if (parsed.event === 'token') onToken?.(parsed.chunk);
                else if (parsed.event === 'sources') onSources?.(parsed.sources, parsed.provider);
              } catch (e) {
                // Ignore parse errors on trailing delimiters
              }
            }
          }
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') onError?.(err);
      });

    return () => controller.abort();
  },
};

export const reportAPI = {
  generatePDF: (datasetId) => api.get(`/report/pdf/${datasetId}`, { responseType: 'blob' }),
};

export default api;
