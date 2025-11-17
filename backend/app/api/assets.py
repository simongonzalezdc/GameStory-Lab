"""Asset management API endpoints."""
import logging
from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional

from app.models.asset import AssetsListResponse, AssetDeleteResponse
from app.services.local_storage_service import storage_service

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
