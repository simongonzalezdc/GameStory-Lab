# AI Assistant Improvements – Detailed Implementation Guide

The goal is to expand the AI assistant’s ability to manipulate musical parameters (tempo, harmony, dynamics, instrumentation, clip content) while guaranteeing it cannot touch UI or non-musical code. Follow these steps in order. Do not skip or reorder them.

---

## 1. Harden Guardrails (Prompt + Parser)

1. Open `src/lib/ai/prompt-builder.ts`.
2. After the “CRITICAL GUARDRAILS” section, insert bullet points that explicitly forbid UI/code changes, API/key management, or non-musical operations. Ensure wording matches the team decision (music-only).
3. In the “Available actions” list, enumerate every action you support (after implementing later steps). For now include: `updateScene`, `changeKey`, `updateTrack`, `setTrackInstrument`, `updateTrackEffects`, `updateClip`, `addClip`, `replaceClipGenerator`, `setClipNotes`, `addTrack`.
4. For each action add parameter tables with exact types, ranges, defaults, and validation notes. Example:  
   - `volume: number (0.0–1.0, default 0.8, clamp required)`  
   - `customNotes: Array<{ pitch: 0–127, time: ≥0, duration: >0, velocity: 0–1 }>`  
5. Under “Examples,” provide at least one example for every action to demonstrate exact JSON format (with `<actions>[…]</actions>`). Include one multi-action example showing combined updates.
6. Open `src/lib/ai/intent-parser.ts`. Ensure `parseActions` trims whitespace and tolerates both single-object and array payloads. Add unit tests under `tests/unit/ai/intent-parser.test.ts` for the following cases: well-formed array, single object, malformed JSON (expect []).

## 2. Expand MusicAction Schema

1. Edit `src/types/ai.ts`. Extend `MusicAction['type']` union to include:
   - `setTrackInstrument`
   - `updateTrackEffects`
   - `addClip`
   - `replaceClipGenerator`
   - `setClipNotes`
2. For each new type, document required params using TypeScript interfaces (exported) so they can be reused by validators (e.g., `export interface SetClipNotesParams { notes: PianoRollNote[]; lengthBars?: number; }`).
3. Update all switch statements or exhaustive checks referencing `MusicAction` (search for `action.type`) to handle the new cases (currently only `applyMusicActions`).

## 3. Implement Action Handlers (applyMusicActions)

1. Open `src/lib/ai/ai-service.ts`.
2. Add helper functions at the top for:
   - `clampVelocity`, `clampNoteDuration`, `sanitizeNoteList`.
   - `validateInstrumentRef(trackRole: TrackRole, instrumentRef: string)`.
   - `resolveClip(sceneId, trackId, clipIdOrRole)` – reuses existing role resolution but also accepts `clip:<index>` patterns.
3. Extend the main `switch (action.type)` with new cases:
   - `setTrackInstrument`: verifies the target track exists, checks instrument reference via helper, then calls `projectStore.updateTrack(..., { instrumentRef })` and schedules the audio engine update via `getAudioEngine().loadInstrument` if accessible (or relies on existing watchers).
   - `updateTrackEffects`: expects `params.effects` describing an `EffectChain`. Merge with track’s existing `effects` using immutable patterns. Validate effect types and clamp numeric params.
   - `addClip`: validates `lengthBars` (1–128), generator payload, optional `customNotes`. Calls `projectStore.addClip(sceneId, trackId, clipData)`.
   - `replaceClipGenerator`: ensures clip exists, updates `clip.generator` and optional params.
   - `setClipNotes`: sanitizes provided notes, ensures they fit within clip length (extend clip if `lengthBars` provided), and updates `clip.customNotes`.
4. After each action, increment `success`. If validation fails, throw descriptive errors so `errors[]` collects actionable messages for users.
5. Before returning, add a pass to reschedule audio only once if any clip/track mutations occurred. Track a boolean `audioNeedsReschedule`; after loop call `getAudioEngine().rescheduleScene()` if true and audio is initialized.
6. Update tests: add/extend integration tests under `tests/unit/ai/ai-service.test.ts` to cover each new action (happy path + invalid input).

## 4. Enrich Prompt Context

