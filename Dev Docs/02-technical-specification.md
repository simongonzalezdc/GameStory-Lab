# Generative Score Lab - Technical Specification

**FOR AI CODING AGENT:** This is your primary implementation guide.  
**Generated:** November 17, 2025  
**Version:** 1.0.0

---

## System Architecture

### High-Level Overview

Generative Score Lab is a browser-based music composition tool built as a single-page application (SPA). Audio generation happens entirely client-side using Web Audio API via Tone.js. Project files are stored locally using the File System Access API. An optional AI assistant (cloud or local) provides natural language interaction.

**Architecture Pattern:** Layered architecture with clear separation of concerns
- **Presentation Layer:** React components (UI/UX)
- **Application Layer:** Zustand stores (state management)
- **Domain Layer:** Music generation logic, scene graph
- **Infrastructure Layer:** Tone.js audio engine, File System API, AI client

### Component Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface (React)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Scene Editor │  │  AI Chat     │  │  Tutorial    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼──────────────┐
│         ▼                  ▼                  ▼              │
│              Zustand State Management Layer                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ProjectStore  │  AudioStore  │  UIStore  │  AIStore │   │
│  └────────┬─────────────┬──────────────┬──────────┬─────┘   │
└───────────┼─────────────┼──────────────┼──────────┼─────────┘
            │             │              │          │
┌───────────┼─────────────┼──────────────┼──────────┼─────────┐
│           ▼             ▼              ▼          ▼         │
│  ┌────────────┐  ┌────────────┐  ┌──────────┐  ┌────────┐  │
│  │  Scene     │  │ Audio      │  │ File     │  │  AI    │  │
│  │  Manager   │  │ Engine     │  │ System   │  │ Client │  │
│  └─────┬──────┘  └─────┬──────┘  └─────┬────┘  └────┬───┘  │
└────────┼───────────────┼───────────────┼────────────┼───────┘
         │               │               │            │
         ▼               ▼               ▼            ▼
