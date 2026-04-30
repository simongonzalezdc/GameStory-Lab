# AI Game Asset Generator - Product Requirements

**Purpose:** Defines WHAT to build  
**Generated:** November 17, 2025

---

## Project Overview

### Vision
Empower game developers of all skill levels to create professional-quality 2D and 2.5D isometric game assets through intuitive AI-powered tools, eliminating the time and expertise barriers of traditional asset creation.

### Problem Statement
Game developers face a critical bottleneck in asset creation. Professional artists are expensive, learning pixel art or 3D modeling takes years, and generic asset packs lack uniqueness. Current AI tools focus on general image generation but don't understand game-specific needs like sprite sheets, transparent backgrounds, consistent styles, or engine-compatible export formats.

**Current state:** Developers manually create assets in Photoshop/Aseprite (slow), commission freelance artists (expensive), or buy generic asset packs (non-unique), then manually organize and export in proper formats.

**Desired state:** Developers describe what they need in plain English, instantly receive game-ready assets with transparent backgrounds, automatically organized in a searchable library, and export in formats optimized for Unity/Godot/Unreal with one click.

### Target Users

**Primary:**
- **Indie game developers** (solo/small teams): Need fast, affordable asset creation for prototyping and full games
- **Game design students**: Learning game development without art skills
- **Hobbyist game makers**: Creating games for fun with limited time/budget

**Secondary:**
- **Small game studios**: Rapid prototyping before investing in custom art
- **Game jam participants**: Need assets quickly for 48-72 hour competitions
- **Content creators**: Making tutorial games or demos for YouTube/courses

### Success Metrics
- **Activation:** 80% of new users generate at least 1 asset within first session
- **Retention:** 40% weekly active users return 3+ times in first month
- **Generation quality:** 70% of generated assets used in actual games (survey)
- **Export adoption:** 60% of users export at least one sprite sheet
- **Time savings:** Users report 10x faster asset creation vs. manual methods

---

## Core Features (MVP)

### Feature 1: Text-to-Sprite Generation

**Priority:** CRITICAL

**User Story:**
> As an indie game developer, I want to describe the asset I need in plain English, so that I can get a game-ready sprite without artistic skills or expensive software.

**Description:** 
Users enter a natural language prompt (e.g., "pixel art fantasy sword with blue gems, 32x32, transparent background") and select an AI model (OpenRouter, Google Gemini, ChatGPT). The system generates a PNG sprite with transparent background, auto-detects style tags, and saves to user's library with metadata.

**Acceptance Criteria:**
- [ ] Input field accepts 10-2000 character prompts
- [ ] Model selector dropdown with 3 options: OpenRouter (FLUX), Google (Gemini), ChatGPT (DALL-E 3)
- [ ] Generated sprite has transparent background by default
- [ ] User can specify dimensions (16x16 to 2048x2048, defaults to 64x64)
- [ ] Generation completes in < 10 seconds
- [ ] Asset appears in library immediately after generation
- [ ] System extracts style tags automatically (e.g., "pixel-art", "fantasy", "weapon")
- [ ] Error handling for failed generations with clear messages

**User Flow:**
1. User clicks "Generate New Asset" button
2. Modal opens with prompt input, model selector, dimension inputs
3. User types: "8-bit retro spaceship, side view, blue and silver"
4. User selects model: "OpenRouter (FLUX)" 
5. User sets dimensions: 64x64
6. User clicks "Generate"
7. Loading spinner shows with estimated time
8. Asset appears in preview with download button
9. Asset automatically saved to library
10. User can refine with additional prompts or start new generation

**Business Rules:**
- Free tier: 50 generations/month
- Paid tier: Unlimited generations
- Max concurrent generations: 3 per user
- Failed generations don't count toward quota

**Data Needed:**
- User authentication (Supabase)
- Prompt text
- Selected model
- Dimensions (width, height)
- Generated image binary
- Metadata (tags, project name, generation timestamp)

