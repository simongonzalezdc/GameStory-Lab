"""Health check API endpoints."""
from fastapi import APIRouter, Depends
from app.services.ai_service import AIService
from app.models.generation import OllamaStatusResponse

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("/")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "AI Game Asset Generator",
        "version": "1.0.0"
    }


@router.get("/ollama", response_model=OllamaStatusResponse)
async def check_ollama_status():
    """
    Check Ollama availability and list available models.

    Returns:
        Ollama status with available models
    """
    ai_service = AIService()
    status = await ai_service.check_ollama_status()
    return OllamaStatusResponse(**status)
