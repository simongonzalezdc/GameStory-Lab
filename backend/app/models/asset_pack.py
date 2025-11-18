"""Pydantic models for asset packs."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class AssetPackCreate(BaseModel):
    """Model for creating a new asset pack."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    tags: List[str] = Field(default_factory=list)
    asset_ids: List[str] = Field(default_factory=list)


class AssetPackUpdate(BaseModel):
    """Model for updating an asset pack."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    asset_ids: Optional[List[str]] = None


class AssetPackResponse(BaseModel):
    """Model for asset pack API responses."""
    id: str
    user_id: str
    name: str
    description: Optional[str]
    tags: List[str]
    asset_ids: List[str]
    asset_count: int
    created_at: str
    updated_at: str


# Alias for convenience
AssetPack = AssetPackResponse


class AssetPackListResponse(BaseModel):
    """Response for listing asset packs."""
    packs: List[AssetPackResponse]
    total: int


class AssetPackDeleteResponse(BaseModel):
    """Response for asset pack deletion."""
    success: bool
    message: str
