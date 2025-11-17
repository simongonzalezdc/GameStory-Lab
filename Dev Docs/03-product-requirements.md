# GameForge Studio - Product Requirements

**Purpose:** Defines WHAT to build  
**Generated:** November 17, 2025

---

## Project Overview

### Vision
Transform game concept development from chaotic ideation into a structured, AI-guided process that ensures mechanical and narrative coherence from the start.

### Problem Statement
**Current state:** Indie game developers waste months building games based on incoherent concepts. They start with "cool ideas" but discover fundamental conflicts between mechanics and lore during development. For example, a stealth game protagonist written as a bumbling comic relief character, or an RPG's progression system that contradicts the story's urgency. These mismatches force expensive redesigns or result in disjointed games.

**Desired state:** Developers validate game concept coherence *before* coding. They receive AI-guided feedback that catches lore-mechanics conflicts early, iterate rapidly on concept refinement, and export professional documentation ready for development.

### Target Users

**Primary:** 
- **Solo indie developers** (1-person studios) lacking design experience
- **Hobbyist game developers** creating games in spare time
- **Game design students** learning industry best practices

**Secondary:**
- **Small indie teams** (2-5 people) wanting centralized concept documentation
- **Game jam participants** needing rapid concept iteration
- **Writers/designers** prototyping game ideas before pitching to studios

### Success Metrics
- **Time to coherent concept:** <2 hours (vs 2-3 days manual)
- **Consistency score:** >0.85 (on 0-1 scale) for exported concepts
- **User retention:** 60% return to tool for 2nd project within 30 days
- **Export rate:** 70% of concepts are exported (indicates completion)
- **Cost per generation:** <$0.10 (using Ollama fallback strategy)

---

## Core Features (MVP)

### Feature 1: Flexible Workflow Engine

**Priority:** CRITICAL

**User Story:**
> As an indie developer, I want to start with either mechanics OR lore (whatever inspires me first), so that I can work with my natural creative process instead of being forced into a rigid sequence.

**Description:** 
The tool adapts to the user's starting point. If they start with mechanics (e.g., "I want a card-based combat system"), the AI generates complementary lore. If they start with lore (e.g., "I want a cyberpunk noir detective story"), the AI suggests mechanics that support that narrative. The tool always maintains coherence between both sides.

**Acceptance Criteria:**
- [ ] User can click "Start with Mechanics" or "Start with Lore" on new project page
- [ ] "Start with Mechanics" prompts for core gameplay loop, player actions, win conditions
- [ ] "Start with Lore" prompts for setting, protagonist, conflict, themes
- [ ] After initial generation, user can freely switch between mechanics and lore editing
- [ ] AI auto-generates missing half based on completed half (mechanics → lore or vice versa)
- [ ] UI clearly indicates which section was user-created vs AI-generated
- [ ] User can regenerate either half while preserving the other

**User Flow:**
1. User creates new project, names it "Void Runner"
2. User clicks "Start with Lore"
3. User enters: "A rogue AI pilot navigating derelict spaceships to recover lost data"
4. AI generates lore: setting (abandoned space stations), protagonist (ex-military pilot with AI implant), conflict (corporations hunting the data)
5. User clicks "Generate Mechanics"
6. AI generates mechanics: resource management (fuel, oxygen), stealth mechanics (avoid security), data extraction puzzles
7. User reviews both, sees consistency panel shows 0.92 score (excellent)

**Business Rules:**
- Neither mechanics nor lore can remain empty after initial generation
- Switching generation mode does NOT overwrite existing content (only generates missing pieces)
- Maximum 3 free generations per hour (rate limit), unlimited with Ollama

**Data Needed:**
- `concept.mechanics` JSONB (nullable initially)
- `concept.lore` JSONB (nullable initially)
- `concept.metadata.startedWith` enum ('mechanics' | 'lore')