**Edge Cases:**
- Empty prompt → Show validation error
- Inappropriate content → Use built-in AI safety filters, show generic "content policy violation" error
- API rate limit exceeded → Queue request or show friendly "try again in X minutes" message
- Network failure during generation → Allow retry with same prompt
- Duplicate assets → Allow duplicates but suggest similar existing assets

---

### Feature 2: Image-to-Sprite Conversion

**Priority:** CRITICAL

**User Story:**
> As a game developer, I want to upload a reference image and have AI generate variations, so that I can maintain consistent art style across my game.

**Description:**
Users upload an existing image (sketch, photo, or asset from another source) and optionally add text instructions. The AI analyzes the style and generates a game-ready sprite matching that aesthetic, or creates variations with requested modifications.

**Acceptance Criteria:**
- [ ] Drag-and-drop upload zone accepts PNG, JPEG (max 10MB)
- [ ] Image preview shows before generation
- [ ] Optional text field for instructions: "make it darker," "turn into pixel art"
- [ ] Generated asset matches uploaded image's style and proportions
- [ ] Maintains transparent background if source has transparency
- [ ] Works with all 3 AI models (each handles img2img differently)
- [ ] Shows side-by-side comparison of source vs generated

**User Flow:**
1. User clicks "Upload Reference Image" button
2. File picker opens or user drags image into dropzone
3. Uploaded image displays with thumbnail
4. User adds optional instruction: "convert to pixel art style"
5. User selects model and dimensions
6. User clicks "Generate from Image"
7. AI analyzes reference image and generates styled version
8. Side-by-side comparison shows source → result
9. User can refine further or save to library

**Business Rules:**
- Image uploads count toward generation quota
- Source images stored temporarily (24 hours) unless user saves them
- Source attribution optional but recommended

**Data Needed:**
- Uploaded image file (binary)
- Optional text instruction
- Selected model
- Target dimensions

**Edge Cases:**
- Non-image file uploaded → Show "invalid file type" error
- Corrupted image file → Show "unable to process image" error
- Image > 10MB → Show "file too large, please resize" error
- Reference image NSFW → Apply same content filters as text generation

---

### Feature 3: Natural Language Editing & Refinement

**Priority:** HIGH

**User Story:**
> As a game developer, I want to chat with AI to refine generated assets, so that I can quickly iterate without starting over each time.

**Description:**
After generating an asset, users can enter conversational refinement instructions like "make it darker," "add more detail," "remove the background texture." The AI applies incremental edits to the existing asset, maintaining context and building on previous iterations.

**Acceptance Criteria:**
- [ ] Chat interface appears after initial generation
- [ ] Accepts natural language instructions (not just keywords)
- [ ] Shows refinement history (original → edit 1 → edit 2, etc.)
- [ ] User can rollback to any previous version
- [ ] Refinements use img2img mode for faster results
- [ ] Each refinement saves as new version with parent reference
- [ ] Common suggestions appear as quick-action buttons: "Darker," "Lighter," "More Detail," "Less Detail," "Remove BG"

**User Flow:**
1. User generates initial asset: "fantasy potion bottle"
2. Result appears with chat interface below
3. User types: "make it glow with purple liquid"
4. AI refines existing asset, shows updated version
5. User continues: "add bubbles"
6. AI refines again
7. User happy with result → clicks "Save Final Version"
8. All versions saved with lineage tracking

**Business Rules:**
- Refinements count as separate generations in quota
- Max 10 refinements per session (prevent infinite loops)
- Original + all versions saved for 7 days unless favorited

**Data Needed:**
- Parent asset ID
- Refinement instruction text
- Version number (1, 2, 3...)
- Previous prompt context

**Edge Cases:**
- Ambiguous instruction ("make it better") → Ask clarifying question
- Conflicting instructions → Prioritize most recent
- Refinement makes asset worse → Easy rollback to any version

---

### Feature 4: Local Model Support (Ollama Integration)

**Priority:** HIGH