┌────────────────────────────────────────────────────────────┐
│       Tone.js        Browser         Browser      HTTP     │
│    (Web Audio API)   File System     Storage      Client   │
└────────────────────────────────────────────────────────────┘
```

### Data Flow

**Composition Flow:**
1. User interacts with Scene Editor or AI Chat
2. Changes trigger Zustand store updates
3. Store dispatches to Scene Manager (validates, transforms data)
4. Scene Manager updates audio engine (Tone.js) with new parameters
5. Audio engine schedules and renders sound
6. UI re-renders to reflect new state (reactive)

**Export Flow:**
1. User clicks "Export Project"
2. ProjectStore serializes entire scene graph to JSON
3. File System API opens save dialog
4. JSON written to user's chosen location
5. Success notification shown

**AI Interaction Flow:**
1. User sends natural language command to AI Chat
2. AIStore sends request to selected backend (cloud/local)
3. AI response parsed for musical intent
4. Structured changes applied to ProjectStore
5. UI highlights affected tracks/parameters
6. Changes applied to audio engine

---

## Tech Stack

### Frontend
- **Framework:** React 18.3+
- **Version:** 18.3.1 (latest stable)
- **Key Libraries:**
  - `tone` ^15.0.4 - Audio engine and Web Audio wrapper
  - `zustand` ^4.4.7 - State management
  - `@radix-ui/react-*` ^1.0.0 - Accessible UI primitives
  - `react-router-dom` ^6.20.0 - Routing (minimal, mostly single page)
  - `clsx` / `tailwind-merge` - Conditional styling utilities
- **Styling:** Tailwind CSS 3.4+
- **State Management:** Zustand with persist middleware

### Audio Processing
- **Primary:** Tone.js 15.0+ (comprehensive Web Audio wrapper)
- **Pattern Generation:** Strudel (integrated as generator plugin)
- **Pitch Detection:** ML5.js PitchDetection or custom FFT implementation
- **Additional:** Web Audio API direct access for custom DSP when needed

### Build & Development
- **Build Tool:** Vite 5.0+
- **Package Manager:** npm (yarn/pnpm compatible)
- **TypeScript:** 5.3+
- **Linter:** ESLint with TypeScript parser
- **Formatter:** Prettier
- **Testing:** Vitest, React Testing Library, Playwright (E2E)

### Backend (Optional, Future)
- **Current:** No backend required
- **Future Cloud Services:** Supabase or Firebase for sync/sharing
- **API:** REST or GraphQL for multi-user features

### Infrastructure
- **Hosting:** Static site (Netlify/Vercel/GitHub Pages) - future
- **CI/CD:** GitHub Actions - future
- **Package Manager:** npm 10+
- **Build Tool:** Vite with TypeScript plugin
- **Environment:** Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)

---

## Project Structure

```
generative-score-lab/
├── public/
│   ├── audio/                    # Sample audio files, instrument presets
│   │   ├── samples/              # One-shot samples
│   │   └── instruments/          # Multi-sample instruments
│   ├── tutorials/                # Tutorial JSON definitions
│   └── favicon.ico
│
├── src/
│   ├── main.tsx                  # App entry point
│   ├── App.tsx                   # Root component with routing
│   │
│   ├── components/               # React components
│   │   ├── ui/                   # Base UI components (Radix wrappers)
│   │   │   ├── Button.tsx
│   │   │   ├── Slider.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Select.tsx
│   │   │   └── ...
│   │   │
│   │   ├── scene/                # Scene editor components
│   │   │   ├── SceneBoard.tsx    # Main scene overview
│   │   │   ├── SceneCard.tsx     # Individual scene card
│   │   │   ├── SceneEditor.tsx   # Detailed scene editor
│   │   │   ├── TrackList.tsx     # List of tracks in scene
│   │   │   ├── TrackEditor.tsx   # Individual track controls
│   │   │   └── ClipEditor.tsx    # Clip details & generator config
│   │   │
│   │   ├── generators/           # Generator UI components
│   │   │   ├── EuclideanUI.tsx
│   │   │   ├── ArpUI.tsx
│   │   │   ├── PatternDSLUI.tsx
│   │   │   └── GeneratorSelector.tsx
│   │   │
│   │   ├── ai/                   # AI assistant components
│   │   │   ├── AIChat.tsx        # Main chat interface
│   │   │   ├── AISetupWizard.tsx # First-run AI configuration
│   │   │   ├── MessageBubble.tsx
│   │   │   └── SuggestionChips.tsx
│   │   │
│   │   ├── audio/                # Audio visualization components
│   │   │   ├── Waveform.tsx
│   │   │   ├── VUMeter.tsx
│   │   │   ├── PianoRoll.tsx     # Future: visual note editor
│   │   │   └── Spectrogram.tsx   # Future: frequency visualization
│   │   │
│   │   ├── input/                # Input components
│   │   │   ├── MicrophoneInput.tsx
│   │   │   ├── PitchDetector.tsx
│   │   │   └── KeyDetector.tsx
│   │   │
│   │   ├── export/               # Export/import components
│   │   │   ├── ExportDialog.tsx
│   │   │   ├── ImportDialog.tsx
│   │   │   └── FormatSelector.tsx
│   │   │
│   │   └── tutorial/             # Tutorial system
│   │       ├── TutorialOverlay.tsx
│   │       ├── TutorialStep.tsx
│   │       └── TutorialProgress.tsx
│   │
│   ├── lib/                      # Core business logic (framework-agnostic)
│   │   ├── audio/                # Audio engine wrapper
│   │   │   ├── engine.ts         # Main audio engine class
│   │   │   ├── scheduler.ts      # Playback scheduling
│   │   │   ├── instruments.ts    # Instrument management
│   │   │   ├── effects.ts        # Effect chains
│   │   │   └── context.ts        # Audio context management
│   │   │
│   │   ├── generators/           # Music generation algorithms
│   │   │   ├── euclidean.ts      # Euclidean rhythm generator
│   │   │   ├── arpeggiator.ts    # Arpeggiator
│   │   │   ├── pattern-dsl.ts    # Pattern DSL (Strudel integration)
│   │   │   ├── markov.ts         # Markov chain generator
│   │   │   ├── random-walk.ts    # Random walk melody generator
│   │   │   └── base-generator.ts # Abstract generator interface
│   │   │
│   │   ├── scene/                # Scene management
│   │   │   ├── scene-manager.ts  # Scene lifecycle & validation
│   │   │   ├── scene-graph.ts    # Scene graph data structure
│   │   │   ├── mappings.ts       # Variable mapping system
│   │   │   └── transitions.ts    # Scene transition logic
│   │   │
│   │   ├── ai/                   # AI assistant integration
│   │   │   ├── ai-client.ts      # Abstract AI client interface
│   │   │   ├── cloud-client.ts   # Cloud API client (Anthropic)
│   │   │   ├── local-client.ts   # Local LLM client (Ollama)
│   │   │   ├── prompt-builder.ts # System prompts for music context
│   │   │   └── intent-parser.ts  # Parse AI responses into actions
│   │   │
│   │   ├── io/                   # Import/export
│   │   │   ├── serializer.ts     # JSON serialization
│   │   │   ├── deserializer.ts   # JSON parsing & validation
│   │   │   ├── file-system.ts    # File System Access API wrapper
│   │   │   └── formats/          # Export format handlers
│   │   │       ├── project-json.ts
│   │   │       ├── midi.ts       # Future: MIDI export
│   │   │       └── musicxml.ts   # Future: MusicXML export
│   │   │
│   │   ├── theory/               # Music theory utilities
│   │   │   ├── scales.ts         # Scale definitions & calculations
│   │   │   ├── chords.ts         # Chord definitions & generation
│   │   │   ├── progressions.ts   # Chord progression patterns
│   │   │   └── pitch.ts          # Pitch conversion utilities
│   │   │
│   │   └── utils/                # Shared utilities
│   │       ├── time.ts           # Time conversion (bars/beats/seconds)
│   │       ├── math.ts           # Mathematical helpers
│   │       ├── validation.ts     # Data validation schemas
│   │       └── constants.ts      # Shared constants
│   │
│   ├── stores/                   # Zustand state stores
│   │   ├── project-store.ts      # Main project state
│   │   ├── audio-store.ts        # Audio playback state
│   │   ├── ui-store.ts           # UI state (modals, panels, etc.)
│   │   ├── ai-store.ts           # AI chat history & settings
│   │   └── tutorial-store.ts     # Tutorial progress & state
│   │
│   ├── types/                    # TypeScript type definitions
│   │   ├── project.ts            # Project, Scene, Track, Clip types
│   │   ├── audio.ts              # Audio engine types
│   │   ├── generator.ts          # Generator configuration types
│   │   ├── ai.ts                 # AI client types
│   │   └── index.ts              # Barrel exports
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAudioEngine.ts     # Audio engine lifecycle
│   │   ├── usePitchDetection.ts  # Microphone pitch detection
│   │   ├── useProjectIO.ts       # File save/load
│   │   ├── useAIChat.ts          # AI interaction
│   │   ├── useUndo.ts            # Undo/redo functionality
│   │   └── useKeyboardShortcuts.ts
│   │
│   ├── styles/                   # Global styles
│   │   ├── globals.css           # Global CSS + Tailwind imports
│   │   └── variables.css         # CSS custom properties
│   │
│   └── assets/                   # Static assets (SVGs, images)
│       ├── icons/
│       └── images/
│
├── tests/                        # Test files
│   ├── unit/                     # Unit tests (*.test.ts)
│   ├── integration/              # Integration tests
│   └── e2e/                      # End-to-end tests (Playwright)
│
├── docs/                         # Documentation
│   ├── architecture.md
│   ├── api.md
│   └── development.md
│
├── .github/                      # GitHub configuration (future)
│   └── workflows/
│       └── ci.yml
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
└── README.md
```

### File Organization Principles

1. **Co-location:** Group related files by feature/domain, not by type
2. **Separation of concerns:** Clear boundaries between UI, business logic, and infrastructure
3. **Framework-agnostic core:** `lib/` contains pure TypeScript with no React dependencies
4. **Testability:** Each module exports testable pure functions when possible
5. **Single responsibility:** Each file has one clear purpose
6. **Consistent naming:** 
   - Components: PascalCase (e.g., `SceneEditor.tsx`)
   - Non-components: kebab-case (e.g., `audio-engine.ts`)
   - Test files: `*.test.ts` or `*.test.tsx`

---

## Core Data Models

### Project Structure
```typescript
// src/types/project.ts

