# DATACOPILOT AI - System & Performance Audit (Phase 0)

## Executive Summary
This audit analyzes the existing **DATACOPILOT AI** codebase across backend handlers, RAG services, machine learning engines, and frontend framework setup to identify bottlenecks, security gaps, and architectural limitations prior to the Phase 1–8 execution.

---

## 1. Chat & RAG Performance Bottlenecks

### A. Blocking Async Handlers
- **Issue**: In `backend/app/routers/chat.py`, the endpoint `async def chat_with_data` performs synchronous I/O (`pd.read_csv`, `pd.read_excel`), database transactions (`db.commit()`), and CPU-bound vector indexing / aggregate calculations directly on the asyncio event loop thread.
- **Impact**: Completely blocks the server's single event loop thread, preventing concurrent API requests and UI responsiveness while processing chat queries.

### B. LLM Provider & Serial Fallback Chain
- **Issue**: `gemini_service.py` uses a hardcoded, serial loop across 5 Gemini model identifiers (`gemini-2.5-flash`, `2.0-flash`, `1.5-flash`, `1.5-pro`, `2.0-flash-lite`).
- **Impact**: When an API key is invalid, network-restricted, or rate-limited, requests spend 10–20+ seconds trying models sequentially, triggering rate-limit sleep pauses (`time.sleep(0.3)`).

### C. Network-Bound Row Embeddings
- **Issue**: `DatasetRAGIndex._build_index` sends row summary strings in batches of 20 to Google's `models/gemini-embedding-001` over HTTP during index build.
- **Impact**: High network latency, fragile dependency on external APIs, and failure fallback to TF-IDF vectorization.

### D. Volatile In-Memory Vector Index
- **Issue**: FAISS vector indices (`DatasetRAGIndex`) are stored in a global Python dictionary `_active_rag_indexes` in RAM.
- **Impact**: Rebuilding the index on every server restart or cold start adds significant latency to the first user question.

### E. Lack of Token Streaming
- **Issue**: The server generates the full LLM answer synchronously and returns a single `ChatResponse` JSON object.
- **Impact**: Users wait for the full response before seeing any text, degrading perceived performance.

---

## 2. Frontend Framework & TypeScript Audit

### A. Current TypeScript Setup
- Files in scope for plain JavaScript conversion:
  - `App.tsx` $\rightarrow$ `App.jsx`
  - `main.tsx` $\rightarrow$ `main.jsx`
  - `vite.config.ts` $\rightarrow$ `vite.config.js`
  - `lib/api.ts` $\rightarrow$ `lib/api.js`
  - Components (`Sidebar.tsx`, `Header.tsx`, `KPICard.tsx`, `InsightRow.tsx`, `RiskBadge.tsx`, `CleaningSummaryCard.tsx`, `FileUploader.tsx`, `OnboardingScreen.tsx`, `ChartPanel.tsx`, `ChatWidget.tsx`, `ReportPanel.tsx`, `Toast.tsx`, `Skeleton.tsx`, `Logo.tsx`) $\rightarrow$ `.jsx`
  - Pages (`OverviewPage.tsx`, `DashboardPage.tsx`, `PredictionsPage.tsx`, `ChatPage.tsx`, `ReportsPage.tsx`, `SettingsPage.tsx`) $\rightarrow$ `.jsx`
- **Files to Remove**: `tsconfig.json`, `src/vite-env.d.ts`, `src/types/plotly.d.ts`, `src/types/`.
- **Dependencies to Remove**: `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `@types/plotly.js`.

---

## 3. Infrastructure & Repository Verification

- `backend/app/routers/` exists with active router modules (`chat.py`, `clean.py`, `dashboard.py`, `predict.py`, `report.py`, `upload.py`).
- Existing `Dockerfile` and `render.yaml` exist in the root directory.
- `README.md` will be created with detailed setup, architecture diagrams, and Ollama/Groq deployment guides.