**User Story:**
> As a privacy-conscious game developer, I want to run AI models locally on my machine, so that I can generate assets without sending data to cloud APIs, avoid ongoing costs, and work offline.

**Description:**
Users can connect their local Ollama installation and use locally-running AI models (LLaMA 3.2 Vision, LLaVA, etc.) for asset generation. All processing happens on the user's machine with complete privacy. No API costs, unlimited generations, and works offline after model download. Especially valuable for indie developers on tight budgets and studios with data privacy requirements.

**Acceptance Criteria:**
- [ ] Backend detects Ollama installation at `http://localhost:11434`
- [ ] Model selector shows "Local (Ollama)" option when Ollama is available
- [ ] Dropdown shows available local models (fetched from Ollama)
- [ ] User can select specific Ollama model (e.g., "llama3.2-vision:11b")
- [ ] Generation works identically to cloud models but processes locally
- [ ] Clear indicator shows "Running Locally" during generation
- [ ] Error handling for Ollama not installed/not running
- [ ] Setup documentation for Ollama installation (macOS, Windows, Linux)
- [ ] Performance warning for slower hardware (requires GPU recommended)
- [ ] Local generations don't count toward cloud API quotas

**User Flow:**
1. User installs Ollama following provided instructions
2. User downloads model: `ollama pull llama3.2-vision:11b`
3. User starts Ollama server: `ollama serve`
4. User opens asset generator web app
5. Model selector shows "Local (Ollama)" with green dot (available)
6. User selects "Local (Ollama)" → dropdown shows installed models
7. User chooses "llama3.2-vision:11b"
8. User enters prompt: "pixel art treasure chest"
9. Generation processes on local machine (may take 30-60 seconds)
10. Asset appears with "Generated Locally" badge
11. Asset saved to library normally

**Business Rules:**
- Local generation requires Ollama installed and running
- No internet required after model download (fully offline)
- Local generations are free (no quota limits)
- User responsible for local hardware requirements
- Recommended: GPU with 8GB+ VRAM for good performance
- Backend gracefully falls back to cloud if Ollama unavailable

**Data Needed:**
- Ollama installation status (detected via health check)
- Available local models list (from Ollama API)
- Selected model name
- Standard generation parameters (prompt, dimensions, etc.)

**Edge Cases:**
- Ollama not installed → Show setup instructions with download link
- Ollama installed but not running → Show "Start Ollama" button with command
- Model not downloaded → Show "Download Model" instructions
- Slow hardware (CPU-only) → Show performance warning, suggest cloud alternative
- Ollama server unreachable → Auto-fallback to cloud models with notification
- Model runs out of memory → Show error with hardware upgrade suggestion

---

### Feature 5: Smart Asset Library & Organization

**Priority:** HIGH

**User Story:**
> As a game developer, I want my assets automatically organized and searchable, so that I can quickly find what I need when building my game.

**Description:**
All generated assets automatically saved to a visual library with smart organization. System extracts tags from prompts (e.g., "weapon", "character", "background"), allows project grouping, and provides powerful search/filter. Users can favorite, delete, and bulk manage assets.

**Acceptance Criteria:**
- [ ] Grid view shows asset thumbnails with key info (name, dimensions, date)
- [ ] List view shows detailed metadata in table format
- [ ] Filters: by project, by style tags, by dimensions, by date range
- [ ] Search: full-text search across prompts and tags
- [ ] Project dropdown: group assets by game/project
- [ ] Favorite star icon on each asset
- [ ] Bulk actions: select multiple → delete, export, tag
- [ ] Pagination: 50 assets per page
- [ ] Sort options: newest, oldest, most used, favorites

**User Flow:**
1. User opens "My Assets" page
2. Grid displays all generated assets with thumbnails
3. User clicks filter icon → selects "pixel-art" tag
4. Library filters to show only pixel art assets
5. User types "sword" in search box
6. Results narrow to pixel art swords
7. User clicks asset → opens detail modal
8. Modal shows: full-size preview, all metadata, edit buttons, export options

