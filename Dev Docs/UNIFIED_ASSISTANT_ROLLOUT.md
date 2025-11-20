# Unified Assistant Implementation Plan

Author: Codex  
Audience: coding agents shipping the unified assistant across backend + frontend.  
Goal: One assistant identity/thread per project, available on every screen, with persistent interview state and blended skills (concept refinement + architect docs). No ambiguous or conflicting steps.

## Non-Negotiable Outcomes
- A single chat session per project (`chat_sessions.type = 'project'`) reused everywhere; no parallel concept/architect sessions.
- Assistant panel can be opened from every page (Projects list, Concept Editor, Architect, Templates, Tutorial, Health) via shared component entry; user can hide/show but history is shared.
- Proposals may simultaneously contain mechanics, lore, and architect documents; acceptance applies all present artifacts.
- Architect interview state persisted in the database; never lost on restart.
- System prompt composition is mode-aware but lives in one conversation; switching modes never spawns a new session.

## Data Model & Persistence
1) **Chat Sessions**
   - Migrate to a single session per project keyed by `type = 'project'`.
   - Add `metadata.mode?: 'concept' | 'architect' | 'auto'` (optional hint) but do not create separate sessions.
2) **Interview State**
   - Add persistent storage: either a new table `architect_interviews` (project_id, session_id, answers json, progress fields, created_at, updated_at) or store under `chat_sessions.metadata.architectInterview`.
   - Update `AssistantService.interviewSessions` Map usage to read/write the persisted store; no in-memory-only state.
3) **Proposal Payload**
   - Ensure `assistant_proposals.payload` accepts `mechanics`, `lore`, and `architectDocuments` together. `proposalType` can remain `concept-update` when mechanics/lore exist; otherwise `architect-document`.

## Backend Tasks (Assistant Service)
1) **Session Retrieval**
   - `getOrCreateSession(projectId, type)` should always return the latest `type='project'` session; ignore incoming type except to set `metadata.mode`.
   - Backfill/migrate existing `concept`/`architect` sessions by selecting the most recent per project and reusing it.
2) **Prompt Composition**
   - Replace `buildSystemPrompt(type, context)` with a composer that:
     - Always includes base assistant rules (JSON reply shape, proposal requirements).
     - Adds refinement guidance when validation issues or mechanics/lore present.
     - Adds architect interview/doc guidance when interview is incomplete or docs exist.
     - Uses `metadata.mode` as a weighting hint, not a session splitter.
3) **Context Builder**
   - Always attach: project info, latest version (mechanics/lore), validation issues (top 10), architect docs snippets (if exist), interview progress (from persisted state).
4) **Interview Flow**
   - On message send, load/create persisted interview session id; store answers/progress persistently.
   - When interview completes, generate docs and include `architectDocuments` in proposals as today, but tied to the unified session.
5) **Proposal Application**
   - Accept payloads containing any combination of mechanics/lore/architectDocuments; apply all applicable updates in one request.
   - Return error only if *all* payload sections are empty.
6) **APIs**
   - Keep existing routes; they now operate on the unified session id.
   - Add optional `mode` in `POST /api/assistant/session` body to set `metadata.mode`.
   - `GET /api/assistant/session/:id/messages` remains; message history is shared.

## Frontend Tasks
1) **Shared Panel Availability**
   - Mount `ProjectAssistantPanel` on every page: `ProjectsPage`, `ConceptEditorPage`, `ProjectArchitectPage`, `TemplateBrowserPage`, `TutorialPage`, `HealthPage`.
   - Provide a consistent toggle (e.g., header button or floating dock) to show/hide the panel; default to remember last state in local storage.
2) **Session Handling**
   - Panel always requests `type: 'project'` and passes optional `mode` hint (`concept` when on Concept Editor, `architect` when on Architect, etc.).
   - Do not create new sessions when switching pages; reuse the session id returned from the backend.
3) **Mode Switcher**
   - Inside `ProjectAssistantPanel`, add a chip/tab to select focus: `Auto`, `Refine Concept`, `Architect Docs`. Setting this only updates `metadata.mode` on the server (via session update or message metadata), not the session id.
4) **Presence in UI**
   - For pages without existing assistant area, add a collapsible side drawer/dock anchored to the right; ensure responsive behavior on mobile (overlay with close).
   - Keep proposal rail accessible; proposals are shared regardless of entry page.
5) **Error/Empty States**
   - If session fetch fails, show retry; never spawn duplicate sessions.

## Migration Plan (No Ambiguity)
1) Add persistence for interview state (schema + service).
2) Update assistant service to unified session + prompt composer + merged mode.
3) Adjust routes to accept `mode` hint and to always return unified session.
4) Update frontend API calls to request `type='project'` and pass page-derived `mode`.
5) Mount assistant panel on all pages with toggle/dock.
6) QA: Verify conversation continuity across pages; verify proposals apply mechanics/lore/docs together; verify interview progress survives server restart.

## Acceptance Criteria
- Starting a chat on any page yields the same session id for that project.
- Switching between Concept Editor and Architect retains history and proposals; no duplicate sessions created.
- Interview progress persists after backend restart.
- Proposals with mixed mechanics/lore/docs apply all changes in one acceptance.
- Assistant panel can be opened from every screen and remembers visibility preference.

