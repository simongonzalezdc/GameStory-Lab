"""Asset pack management API endpoints."""
import logging
from fastapi import APIRouter, HTTPException, status
from typing import List

from app.models.asset_pack import (
    AssetPackCreate,
    AssetPackUpdate,
    AssetPack,
    AssetPackListResponse,
    AssetPackDeleteResponse
)
from app.services.database_service import db_service

router = APIRouter(prefix="/api/packs", tags=["asset-packs"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=AssetPack, status_code=status.HTTP_201_CREATED)
async def create_asset_pack(pack_data: AssetPackCreate):
    """
    Create a new asset pack.

    Args:
        pack_data: Pack creation data

    Returns:
        Created asset pack

    Raises:
        400: Invalid data
        500: Creation failed
    """
    user_id = "local-user"

    try:
        pack_dict = pack_data.model_dump()
        pack_dict['user_id'] = user_id

        created_pack = await db_service.create_asset_pack(pack_dict)
        return AssetPack(**created_pack)

    except Exception as e:
        logger.error(f"Failed to create asset pack: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create asset pack: {str(e)}"
        )


@router.get("/", response_model=AssetPackListResponse)
async def list_asset_packs():
    """
    List all asset packs for the user.

    Returns:
        List of asset packs

    Raises:
        500: Database error
    """
    user_id = "local-user"

    try:
        packs = await db_service.get_asset_packs(user_id)
        return AssetPackListResponse(
            packs=[AssetPack(**pack) for pack in packs],
            total=len(packs)
        )

    except Exception as e:
        logger.error(f"Failed to list asset packs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list asset packs: {str(e)}"
        )


@router.get("/{pack_id}", response_model=AssetPack)
async def get_asset_pack(pack_id: str):
    """
    Get a single asset pack by ID.

    Args:
        pack_id: ID of the pack

    Returns:
        Asset pack

    Raises:
        404: Pack not found
        500: Database error
    """
    user_id = "local-user"

    try:
        pack = await db_service.get_asset_pack_by_id(pack_id, user_id)

        if not pack:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset pack not found"
            )

        return AssetPack(**pack)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get asset pack: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get asset pack: {str(e)}"
        )


@router.patch("/{pack_id}", response_model=AssetPack)
async def update_asset_pack(pack_id: str, update_data: AssetPackUpdate):
    """
    Update asset pack metadata.

    Args:
        pack_id: ID of the pack
        update_data: Fields to update

    Returns:
        Updated asset pack

    Raises:
        404: Pack not found
        400: No fields to update
        500: Update failed
    """
    user_id = "local-user"

    try:
        update_dict = update_data.model_dump(exclude_none=True)

        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields provided for update"
            )

        updated_pack = await db_service.update_asset_pack(pack_id, user_id, update_dict)

        if not updated_pack:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset pack not found"
            )

        return AssetPack(**updated_pack)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update asset pack: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update asset pack: {str(e)}"
        )


@router.delete("/{pack_id}", response_model=AssetPackDeleteResponse)
async def delete_asset_pack(pack_id: str):
    """
    Delete an asset pack.

    Args:
        pack_id: ID of the pack

    Returns:
        Success confirmation

    Raises:
        404: Pack not found
        500: Deletion failed
    """
    user_id = "local-user"

    try:
        success = await db_service.delete_asset_pack(pack_id, user_id)

        if success:
            return AssetPackDeleteResponse(
                success=True,
                message="Asset pack deleted successfully"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset pack not found"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete asset pack: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete asset pack: {str(e)}"
        )
