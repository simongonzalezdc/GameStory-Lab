"""Local file storage service."""
import os
import uuid
import logging
import aiofiles
from pathlib import Path
from typing import Optional, List

from app.core.config import settings
from app.models.asset import AssetCreate, AssetResponse
from app.services.database_service import db_service

logger = logging.getLogger(__name__)


class LocalStorageService:
    """Service for managing local file storage."""

    def __init__(self):
        """Initialize local storage service."""
        self.storage_path = settings.STORAGE_PATH
        self._ensure_storage_directory()

    def _ensure_storage_directory(self):
        """Ensure storage directory exists."""
        Path(self.storage_path).mkdir(parents=True, exist_ok=True)
        logger.info(f"Storage directory ensured at {self.storage_path}")

    def _validate_path(self, file_url: str) -> Path:
        """
        Validate and sanitize file path to prevent directory traversal.

        Args:
            file_url: File URL like /assets/user-id/filename.png

        Returns:
            Validated absolute Path object

        Raises:
            ValueError: If path is invalid or outside storage directory
        """
        if not file_url.startswith("/assets/"):
            raise ValueError("Invalid file URL - must start with /assets/")

        # Remove /assets/ prefix
        relative_path = file_url[len("/assets/"):]

        # Build full path
        storage_base = Path(self.storage_path).resolve()
        full_path = (storage_base / relative_path).resolve()

        # Ensure path is within storage directory (prevent directory traversal)
        if not str(full_path).startswith(str(storage_base)):
            raise ValueError("Path traversal detected - access denied")

        return full_path

    async def upload_asset(
        self,
        user_id: str,
        file_name: str,
        file_bytes: bytes,
        mime_type: str = "image/png"
    ) -> str:
        """
        Save asset to local storage.

        Args:
            user_id: User ID who owns the asset
            file_name: Name of the file
            file_bytes: File binary data
            mime_type: MIME type of the file

        Returns:
            File path (relative URL)

        Raises:
            Exception: If upload fails
        """
        try:
            # Generate unique filename
            file_id = str(uuid.uuid4())
            file_extension = file_name.split(".")[-1] if "." in file_name else "png"
            filename = f"{file_id}.{file_extension}"

            # Create user directory
            user_dir = os.path.join(self.storage_path, user_id)
            Path(user_dir).mkdir(parents=True, exist_ok=True)

            # Save file asynchronously
            file_path = os.path.join(user_dir, filename)
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(file_bytes)

            # Return relative URL (for serving via static files)
            relative_url = f"/assets/{user_id}/{filename}"
            logger.info(f"Asset uploaded successfully: {relative_url}")
            return relative_url

        except Exception as e:
            logger.error(f"Failed to upload asset: {e}")
            raise Exception(f"Storage upload failed: {str(e)}")

    async def save_asset_metadata(
        self,
        user_id: str,
        asset_data: AssetCreate,
        file_url: str
    ) -> AssetResponse:
        """
        Save asset metadata to database.

        Args:
            user_id: User ID
            asset_data: Asset creation data
            file_url: URL of uploaded file

        Returns:
            Created asset response

        Raises:
            Exception: If database insert fails
        """
        try:
            asset_id = str(uuid.uuid4())

            asset_record = {
                "id": asset_id,
                "user_id": user_id,
                "file_url": file_url,
                "file_name": asset_data.file_name,
                "file_size": asset_data.file_size,
                "mime_type": "image/png",
                "width": asset_data.width,
                "height": asset_data.height,
                "generation_prompt": asset_data.generation_prompt,
                "generation_model": asset_data.generation_model,
                "style_tags": asset_data.style_tags,
                "project_name": asset_data.project_name,
                "is_favorite": False,
                "metadata": {},
                # Phase 2: Versioning fields
                "parent_asset_id": asset_data.parent_asset_id,
                "version_number": asset_data.version_number,
                "refinement_instruction": asset_data.refinement_instruction
            }

            asset_dict = await db_service.insert_asset(asset_record)
            return AssetResponse(**asset_dict)

        except Exception as e:
            logger.error(f"Failed to save asset metadata: {e}")
            raise Exception(f"Database insert failed: {str(e)}")

    async def get_user_assets(
        self,
        user_id: str,
        project_name: Optional[str] = None,
        style_tags: Optional[List[str]] = None,
        search_query: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> tuple[List[AssetResponse], int]:
        """
        Get user's assets with filtering.

        Args:
            user_id: User ID
            project_name: Filter by project
            style_tags: Filter by style tags (not implemented yet)
            search_query: Search in prompts
            limit: Max results
            offset: Pagination offset

        Returns:
            Tuple of (assets list, total count)
        """
        try:
            assets, total = await db_service.get_assets(
                user_id=user_id,
                project_name=project_name,
                search_query=search_query,
                limit=limit,
                offset=offset
            )

            asset_responses = [AssetResponse(**asset) for asset in assets]
            return asset_responses, total

        except Exception as e:
            logger.error(f"Failed to get user assets: {e}")
            raise Exception(f"Database query failed: {str(e)}")

    async def delete_asset(self, user_id: str, asset_id: str) -> bool:
        """
        Delete asset and its file.

        Args:
            user_id: User ID
            asset_id: Asset ID to delete

        Returns:
            True if deleted successfully

        Raises:
            Exception: If deletion fails
        """
        try:
            # Get asset to find file path
            asset = await db_service.get_asset_by_id(asset_id, user_id)
            if not asset:
                raise Exception("Asset not found or access denied")

            # Delete file from storage with path validation
            file_url = asset["file_url"]
            if file_url.startswith("/assets/"):
                try:
                    file_path = self._validate_path(file_url)
                    if file_path.exists():
                        file_path.unlink()
                        logger.info(f"Deleted file: {file_path}")
                except ValueError as e:
                    logger.error(f"Path validation failed: {e}")
                    raise Exception(f"Invalid file path: {str(e)}")

            # Delete from database
            success = await db_service.delete_asset(asset_id, user_id)

            logger.info(f"Asset deleted: {asset_id}")
            return success

        except Exception as e:
            logger.error(f"Failed to delete asset: {e}")
            raise Exception(f"Asset deletion failed: {str(e)}")

    async def get_asset_by_id(self, user_id: str, asset_id: str) -> Optional[AssetResponse]:
        """
        Get specific asset by ID.

        Args:
            user_id: User ID
            asset_id: Asset ID

        Returns:
            Asset response or None if not found
        """
        try:
            asset = await db_service.get_asset_by_id(asset_id, user_id)
            if asset:
                return AssetResponse(**asset)
            return None

        except Exception as e:
            logger.error(f"Failed to get asset: {e}")
            raise Exception(f"Database query failed: {str(e)}")

    def get_file_path(self, file_url: str) -> str:
        """
        Convert file URL to absolute file path with validation.

        Args:
            file_url: File URL like /assets/user-id/filename.png

        Returns:
            Absolute file path

        Raises:
            ValueError: If path is invalid or outside storage directory
        """
        if file_url.startswith("/assets/"):
            validated_path = self._validate_path(file_url)
            return str(validated_path)
        raise ValueError("Invalid file URL")


# Global storage service instance
storage_service = LocalStorageService()
