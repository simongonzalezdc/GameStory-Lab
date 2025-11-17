# Generative Score Lab - Product Requirements

**Purpose:** Defines WHAT to build  
**Generated:** November 17, 2025

---

## Project Overview

### Vision

**"Make adaptive game music creation accessible to everyone, powered by AI."**

Generative Score Lab democratizes dynamic game audio by combining:
- **Natural language AI** (describe music in plain English)
- **Voice capture** (sing your melodies)
- **Algorithmic generation** (euclidean rhythms, arpeggios, Markov chains)
- **Game-ready export** (JSON optimized for AI coding agents)

**Long-term:** Become the Figma of game audio - collaborative, browser-based, with powerful exports.

### Problem Statement

**Current state:**  
Creating adaptive music for games requires:
- Expensive middleware (Wwise, FMOD) with steep learning curves
- Technical knowledge of audio programming
- Traditional DAW workflows that don't translate to game logic
- Manual programming of music-to-gameplay mappings

This locks out **indie developers** (too expensive/complex) and **non-technical composers** (can't write code).

**Desired state:**  
Anyone can create professional adaptive game music by:
- Describing what they want in natural language
- Singing/humming melodies directly into the browser
- Using visual, scene-based workflows (no code required)
- Exporting JSON files that work seamlessly with Unity, Godot, web engines

### Target Users

**Primary:**  
- **Indie game developers** (solo or small teams, budget-conscious)
  - Need adaptive music but can't afford middleware licenses
  - Want to iterate quickly on audio alongside gameplay
  - Comfortable with JSON and simple integration code

**Secondary:**  
- **Non-technical composers** (musicians who want to work in games)
  - Understand music theory but not programming
  - Want to express ideas musically, not technically
  - Need AI guidance for parameter mapping

**Tertiary (Future):**
- Game audio students (learning adaptive music)
- Prototype/game jam participants (need fast iteration)
- YouTube/content creators (making game music tutorials)

### Success Metrics

**MVP Success Criteria:**
1. **Time-to-first-export:** < 1 hour for new users (from tutorial start to working project)
2. **AI request success rate:** 80%+ of natural language requests understood and applied correctly
3. **Voice capture accuracy:** 70%+ correct note detection for simple melodies (major/minor scales)
4. **JSON export compatibility:** 100% of exports load without errors in test Unity/Godot projects
5. **User satisfaction:** 4.5/5 average rating on "ease of use" (internal testing)

**Phase 2 Metrics (Post-MVP):**
- Daily active users
- Projects created per user
- Export-to-actual-game conversion rate
- Community-created templates/presets

---

## Core Features (MVP)

### Feature 1: AI-Powered Natural Language Music Editing

**Priority:** CRITICAL (P0)

**User Story:**
> As a **non-technical composer**, I want to **describe music changes in plain language** ("make this calmer", "add a pad in D minor"), so that **I can create music without learning technical parameters**.

**Description:**  
A chat-based AI assistant that understands musical intent and applies changes to the project. The assistant:
- Parses natural language requests
- Asks clarifying questions when ambiguous
- Generates JSON patches to modify scenes/tracks/generators
- Explains changes in musical terms

**Acceptance Criteria:**
- [ ] User can type natural language message and receive a response within 5 seconds
- [ ] AI correctly interprets 15 common request types (see list below)
- [ ] AI asks clarifying questions when request is ambiguous (e.g., "Which scene do you want to modify?")
- [ ] Changes are reflected immediately in UI and audio playback
- [ ] User can undo/redo AI-applied changes
- [ ] Works with multiple AI providers: OpenRouter, Minimax, GLM, and local (Ollama)
- [ ] Error messages are clear and actionable (e.g., "Local LLM connection failed. Check that Ollama is running.")

**Common Request Types (MVP):**
1. "Make this calmer/more intense/darker/brighter"
2. "Change key to [X] [major/minor]"
3. "Speed up/slow down the tempo"
4. "Add a [pad/lead/bass] track"
5. "Remove the [drums/bass/etc.]"
6. "Make the drums more sparse/dense"
7. "Add a gentle high pad"
8. "Create a new scene for [exploration/combat/menu]"
9. "Copy this scene but make it darker"
10. "Fix the bass so it doesn't overlap with drums"
11. "Make this sound more like [reference genre/mood]"
12. "Simplify this arrangement"
13. "Add more variation to the melody"
14. "Make the transition smoother between scenes"
15. "Export this project"

**User Flow:**
1. User clicks AI assistant icon (opens chat panel)
2. User types natural language request: "Make the combat scene more intense"
3. AI processes request (loading indicator shown)
4. AI responds: "I've increased the drum density to 0.8 and added a distorted bass layer. The intensity should feel higher now. Would you like me to adjust the tempo as well?"
5. User: "Yes, speed it up a bit"
6. AI: "Increased BPM from 110 to 125. Play the scene to hear the changes."
7. User plays scene, confirms changes sound good

**Business Rules:**
- AI changes are always applied immediately (no "apply" button)
- User can undo any AI change via standard undo (Cmd/Ctrl+Z)
- AI has access to current project state (all scenes, tracks, generators)
- AI cannot delete the last remaining scene in a project
- AI responses must complete within 10 seconds or show timeout error

**Data Needed:**
- Current project JSON structure
- Schema description for AI to understand data model
- User's natural language input
- Conversation history (last 5 messages for context)

**Edge Cases:**
- User request is too vague ("make it better") → AI asks clarifying questions
- User request is impossible ("make it play backwards") → AI explains limitation politely
- AI backend is unavailable → Show clear error with fallback options
- Multiple scenes selected → AI asks which scene to modify
- Conflicting requests in conversation → AI resolves based on latest instruction

---

### Feature 2: Voice Melody Capture

**Priority:** CRITICAL (P0)

**User Story:**
> As a **composer**, I want to **sing or hum melodies into my microphone**, so that **I can quickly capture musical ideas without playing an instrument**.

**Description:**  
Real-time pitch detection that converts sung/hummed melodies into MIDI notes. Features:
- Visual pitch feedback (like a tuner)
- Auto-detect key and scale
- Quantize to nearest note (no microtones unless requested)
- Create new clip from captured melody

**Acceptance Criteria:**
- [ ] User grants microphone permission on first use (clear instructions shown)
- [ ] Visual pitch display updates in real-time (< 50ms latency)
- [ ] Correctly detects 70%+ of sung notes (simple melodies, major/minor scales)
- [ ] Auto-quantizes to nearest chromatic note by default
- [ ] User can set target key/scale before recording (e.g., "C major" limits to C D E F G A B)
- [ ] Recording starts/stops with clear button
- [ ] Captured melody creates a new clip in the currently selected track
- [ ] User can edit/correct detected notes after capture
- [ ] Works in Chrome, Firefox, Safari (test on macOS/Windows)

**User Flow:**
1. User creates or selects a track (e.g., "Lead Melody")
2. User clicks "Capture from Voice" button
3. Browser requests microphone permission (first time only)
4. Visual pitch detector appears (shows target note and current pitch)
5. User selects target key (default: project key) and scale (default: major)
6. User clicks "Start Recording"
7. User sings/hums melody (visual feedback shows detected notes in real-time)
8. User clicks "Stop Recording"
9. App quantizes detected pitches to MIDI notes
10. New clip created with captured melody, auto-added to track
11. User plays track to hear captured melody with synthesizer

**Business Rules:**
- Requires microphone permission (Web Audio API)
- Minimum recording duration: 2 beats (to filter out accidental clicks)
- Maximum recording duration: 64 bars (to prevent memory issues)
- Auto-detects tempo if user doesn't specify (via tap tempo or analysis)
- Captured notes default to quarter notes (can edit duration later)
- Monophonic only (one note at a time, no chords)

**Data Needed:**
- Microphone audio stream (Web Audio API)
- Target key/scale for quantization
- Current project BPM (for rhythm quantization)

**Edge Cases:**
- No microphone available → Show error message with instructions
- Background noise too loud → Show warning, suggest quieter environment
- Singing too quiet → Show "increase volume" hint
- Singing out of detection range (< 80Hz or > 1000Hz) → Show "outside range" warning
- Browser doesn't support Web Audio → Show "unsupported browser" error

---

### Feature 3: Scene-Based Composition

**Priority:** CRITICAL (P0)

**User Story:**
> As a **game developer**, I want to **create separate musical scenes for different game states** (exploration, combat, boss fight), so that **music adapts dynamically to gameplay**.

**Description:**  
Visual scene management with color-coded cards. Each scene is a complete musical arrangement with its own key, tempo, tracks, and intensity range.

**Acceptance Criteria:**
- [ ] User can create unlimited scenes (reasonable limit: 50 per project)
- [ ] Each scene has: name, color, key, scale, BPM (optional override), intensity range
- [ ] Scene cards displayed in grid view with visual preview (color, name, duration)
- [ ] User can duplicate scenes (to create variations)
- [ ] User can delete scenes (with confirmation if > 1 track exists)
- [ ] User can reorder scenes via drag-and-drop
- [ ] Clicking scene opens editor view with tracks
- [ ] Scene plays/stops with spacebar (or play button)
- [ ] Multiple scenes cannot play simultaneously (auto-stop previous)

**User Flow:**
1. User lands on Scene Board (grid of scene cards)
2. User clicks "+ Create Scene" button
3. Dialog appears with scene configuration:
   - Name: "Exploration - Day" (user input)
   - Color: #7AC9FF (color picker)
   - Key: D (dropdown)
   - Scale: major (dropdown)
   - BPM: 110 (number input, optional - uses project default)
4. User clicks "Create"
5. New scene card appears in grid
6. User clicks scene card to open Scene Editor
7. Scene Editor shows:
   - Scene settings at top (key, scale, BPM, intensity)
   - Track list with add/remove buttons
   - Playback controls (play/stop, loop, current position)

**Business Rules:**
- Project must have at least 1 scene (cannot delete last scene)
- Scene names must be unique within project
- Default new scene: C major, 120 BPM, intensity [0.2, 0.8]
- Colors default to palette (user can customize)
- Duplicated scenes get suffix " (Copy)"

**Data Needed:**
- Scene metadata (name, color, key, scale, BPM, intensity range)
- Tracks belonging to scene
- User preferences (default colors, keys, etc.)

**Edge Cases:**
- Duplicate scene name → Auto-append number: "Combat (2)"
- Delete last scene → Show error: "Project must have at least 1 scene"
- Change key while scene is playing → Immediately transpose all notes
- Empty scene (no tracks) → Show "Add a track to get started" hint

---

### Feature 4: Multi-Track Generator System

**Priority:** CRITICAL (P0)

**User Story:**
> As a **composer**, I want to **automatically generate musical patterns** (drums, bass, melodies) using algorithms, so that **I can create complex music without manually programming every note**.

**Description:**  
Pluggable generator system with 4 MVP generators:
1. **Euclidean Rhythm** (drums, percussion)
2. **Arpeggiator** (bass, melodic patterns)
3. **Markov Chain** (melodic generation)
4. **Random Walk** (experimental melodies)

Each generator has configurable parameters and produces deterministic output.

**Acceptance Criteria:**
- [ ] User can add a new track to a scene
- [ ] User selects track role (drums, bass, pad, lead, fx)
- [ ] User selects generator type from dropdown
- [ ] Generator parameters UI appears (specific to generator type)
- [ ] User adjusts parameters via sliders/inputs
- [ ] Clicking "Generate" creates a new clip with pattern
- [ ] Generated pattern plays immediately when scene plays
- [ ] User can regenerate with different parameters (non-destructive)
- [ ] User can have multiple clips per track with different generators

**Generator 1: Euclidean Rhythm**
- Parameters:
  - Steps (4-64): Total steps in pattern
  - Pulses (1-steps): Number of hits
  - Rotation (0-steps): Rotate pattern
  - Pattern role: kick, snare, hat, perc (determines sound)
- Example: (16, 5, 0) for kick → [1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0]

**Generator 2: Arpeggiator**
- Parameters:
  - Mode: up, down, up_down, random
  - Notes per beat: 1, 2, 4
  - Octave range: 1, 2, 3
  - Follow chord progression: yes/no
- Example: "up" mode in C major → C E G C (ascending)

**Generator 3: Markov Chain**
- Parameters:
  - Order: 1st, 2nd, 3rd order
  - Seed melody: user-provided MIDI notes (or random)
  - Length: 4-32 notes
- Example: 1st-order Markov trained on C D E F G → generates new melody based on transition probabilities

**Generator 4: Random Walk**
- Parameters:
  - Step size: 1-12 semitones
  - Boundary: stay in scale? (yes/no)
  - Length: 4-32 notes
- Example: Starting at C, step size 2, stay in C major → C D E F... (constrained random walk)

**User Flow (Euclidean Rhythm Example):**
1. User creates new track, selects role "Drums"
2. User clicks "Add Clip"
3. Generator selector appears, user chooses "Euclidean Rhythm"
4. Parameter UI appears:
   - Steps: [slider] 16
   - Pulses: [slider] 5
   - Rotation: [slider] 0
   - Pattern role: [dropdown] "Kick"
5. User adjusts sliders, sees pattern visualized
6. User clicks "Generate"
7. Clip created with euclidean pattern
8. User plays scene, hears kick drum pattern

**Business Rules:**
- Generators are pure functions (deterministic, same params → same output)
- Each clip can only have one generator
- Changing generator parameters regenerates clip (user confirms if clip was manually edited)
- Generators respect scene key/scale (constrain notes to scale)
- Density and probability parameters affect playback (not generation)

**Data Needed:**
- Generator type and parameters (stored in Clip)
- Scene key/scale (for melodic generators)
- Instrument assignment (determines sound)

**Edge Cases:**
- Invalid parameters (pulses > steps) → Show validation error
- Generator fails (rare algorithm bug) → Show error, don't crash app
- Empty seed melody for Markov → Use default melodic pattern
- Melodic generator in non-melodic track (drums) → Warn user, allow anyway

---

### Feature 5: AI Assistant Backend Switching

**Priority:** HIGH (P1)

**User Story:**
> As a **privacy-conscious user** or **user with no internet**, I want to **use a local LLM instead of cloud AI**, so that **I can work offline and keep my projects private**.

**Description:**  
Switchable AI backend with guided setup for multiple providers: OpenRouter (access to Claude, GPT-4, etc.), Minimax M2, GLM 4.6, and local (Ollama/LM Studio).

**Acceptance Criteria:**
- [ ] Settings page has "AI Assistant" section
- [ ] User can select from multiple providers: OpenRouter, Minimax, GLM, or Local (Ollama)
- [ ] Cloud providers require API key (stored securely in browser localStorage)
- [ ] OpenRouter allows model selection (default: anthropic/claude-3.5-sonnet)
- [ ] Minimax requires API key and group ID
- [ ] GLM requires API key
- [ ] Local backend requires URL configuration (default: http://localhost:11434)
- [ ] Setup wizard guides user through provider setup and local LLM installation
- [ ] Connection test verifies backend is reachable before enabling
- [ ] Clear error messages if backend unavailable ("API key invalid", "Local LLM not running")
- [ ] Provider choice persists across sessions (saved in settings)

**User Flow (Local Backend Setup):**
1. User clicks Settings → AI Assistant
2. User toggles "Use Local LLM" (off by default)
3. Setup wizard appears:
   - Step 1: "Install Ollama or LM Studio" (links provided)
   - Step 2: "Download a compatible model" (recommendations: `llama3.1`, `mistral`)
   - Step 3: "Start the server" (command shown: `ollama serve`)
   - Step 4: "Configure URL" (input: `http://localhost:11434`)
4. User clicks "Test Connection"
5. App sends test request to local LLM
6. Success: "Connected to local LLM! Model: llama3.1" (green checkmark)
7. User closes wizard, AI assistant now uses local backend

**User Flow (Cloud Backend Setup - OpenRouter Example):**
1. User clicks Settings → AI Assistant
2. User selects "OpenRouter" from provider dropdown
3. User clicks "Get API Key" (opens openrouter.ai/keys in new tab)
4. User copies API key from OpenRouter dashboard
5. User selects model (e.g., "anthropic/claude-3.5-sonnet")
6. User pastes key into input field
7. App validates key with test request
8. Success: "API key valid! Ready to use OpenRouter." (green checkmark)

**Similar flows exist for Minimax and GLM providers.**

**Business Rules:**
- Default to OpenRouter backend (simpler for most users, access to multiple models)
- API keys stored in browser localStorage (encrypted if possible)
- Each provider has its own configuration (API key, model selection, etc.)
- Local backend requires manual setup (can't auto-install Ollama)
- If selected provider fails, show fallback message: "AI assistant unavailable. You can still use manual controls."
- User can switch providers anytime (takes effect immediately)

**Data Needed:**
- Selected provider ("openrouter", "minimax", "glm", or "local")
- API key (for cloud providers)
- Model selection (for OpenRouter)
- Group ID (for Minimax)
- Local URL (for local provider)
- Last successful connection timestamp

**Edge Cases:**
- Invalid API key → Clear error: "API key invalid. Check your key in [provider] console."
- Local LLM not running → "Cannot connect to http://localhost:11434. Is Ollama running?"
- Provider configured but fails → Show error, allow switching to another provider
- User closes setup wizard mid-way → Save progress, allow resume later

---

### Feature 6: Game-Ready JSON Export

**Priority:** HIGH (P1)

**User Story:**
> As a **game developer**, I want to **export my project as clean JSON files**, so that **I can easily integrate the music into Unity, Godot, or web games with my AI coding agent**.

**Description:**  
Export project as a multi-file folder structure optimized for game engines and AI coding agents. Includes schema, README, and example integration code.

**Acceptance Criteria:**
- [ ] User clicks "Export Project" button
- [ ] File System Access API dialog appears (select folder)
- [ ] App creates folder structure (see below)
- [ ] All files are valid JSON (validated before export)
- [ ] README.md included with integration instructions
- [ ] Example code snippets for Unity/Godot/Web
- [ ] Export completes in < 5 seconds for typical project (10 scenes)
- [ ] User can re-import exported project (roundtrip test)

**Folder Structure:**
```
my-game-score/
  project.json           # Main project file
  scenes/
    exploration_day.json
    exploration_night.json
    combat_low.json
    boss_phase2.json
  instruments.json       # Instrument presets
  README.md              # Integration guide
```

**project.json (simplified):**
```json
{
  "schemaVersion": "1.0.0",
  "projectId": "uuid",
  "name": "My Game Score",
  "bpm": 110,
  "timeSignature": "4/4",
  "defaultKey": "C",
  "defaultScale": "major",
  "scenes": [
    { "id": "exploration_day", "file": "scenes/exploration_day.json" },
    { "id": "combat_low", "file": "scenes/combat_low.json" }
  ]
}
```

**README.md (included):**
- What this export contains
- How to load in Unity (C# example)
- How to load in Godot (GDScript example)
- How to load in web (JavaScript example)
- Schema documentation (AI-agent-friendly)

**User Flow:**
1. User clicks "File" → "Export Project"
2. File picker dialog appears: "Choose export location"
3. User selects folder (e.g., `~/Documents/`)
4. App creates folder: `my-game-score/`
5. App writes all JSON files
6. App writes README.md
7. Success message: "Project exported to ~/Documents/my-game-score/" (with button to open folder)

**Business Rules:**
- Export validates all data before writing (no partial exports)
- Scene files are independent (can be loaded separately)
- Instrument presets are shared across scenes
- README is auto-generated (no user editing needed)
- Exported projects can be re-imported losslessly

**Data Needed:**
- Full project state (scenes, tracks, clips, generators)
- Instrument presets
- Project metadata

**Edge Cases:**
- User cancels folder selection → No files created, no error
- Export folder already exists → Warn user, ask to overwrite or rename
- Invalid JSON (rare bug) → Show validation error, don't export
- Very large project (> 100 scenes) → Show progress bar, allow cancel

---

### Feature 7: GarageBand-Level UI

**Priority:** HIGH (P1)

**User Story:**
> As a **non-technical user**, I want the UI to be **simple and visual like GarageBand**, so that **I don't get overwhelmed by technical parameters**.

**Description:**  
Simplified, visual interface with:
- Color-coded scene cards (not text-heavy lists)
- Sliders instead of number inputs
- Friendly labels ("Intensity" not "Amplitude Scaling Factor")
- Progressive disclosure (hide advanced options until requested)

**Acceptance Criteria:**
- [ ] Scene board uses card grid (not table)
- [ ] Each scene card shows: color, name, duration, key/scale icon
- [ ] Track rows use icons for role (🥁 drums, 🎸 bass, etc.)
- [ ] Parameter controls use sliders with visual feedback
- [ ] All actions have clear labels (no abbreviations or jargon)
- [ ] Help tooltips on hover (optional, non-intrusive)
- [ ] Consistent color scheme (nature-inspired, minimalist)
- [ ] No more than 5 main sections visible at once (avoid clutter)

**Visual Design Principles:**
- **Nature-inspired palette:** Greens, blues, earth tones
- **Generous whitespace:** Don't cram controls
- **Clear hierarchy:** Important controls larger/bold
- **Icon + Label:** Always both, never icon-only buttons
- **Responsive:** Works at 1280x720 minimum

**User Flow:**
1. User opens app → Sees scene board (colorful cards, not intimidating)
2. User clicks scene → Opens editor (track list with clear icons)
3. User adds track → Sees friendly "What kind of sound?" (drums, bass, etc.)
4. User edits parameters → Sliders with real-time visual feedback
5. User never sees technical terms like "OSC1 frequency" or "ADSR envelope"

**Business Rules:**
- Default to "Simple Mode" (advanced controls hidden)
- Advanced mode toggle in Settings (shows more parameters)
- Keyboard shortcuts shown in tooltips (e.g., "Spacebar to play")
- All text uses sentence case (not UPPERCASE or camelCase)

**Data Needed:**
- User preference: simple vs advanced mode
- Tooltip text for all controls

**Edge Cases:**
- User has accessibility needs → Full keyboard navigation, screen reader support
- User on small screen (< 1280px) → Stack panels vertically, not horizontally
- User zooms in browser → UI scales proportionally

---

### Feature 8: Interactive Tutorial

**Priority:** HIGH (P1)

**User Story:**
> As a **first-time user**, I want an **interactive tutorial**, so that **I can learn how to use the app without reading documentation**.

**Description:**  
Step-by-step walkthrough that runs on first launch (and can be replayed anytime). Uses Shepherd.js or similar library for guided tour.

**Acceptance Criteria:**
- [ ] Tutorial launches automatically on first visit (detected via localStorage flag)
- [ ] User can skip tutorial (with confirmation)
- [ ] Tutorial progresses step-by-step (user clicks "Next" or completes action)
- [ ] Each step highlights relevant UI element
- [ ] Tutorial covers 7 core actions (see below)
- [ ] User can restart tutorial from Settings
- [ ] Tutorial completion tracked (badge or checkmark)
- [ ] ADHD-friendly: short steps (< 30 seconds each), visual focus

**Tutorial Steps:**
1. **Welcome** - "Welcome to Generative Score Lab! Let's create your first adaptive game score."
2. **Create Scene** - "Click here to create a new scene for your game." (highlights "+ Create Scene" button)
3. **Name Your Scene** - "Name it 'Exploration' and pick a color you like."
4. **Add a Track** - "Now let's add a drum track. Click '+ Add Track'."
5. **Generate Pattern** - "Choose 'Euclidean Rhythm' and adjust the sliders. Hear how the pattern changes?"
6. **Try AI Assistant** - "Want to make it calmer? Just ask the AI assistant!" (highlights chat icon)
7. **Export** - "When you're ready, export your project to use in your game!" (highlights Export button)
8. **Done** - "You're all set! Explore, experiment, and create amazing music."

**User Flow:**
1. User visits app for first time
2. Tutorial overlay appears with dimmed background
3. Step 1 appears in modal with "Next" button
4. User clicks "Next" → Step 2 highlights scene button
5. User clicks "+ Create Scene" (or clicks "Next" to see simulation)
6. ... continues through all steps
7. Final step: "Tutorial Complete! 🎉" with option to "Start Creating"

**Business Rules:**
- Tutorial is optional (can skip at any step)
- Tutorial state persists (can pause and resume later)
- Completing tutorial unlocks "Tutorial Complete" badge (optional gamification)
- Tutorial can be reset from Settings → Help → "Replay Tutorial"

**Data Needed:**
- Tutorial completion status (boolean in localStorage)
- Current step index (for resume)
- User preference: show tips during regular use? (optional)

**Edge Cases:**
- User closes browser mid-tutorial → Resume from last completed step
- User clicks outside tutorial area → Show "Exit tutorial?" confirmation
- User already knows the app → "Skip tutorial" prominent button

---

## User Workflows

### Workflow 1: Create Simple 2-Scene Game Score (Exploration + Combat)

**Trigger:** User opens app with goal of creating music for a simple game

**Steps:**
1. **User:** Lands on empty scene board → **System:** Shows "Get Started" prompt with tutorial option
2. **User:** Skips tutorial, clicks "+ Create Scene" → **System:** Opens scene creation dialog
3. **User:** Names scene "Exploration", sets key to C major, chooses green color → **System:** Creates scene card
4. **User:** Clicks new scene card → **System:** Opens scene editor (empty track list)
5. **User:** Clicks "+ Add Track", selects "Bass" role → **System:** Creates track row
6. **User:** Clicks "Add Clip" → selects "Arpeggiator" generator → **System:** Shows arp parameters
7. **User:** Adjusts arp mode to "up_down", sets notes per beat to 2 → **System:** Generates arpeggio pattern
8. **User:** Clicks play button (spacebar) → **System:** Plays scene with bass arpeggio
9. **User:** Opens AI chat, types "add gentle drums" → **System:** AI creates drum track with euclidean rhythm
10. **User:** Returns to scene board, duplicates "Exploration" scene → **System:** Creates "Exploration (Copy)"
11. **User:** Renames to "Combat", changes color to red → **System:** Updates scene
12. **User:** Opens "Combat" scene, types in AI chat "make this more intense" → **System:** AI increases drum density, adds distorted bass
13. **User:** Plays both scenes to compare → **System:** Scenes play independently (one at a time)
14. **User:** Clicks "File" → "Export Project" → **System:** Opens folder picker
15. **User:** Selects export location → **System:** Writes JSON files + README
16. **Success:** User has working 2-scene score ready for Unity/Godot integration

**Error Paths:**
- If AI assistant fails at step 9, user manually adds drum track with euclidean generator
- If export folder already exists at step 15, system asks to overwrite or rename

---

### Workflow 2: Capture Vocal Melody and Generate Harmonies

**Trigger:** User has a melody idea and wants to quickly capture it

**Steps:**
1. **User:** Opens existing project, navigates to scene → **System:** Shows scene editor
2. **User:** Clicks "+ Add Track", selects "Lead" role → **System:** Creates track
3. **User:** Clicks "Capture from Voice" button → **System:** Requests microphone permission
4. **User:** Grants permission → **System:** Opens pitch visualizer with "Start Recording" button
5. **User:** Sets target key to D major → **System:** Updates quantization settings
6. **User:** Clicks "Start Recording", sings melody (8 notes) → **System:** Visualizes pitch in real-time
7. **User:** Clicks "Stop Recording" → **System:** Quantizes pitches to MIDI, creates clip
8. **User:** Plays scene → **System:** Plays captured melody with synth sound
9. **User:** Opens AI chat, types "add harmonies to this melody" → **System:** AI analyzes melody, creates two harmony tracks (3rd and 5th intervals)
10. **User:** Plays scene → **System:** Plays melody + harmonies together
11. **Success:** User has harmonized melody created from voice input

**Error Paths:**
- If pitch detection fails (noisy environment) at step 6, system shows "Too much background noise" warning
- If AI harmony generation fails at step 9, user manually creates harmony tracks with arpeggiator

---

### Workflow 3: Integrate Exported Project into Unity

**Trigger:** User has completed score in Generative Score Lab and wants to use in Unity game

**Steps:**
1. **User:** Exports project from app (see Workflow 1, steps 14-16) → **System:** Creates JSON files
2. **User:** Opens Unity project, creates `Assets/Music/` folder → **System:** N/A (Unity)
3. **User:** Drags exported folder into Unity → **System:** Imports JSON files
4. **User:** Opens `README.md` from export → **System:** Shows C# integration code example
5. **User:** Creates new C# script `AdaptiveMusicManager.cs` → **System:** N/A (Unity)
6. **User:** Copies code from README, pastes into script → **System:** N/A (Unity)
7. **User:** Attaches script to GameObject in scene → **System:** N/A (Unity)
8. **User:** Runs game, character enters exploration area → **System:** Unity loads `exploration_day.json`, triggers music playback
9. **User:** Character engages enemy → **System:** Unity crossfades to `combat_low.json` scene
10. **Success:** Game has working adaptive music from exported JSON

**Error Paths:**
- If JSON parsing fails at step 8, Unity shows error with line number (schema validation catches this)
- If audio assets missing, Unity shows "Missing instrument preset" error (README explains how to map to Unity AudioClips)

---

## Non-Functional Requirements

**Performance:**
- **Audio latency:** < 50ms from user action (button click) to sound playback
- **Generator speed:** < 100ms to generate 16-bar pattern (any generator)
- **UI responsiveness:** 60 FPS maintained during animation/drag-drop
- **Export speed:** < 5 seconds for 10-scene project (including file writes)
- **AI response time:** < 5 seconds for typical request (cloud backend)

**Security:**
- **API keys:** Stored in browser localStorage (consider encryption if feasible)
- **No sensitive data in exports:** JSON files contain only musical data (no user info)
- **Microphone permission:** Clear explanation before requesting access
- **HTTPS only:** All external API calls (Anthropic) use HTTPS

**Scalability:**
- **Scenes per project:** Support up to 50 scenes (realistic game needs)
- **Tracks per scene:** Support up to 16 tracks (typical DAW limit)
- **Project file size:** Keep under 10MB for typical project (JSON is compact)

**Accessibility:**
- **Keyboard navigation:** Full app usable without mouse
- **Screen reader support:** ARIA labels on all interactive elements
- **Color contrast:** WCAG AA minimum (4.5:1 for text)
- **Focus indicators:** Clear visible focus for keyboard users
- **Resizable text:** App supports browser zoom up to 200%

**Browser Compatibility:**
- **Chrome:** 100+ (primary target)
- **Firefox:** 100+ (test regularly)
- **Safari:** 15+ (test on macOS)
- **Edge:** 100+ (Chromium-based, should work)
- **Mobile:** Not supported in MVP (future phase)

---

## Business Rules

### Rule 1: Audio Context Requires User Gesture
**When:** User first loads the app  
**Then:** Audio context cannot start until user clicks/taps (browser autoplay policy)  
**Why:** Security requirement enforced by all modern browsers

### Rule 2: No Simultaneous Scene Playback
**When:** User plays a scene while another is playing  
**Then:** Previous scene stops immediately  
**Why:** Prevents audio chaos, mirrors game engine behavior

### Rule 3: Generators are Deterministic
**When:** User generates a pattern with specific parameters  
**Then:** Same parameters always produce same output  
**Why:** Predictability for game development, testing, debugging

### Rule 4: AI Changes are Immediate
**When:** AI assistant proposes a change  
**Then:** Change is applied to project immediately (no "apply" button)  
**Why:** Faster iteration, feels more conversational

### Rule 5: Exports Must Validate
**When:** User exports a project  
**Then:** All JSON files are schema-validated before writing  
**Why:** Prevents broken exports that fail in game engines

---

## Integrations

**No external integrations in MVP** (all functionality is local/client-side)

**Future integrations (Phase 2+):**
- **Cloud save:** Supabase or Firebase for project sync
- **Asset library:** Integration with Freesound.org or similar for sound samples
- **Game engine plugins:** Native Unity/Godot plugins for runtime playback
- **Collaboration:** Real-time multiplayer editing (like Figma)

---

## Scope

### In Scope (MVP)
- ✅ AI-powered natural language music editing (15 request types)
- ⏳ Voice melody capture (UI exists, pitch detection partially integrated)
- ✅ Scene-based composition (unlimited scenes)
- ✅ 4 generator types (Euclidean, Arp, Markov, Random Walk)
- ✅ Switchable AI backend (OpenRouter, Minimax, GLM, Ollama)
- ✅ JSON export optimized for game engines
- ✅ GarageBand-level UI simplicity
- ✅ Interactive tutorial (first-run)
- ✅ Local-only (no server/database)

### Future Phases (Post-MVP)

**Phase 2: Enhanced Generators (Month 3-4)**
- Strudel DSL integration (TidalCycles-style patterns)
- Magenta ML models (AI-generated melodies)
- Audio stem generation (AI-powered audio synthesis)
- Custom generator scripting (user-defined algorithms)

**Phase 3: Collaboration & Cloud (Month 5-6)**
- Cloud project save/sync
- Shareable project links
- Collaborative editing (multiplayer)
- Template marketplace (user-generated presets)

**Phase 4: Advanced Features (Month 7-12)**
- Real-time game integration (WebSocket protocol)
- Visual programming (node-based patching)
- MIDI import (export already implemented)
- DAW export (Ableton, FL Studio project files)
- Mobile app (iOS/Android)

### Out of Scope (Not planned)
- ❌ Video game development (we export JSON, not games)
- ❌ DAW replacement (GarageBand/Ableton are better for traditional music production)
- ❌ Live performance mode (DJ/VJ features)
- ❌ Blockchain/NFT features
- ❌ Social features (likes, comments, followers)

---

## Open Questions

**All requirements defined for MVP.** 

Future decisions needed for Phase 2+:
1. **Cloud hosting cost:** How to monetize cloud features? (subscription vs freemium)
2. **Template licensing:** Allow users to sell presets? Take commission?
3. **Game engine plugin strategy:** Native plugins vs JSON parsing in C#/GDScript?

---

**Last Updated:** November 17, 2025  
**Last Verified:** November 17, 2025 (against codebase v1.0.0)
