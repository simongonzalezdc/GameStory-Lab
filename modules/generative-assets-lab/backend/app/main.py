"""Main FastAPI application."""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os

from app.core.config import settings
from app.api import health, generate, assets, export, asset_packs
from app.services.database_service import db_service

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.RATE_LIMIT_PER_HOUR}/hour"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown."""
    # Startup
    logger.info("Starting AI Game Asset Generator API...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"CORS Origins: {settings.cors_origins_list}")
    logger.info(f"Database: {settings.DATABASE_PATH}")
    logger.info(f"Storage: {settings.STORAGE_PATH}")

    # Initialize database
    await db_service.initialize_database()
    logger.info("Database initialized successfully")

    # Check AI providers
    providers = []
    if settings.OPENROUTER_API_KEY:
        providers.append("OpenRouter")
    if settings.GOOGLE_API_KEY:
        providers.append("Google")
    if settings.OPENAI_API_KEY:
        providers.append("OpenAI")
    if settings.OLLAMA_ENABLED:
        providers.append(f"Ollama (local at {settings.OLLAMA_BASE_URL})")

    if providers:
        logger.info(f"Available AI providers: {', '.join(providers)}")
    else:
        logger.warning("No AI providers configured! Check environment variables.")

    if not settings.has_any_ai_provider():
        logger.error("WARNING: No AI providers are configured. Generation will fail.")

    yield  # Application runs

    # Shutdown
    logger.info("Shutting down AI Game Asset Generator API...")


# Create FastAPI app with lifespan
app = FastAPI(
    title="AI Game Asset Generator",
    description="Generate game-ready 2D assets using AI with support for multiple providers including Ollama for local generation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS - Restricted for security
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],  # Specific methods only
    allow_headers=["Content-Type", "Authorization", "X-Request-ID"],  # Specific headers only
    expose_headers=["X-Total-Count", "X-Rate-Limit-Remaining"],
)

# Mount static files for serving assets
# Ensure the directory exists before mounting
if not os.path.exists(settings.STORAGE_PATH):
    os.makedirs(settings.STORAGE_PATH, exist_ok=True)
app.mount("/assets", StaticFiles(directory=settings.STORAGE_PATH), name="assets")

# Create API v1 router
api_v1 = APIRouter(prefix="/api/v1", tags=["v1"])
api_v1.include_router(health.router, tags=["health"])
api_v1.include_router(generate.router, tags=["generation"])
api_v1.include_router(assets.router, tags=["assets"])
api_v1.include_router(asset_packs.router, tags=["asset-packs"])
api_v1.include_router(export.router, tags=["export"])

# Include API v1
app.include_router(api_v1)

# Also include routers at /api/* for backward compatibility (will deprecate)
app.include_router(health.router, deprecated=True)
app.include_router(generate.router, deprecated=True)
app.include_router(assets.router, deprecated=True)
app.include_router(asset_packs.router, deprecated=True)
app.include_router(export.router, deprecated=True)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "AI Game Asset Generator API (Local Edition)",
        "version": "1.0.0",
        "storage": "Local SQLite + File System",
        "docs": "/docs",
        "health": "/api/health",
        "features": [
            "Text-to-sprite generation",
            "Image-to-sprite conversion",
            "Natural language refinement",
            "Local AI models via Ollama (privacy-first!)",
            "Multi-provider support (OpenRouter, Google, ChatGPT, Ollama)",
            "Local asset library management",
            "Sprite sheet export",
            "Game engine format support (Unity, Godot, Generic)",
            "No authentication required (personal use)",
            "All data stored locally"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=settings.LOG_LEVEL.lower()
    )
