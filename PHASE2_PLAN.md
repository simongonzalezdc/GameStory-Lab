# Phase 2 Plan: Natural Language Refinement & UX Enhancements

**Status**: Ready to start
**Start Date**: 2025-11-17
**Target Features**: Natural Language Asset Refinement, Advanced Export Modal, UX Improvements

---

## Overview

Phase 2 builds upon the solid foundation of Phase 1 by adding the highly-requested **Natural Language Editing & Refinement** feature. This leverages **Ollama for text-based AI interactions** (chat interface) while continuing to use cloud providers for image generation.

## Phase 1 ✅ Completion Summary

- ✅ Text-to-sprite generation (3 cloud providers)
- ✅ Image-to-sprite conversion with optimization
- ✅ Enhanced asset library (search, filters, favorites)
- ✅ Local storage (SQLite + file system)
- ✅ Export functionality
- ✅ Zero technical debt
- ✅ 60% test coverage

---

## Phase 2 Features

### 1. Natural Language Asset Refinement (Priority: P0)

**Description**: Chat-based interface for iteratively refining generated assets using natural language instructions.

**User Story**:
> As a game developer, I want to chat with AI to refine generated assets, so that I can quickly iterate without starting over each time.

**Key Requirements** (from Dev Docs/03-product-requirements.md):
- Chat interface appears after initial generation
- Accepts natural language instructions (not just keywords)
- Shows refinement history (original → edit 1 → edit 2, etc.)
- User can rollback to any previous version
- Refinements use img2img mode for faster results
- Each refinement saves as new version with parent reference
- Quick-action buttons: "Darker," "Lighter," "More Detail," "Less Detail," "Remove BG"

**User Flow**:
1. User generates initial asset: "fantasy potion bottle"
2. Result appears with chat interface below
3. User types: "make it glow with purple liquid"
4. AI refines existing asset, shows updated version
5. User can continue refining or save final version

**Technical Implementation**:

#### Backend Components

**A. Ollama Chat Service** - `backend/app/services/ollama_service.py`
- Use Ollama for conversational UI (text-only)
- Purpose: Parse user refinement instructions into structured prompts
- Model: `llama3.2` or similar (text model, not vision)
- Input: User's natural language instruction + asset context
- Output: Enhanced prompt for image refinement

**B. Refinement Endpoint** - `backend/app/api/generate.py:120`
- Already exists! Just needs frontend integration
- POST `/api/generate/refine`
- Accepts: `RefineRequest` with asset_id and instruction
- Process:
  1. Load original asset from storage
  2. Use Ollama to understand refinement instruction
  3. Enhance original prompt with refinement
  4. Call cloud AI provider (img2img if supported, or full generation)
  5. Save as new version with parent_asset_id reference

**C. Asset Versioning** - Database schema enhancement
- Add `parent_asset_id` field to assets table (already in schema!)
- Add `version_number` field to track refinement iterations
- Add `refinement_instruction` field to store user's chat message
- Query: Get full refinement history by following parent chain

#### Frontend Components

**A. ChatInterface Component** - `frontend/src/components/ChatInterface.tsx` (NEW)
```typescript
interface ChatInterfaceProps {
  assetId: string;
  onRefinementComplete: (newAsset: Asset) => void;
}
```
- Chat UI below the asset preview
- Text input for natural language instructions
- Quick-action buttons (pre-defined refinements)
- Shows refinement history as chat messages
- Loading state during refinement

**B. AssetVersionHistory Component** - `frontend/src/components/AssetVersionHistory.tsx` (NEW)
```typescript
interface AssetVersionHistoryProps {
  assetId: string;
  onVersionSelect: (asset: Asset) => void;
}
```
- Horizontal timeline of asset versions
- Thumbnail previews of each version
- Click to view/select previous version
- Shows refinement instruction for each version

**C. Updated AssetLibrary** - `frontend/src/components/AssetLibrary.tsx` (MODIFY)
- Add "Refine" button on asset hover
- Open refinement modal with ChatInterface
- Show version count badge on assets with refinements

#### API Methods

**New API Client Methods** - `frontend/src/services/api.ts`
```typescript
async refineAsset(request: RefineRequest): Promise<GenerationResponse>
async getAssetVersions(assetId: string): Promise<Asset[]>
```

### 2. Advanced Export Modal (Priority: P1)

**Description**: Enhanced export UI with preview, options, and better UX.

**Key Features**:
- Modal dialog instead of instant download
- Preview of sprite sheet layout before export
- Export format options:
  - Individual PNGs (ZIP)
  - Sprite sheet with JSON
  - Sprite sheet with XML (Phaser)
- Resolution multiplier selector (1x, 2x, 4x)
- Target engine selector (Generic, Unity, Godot, Unreal, Phaser)
- Sheet size selector (512x512, 1024x1024, 2048x2048, Auto)
- Progress indicator during export generation

**Files**:
- `frontend/src/components/ExportModal.tsx` (NEW)
- Update `frontend/src/components/AssetLibrary.tsx`

### 3. Ollama Health Check & Setup (Priority: P0)

**Description**: Ensure Ollama is properly configured and available for chat.

**Components**:
- Health check endpoint already exists: `GET /api/health/ollama`
- Frontend notification if Ollama is not available
- Graceful degradation: Allow using without Ollama (maybe use cloud AI for chat?)
- Setup instructions in UI for first-time users

**Files**:
- `frontend/src/components/OllamaSetup.tsx` (NEW)
- Update health check to verify text model is available

### 4. UX Enhancements (Priority: P1)