**Business Rules:**
- Assets stored indefinitely (unless user deletes)
- Deleted assets moved to trash (recoverable for 30 days)
- Max 1000 assets per free user, unlimited for paid

**Data Needed:**
- All asset metadata from database
- Thumbnail URLs (auto-generated smaller versions)
- User's project list
- Available style tags (aggregated from all user assets)

**Edge Cases:**
- No assets yet → Show welcome message with "Generate Your First Asset" CTA
- Search returns no results → Suggest removing filters or show similar assets
- Very large library (1000+ assets) → Implement virtual scrolling for performance

---

### Feature 6: Game-Ready Export & Format Conversion

**Priority:** CRITICAL

**User Story:**
> As a game developer, I want to export assets in formats optimized for my game engine, so that I can directly import them without manual processing.

**Description:**
Users select one or multiple assets and export them in various formats: single PNGs, sprite sheets (texture atlas), or engine-specific packages with metadata files. System auto-generates JSON/XML descriptors for sprite coordinates, handles multi-resolution exports (1x, 2x, 4x), and trims transparency padding.

**Acceptance Criteria:**
- [ ] Export modal allows selecting multiple assets
- [ ] Format options:
  - Single PNG (individual files in ZIP)
  - Sprite Sheet (JSON descriptor) - TexturePacker format
  - Texture Atlas (XML descriptor) - Cocos2d format
  - Unity Sprite Sheet (built-in import)
  - Godot Sprite Sheet (AtlasTexture format)
  - Generic Sprite Sheet (custom JSON schema)
- [ ] Resolution multiplier: 1x, 2x, 3x, 4x (generates @2x, @4x versions)
- [ ] Trim transparency toggle (removes empty space around sprites)
- [ ] Padding control: 0-16px spacing between sprites
- [ ] Sheet size selector: 512x512, 1024x1024, 2048x2048, or auto-fit
- [ ] Preview shows how assets will be packed before export
- [ ] Download as ZIP file with images + descriptor files

**User Flow:**
1. User selects 10 assets from library (using checkboxes)
2. User clicks "Export Selected" button
3. Export modal opens
4. User chooses format: "Unity Sprite Sheet"
5. User selects resolution: 2x
6. User enables "Trim Transparency"
7. Preview shows sprite sheet layout
8. User clicks "Generate Export"
9. System packs sprites, generates JSON metadata
10. ZIP file downloads: "my_assets.zip" containing sprite_sheet.png + sprite_sheet.json

**Business Rules:**
- Exports don't count toward generation quota
- Free tier: Max 50 assets per export
- Paid tier: Unlimited assets per export
- Exported ZIPs deleted from server after 24 hours

**Data Needed:**
- Selected asset IDs
- Export format preference
- Resolution multiplier
- Trim/padding settings
- Sheet dimensions

**Edge Cases:**
- Assets too large for selected sheet size → Show error with recommendations
- Mixed aspect ratios → Allow but show warning about inefficient packing
- No assets selected → Disable export button
- Export generation takes long time (100+ assets) → Show progress bar

---

## User Workflows

### Workflow 1: First-Time User Generates Asset

**Trigger:** New user signs up and lands on homepage

**Steps:**
1. User: Views homepage with "Generate Your First Asset" CTA → System: Shows prominent button and quick tutorial tooltip
2. User: Clicks "Generate New Asset" → System: Opens generation modal with example prompts
3. User: Types prompt "pixel art treasure chest" → System: Shows character count and AI model dropdown
4. User: Clicks "Generate" → System: Sends request to backend, shows loading animation with estimated time
5. User: Waits 5-8 seconds → System: Displays generated sprite with transparent background
6. User: Sees asset in preview → System: Shows "Save to Library" and "Refine" buttons
7. User: Clicks "Save to Library" → System: Redirects to library page showing first asset
8. Success: User has generated and saved their first game asset

