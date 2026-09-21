# DataCopilot AI — AI-Powered Business Intelligence Platform

DataCopilot AI is an AI-powered business intelligence platform that transforms raw CSV and Excel datasets into actionable business insights.

Users can upload their data, automatically clean and analyze it, explore interactive dashboards, generate ML-based predictions, ask questions through an AI chatbot, and export executive reports — without writing code or SQL.

## Key Features

### 1. Automated Data Cleaning

* Removes duplicate records.
* Handles missing values automatically.
* Detects and standardizes column data types.

### 2. Interactive Business Dashboard

* Automatically generates key business KPIs.
* Provides interactive charts and visualizations.
* Helps users quickly understand sales and customer performance.

### 3. Machine Learning

* **Sales Forecasting:** Predicts future sales trends.
* **Customer Churn Prediction:** Identifies customers at different levels of churn risk.

### 4. AI Data Chatbot

* Ask questions about uploaded business data in natural language.
* Uses exact data calculations for numerical queries.
* Uses semantic search to retrieve relevant information.
* Provides grounded answers based on the uploaded dataset.

### 5. Executive Reports

* Generates downloadable PDF reports.
* Includes KPIs, visual insights, ML results, and AI-generated recommendations.

### 6. Modern & Responsive UI

* Clean and professional dashboard interface.
* Dark and light modes.
* Responsive design for desktop and smaller screens.
* Simple navigation focused on usability.

---

## Architecture & Tech Stack

### Backend

* Python
* FastAPI
* Pandas
* NumPy
* Scikit-learn
* FAISS
* ReportLab
* Google GenAI

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Plotly.js
* Axios
* Lucide Icons

### Database

* SQLite for local development
* PostgreSQL-ready architecture for production

---

## Quick Start

### Prerequisites

* Python 3.11+
* Node.js 18+

### Backend

```bash
cd backend

python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS/Linux
# source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the backend:

```bash
python -m uvicorn app.main:app --reload --port 8000
```

API documentation:

`http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open:

`http://localhost:3000`

---

## Deployment

DataCopilot AI can be deployed using:

* Render
* Docker
* PostgreSQL for production database requirements

Set the `GEMINI_API_KEY` environment variable in your deployment environment.

---

## Project

**DataCopilot AI**

An AI-powered business intelligence platform designed to make data analysis accessible to non-technical users.
