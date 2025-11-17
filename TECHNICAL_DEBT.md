# Technical Debt & Bug Report

**Date**: 2025-11-17
**Project**: Generative Score Lab v1.0.0
**Status**: MVP Complete

## 📊 Summary

- **Critical Bugs**: 0
- **High Priority Issues**: 8
- **Medium Priority Issues**: 12
- **Low Priority Issues**: 7
- **Total Items**: 27

---

## 🔴 HIGH PRIORITY (Must Fix Before Production)

### 1. **Native Dialogs Instead of Modal Components**
- **Location**: Multiple files
- **Issue**: Using `alert()` and `confirm()` instead of proper modal dialogs
- **Files**:
  - `src/components/scene/SceneCard.tsx:13`
  - `src/components/scene/ClipList.tsx:87`
  - `src/components/scene/TrackRow.tsx:29,93`
  - `src/components/ai/AIChat.tsx:27`
  - `src/components/ai/AISetupWizard.tsx:30,38,46,54`
  - `src/components/tutorial/TutorialOverlay.tsx:68`
- **Impact**: Poor UX, blocks UI thread, not accessible
- **Solution**: Replace with proper modal dialogs using Radix Dialog component
- **Effort**: Medium (2-3 hours)

### 2. **Console Statements in Production Code**
- **Location**: Throughout codebase (20+ instances)
- **Issue**: Console logs/errors not using centralized error handler
- **Files**:
  - `src/components/voice/VoiceCaptureDialog.tsx`
  - `src/components/scene/TrackRow.tsx`
  - `src/components/scene/SceneEditor.tsx`
  - `src/components/ai/AIChat.tsx`
  - `src/stores/project-store.ts`
  - `src/lib/ai/*-client.ts` (all 4 clients)
  - `src/lib/io/file-system.ts`
- **Impact**: Not using error notification system, inconsistent error handling
- **Solution**: Replace with `errorHandler.handle()` calls
- **Effort**: Low (1 hour)

### 3. **Type Safety Issues - 32 'any' Type Usages**
- **Location**: Multiple files
- **Issue**: Excessive use of `as any` type assertions
- **Critical instances**:
  - `src/lib/io/midi-export.ts:209` - Blob type issue
  - `src/lib/audio/engine.ts:78` - Tone.js oscillator type
  - `src/components/ai/AISetupWizard.tsx:20,22,25` - Config casting
  - `src/lib/ai/index.ts:17,19,21,23` - AI client casting
- **Impact**: Loses TypeScript safety, potential runtime errors
- **Solution**: Define proper types for all interfaces
- **Effort**: Medium (3-4 hours)

### 4. **Missing Error Recovery in Audio Engine**
- **Location**: `src/lib/audio/engine.ts`
- **Issue**: Audio initialization failures don't have retry mechanism
- **Impact**: If Tone.start() fails, audio is broken for entire session
- **Solution**: Implement retry logic with exponential backoff
- **Effort**: Low (1 hour)

### 5. **No Loading States for Async Operations**
- **Location**: Multiple components
- **Issue**: MIDI export, AI chat, file operations lack loading indicators
- **Files**:
  - `src/components/project/ExportDialog.tsx`
  - `src/components/project/MidiExportDialog.tsx`
- **Impact**: User doesn't know operation is in progress
- **Solution**: Add loading states and progress indicators
- **Effort**: Medium (2 hours)

### 6. **Bundle Size Too Large (570KB)**
- **Location**: Build output
- **Issue**: Single JS bundle is 570KB (warns > 500KB)
- **Impact**: Slow initial load time, poor mobile performance
- **Solution**: Implement code splitting for:
  - AI clients (load on demand)
  - Tutorial system (load on first use)
  - MIDI export library (load when exporting)
  - Tone.js (lazy load for audio features)
- **Effort**: High (4-6 hours)

### 7. **No Validation for AI API Responses**
- **Location**: `src/lib/ai/*-client.ts`
- **Issue**: API responses not validated before use
- **Impact**: Malformed responses could crash the app
- **Solution**: Add response validation with Zod or similar
- **Effort**: Medium (2-3 hours)

### 8. **Missing Cancel Functionality for AI Requests**
- **Location**: `src/components/ai/AIChat.tsx`
- **Issue**: No way to cancel long-running AI requests
- **Impact**: User stuck waiting, wastes API credits
- **Solution**: Implement AbortController for fetch requests
- **Effort**: Low (1 hour)

---

## 🟡 MEDIUM PRIORITY (Should Fix Soon)

### 9. **TODO: Implement Different Instrument Types**
- **Location**: `src/lib/audio/engine.ts:75`
- **Issue**: All tracks use same PolySynth, ignoring `instrumentRef`
- **Impact**: Limited sound variety
- **Solution**: Implement instrument loading based on track.instrumentRef
- **Effort**: High (6-8 hours)

