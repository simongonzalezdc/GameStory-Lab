"""SQLite database service for local storage."""
import aiosqlite
import logging
import os
from typing import Optional, List
from pathlib import Path

from app.core.config import settings

logger = logging.getLogger(__name__)


class DatabaseService:
    """Service for managing SQLite database operations."""

    def __init__(self):
        """Initialize database service."""
        self.db_path = settings.DATABASE_PATH
        self._ensure_data_directory()

    def _ensure_data_directory(self):
        """Ensure data directory exists."""
        db_dir = os.path.dirname(self.db_path)
        if db_dir:
            Path(db_dir).mkdir(parents=True, exist_ok=True)

    async def initialize_database(self):
        """Initialize database with schema."""
        async with aiosqlite.connect(self.db_path) as db:
            # Create assets table
            await db.execute("""
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

            # Create indexes
            await db.execute("""
                CREATE INDEX IF NOT EXISTS idx_assets_user_id
                ON assets(user_id)
            """)
            await db.execute("""
                CREATE INDEX IF NOT EXISTS idx_assets_created_at
                ON assets(created_at DESC)
            """)

            # Create generation_history table
            await db.execute("""
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

            await db.commit()
            logger.info(f"Database initialized at {self.db_path}")

    async def insert_asset(self, asset_data: dict) -> dict:
        """Insert new asset into database."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT INTO assets (
                    id, user_id, file_url, file_name, file_size, mime_type,
                    width, height, generation_prompt, generation_model,
                    style_tags, project_name, is_favorite, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                asset_data['id'],
                asset_data.get('user_id', 'local-user'),
                asset_data['file_url'],
                asset_data['file_name'],
                asset_data['file_size'],
                asset_data.get('mime_type', 'image/png'),
                asset_data['width'],
                asset_data['height'],
                asset_data.get('generation_prompt'),
                asset_data['generation_model'],
                str(asset_data.get('style_tags', [])),
                asset_data.get('project_name'),
                int(asset_data.get('is_favorite', False)),
                str(asset_data.get('metadata', {}))
            ))
            await db.commit()

            # Fetch the inserted asset
            cursor = await db.execute(
                "SELECT * FROM assets WHERE id = ?",
                (asset_data['id'],)
            )
            row = await cursor.fetchone()
            return self._row_to_asset(row, cursor.description)

    async def get_assets(
        self,
        user_id: str = 'local-user',
        project_name: Optional[str] = None,
        search_query: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> tuple[List[dict], int]:
        """Get assets with filtering."""
        async with aiosqlite.connect(self.db_path) as db:
            # Build query
            query = "SELECT * FROM assets WHERE user_id = ?"
            params = [user_id]

            if project_name:
                query += " AND project_name = ?"
                params.append(project_name)

            if search_query:
                query += " AND generation_prompt LIKE ?"
                params.append(f"%{search_query}%")

            # Get total count
            count_query = query.replace("SELECT *", "SELECT COUNT(*)")
            cursor = await db.execute(count_query, params)
            total = (await cursor.fetchone())[0]

            # Get paginated results
            query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])

            cursor = await db.execute(query, params)
            rows = await cursor.fetchall()
            assets = [self._row_to_asset(row, cursor.description) for row in rows]

            return assets, total

    async def get_asset_by_id(self, asset_id: str, user_id: str = 'local-user') -> Optional[dict]:
        """Get specific asset by ID."""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                "SELECT * FROM assets WHERE id = ? AND user_id = ?",
                (asset_id, user_id)
            )
            row = await cursor.fetchone()
            if row:
                return self._row_to_asset(row, cursor.description)
            return None

    async def delete_asset(self, asset_id: str, user_id: str = 'local-user') -> bool:
        """Delete asset from database."""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                "DELETE FROM assets WHERE id = ? AND user_id = ?",
                (asset_id, user_id)
            )
            await db.commit()
            return cursor.rowcount > 0

    def _row_to_asset(self, row: tuple, description: list) -> dict:
        """Convert database row to asset dictionary."""
        import json
        columns = [col[0] for col in description]
        asset = dict(zip(columns, row))

        # Parse JSON fields
        if 'style_tags' in asset and asset['style_tags']:
            try:
                asset['style_tags'] = json.loads(asset['style_tags'].replace("'", '"'))
            except:
                asset['style_tags'] = []

        if 'metadata' in asset and asset['metadata']:
            try:
                asset['metadata'] = json.loads(asset['metadata'].replace("'", '"'))
            except:
                asset['metadata'] = {}

        # Convert boolean
        if 'is_favorite' in asset:
            asset['is_favorite'] = bool(asset['is_favorite'])

        return asset


# Global database instance
db_service = DatabaseService()