export interface Project {
  schemaVersion: string;           // "1.0.0"
  projectId: string;               // Unique ID
  name: string;
  bpm: number;                     // Global tempo
  timeSignature: string;           // "4/4", "3/4", etc.
  defaultKey: string;              // "C", "G", etc.
  defaultScale: string;            // "major", "minor", "dorian", etc.
  scenes: Scene[];
  globalMappings?: Mapping[];
  metadata: ProjectMetadata;
}

export interface ProjectMetadata {
  created: string;                 // ISO timestamp
  modified: string;
  author?: string;
  description?: string;
  tags?: string[];
}

export interface Scene {
  id: string;
  name: string;
  color?: string;                  // Hex color for UI
  bpm?: number;                    // Override global BPM
  key: string;
  scale: string;
  intensityRange: [number, number]; // [0-1, 0-1]
  tracks: Track[];
  mappings: Mapping[];
  transitions?: Transition[];
}

export interface Track {
  id: string;
  name?: string;
  role: TrackRole;
  instrumentRef: string;           // References instrument preset
  clips: Clip[];
  volume: number;                  // 0-1
  pan: number;                     // -1 to 1
  muted: boolean;
  solo: boolean;
  effects?: EffectChain;
}

export type TrackRole = "drums" | "bass" | "pad" | "lead" | "fx" | "other";

export interface Clip {
  id: string;
  lengthBars: number;
  generator: GeneratorConfig;
  density?: number;                // 0-1, how many notes/events
  probability?: number;            // 0-1, likelihood of playing
  muted: boolean;
  offset?: number;                 // Start offset in bars
}

export interface GeneratorConfig {
  type: GeneratorType;
  params: Record<string, any>;     // Type-specific parameters
}

export type GeneratorType = 
  | "euclidean"
  | "arp"
  | "patternDSL"
  | "markov"
  | "randomWalk"
  | "magenta"
  | "audioModelStem";

// Example generator params:
export interface EuclideanParams {
  steps: number;                   // Total steps in pattern
  pulses: number;                  // Number of hits
  rotation: number;                // Pattern rotation
  patternRole: "kick_snare_hat" | "bass" | "melody";
}

export interface ArpParams {
  mode: "up" | "down" | "upDown" | "downUp" | "random";
  notesPerBeat: number;
  octaveRange: number;
  followChordProgression: boolean;
}

export interface Mapping {
  source: string;                  // Game variable name
  target: string;                  // Dot notation path (e.g., "scene.intensity")
  inputRange: [number, number];
  outputRange: [number, number];
  curve: MappingCurve;
}

export type MappingCurve = "linear" | "easeIn" | "easeOut" | "easeInOut" | "exponential";

export interface Transition {
  fromSceneId: string;
  toSceneId: string;
  conditions: string;              // Simple expression DSL
  crossfadeBars: number;
}
```

---

## Audio Engine Architecture

### Tone.js Wrapper Design

```typescript
// src/lib/audio/engine.ts

import * as Tone from 'tone';

export class AudioEngine {
  private context: Tone.Context;
  private transport: Tone.Transport;
  private instruments: Map<string, Tone.Instrument>;
  private effects: Map<string, Tone.Effect>;
  private currentScene: Scene | null = null;
  private scheduledEvents: Tone.ToneEvent[] = [];

  constructor() {
    this.context = Tone.getContext();
    this.transport = Tone.getTransport();
  }

  // Initialize audio context (requires user interaction)
  async init(): Promise<void> {
    await Tone.start();
    console.log('Audio engine initialized');
  }

  // Load and play a scene
  async loadScene(scene: Scene): Promise<void> {
    this.stop();
    this.clearScheduledEvents();
    this.currentScene = scene;

    // Load instruments for all tracks
    for (const track of scene.tracks) {
      await this.loadInstrument(track);
    }

    // Schedule clips
    for (const track of scene.tracks) {
      for (const clip of track.clips) {
        this.scheduleClip(track, clip);
      }
    }
  }

  private async loadInstrument(track: Track): Promise<void> {
    // Implementation: create Tone.Sampler or Tone.Synth based on instrumentRef
  }

  private scheduleClip(track: Track, clip: Clip): void {
    // Implementation: use generators to create note sequences
    // Schedule with Tone.Transport
  }

  play(): void {
    this.transport.start();
  }

  stop(): void {
    this.transport.stop();
    this.transport.position = 0;
  }

  pause(): void {
    this.transport.pause();
  }

  // Set global tempo
  setBPM(bpm: number): void {
    this.transport.bpm.value = bpm;
  }

  // Real-time parameter changes
  updateParameter(target: string, value: number): void {
    // Implementation: parse target path and update appropriate parameter
  }

  // Cleanup
  dispose(): void {
    this.stop();
    this.clearScheduledEvents();
    this.instruments.forEach(inst => inst.dispose());
    this.effects.forEach(fx => fx.dispose());
  }

