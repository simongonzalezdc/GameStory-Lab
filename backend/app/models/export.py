"""Pydantic models for asset export."""
from pydantic import BaseModel, Field
from typing import List, Optional


class ExportSettings(BaseModel):
    """Settings for export generation."""
    sheet_width: int = Field(512, ge=128, le=4096)
    sheet_height: int = Field(512, ge=128, le=4096)
    padding: int = Field(2, ge=0, le=16)
    trim_transparency: bool = True


class ExportRequest(BaseModel):
    """Request model for exporting assets."""
    asset_ids: List[str] = Field(..., min_length=1, max_length=100)
    format: str = Field(
        ...,
        pattern="^(png|sprite-sheet-json|texture-atlas-xml|unity|godot|generic)$"
    )
    target_engine: Optional[str] = Field(
        None,
        pattern="^(unity|godot|unreal|generic)$"
    )
    settings: ExportSettings = Field(default_factory=ExportSettings)
    resolution_multiplier: int = Field(1, ge=1, le=4)


class ExportFile(BaseModel):
    """Information about an exported file."""
    name: str
    url: str
    size: int


class ExportResponse(BaseModel):
    """Response for export requests."""
    success: bool
    export_url: Optional[str] = None
    files: List[ExportFile] = Field(default_factory=list)
    error: Optional[str] = None