**Error Paths:**
- If generation fails (API error), show "Generation failed, please try again" with retry button
- If user enters empty prompt, show inline validation error
- If user exceeds free tier quota, show upgrade modal

---

### Workflow 2: Experienced User Exports Sprite Sheet

**Trigger:** User has 20+ assets and wants to import them into Unity

**Steps:**
1. User: Opens library page → System: Displays grid of 50 most recent assets
2. User: Clicks "Select Multiple" button → System: Enables checkbox mode on all assets
3. User: Checks 15 assets → System: Shows floating action bar with "Export Selected (15)" button
4. User: Clicks "Export Selected" → System: Opens export modal with format options
5. User: Selects "Unity Sprite Sheet" and "2x resolution" → System: Updates preview showing approximate sprite sheet layout
6. User: Clicks "Generate Export" → System: Processes images, creates sprite sheet + JSON
7. User: Waits 10 seconds → System: Downloads ZIP file "my_unity_assets.zip"
8. Success: User imports ZIP into Unity project and all sprites load correctly

**Error Paths:**
- If assets won't fit in selected sheet size, show error: "Assets too large for 512x512 sheet. Try 1024x1024 or reduce selection."
- If export processing fails, show retry button and save selected assets for easy re-attempt

---

### Workflow 3: Iterative Asset Refinement

**Trigger:** User generates asset but wants to tweak it

**Steps:**
1. User: Generates "fantasy forest background" → System: Shows initial result
2. User: Types in chat: "add more trees" → System: Refines asset, shows version 2
3. User: Types: "make it darker, nighttime" → System: Refines again, shows version 3
4. User: Sees version 3 is too dark → System: Shows version history thumbnails below
5. User: Clicks version 2 thumbnail → System: Loads version 2 as active
6. User: Types: "add fireflies" → System: Refines from version 2, creates version 4
7. User: Happy with result → System: Shows "Save Final Version" button
8. Success: Version 4 saved to library with full lineage tracked

**Error Paths:**
- If refinement instruction is ambiguous, AI responds in chat: "I'm not sure what you mean. Could you clarify?"
- If refinement makes asset worse, user easily rolls back to any previous version

---

## Non-Functional Requirements

**Performance:**
- Page load time: < 2 seconds (Lighthouse score > 90)
- Asset generation: < 10 seconds (depends on AI provider)
- Library page with 100 assets: < 3 seconds load
- Export generation (50 assets): < 30 seconds

**Security:**
- All API endpoints require authentication (Supabase JWT)
- File uploads validated for type and size
- User assets isolated (no cross-user access)
- API keys stored in environment variables, never exposed to client
- Rate limiting: 100 API calls/hour per user

**Scalability:**
- Support 1000 concurrent users initially
- Horizontal scaling via serverless functions (Vercel, Railway)
- Asset storage via Supabase (scales automatically)
- CDN for fast asset delivery (Supabase CDN)

**Accessibility:**
- WCAG 2.1 AA compliance
- Keyboard navigation for all features
- Screen reader support for asset descriptions
- High contrast mode support
- Alt text for all generated assets

**Browser Support:**
- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile: iOS Safari, Chrome Android

---

## Business Rules

### Generation Quotas
**When:** User attempts to generate asset  
**Then:** Check user's plan and monthly usage  
**Why:** Prevent abuse and manage AI API costs

