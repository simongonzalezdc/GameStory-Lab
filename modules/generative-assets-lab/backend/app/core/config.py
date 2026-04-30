"""Application configuration and settings."""
import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Local Storage
    DATABASE_PATH: str = "./data/assets.db"
    STORAGE_PATH: str = "./data/assets"

    # AI Providers (Optional - at least one should be configured)
    OPENROUTER_API_KEY: str | None = None
    GOOGLE_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    MINIMAX_API_KEY: str | None = None
    MINIMAX_GROUP_ID: str | None = None
    GLM_API_KEY: str | None = None

    # Ollama (Local AI)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_ENABLED: bool = True

    # App Settings
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Rate Limiting
    RATE_LIMIT_PER_HOUR: int = 100

    # File Upload Settings
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: List[str] = [".png", ".jpg", ".jpeg"]

    # Generation Settings
    DEFAULT_MODEL: str = "ollama"  # Default to Ollama for local-first
    DEFAULT_DIMENSIONS: tuple[int, int] = (64, 64)
    MIN_DIMENSION: int = 16
    MAX_DIMENSION: int = 2048

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Convert CORS_ORIGINS string to list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    def has_any_ai_provider(self) -> bool:
        """Check if at least one AI provider is configured."""
        return any([
            self.OPENROUTER_API_KEY,
            self.GOOGLE_API_KEY,
            self.OPENAI_API_KEY,
            self.OLLAMA_ENABLED
        ])


# Global settings instance
settings = Settings()
