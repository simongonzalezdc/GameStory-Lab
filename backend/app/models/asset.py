"""Pydantic models for assets."""
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class AssetCreate(BaseModel):
    """Model for creating new asset."""
    file_name: str
    file_size: int = Field(gt=0)
    width: int = Field(gt=0)
    height: int = Field(gt=0)
    generation_prompt: Optional[str] = None
    generation_model: str
    style_tags: List[str] = []
    project_name: Optional[str] = None


class AssetResponse(BaseModel):
    """Model for asset API responses."""
    id: str
    user_id: str
    file_url: str
    file_name: str
    file_size: int
    mime_type: str
    width: int
    height: int
    generation_prompt: Optional[str]
    generation_model: str
    style_tags: List[str]
    project_name: Optional[str]
    is_favorite: bool
    metadata: dict
    created_at: str
    updated_at: str


class AssetFilter(BaseModel):
    """Model for filtering assets."""
    project_name: Optional[str] = None
    style_tags: Optional[List[str]] = None
    search_query: Optional[str] = None
    limit: int = Field(50, le=100)
    offset: int = 0


class AssetsListResponse(BaseModel):
    """Response for listing assets."""
    assets: List[AssetResponse]
    total: int
    limit: int
    offset: int


class AssetDeleteResponse(BaseModel):
    """Response for asset deletion."""
    success: bool
    message: str