### 10. **TODO: Send Errors to Reporting Service**
- **Location**: `src/components/ErrorBoundary.tsx:41`
- **Issue**: Error logging not sent to external service (Sentry)
- **Impact**: Can't track production errors
- **Solution**: Integrate Sentry or similar error tracking
- **Effort**: Low (1-2 hours with account setup)

### 11. **Project Store Too Large (424 lines)**
- **Location**: `src/stores/project-store.ts`
- **Issue**: Single store handles all project operations
- **Impact**: Hard to maintain, test, and reason about
- **Solution**: Split into:
  - `scene-store.ts`
  - `track-store.ts`
  - `clip-store.ts`
  - `project-metadata-store.ts`
- **Effort**: High (6-8 hours)

### 12. **No Undo/Redo System**
- **Location**: Project store
- **Issue**: Users can't undo mistakes
- **Impact**: Poor UX, fear of experimenting
- **Solution**: Implement command pattern or use zustand middleware
- **Effort**: High (8-10 hours)

### 13. **No Pan Control in Audio Engine**
- **Location**: `src/lib/audio/engine.ts:89`
- **Issue**: Track pan stored but not applied to audio
- **Impact**: Stereo positioning not working
- **Solution**: Apply pan to each track's output
- **Effort**: Low (30 minutes)

### 14. **Missing Input Validation**
- **Location**: Multiple forms
- **Issue**: No validation for:
  - BPM (should be 40-300)
  - Note lengths (should be positive)
  - Generator parameters (should have ranges)
- **Impact**: Users can enter invalid values causing crashes
- **Solution**: Add validation schemas with error messages
- **Effort**: Medium (2-3 hours)

### 15. **No Auto-Save Functionality**
- **Location**: Project store
- **Issue**: Users can lose work if they forget to export
- **Impact**: Data loss risk
- **Solution**: Implement auto-save to localStorage with timestamp
- **Effort**: Low (1-2 hours)

### 16. **Pitch Detection Not Used**
- **Location**: `src/lib/audio/pitch-detection.ts`
- **Issue**: PitchDetector class exists but not integrated
- **Impact**: Voice input feature incomplete
- **Solution**: Integrate with voice capture dialog or remove if not needed
- **Effort**: Medium (3-4 hours) or Low (remove: 30 min)

### 17. **No Tests for Utilities**
- **Location**: `tests/unit/`
- **Issue**: Theory utils, error handler, stores not tested
- **Impact**: Potential bugs in critical code
- **Solution**: Write tests for:
  - `src/lib/theory/scales.ts`
  - `src/lib/theory/chords.ts`
  - `src/lib/errors/error-handler.ts`
  - `src/stores/*`
- **Effort**: Medium (4-5 hours)

### 18. **Memory Leak in Audio Engine**
- **Location**: `src/lib/audio/engine.ts`
- **Issue**: Scheduled parts and instruments may not be fully disposed
- **Impact**: Memory usage grows with repeated scene loads
- **Solution**: Ensure proper cleanup in dispose() and scene switching
- **Effort**: Low (1 hour)

### 19. **No Accessibility Attributes**
- **Location**: Multiple components
- **Issue**: Missing ARIA labels, roles, and keyboard navigation
- **Impact**: Not usable by screen reader users
- **Solution**: Add proper ARIA attributes and test with screen reader
- **Effort**: Medium (3-4 hours)

### 20. **Hardcoded Magic Numbers**
- **Location**: Throughout codebase
- **Issue**: Numbers like 500ms, 120 BPM, etc. hardcoded
- **Impact**: Hard to adjust, maintain consistency
- **Solution**: Extract to constants file
- **Effort**: Low (1 hour)

---

## 🟢 LOW PRIORITY (Nice to Have)

### 21. **No Dark Mode**
- **Location**: UI styling
- **Issue**: Only light theme available
- **Impact**: Poor experience in low light
- **Solution**: Implement dark mode with theme toggle
- **Effort**: Medium (3-4 hours)

### 22. **Missing Keyboard Shortcuts for Common Actions**
- **Location**: Various components
- **Issue**: Can't use keyboard to:
  - Add tracks/clips
  - Delete items
  - Navigate scenes
- **Impact**: Slower workflow for power users
- **Solution**: Add more keyboard shortcuts
- **Effort**: Low (1-2 hours)

### 23. **No Drag and Drop**
- **Location**: Scene/track/clip lists
- **Issue**: Can't reorder items by dragging
- **Impact**: Tedious reordering workflow
- **Solution**: Implement drag and drop with react-dnd
- **Effort**: High (6-8 hours)

