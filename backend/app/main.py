import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import Base, engine
from app.routers import upload, clean, dashboard, predict, chat, report

# Initialize database tables
Base.metadata.create_all(bind=engine)

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger("datacopilot")

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Business Intelligence Platform with Hybrid RAG & Automated ML",
    version="1.0.0"
)

# CORS Configuration for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local dev frontend & preview
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"An internal server error occurred: {str(exc)}"}
    )

# Mount Routers
app.include_router(upload.router)
app.include_router(clean.router)
app.include_router(dashboard.router)
app.include_router(predict.router)
app.include_router(chat.router)
app.include_router(report.router)

@app.get("/")
def read_root():
    return {
        "app": settings.APP_NAME,
        "status": "online",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
