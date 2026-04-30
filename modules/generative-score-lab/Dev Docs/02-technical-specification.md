# Generative Score Lab - Technical Specification

**FOR AI CODING AGENT:** This is your primary implementation guide.  
**Generated:** November 17, 2025  
**Version:** 1.0.0  
**Last Verified:** November 17, 2025 (against codebase v1.0.0)

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
│  │ Generators │  │ Audio      │  │ File     │  │  AI    │  │
│  │ & Scene    │  │ Engine     │  │ System   │  │ Client │  │
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
│   │   │   ├── TrackRow.tsx      # Individual track row with controls
│   │   │   └── ClipList.tsx      # Clip list and management
│   │   │
│   │   │
│   │   ├── ai/                   # AI assistant components
│   │   │   ├── AIChat.tsx        # Main chat interface
│   │   │   └── AISetupWizard.tsx # First-run AI configuration
│   │   │
│   │   ├── project/               # Project management components
│   │   │   ├── ExportDialog.tsx  # Project JSON export
│   │   │   └── MidiExportDialog.tsx # MIDI export dialog
│   │   │
│   │   ├── voice/                 # Voice input components
│   │   │   └── VoiceCaptureDialog.tsx
│   │   │
│   │   └── tutorial/              # Tutorial system
│   │       ├── TutorialOverlay.tsx
│   │       └── tutorial-steps.ts  # Tutorial step definitions
│   │
│   │   └── ErrorBoundary.tsx     # React error boundary component
│   │
│   ├── lib/                      # Core business logic (framework-agnostic)
│   │   ├── audio/                # Audio engine wrapper
│   │   │   ├── engine.ts         # Main audio engine class
│   │   │   └── pitch-detection.ts # Pitch detection for voice input
│   │   │
│   │   ├── generators/           # Music generation algorithms
│   │   │   ├── euclidean.ts      # Euclidean rhythm generator
│   │   │   ├── arpeggiator.ts    # Arpeggiator
│   │   │   ├── pattern-dsl.ts    # Pattern DSL (Strudel integration)
│   │   │   ├── markov.ts         # Markov chain generator
│   │   │   ├── random-walk.ts    # Random walk melody generator
│   │   │   └── base-generator.ts # Abstract generator interface
│   │   │
│   │   ├── ai/                   # AI assistant integration
│   │   │   ├── ai-service.ts     # AI service wrapper
│   │   │   ├── openrouter-client.ts # OpenRouter API client
│   │   │   ├── minimax-client.ts # Minimax API client
│   │   │   ├── glm-client.ts     # GLM API client
│   │   │   ├── local-client.ts   # Local LLM client (Ollama)
│   │   │   ├── prompt-builder.ts # System prompts for music context
│   │   │   ├── intent-parser.ts  # Parse AI responses into actions
│   │   │   └── index.ts          # AI client factory and exports
│   │   │
│   │   ├── io/                   # Import/export
│   │   │   ├── serializer.ts     # JSON serialization
│   │   │   ├── deserializer.ts   # JSON parsing & validation
│   │   │   ├── file-system.ts    # File System Access API wrapper
│   │   │   └── midi-export.ts    # MIDI file export functionality
│   │   │
│   │   ├── errors/               # Error handling
│   │   │   └── error-handler.ts  # Centralized error handling system
│   │   │
│   │   ├── theory/               # Music theory utilities
│   │   │   ├── scales.ts         # Scale definitions & calculations
│   │   │   └── chords.ts         # Chord definitions & generation
│   │   │
│   │   └── utils/                # Shared utilities
│   │       ├── time.ts           # Time conversion (bars/beats/seconds)
│   │       ├── math.ts           # Mathematical helpers
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
│   │   └── useKeyboardShortcuts.ts # Keyboard shortcuts handling
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
│   └── unit/                     # Unit tests (*.test.ts)
│       ├── euclidean.test.ts
│       ├── arpeggiator.test.ts
│       ├── markov.test.ts
│       └── random-walk.test.ts
│
├── src/
│   └── test/                     # Test setup
│       └── setup.ts              # Vitest configuration
│
├── Dev Docs/                     # Development documentation
│   ├── 01-executive-summary.md
│   ├── 02-technical-specification.md
│   ├── 03-product-requirements.md
│   ├── 04-roadmap.md
│   └── 05-future-expansions.md
│
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── index.html
├── README.md
├── TECHNICAL_DEBT.md            # Technical debt tracking
├── PROGRESS.md                   # Development progress
└── PERFORMANCE_REPORT.md         # Performance metrics
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

### AI Client Implementation

