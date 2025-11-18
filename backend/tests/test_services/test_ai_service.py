"""Tests for AI service."""
import pytest
import base64
from unittest.mock import AsyncMock, MagicMock, patch
import httpx

from app.services.ai_service import AIService
from app.models.generation import GenerationRequest, RefineRequest, DimensionsModel


class TestAIService:
    """Test cases for AIService."""

    @pytest.fixture
    def ai_service(self, test_settings, monkeypatch):
        """Create AI service instance with test settings."""
        # Patch settings at the module where AIService uses it
        monkeypatch.setattr("app.services.ai_service.settings", test_settings)
        return AIService()

    @pytest.mark.unit
    def test_init(self, ai_service, test_settings):
        """Test AI service initialization."""
        assert ai_service.openrouter_api_key == test_settings.OPENROUTER_API_KEY
        assert ai_service.google_api_key == test_settings.GOOGLE_API_KEY
        assert ai_service.openai_api_key == test_settings.OPENAI_API_KEY
        assert ai_service.ollama_base_url == test_settings.OLLAMA_BASE_URL
        assert ai_service.ollama_enabled == test_settings.OLLAMA_ENABLED

    @pytest.mark.unit
    async def test_generate_image_unsupported_model(self, ai_service):
        """Test generating image with unsupported model."""
        # Create a valid request first
        request = GenerationRequest(
            prompt="a fire breathing dragon",
            model="openrouter",
            dimensions=DimensionsModel(width=64, height=64)
        )

        # Manually change the model to an unsupported one to bypass pydantic validation
        request.model = "unsupported-model"

        with pytest.raises(ValueError) as exc_info:
            await ai_service.generate_image(request)

        assert "Unsupported image generation model" in str(exc_info.value)

    @pytest.mark.unit
    async def test_generate_openrouter_no_api_key(self, ai_service):
        """Test OpenRouter generation without API key."""
        ai_service.openrouter_api_key = None

        request = GenerationRequest(
            prompt="a fire breathing dragon",
            model="openrouter",
            dimensions=DimensionsModel(width=64, height=64)
        )

        with pytest.raises(ValueError) as exc_info:
            await ai_service._generate_openrouter(request)

        assert "OpenRouter API key not configured" in str(exc_info.value)

    @pytest.mark.unit
    async def test_generate_google_no_api_key(self, ai_service):
        """Test Google generation without API key."""
        ai_service.google_api_key = None

        request = GenerationRequest(
            prompt="a powerful wizard",
            model="google",
            dimensions=DimensionsModel(width=64, height=64)
        )

        with pytest.raises(ValueError) as exc_info:
            await ai_service._generate_google(request)

        assert "Google API key not configured" in str(exc_info.value)

    @pytest.mark.unit
    async def test_generate_chatgpt_no_api_key(self, ai_service):
        """Test ChatGPT generation without API key."""
        ai_service.openai_api_key = None

        request = GenerationRequest(
            prompt="a brave warrior",
            model="chatgpt",
            dimensions=DimensionsModel(width=64, height=64)
        )

        with pytest.raises(ValueError) as exc_info:
            await ai_service._generate_chatgpt(request)

        assert "OpenAI API key not configured" in str(exc_info.value)

    @pytest.mark.unit
    async def test_generate_ollama_disabled(self, ai_service):
        """Test Ollama generation when disabled."""
        ai_service.ollama_enabled = False

        request = GenerationRequest(
            prompt="a noble knight",
            model="ollama",
            dimensions=DimensionsModel(width=64, height=64),
            ollama_model="llama2:latest"
        )

        with pytest.raises(ValueError) as exc_info:
            await ai_service._generate_ollama(request)

        assert "Ollama is not enabled" in str(exc_info.value)

    @pytest.mark.unit
    async def test_generate_ollama_no_model_specified(self, ai_service):
        """Test Ollama generation without model specified."""
        ai_service.ollama_enabled = True

        request = GenerationRequest(
            prompt="a fire breathing dragon",
            model="ollama",
            dimensions=DimensionsModel(width=64, height=64),
            ollama_model=None
        )

        with pytest.raises(ValueError) as exc_info:
            await ai_service._generate_ollama(request)

        assert "Ollama model name is required" in str(exc_info.value)

    @pytest.mark.unit
    async def test_refine_image(self, ai_service, mock_image_data):
        """Test refining an image."""
        request = RefineRequest(
            asset_id="test-asset-123",
            instruction="make it bigger and more detailed",
            model="openrouter",
            ollama_model=None
        )

        # Mock the generate_image method
        with patch.object(ai_service, 'generate_image', new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = (b"refined_image_data", "image/png")

            result_bytes, mime_type = await ai_service.refine_image(mock_image_data, request)

            assert result_bytes == b"refined_image_data"
            assert mime_type == "image/png"
            mock_gen.assert_called_once()

            # Verify the call was made with correct parameters
            call_args = mock_gen.call_args[0][0]
            assert call_args.prompt == "make it bigger and more detailed"
            assert call_args.model == "openrouter"

    @pytest.mark.unit
    async def test_check_ollama_status_disabled(self, ai_service):
        """Test Ollama status check when disabled."""
        ai_service.ollama_enabled = False

        result = await ai_service.check_ollama_status()

        assert result["available"] is False
        assert "disabled" in result["error"].lower()
        assert result["models"] == []

    @pytest.mark.unit
    async def test_check_ollama_status_connection_error(self, ai_service):
        """Test Ollama status check with connection error."""
        ai_service.ollama_enabled = True

        # Create a mock client that raises ConnectError when get() is called
        mock_client_instance = AsyncMock()
        mock_client_instance.get = AsyncMock(side_effect=httpx.ConnectError("Connection failed"))

        with patch('app.services.ai_service.httpx.AsyncClient') as mock_client:
            # Make the context manager return our mock client instance
            mock_client.return_value.__aenter__.return_value = mock_client_instance

            result = await ai_service.check_ollama_status()

            assert result is not None, "Result should not be None"
            assert result["available"] is False
            assert "Cannot connect" in result["error"]

    @pytest.mark.unit
    async def test_check_ollama_status_success(self, ai_service):
        """Test successful Ollama status check."""
        ai_service.ollama_enabled = True

        mock_response_data = {
            "models": [
                {
                    "name": "llama2:latest",
                    "size": 3800000000,
                    "modified_at": "2024-01-01"
                },
                {
                    "name": "mistral:latest",
                    "size": 4100000000,
                    "modified_at": "2024-01-02"
                }
            ]
        }

        with patch('app.services.ai_service.httpx.AsyncClient') as mock_client:
            mock_context = MagicMock()
            mock_context.__aenter__ = AsyncMock()
            mock_context.__aexit__ = AsyncMock()
            mock_response = MagicMock()
            mock_response.raise_for_status = MagicMock()
            mock_response.json = MagicMock(return_value=mock_response_data)
            mock_get = AsyncMock(return_value=mock_response)
            mock_context.__aenter__.return_value.get = mock_get
            mock_client.return_value = mock_context

            result = await ai_service.check_ollama_status()

            assert result["available"] is True
            assert len(result["models"]) == 2
            assert result["models"][0]["name"] == "llama2:latest"

    @pytest.mark.unit
    def test_enhance_prompt_for_game_asset(self, ai_service):
        """Test prompt enhancement for game assets."""
        # Test without transparency mentioned
        prompt = "a red dragon"
        enhanced = ai_service._enhance_prompt_for_game_asset(prompt)
        assert "transparent background" in enhanced
        assert "game asset style" in enhanced

        # Test with transparency already mentioned
        prompt = "a blue wizard with transparent background"
        enhanced = ai_service._enhance_prompt_for_game_asset(prompt)
        assert "game asset style" in enhanced
        # Should not add transparent background again
        assert enhanced.count("transparent") == 1

    @pytest.mark.unit
    def test_get_dalle_size(self, ai_service):
        """Test DALL-E size calculation."""
        # Square dimensions
        assert ai_service._get_dalle_size(512, 512) == "1024x1024"
        assert ai_service._get_dalle_size(1024, 1024) == "1024x1024"

        # Landscape
        assert ai_service._get_dalle_size(1024, 512) == "1792x1024"
        assert ai_service._get_dalle_size(800, 600) == "1792x1024"

        # Portrait
        assert ai_service._get_dalle_size(512, 1024) == "1024x1792"
        assert ai_service._get_dalle_size(600, 800) == "1024x1792"

    @pytest.mark.unit
    def test_get_aspect_ratio(self, ai_service):
        """Test aspect ratio calculation."""
        # Square
        assert ai_service._get_aspect_ratio(64, 64) == "1:1"
        assert ai_service._get_aspect_ratio(512, 512) == "1:1"

        # 4:3 landscape
        assert ai_service._get_aspect_ratio(800, 600) == "4:3"
        assert ai_service._get_aspect_ratio(1024, 768) == "4:3"

        # 3:4 portrait
        assert ai_service._get_aspect_ratio(600, 800) == "3:4"
        assert ai_service._get_aspect_ratio(768, 1024) == "3:4"

        # 16:9 landscape
        assert ai_service._get_aspect_ratio(1920, 1080) == "16:9"
        assert ai_service._get_aspect_ratio(1280, 720) == "16:9"

        # 9:16 portrait
        assert ai_service._get_aspect_ratio(1080, 1920) == "9:16"
        assert ai_service._get_aspect_ratio(720, 1280) == "9:16"

        # Non-standard ratios - should map to closest
        assert ai_service._get_aspect_ratio(1000, 1000) == "1:1"
        assert ai_service._get_aspect_ratio(1000, 500) == "16:9"  # 2:1 -> 16:9
        assert ai_service._get_aspect_ratio(500, 1000) == "9:16"  # 1:2 -> 9:16

    @pytest.mark.unit
    def test_format_bytes(self, ai_service):
        """Test byte formatting."""
        assert ai_service._format_bytes(100) == "100.0 B"
        assert ai_service._format_bytes(1024) == "1.0 KB"
        assert ai_service._format_bytes(1024 * 1024) == "1.0 MB"
        assert ai_service._format_bytes(1024 * 1024 * 1024) == "1.0 GB"
        assert ai_service._format_bytes(3800000000) == "3.5 GB"

    @pytest.mark.unit
    async def test_generate_openrouter_success(self, ai_service):
        """Test successful OpenRouter generation."""
        ai_service.openrouter_api_key = "test-key"

        request = GenerationRequest(
            prompt="a fire breathing dragon",
            model="openrouter",
            dimensions=DimensionsModel(width=64, height=64)
        )

        # Create a simple test image
        from PIL import Image
        import io
        img = Image.new('RGBA', (64, 64), (255, 0, 0, 255))
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_b64 = base64.b64encode(img_bytes.getvalue()).decode()

        mock_response_data = {
            "choices": [{
                "message": {
                    "content": f"Here's your image: ![image](data:image/png;base64,{img_b64})"
                }
            }]
        }

        with patch('app.services.ai_service.httpx.AsyncClient') as mock_client:
            mock_context = MagicMock()
            mock_context.__aenter__ = AsyncMock()
            mock_context.__aexit__ = AsyncMock()
            mock_response = MagicMock()
            mock_response.raise_for_status = MagicMock()
            mock_response.json = MagicMock(return_value=mock_response_data)
            mock_post = AsyncMock(return_value=mock_response)
            mock_context.__aenter__.return_value.post = mock_post
            mock_client.return_value = mock_context

            result_bytes, mime_type = await ai_service._generate_openrouter(request)

            assert mime_type == "image/png"
            assert len(result_bytes) > 0

    @pytest.mark.unit
    async def test_generate_google_success(self, ai_service):
        """Test successful Google generation."""
        ai_service.google_api_key = "test-key"

        request = GenerationRequest(
            prompt="a powerful wizard",
            model="google",
            dimensions=DimensionsModel(width=64, height=64)
        )

        # Create test image
        from PIL import Image
        import io
        img = Image.new('RGBA', (64, 64), (0, 0, 255, 255))
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_b64 = base64.b64encode(img_bytes.getvalue()).decode()

        mock_response_data = {
            "predictions": [{
                "bytesBase64Encoded": img_b64
            }]
        }

        with patch('app.services.ai_service.httpx.AsyncClient') as mock_client:
            mock_context = MagicMock()
            mock_context.__aenter__ = AsyncMock()
            mock_context.__aexit__ = AsyncMock()
            mock_response = MagicMock()
            mock_response.raise_for_status = MagicMock()
            mock_response.json = MagicMock(return_value=mock_response_data)
            mock_post = AsyncMock(return_value=mock_response)
            mock_context.__aenter__.return_value.post = mock_post
            mock_client.return_value = mock_context

            result_bytes, mime_type = await ai_service._generate_google(request)

            assert mime_type == "image/png"
            assert len(result_bytes) > 0

    @pytest.mark.unit
    async def test_generate_chatgpt_success(self, ai_service):
        """Test successful ChatGPT generation."""
        ai_service.openai_api_key = "test-key"

        request = GenerationRequest(
            prompt="a brave warrior",
            model="chatgpt",
            dimensions=DimensionsModel(width=512, height=512)
        )

        # Create test image
        from PIL import Image
        import io
        img = Image.new('RGBA', (1024, 1024), (0, 255, 0, 255))
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_b64 = base64.b64encode(img_bytes.getvalue()).decode()

        mock_response_data = {
            "data": [{
                "b64_json": img_b64
            }]
        }

        with patch('app.services.ai_service.httpx.AsyncClient') as mock_client:
            mock_context = MagicMock()
            mock_context.__aenter__ = AsyncMock()
            mock_context.__aexit__ = AsyncMock()
            mock_response = MagicMock()
            mock_response.raise_for_status = MagicMock()
            mock_response.json = MagicMock(return_value=mock_response_data)
            mock_post = AsyncMock(return_value=mock_response)
            mock_context.__aenter__.return_value.post = mock_post
            mock_client.return_value = mock_context

            result_bytes, mime_type = await ai_service._generate_chatgpt(request)

            assert mime_type == "image/png"
            assert len(result_bytes) > 0

    @pytest.mark.unit
    async def test_generate_ollama_success(self, ai_service):
        """Test successful Ollama generation."""
        ai_service.ollama_enabled = True

        request = GenerationRequest(
            prompt="a noble knight",
            model="ollama",
            dimensions=DimensionsModel(width=64, height=64),
            ollama_model="llama2:latest"
        )

        mock_response_data = {
            "response": "Generated description"
        }

        with patch('app.services.ai_service.httpx.AsyncClient') as mock_client:
            mock_context = MagicMock()
            mock_context.__aenter__ = AsyncMock()
            mock_context.__aexit__ = AsyncMock()
            mock_response = MagicMock()
            mock_response.raise_for_status = MagicMock()
            mock_response.json = MagicMock(return_value=mock_response_data)
            mock_post = AsyncMock(return_value=mock_response)
            mock_context.__aenter__.return_value.post = mock_post
            mock_client.return_value = mock_context

            result_bytes, mime_type = await ai_service._generate_ollama(request)

            assert mime_type == "image/png"
            assert len(result_bytes) > 0  # Should return placeholder image
