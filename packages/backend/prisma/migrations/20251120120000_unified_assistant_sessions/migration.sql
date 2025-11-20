-- Migration: Unified Assistant Sessions and Interview Persistence
-- Purpose: Consolidate concept/architect sessions to single project session with persistent interview state

-- 1. Migrate existing chat sessions to unified 'project' type
-- Update all existing concept and architect sessions to use 'project' type
UPDATE chat_sessions 
SET type = 'project' 
WHERE type IN ('concept', 'architect');

-- 2. Add unique constraint to ensure only one project session per project
-- First, check if there are any duplicate project sessions and keep only the most recent
DELETE FROM chat_sessions 
WHERE id NOT IN (
  SELECT DISTINCT ON (project_id) id
  FROM chat_sessions 
  WHERE type = 'project' 
  ORDER BY project_id, created_at DESC
) AND type = 'project';

-- Add unique constraint for project_id when type = 'project'
CREATE UNIQUE INDEX chat_sessions_project_type_unique 
ON chat_sessions(project_id) 
WHERE type = 'project';

-- 3. Add metadata fields for interview persistence and mode tracking
-- Add mode hint to metadata (concept | architect | auto)
-- Add architect interview state to metadata
ALTER TABLE chat_sessions 
ALTER COLUMN metadata SET DEFAULT jsonb_build_object(
  'mode', 'auto',
  'architectInterview', jsonb_build_object(
    'completionPercentage', 0,
    'currentPhase', 'initial',
    'answeredQuestions', jsonb_build_array(),
    'currentQuestionIndex', 0,
    'totalQuestions', 12
  )
);

-- 4. Update chat_messages table to support mode metadata
-- This allows tracking which mode each message was sent in
ALTER TABLE chat_messages 
ALTER COLUMN metadata SET DEFAULT jsonb_build_object('mode', 'auto');

-- 5. Update assistant_proposals table to support mixed content types
-- Ensure payload can handle mechanics, lore, and architectDocuments together
ALTER TABLE assistant_proposals 
ALTER COLUMN payload SET DEFAULT jsonb_build_object(
  'explanation', '',
  'mechanics', jsonb_build_object(),
  'lore', jsonb_build_object(),
  'architectDocuments', jsonb_build_array()
);

-- 6. Create indexes for better performance on unified sessions
CREATE INDEX chat_sessions_project_type_metadata_gin 
ON chat_sessions USING GIN ((metadata->'mode')) 
WHERE type = 'project';

CREATE INDEX chat_messages_session_metadata_gin 
ON chat_messages USING GIN (metadata);

-- 7. Add comments for documentation
COMMENT ON COLUMN chat_sessions.metadata IS 'Contains mode hint (concept|architect|auto) and architect interview state';
COMMENT ON COLUMN chat_sessions.metadata->'mode' IS 'Optional hint for assistant behavior mode';
COMMENT ON COLUMN chat_sessions.metadata->'architectInterview' IS 'Persistent architect interview progress and answers';
COMMENT ON COLUMN chat_messages.metadata->'mode' IS 'Mode hint when this message was sent';
COMMENT ON COLUMN assistant_proposals.payload->'mechanics' IS 'Proposed mechanics updates';
COMMENT ON COLUMN assistant_proposals.payload->'lore' IS 'Proposed lore updates';
COMMENT ON COLUMN assistant_proposals.payload->'architectDocuments' IS 'Proposed architect documents to create/update';
