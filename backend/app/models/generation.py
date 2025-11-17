"""Pydantic models for asset generation."""
from pydantic import BaseModel, Field
from typing import Optional, List


class DimensionsModel(BaseModel):
    """Asset dimensions."""
    width: int = Field(ge=16, le=2048, default=64)
    height: int = Field(ge=16, le=2048, default=64)


class GenerationRequest(BaseModel):
    """Request model for generating assets."""
    prompt: str = Field(..., min_length=10, max_length=2000, description="Text prompt for generation")
    negative_prompt: Optional[str] = Field(None, max_length=500, description="Things to avoid in generation")
    model: str = Field(..., pattern="^(openrouter|google|chatgpt|ollama)$", description="AI model to use")
    ollama_model: Optional[str] = Field(None, description="Specific Ollama model name (required if model='ollama')")
    reference_image: Optional[str] = Field(None, description="Base64 encoded reference image")
    style_tags: List[str] = Field(default_factory=list, max_length=10)
    project_name: Optional[str] = Field(None, max_length=100)
    dimensions: DimensionsModel = Field(default_factory=DimensionsModel)


class RefineRequest(BaseModel):
    """Request model for refining existing assets."""
    asset_id: str = Field(..., description="ID of asset to refine")
    instruction: str = Field(..., min_length=5, max_length=500, description="Refinement instruction")
    model: str = Field(..., pattern="^(openrouter|google|chatgpt|ollama)$")
    ollama_model: Optional[str] = Field(None, description="Specific Ollama model name")


class GenerationResponse(BaseModel):
    """Response model for generation requests."""
    success: bool
    asset: Optional[dict] = None
    generation_id: Optional[str] = None
    generation_time_ms: Optional[int] = None
    error: Optional[str] = None


class OllamaModelInfo(BaseModel):
    """Information about available Ollama model."""
    name: str
    size: str
    modified: str


class OllamaStatusResponse(BaseModel):
    """Response for Ollama availability check."""
    available: bool
    url: str
    models: List[OllamaModelInfo] = Field(default_factory=list)
    error: Optional[str] = None
