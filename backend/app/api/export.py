"""Asset export API endpoints."""
import logging
import io
import aiofiles
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from app.models.export import ExportRequest
from app.services.local_storage_service import storage_service
from app.services.database_service import db_service
from app.services.export_service import ExportService

router = APIRouter(prefix="/api/export", tags=["export"])
logger = logging.getLogger(__name__)


@router.post("/")
async def export_assets(request: ExportRequest):
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
    user_id = "local-user"

    try:
        export_service = ExportService()

        # Batch fetch all requested assets (fixes N+1 query problem)
        assets = await db_service.get_assets_batch(request.asset_ids, user_id)

        # Check if all requested assets were found
        if len(assets) != len(request.asset_ids):
            found_ids = {asset['id'] for asset in assets}
            missing_ids = set(request.asset_ids) - found_ids
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Assets not found: {', '.join(missing_ids)}"
            )

        # Read all asset images asynchronously
        assets_data = []
        for asset in assets:
            # Read asset image from local storage using async I/O
            file_path = storage_service.get_file_path(asset['file_url'])
            async with aiofiles.open(file_path, 'rb') as f:
                image_bytes = await f.read()

            assets_data.append({
                "id": asset['id'],
                "file_name": asset['file_name'],
                "image_bytes": image_bytes,
                "width": asset['width'],
                "height": asset['height']
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
