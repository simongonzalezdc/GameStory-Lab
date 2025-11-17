"""Image processing service for asset manipulation."""
import io
import logging
from typing import Tuple
from PIL import Image, ImageOps
import base64

logger = logging.getLogger(__name__)


class ImageService:
    """Service for image processing operations."""

    @staticmethod
    def ensure_transparent_background(image_bytes: bytes) -> bytes:
        """
        Ensure image has transparent background.

        Args:
            image_bytes: Input image data

        Returns:
            Image bytes with transparent background
        """
        try:
            img = Image.open(io.BytesIO(image_bytes))

            # Convert to RGBA if not already
            if img.mode != 'RGBA':
                img = img.convert('RGBA')

            # Get image data
            data = img.getdata()

            # Replace white/near-white pixels with transparent
            new_data = []
            for item in data:
                # If pixel is white or near-white, make it transparent
                if item[0] > 240 and item[1] > 240 and item[2] > 240:
                    new_data.append((255, 255, 255, 0))  # Transparent
                else:
                    new_data.append(item)

            img.putdata(new_data)

            output = io.BytesIO()
            img.save(output, format="PNG")
            return output.getvalue()

        except Exception as e:
            logger.error(f"Failed to process transparency: {e}")
            return image_bytes

    @staticmethod
    def resize_image(
        image_bytes: bytes, width: int, height: int, maintain_aspect: bool = False
    ) -> bytes:
        """
        Resize image to specified dimensions.

        Args:
            image_bytes: Input image data
            width: Target width
            height: Target height
            maintain_aspect: Whether to maintain aspect ratio

        Returns:
            Resized image bytes
        """
        try:
            img = Image.open(io.BytesIO(image_bytes))

            if maintain_aspect:
                img.thumbnail((width, height), Image.Resampling.LANCZOS)
            else:
                img = img.resize((width, height), Image.Resampling.LANCZOS)

            output = io.BytesIO()
            img.save(output, format="PNG")
            return output.getvalue()

        except Exception as e:
            logger.error(f"Failed to resize image: {e}")
            raise Exception(f"Image resize failed: {str(e)}")

    @staticmethod
    def trim_transparency(image_bytes: bytes, padding: int = 0) -> bytes:
        """
        Trim transparent pixels from edges.

        Args:
            image_bytes: Input image data
            padding: Padding to add after trimming

        Returns:
            Trimmed image bytes
        """
        try:
            img = Image.open(io.BytesIO(image_bytes))

            if img.mode != 'RGBA':
                img = img.convert('RGBA')

            # Get bounding box of non-transparent pixels
            bbox = img.getbbox()

            if bbox:
                img = img.crop(bbox)

                # Add padding if specified
                if padding > 0:
                    img = ImageOps.expand(img, border=padding, fill=(0, 0, 0, 0))

            output = io.BytesIO()
            img.save(output, format="PNG")
            return output.getvalue()

        except Exception as e:
            logger.error(f"Failed to trim transparency: {e}")
            return image_bytes

    @staticmethod
    def get_image_info(image_bytes: bytes) -> dict:
        """
        Get information about image.

        Args:
            image_bytes: Input image data

        Returns:
            Dict with image information
        """
        try:
            img = Image.open(io.BytesIO(image_bytes))

            return {
                "width": img.width,
                "height": img.height,
                "mode": img.mode,
                "format": img.format or "PNG",
                "size_bytes": len(image_bytes)
            }

        except Exception as e:
            logger.error(f"Failed to get image info: {e}")
            raise Exception(f"Invalid image data: {str(e)}")

    @staticmethod
    def decode_base64_image(base64_string: str) -> bytes:
        """
        Decode base64 image string to bytes.

        Args:
            base64_string: Base64 encoded image (with or without data URI prefix)

        Returns:
            Image bytes

        Raises:
            ValueError: If base64 string is invalid
        """
        try:
            # Remove data URI prefix if present
            if "," in base64_string:
                base64_string = base64_string.split(",")[1]

            return base64.b64decode(base64_string)

        except Exception as e:
            logger.error(f"Failed to decode base64 image: {e}")
            raise ValueError(f"Invalid base64 image data: {str(e)}")

    @staticmethod
    def validate_image(image_bytes: bytes, max_size_mb: int = 10) -> bool:
        """
        Validate image data.

        Args:
            image_bytes: Image data to validate
            max_size_mb: Maximum allowed size in MB

        Returns:
            True if valid, raises Exception otherwise

        Raises:
            ValueError: If image is invalid or too large
        """
        # Check size
        size_mb = len(image_bytes) / (1024 * 1024)
        if size_mb > max_size_mb:
            raise ValueError(f"Image too large: {size_mb:.1f}MB (max {max_size_mb}MB)")

        # Check if valid image
        try:
            img = Image.open(io.BytesIO(image_bytes))
            img.verify()
            return True
        except Exception as e:
            raise ValueError(f"Invalid image data: {str(e)}")

    @staticmethod
    def apply_style_adjustments(
        image_bytes: bytes, brightness: float = 1.0, contrast: float = 1.0
    ) -> bytes:
        """
        Apply brightness and contrast adjustments.

        Args:
            image_bytes: Input image data
            brightness: Brightness multiplier (1.0 = no change)
            contrast: Contrast multiplier (1.0 = no change)

        Returns:
            Adjusted image bytes
        """
        try:
            from PIL import ImageEnhance

            img = Image.open(io.BytesIO(image_bytes))

            if brightness != 1.0:
                enhancer = ImageEnhance.Brightness(img)
                img = enhancer.enhance(brightness)

            if contrast != 1.0:
                enhancer = ImageEnhance.Contrast(img)
                img = enhancer.enhance(contrast)

            output = io.BytesIO()
            img.save(output, format="PNG")
            return output.getvalue()

        except Exception as e:
            logger.error(f"Failed to apply style adjustments: {e}")
            return image_bytes