  private clearScheduledEvents(): void {
    this.scheduledEvents.forEach(event => event.dispose());
    this.scheduledEvents = [];
  }
}
```

### Generator Integration

Each generator type implements a common interface:

```typescript
// src/lib/generators/base-generator.ts

export interface Generator {
  generate(config: GeneratorConfig, context: GenerationContext): NoteSequence;
}

export interface GenerationContext {
  bpm: number;
  key: string;
  scale: string;
  chordProgression?: Chord[];
  lengthBars: number;
}

export interface NoteSequence {
  notes: Note[];
  duration: number; // In bars
}

export interface Note {
  time: number;     // In bars (0-based)
  pitch: number;    // MIDI note number (0-127)
  duration: number; // In bars
  velocity: number; // 0-1
}
```

**Example: Euclidean Generator**
```typescript
// src/lib/generators/euclidean.ts

export class EuclideanGenerator implements Generator {
  generate(config: GeneratorConfig, context: GenerationContext): NoteSequence {
    const params = config.params as EuclideanParams;
    const pattern = this.euclideanRhythm(params.steps, params.pulses);
    const rotated = this.rotatePattern(pattern, params.rotation);
    
    // Convert pattern to notes
    const notes: Note[] = [];
    const noteInterval = context.lengthBars / params.steps;
    
    rotated.forEach((hit, index) => {
      if (hit === 1) {
        notes.push({
          time: index * noteInterval,
          pitch: this.getPitchForRole(params.patternRole, context),
          duration: 0.1, // Short hit
          velocity: 0.8
        });
      }
    });
    
    return { notes, duration: context.lengthBars };
  }

  private euclideanRhythm(steps: number, pulses: number): number[] {
    // Bjorklund's algorithm implementation
    // Returns array of 0s and 1s
  }
}
```

---

## State Management (Zustand)

### Project Store
```typescript
// src/stores/project-store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProjectState {
  // State
  project: Project | null;
  currentSceneId: string | null;
  selectedTrackId: string | null;
  isDirty: boolean;

  // Actions
  loadProject: (project: Project) => void;
  createNewProject: (name: string) => void;
  updateScene: (sceneId: string, updates: Partial<Scene>) => void;
  addTrack: (sceneId: string, track: Track) => void;
  updateTrack: (sceneId: string, trackId: string, updates: Partial<Track>) => void;
  deleteTrack: (sceneId: string, trackId: string) => void;
  addClip: (sceneId: string, trackId: string, clip: Clip) => void;
  updateClip: (sceneId: string, trackId: string, clipId: string, updates: Partial<Clip>) => void;
  exportProject: () => string; // Returns JSON
  importProject: (json: string) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      project: null,
      currentSceneId: null,
      selectedTrackId: null,
      isDirty: false,

      loadProject: (project) => {
        set({ project, isDirty: false });
      },

      createNewProject: (name) => {
        const newProject: Project = {
          schemaVersion: "1.0.0",
          projectId: crypto.randomUUID(),
          name,
          bpm: 120,
          timeSignature: "4/4",
          defaultKey: "C",
          defaultScale: "major",
          scenes: [],
          metadata: {
            created: new Date().toISOString(),
            modified: new Date().toISOString()
          }
        };
        set({ project: newProject, isDirty: false });
      },

      updateScene: (sceneId, updates) => {
        const { project } = get();
        if (!project) return;

        const updatedScenes = project.scenes.map(scene =>
          scene.id === sceneId ? { ...scene, ...updates } : scene
        );

        set({
          project: { ...project, scenes: updatedScenes },
          isDirty: true
        });
      },

      // ... other actions
    }),
    {
      name: 'generative-score-lab-project',
      partialize: (state) => ({ project: state.project })
    }
  )
);
```

### Audio Store
```typescript
// src/stores/audio-store.ts

interface AudioState {
  isPlaying: boolean;
  currentTime: number; // In bars
  engine: AudioEngine | null;

  init: () => Promise<void>;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setBPM: (bpm: number) => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  isPlaying: false,
  currentTime: 0,
  engine: null,

  init: async () => {
    const engine = new AudioEngine();
    await engine.init();
    set({ engine });
  },

  play: () => {
    const { engine } = get();
    if (!engine) return;
    engine.play();
    set({ isPlaying: true });
  },

  // ... other actions
}));
```

---

## AI Assistant Integration

### Backend Abstraction

```typescript
// src/lib/ai/ai-client.ts

export interface AIClient {
  id: "cloud" | "local";
  name: string;
  sendMessage(input: AIRequest): Promise<AIResponse>;
  isConfigured(): Promise<boolean>;
}

export interface AIRequest {
  messages: ChatMessage[];
  projectContext?: ProjectContext;
  maxTokens?: number;
}

export interface AIResponse {
  message: string;
  actions?: MusicAction[];
  error?: string;
}

export interface MusicAction {
  type: "updateScene" | "updateTrack" | "updateClip" | "addTrack" | "changeKey";
  target: string; // Path to target
  params: Record<string, any>;
}

export interface ProjectContext {
  currentScene?: Scene;
  projectSnapshot?: Partial<Project>;
}
```

### Cloud Implementation (Anthropic)
```typescript
// src/lib/ai/cloud-client.ts

import Anthropic from '@anthropic-ai/sdk';

