"""Asset generation API endpoints."""
import time
import logging
from fastapi import APIRouter, HTTPException, status, File, UploadFile, Form
from typing import Optional

from app.core.config import settings
from app.models.generation import GenerationRequest, GenerationResponse, RefineRequest
from app.models.asset import AssetCreate
from app.services.ai_service import AIService
from app.services.image_service import ImageService
from app.services.local_storage_service import storage_service
from app.services.ollama_service import ollama_service
from app.services.database_service import db_service

router = APIRouter(prefix="/api/generate", tags=["generation"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=GenerationResponse)
async def generate_asset(request: GenerationRequest):
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
        503: AI service unavailable
    """
    start_time = time.time()

    # Use local user ID (no auth required for personal use)
    user_id = "local-user"

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
async def refine_asset(request: RefineRequest):
    """
    Refine existing asset with natural language instruction.

    This endpoint uses Ollama to enhance the refinement instruction into a better
    prompt, then generates a refined version using cloud AI providers.

    The refined asset is saved as a new version, linked to the parent asset.

    Args:
        request: Refinement request with asset ID and instruction

    Returns:
        Refined asset information

    Raises:
        400: Invalid request
        404: Asset not found
        503: AI service unavailable or Ollama not available
    """
    start_time = time.time()

    # Use local user ID (no auth required for personal use)
    user_id = "local-user"

    try:
        # Initialize services
        ai_service = AIService()
        image_service = ImageService()

        # Get original asset
        original_asset = await storage_service.get_asset_by_id(user_id, request.asset_id)
        if not original_asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found"
            )

        # Build context for Ollama
        asset_context = {
            "style_tags": original_asset.style_tags,
            "project_name": original_asset.project_name,
        }

        # Use Ollama to enhance the refinement instruction into a better prompt
        logger.info(f"Enhancing refinement with Ollama: '{request.instruction}'")
        enhanced_prompt = await ollama_service.enhance_refinement_prompt(
            original_prompt=original_asset.generation_prompt,
            refinement_instruction=request.instruction,
            asset_context=asset_context
        )

        logger.info(f"Enhanced prompt: '{enhanced_prompt}'")

        # Read original image from local storage for img2img (if supported)
        file_path = storage_service.get_file_path(original_asset.file_url)
        with open(file_path, 'rb') as f:
            original_image_bytes = f.read()

        # Create a modified generation request with the enhanced prompt
        generation_request = GenerationRequest(
            prompt=enhanced_prompt,
            model=request.model,
            dimensions={"width": original_asset.width, "height": original_asset.height},
            style_tags=original_asset.style_tags,
            project_name=original_asset.project_name
        )

        # Generate refined image using cloud AI
        logger.info(f"Generating refined image with {request.model}...")
        image_bytes, mime_type = await ai_service.generate_image(generation_request)

        # Process and upload
        image_bytes = image_service.ensure_transparent_background(image_bytes)
        image_info = image_service.get_image_info(image_bytes)

        # Get next version number
        version_number = await db_service.get_next_version_number(request.asset_id, user_id)

        file_name = f"asset_v{version_number}_{int(time.time())}.png"
        file_url = await storage_service.upload_asset(
            user_id=user_id,
            file_name=file_name,
            file_bytes=image_bytes,
            mime_type=mime_type
        )

        # Save refined asset with versioning
        asset_data = AssetCreate(
            file_name=file_name,
            file_size=image_info["size_bytes"],
            width=image_info["width"],
            height=image_info["height"],
            generation_prompt=enhanced_prompt,
            generation_model=request.model,
            style_tags=original_asset.style_tags,
            project_name=original_asset.project_name,
            parent_asset_id=request.asset_id,
            version_number=version_number,
            refinement_instruction=request.instruction
        )

        asset = await storage_service.save_asset_metadata(
            user_id=user_id,
            asset_data=asset_data,
            file_url=file_url
        )

        generation_time_ms = int((time.time() - start_time) * 1000)

        logger.info(f"Refinement complete: v{version_number} created in {generation_time_ms}ms")

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


@router.post("/convert", response_model=GenerationResponse)
async def convert_image_to_sprite(
    file: UploadFile = File(...),
    project_name: Optional[str] = Form(None),
    style_tags: Optional[str] = Form(None)
):
    """
    Convert uploaded image to game-ready sprite.

    This endpoint:
    - Accepts image uploads (PNG, JPG, GIF, WebP)
    - Optimizes for game assets (transparent background, resize if needed)
    - Stores as a managed asset

    Args:
        file: Uploaded image file
        project_name: Optional project name for organization
        style_tags: Optional comma-separated style tags

    Returns:
        Converted asset information

    Raises:
        400: Invalid file type or file too large
        503: Conversion failed
    """
    start_time = time.time()

    # Use local user ID (no auth required for personal use)
    user_id = "local-user"

    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )

        # Read uploaded file
        logger.info(f"Converting uploaded image: {file.filename}")
        image_bytes = await file.read()

        # Validate file size (max 10MB)
        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File too large. Maximum size is 10MB"
            )

        # Initialize services
        image_service = ImageService()

        # Process image for game asset
        logger.info("Processing image for game asset...")

        # Ensure transparent background
        image_bytes = image_service.ensure_transparent_background(image_bytes)

        # Optimize for game assets (reduce file size while maintaining quality)
        image_bytes = image_service.optimize_for_game(image_bytes)

        # Get image info
        image_info = image_service.get_image_info(image_bytes)

        # Upload to storage
        logger.info("Uploading to storage...")
        file_name = f"converted_{int(time.time())}.png"
        file_url = await storage_service.upload_asset(
            user_id=user_id,
            file_name=file_name,
            file_bytes=image_bytes,
            mime_type="image/png"
        )

        # Parse style tags
        tags = [tag.strip() for tag in style_tags.split(',')] if style_tags else []

        # Save metadata
        asset_data = AssetCreate(
            file_name=file_name,
            file_size=image_info["size_bytes"],
            width=image_info["width"],
            height=image_info["height"],
            generation_prompt=f"Converted from: {file.filename}",
            generation_model="image-to-sprite",
            style_tags=tags,
            project_name=project_name
        )

        asset = await storage_service.save_asset_metadata(
            user_id=user_id,
            asset_data=asset_data,
            file_url=file_url
        )

        generation_time_ms = int((time.time() - start_time) * 1000)

        logger.info(f"Image converted successfully in {generation_time_ms}ms")

        return GenerationResponse(
            success=True,
            asset=asset.model_dump(),
            generation_id=asset.id,
            generation_time_ms=generation_time_ms
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image conversion failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Conversion failed: {str(e)}"
        )
