"""Tests for image service."""
import pytest
import io
import base64
from PIL import Image

from app.services.image_service import ImageService


class TestImageService:
    """Test cases for ImageService."""

    @pytest.fixture
    def sample_image_bytes(self):
        """Create sample image bytes (RGB white)."""
        img = Image.new('RGB', (100, 100), (255, 255, 255))
        output = io.BytesIO()
        img.save(output, format='PNG')
        return output.getvalue()

    @pytest.fixture
    def rgba_image_bytes(self):
        """Create sample RGBA image bytes (red)."""
        img = Image.new('RGBA', (100, 100), (255, 0, 0, 255))
        output = io.BytesIO()
        img.save(output, format='PNG')
        return output.getvalue()

    @pytest.fixture
    def large_image_bytes(self):
        """Create large image bytes (for resize testing)."""
        img = Image.new('RGBA', (3000, 2000), (0, 255, 0, 255))
        output = io.BytesIO()
        img.save(output, format='PNG')
        return output.getvalue()

    @pytest.mark.unit
    def test_ensure_transparent_background_rgb(self, sample_image_bytes):
        """Test ensuring transparent background on RGB image."""
        result = ImageService.ensure_transparent_background(sample_image_bytes)

        img = Image.open(io.BytesIO(result))
        assert img.mode == 'RGBA'
        assert img.size == (100, 100)
        # White pixels should be made transparent
        data = list(img.getdata())
        assert data[0][3] == 0  # Alpha channel should be 0 for white pixels

    @pytest.mark.unit
    def test_ensure_transparent_background_rgba(self, rgba_image_bytes):
        """Test ensuring transparent background on RGBA image."""
        result = ImageService.ensure_transparent_background(rgba_image_bytes)

        img = Image.open(io.BytesIO(result))
        assert img.mode == 'RGBA'
        # Red pixels should remain opaque
        data = list(img.getdata())
        assert data[0][3] == 255  # Alpha channel should remain 255

    @pytest.mark.unit
    def test_ensure_transparent_background_error_handling(self):
        """Test error handling with invalid data."""
        # Should return original data on error
        invalid_data = b"invalid image data"
        result = ImageService.ensure_transparent_background(invalid_data)
        assert result == invalid_data

    @pytest.mark.unit
    def test_resize_image_no_aspect(self, sample_image_bytes):
        """Test resizing image without maintaining aspect ratio."""
        result = ImageService.resize_image(sample_image_bytes, 50, 50, maintain_aspect=False)

        img = Image.open(io.BytesIO(result))
        assert img.size == (50, 50)

    @pytest.mark.unit
    def test_resize_image_with_aspect(self, sample_image_bytes):
        """Test resizing image while maintaining aspect ratio."""
        result = ImageService.resize_image(sample_image_bytes, 50, 50, maintain_aspect=True)

        img = Image.open(io.BytesIO(result))
        assert img.width <= 50
        assert img.height <= 50

    @pytest.mark.unit
    def test_resize_image_invalid_data(self):
        """Test resizing with invalid image data."""
        with pytest.raises(Exception) as exc_info:
            ImageService.resize_image(b"invalid data", 50, 50)

        assert "Image resize failed" in str(exc_info.value)

    @pytest.mark.unit
    def test_trim_transparency(self, rgba_image_bytes):
        """Test trimming transparency from image."""
        result = ImageService.trim_transparency(rgba_image_bytes, padding=5)

        img = Image.open(io.BytesIO(result))
        assert img.mode == 'RGBA'

    @pytest.mark.unit
    def test_trim_transparency_no_padding(self, rgba_image_bytes):
        """Test trimming transparency without padding."""
        result = ImageService.trim_transparency(rgba_image_bytes, padding=0)

        img = Image.open(io.BytesIO(result))
        assert img.mode == 'RGBA'

    @pytest.mark.unit
    def test_trim_transparency_error_handling(self):
        """Test trim transparency error handling."""
        invalid_data = b"invalid data"
        result = ImageService.trim_transparency(invalid_data)
        assert result == invalid_data

    @pytest.mark.unit
    def test_get_image_info(self, rgba_image_bytes):
        """Test getting image information."""
        info = ImageService.get_image_info(rgba_image_bytes)

        assert info['width'] == 100
        assert info['height'] == 100
        assert info['mode'] == 'RGBA'
        assert 'size_bytes' in info
        assert info['size_bytes'] > 0

    @pytest.mark.unit
    def test_get_image_info_invalid_data(self):
        """Test getting image info with invalid data."""
        with pytest.raises(Exception) as exc_info:
            ImageService.get_image_info(b"invalid data")

        assert "Invalid image data" in str(exc_info.value)

    @pytest.mark.unit
    def test_decode_base64_image(self, rgba_image_bytes):
        """Test decoding base64 image."""
        b64_string = base64.b64encode(rgba_image_bytes).decode()
        result = ImageService.decode_base64_image(b64_string)

        assert result == rgba_image_bytes

    @pytest.mark.unit
    def test_decode_base64_image_with_data_uri(self, rgba_image_bytes):
        """Test decoding base64 image with data URI prefix."""
        b64_string = base64.b64encode(rgba_image_bytes).decode()
        data_uri = f"data:image/png;base64,{b64_string}"

        result = ImageService.decode_base64_image(data_uri)
        assert result == rgba_image_bytes

    @pytest.mark.unit
    def test_decode_base64_image_invalid(self):
        """Test decoding invalid base64 image."""
        with pytest.raises(ValueError) as exc_info:
            ImageService.decode_base64_image("invalid base64!!!")

        assert "Invalid base64 image data" in str(exc_info.value)

    @pytest.mark.unit
    def test_validate_image_success(self, rgba_image_bytes):
        """Test validating valid image."""
        result = ImageService.validate_image(rgba_image_bytes, max_size_mb=10)
        assert result is True

    @pytest.mark.unit
    def test_validate_image_too_large(self, rgba_image_bytes):
        """Test validating image that's too large."""
        with pytest.raises(ValueError) as exc_info:
            # Set very small max size (0.0001 MB = ~100 bytes)
            ImageService.validate_image(rgba_image_bytes, max_size_mb=0.0001)

        assert "Image too large" in str(exc_info.value)

    @pytest.mark.unit
    def test_validate_image_invalid_data(self):
        """Test validating invalid image data."""
        with pytest.raises(ValueError) as exc_info:
            ImageService.validate_image(b"invalid data", max_size_mb=10)

        assert "Invalid image data" in str(exc_info.value)

    @pytest.mark.unit
    def test_apply_style_adjustments_brightness(self, rgba_image_bytes):
        """Test applying brightness adjustment."""
        result = ImageService.apply_style_adjustments(
            rgba_image_bytes,
            brightness=1.5,
            contrast=1.0
        )

        img = Image.open(io.BytesIO(result))
        assert img.mode == 'RGBA'

    @pytest.mark.unit
    def test_apply_style_adjustments_contrast(self, rgba_image_bytes):
        """Test applying contrast adjustment."""
        result = ImageService.apply_style_adjustments(
            rgba_image_bytes,
            brightness=1.0,
            contrast=1.5
        )

        img = Image.open(io.BytesIO(result))
        assert img.mode == 'RGBA'

    @pytest.mark.unit
    def test_apply_style_adjustments_both(self, rgba_image_bytes):
        """Test applying both brightness and contrast."""
        result = ImageService.apply_style_adjustments(
            rgba_image_bytes,
            brightness=0.8,
            contrast=1.2
        )

        img = Image.open(io.BytesIO(result))
        assert img.mode == 'RGBA'

    @pytest.mark.unit
    def test_apply_style_adjustments_no_change(self, rgba_image_bytes):
        """Test applying style adjustments with no change."""
        result = ImageService.apply_style_adjustments(
            rgba_image_bytes,
            brightness=1.0,
            contrast=1.0
        )

        img = Image.open(io.BytesIO(result))
        assert img.mode == 'RGBA'

    @pytest.mark.unit
    def test_apply_style_adjustments_error_handling(self):
        """Test style adjustments error handling."""
        invalid_data = b"invalid data"
        result = ImageService.apply_style_adjustments(invalid_data)
        assert result == invalid_data

    @pytest.mark.unit
    def test_optimize_for_game_small_image(self, rgba_image_bytes):
        """Test optimizing small image for game."""
        result = ImageService.optimize_for_game(rgba_image_bytes, max_dimension=2048)

        img = Image.open(io.BytesIO(result))
        assert img.mode == 'RGBA'
        assert img.width == 100
        assert img.height == 100

    @pytest.mark.unit
    def test_optimize_for_game_large_image(self, large_image_bytes):
        """Test optimizing large image for game."""
        result = ImageService.optimize_for_game(large_image_bytes, max_dimension=1024)

        img = Image.open(io.BytesIO(result))
        assert img.mode == 'RGBA'
        # Should be resized to fit within max_dimension
        assert img.width <= 1024
        assert img.height <= 1024

    @pytest.mark.unit
    def test_optimize_for_game_rgb_to_rgba(self, sample_image_bytes):
        """Test optimizing RGB image converts to RGBA."""
        result = ImageService.optimize_for_game(sample_image_bytes)

        img = Image.open(io.BytesIO(result))
        assert img.mode == 'RGBA'

    @pytest.mark.unit
    def test_optimize_for_game_error_handling(self):
        """Test optimize for game error handling."""
        invalid_data = b"invalid data"
        result = ImageService.optimize_for_game(invalid_data)
        assert result == invalid_data