### 24. **Tutorial Positioning Issues**
- **Location**: `src/components/tutorial/TutorialOverlay.tsx`
- **Issue**: Tutorial cards may overflow screen on small viewports
- **Impact**: Tutorial unusable on mobile
- **Solution**: Add responsive positioning and scrolling
- **Effort**: Low (1-2 hours)

### 25. **No Collaboration Features**
- **Location**: N/A
- **Issue**: Can't share projects or collaborate in real-time
- **Impact**: Limited for team use
- **Solution**: Implement project sharing URLs or real-time sync
- **Effort**: Very High (20+ hours)

### 26. **Generator Parameters Not Persisted**
- **Location**: Generator config UI
- **Issue**: Can't save/load favorite generator settings
- **Impact**: Repetitive setup for common patterns
- **Solution**: Add preset system
- **Effort**: Medium (3-4 hours)

### 27. **No Analytics/Telemetry**
- **Location**: N/A
- **Issue**: No usage data to guide feature development
- **Impact**: Can't measure feature adoption
- **Solution**: Add privacy-respecting analytics (posthog, plausible)
- **Effort**: Low (1-2 hours with account setup)

---

## 🐛 Known Bugs

### Bug 1: Tutorial Auto-Start Loop
- **Status**: Potential issue
- **Description**: If tutorial crashes, might auto-start on every reload
- **Location**: `src/App.tsx:28-32`
- **Reproduction**: Unknown
- **Fix**: Add error boundary around tutorial with fallback to skip
- **Effort**: Low (30 minutes)

### Bug 2: MIDI Export Filename Issues
- **Status**: Minor
- **Description**: Filenames with special characters may fail on Windows
- **Location**: `src/lib/io/midi-export.ts:40,230`
- **Fix**: Sanitize filenames before download
- **Effort**: Low (30 minutes)

### Bug 3: Audio Engine Not Disposed on Unmount
- **Status**: Potential memory leak
- **Description**: AudioEngine singleton never disposed
- **Location**: `src/lib/audio/engine.ts:275-280`
- **Fix**: Add cleanup in App.tsx useEffect cleanup
- **Effort**: Low (30 minutes)

---

## 📈 Metrics

### Code Quality
- **TypeScript Strict Mode**: ✅ Enabled
- **Linting**: ✅ Configured
- **Test Coverage**: ⚠️ Partial (only generators)
- **Type Safety Score**: ⚠️ 68% (32 'any' usages)
- **Bundle Size**: ⚠️ 570KB (warning threshold: 500KB)

### Performance
- **Build Time**: ✅ ~6s
- **Test Time**: ✅ ~6s
- **Initial Load**: ⚠️ Could be improved with code splitting
- **Memory Usage**: ⚠️ Potential leak in audio engine

### Maintainability
- **Average File Size**: ✅ Reasonable (~150 lines)
- **Largest File**: ⚠️ project-store.ts (424 lines - needs splitting)
- **Circular Dependencies**: ✅ None detected
- **Dead Code**: ✅ Minimal

---

## 🎯 Recommended Priority Order

### Phase 1: Critical Fixes (Before Production)
1. Replace alert/confirm with modal dialogs (1-2 days)
2. Fix type safety issues (1 day)
3. Implement code splitting for bundle size (1-2 days)
4. Add validation for all inputs (1 day)
5. Replace console statements with error handler (4 hours)

### Phase 2: UX Improvements (Week 2)
1. Add loading states for async operations (4 hours)
2. Implement auto-save (4 hours)
3. Add undo/redo system (2 days)
4. Fix pan control in audio engine (1 hour)
5. Add more keyboard shortcuts (4 hours)

### Phase 3: Polish & Scale (Week 3-4)
1. Split project store (2 days)
2. Implement different instrument types (2 days)
3. Add comprehensive tests (2 days)
4. Implement error reporting (4 hours)
5. Add dark mode (1 day)

### Phase 4: Advanced Features (Future)
1. Drag and drop
2. Preset system
3. Collaboration features
4. Analytics integration

---

## 🔧 Quick Wins (< 1 hour each)

- Fix pan control in audio engine
- Add MIDI filename sanitization
- Add audio engine cleanup on unmount
- Extract magic numbers to constants
- Add cancel button for AI requests
- Add missing ARIA labels to buttons

---

## 📝 Notes

- **Overall Code Quality**: Good for MVP
- **Architecture**: Solid foundation, needs refactoring as it scales
- **Documentation**: Excellent README
- **Testing**: Needs expansion beyond generators
- **Security**: No major concerns, but API keys stored in localStorage (consider encryption)

**Estimated Total Technical Debt**: ~60-80 hours of work

This document should be reviewed and updated regularly as issues are resolved and new ones are discovered.
