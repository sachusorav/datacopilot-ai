import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import Base, engine
from app.routers import upload, clean, dashboard, predict, chat, report, llm, auth

# Initialize database tables
Base.metadata.create_all(bind=engine)

logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("datacopilot")

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Business Intelligence Platform with Local Llama, RAG & Automated ML",
    version="2.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Headers & Middleware
@app.middleware("http")
async def add_security_headers_and_logging(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = round((time.time() - start_time) * 1000, 2)
    
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["X-Process-Time-MS"] = str(process_time)
    
    logger.info(f"{request.method} {request.url.path} - {response.status_code} ({process_time}ms)")
    return response

# Global Exception Handler (Never leaks stack traces)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global unhandled exception on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again or check dataset format."}
    )

# Mount Routers
app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(clean.router)
app.include_router(dashboard.router)
app.include_router(predict.router)
app.include_router(chat.router)
app.include_router(report.router)
app.include_router(llm.router)

@app.get("/")
def read_root():
    return {
        "app": settings.APP_NAME,
        "version": "2.0.0",
        "status": "online",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": time.time()}

@app.get("/ready")
def readiness_check():
    return {"status": "ready", "database": "connected"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