**Edge Cases:**
- User starts with mechanics, then deletes mechanics → Treat as "start with lore"
- User provides vague input ("make a fun game") → AI returns clarifying questions
- Both mechanics and lore exist but user wants to regenerate from scratch → Show confirmation dialog

---

### Feature 2: Genre Selection & Templates

**Priority:** HIGH

**User Story:**
> As a game design student unfamiliar with genre conventions, I want pre-built genre templates, so that I can start with industry-standard mechanics and customize from there.

**Description:**
Users select from 5 genre templates (RPG, FPS, Strategy, Puzzle, Survival) that provide starter mechanics and lore patterns. Templates are customizable placeholders, not rigid constraints. For example, RPG template includes progression systems, equipment, quests—but users can modify or remove any element.

**Acceptance Criteria:**
- [ ] Genre selector shows 5 cards: RPG, FPS, Strategy, Puzzle, Survival
- [ ] Each card displays core mechanics preview (e.g., "RPG: Leveling, Equipment, Quests")
- [ ] Clicking genre populates mechanics/lore with template content
- [ ] All template fields are editable (user can remove/modify)
- [ ] User can switch genres after selection (shows "this will replace current content" warning)
- [ ] Option to start "Blank" (no template)

**User Flow:**
1. User creates project, clicks "Use Template"
2. User selects "RPG"
3. Tool populates mechanics: class system, XP/leveling, turn-based combat, equipment slots
4. Tool populates lore: fantasy medieval setting, chosen hero protagonist, ancient evil conflict
5. User modifies: changes "medieval fantasy" to "cyberpunk", keeps leveling system
6. Tool re-generates lore to match cyberpunk + kept mechanics

**Business Rules:**
- Templates are *starting points*, not locked blueprints
- Genre selection is metadata only (does not restrict mechanics)
- Users can blend genres (e.g., RPG + FPS = action-RPG like Borderlands)

**Data Needed:**
- `project.genre` VARCHAR(100) nullable
- `templates/` directory with JSON files per genre

**Edge Cases:**
- User selects genre, starts editing, then switches genre → Confirm overwrite dialog
- User wants hybrid genre → Select primary genre, then manually blend in secondary
- Template conflicts with user's custom mechanics → Validation engine flags (not blocking)

---

### Feature 3: AI Model Orchestration

**Priority:** CRITICAL

**User Story:**
> As a cost-conscious developer, I want the tool to automatically select the best AI model for each task, so that I get optimal results without overspending on API calls.

**Description:**
Behind the scenes, the tool routes each generation task to the optimal AI model based on Nov 2025 benchmarks. Mechanics generation uses DeepSeek V3 (structured output), lore creation uses Qwen3-32B (depth), consistency checking uses Gemini 2.5 Flash (speed + reasoning). Users can override to force specific models or Ollama.

**Acceptance Criteria:**
- [ ] "Auto" model selection (default) routes tasks to optimal model
- [ ] User can view "Model Selection" in settings to see which model handles what
- [ ] User can override with: OpenRouter (any model), Ollama (local), Specific Model (power users)
- [ ] Cost estimate shown before generation: "~$0.08 (OpenRouter)" or "Free (Ollama)"
- [ ] If OpenRouter API fails, automatic fallback to Ollama with user notification
- [ ] Usage dashboard shows: total cost, tokens used, model breakdown

**User Flow:**
1. User clicks "Generate Mechanics"
2. Tool checks: model preference = "Auto"
3. Tool selects: DeepSeek V3 (best for structured mechanics)
4. Shows: "Generating with DeepSeek V3 (~$0.05)..."
5. Generation completes, stores metadata: model used, tokens, cost
6. User views usage: "5 generations today, $0.23 spent"

**Business Rules:**
- Ollama is *always* free (local), no rate limits
- OpenRouter respects global spending cap ($5/hour default)
- If user exceeds spending cap, force fallback to Ollama
- Model preferences are per-project (user can set favorite model per project)