export class CloudAIClient implements AIClient {
  readonly id = "cloud";
  readonly name = "Claude (Cloud)";
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async sendMessage(input: AIRequest): Promise<AIResponse> {
    const systemPrompt = this.buildMusicSystemPrompt(input.projectContext);
    
    const response = await this.client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: input.maxTokens || 2048,
      system: systemPrompt,
      messages: input.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    });

    const content = response.content[0].text;
    const actions = this.parseActions(content);

    return {
      message: content,
      actions
    };
  }

  private buildMusicSystemPrompt(context?: ProjectContext): string {
    return `You are a music composition assistant for game audio. You help users create adaptive music by understanding natural language requests and translating them into structured musical changes.

Current project context:
${context ? JSON.stringify(context, null, 2) : "No project loaded"}

When responding:
1. Be conversational and supportive
2. Ask clarifying questions when needed
3. Provide musical recommendations based on common patterns
4. Output structured actions in JSON format when making changes

Available actions: updateScene, updateTrack, updateClip, addTrack, changeKey

Example:
User: "Make this scene more intense"
Response: "I'll increase the density and add more rhythmic complexity. <actions>[{"type":"updateScene","target":"intensity","params":{"value":0.8}},{"type":"updateTrack","target":"drums","params":{"density":0.9}}]</actions>"`;
  }

  private parseActions(content: string): MusicAction[] {
    const match = content.match(/<actions>(.*?)<\/actions>/s);
    if (!match) return [];
    try {
      return JSON.parse(match[1]);
    } catch {
      return [];
    }
  }

  async isConfigured(): Promise<boolean> {
    return !!this.client;
  }
}
```

### Local Implementation (Ollama)
```typescript
// src/lib/ai/local-client.ts

export class LocalAIClient implements AIClient {
  readonly id = "local";
  readonly name = "Local LLM (Ollama)";
  private baseURL: string;
  private model: string;

  constructor(baseURL: string = "http://localhost:11434", model: string = "llama2") {
    this.baseURL = baseURL;
    this.model = model;
  }

