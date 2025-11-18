"""Pytest fixtures and configuration for backend tests."""
import asyncio
import os
import pytest
import tempfile
from pathlib import Path
from typing import AsyncGenerator, Generator
from unittest.mock import AsyncMock, MagicMock
import aiosqlite

from fastapi.testclient import TestClient
from app.main import app
from app.core.config import Settings, settings
from app.services.database_service import DatabaseService


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def temp_dir() -> Generator[Path, None, None]:
    """Create a temporary directory for test files."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def test_settings(temp_dir: Path) -> Settings:
    """Create test settings with temporary paths."""
    test_db_path = str(temp_dir / "test_assets.db")
    test_storage_path = str(temp_dir / "test_assets")

    # Create test settings
    test_settings = Settings(
        DATABASE_PATH=test_db_path,
        STORAGE_PATH=test_storage_path,
        ENVIRONMENT="testing",
        LOG_LEVEL="DEBUG",
        CORS_ORIGINS="http://localhost:5173",
        OLLAMA_ENABLED=False,  # Disable by default for tests
        OPENROUTER_API_KEY="test-key-openrouter",
        RATE_LIMIT_PER_HOUR=1000,
    )

    # Ensure storage directory exists
    Path(test_storage_path).mkdir(parents=True, exist_ok=True)

    return test_settings


@pytest.fixture
async def test_db(test_settings: Settings) -> AsyncGenerator[DatabaseService, None]:
    """Create a test database instance."""
    db_service = DatabaseService()
    db_service.db_path = test_settings.DATABASE_PATH

    # Initialize database
    await db_service.initialize_database()

    yield db_service

    # Cleanup: Remove test database
    if os.path.exists(test_settings.DATABASE_PATH):
        os.remove(test_settings.DATABASE_PATH)


@pytest.fixture
async def db_connection(test_settings: Settings) -> AsyncGenerator[aiosqlite.Connection, None]:
    """Create a database connection for testing."""
    conn = await aiosqlite.connect(test_settings.DATABASE_PATH)

    # Initialize schema
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS assets (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT 'local-user',
            file_url TEXT NOT NULL,
            file_name TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            mime_type TEXT NOT NULL DEFAULT 'image/png',
            width INTEGER NOT NULL,
            height INTEGER NOT NULL,
            generation_prompt TEXT,
            generation_model TEXT NOT NULL,
            style_tags TEXT DEFAULT '[]',
            project_name TEXT,
            is_favorite INTEGER DEFAULT 0,
            metadata TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    await conn.execute("""
        CREATE TABLE IF NOT EXISTS generation_history (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT 'local-user',
            asset_id TEXT,
            prompt TEXT NOT NULL,
            negative_prompt TEXT,
            model_used TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            error_message TEXT,
            generation_time_ms INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL
        )
    """)

    await conn.execute("""
        CREATE TABLE IF NOT EXISTS asset_packs (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT 'local-user',
            name TEXT NOT NULL,
            description TEXT,
            tags TEXT DEFAULT '[]',
            asset_ids TEXT DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    await conn.commit()

    yield conn

    await conn.close()


@pytest.fixture
def client(test_settings: Settings, monkeypatch) -> TestClient:
    """Create a test client for FastAPI app."""
    # Monkey patch settings
    monkeypatch.setattr("app.core.config.settings", test_settings)
    monkeypatch.setattr("app.main.settings", test_settings)

    return TestClient(app)


@pytest.fixture
def mock_ai_response():
    """Mock AI provider response."""
    return {
        "id": "mock-response-123",
        "choices": [{
            "message": {
                "content": "Mock generated content"
            }
        }],
        "model": "mock-model",
        "usage": {
            "prompt_tokens": 10,
            "completion_tokens": 20,
            "total_tokens": 30
        }
    }


@pytest.fixture
def mock_image_data():
    """Mock image data for testing."""
    # Create a simple 1x1 PNG image (base64)
    import base64
    png_data = base64.b64decode(
        b"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    )
    return png_data


@pytest.fixture
def sample_asset_data():
    """Sample asset data for testing."""
    return {
        "id": "test-asset-123",
        "user_id": "local-user",
        "file_url": "/assets/test-asset-123.png",
        "file_name": "test-asset-123.png",
        "file_size": 1024,
        "mime_type": "image/png",
        "width": 64,
        "height": 64,
        "generation_prompt": "a red dragon",
        "generation_model": "test-model",
        "style_tags": '["pixel-art", "fantasy"]',
        "project_name": "test-project",
        "is_favorite": 0,
        "metadata": '{}'
    }


@pytest.fixture
def sample_generation_request():
    """Sample generation request data."""
    return {
        "prompt": "a blue wizard casting a spell",
        "negative_prompt": "blurry, low quality",
        "provider": "openrouter",
        "model": "test-model",
        "width": 64,
        "height": 64,
        "style_preset": "pixel-art",
        "art_style": "fantasy",
        "color_palette": "vibrant"
    }


@pytest.fixture
def mock_ollama_service():
    """Mock Ollama service for testing."""
    mock = AsyncMock()
    mock.is_available = AsyncMock(return_value=True)
    mock.get_models = AsyncMock(return_value=[
        {"name": "llama2:latest", "size": 3800000000},
        {"name": "mistral:latest", "size": 4100000000}
    ])
    mock.generate_image_description = AsyncMock(return_value="A detailed image description")
    return mock


@pytest.fixture
def mock_image_service():
    """Mock image service for testing."""
    mock = MagicMock()
    mock.optimize_image = MagicMock(return_value=b"optimized_image_data")
    mock.resize_image = MagicMock(return_value=b"resized_image_data")
    mock.convert_format = MagicMock(return_value=b"converted_image_data")
    mock.get_image_dimensions = MagicMock(return_value=(64, 64))
    return mock