1. In `src/components/ai/AIChat.tsx`, when building `projectSnapshot`, include:
   - Full `project.scenes` array serialized with: `id, name, bpm, key, scale, tracks` filtered to essential musical fields (role, volume, instrumentRef, effect summary, clip generators, clip customNotes length).
   - Do not include UI metadata.
2. Pass this richer snapshot to `sendAIMessage`.
3. In `prompt-builder.ts`, update `contextInfo` to summarize:
   - Every scene with counts (tracks, clips).
   - For the current scene: highlight each track’s instrument, effects, clip generator type, custom-note count.
4. Keep the snapshot concise (< ~2k characters) to avoid exceeding context limits; truncate track/clip lists per scene if necessary (e.g., limit to 6 tracks, 4 clips per track, mention “…+N more”).

## 5. Generator & Effect Reference Data

1. Create `src/lib/ai/music-knowledge.ts` exporting arrays for:
   - `GENERATOR_DEFINITIONS` (type, description, param constraints).
   - `EFFECT_DEFINITIONS`.
2. Import this data into `prompt-builder.ts` and append a “Reference” block so the AI knows valid param ranges.
3. Reuse the same definitions inside `applyMusicActions` for validation (importing avoids duplicated constants).

## 6. Validation & Telemetry

1. In `applyMusicActions`, wrap each `projectStore` mutation in `try/catch`; on error push human-friendly messages into `errors[]`. Include the action index to aid debugging.
2. Emit `console.info` logs only in development mode (`import.meta.env.MODE === 'development'` already checked).
3. Instrument a lightweight telemetry hook (optional) by calling `errorHandler.handle` with `ErrorSeverity.INFO` for successful batches and `WARNING` for partial failures.

## 7. Testing & Verification

1. Add/extend unit tests for:
   - Prompt builder (snapshot test or key substring assertions) ensuring guardrails + action descriptions exist.
   - Intent parser (already mentioned).
   - AI service action handling (new cases).
2. Run `npm run test` and `npm run type-check`. CI should fail if any instructions were missed.
3. Manually configure the AI assistant with a mock provider (e.g., Local/Ollama) and run scripted prompts covering all new actions to confirm JSON is parsed and mutations occur (no UI changes allowed).

## 8. Documentation & Handoff

1. Update `README.md` (AI assistant section) summarizing capabilities, supported actions, and safety guarantees.
2. Mention the new `ai assistant improvements.md` file in `README` or `Dev Docs/` so future contributors know where to find detailed instructions.
3. During code review, verify:
   - No UI/state files outside the audio/music domain were touched.
   - All new actions include validation + tests.

Following these steps exactly will give the AI assistant comprehensive control over musical parameters without risking non-musical code paths.

---

## 9. Visualizing AI-Applied Musical Changes

Create a deterministic audit trail so users can see what the assistant modified without giving the AI access to UI code. This requires a dedicated log + read-only UI panel.

### 9.1 Instrumentation Layer
1. Add a new store `src/stores/ai-change-log.ts` exporting `useAIChangeLog()` with:
   - State: `entries: Array<{ id: string; timestamp: string; description: string; details: MusicAction; before?: any; after?: any }>`
   - Actions: `recordChange(entry)`, `clear()`.
2. Inside `applyMusicActions` (Section 3), after each successful mutation:
   - Capture shallow snapshots **before** mutating (e.g., track object, clip metadata) for comparison.
   - After mutation completes, call `useAIChangeLog.getState().recordChange({ ... })` with a human-readable description (`"Set Lead track volume to 0.45"`).
   - Ensure the store import is behind a feature flag or lazy-loaded to avoid circular dependencies.
3. Include action batch metadata (sceneId, trackId, clipId) so the UI can anchor highlights to specific rows.

### 9.2 Scene Editor Highlight Hooks
1. Expose a derived selector (e.g., `getLatestChangesForScene(sceneId)`) inside the change log store.
2. In `src/components/scene/SceneEditor.tsx`, subscribe to this selector. When entries exist for the current scene, set local state `{ trackHighlights: Record<trackId, 'added' | 'updated'>, clipHighlights: Record<clipId, 'added' | 'updated'> }`.
3. Pass highlight props down to `TrackList` → `TrackRow` → `ClipList`:
   - Example: `<TrackRow highlight={trackHighlights[track.id]} ... />`
   - `<ClipList clipHighlights={clipHighlights} ... />`