  async sendMessage(input: AIRequest): Promise<AIResponse> {
    const systemPrompt = this.buildMusicSystemPrompt(input.projectContext);
    
    const response = await fetch(`${this.baseURL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...input.messages
        ],
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Local LLM error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.message.content;
    const actions = this.parseActions(content);

    return {
      message: content,
      actions
    };
  }

  async isConfigured(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  // ... similar helper methods
}
```

---

## Testing Strategy

### Test Coverage Goals
- **Unit tests:** 60% minimum on critical path (generators, audio engine, state)
- **Integration tests:** Key user flows (create scene, add track, export)
- **E2E tests:** Happy path for main features

### Testing Frameworks
- **Unit:** Vitest (fast, Vite-integrated, Jest-compatible API)
- **Integration:** Vitest + React Testing Library
- **E2E:** Playwright (cross-browser, reliable)

### Required Tests

**For every generator:**
1. Generates valid note sequences
2. Respects length constraints
3. Handles edge cases (empty params, extreme values)
4. Produces musically coherent output

**For every component:**
1. Renders without errors
2. Handles user interactions correctly
3. Updates state appropriately
4. Displays error states

**Example test structure:**
```typescript
// tests/unit/generators/euclidean.test.ts

import { describe, it, expect } from 'vitest';
import { EuclideanGenerator } from '@/lib/generators/euclidean';

describe('EuclideanGenerator', () => {
  const generator = new EuclideanGenerator();

  it('generates correct number of hits', () => {
    const config = {
      type: 'euclidean' as const,
      params: { steps: 16, pulses: 5, rotation: 0, patternRole: 'kick_snare_hat' }
    };
    const context = {
      bpm: 120,
      key: 'C',
      scale: 'major',
      lengthBars: 4
    };

    const result = generator.generate(config, context);
    const hitCount = result.notes.length;
    
    expect(hitCount).toBe(5);
  });

  it('respects length constraint', () => {
    const config = {
      type: 'euclidean' as const,
      params: { steps: 8, pulses: 3, rotation: 0, patternRole: 'bass' }
    };
    const context = { bpm: 140, key: 'G', scale: 'minor', lengthBars: 2 };

    const result = generator.generate(config, context);
    
    expect(result.duration).toBe(2);
    result.notes.forEach(note => {
      expect(note.time).toBeGreaterThanOrEqual(0);
      expect(note.time).toBeLessThan(2);
    });
  });
});
```

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test euclidean

# Watch mode
npm test -- --watch

# UI mode (Vitest UI)
npm run test:ui
```

---

## Code Style & Standards

### Formatting
- **Tool:** Prettier 3.1+
- **Config:** `.prettierrc`
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2
}
```
- **Run:** `npm run format`

### Linting
- **Tool:** ESLint 8+ with TypeScript parser
- **Config:** `.eslintrc.cjs`
- **Run:** `npm run lint`
- **Rules:** Airbnb base + TypeScript recommended + React hooks

### Naming Conventions
- **Variables:** camelCase (`audioEngine`, `currentScene`)
- **Functions:** camelCase (`generatePattern`, `loadScene`)
- **Classes:** PascalCase (`AudioEngine`, `EuclideanGenerator`)
- **Types/Interfaces:** PascalCase (`Scene`, `GeneratorConfig`)
- **Files:** 
  - Components: PascalCase (`SceneEditor.tsx`)
  - Everything else: kebab-case (`audio-engine.ts`)
- **Directories:** kebab-case (`scene-editor`, `ai-client`)
- **Constants:** UPPER_SNAKE_CASE (`DEFAULT_BPM`, `MAX_TRACKS`)

### Code Patterns

**Preferred:**
```typescript
// Early returns for readability
function processScene(scene: Scene | null): void {
  if (!scene) return;
  if (!scene.tracks.length) return;
  
  // Main logic here
}

// Functional style for transformations
const activeScenes = project.scenes.filter(s => s.tracks.length > 0);
const trackNames = scene.tracks.map(t => t.name || `Track ${t.id}`);

// Explicit error handling
try {
  const data = await loadProject(projectId);
  return data;
} catch (error) {
  console.error('Failed to load project:', error);
  throw new Error('Project loading failed');
}
```

**Avoid:**
```typescript
// Deep nesting
function processScene(scene: Scene | null): void {
  if (scene) {
    if (scene.tracks.length > 0) {
      // Deep nested logic
    }
  }
}

// Implicit any types
const data = fetchData(); // What type is data?

// Swallowing errors
try {
  doSomething();
} catch (e) {
  // Silent failure
}
```

### Comments & Documentation

- **JSDoc for public APIs:**
```typescript
/**
 * Generates a musical pattern using Euclidean rhythm algorithm.
 * 
 * @param steps - Total number of steps in the pattern
 * @param pulses - Number of hits/events to distribute
 * @param rotation - Pattern rotation offset (0 = no rotation)
 * @returns Array of 0s and 1s representing hits
 * 
 * @example
 * euclideanRhythm(16, 5, 0) // [1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0]
 */
function euclideanRhythm(steps: number, pulses: number, rotation: number): number[] {
  // Implementation
}
```

- **Inline comments for complex logic only:**
```typescript
// Bjorklund's algorithm: distribute pulses as evenly as possible
const pattern = euclideanRhythm(16, 5, 0);
```

- **No redundant comments:**
```typescript
// ❌ BAD
// Set the BPM to 120
setBPM(120);

// ✅ GOOD (self-documenting code)
setBPM(DEFAULT_BPM);
```

---

## Implementation Order

### Phase 1: Foundation (Week 1-2)
**Priority:** CRITICAL  
**Duration:** 2 weeks

1. **Project setup & tooling**
   - Files to create: `package.json`, `vite.config.ts`, `tsconfig.json`, `.eslintrc.cjs`, `.prettierrc`, `tailwind.config.js`
   - Dependencies: Vite, React, TypeScript, Tailwind, ESLint, Prettier
   - Tests required: None (infrastructure)

2. **Core type definitions**
   - Files: `src/types/project.ts`, `src/types/audio.ts`, `src/types/generator.ts`
   - Dependencies: None
   - Tests: Type safety via TypeScript compiler

3. **Zustand stores skeleton**
   - Files: `src/stores/project-store.ts`, `src/stores/audio-store.ts`, `src/stores/ui-store.ts`
   - Dependencies: zustand
   - Tests: `tests/unit/stores/project-store.test.ts` (basic CRUD)

4. **Audio engine wrapper (basic)**
   - Files: `src/lib/audio/engine.ts`, `src/lib/audio/context.ts`
   - Dependencies: tone
   - Tests: `tests/unit/audio/engine.test.ts` (init, play, stop)

5. **Basic UI shell**
   - Files: `src/App.tsx`, `src/components/ui/Button.tsx`, `src/components/ui/Slider.tsx`
   - Dependencies: @radix-ui/react-*, clsx
   - Tests: `tests/integration/App.test.tsx` (renders without error)

### Phase 2: Core Features (Week 3-5)
**Priority:** HIGH  
**Duration:** 3 weeks

6. **Scene management**
   - Files: `src/lib/scene/scene-manager.ts`, `src/lib/scene/scene-graph.ts`
   - Dependencies: Previous stores
   - Tests: Scene CRUD operations, validation

7. **Euclidean rhythm generator**
   - Files: `src/lib/generators/euclidean.ts`, `src/lib/generators/base-generator.ts`
   - Dependencies: Music theory utils
   - Tests: Pattern generation, edge cases (60% coverage)

8. **Scene editor UI**
   - Files: `src/components/scene/SceneBoard.tsx`, `src/components/scene/SceneCard.tsx`, `src/components/scene/SceneEditor.tsx`
   - Dependencies: Radix UI, audio store
   - Tests: User interactions, state updates

9. **Audio playback integration**
   - Files: Complete `src/lib/audio/scheduler.ts`, hook up generators to Tone.js
   - Dependencies: Audio engine, generators
   - Tests: Play/pause, tempo changes, clip scheduling

10. **JSON export/import**
    - Files: `src/lib/io/serializer.ts`, `src/lib/io/deserializer.ts`, `src/lib/io/file-system.ts`
    - Dependencies: File System Access API
    - Tests: Round-trip serialization, error handling

### Phase 3: AI & Advanced Features (Week 6-8)
**Priority:** MEDIUM  
**Duration:** 3 weeks

11. **AI client abstraction**
    - Files: `src/lib/ai/ai-client.ts`, `src/lib/ai/cloud-client.ts`, `src/lib/ai/local-client.ts`
    - Dependencies: Anthropic SDK, fetch API
    - Tests: Message sending, action parsing

12. **AI chat UI**
    - Files: `src/components/ai/AIChat.tsx`, `src/components/ai/AISetupWizard.tsx`
    - Dependencies: AI client, AI store
    - Tests: User interactions, message history

13. **Microphone pitch detection**
    - Files: `src/lib/audio/pitch-detection.ts`, `src/components/input/MicrophoneInput.tsx`
    - Dependencies: Web Audio API analyser node
    - Tests: Frequency detection accuracy (manual verification)

14. **Arpeggiator generator**
    - Files: `src/lib/generators/arpeggiator.ts`
    - Dependencies: Music theory (scales, chords)
    - Tests: Pattern generation for different modes

15. **Tutorial system**
    - Files: `src/components/tutorial/TutorialOverlay.tsx`, `src/stores/tutorial-store.ts`
    - Dependencies: UI store
    - Tests: Tutorial progression, step completion

### Phase 4: Polish & Launch Prep (Week 9-12)
**Priority:** MEDIUM  
**Duration:** 4 weeks

16. **Strudel pattern DSL integration**
    - Files: `src/lib/generators/pattern-dsl.ts`
    - Dependencies: Strudel library (when available)
    - Tests: Pattern parsing, playback

17. **UI polish & responsiveness**
    - Files: Update all components with refined styling
    - Dependencies: Tailwind utilities
    - Tests: Visual regression tests (optional)

18. **Performance optimization**
    - Files: Memoization, lazy loading, code splitting
    - Dependencies: React.memo, Suspense
    - Tests: Performance benchmarks

19. **Documentation**
    - Files: `README.md`, `docs/architecture.md`, `docs/api.md`
    - Dependencies: None
    - Tests: Documentation completeness

20. **E2E test suite**
    - Files: `tests/e2e/composition-flow.spec.ts`, `tests/e2e/export-flow.spec.ts`
    - Dependencies: Playwright
    - Tests: Critical user paths

---

## AI Agent Instructions

### Setup Commands
```bash
# Initial setup
git clone <repo-url>
cd generative-score-lab

# Install dependencies
npm install

# Run dev server (opens browser automatically)
npm run dev

# Run tests in watch mode
npm test -- --watch
```

### Development Workflow

**For each new feature:**
1. Create feature branch: `git checkout -b feature/euclidean-generator`
2. Implement in this order:
   - Data models (types) first
   - Core business logic (lib/)
   - State management (stores/) if needed
   - React components (components/)
   - Tests (REQUIRED - 60% coverage minimum)
3. Run tests: `npm test euclidean`
4. Format code: `npm run format`
5. Lint: `npm run lint`
6. Commit: `git commit -m "feat: add Euclidean rhythm generator"`

### File Creation Rules

**ALWAYS:**
- Create tests alongside implementation (same PR)
- Follow project structure exactly (see directory tree above)
- Use established patterns (check similar existing files)
- Add proper TypeScript types (no `any` unless absolutely necessary)
- Include JSDoc for public APIs
- Add error handling and validation
- Keep functions small and focused (< 50 lines ideal)

**NEVER:**
- Skip tests (they're not optional)
- Hardcode secrets/API keys (use env vars)
- Create files outside project structure
- Use deprecated dependencies
- Ignore linting errors (fix them)
- Commit commented-out code
- Use `console.log` in production code (use proper logging)

### Critical Files (Do NOT modify without asking)

- `package.json` - Dependency changes must be justified
- `vite.config.ts` - Build configuration
- `tsconfig.json` - TypeScript settings
- `tailwind.config.js` - Design system tokens
- Any file in `src/types/` - Breaking changes impact entire codebase

### Security Requirements

1. **Never commit secrets:**
   - Use `.env` files (add to `.gitignore`)
   - Use environment variables for API keys
   - Example: `VITE_ANTHROPIC_API_KEY` (Vite exposes with `VITE_` prefix)

2. **Validate all user input:**
   - File uploads: check size, type
   - AI responses: parse safely, handle malformed JSON
   - Form inputs: sanitize before processing

3. **Sanitize AI-generated content:**
   - Don't execute AI-generated code directly
   - Validate structure of MusicAction objects
   - Limit action scope to safe operations

### Performance Requirements

1. **Audio latency:** < 50ms for user interactions
2. **UI responsiveness:** Interactions feel instant (< 100ms)
3. **Bundle size:** Initial load < 500KB gzipped
4. **Memory:** Don't leak audio nodes (dispose properly)

### Error Handling Pattern

```typescript
// Async operations
async function loadProject(id: string): Promise<Project> {
  try {
    const response = await fetch(`/api/projects/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return validateProject(data); // Throws if invalid
  } catch (error) {
    // Log error for debugging
    console.error('Failed to load project:', error);
    
    // Re-throw with user-friendly message
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to load project. Please try again.'
    );
  }
}

// Sync operations with expected failures
function parseGeneratorConfig(json: string): GeneratorConfig | null {
  try {
    const parsed = JSON.parse(json);
    return validateGeneratorConfig(parsed);
  } catch (error) {
    console.warn('Invalid generator config:', error);
    return null; // Caller handles null
  }
}

// User-facing errors
function addTrack(sceneId: string, track: Track): void {
  if (!validateTrack(track)) {
    throw new UserFacingError('Invalid track: missing required fields');
  }
  // ... proceed
}

class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserFacingError';
  }
}
```

---

## Environment Configuration

### Required Environment Variables
```bash
# AI Assistant (optional, defaults to disabled)
VITE_ANTHROPIC_API_KEY=sk-ant-...          # Cloud AI (Anthropic)
VITE_LOCAL_LLM_URL=http://localhost:11434  # Local AI (Ollama)

