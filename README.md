# 🎵 Generative Score Lab

An AI-powered music composition tool for creating adaptive game soundtracks using generative algorithms and intelligent AI assistance.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Tests](https://img.shields.io/badge/tests-32%20passing-brightgreen)

## ✨ Features

- **🎼 Scene-Based Composition**: Organize your music into scenes representing different game states
- **🤖 AI Assistant**: Get intelligent suggestions and automated composition help using OpenRouter, Minimax, GLM, or local Ollama
- **🎹 Multiple Music Generators**:
  - **Euclidean Rhythms**: Create perfectly distributed rhythmic patterns using Bjorklund's algorithm
  - **Arpeggiator**: Generate melodic arpeggios with various modes (up, down, up-down, random)
  - **Markov Chains**: Produce musical sequences based on probability models
  - **Random Walk**: Create organic melodies with controlled randomness
- **🎚️ Track-Based Workflow**: Multiple tracks per scene (drums, bass, pads, leads, fx)
- **🎧 Real-Time Playback**: Hear your compositions instantly with Web Audio API
- **💾 MIDI Export**: Export scenes or individual tracks as MIDI files for use in DAWs
- **📤 Project Export/Import**: Save and load entire projects as JSON
- **⌨️ Keyboard Shortcuts**: Efficient workflow with comprehensive keyboard controls
- **📚 Interactive Tutorial**: Learn the tool with step-by-step guided tutorials
- **🎨 Modern UI**: Clean, intuitive interface built with React and Tailwind CSS

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/generative-score-lab.git
cd generative-score-lab

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📖 Usage Guide

### Getting Started

1. **Create a Scene**: Click "+ Create Scene" on the scene board
2. **Add Tracks**: In the scene editor, click "+ Bass", "+ Drums", etc. to add tracks
3. **Add Clips**: Expand a track and click "+ Add Clip" to create a musical clip
4. **Choose Generator**: Select from Euclidean, Arpeggiator, Markov, or Random Walk
5. **Configure & Play**: Adjust generator parameters and hit Play to hear your music
6. **Export**: Use Ctrl/Cmd+E to export as MIDI or Ctrl/Cmd+S to save your project

### AI Assistant Setup

1. Click the AI chat icon (🤖) or press Ctrl/Cmd+K
2. Click the settings icon (⚙️) to configure your AI backend:
   - **OpenRouter**: Requires API key and model selection
   - **Minimax M2**: Requires API key and group ID
   - **GLM 4.6**: Requires API key
   - **Ollama**: Requires local Ollama installation (no API key needed)

### Music Generators

#### Euclidean Rhythm Generator
Creates evenly-distributed rhythmic patterns using the Bjorklund algorithm.

**Parameters:**
- `steps`: Total number of steps in the pattern (e.g., 16)
- `pulses`: Number of active hits (e.g., 4)
- `rotation`: Rotate the pattern by N steps
- `patternRole`: kick, snare, hihat, or perc

**Example**: Euclidean(5, 8) creates the pattern: `X..X..X.X..` (5 hits distributed across 8 steps)

#### Arpeggiator Generator
Generates arpeggiated note patterns based on scale degrees.

**Parameters:**
- `mode`: up, down, upDown, or random
- `notesPerBeat`: Arpeggio speed (2, 4, 8, etc.)
- `octaveRange`: Number of octaves to span (1-4)
- `followChordProgression`: Follow chord changes (future feature)

#### Markov Chain Generator
Creates melodic sequences using probability-based note transitions.

**Parameters:**
- `order`: Markov chain order (1 or 2)
- `length`: Number of notes to generate

#### Random Walk Generator
Produces organic melodies by taking random steps up or down in the scale.

**Parameters:**
- `stepSize`: Maximum interval size for each step
- `stayInScale`: Constrain notes to the current scale
- `length`: Number of notes to generate

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space` | Play/Pause (in Scene Editor) |
| `Escape` | Stop playback or close dialog |
| `Ctrl/Cmd + S` | Export Project |
| `Ctrl/Cmd + K` | Toggle AI Chat |
| `Ctrl/Cmd + /` | Toggle AI Chat (alternate) |
| `Ctrl/Cmd + E` | Export Scene as MIDI |
| `?` | Show Keyboard Shortcuts Help |

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- **React 18.3+**: UI framework
- **TypeScript 5.6+**: Type safety
- **Vite 6.0+**: Build tool and dev server
- **Tailwind CSS 3.4+**: Styling
- **Zustand 4.5+**: State management with persistence

**Audio & Music:**
- **Tone.js 15.0+**: Web Audio API wrapper for playback
- **@tonejs/midi**: MIDI file generation and export

**UI Components:**
- **Radix UI**: Accessible primitive components (Dialog, Select, Slider, Checkbox)

**AI Integration:**
- OpenRouter API
- Minimax M2 API
- GLM 4.6 API
- Ollama local LLM

**Testing:**
- **Vitest 2.1+**: Unit testing framework
- **@testing-library/react**: Component testing utilities

### Project Structure

```
src/
├── components/        # React components
│   ├── ai/           # AI chat and setup
│   ├── project/      # Project export/import
│   ├── scene/        # Scene and track components
│   ├── tutorial/     # Tutorial system
│   └── ui/           # Reusable UI components
├── lib/              # Core library code
│   ├── ai/           # AI client implementations
│   ├── audio/        # Audio engine and pitch detection
│   ├── errors/       # Error handling
│   ├── generators/   # Music generation algorithms
│   ├── io/           # File I/O (JSON, MIDI)
│   ├── theory/       # Music theory utilities
│   └── utils/        # Helper functions
├── stores/           # Zustand state stores
├── styles/           # Global styles
└── types/            # TypeScript type definitions

tests/
├── unit/             # Unit tests
├── integration/      # Integration tests
└── e2e/              # End-to-end tests
```

### State Management

The application uses Zustand for state management with the following stores:

- **projectStore**: Manages scenes, tracks, clips, and project data
- **audioStore**: Controls audio playback state
- **aiStore**: Manages AI chat messages and configuration
- **tutorialStore**: Tracks tutorial progress and state
- **uiStore**: Controls UI state (AI chat open/closed, etc.)

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run only unit tests
npm test tests/unit/
```

### Test Coverage

- ✅ **Music Generators**: 32 passing tests
  - Euclidean Generator (7 tests)
  - Arpeggiator Generator (8 tests)
  - Markov Generator (8 tests)
  - Random Walk Generator (9 tests)

## 🎓 Music Theory Background

### Scales
The tool supports major and minor scales, with notes constrained to scale degrees for musical coherence.

### Euclidean Rhythms
Based on Bjorklund's algorithm, Euclidean rhythms create maximally even distributions of beats. They appear in many traditional music forms worldwide:
- `E(3,8)`: Common rock/pop pattern
- `E(5,8)`: Cuban tresillo
- `E(5,12)`: Common South Indian rhythm

### Markov Chains
Markov chains model musical transitions probabilistically, where the next note depends on the previous note(s). Order-1 chains consider the last note, order-2 chains consider the last two notes.

## 🛠️ Development

### Prerequisites for Development

```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Run linting (if configured)
npm run lint
```

### Building from Source

```bash
# Development build
npm run dev

# Production build
npm run build

# Type check only
npm run type-check
```

### Adding a New Generator

1. Create a new generator class in `src/lib/generators/`
2. Implement the `Generator` interface
3. Register in `src/lib/generators/factory.ts`
4. Add tests in `tests/unit/your-generator.test.ts`
5. Update type definitions in `src/types/index.ts`

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for new functionality
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test additions or changes
- `refactor:` Code refactoring
- `style:` Code style changes (formatting, etc.)
- `chore:` Build process or auxiliary tool changes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tone.js** - Web Audio framework
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first CSS framework
- **Bjorklund Algorithm** - Euclidean rhythm generation
- **OpenRouter, Minimax, GLM, Ollama** - AI integration partners

## 📬 Support

- 📧 Email: support@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/generative-score-lab/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/generative-score-lab/discussions)

## 🗺️ Roadmap

- [ ] MIDI input support
- [ ] Chord progression system
- [ ] More scale modes (Dorian, Phrygian, etc.)
- [ ] Custom instrument samples
- [ ] VST plugin export
- [ ] Collaborative editing
- [ ] Cloud save/sync

---

Made with ❤️ by the Generative Score Lab team
