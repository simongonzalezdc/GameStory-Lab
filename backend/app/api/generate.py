"""Asset generation API endpoints."""
import time
import logging
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings
from app.models.generation import GenerationRequest, GenerationResponse, RefineRequest
from app.models.asset import AssetCreate
from app.services.ai_service import AIService
from app.services.image_service import ImageService
from app.services.storage_service import StorageService

router = APIRouter(prefix="/api/generate", tags=["generation"])
security = HTTPBearer(auto_error=False)
logger = logging.getLogger(__name__)


@router.post("/", response_model=GenerationResponse)
async def generate_asset(
    request: GenerationRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Generate game asset from text prompt.

    This endpoint supports multiple AI providers:
    - openrouter: FLUX models (cloud)
    - google: Google Gemini/Imagen (cloud)
    - chatgpt: OpenAI DALL-E 3 (cloud)
    - ollama: Local models (privacy-focused, no API costs)

    Args:
        request: Generation request with prompt and model selection

    Returns:
        Generated asset information

    Raises:
        400: Invalid request
        401: Unauthorized
        503: AI service unavailable
    """
    start_time = time.time()

    # Get user ID from credentials (simplified for demo)
    user_id = "demo-user"
    if credentials:
        # In production, verify JWT token here
        user_id = credentials.credentials[:20]  # Simplified

    try:
        # Validate Ollama-specific requirements
        if request.model == "ollama" and not request.ollama_model:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ollama_model is required when using Ollama"
            )

        # Initialize services
        ai_service = AIService()
        image_service = ImageService()
        storage_service = StorageService()

        # Generate image
        logger.info(f"Generating asset with {request.model}...")
        image_bytes, mime_type = await ai_service.generate_image(request)

        # Process image (ensure transparent background)
        logger.info("Processing image...")
        image_bytes = image_service.ensure_transparent_background(image_bytes)

        # Get image info
        image_info = image_service.get_image_info(image_bytes)

        # Upload to storage
        logger.info("Uploading to storage...")
        file_name = f"asset_{int(time.time())}.png"
        file_url = await storage_service.upload_asset(
            user_id=user_id,
            file_name=file_name,
            file_bytes=image_bytes,
            mime_type=mime_type
        )

        # Save metadata
        asset_data = AssetCreate(
            file_name=file_name,
            file_size=image_info["size_bytes"],
            width=image_info["width"],
            height=image_info["height"],
            generation_prompt=request.prompt,
            generation_model=request.model if request.model != "ollama" else f"ollama:{request.ollama_model}",
            style_tags=request.style_tags,
            project_name=request.project_name
        )

        asset = await storage_service.save_asset_metadata(
            user_id=user_id,
            asset_data=asset_data,
            file_url=file_url
        )

        generation_time_ms = int((time.time() - start_time) * 1000)

        logger.info(f"Asset generated successfully in {generation_time_ms}ms")

        return GenerationResponse(
            success=True,
            asset=asset.model_dump(),
            generation_id=asset.id,
            generation_time_ms=generation_time_ms
        )

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Generation failed: {str(e)}"
        )


@router.post("/refine", response_model=GenerationResponse)
async def refine_asset(
    request: RefineRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Refine existing asset with natural language instruction.

    Args:
        request: Refinement request with asset ID and instruction

    Returns:
        Refined asset information

    Raises:
        400: Invalid request
        404: Asset not found
        503: AI service unavailable
    """
    start_time = time.time()

    user_id = "demo-user"
    if credentials:
        user_id = credentials.credentials[:20]

    try:
        # Initialize services
        storage_service = StorageService()
        ai_service = AIService()
        image_service = ImageService()

        # Get original asset
        original_asset = await storage_service.get_asset_by_id(user_id, request.asset_id)
        if not original_asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found"
            )

        # Download original image
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get(original_asset.file_url)
            original_image_bytes = response.content

        # Refine image
        logger.info("Refining asset...")
        image_bytes, mime_type = await ai_service.refine_image(
            original_image_bytes,
            request
        )

        # Process and upload
        image_bytes = image_service.ensure_transparent_background(image_bytes)
        image_info = image_service.get_image_info(image_bytes)

        file_name = f"asset_refined_{int(time.time())}.png"
        file_url = await storage_service.upload_asset(
            user_id=user_id,
            file_name=file_name,
            file_bytes=image_bytes,
            mime_type=mime_type
        )

        # Save refined asset
        asset_data = AssetCreate(
            file_name=file_name,
            file_size=image_info["size_bytes"],
            width=image_info["width"],
            height=image_info["height"],
            generation_prompt=f"{original_asset.generation_prompt} | Refined: {request.instruction}",
            generation_model=request.model,
            style_tags=original_asset.style_tags,
            project_name=original_asset.project_name
        )

        asset = await storage_service.save_asset_metadata(
            user_id=user_id,
            asset_data=asset_data,
            file_url=file_url
        )

        generation_time_ms = int((time.time() - start_time) * 1000)

        return GenerationResponse(
            success=True,
            asset=asset.model_dump(),
            generation_id=asset.id,
            generation_time_ms=generation_time_ms
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Refinement failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Refinement failed: {str(e)}"
        )