**Data Needed:**
- `ai_generations` table (tracks all API calls)
- `projects.settings.modelPreference` enum ('auto' | 'openrouter' | 'ollama' | specific model)
- `ai_generations.cost_usd` DECIMAL

**Edge Cases:**
- OpenRouter down → Fallback to Ollama immediately
- Ollama not installed → Show setup instructions, disable Ollama option
- User selects "Ollama" but model not pulled → Auto-pull or show pull command
- Multiple OpenRouter errors → Temporary disable OpenRouter for 10 minutes

---

### Feature 4: Iterative Refinement System

**Priority:** HIGH

**User Story:**
> As a game developer, I want to refine my concept through multiple AI-guided iterations, so that I can evolve my idea from rough draft to polished concept.

**Description:**
Users run multiple refinement passes on their concept. Each iteration:
- Asks AI to improve a specific aspect (mechanics depth, lore richness, genre fit)
- Tracks changes between versions
- Allows rollback to previous versions
- Shows "improvement score" indicating progress

**Acceptance Criteria:**
- [ ] "Refine Concept" button opens refinement dialog
- [ ] User selects focus: "Deepen Mechanics", "Enrich Lore", "Improve Consistency", "Enhance Genre Fit"
- [ ] Tool generates refined version, shows side-by-side comparison
- [ ] User can "Accept", "Reject", or "Merge" changes
- [ ] Version history shows all iterations with timestamps
- [ ] User can click version to preview or restore
- [ ] Maximum 10 versions stored per project (oldest auto-deleted)

**User Flow:**
1. User has basic concept with 0.78 consistency score
2. User clicks "Refine Concept" → "Improve Consistency"
3. Tool identifies 3 conflicts, generates fixes
4. Shows comparison: Original (left) vs Refined (right)
5. User reviews changes, clicks "Accept"
6. New concept version created, consistency score improves to 0.89
7. User iterates 2 more times, reaches 0.94 score

**Business Rules:**
- Each refinement is a new concept version (immutable history)
- Refinement focuses on *one aspect* per iteration (not "improve everything")
- If consistency score is already >0.90, suggest user move to export phase
- Refinement uses cheaper models (Ollama preferred) since iterations are frequent

**Data Needed:**
- `concepts.version` INTEGER
- `concepts.refined_from` UUID (parent concept ID)
- `concept_comparisons` table (stores diffs between versions)

**Edge Cases:**
- User refines same aspect 3+ times without improvement → Warn "diminishing returns, try different focus"
- User rejects all refinements → Keep original, don't create new version
- Database has 10 versions, user creates 11th → Delete oldest (version 1)

---

### Feature 5: Consistency Validation Engine

**Priority:** CRITICAL

**User Story:**
> As a first-time game designer, I want real-time feedback on lore-mechanics conflicts, so that I catch incoherent design decisions before they derail my project.

**Description:**
As users edit mechanics or lore, the validation engine continuously checks 30+ rules for consistency. Conflicts are highlighted inline with confidence scores and actionable suggestions. Users can dismiss false positives or accept AI-recommended fixes.

**Acceptance Criteria:**
- [ ] Validation runs automatically 500ms after user stops typing (debounced)
- [ ] Issues displayed in right sidebar panel, grouped by severity: Error (red), Warning (yellow), Info (blue)
- [ ] Each issue shows: Rule name, confidence score, description, suggestion
- [ ] Clicking issue highlights conflicting sections in editor
- [ ] User can "Dismiss" (false positive), "Apply Suggestion" (auto-fix), or "Ignore"
- [ ] Overall consistency score (0-1) displayed prominently
- [ ] Score color-coded: <0.60 red, 0.60-0.79 yellow, 0.80-0.89 green, 0.90+ dark green

