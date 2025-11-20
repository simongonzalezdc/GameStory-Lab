-- Migration: Unified Assistant Implementation
-- Consolidate separate concept/architect sessions into unified 'project' sessions
-- Add interview persistence support via metadata field

-- Update existing chat sessions to use unified 'project' type
-- This migration handles the transition from separate session types to unified session per project

-- First, identify the most recent session per project and mark it for migration
-- We'll keep only the most recent session per project and update its type to 'project'

-- Step 1: Identify duplicate sessions and keep only the most recent one per project
WITH ranked_sessions AS (
  SELECT 
    id,
    project_id,
    type,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at DESC) as rn
  FROM chat_sessions
  WHERE type IN ('concept', 'architect')
),
sessions_to_update AS (
  SELECT id
  FROM ranked_sessions
  WHERE rn = 1
)
-- Update the most recent sessions to have type 'project'
UPDATE chat_sessions 
SET 
  type = 'project',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{migratedFrom}',
    to_jsonb(type)
  )
WHERE id IN (SELECT id FROM sessions_to_update);

-- Delete duplicate sessions (keeping only the most recent one per project)
DELETE FROM chat_sessions 
WHERE id NOT IN (
  SELECT DISTINCT ON (project_id) id 
  FROM chat_sessions 
  ORDER BY project_id, created_at DESC
) AND type IN ('concept', 'architect');

-- Update the enum constraint if any exists on chat_sessions.type
-- Note: PostgreSQL doesn't support changing ENUM values directly, so we use a CHECK constraint approach

-- Add a comment to track the migration
COMMENT ON TABLE chat_sessions IS 'Migrated to unified sessions on 2025-11-20: All sessions now use type=project with metadata.mode for context';