The application supports multiple AI providers through a unified interface:

**Supported Providers:**
1. **OpenRouter** - Access to multiple models including Claude, GPT-4, etc.
2. **Minimax** - Minimax M2 API
3. **GLM** - GLM 4.6 API
4. **Ollama** - Local LLM (runs on user's machine)

**Implementation Pattern:**
```typescript
// src/lib/ai/index.ts

export function createAIClient(config: AIConfig): AIClient {
  switch (config.provider) {
    case 'openrouter':
      return new OpenRouterClient(config);
    case 'minimax':
      return new MinimaxClient(config);
    case 'glm':
      return new GLMClient(config);
    case 'local':
      return new LocalAIClient(config);
  }
}
```

Each client implements the `AIClient` interface:
- `sendMessage()` - Send chat messages and receive responses
- `isConfigured()` - Check if client is properly configured
- Provider-specific configuration (API keys, model selection, etc.)

**OpenRouter Client Example:**
```typescript
// src/lib/ai/openrouter-client.ts

export class OpenRouterClient implements AIClient {
  readonly id = "openrouter";
  readonly name = "OpenRouter";
  
  async sendMessage(input: AIRequest): Promise<AIResponse> {
    // Uses OpenRouter API to access multiple models
    // Default model: anthropic/claude-3.5-sonnet
  }
}
```

**Local Client (Ollama) Example:**
```typescript
// src/lib/ai/local-client.ts

export class LocalAIClient implements AIClient {
  readonly id = "local";
  readonly name = "Local LLM (Ollama)";
  
  constructor(baseURL: string = "http://localhost:11434", model: string = "llama3.1") {
    // Connects to local Ollama instance
  }
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

## Implementation Status

**Current State:** MVP ~90% Complete (as of November 17, 2025)

### Completed Features

**Core Infrastructure:**
- ✅ Project setup (Vite, React, TypeScript, Tailwind)
- ✅ Type system and Zustand stores
- ✅ Audio engine foundation (Tone.js wrapper)
- ✅ Error handling system (`src/lib/errors/error-handler.ts`)

**UI Components:**
- ✅ Scene board and scene cards
- ✅ Scene editor with track management
- ✅ Track rows and clip lists
- ✅ AI chat interface and setup wizard
- ✅ Export dialogs (JSON and MIDI)
- ✅ Tutorial overlay system
- ✅ Voice capture dialog UI
- ✅ Error boundary and notifications

**Music Generation:**
- ✅ Euclidean rhythm generator (fully tested)
- ✅ Arpeggiator generator (fully tested)
- ✅ Markov chain generator (fully tested)
- ✅ Random walk generator (fully tested)
- ✅ Generator factory pattern

**AI Integration:**
- ✅ OpenRouter client implementation
- ✅ Minimax client implementation
- ✅ GLM client implementation
- ✅ Ollama local client implementation
- ✅ AI service wrapper
- ✅ Intent parser and prompt builder

**Export/Import:**
- ✅ JSON project export/import
- ✅ MIDI export functionality (`src/lib/io/midi-export.ts`)

**Additional Features:**
- ✅ Keyboard shortcuts system
- ✅ Tutorial system with step definitions

### Partially Implemented

- ⏳ Voice capture: UI exists but pitch detection not fully integrated
- ⏳ Some technical debt items (see `TECHNICAL_DEBT.md`)

### Known Gaps & Technical Debt

See `TECHNICAL_DEBT.md` and `PROGRESS.md` for detailed status:
- Modal dialogs: Some alerts/confirms still need conversion
- Console statements: Need centralized error handler usage
- Type safety: 32 'any' type usages to address
- Bundle size: Code splitting needed (currently 570KB)
- Test coverage: Only generators have comprehensive tests

### File Structure Notes

**Actual vs Documented Differences:**
- Scene management logic is in `project-store.ts` (not separate `scene-manager.ts`)
- Generator UI is integrated into scene components (no separate `generators/` UI folder)
- MIDI export exists as `midi-export.ts` (not in `formats/` subfolder)
- Error handling system exists but wasn't originally documented

**For detailed progress tracking, see:**
- `PROGRESS.md` - Current development status
- `TECHNICAL_DEBT.md` - Known issues and improvements needed
- `PERFORMANCE_REPORT.md` - Performance metrics and optimization notes

**Related Documentation:**
- See `01-executive-summary.md` for high-level overview
- See `03-product-requirements.md` for feature specifications
- See `04-roadmap.md` for development timeline

---

## Implementation Order

### Phase 1: Foundation (Week 1-2) ✅ COMPLETE
**Priority:** CRITICAL  
**Duration:** 2 weeks

1. **Project setup & tooling** ✅
   - Files created: `package.json`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `tailwind.config.js`, `postcss.config.js`
   - Dependencies: Vite, React, TypeScript, Tailwind, ESLint
   - Tests required: None (infrastructure)

2. **Core type definitions** ✅
   - Files: `src/types/project.ts`, `src/types/audio.ts`, `src/types/generator.ts`, `src/types/ai.ts`, `src/types/ui.ts`
   - Dependencies: None
   - Tests: Type safety via TypeScript compiler

3. **Zustand stores skeleton** ✅
   - Files: `src/stores/project-store.ts`, `src/stores/audio-store.ts`, `src/stores/ui-store.ts`, `src/stores/ai-store.ts`, `src/stores/tutorial-store.ts`
   - Dependencies: zustand
   - Tests: Basic CRUD operations (manual testing)

4. **Audio engine wrapper (basic)** ✅
   - Files: `src/lib/audio/engine.ts`
   - Dependencies: tone
   - Tests: Manual testing (init, play, stop)

5. **Basic UI shell** ✅
   - Files: `src/App.tsx`, `src/components/ui/Button.tsx`, `src/components/ui/Slider.tsx`, `src/components/ui/Dialog.tsx`, `src/components/ui/Select.tsx`, etc.
   - Dependencies: @radix-ui/react-*, clsx
   - Tests: Manual testing (renders without error)

### Phase 2: Core Features (Week 3-5) ✅ COMPLETE
**Priority:** HIGH  
**Duration:** 3 weeks

6. **Scene management** ✅
   - Files: Scene management logic integrated into `src/stores/project-store.ts`
   - Note: Originally planned as separate `scene-manager.ts` and `scene-graph.ts`, but implemented directly in store
   - Dependencies: Previous stores
   - Tests: Scene CRUD operations, validation (manual testing)

7. **Euclidean rhythm generator** ✅
   - Files: `src/lib/generators/euclidean.ts`, `src/lib/generators/base-generator.ts`, `src/lib/generators/factory.ts`
   - Dependencies: Music theory utils
   - Tests: Pattern generation, edge cases (7 tests, comprehensive coverage)

8. **Scene editor UI** ✅
   - Files: `src/components/scene/SceneBoard.tsx`, `src/components/scene/SceneCard.tsx`, `src/components/scene/SceneEditor.tsx`, `src/components/scene/TrackList.tsx`, `src/components/scene/TrackRow.tsx`, `src/components/scene/ClipList.tsx`
   - Dependencies: Radix UI, audio store
   - Tests: User interactions, state updates (manual testing)

9. **Audio playback integration** ✅ COMPLETE
   - Files: `src/lib/audio/engine.ts` (scheduling integrated into engine)
   - Dependencies: Audio engine, generators
   - Tests: Play/pause, tempo changes, clip scheduling

10. **JSON export/import** ✅ COMPLETE
    - Files: `src/lib/io/serializer.ts`, `src/lib/io/deserializer.ts`, `src/lib/io/file-system.ts`
    - Additional: `src/lib/io/midi-export.ts` (MIDI export also implemented)
    - Dependencies: File System Access API
    - Tests: Round-trip serialization, error handling

### Phase 3: AI & Advanced Features (Week 6-8) ✅ MOSTLY COMPLETE
**Priority:** MEDIUM  
**Duration:** 3 weeks

11. **AI client abstraction** ✅ COMPLETE
    - Files: `src/lib/ai/ai-service.ts`, `src/lib/ai/openrouter-client.ts`, `src/lib/ai/minimax-client.ts`, `src/lib/ai/glm-client.ts`, `src/lib/ai/local-client.ts`
    - Dependencies: Fetch API (no Anthropic SDK - using OpenRouter/Minimax/GLM instead)
    - Tests: Message sending, action parsing

12. **AI chat UI** ✅ COMPLETE
    - Files: `src/components/ai/AIChat.tsx`, `src/components/ai/AISetupWizard.tsx`
    - Dependencies: AI client, AI store
    - Tests: User interactions, message history (manual testing)

13. **Microphone pitch detection** ⏳ PARTIAL
    - Files: `src/lib/audio/pitch-detection.ts` (exists), `src/components/voice/VoiceCaptureDialog.tsx` (UI exists)
    - Status: Pitch detection class exists but not fully integrated with voice capture UI
    - Note: Originally planned as `src/components/input/MicrophoneInput.tsx` and `src/components/input/PitchDetector.tsx`, but implemented as `VoiceCaptureDialog.tsx` and `pitch-detection.ts`
    - Dependencies: Web Audio API analyser node
    - Tests: Frequency detection accuracy (manual verification)

14. **Arpeggiator generator** ✅ COMPLETE
   - Files: `src/lib/generators/arpeggiator.ts`
   - Dependencies: Music theory (scales, chords)
   - Tests: Pattern generation for different modes (8 tests)

15. **Tutorial system** ✅ COMPLETE
   - Files: `src/components/tutorial/TutorialOverlay.tsx`, `src/components/tutorial/tutorial-steps.ts`, `src/stores/tutorial-store.ts`
   - Dependencies: UI store
   - Tests: Tutorial progression, step completion (manual testing)

### Phase 4: Polish & Launch Prep (Week 9-12) ⏳ IN PROGRESS
**Priority:** MEDIUM  
**Duration:** 4 weeks

16. **Strudel pattern DSL integration** ⏳ NOT STARTED
   - Files: `src/lib/generators/pattern-dsl.ts` (not yet created)
   - Dependencies: Strudel library (when available)
   - Tests: Pattern parsing, playback

17. **UI polish & responsiveness** ⏳ PARTIAL
   - Files: Components have basic styling, some polish needed
   - Dependencies: Tailwind utilities
   - Tests: Visual regression tests (optional, not implemented)

18. **Performance optimization** ⏳ PARTIAL
   - Files: Some optimizations done, code splitting needed (see TECHNICAL_DEBT.md)
   - Dependencies: React.memo, Suspense
   - Tests: Performance benchmarks (see PERFORMANCE_REPORT.md)

19. **Documentation** ✅ COMPLETE
   - Files: `README.md`, `Dev Docs/` folder with comprehensive documentation
   - Dependencies: None
   - Tests: Documentation completeness (this update)

20. **E2E test suite** ⏳ NOT STARTED
   - Files: `tests/e2e/` folder not yet created
   - Dependencies: Playwright (not yet installed)
   - Tests: Critical user paths (not yet implemented)

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
# Note: API keys are stored in browser localStorage, not environment variables
# These are examples for reference only

# OpenRouter (primary cloud provider)
# Get key from: https://openrouter.ai/keys
# VITE_OPENROUTER_API_KEY=sk-or-...

# Minimax (alternative cloud provider)
# Get key from: https://platform.minimax.chat/
# VITE_MINIMAX_API_KEY=...
# VITE_MINIMAX_GROUP_ID=...

# GLM (alternative cloud provider)
# Get key from: https://open.bigmodel.cn/
# VITE_GLM_API_KEY=...

# Local LLM (Ollama) - no API key needed
# VITE_LOCAL_LLM_URL=http://localhost:11434  # Default Ollama URL

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
# 1. Get API key from your chosen provider:
#    - OpenRouter: https://openrouter.ai/keys
#    - Minimax: https://platform.minimax.chat/
#    - GLM: https://open.bigmodel.cn/
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
  "@tonejs/midi": "^2.0.28",
  "zustand": "^4.5.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.27.0",
  "@radix-ui/react-dialog": "^1.1.2",
  "@radix-ui/react-slider": "^1.2.1",
  "@radix-ui/react-select": "^2.1.2",
  "@radix-ui/react-checkbox": "^1.1.2",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.5.4"
}
```

### Development Dependencies
```json
{
  "vite": "^6.0.1",
  "typescript": "^5.6.3",
  "@vitejs/plugin-react": "^4.3.3",
  "tailwindcss": "^3.4.15",
  "autoprefixer": "^10.4.20",
  "postcss": "^8.4.49",
  "eslint": "^9.14.0",
  "prettier": "^3.3.3",
  "vitest": "^2.1.5",
  "@testing-library/react": "^16.0.1",
  "@testing-library/jest-dom": "^6.6.3",
  "@vitest/ui": "^2.1.5",
  "jsdom": "^25.0.1"
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
- [OpenRouter API Docs](https://openrouter.ai/docs)
- [Minimax API Docs](https://platform.minimax.chat/document/en)
- [GLM API Docs](https://open.bigmodel.cn/dev/api)
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

**For AI Coding Agents:** 
- Most MVP features are complete (~90%)
- See "Implementation Status" section above for current state
- Focus remaining work on: voice capture integration, technical debt, test coverage expansion
- Reference `TECHNICAL_DEBT.md` for known issues
- Reference `PROGRESS.md` for detailed progress tracking

**Last Updated:** November 17, 2025  
**Last Verified:** November 17, 2025 (against codebase v1.0.0)
