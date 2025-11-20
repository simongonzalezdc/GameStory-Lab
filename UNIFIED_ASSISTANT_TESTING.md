# Unified Assistant Implementation - Testing Guide

## Overview
This document provides testing procedures to verify that the unified assistant implementation works correctly across all features and pages.

## Test Environment Setup

### Prerequisites
1. Backend server running with database access
2. Frontend development server running
3. Database migrations applied (including the unified assistant migration)

### Database Setup
Ensure the database migration has been applied:
```bash
cd packages/backend
npx prisma migrate dev --name unified-assistant
```

## Test Cases

### 1. Unified Session Management

#### Test Case 1.1: Single Session Per Project
**Objective**: Verify that only one session exists per project after migration

**Steps**:
1. Create or use an existing project with multiple old sessions (concept/architect)
2. Open browser console and check network requests
3. Start a new assistant session for the project
4. Verify that only one session with `type='project'` exists in the database

**Expected Result**:
- Only one chat session per project with `type='project'`
- No duplicate sessions with different types
- Session includes `metadata.mode` field

**Database Query**:
```sql
SELECT project_id, type, COUNT(*) as session_count 
FROM chat_sessions 
GROUP BY project_id, type 
ORDER BY project_id, type;
```

#### Test Case 1.2: Session Continuity Across Pages
**Objective**: Verify that the same session ID is reused when navigating between pages

**Steps**:
1. Open a project and start an assistant conversation
2. Note the session ID from browser console
3. Navigate to different pages (Concept Editor, Architect, Templates, etc.)
4. Check that the same session ID is used across all pages
5. Send a message from each page and verify conversation continuity

**Expected Result**:
- Same session ID persists across page navigation
- Message history is shared between pages
- No new sessions created when switching pages

### 2. Mode Switching

#### Test Case 2.1: Mode Switcher Functionality
**Objective**: Verify that the mode switcher in the assistant panel works correctly

**Steps**:
1. Open assistant panel on any page
2. Use the mode switcher dropdown to change modes (Auto, Concept, Architect)
3. Verify that the mode change is reflected in the UI
4. Send messages in different modes and verify appropriate responses
5. Check that mode is persisted in the database

**Expected Result**:
- Mode switcher updates the session metadata
- AI responses adapt to the selected mode
- Mode persists when switching between pages

#### Test Case 2.2: Mode-Specific Behavior
**Objective**: Verify that different modes provide appropriate functionality

**Steps**:
1. **Concept Mode**:
   - Ask about game mechanics and lore
   - Verify responses focus on concept refinement
   - Check that proposals include mechanics/lore changes

2. **Architect Mode**:
   - Ask about project documentation
   - Verify interview flow is triggered
   - Check that proposals include architect documents

3. **Auto Mode**:
   - Ask general questions about the project
   - Verify balanced responses covering both aspects

**Expected Result**:
- Each mode provides appropriate guidance
- Interview flow works in architect mode
- Proposals include relevant content for each mode

### 3. Interview Persistence

#### Test Case 3.1: Interview State Persistence
**Objective**: Verify that architect interview progress is saved and restored

**Steps**:
1. Start architect mode conversation
2. Answer several interview questions
3. Note the completion percentage
4. Refresh the page or navigate to another page
5. Return to the assistant panel
6. Verify that interview progress is restored

**Expected Result**:
- Interview progress is saved in session metadata
- Progress is restored after page refresh
- No interview state is lost during navigation

#### Test Case 3.2: Interview Completion and Documentation
**Objective**: Verify that completed interviews generate documentation proposals

**Steps**:
1. Complete an architect interview by answering all questions
2. Verify that documentation generation is triggered
3. Check that a proposal is created with architect documents
4. Accept the proposal and verify documentation is created

**Expected Result**:
- Interview completion triggers documentation generation
- Proposal includes complete architect documents
- Accepted proposals create/update documentation files

### 4. Cross-Page Availability

#### Test Case 4.1: Assistant Panel on All Pages
**Objective**: Verify that the assistant panel is available on all required pages

**Pages to Test**:
- Projects List Page
- Concept Editor Page
- Project Architect Page
- Template Browser Page
- Tutorial Page
- Health Page

**Steps**:
1. Navigate to each page listed above
2. Verify that the assistant panel toggle/button is visible
3. Open the assistant panel and verify it loads correctly
4. Test basic conversation functionality on each page

**Expected Result**:
- Assistant panel is available on all required pages
- Panel loads and functions correctly on each page
- No errors in browser console

#### Test Case 4.2: Panel Visibility Preferences
**Objective**: Verify that assistant panel visibility preferences are persisted

**Steps**:
1. Open assistant panel on any page
2. Close the panel using the close button
3. Navigate to a different page
4. Verify that the panel remains closed
5. Reopen the panel and navigate to another page
6. Verify that the panel remains open

**Expected Result**:
- Panel visibility preference is stored in localStorage
- Preference persists across page navigation
- No session-specific data is lost

### 5. Proposal Handling

#### Test Case 5.1: Mixed Content Proposals
**Objective**: Verify that proposals can contain both mechanics/lore and architect documents

**Steps**:
1. Start a conversation in auto or concept mode
2. Ask for comprehensive improvements
3. Verify that the AI can propose both mechanics/lore changes AND documentation updates
4. Accept a mixed proposal and verify all changes are applied