4. In `TrackRow` and `ClipList`, conditionally add CSS classes (e.g., `ring-2 ring-blue-400 animate-pulse`) for 5 seconds using `useEffect` timers to auto-clear.
5. These highlights are purely visual; they do not allow the AI to manipulate UI—they respond to logged changes only.

### 9.3 Change Log Panel
1. Create `src/components/ai/AIMusicChangeLog.tsx`:
   - Uses `useAIChangeLog()` to list entries with timestamp, description, and “View Diff” buttons.
   - Diff modal shows before/after JSON for the affected musical object (format using `JSON.stringify` with indentation, truncated for large structures).
2. Mount this component inside the AI chat sidebar (below messages) or as a collapsible drawer in `SceneEditor`. The component is read-only; it does not expose controls that the AI could use.
3. Provide filters (“Current Scene”, “Last 15 min”) for usability.

### 9.4 Persistence & Testing
1. Persist the change log using `zustand/middleware/persist` (limit to last 50 entries) so users can review after reloads.
2. Add unit tests for the store (ensure entries append, purge works, selectors return correct highlights).
3. Add Cypress/Playwright smoke test (if e2e exists) verifying:
   - When mocked actions are applied, highlights appear.
   - Change log displays human-readable text.

### 9.5 Accessibility & UX
1. Highlights must maintain WCAG contrast; use Tailwind classes `ring-offset-2 ring-offset-white`.
2. The log panel should support keyboard navigation. Use semantic `<ul>`/`<li>` and provide `aria-live="polite"` to announce new entries.
3. Include “Clear Log” and “Export JSON” buttons for auditing; both call store actions only (no AI involvement).

Implementing this section ensures every AI-driven musical adjustment produces an immediate, visual trace in the editor without granting the AI any UI-modification capability.

---

## 10. Mandatory Change Summaries from the AI Assistant

To keep users fully informed, every AI response must end with an audit-friendly summary listing which musical changes succeeded and which were skipped or failed.

### 10.1 Prompt Enforcement
1. In `src/lib/ai/prompt-builder.ts`, add a dedicated subsection under the examples:
   - Title: “Response Checklist”
   - Bullets:
     - “After describing intent, add a `Changes` list in plain text.”
     - “Each entry must be formatted as `- ✅ <description>` for successes and `- ⚠️ <description>` for skipped/failed items.”
     - “If no actions were taken, say `Changes:\n- ⚠️ No changes applied`.”
2. Update one of the sample responses to demonstrate the new format.

### 10.2 Runtime Summary Builder
1. Modify `src/components/ai/AIChat.tsx` inside `handleSend`:
   - After calling `applyMusicActions`, build a summary string from `result.success`, `result.failed`, and `result.errors`.
   - Format:
     ```
     const summaryLines = [];
     result.appliedActions.forEach(desc => summaryLines.push(`- ✅ ${desc}`));
     result.failedActions.forEach(err => summaryLines.push(`- ⚠️ ${err}`));
     const summary = summaryLines.length ? `\nChanges:\n${summaryLines.join('\n')}` : '\nChanges:\n- ⚠️ No changes applied.';
     ```
   - Append this `summary` to the assistant message you add to the chat (regardless of whether the AI included its own summary).
2. To support this, adjust `applyMusicActions` to return `{ success, failed, errors, appliedDescriptions: string[], failedDescriptions: string[] }`. Populate `appliedDescriptions` with human-readable text each time an action succeeds (reuse the same description you log in the change log store).

### 10.3 Failed Action Details
1. When an action fails validation, push messages like `Clip c-123: density must be between 0 and 1` into `failedDescriptions`.
2. Ensure `errors[]` still contains full technical errors for logging, but the user-facing text should be concise.

### 10.4 Tests
1. Extend `tests/unit/ai/ai-service.test.ts` to assert that `applyMusicActions` returns the new arrays with correct content.
2. Add a component test (React Testing Library) for `AIChat` verifying that after a mocked response with two actions (one success, one failure), the rendered assistant message ends with the expected `Changes` list.

With this addition, users always see an explicit checklist of what the AI did or could not do, eliminating ambiguity in the workflow.