**Logic:**
- Free tier: 50 generations/month, resets on signup anniversary
- Paid tier ($19/mo): Unlimited generations
- Count only successful generations (failures don't count)
- Display remaining quota in UI header

### Asset Storage Limits
**When:** User reaches storage limit  
**Then:** Show upgrade prompt or suggest deleting old assets  
**Why:** Control storage costs

**Logic:**
- Free tier: 1000 assets max, 5GB total storage
- Paid tier: Unlimited assets, 100GB storage
- Deleted assets go to trash (30-day recovery)
- Trash assets don't count toward limits

### Content Moderation
**When:** User enters prompt or uploads image  
**Then:** Run through AI safety filters  
**Why:** Prevent inappropriate content generation

**Logic:**
- Use AI provider's built-in safety (OpenAI Moderation API)
- Block NSFW, violent, or harmful content requests
- Show generic error: "This content violates our policy"
- Don't store flagged prompts

---

## Integrations

### OpenRouter API
**Purpose:** Primary AI image generation provider (FLUX models)  
**Type:** REST API  
**Data:** Text prompts → Generated images (PNG binary)

### Google Gemini API  
**Purpose:** Alternative AI provider for variety  
**Type:** REST API  
**Data:** Text prompts + images → Generated images

### ChatGPT (DALL-E 3)
**Purpose:** High-quality photorealistic generation  
**Type:** REST API  
**Data:** Text prompts → Generated images

### Ollama (Local)
**Purpose:** Privacy-focused local AI model runtime  
**Type:** Local HTTP API (localhost:11434)  
**Data:** Text prompts + images → Generated images (all local)  
**Models:** LLaMA 3.2 Vision, LLaVA, Stable Diffusion, custom models

### MiniMax M2 (Optional)
**Purpose:** Additional model for users with API keys  
**Type:** REST API  
**Data:** Text prompts → Generated images

### GLM 4.6 (Optional)
**Purpose:** Additional model for users with API keys  
**Type:** REST API  
**Data:** Text prompts → Generated images

### Supabase
**Purpose:** Authentication, database, file storage  
**Type:** SDK  
**Data:** User auth, asset metadata, file storage

---

## Scope

**In Scope (MVP):**
- Text-to-sprite generation (2D, isometric)
- Image-to-sprite conversion
- Natural language refinement (chat interface)
- Local model support (Ollama integration)
- Asset library with search, filter, projects
- Export as PNG, sprite sheets, texture atlases
- Unity, Godot, Generic formats
- Multi-resolution exports (1x, 2x, 4x)
- Transparent backgrounds by default
- Style tag auto-detection
- Cloud + local AI model support (4 cloud providers + Ollama)

**Future Phases:**
- 3D model generation (Phase 2, Q1 2026)
- Animation generation (sprite sequences) (Phase 2, Q1 2026)
- Custom AI model training (user's art style) (Phase 3, Q2 2026)
- Team collaboration features (Phase 3, Q2 2026)
- API for programmatic access (Phase 3, Q2 2026)
- Asset marketplace (buy/sell) (Phase 4, Q3 2026)

**Out of Scope:**
- Video generation (different product)
- Audio/music generation (different product)
- Full game engine (not our focus)
- Desktop application (web-only for MVP)
- Offline mode (requires internet for AI)

---

## Open Questions

1. **Which AI model should be default for first-time users?** - Decision by Week 1
   - Options: OpenRouter (fastest), Google (best quality), ChatGPT (most popular)
   - Recommendation: OpenRouter (FLUX) - good balance of speed and quality

2. **Should we allow users to bring their own API keys?** - Decision by Week 2
   - Pro: Reduces our API costs, power users prefer this
   - Con: Adds complexity to setup, fewer casual users will do it
   - Recommendation: Start without, add in Phase 2 as "Advanced Mode"

3. **Free tier: 50 generations/month sufficient?** - Decision by Week 3
   - Need to validate with user testing
   - Recommendation: Start at 50, adjust based on usage data

4. **Should we support GIF animations in MVP?** - Decision by Week 4
   - Pro: Requested by game jam users
   - Con: Adds complexity to export logic
   - Recommendation: Phase 2 feature after sprite sheets work well

5. **How should Ollama local generation affect freemium quotas?** - Decision by Week 2
   - Options: (A) Local generations are completely free/unlimited, (B) Local generations count toward quota to prevent abuse
   - Recommendation: Option A - local is truly unlimited since no API costs. This becomes a strong upgrade incentive for cloud users.
   - Trade-off: May reduce paid conversions if users satisfied with local-only

---

**Last Updated:** November 17, 2025
