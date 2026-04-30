"""Tests for database service."""
import pytest
import json
import uuid
from pathlib import Path

from app.services.database_service import DatabaseService


class TestDatabaseService:
    """Test cases for DatabaseService."""

    @pytest.mark.unit
    async def test_initialize_database(self, test_db: DatabaseService):
        """Test database initialization creates all tables."""
        import aiosqlite
        async with aiosqlite.connect(test_db.db_path) as db:
            # Check assets table exists
            cursor = await db.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='assets'"
            )
            result = await cursor.fetchone()
            assert result is not None
            assert result[0] == 'assets'

            # Check generation_history table exists
            cursor = await db.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='generation_history'"
            )
            result = await cursor.fetchone()
            assert result is not None

            # Check asset_packs table exists
            cursor = await db.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='asset_packs'"
            )
            result = await cursor.fetchone()
            assert result is not None

    @pytest.mark.unit
    async def test_ensure_data_directory(self, test_settings, temp_dir):
        """Test data directory creation."""
        new_db_path = str(temp_dir / "subdir" / "test.db")
        test_settings.DATABASE_PATH = new_db_path

        db_service = DatabaseService()
        db_service.db_path = new_db_path
        db_service._ensure_data_directory()

        # Check directory was created
        assert (temp_dir / "subdir").exists()

    @pytest.mark.unit
    async def test_insert_asset(self, test_db: DatabaseService):
        """Test inserting a new asset."""
        asset_data = {
            'id': str(uuid.uuid4()),
            'user_id': 'local-user',
            'file_url': '/assets/test.png',
            'file_name': 'test.png',
            'file_size': 1024,
            'mime_type': 'image/png',
            'width': 64,
            'height': 64,
            'generation_prompt': 'a red dragon',
            'generation_model': 'test-model',
            'style_tags': ['pixel-art', 'fantasy'],
            'project_name': 'test-project',
            'is_favorite': False,
            'metadata': {'test': 'data'},
            'notes': 'Test notes',
            'version_number': 1
        }

        result = await test_db.insert_asset(asset_data)

        assert result is not None
        assert result['id'] == asset_data['id']
        assert result['file_name'] == asset_data['file_name']
        assert result['width'] == asset_data['width']
        assert result['generation_prompt'] == asset_data['generation_prompt']
        assert result['style_tags'] == asset_data['style_tags']
        assert result['is_favorite'] == False

    @pytest.mark.unit
    async def test_get_asset_by_id(self, test_db: DatabaseService):
        """Test retrieving asset by ID."""
        # First insert an asset
        asset_id = str(uuid.uuid4())
        asset_data = {
            'id': asset_id,
            'user_id': 'local-user',
            'file_url': '/assets/test.png',
            'file_name': 'test.png',
            'file_size': 1024,
            'mime_type': 'image/png',
            'width': 32,
            'height': 32,
            'generation_prompt': 'a blue wizard',
            'generation_model': 'test-model',
            'version_number': 1
        }
        await test_db.insert_asset(asset_data)

        # Retrieve the asset
        result = await test_db.get_asset_by_id(asset_id)

        assert result is not None
        assert result['id'] == asset_id
        assert result['width'] == 32
        assert result['generation_prompt'] == 'a blue wizard'

    @pytest.mark.unit
    async def test_get_asset_by_id_not_found(self, test_db: DatabaseService):
        """Test retrieving non-existent asset returns None."""
        result = await test_db.get_asset_by_id('nonexistent-id')
        assert result is None

    @pytest.mark.unit
    async def test_update_asset(self, test_db: DatabaseService):
        """Test updating asset metadata."""
        # Insert asset
        asset_id = str(uuid.uuid4())
        asset_data = {
            'id': asset_id,
            'user_id': 'local-user',
            'file_url': '/assets/test.png',
            'file_name': 'test.png',
            'file_size': 1024,
            'mime_type': 'image/png',
            'width': 64,
            'height': 64,
            'generation_prompt': 'a warrior',
            'generation_model': 'test-model',
            'style_tags': ['pixel-art'],
            'is_favorite': False,
            'version_number': 1
        }
        await test_db.insert_asset(asset_data)

        # Update asset
        update_data = {
            'style_tags': ['pixel-art', 'fantasy', 'medieval'],
            'is_favorite': True,
            'project_name': 'my-game',
            'notes': 'Updated notes'
        }
        result = await test_db.update_asset(asset_id, 'local-user', update_data)

        assert result is not None
        assert result['style_tags'] == ['pixel-art', 'fantasy', 'medieval']
        assert result['is_favorite'] == True
        assert result['project_name'] == 'my-game'
        assert result['notes'] == 'Updated notes'

    @pytest.mark.unit
    async def test_update_asset_no_fields(self, test_db: DatabaseService):
        """Test updating asset with no fields returns None."""
        asset_id = str(uuid.uuid4())
        result = await test_db.update_asset(asset_id, 'local-user', {})
        assert result is None

    @pytest.mark.unit
    async def test_delete_asset(self, test_db: DatabaseService):
        """Test deleting an asset."""
        # Insert asset
        asset_id = str(uuid.uuid4())
        asset_data = {
            'id': asset_id,
            'user_id': 'local-user',
            'file_url': '/assets/test.png',
            'file_name': 'test.png',
            'file_size': 1024,
            'mime_type': 'image/png',
            'width': 64,
            'height': 64,
            'generation_prompt': 'test',
            'generation_model': 'test-model',
            'version_number': 1
        }
        await test_db.insert_asset(asset_data)

        # Delete asset
        success = await test_db.delete_asset(asset_id, 'local-user')
        assert success is True

        # Verify asset is deleted
        result = await test_db.get_asset_by_id(asset_id, 'local-user')
        assert result is None

    @pytest.mark.unit
    async def test_delete_asset_not_found(self, test_db: DatabaseService):
        """Test deleting non-existent asset returns False."""
        success = await test_db.delete_asset('nonexistent-id', 'local-user')
        assert success is False

    @pytest.mark.unit
    async def test_get_assets(self, test_db: DatabaseService):
        """Test retrieving multiple assets with pagination."""
        # Insert multiple assets
        for i in range(5):
            asset_data = {
                'id': str(uuid.uuid4()),
                'user_id': 'local-user',
                'file_url': f'/assets/test{i}.png',
                'file_name': f'test{i}.png',
                'file_size': 1024,
                'mime_type': 'image/png',
                'width': 64,
                'height': 64,
                'generation_prompt': f'test prompt {i}',
                'generation_model': 'test-model',
                'project_name': 'test-project' if i % 2 == 0 else None,
                'version_number': 1
            }
            await test_db.insert_asset(asset_data)

        # Get all assets
        assets, total = await test_db.get_assets(user_id='local-user', limit=10, offset=0)
        assert len(assets) == 5
        assert total == 5

        # Test pagination
        assets, total = await test_db.get_assets(user_id='local-user', limit=2, offset=0)
        assert len(assets) == 2
        assert total == 5

        # Test project filter
        assets, total = await test_db.get_assets(
            user_id='local-user',
            project_name='test-project',
            limit=10,
            offset=0
        )
        assert len(assets) == 3  # Assets 0, 2, 4
        assert total == 3

    @pytest.mark.unit
    async def test_get_assets_with_search(self, test_db: DatabaseService):
        """Test retrieving assets with search query."""
        # Insert assets with different prompts
        asset1_data = {
            'id': str(uuid.uuid4()),
            'user_id': 'local-user',
            'file_url': '/assets/dragon.png',
            'file_name': 'dragon.png',
            'file_size': 1024,
            'mime_type': 'image/png',
            'width': 64,
            'height': 64,
            'generation_prompt': 'a red dragon breathing fire',
            'generation_model': 'test-model',
            'version_number': 1
        }
        asset2_data = {
            'id': str(uuid.uuid4()),
            'user_id': 'local-user',
            'file_url': '/assets/wizard.png',
            'file_name': 'wizard.png',
            'file_size': 1024,
            'mime_type': 'image/png',
            'width': 64,
            'height': 64,
            'generation_prompt': 'a blue wizard casting spell',
            'generation_model': 'test-model',
            'version_number': 1
        }
        await test_db.insert_asset(asset1_data)
        await test_db.insert_asset(asset2_data)

        # Search for dragon
        assets, total = await test_db.get_assets(
            user_id='local-user',
            search_query='dragon',
            limit=10,
            offset=0
        )
        assert len(assets) == 1
        assert total == 1
        assert 'dragon' in assets[0]['generation_prompt'].lower()

    @pytest.mark.unit
    async def test_get_asset_versions(self, test_db: DatabaseService):
        """Test retrieving asset version history."""
        # Create original asset
        original_id = str(uuid.uuid4())
        original_data = {
            'id': original_id,
            'user_id': 'local-user',
            'file_url': '/assets/original.png',
            'file_name': 'original.png',
            'file_size': 1024,
            'mime_type': 'image/png',
            'width': 64,
            'height': 64,
            'generation_prompt': 'original prompt',
            'generation_model': 'test-model',
            'version_number': 1,
            'parent_asset_id': None
        }
        await test_db.insert_asset(original_data)

        # Create version 2
        v2_id = str(uuid.uuid4())
        v2_data = {
            'id': v2_id,
            'user_id': 'local-user',
            'file_url': '/assets/v2.png',
            'file_name': 'v2.png',
            'file_size': 1024,
            'mime_type': 'image/png',
            'width': 64,
            'height': 64,
            'generation_prompt': 'refined prompt',
            'generation_model': 'test-model',
            'version_number': 2,
            'parent_asset_id': original_id,
            'refinement_instruction': 'make it bigger'
        }
        await test_db.insert_asset(v2_data)

        # Get versions
        versions = await test_db.get_asset_versions(v2_id, 'local-user')
        assert len(versions) == 2
        assert versions[0]['version_number'] == 1
        assert versions[1]['version_number'] == 2
        assert versions[1]['parent_asset_id'] == original_id

    @pytest.mark.unit
    async def test_get_next_version_number(self, test_db: DatabaseService):
        """Test getting next version number."""
        # Create original asset
        asset_id = str(uuid.uuid4())
        asset_data = {
            'id': asset_id,
            'user_id': 'local-user',
            'file_url': '/assets/test.png',
            'file_name': 'test.png',
            'file_size': 1024,
            'mime_type': 'image/png',
            'width': 64,
            'height': 64,
            'generation_prompt': 'test',
            'generation_model': 'test-model',
            'version_number': 1
        }
        await test_db.insert_asset(asset_data)

        # Get next version
        next_version = await test_db.get_next_version_number(asset_id, 'local-user')
        assert next_version == 2

    @pytest.mark.unit
    async def test_get_next_version_number_no_parent(self, test_db: DatabaseService):
        """Test getting next version when parent doesn't exist."""
        next_version = await test_db.get_next_version_number('nonexistent', 'local-user')
        assert next_version == 1

    @pytest.mark.unit
    async def test_create_asset_pack(self, test_db: DatabaseService):
        """Test creating an asset pack."""
        pack_data = {
            'name': 'Fantasy Pack',
            'description': 'A collection of fantasy assets',
            'tags': ['fantasy', 'medieval'],
            'asset_ids': ['asset1', 'asset2', 'asset3']
        }

        result = await test_db.create_asset_pack(pack_data)

        assert result is not None
        assert result['name'] == 'Fantasy Pack'
        assert result['description'] == 'A collection of fantasy assets'
        assert result['tags'] == ['fantasy', 'medieval']
        assert result['asset_ids'] == ['asset1', 'asset2', 'asset3']
        assert result['asset_count'] == 3

    @pytest.mark.unit
    async def test_get_asset_packs(self, test_db: DatabaseService):
        """Test retrieving all asset packs."""
        # Create multiple packs
        for i in range(3):
            pack_data = {
                'name': f'Pack {i}',
                'description': f'Description {i}',
                'tags': [f'tag{i}'],
                'asset_ids': [f'asset{i}']
            }
            await test_db.create_asset_pack(pack_data)

        # Get all packs
        packs = await test_db.get_asset_packs('local-user')
        assert len(packs) == 3

    @pytest.mark.unit
    async def test_get_asset_pack_by_id(self, test_db: DatabaseService):
        """Test retrieving a specific asset pack."""
        # Create pack
        pack_data = {
            'name': 'Test Pack',
            'description': 'Test description',
            'tags': ['test'],
            'asset_ids': ['asset1']
        }
        created_pack = await test_db.create_asset_pack(pack_data)

        # Retrieve pack
        result = await test_db.get_asset_pack_by_id(created_pack['id'], 'local-user')

        assert result is not None
        assert result['id'] == created_pack['id']
        assert result['name'] == 'Test Pack'

    @pytest.mark.unit
    async def test_get_asset_pack_by_id_not_found(self, test_db: DatabaseService):
        """Test retrieving non-existent asset pack."""
        result = await test_db.get_asset_pack_by_id('nonexistent', 'local-user')
        assert result is None

    @pytest.mark.unit
    async def test_update_asset_pack(self, test_db: DatabaseService):
        """Test updating asset pack."""
        # Create pack
        pack_data = {
            'name': 'Original Name',
            'description': 'Original description',
            'tags': ['tag1'],
            'asset_ids': ['asset1']
        }
        created_pack = await test_db.create_asset_pack(pack_data)

        # Update pack
        update_data = {
            'name': 'Updated Name',
            'description': 'Updated description',
            'tags': ['tag1', 'tag2'],
            'asset_ids': ['asset1', 'asset2', 'asset3']
        }
        result = await test_db.update_asset_pack(created_pack['id'], 'local-user', update_data)

        assert result is not None
        assert result['name'] == 'Updated Name'
        assert result['description'] == 'Updated description'
        assert result['tags'] == ['tag1', 'tag2']
        assert result['asset_ids'] == ['asset1', 'asset2', 'asset3']
        assert result['asset_count'] == 3

    @pytest.mark.unit
    async def test_update_asset_pack_no_fields(self, test_db: DatabaseService):
        """Test updating pack with no fields returns None."""
        result = await test_db.update_asset_pack('pack-id', 'local-user', {})
        assert result is None

    @pytest.mark.unit
    async def test_delete_asset_pack(self, test_db: DatabaseService):
        """Test deleting an asset pack."""
        # Create pack
        pack_data = {
            'name': 'Pack to Delete',
            'description': 'This will be deleted',
            'tags': [],
            'asset_ids': []
        }
        created_pack = await test_db.create_asset_pack(pack_data)

        # Delete pack
        success = await test_db.delete_asset_pack(created_pack['id'], 'local-user')
        assert success is True

        # Verify deletion
        result = await test_db.get_asset_pack_by_id(created_pack['id'], 'local-user')
        assert result is None

    @pytest.mark.unit
    async def test_delete_asset_pack_not_found(self, test_db: DatabaseService):
        """Test deleting non-existent pack returns False."""
        success = await test_db.delete_asset_pack('nonexistent', 'local-user')
        assert success is False

    @pytest.mark.unit
    def test_row_to_asset_with_json_parsing(self, test_db: DatabaseService):
        """Test row to asset conversion with JSON fields."""
        row = (
            'asset-123',
            'local-user',
            '/assets/test.png',
            'test.png',
            1024,
            'image/png',
            64,
            64,
            'test prompt',
            'test-model',
            '["pixel-art", "fantasy"]',
            'test-project',
            1,
            '{"key": "value"}',
            '2024-01-01 00:00:00',
            '2024-01-01 00:00:00',
            None,
            1,
            None,
            'Test notes'
        )
        description = [
            ('id',), ('user_id',), ('file_url',), ('file_name',),
            ('file_size',), ('mime_type',), ('width',), ('height',),
            ('generation_prompt',), ('generation_model',),
            ('style_tags',), ('project_name',), ('is_favorite',),
            ('metadata',), ('created_at',), ('updated_at',),
            ('parent_asset_id',), ('version_number',),
            ('refinement_instruction',), ('notes',)
        ]

        result = test_db._row_to_asset(row, description)

        assert result['id'] == 'asset-123'
        assert result['style_tags'] == ['pixel-art', 'fantasy']
        assert result['metadata'] == {'key': 'value'}
        assert result['is_favorite'] is True

    @pytest.mark.unit
    def test_row_to_pack_with_json_parsing(self, test_db: DatabaseService):
        """Test row to pack conversion with JSON fields."""
        row = (
            'pack-123',
            'local-user',
            'Test Pack',
            'Test description',
            '["tag1", "tag2"]',
            '["asset1", "asset2", "asset3"]',
            '2024-01-01 00:00:00',
            '2024-01-01 00:00:00'
        )
        description = [
            ('id',), ('user_id',), ('name',), ('description',),
            ('tags',), ('asset_ids',), ('created_at',), ('updated_at',)
        ]

        result = test_db._row_to_pack(row, description)

        assert result['id'] == 'pack-123'
        assert result['tags'] == ['tag1', 'tag2']
        assert result['asset_ids'] == ['asset1', 'asset2', 'asset3']
        assert result['asset_count'] == 3
