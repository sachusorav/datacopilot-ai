# Multi-stage Dockerfile for DataCopilot AI

# Stage 1: Build Frontend Plain JS Static Assets
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python 3.11 FastAPI Environment
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install wheels
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./app

# Copy built static frontend files into FastAPI static mount
COPY --from=frontend-builder /app/frontend/dist ./static

# Expose HTTP port
EXPOSE 8000

ENV PYTHONUNBUFFERED=1
ENV PORT=8000

CMD ["uvicorn", "app.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
