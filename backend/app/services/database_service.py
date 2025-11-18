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

            # Run migrations
            await self._run_migrations(db)

    async def _run_migrations(self, db: aiosqlite.Connection):
        """
        Run database migrations for schema updates.

        This method adds new columns that weren't in the original schema.
        It's safe to run multiple times (uses IF NOT EXISTS logic).
        """
        # Phase 2: Asset versioning columns
        try:
            # Check if parent_asset_id column exists
            cursor = await db.execute("PRAGMA table_info(assets)")
            columns = {row[1] for row in await cursor.fetchall()}

            if 'parent_asset_id' not in columns:
                logger.info("Running migration: Adding asset versioning columns")

                # Add versioning columns
                await db.execute("""
                    ALTER TABLE assets
                    ADD COLUMN parent_asset_id TEXT REFERENCES assets(id)
                """)
                await db.execute("""
                    ALTER TABLE assets
                    ADD COLUMN version_number INTEGER DEFAULT 1
                """)
                await db.execute("""
                    ALTER TABLE assets
                    ADD COLUMN refinement_instruction TEXT
                """)

                # Create index for parent lookups
                await db.execute("""
                    CREATE INDEX IF NOT EXISTS idx_assets_parent
                    ON assets(parent_asset_id)
                """)

                await db.commit()
                logger.info("Migration complete: Asset versioning enabled")

        except Exception as e:
            logger.error(f"Migration failed: {e}")
            # Non-critical - continue anyway

        # Migration: Add notes field
        try:
            async with aiosqlite.connect(self.db_path) as db:
                # Check if notes column exists
                cursor = await db.execute("PRAGMA table_info(assets)")
                columns = await cursor.fetchall()
                has_notes = any(col[1] == 'notes' for col in columns)

                if not has_notes:
                    logger.info("Running migration: Adding notes field")
                    await db.execute("""
                        ALTER TABLE assets
                        ADD COLUMN notes TEXT
                    """)
                    await db.commit()
                    logger.info("Migration complete: Notes field added")

        except Exception as e:
            logger.error(f"Migration failed: {e}")
            # Non-critical - continue anyway

    async def insert_asset(self, asset_data: dict) -> dict:
        """Insert new asset into database."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT INTO assets (
                    id, user_id, file_url, file_name, file_size, mime_type,
                    width, height, generation_prompt, generation_model,
                    style_tags, project_name, is_favorite, metadata, notes,
                    parent_asset_id, version_number, refinement_instruction
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                str(asset_data.get('metadata', {})),
                asset_data.get('notes'),
                asset_data.get('parent_asset_id'),
                asset_data.get('version_number', 1),
                asset_data.get('refinement_instruction')
            ))
            await db.commit()

            # Fetch the inserted asset
            cursor = await db.execute(
                "SELECT * FROM assets WHERE id = ?",
                (asset_data['id'],)
            )
            row = await cursor.fetchone()
            return self._row_to_asset(row, cursor.description)

    async def update_asset(self, asset_id: str, user_id: str, update_data: dict) -> Optional[dict]:
        """Update asset metadata."""
        async with aiosqlite.connect(self.db_path) as db:
            # Build dynamic UPDATE query based on provided fields
            update_fields = []
            values = []

            if 'style_tags' in update_data:
                update_fields.append("style_tags = ?")
                values.append(str(update_data['style_tags']))

            if 'project_name' in update_data:
                update_fields.append("project_name = ?")
                values.append(update_data['project_name'])

            if 'is_favorite' in update_data:
                update_fields.append("is_favorite = ?")
                values.append(int(update_data['is_favorite']))

            if 'notes' in update_data:
                update_fields.append("notes = ?")
                values.append(update_data['notes'])

            if not update_fields:
                # No fields to update
                return None

            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            values.extend([asset_id, user_id])

            query = f"""
                UPDATE assets
                SET {', '.join(update_fields)}
                WHERE id = ? AND user_id = ?
            """

            await db.execute(query, values)
            await db.commit()

            # Fetch updated asset
            cursor = await db.execute(
                "SELECT * FROM assets WHERE id = ? AND user_id = ?",
                (asset_id, user_id)
            )
            row = await cursor.fetchone()
            if row:
                return self._row_to_asset(row, cursor.description)
            return None

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

    async def get_asset_versions(self, asset_id: str, user_id: str = 'local-user') -> List[dict]:
        """
        Get all versions of an asset (original + all refinements).

        Returns versions in chronological order (oldest to newest).

        Args:
            asset_id: ID of any version in the chain
            user_id: User ID

        Returns:
            List of asset dictionaries representing the version history
        """
        async with aiosqlite.connect(self.db_path) as db:
            # First, find the root asset (the one with no parent)
            cursor = await db.execute("""
                WITH RECURSIVE version_chain AS (
                    -- Start with the given asset
                    SELECT * FROM assets WHERE id = ? AND user_id = ?
                    UNION ALL
                    -- Recursively find parent
                    SELECT a.* FROM assets a
                    INNER JOIN version_chain v ON a.id = v.parent_asset_id
                    WHERE a.user_id = ?
                )
                SELECT * FROM version_chain
            """, (asset_id, user_id, user_id))
            rows = await cursor.fetchall()

            if not rows:
                return []

            # The last row is the root
            root_id = rows[-1][0]  # id is first column

            # Now get all descendants of the root
            cursor = await db.execute("""
                WITH RECURSIVE descendants AS (
                    -- Start with root
                    SELECT * FROM assets WHERE id = ? AND user_id = ?
                    UNION ALL
                    -- Recursively find children
                    SELECT a.* FROM assets a
                    INNER JOIN descendants d ON a.parent_asset_id = d.id
                    WHERE a.user_id = ?
                )
                SELECT * FROM descendants
                ORDER BY version_number ASC
            """, (root_id, user_id, user_id))

            rows = await cursor.fetchall()
            return [self._row_to_asset(row, cursor.description) for row in rows]

    async def get_next_version_number(self, parent_asset_id: str, user_id: str = 'local-user') -> int:
        """
        Get the next version number for a new refinement.

        Args:
            parent_asset_id: ID of the parent asset
            user_id: User ID

        Returns:
            Next version number (parent's version + 1)
        """
        parent = await self.get_asset_by_id(parent_asset_id, user_id)
        if not parent:
            return 1
        return parent.get('version_number', 1) + 1

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
