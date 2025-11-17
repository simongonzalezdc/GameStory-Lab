"""Supabase storage service for asset management."""
import logging
import uuid
from datetime import datetime
from typing import Optional, List
from supabase import Client, create_client

from app.core.config import settings
from app.models.asset import AssetCreate, AssetResponse

logger = logging.getLogger(__name__)


class StorageService:
    """Service for managing asset storage with Supabase."""

    def __init__(self):
        """Initialize Supabase client."""
        try:
            self.client: Client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_ROLE_KEY
            )
            self.bucket_name = "game-assets"
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            self.client = None

    async def upload_asset(
        self,
        user_id: str,
        file_name: str,
        file_bytes: bytes,
        mime_type: str = "image/png"
    ) -> str:
        """
        Upload asset to Supabase Storage.

        Args:
            user_id: User ID who owns the asset
            file_name: Name of the file
            file_bytes: File binary data
            mime_type: MIME type of the file

        Returns:
            Public URL of uploaded file

        Raises:
            Exception: If upload fails
        """
        if not self.client:
            raise Exception("Supabase client not initialized")

        try:
            # Generate unique file path
            file_id = str(uuid.uuid4())
            file_extension = file_name.split(".")[-1] if "." in file_name else "png"
            storage_path = f"{user_id}/{file_id}.{file_extension}"

            # Upload to Supabase Storage
            response = self.client.storage.from_(self.bucket_name).upload(
                path=storage_path,
                file=file_bytes,
                file_options={"content-type": mime_type}
            )

            # Get public URL
            url_response = self.client.storage.from_(self.bucket_name).get_public_url(storage_path)

            logger.info(f"Asset uploaded successfully: {storage_path}")
            return url_response

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
        if not self.client:
            raise Exception("Supabase client not initialized")

        try:
            asset_id = str(uuid.uuid4())
            now = datetime.utcnow().isoformat()

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
                "created_at": now,
                "updated_at": now
            }

            response = self.client.table("assets").insert(asset_record).execute()

            if response.data and len(response.data) > 0:
                return AssetResponse(**response.data[0])
            else:
                raise Exception("No data returned from insert")

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
            style_tags: Filter by style tags
            search_query: Search in prompts
            limit: Max results
            offset: Pagination offset

        Returns:
            Tuple of (assets list, total count)
        """
        if not self.client:
            raise Exception("Supabase client not initialized")

        try:
            query = self.client.table("assets").select("*", count="exact")
            query = query.eq("user_id", user_id)

            if project_name:
                query = query.eq("project_name", project_name)

            if style_tags:
                query = query.contains("style_tags", style_tags)

            if search_query:
                query = query.ilike("generation_prompt", f"%{search_query}%")

            query = query.order("created_at", desc=True)
            query = query.range(offset, offset + limit - 1)

            response = query.execute()

            assets = [AssetResponse(**asset) for asset in response.data]
            total = response.count or 0

            return assets, total

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
        if not self.client:
            raise Exception("Supabase client not initialized")

        try:
            # Get asset to find file URL
            response = self.client.table("assets").select("*").eq("id", asset_id).eq("user_id", user_id).execute()

            if not response.data or len(response.data) == 0:
                raise Exception("Asset not found or access denied")

            asset = response.data[0]

            # Extract storage path from URL
            file_url = asset["file_url"]
            # Parse path from URL (format: https://.../storage/v1/object/public/game-assets/path)
            if "/game-assets/" in file_url:
                storage_path = file_url.split("/game-assets/")[1]

                # Delete from storage
                try:
                    self.client.storage.from_(self.bucket_name).remove([storage_path])
                except Exception as e:
                    logger.warning(f"Failed to delete file from storage: {e}")

            # Delete from database
            self.client.table("assets").delete().eq("id", asset_id).eq("user_id", user_id).execute()

            logger.info(f"Asset deleted: {asset_id}")
            return True

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
        if not self.client:
            raise Exception("Supabase client not initialized")

        try:
            response = self.client.table("assets").select("*").eq("id", asset_id).eq("user_id", user_id).execute()

            if response.data and len(response.data) > 0:
                return AssetResponse(**response.data[0])
            return None

        except Exception as e:
            logger.error(f"Failed to get asset: {e}")
            raise Exception(f"Database query failed: {str(e)}")
