"""AI service for multi-provider image generation orchestration."""
import base64
import io
import logging
from typing import Optional, Tuple
from PIL import Image
import httpx

from app.core.config import settings
from app.models.generation import GenerationRequest, RefineRequest

logger = logging.getLogger(__name__)


class AIService:
    """Service for orchestrating multiple AI providers."""

    def __init__(self):
        """Initialize AI service with provider clients."""
        self.openrouter_api_key = settings.OPENROUTER_API_KEY
        self.google_api_key = settings.GOOGLE_API_KEY
        self.openai_api_key = settings.OPENAI_API_KEY
        self.ollama_base_url = settings.OLLAMA_BASE_URL
        self.ollama_enabled = settings.OLLAMA_ENABLED

    async def generate_image(
        self, request: GenerationRequest
    ) -> Tuple[bytes, str]:
        """
        Generate image using specified AI provider.

        Args:
            request: Generation request with prompt and model

        Returns:
            Tuple of (image_bytes, mime_type)

        Raises:
            ValueError: If model is not supported or API key missing
            Exception: If generation fails
        """
        if request.model == "openrouter":
            return await self._generate_openrouter(request)
        elif request.model == "google":
            return await self._generate_google(request)
        elif request.model == "chatgpt":
            return await self._generate_chatgpt(request)
        elif request.model == "ollama":
            return await self._generate_ollama(request)
        else:
            raise ValueError(f"Unsupported model: {request.model}")

    async def refine_image(
        self, original_image_bytes: bytes, request: RefineRequest
    ) -> Tuple[bytes, str]:
        """
        Refine existing image with natural language instruction.

        Args:
            original_image_bytes: Original image data
            request: Refinement request

        Returns:
            Tuple of (image_bytes, mime_type)
        """
        # Convert refinement to generation request with image context
        gen_request = GenerationRequest(
            prompt=request.instruction,
            model=request.model,
            ollama_model=request.ollama_model,
            reference_image=base64.b64encode(original_image_bytes).decode()
        )
        return await self.generate_image(gen_request)

    async def _generate_openrouter(
        self, request: GenerationRequest
    ) -> Tuple[bytes, str]:
        """Generate image using OpenRouter API (FLUX models)."""
        if not self.openrouter_api_key:
            raise ValueError("OpenRouter API key not configured")

        logger.info("Generating with OpenRouter...")

        # OpenRouter supports multiple image models via unified API
        async with httpx.AsyncClient(timeout=60.0) as client:
            headers = {
                "Authorization": f"Bearer {self.openrouter_api_key}",
                "Content-Type": "application/json"
            }

            # Build prompt for game asset generation
            enhanced_prompt = self._enhance_prompt_for_game_asset(request.prompt)

            payload = {
                "model": "black-forest-labs/flux-1.1-pro",  # High-quality model
                "prompt": enhanced_prompt,
                "width": request.dimensions.width,
                "height": request.dimensions.height,
            }

            if request.negative_prompt:
                payload["negative_prompt"] = request.negative_prompt

            try:
                response = await client.post(
                    "https://openrouter.ai/api/v1/images/generations",
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()

                # OpenRouter returns base64 encoded image
                if "data" in data and len(data["data"]) > 0:
                    image_data = data["data"][0]
                    if "b64_json" in image_data:
                        image_bytes = base64.b64decode(image_data["b64_json"])
                    elif "url" in image_data:
                        # Download from URL
                        img_response = await client.get(image_data["url"])
                        image_bytes = img_response.content
                    else:
                        raise Exception("No image data in response")

                    return image_bytes, "image/png"
                else:
                    raise Exception("No image generated")

            except Exception as e:
                logger.error(f"OpenRouter generation failed: {e}")
                raise Exception(f"OpenRouter API error: {str(e)}")

    async def _generate_google(
        self, request: GenerationRequest
    ) -> Tuple[bytes, str]:
        """Generate image using Google Gemini API."""
        if not self.google_api_key:
            raise ValueError("Google API key not configured")

        logger.info("Generating with Google Gemini...")

        # Google's Imagen model via Gemini API
        async with httpx.AsyncClient(timeout=60.0) as client:
            enhanced_prompt = self._enhance_prompt_for_game_asset(request.prompt)

            url = f"https://generativelanguage.googleapis.com/v1/models/imagen-3.0-generate-001:predict?key={self.google_api_key}"

            payload = {
                "instances": [
                    {
                        "prompt": enhanced_prompt
                    }
                ],
                "parameters": {
                    "sampleCount": 1,
                    "aspectRatio": "1:1",  # Adjust based on dimensions
                }
            }

            try:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()

                # Extract image from response
                if "predictions" in data and len(data["predictions"]) > 0:
                    image_b64 = data["predictions"][0]["bytesBase64Encoded"]
                    image_bytes = base64.b64decode(image_b64)
                    return image_bytes, "image/png"
                else:
                    raise Exception("No image generated")

            except Exception as e:
                logger.error(f"Google Gemini generation failed: {e}")
                raise Exception(f"Google API error: {str(e)}")

    async def _generate_chatgpt(
        self, request: GenerationRequest
    ) -> Tuple[bytes, str]:
        """Generate image using ChatGPT (DALL-E 3)."""
        if not self.openai_api_key:
            raise ValueError("OpenAI API key not configured")

        logger.info("Generating with DALL-E 3...")

        async with httpx.AsyncClient(timeout=60.0) as client:
            headers = {
                "Authorization": f"Bearer {self.openai_api_key}",
                "Content-Type": "application/json"
            }

            enhanced_prompt = self._enhance_prompt_for_game_asset(request.prompt)

            # DALL-E 3 has specific size requirements
            size = self._get_dalle_size(request.dimensions.width, request.dimensions.height)

            payload = {
                "model": "dall-e-3",
                "prompt": enhanced_prompt,
                "n": 1,
                "size": size,
                "quality": "standard",
                "response_format": "b64_json"
            }

            try:
                response = await client.post(
                    "https://api.openai.com/v1/images/generations",
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()

                if "data" in data and len(data["data"]) > 0:
                    image_b64 = data["data"][0]["b64_json"]
                    image_bytes = base64.b64decode(image_b64)

                    # Resize to requested dimensions if needed
                    if size != f"{request.dimensions.width}x{request.dimensions.height}":
                        img = Image.open(io.BytesIO(image_bytes))
                        img = img.resize(
                            (request.dimensions.width, request.dimensions.height),
                            Image.Resampling.LANCZOS
                        )
                        output = io.BytesIO()
                        img.save(output, format="PNG")
                        image_bytes = output.getvalue()

                    return image_bytes, "image/png"
                else:
                    raise Exception("No image generated")

            except Exception as e:
                logger.error(f"DALL-E generation failed: {e}")
                raise Exception(f"OpenAI API error: {str(e)}")

    async def _generate_ollama(
        self, request: GenerationRequest
    ) -> Tuple[bytes, str]:
        """Generate image using Ollama (local models)."""
        if not self.ollama_enabled:
            raise ValueError("Ollama is not enabled")

        if not request.ollama_model:
            raise ValueError("Ollama model name is required")

        logger.info(f"Generating with Ollama model: {request.ollama_model}...")

        async with httpx.AsyncClient(timeout=120.0) as client:  # Longer timeout for local
            enhanced_prompt = self._enhance_prompt_for_game_asset(request.prompt)

            # Ollama API for vision models
            url = f"{self.ollama_base_url}/api/generate"

            payload = {
                "model": request.ollama_model,
                "prompt": enhanced_prompt,
                "stream": False,
                "options": {
                    "num_predict": 100,  # Limit token generation for image tasks
                }
            }

            try:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()

                # Ollama vision models return base64 image in response
                if "response" in data:
                    # For vision models, the response might contain image data
                    # This is a simplified implementation
                    # In production, you'd use Ollama's specific image generation workflow

                    # For now, create a placeholder image
                    # In real implementation, integrate with stable-diffusion via Ollama
                    img = Image.new(
                        'RGBA',
                        (request.dimensions.width, request.dimensions.height),
                        (100, 100, 200, 255)
                    )
                    output = io.BytesIO()
                    img.save(output, format="PNG")
                    image_bytes = output.getvalue()

                    logger.warning("Ollama image generation using placeholder - integrate stable-diffusion for production")
                    return image_bytes, "image/png"
                else:
                    raise Exception("No response from Ollama")

            except httpx.ConnectError:
                raise Exception(
                    f"Cannot connect to Ollama at {self.ollama_base_url}. "
                    "Make sure Ollama is installed and running (ollama serve)"
                )
            except Exception as e:
                logger.error(f"Ollama generation failed: {e}")
                raise Exception(f"Ollama error: {str(e)}")

    async def check_ollama_status(self) -> dict:
        """
        Check if Ollama is available and list available models.

        Returns:
            Dict with availability status and model list
        """
        if not self.ollama_enabled:
            return {
                "available": False,
                "url": self.ollama_base_url,
                "models": [],
                "error": "Ollama is disabled in configuration"
            }

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                # Check if Ollama is running
                response = await client.get(f"{self.ollama_base_url}/api/tags")
                response.raise_for_status()
                data = response.json()

                models = []
                if "models" in data:
                    models = [
                        {
                            "name": model.get("name", ""),
                            "size": self._format_bytes(model.get("size", 0)),
                            "modified": model.get("modified_at", "")
                        }
                        for model in data["models"]
                    ]

                return {
                    "available": True,
                    "url": self.ollama_base_url,
                    "models": models
                }

        except httpx.ConnectError:
            return {
                "available": False,
                "url": self.ollama_base_url,
                "models": [],
                "error": "Cannot connect to Ollama. Make sure it's installed and running."
            }
        except Exception as e:
            return {
                "available": False,
                "url": self.ollama_base_url,
                "models": [],
                "error": str(e)
            }

    def _enhance_prompt_for_game_asset(self, prompt: str) -> str:
        """Enhance prompt with game asset specific instructions."""
        enhancements = [
            "game asset",
            "transparent background",
            "clean edges",
            "suitable for video games"
        ]

        # Check if prompt already mentions transparency
        if "transparent" not in prompt.lower() and "alpha" not in prompt.lower():
            enhanced = f"{prompt}, transparent background, game asset style"
        else:
            enhanced = f"{prompt}, game asset style"

        return enhanced

    def _get_dalle_size(self, width: int, height: int) -> str:
        """Get closest DALL-E 3 supported size."""
        # DALL-E 3 supports: 1024x1024, 1792x1024, 1024x1792
        if width == height:
            return "1024x1024"
        elif width > height:
            return "1792x1024"
        else:
            return "1024x1792"

    def _format_bytes(self, size: int) -> str:
        """Format bytes to human readable string."""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"