**User Flow:**
1. User writes mechanics: "Player has telekinesis to move objects"
2. User writes lore: "Protagonist is a normal human with no special powers"
3. Validation detects conflict within 500ms
4. Error appears: "Mechanics require telekinesis but lore describes normal human (Confidence: 0.95)"
5. Suggestion: "Add telekinesis to protagonist abilities OR remove telekinesis mechanic"
6. User clicks "Add to protagonist abilities"
7. Tool updates lore: "Protagonist is a human with latent telekinetic powers"
8. Error clears, consistency score increases 0.72 → 0.84

**Business Rules:**
- Errors block export (must fix or dismiss)
- Warnings don't block (advisory only)
- Dismissed issues remain dismissed until concept changes
- Confidence <0.70 = Info, 0.70-0.89 = Warning, 0.90+ = Error

**Data Needed:**
- `validation_results` table
- `validation_results.dismissed` BOOLEAN
- `concepts.consistency_score` DECIMAL(3,2)

**Edge Cases:**
- User dismisses error, but then edits related section → Re-trigger validation (issue might be valid now)
- Validation takes >5 seconds → Show "Validation in progress..." spinner
- All rules pass → Show "Excellent consistency! Ready to export"

---

### Feature 6: Game Title Generator

**Priority:** MEDIUM

**User Story:**
> As a developer struggling to name my game, I want AI-generated title suggestions based on my concept, so that I can find a memorable, genre-appropriate name.

**Description:**
Based on the concept's theme, genre, and key mechanics, the AI generates 10 title suggestions. Titles follow genre conventions (e.g., dark fantasy = single-word dramatic names, sci-fi = compound nouns). User can regenerate or manually enter title.

**Acceptance Criteria:**
- [ ] "Generate Title" button next to project name field
- [ ] Tool analyzes concept, generates 10 titles in ~5 seconds
- [ ] Each title shows with brief rationale (e.g., "Shadowbound - evokes dark fantasy + binding magic theme")
- [ ] User can click title to select, or click "More Titles" for 10 new suggestions
- [ ] User can manually enter custom title (overrides AI)
- [ ] Titles are saved in generation history (user can revisit past suggestions)

**User Flow:**
1. User creates concept: cyberpunk detective noir + hacking mechanics
2. User clicks "Generate Title"
3. Tool returns: "NetRunner's Gambit", "Cipher Protocol", "Neon Shadows", "Digital Divide", etc.
4. User likes "Cipher Protocol", clicks to select
5. Project title updates to "Cipher Protocol"
6. User can regenerate later if they change their mind

**Business Rules:**
- Title generation uses cheaper models (GPT-OSS 120B, Ollama)
- Max 20 title generations per project (reasonable limit)
- Titles avoid trademark conflicts (basic check against common game names)
- Title must be 1-5 words, <50 characters

**Data Needed:**
- `projects.title` VARCHAR(500)
- `ai_generations.task_type = 'title'`

