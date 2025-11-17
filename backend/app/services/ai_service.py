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
        else:
            raise ValueError(f"Unsupported image generation model: {request.model}. Supported: openrouter, google, chatgpt")

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
        """Generate image using OpenRouter API (via Gemini image generation models)."""
        if not self.openrouter_api_key:
            raise ValueError("OpenRouter API key not configured")

        logger.info("Generating with OpenRouter (Gemini image model)...")

        # OpenRouter uses chat completions endpoint with image generation models
        async with httpx.AsyncClient(timeout=90.0) as client:
            headers = {
                "Authorization": f"Bearer {self.openrouter_api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://ai-game-asset-generator.local",
                "X-Title": "AI Game Asset Generator"
            }

            # Build prompt for game asset generation
            enhanced_prompt = self._enhance_prompt_for_game_asset(request.prompt)

            # Use Gemini 2.5 Flash Image Preview (Nano Banana) for image generation
            payload = {
                "model": "google/gemini-2.5-flash-image-preview:free",
                "messages": [
                    {
                        "role": "user",
                        "content": enhanced_prompt
                    }
                ],
                "modalities": ["image", "text"]
            }

            try:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()

                # Extract image from response
                if "choices" in data and len(data["choices"]) > 0:
                    choice = data["choices"][0]
                    message = choice.get("message", {})
                    content = message.get("content", "")

                    # Content may contain data URL: data:image/png;base64,...
                    if "data:image" in content:
                        # Extract base64 data
                        parts = content.split("data:image/png;base64,")
                        if len(parts) > 1:
                            base64_data = parts[1].split(")")[0].strip()
                            image_bytes = base64.b64decode(base64_data)

                            # Resize to requested dimensions
                            img = Image.open(io.BytesIO(image_bytes))
                            if img.size != (request.dimensions.width, request.dimensions.height):
                                img = img.resize(
                                    (request.dimensions.width, request.dimensions.height),
                                    Image.Resampling.LANCZOS
                                )
                            output = io.BytesIO()
                            img.save(output, format="PNG")
                            return output.getvalue(), "image/png"
                        else:
                            raise Exception("Could not parse base64 image data")
                    else:
                        raise Exception(f"No image data in response content: {content[:100]}")
                else:
                    raise Exception("No choices in response")

            except httpx.HTTPStatusError as e:
                error_detail = e.response.text
                logger.error(f"OpenRouter HTTP error: {e.response.status_code} - {error_detail}")
                raise Exception(f"OpenRouter API error: {e.response.status_code} - {error_detail}")
            except Exception as e:
                logger.error(f"OpenRouter generation failed: {e}")
                raise Exception(f"OpenRouter error: {str(e)}")

    async def _generate_google(
        self, request: GenerationRequest
    ) -> Tuple[bytes, str]:
        """Generate image using Google Imagen 3 API."""
        if not self.google_api_key:
            raise ValueError("Google API key not configured")

        logger.info("Generating with Google Imagen 3...")

        # Google's Imagen 3 model via generativelanguage API
        async with httpx.AsyncClient(timeout=90.0) as client:
            enhanced_prompt = self._enhance_prompt_for_game_asset(request.prompt)

            # Determine aspect ratio based on dimensions
            aspect_ratio = self._get_aspect_ratio(request.dimensions.width, request.dimensions.height)

            url = "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict"

            headers = {
                "x-goog-api-key": self.google_api_key,
                "Content-Type": "application/json"
            }

            payload = {
                "instances": [
                    {
                        "prompt": enhanced_prompt
                    }
                ],
                "parameters": {
                    "sampleCount": 1,
                    "aspectRatio": aspect_ratio
                }
            }

            try:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()

                # Extract image from response
                if "predictions" in data and len(data["predictions"]) > 0:
                    prediction = data["predictions"][0]

                    # Try different possible response formats
                    image_b64 = None
                    if "bytesBase64Encoded" in prediction:
                        image_b64 = prediction["bytesBase64Encoded"]
                    elif "image" in prediction and "bytesBase64Encoded" in prediction["image"]:
                        image_b64 = prediction["image"]["bytesBase64Encoded"]
                    elif isinstance(prediction, str):
                        image_b64 = prediction

                    if image_b64:
                        image_bytes = base64.b64decode(image_b64)

                        # Resize to exact requested dimensions
                        img = Image.open(io.BytesIO(image_bytes))
                        if img.size != (request.dimensions.width, request.dimensions.height):
                            img = img.resize(
                                (request.dimensions.width, request.dimensions.height),
                                Image.Resampling.LANCZOS
                            )
                        output = io.BytesIO()
                        img.save(output, format="PNG")
                        return output.getvalue(), "image/png"
                    else:
                        raise Exception(f"No image data in prediction: {prediction}")
                else:
                    raise Exception("No predictions in response")

            except httpx.HTTPStatusError as e:
                error_detail = e.response.text
                logger.error(f"Google Imagen HTTP error: {e.response.status_code} - {error_detail}")
                raise Exception(f"Google API error: {e.response.status_code} - {error_detail}")
            except Exception as e:
                logger.error(f"Google Imagen generation failed: {e}")
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

    def _get_aspect_ratio(self, width: int, height: int) -> str:
        """
        Get aspect ratio string for image generation.
        Supported ratios: "1:1", "3:4", "4:3", "9:16", "16:9"
        """
        # Calculate ratio
        from math import gcd
        divisor = gcd(width, height)
        ratio_w = width // divisor
        ratio_h = height // divisor

        # Map to supported aspect ratios (prefer exact matches)
        ratio_str = f"{ratio_w}:{ratio_h}"

        # Map common ratios to supported formats
        supported_ratios = {
            "1:1": "1:1",
            "3:4": "3:4",
            "4:3": "4:3",
            "9:16": "9:16",
            "16:9": "16:9"
        }

        if ratio_str in supported_ratios:
            return supported_ratios[ratio_str]

        # Find closest supported ratio
        aspect = width / height
        if aspect == 1.0:
            return "1:1"
        elif aspect < 1.0:  # Portrait
            if abs(aspect - 0.75) < abs(aspect - 0.5625):
                return "3:4"
            else:
                return "9:16"
        else:  # Landscape
            if abs(aspect - 1.333) < abs(aspect - 1.778):
                return "4:3"
            else:
                return "16:9"

    def _format_bytes(self, size: int) -> str:
        """Format bytes to human readable string."""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"
