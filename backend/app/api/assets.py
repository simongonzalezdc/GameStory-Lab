"""Asset management API endpoints."""
import logging
import shutil
from pathlib import Path
from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional, List

from app.models.asset import AssetsListResponse, AssetDeleteResponse, Asset, AssetCreate, AssetUpdate
from app.services.local_storage_service import storage_service
from app.services.database_service import db_service

router = APIRouter(prefix="/api/assets", tags=["assets"])
logger = logging.getLogger(__name__)


@router.get("/", response_model=AssetsListResponse)
async def list_assets(
    project_name: Optional[str] = Query(None),
    style_tags: Optional[str] = Query(None),
    search_query: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0)
):
    """
    List user's assets with filtering and pagination.

    Args:
        project_name: Filter by project name
        style_tags: Comma-separated style tags to filter
        search_query: Search in generation prompts
        limit: Maximum results per page (max 100)
        offset: Pagination offset

    Returns:
        List of assets with pagination info

    Raises:
        500: Database error
    """
    user_id = "local-user"

    try:
        # Parse style tags
        style_tags_list = None
        if style_tags:
            style_tags_list = [tag.strip() for tag in style_tags.split(",")]

        assets, total = await storage_service.get_user_assets(
            user_id=user_id,
            project_name=project_name,
            style_tags=style_tags_list,
            search_query=search_query,
            limit=limit,
            offset=offset
        )

        return AssetsListResponse(
            assets=assets,
            total=total,
            limit=limit,
            offset=offset
        )

    except Exception as e:
        logger.error(f"Failed to list assets: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch assets: {str(e)}"
        )


@router.delete("/{asset_id}", response_model=AssetDeleteResponse)
async def delete_asset(asset_id: str):
    """
    Delete asset and remove from storage.

    Args:
        asset_id: ID of asset to delete

    Returns:
        Success confirmation

    Raises:
        404: Asset not found
        500: Deletion failed
    """
    user_id = "local-user"

    try:

        success = await storage_service.delete_asset(user_id, asset_id)

        if success:
            return AssetDeleteResponse(
                success=True,
                message="Asset deleted successfully"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete asset: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete asset: {str(e)}"
        )


@router.patch("/{asset_id}", response_model=Asset)
async def update_asset(asset_id: str, update_data: AssetUpdate):
    """
    Update asset metadata (tags, project, favorite status).

    Args:
        asset_id: ID of asset to update
        update_data: Fields to update

    Returns:
        Updated asset

    Raises:
        404: Asset not found
        500: Update failed
    """
    user_id = "local-user"

    try:
        # Convert Pydantic model to dict, excluding None values
        update_dict = update_data.model_dump(exclude_none=True)

        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields provided for update"
            )

        updated_asset = await db_service.update_asset(user_id, asset_id, update_dict)

        if not updated_asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found"
            )

        return Asset(**updated_asset)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update asset: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update asset: {str(e)}"
        )


@router.get("/{asset_id}/versions", response_model=List[Asset])
async def get_asset_versions(asset_id: str):
    """
    Get version history for an asset.

    Returns all versions of an asset, including the original and all refinements.
    Versions are returned in chronological order (oldest to newest).

    Args:
        asset_id: ID of any version in the asset chain

    Returns:
        List of asset versions in chronological order

    Raises:
        404: Asset not found
        500: Database error
    """
    user_id = "local-user"

    try:
        versions = await db_service.get_asset_versions(asset_id, user_id)

        if not versions:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found"
            )

        # Convert to Asset model instances
        asset_models = [Asset(**version) for version in versions]
        return asset_models

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get asset versions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch asset versions: {str(e)}"
        )



@router.post("/{asset_id}/duplicate", response_model=Asset)
async def duplicate_asset(asset_id: str):
    """
    Duplicate an existing asset.

    Creates a copy of the asset file and metadata. The duplicated asset
    will have a new ID and timestamp but keep the same properties.

    Args:
        asset_id: ID of asset to duplicate

    Returns:
        The newly created asset duplicate

    Raises:
        404: Asset not found
        500: Duplication failed
    """
    user_id = "local-user"

    try:
        # Get original asset
        original_asset_dict = await db_service.get_asset(asset_id, user_id)
        if not original_asset_dict:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found"
            )

        original_asset = Asset(**original_asset_dict)

        # Get original file path
        original_file_path = storage_service.get_file_path(original_asset.file_url)
        if not Path(original_file_path).exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset file not found"
            )

        # Create new filename
        import time
        new_file_name = f"duplicate_{int(time.time())}_{original_asset.file_name}"

        # Copy file
        new_file_url = await storage_service.upload_asset(
            user_id=user_id,
            file_name=new_file_name,
            file_bytes=Path(original_file_path).read_bytes(),
            mime_type="image/png"
        )

        # Create asset metadata (copying from original)
        asset_data = AssetCreate(
            file_name=new_file_name,
            file_size=original_asset.file_size,
            width=original_asset.width,
            height=original_asset.height,
            generation_prompt=original_asset.generation_prompt,
            generation_model=original_asset.generation_model,
            style_tags=original_asset.style_tags,
            project_name=original_asset.project_name,
            parent_asset_id=None,  # Duplicate is not a version
            version_number=1,  # Start fresh version chain
            refinement_instruction=None
        )

        # Save duplicate
        duplicate = await storage_service.save_asset_metadata(
            user_id=user_id,
            asset_data=asset_data,
            file_url=new_file_url
        )

        logger.info(f"Asset {asset_id} duplicated as {duplicate.id}")
        return duplicate

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to duplicate asset: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to duplicate asset: {str(e)}"
        )
