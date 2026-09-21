# DataCopilot AI — AI-Powered Business Intelligence Platform

DataCopilot AI is a full-stack, AI-driven business intelligence application. Users can upload CSV or Excel dataset files to clean data automatically, explore an executive Plotly dashboard, train Machine Learning models (Sales Forecasting & Customer Churn Classification), chat with their data using a Hybrid RAG pipeline (FAISS + Gemini 2.0 Flash), and export downloadable PDF executive reports.

---

## 🌟 Key Features

1. **Automated Data Cleaning**: Detects and strips exact duplicate rows, imputes missing values using statistical medians/modes, and infers strong column types.
2. **Interactive Intelligence Dashboard**: Automatically calculates executive KPIs (Total Revenue, Order Volume, Avg Order Value) and generates dynamic Plotly chart specifications.
3. **Automated Machine Learning**:
   - **Sales Forecasting**: GradientBoosting / Ridge regression models with 14-period future time-series projections.
   - **Customer Churn Risk**: RandomForest Classifier evaluating recency, frequency, and monetary metrics with high/medium/low risk categorization.
4. **Hybrid RAG AI Chatbot**:
   - Routes user queries between **Server-Side Pandas Aggregations** (for exact math) and **FAISS Vector Search** (for semantic row retrieval).
   - Powered by `google-genai` with `gemini-2.0-flash`.
   - Includes full "Grounded Context & Calculation Inspector".
5. **Executive PDF Reports**: Generates multi-page PDF documents containing KPI cards, ML summaries, and AI-authored strategic recommendations via ReportLab.
6. **Modern Design System**: Dark/Light mode, generous whitespace, single clean primary accent (`#3b82f6`), custom empty states, and responsive tables (~375px usable width).

---

## 🚀 Architecture & Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy, Pandas, NumPy, Scikit-learn, FAISS, ReportLab, Google GenAI SDK (`google-genai`).
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Plotly.js (`react-plotly.js`), Axios.
- **Database**: SQLite (local fallback) / PostgreSQL (production-ready ORM layer).

---

## 🛠️ Quick Start Guide

### 1. Prerequisites
- Python 3.11+
- Node.js 18+

### 2. Generate Synthetic Test Dataset
To generate `sample_data/retail_sales_churn.csv`:
```bash
python sample_data/generate_data.py
```

### 3. Backend Setup & Startup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt

# Create .env file with your Gemini API key:
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env

# Run FastAPI Server (port 8000)
python -m uvicorn app.main:app --reload --port 8000
```
*API Documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs)*

### 4. Frontend Setup & Startup
```bash
cd frontend
npm install

# Run Vite Dev Server (port 3000)
npm run dev
```
*Open [http://localhost:3000](http://localhost:3000) in your browser.*

---

## ☁️ Deployment

### Render Deployment (`render.yaml`)
The project includes a `render.yaml` blueprint defining:
- **Backend Service**: Web Service running Uvicorn on Python 3.11.
- **Frontend Service**: Static Site built with Vite.

Set `GEMINI_API_KEY` in your Render Environment dashboard.

### Docker Deployment
Build and run the container:
```bash
docker build -t datacopilot-backend .
docker run -p 8000:8000 -e GEMINI_API_KEY="your_api_key" datacopilot-backend
```
# datacopilot-ai