# Feature flags (optional)
VITE_ENABLE_STRUDEL=false                  # Enable Strudel DSL generator
VITE_ENABLE_MAGENTA=false                  # Enable Magenta ML models (future)

# Analytics (optional, for future)
VITE_ANALYTICS_ID=                         # Plausible/Simple Analytics ID
```

### Local Development Setup
```bash
# Copy template
cp .env.example .env

# Fill in values:
# 1. Get Anthropic API key from https://console.anthropic.com
# 2. Set up Ollama locally or leave blank to skip
# 3. Set feature flags based on what you want to test
```

### Environment-Specific Settings

**Development:**
- Hot reload enabled
- Source maps enabled
- Verbose logging
- Mock data available

**Production:**
- Minified bundle
- No source maps
- Error tracking enabled
- Analytics enabled (if configured)

---

## Deployment

### Build Process
```bash
# Production build
npm run build

# Output: dist/ folder with optimized static files
# Size target: < 2MB total (uncompressed)
```

### Pre-Deployment Checklist
- [ ] All tests passing (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Environment variables configured (if using cloud features)
- [ ] Build completes without warnings
- [ ] Manual smoke test in production build (`npm run preview`)

### Deployment Command

**Local testing:**
```bash
npm run build
npm run preview  # Serves production build locally
```

**Static hosting (future):**
```bash
# Netlify
netlify deploy --prod