**Expected Result**:
- Proposals can contain multiple types of content
- All content types in a proposal are applied when accepted
- No conflicts between different content types

#### Test Case 5.2: Proposal Acceptance Across Pages
**Objective**: Verify that proposals work correctly when accepted from any page

**Steps**:
1. Start a conversation on Projects page
2. Navigate to Concept Editor page
3. Accept a proposal from the Concept Editor
4. Verify that changes are applied correctly
5. Repeat with other page combinations

**Expected Result**:
- Proposals can be accepted from any page
- Changes are applied regardless of the page they're accepted from
- Related components are refreshed after acceptance

### 6. Performance and Reliability

#### Test Case 6.1: Long Conversation Handling
**Objective**: Verify that the system handles long conversations without performance issues

**Steps**:
1. Start a conversation and exchange 20+ messages
2. Verify that message loading remains responsive
3. Check browser memory usage
4. Test proposal generation with long conversation context

**Expected Result**:
- Performance remains stable with long conversations
- Memory usage stays within reasonable limits
- Proposal generation works with full conversation context

#### Test Case 6.2: Error Handling
**Objective**: Verify graceful error handling and recovery

**Steps**:
1. Disconnect internet during conversation
2. Restore connection and verify recovery
3. Test with invalid session IDs
4. Test with malformed API responses

**Expected Result**:
- Errors are handled gracefully
- User is informed of issues appropriately
- System recovers gracefully when possible

## Database Migration Testing

### Pre-Migration State
If testing migration from existing separate sessions:

1. **Backup Data**: Ensure existing sessions are backed up
2. **Identify Duplicates**: Find projects with multiple session types
3. **Record Session Counts**: Document pre-migration session distribution

### Migration Verification
```sql
-- Check that all sessions are now 'project' type
SELECT type, COUNT(*) as count FROM chat_sessions GROUP BY type;

-- Verify metadata structure
SELECT id, project_id, type, metadata FROM chat_sessions 
WHERE metadata IS NOT NULL AND jsonb_typeof(metadata) = 'object';

-- Check for interview data
SELECT id, project_id, type 
FROM chat_sessions 
WHERE metadata ? 'architectInterview';
```

## Automated Test Scripts

### Backend API Tests
```javascript
// Test unified session creation
const testUnifiedSession = async () => {
  const response = await fetch('/api/assistant/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      projectId: 'test-project-id',
      type: 'project', // Should always be 'project'
      mode: 'concept'
    })
  });
  
  const data = await response.json();
  console.assert(data.session.type === 'project', 'Session should be type project');
  console.assert(data.session.metadata.mode === 'concept', 'Mode should be set');
};

// Test mode switching
const testModeSwitch = async (sessionId) => {
  const response = await fetch(`/api/assistant/session/${sessionId}/mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'architect' })
  });
  
  const data = await response.json();
  console.assert(data.session.metadata.mode === 'architect', 'Mode should be updated');
};
```

### Frontend Component Tests
```javascript
// Test mode switcher
const testModeSwitcher = () => {
  const select = document.querySelector('[data-testid="mode-switcher"]');
  select.value = 'architect';
  select.dispatchEvent(new Event('change'));
  
  // Verify state update
  console.assert(currentMode === 'architect', 'Mode should be updated');
};

// Test session persistence
const testSessionPersistence = () => {
  // Start session
  startSession('project-123', 'concept');
  
  // Change page
  window.location.href = '/templates';
  
  // Verify same session is used
  console.assert(sessionId === 'same-id', 'Session should persist');
};
```

## Troubleshooting

### Common Issues

1. **Migration Errors**
   - Check Prisma migration logs
   - Verify database permissions
   - Rollback and re-run if needed

2. **Session Not Persisting**
   - Check localStorage settings
   - Verify API responses include session data
   - Check for JavaScript errors

3. **Mode Switching Not Working**
   - Verify backend supports mode endpoints
   - Check network requests in browser dev tools
   - Verify session metadata is being updated

4. **Interview State Lost**
   - Check architectInterview in metadata
   - Verify interview data structure
   - Check database constraints

### Debug Commands

```bash
# Check database sessions
psql -d your_database -c "SELECT * FROM chat_sessions ORDER BY created_at DESC LIMIT 10;"

# Check migration status
cd packages/backend && npx prisma migrate status

# View assistant logs
cd packages/backend && npm run dev | grep -i assistant
```

## Success Criteria

The unified assistant implementation is considered successful when:

1. ✅ Only one session exists per project (type='project')
2. ✅ Session continuity works across all pages
3. ✅ Mode switcher functions correctly
4. ✅ Interview progress persists across page refreshes
5. ✅ Mixed content proposals work correctly
6. ✅ Assistant panel is available on all required pages
7. ✅ No regression in existing functionality
8. ✅ Performance remains acceptable
9. ✅ Error handling is graceful

## Rollback Plan

If issues are encountered:

1. **Database Rollback**:
   ```bash
   npx prisma migrate reset --name unified-assistant
   ```

2. **Code Rollback**:
   - Revert changes to assistant service
   - Revert changes to routes
   - Revert changes to frontend components

3. **Data Recovery**:
   - Restore from pre-migration backups
   - Recreate separate concept/architect sessions if needed

This comprehensive testing approach ensures that the unified assistant implementation meets all requirements and provides a seamless user experience across the entire application.