**Edge Cases:**
- User concept is too vague → Generate generic titles, note "Titles will improve as concept develops"
- All 10 titles are bad → User can regenerate or skip
- User manually enters offensive title → No content filter (user's project), but warn if exporting for public use

---

### Feature 7: Markdown Export

**Priority:** HIGH

**User Story:**
> As a developer ready to start coding, I want to export my concept as a professional markdown document, so that I can hand it to my team or use it as my GDD foundation.

**Description:**
Users export finalized concepts to markdown using one of 3 templates:
1. **Game Design Document (GDD):** Comprehensive format with sections for mechanics, lore, art direction, technical requirements
2. **Pitch Deck:** Condensed 2-page format for pitching to publishers/investors
3. **Technical Specification:** Developer-focused format emphasizing mechanics, systems, and implementation notes

**Acceptance Criteria:**
- [ ] "Export" button available once consistency score >0.75
- [ ] User selects template: GDD, Pitch, or Technical
- [ ] Tool generates markdown with filled sections
- [ ] User can preview markdown in rendered view before downloading
- [ ] Download button creates `.md` file: `{project-name}-{template}.md`
- [ ] Export includes: title, genre, mechanics, lore, consistency score, generation metadata
- [ ] Exported file is ready for GitHub, Notion, or conversion to PDF

**User Flow:**
1. User finishes concept, consistency score is 0.91
2. User clicks "Export" → "Game Design Document"
3. Tool renders GDD preview with all sections filled
4. User reviews, clicks "Download"
5. File downloads: `void-runner-gdd.md`
6. User opens in Obsidian, sees professional formatting ready to extend

**Business Rules:**
- Export requires consistency score >0.75 (warns if below)
- User can export unlimited times (iterations encouraged)
- Export includes watermark: "Generated with GameForge Studio"
- Templates are customizable (power users can edit template files)

**Data Needed:**
- `exports` table (track export history)
- `templates/` directory with `.md` template files
- `exports.template_used` VARCHAR(50)

**Edge Cases:**
- User exports with consistency <0.75 → Show warning: "Concept has unresolved conflicts. Export anyway?"
- User has incomplete sections (e.g., missing lore) → Template fills with "TBD" placeholders
- Export fails → Retry or download as raw JSON (fallback)

---

## User Workflows

### Workflow 1: Create Concept from Scratch (Mechanics First)

**Trigger:** User clicks "New Project"

**Steps:**
1. User: Names project "Stellar Drift" → System: Creates project, shows starting point selector
2. User: Clicks "Start with Mechanics" → System: Shows mechanics input form (core loop, player actions, win condition)
3. User: Enters "Space trading sim with piracy and faction diplomacy" → System: Generates detailed mechanics (trade routes, combat, reputation systems)
4. User: Reviews mechanics, clicks "Generate Lore" → System: Creates lore matching mechanics (warring factions, trader protagonist, galactic conflict)
5. User: Edits lore, changes protagonist background → System: Re-runs validation, updates consistency score (0.88)
6. User: Clicks "Export" → GDD → System: Downloads `stellar-drift-gdd.md`
7. Success: User has professional GDD ready for development

**Error Paths:**
- If OpenRouter fails in step 3 → Fallback to Ollama, notify user
- If validation score <0.75 in step 5 → Highlight errors, suggest refinement
- If user leaves during step 4 → Auto-save progress, resume on return

---

### Workflow 2: Refine Existing Concept

**Trigger:** User opens project with consistency score 0.73 (has warnings)

**Steps:**
1. User: Opens "Void Runner" project → System: Loads concept, shows 3 warnings in consistency panel
2. User: Clicks warning "Stealth mechanics conflict with loud combat system" → System: Highlights conflicting mechanics
3. User: Clicks "Suggest Fix" → System: Proposes "Replace loud combat with silent takedowns OR adjust lore to allow hybrid approach"
4. User: Clicks "Apply: Silent takedowns" → System: Updates mechanics, re-validates (score improves to 0.82)
5. User: Clicks "Refine Concept" → "Enrich Lore" → System: Generates deeper backstory, faction details
6. User: Accepts refined lore → System: Saves new version, score improves to 0.89
7. Success: Concept is cohesive, ready to export

**Error Paths:**
- If refinement fails to improve score → Notify "No improvements found, try different focus area"
- If user rejects all suggestions → Keep original, guide to manual editing

---

### Workflow 3: Use Template and Customize

**Trigger:** User clicks "New Project" → "Use Template"

**Steps:**
1. User: Selects "Survival" template → System: Populates mechanics (resource gathering, crafting, hunger/thirst, shelter building)
2. User: Modifies setting from "wilderness" to "alien planet" → System: Re-generates lore with sci-fi elements
3. User: Adds mechanic: "Oxygen management" → System: Updates lore to explain hostile atmosphere
4. User: Runs validation → System: 0.91 score, all green
5. User: Generates title → System: Suggests "Red Planet Protocol", user selects
6. User: Exports as pitch deck → System: Downloads `red-planet-protocol-pitch.md`
7. Success: User has polished concept from template in 20 minutes

**Error Paths:**
- If template switch requested mid-edit → Confirm overwrite or cancel
- If customization breaks genre convention → Info message (not blocking)

---

## Non-Functional Requirements

**Performance:**
- API response time: <500ms for validation, <3s for generation
- Frontend load time: <2s on broadband
- Database queries: <100ms (add indexes on high-traffic columns)
- Validation: <1s for 30 rules (parallel execution)

**Security:**
- Input validation: All user content validated with Zod schemas (prevent injection)
- API rate limiting: 20 requests/minute per IP (prevent abuse)
- Data privacy: User concepts never used for AI training (opt-out in API calls)
- HTTPS: All traffic encrypted in production

**Scalability:**
- Support 100 concurrent users (MVP target)
- Database: PostgreSQL handles 10k+ projects with JSONB indexing
- Redis: Queue handles 1000 async jobs/hour
- Cost: <$0.10 per concept generation (Ollama fallback keeps costs low)

**Accessibility:**
- WCAG 2.1 Level AA compliance (color contrast, keyboard navigation)
- Screen reader compatible (semantic HTML, ARIA labels)
- Mobile responsive (works on tablets, basic phone support)

---

## Business Rules

### Consistency Score Calculation
**When:** User modifies mechanics or lore  
**Then:** Validation engine runs 30+ rules, aggregates confidence scores into overall score (0-1)  
**Why:** Provides single metric for concept quality, guides user toward coherent designs

### AI Model Selection Hierarchy
**When:** User triggers AI generation with "Auto" model preference  
**Then:** System selects: (1) Task-specific optimal model, (2) If unavailable, fallback to Ollama, (3) If Ollama offline, error  
**Why:** Balances quality, cost, and reliability

### Version Limit
**When:** User creates 11th concept version in single project  
**Then:** Oldest version (v1) is automatically deleted  
**Why:** Prevents database bloat, 10 versions is sufficient history

### Export Gating
**When:** User attempts export with consistency score <0.60  
**Then:** Block export, show modal: "Resolve critical errors before exporting"  
**Why:** Prevents export of fundamentally broken concepts

---

## Integrations

**OpenRouter API**
- **Purpose:** Multi-model AI gateway for cost-optimized generations
- **Type:** REST API
- **Data:** Prompt (text), response (text), tokens, cost

**Google Gemini API**
- **Purpose:** Fast consistency validation with multimodal reasoning
- **Type:** REST API  
- **Data:** Concept JSON, validation rules, confidence scores

**Ollama Local API**
- **Purpose:** Free, unlimited generations for cost-conscious users
- **Type:** HTTP API (localhost:11434)
- **Data:** Prompt (text), response (text), local model name

---

## Scope

**In Scope (MVP):**
- 7 core features (flexible workflow, genres, orchestration, refinement, validation, titles, export)
- 5 genre templates (RPG, FPS, Strategy, Puzzle, Survival)
- 30+ validation rules
- 3 export templates (GDD, Pitch, Technical)
- Single-user mode (no authentication)
- Self-hosted deployment (Docker)

**Future Phases:**
- **Phase 2 (Q1 2026):** Multi-user support, team collaboration, cloud saves
- **Phase 3 (Q2 2026):** Visual concept art generation (Stable Diffusion integration), advanced templates (10+ genres)
- **Phase 4 (Q3 2026):** Community marketplace (share templates), monetization (hosted SaaS)

**Out of Scope:**
- Actual game development (GameForge generates *concepts*, not code)
- Asset creation (no sprites, 3D models, sound)
- Multiplayer game-specific features (matchmaking, server architecture)
- Budget management, crowdfunding integration (game project management)

---

## Open Questions

**None** - All MVP requirements are defined. Future phases will be scoped after MVP feedback.

---

**Last Updated:** November 17, 2025
