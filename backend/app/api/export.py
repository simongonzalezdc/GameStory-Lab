"""Asset export API endpoints."""
import logging
import io
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.responses import StreamingResponse
import httpx

from app.models.export import ExportRequest, ExportResponse
from app.services.storage_service import StorageService
from app.services.export_service import ExportService

router = APIRouter(prefix="/api/export", tags=["export"])
security = HTTPBearer(auto_error=False)
logger = logging.getLogger(__name__)


@router.post("/")
async def export_assets(
    request: ExportRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Export assets in various formats.

    Supports:
    - Single PNG files (ZIP)
    - Sprite sheets with JSON metadata
    - Texture atlases with XML metadata
    - Unity-compatible formats
    - Godot-compatible formats

    Args:
        request: Export request with asset IDs and format

    Returns:
        ZIP file with exported assets

    Raises:
        400: Invalid request
        404: Asset(s) not found
        500: Export failed
    """
    user_id = "demo-user"
    if credentials:
        user_id = credentials.credentials[:20]

    try:
        storage_service = StorageService()
        export_service = ExportService()

        # Fetch all requested assets
        assets_data = []
        for asset_id in request.asset_ids:
            asset = await storage_service.get_asset_by_id(user_id, asset_id)
            if not asset:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Asset not found: {asset_id}"
                )

            # Download asset image
            async with httpx.AsyncClient() as client:
                response = await client.get(asset.file_url)
                image_bytes = response.content

            assets_data.append({
                "id": asset.id,
                "file_name": asset.file_name,
                "image_bytes": image_bytes,
                "width": asset.width,
                "height": asset.height
            })

        # Generate export based on format
        if request.format == "png":
            # Individual PNG files
            zip_bytes, files_info = await export_service.export_individual_pngs(assets_data)
        else:
            # Sprite sheet formats
            zip_bytes, files_info = await export_service.create_sprite_sheet(
                assets_data,
                request
            )

        # Return ZIP file
        return StreamingResponse(
            io.BytesIO(zip_bytes),
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename=game_assets_export.zip"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Export failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Export failed: {str(e)}"
        )