# Vercel
vercel --prod

# GitHub Pages
npm run build
gh-pages -d dist
```

### Rollback Procedure
Since this is static hosting:
1. Revert Git commit
2. Rebuild: `npm run build`
3. Redeploy

---

## Troubleshooting

### Common Issues

**Issue:** Audio doesn't play  
**Solution:** 
1. Check if `AudioContext` is started (requires user interaction)
2. Call `await audioEngine.init()` on user click
3. Verify browser supports Web Audio API
4. Check browser console for errors

**Issue:** Microphone not working  
**Solution:**
1. Ensure HTTPS (microphone requires secure context)
2. Check browser permissions
3. Verify `navigator.mediaDevices.getUserMedia` is available
4. Test in Chrome/Firefox/Safari (not all browsers equal)

**Issue:** AI assistant not responding  
**Solution:**
1. Check API key is set in `.env`
2. Verify network connectivity
3. Check browser console for errors
4. For local mode, ensure Ollama is running: `curl http://localhost:11434/api/tags`

**Issue:** State not persisting  
**Solution:**
1. Check localStorage is available
2. Verify Zustand persist middleware is configured
3. Check browser privacy settings (some block localStorage)

### Debugging Commands
```bash
# Check dependency versions
npm list tone zustand

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Run specific test with debug output
npm test -- euclidean --reporter=verbose

# Type checking only
npm run type-check

# Build with analysis
npm run build -- --mode analyze
```

---

## Dependencies

### Production Dependencies
```json
{
  "tone": "^15.0.4",
  "zustand": "^4.4.7",
  "@radix-ui/react-dialog": "^1.0.5",
  "@radix-ui/react-slider": "^1.1.2",
  "@radix-ui/react-select": "^2.0.0",
  "@radix-ui/react-checkbox": "^1.0.4",
  "@anthropic-ai/sdk": "^0.27.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.1.0"
}
```

### Development Dependencies
```json
{
  "vite": "^5.0.8",
  "typescript": "^5.3.3",
  "@vitejs/plugin-react": "^4.2.1",
  "tailwindcss": "^3.4.0",
  "autoprefixer": "^10.4.16",
  "postcss": "^8.4.32",
  "eslint": "^8.56.0",
  "prettier": "^3.1.1",
  "vitest": "^1.1.0",
  "@testing-library/react": "^14.1.2",
  "playwright": "^1.40.1"
}
```

### Dependency Update Policy

- **Major updates:** Require explicit approval and testing
- **Minor updates:** Review changelog, update if safe
- **Patch updates:** Auto-update weekly
- **Security updates:** Apply immediately

**Before updating:**
1. Check breaking changes in changelog
2. Run full test suite
3. Test audio playback manually
4. Check bundle size impact

---

## Additional Resources

**Documentation:**
- [Tone.js Docs](https://tonejs.github.io/)
- [Zustand Guide](https://github.com/pmndrs/zustand)
- [Radix UI Components](https://www.radix-ui.com/primitives)
- [Tailwind CSS](https://tailwindcss.com/docs)

**Music Theory:**
- [Euclidean Rhythms Explained](https://medium.com/code-music-noise/euclidean-rhythms-391d879494df)
- [Strudel Pattern Language](https://strudel.tidalcycles.org/)
- [Web Audio API Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

**AI Integration:**
- [Anthropic API Docs](https://docs.anthropic.com/)
- [Ollama API Docs](https://github.com/ollama/ollama/blob/main/docs/api.md)

**Community:**
- GitHub Discussions (future)
- Discord server (future)

---

## Game Engine Integration Examples

### Unity Integration
```csharp
// Unity C# example
using System.IO;
using UnityEngine;

public class GenerativeScoreLoader : MonoBehaviour {
    [SerializeField] private string projectJsonPath;
    private ProjectData project;

    void Start() {
        string json = File.ReadAllText(projectJsonPath);
        project = JsonUtility.FromJson<ProjectData>(json);
        
        // Load initial scene
        LoadScene(project.scenes[0]);
    }

    void LoadScene(SceneData scene) {
        // Apply scene parameters to Unity audio system
        // Map game variables to scene.mappings
    }
}

[System.Serializable]
public class ProjectData {
    public string projectId;
    public string name;
    public float bpm;
    public SceneData[] scenes;
}
```

### Godot Integration
```gdscript
# Godot GDScript example
extends Node

var project_data: Dictionary
var current_scene: Dictionary

func _ready():
    var file = File.new()
    file.open("res://music/project.json", File.READ)
    var json = file.get_as_text()
    file.close()
    
    project_data = JSON.parse(json).result
    load_scene(project_data.scenes[0])

func load_scene(scene: Dictionary):
    # Apply scene parameters
    # Connect game variables to mappings
    pass
```

### Web Game Integration
```typescript
// JavaScript/TypeScript web game example
import projectData from './music/project.json';

class MusicSystem {
  private project: Project;
  private currentScene: Scene;

  async init() {
    this.project = projectData;
    await this.loadScene(this.project.scenes[0]);
  }

  async loadScene(scene: Scene) {
    // Use Tone.js to recreate audio playback
    // Apply scene parameters
  }

  updateGameState(variables: Record<string, number>) {
    // Apply mappings: gameVariable -> sceneParameter
    scene.mappings.forEach(mapping => {
      const value = this.mapValue(
        variables[mapping.source],
        mapping.inputRange,
        mapping.outputRange,
        mapping.curve
      );
      this.applyParameter(mapping.target, value);
    });
  }
}
```

---

**This document is the single source of truth for implementation.**  
**All technical decisions, patterns, and requirements are defined here.**

**For AI Coding Agents:** Start with Phase 1, Task 1. Follow implementation order strictly. Test everything. Ask for clarification if any requirement is ambiguous.

**Last Updated:** November 17, 2025