**A. Asset Detail View**
- Click asset to open detail modal (not just toggle selection)
- Large preview
- Full metadata display
- Refinement history
- Quick actions: Download, Delete, Refine, Duplicate

**B. Loading States**
- Skeleton loaders instead of spinners
- Progressive image loading
- Better feedback during generation

**C. Error Handling**
- User-friendly error messages
- Retry buttons
- Suggestions for common errors

**Files**:
- `frontend/src/components/AssetDetailModal.tsx` (NEW)
- Update existing components with better loading/error states

---

## Database Schema Changes

### Assets Table Updates

```sql
-- Add new columns for versioning and refinement
ALTER TABLE assets ADD COLUMN parent_asset_id TEXT REFERENCES assets(id);
ALTER TABLE assets ADD COLUMN version_number INTEGER DEFAULT 1;
ALTER TABLE assets ADD COLUMN refinement_instruction TEXT;
CREATE INDEX idx_assets_parent ON assets(parent_asset_id);
```

**Migration**: Auto-apply on backend startup via database service

---

## Implementation Order

### Week 1: Ollama Integration & Backend
1. **Day 1-2**: Ollama service integration
   - Create `ollama_service.py`
   - Implement chat-based prompt enhancement
   - Test with various refinement instructions
   - Health check integration

2. **Day 3-4**: Asset versioning
   - Database migration for new columns
   - Update `DatabaseService` with versioning queries
   - Test parent-child asset relationships

3. **Day 5**: Refine endpoint enhancement
   - Update existing `/refine` endpoint
   - Integrate Ollama service
   - Test end-to-end refinement flow

### Week 2: Frontend Chat & Refinement UI
1. **Day 1-2**: ChatInterface component
   - Build chat UI
   - Integrate with refine API
   - Quick-action buttons
   - Loading states

2. **Day 3**: AssetVersionHistory component
   - Version timeline UI
   - Thumbnail grid
   - Version selection

3. **Day 4-5**: Integration & testing
   - Update AssetLibrary with refine button
   - Connect all components
   - End-to-end testing

### Week 3: Export Modal & UX Polish
1. **Day 1-2**: ExportModal component
   - Modal UI with preview
   - All export options
   - Integration with export API

2. **Day 3**: Asset Detail Modal
   - Large preview modal
   - Metadata display
   - Quick actions

3. **Day 4-5**: UX enhancements
   - Loading skeletons
   - Error improvements
   - Final polish & testing

---

## Success Criteria

### Must Have (Phase 2 Complete)
- ✅ Users can refine assets using natural language chat
- ✅ Ollama integration working for text-based chat
- ✅ Asset version history visible and navigable
- ✅ Quick-action refinement buttons functional
- ✅ Export modal with preview and options
- ✅ All cloud providers still work for image generation

### Nice to Have
- Asset detail modal with full metadata
- Skeleton loaders throughout
- Better error messages

### Out of Scope (Phase 3+)
- 3D model generation
- Animation sequences
- Custom style training
- Team collaboration

---

## Technical Architecture

```
User Input (Chat)
       ↓
ChatInterface.tsx
       ↓
API: POST /api/generate/refine
       ↓
OllamaService (text AI)
- Parse user instruction
- Enhance prompt context
       ↓
AIService (cloud image AI)
- img2img refinement (if supported)
- OR full generation with enhanced prompt
       ↓
ImageService
- Post-processing
- Optimization
       ↓
StorageService
- Save as new version
- Link to parent asset
       ↓
AssetVersionHistory.tsx
- Display version timeline
```

---

## Testing Strategy

### Backend Tests
- `test_ollama_service.py` - Chat prompt enhancement
- `test_refine_endpoint.py` - Full refinement flow
- `test_asset_versioning.py` - Database relationships

### Frontend Tests
- Manual testing of chat interface
- Version navigation testing
- Export modal functionality

### Integration Tests
- Full refinement workflow (generate → chat → refine → view history)
- Ollama availability handling
- Error scenarios

**Target Coverage**: Maintain 60% (same as Phase 1)

---

## Dependencies

### New Backend Dependencies
```python
# Already have langchain-ollama==0.3.0
# No new dependencies needed!
```

### New Frontend Dependencies
```json
{
  "react-markdown": "^9.0.0",  // For chat message formatting (optional)
}
```

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Ollama not installed by user | HIGH | MEDIUM | Graceful degradation: use cloud AI for chat, show setup instructions |
| img2img not supported by all providers | MEDIUM | HIGH | Fall back to full generation with enhanced prompt |
| Version history grows too large | LOW | LOW | Limit to 10 versions per asset, oldest auto-pruned |
| Chat prompts don't improve quality | MEDIUM | LOW | Extensive testing with various instructions, fallback to simple append |

---

## Documentation Updates

### README.md
- Add Ollama setup for chat feature
- Update feature list with refinement capability
- New screenshots showing chat interface

### API Documentation
- Document `/refine` endpoint fully
- Add versioning query parameters
- Chat service integration guide

---

## Phase 2 Complete Definition

Phase 2 is complete when:
1. ✅ User can click "Refine" on any generated asset
2. ✅ Chat interface appears with text input
3. ✅ User can type natural language instructions
4. ✅ Ollama processes instruction and enhances prompt
5. ✅ Cloud AI provider generates refined image
6. ✅ New version saved and displayed
7. ✅ Version history visible with rollback capability
8. ✅ Quick-action buttons work (Darker, Lighter, etc.)
9. ✅ Export modal has preview and options
10. ✅ All Phase 1 features still work perfectly
11. ✅ Documentation updated
12. ✅ No new technical debt introduced

---

**Ready to start Phase 2 implementation!** 🚀
