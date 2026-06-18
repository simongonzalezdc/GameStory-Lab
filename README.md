# GameStory Lab

**AI-assisted game design document (GDD) generator for indie developers — generate mechanics, write lore, validate consistency, and export complete documentation packages.**

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg)](https://www.typescriptlang.org/)

---

## Table of Contents

- [What Is This?](#what-is-this)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [FAQ](#faq)
- [Contributing](#contributing)
- [Documentation](#documentation)
- [License](#license)

---

## What Is This?

GameStory Lab is a local web application that helps indie game developers turn an idea into a professional game design document. You start from mechanics or from lore — the AI adapts — and it generates concepts, runs 26 consistency-validation rules across 6 categories, blends genres from 15 templates, and exports a GDD, pitch deck, or technical spec as markdown. An AI Model Orchestrator routes work across cloud providers (OpenRouter, Google Gemini) and free local models (Ollama), automatically falling back to local models to keep API costs down. It runs on your own machine with PostgreSQL and Redis.

**Stack:** React 19 + Vite + TypeScript (frontend) · Node.js + Express (backend) · Prisma 6 ORM · PostgreSQL 17 (JSONB) · Redis 7 + BullMQ · OpenRouter + Google Gemini + Ollama for AI · npm workspaces monorepo.

---

## Features

- **AI-Powered Content Generation** — Generate game mechanics, lore, titles, and iterative refinements powered by multiple AI providers.
- **26-Rule Consistency Validation** — A validation engine scores coherence across mechanics–lore alignment, world physics, progression, narrative, genre conventions, and technical feasibility.
- **Genre Blending** — Choose from 15 genre templates and blend multiple genres into a single cohesive concept.
- **Multiple Export Formats** — Export your design as a GDD, pitch deck, or technical specification in markdown.
- **AI Model Orchestrator** — Automatically routes tasks across OpenRouter, Google Gemini, and local Ollama models, with graceful fallback to save API costs.
- **AI Project Architect** — Turn a finished concept into a full AI-agent-ready documentation package (executive summary, technical spec, requirements, roadmap) via a structured interview.
- **Version History** — Iterative refinement with full version tracking for all generated content.
- **Local-First** — Runs entirely on your machine; cloud API keys are optional when using Ollama.
- **Monorepo Architecture** — Clean npm workspaces structure with shared types across `frontend`, `backend`, and `shared` packages.

---

## Installation

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | ≥ 22.0.0 |
| npm | ≥ 10.0.0 |
| Docker + Docker Compose | Latest |

**Optional:**
- [Ollama](https://ollama.com/) — for free local AI models (no API key required)
- [OpenRouter API key](https://openrouter.ai/) — for cloud AI models
- [Google Gemini API key](https://ai.google.dev/) — for Gemini models

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/Pastorsimon1798/GameStory-Lab.git
cd GameStory-Lab

# 2. Install dependencies (npm workspaces monorepo)
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and add your API keys (all optional if using Ollama)

# 4. Start infrastructure (PostgreSQL 17 + Redis 7)
docker-compose up -d

# 5. Initialize the database
cd packages/backend
npx prisma migrate dev
npx prisma generate
cd ../..

# 6. Start the application
npm run dev
```

`npm run dev` starts both the backend and frontend via [concurrently](https://github.com/open-cli-tools/concurrently). You can also run them independently:

```bash
npm run dev -w packages/backend
npm run dev -w packages/frontend
```

---

## Quick Start

Once running:

| Service | URL |
|---|---|
| Frontend UI | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| Health Check | http://localhost:3001/health |

From the web UI, create a new project, choose a genre, and start generating. The AI will guide you through mechanics, lore, validation, and export.

---

## Usage

### REST API Examples

**Create a project:**

```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "My Sci-Fi RPG", "genre": "rpg"}'
```

**Generate mechanics** (also supports `lore`, `title`, `refinement`):

```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "<id>",
    "taskType": "mechanics",
    "context": {
      "genre": "rpg",
      "userPrompt": "Space exploration RPG with ship customization"
    },
    "modelPreference": "auto"
  }'
```

**Validate consistency:**

```bash
curl -X POST http://localhost:3001/api/validate \
  -H "Content-Type: application/json" \
  -d '{"conceptId": "<id>"}'
```

**Export to markdown** (templates: `gdd`, `pitch`, `technical`):

```bash
curl -X POST http://localhost:3001/api/export \
  -H "Content-Type: application/json" \
  -d '{"conceptId": "<id>", "template": "gdd"}'
```

### API Endpoints Overview

| Endpoint | Description |
|---|---|
| `POST /api/projects` | Create and manage projects |
| `POST /api/generate` | Generate mechanics, lore, or titles |
| `POST /api/validate` | Run 26-rule consistency validation |
| `POST /api/export` | Export to GDD, pitch, or technical spec |
| `/api/templates/...` | Genre templates and blending |
| `/api/refinement/...` | Iterative refinement with version history |
| `/api/titles/...` | Title generation |
| `/api/architect/...` | AI Project Architect interview and export |

---

## Project Structure

```
GameStory-Lab/
├── packages/
│   ├── frontend/       # React 19 + Vite + TypeScript UI
│   ├── backend/        # Node.js + Express API, Prisma ORM, BullMQ workers
│   └── shared/         # Shared types and utilities
├── modules/
│   ├── generative-assets-lab/   # Generative asset experiments
│   ├── generative-score-lab/    # Scoring and evaluation tools
│   └── shiplab/                 # Ship-related module
├── docs/               # Product, agent-law, and factory documentation
├── Dev Docs/           # Internal development documentation
├── docker-compose.yml  # PostgreSQL 17 + Redis 7
├── renovate.json       # Automated dependency updates
└── package.json        # Root workspace config
```

---

## FAQ

### Do I need an API key to use GameStory Lab?

No. If you have [Ollama](https://ollama.com/) installed locally, GameStory Lab will use free local models as the default. Cloud API keys (OpenRouter, Google Gemini) are optional and unlock additional model options.

### What AI models are supported?

GameStory Lab supports **OpenRouter** (access to hundreds of models), **Google Gemini**, and **Ollama** (local models like Llama, Mistral, etc.). The AI Model Orchestrator automatically selects the best available model per task and falls back gracefully on rate limits.

### How does the consistency validation work?

The validation engine applies 26 rules across 6 categories: mechanics–lore alignment, world physics, progression systems, narrative coherence, genre conventions, and technical feasibility. Each concept receives a score and detailed breakdown of issues found.

### Can I blend multiple genres?

Yes. GameStory Lab includes 15 genre templates (RPG, FPS, puzzle, strategy, etc.) and supports blending two or more genres into a single cohesive concept with automatic conflict resolution.

### Where is my data stored?

All project data, generated concepts, and version history are stored locally in your PostgreSQL 17 database. Nothing is sent to external services except the AI generation requests you explicitly initiate.

---

## Contributing

Contributions are welcome! Please read the following before submitting:

1. **Read the [Contributing Guide](CONTRIBUTING.md)** for detailed instructions on the development workflow, coding standards, and pull request process.
2. **Review the [Code of Conduct](CODE_OF_CONDUCT.md)** to understand community expectations.
3. Fork the repository and create a feature branch from `main`.
4. Ensure your changes pass linting and tests before submitting a PR:
   ```bash
   npm run lint
   npm run test
   ```
5. Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages (e.g., `feat:`, `fix:`, `docs:`, `chore:`).

Automated dependency updates are managed by [Renovate](https://www.mend.io/renovate/).

---

## Documentation

Additional documentation is available in the repository:

| Document | Description |
|---|---|
| [TUTORIAL.md](TUTORIAL.md) | Step-by-step walkthrough of core workflows |
| [SETUP.md](SETUP.md) | Detailed setup instructions |
| [QUICK_START.md](QUICK_START.md) | Fast-track setup guide |
| [LOCAL_SETUP_GUIDE.md](LOCAL_SETUP_GUIDE.md) | Local development environment guide |
| [ARCHITECTURE_EXPLANATION.md](ARCHITECTURE_EXPLANATION.md) | System architecture deep-dive |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | Current project status and milestones |
| [VALIDATION_EXPLAINED.md](VALIDATION_EXPLAINED.md) | How the 26-rule validation engine works |
| [AUTHENTICATION.md](AUTHENTICATION.md) | Authentication and authorization details |
| [MINIMAX_SETUP.md](MINIMAX_SETUP.md) | MiniMax integration setup |
| [UNIFIED_ASSISTANT_TESTING.md](UNIFIED_ASSISTANT_TESTING.md) | Unified assistant testing guide |
| [DARK_MODE_PLAN.md](DARK_MODE_PLAN.md) | Dark mode implementation plan |
| [LAUNCH_INSTRUCTIONS.md](LAUNCH_INSTRUCTIONS.md) | Production deployment guide |
| [SECURITY.md](SECURITY.md) | Security policy and reporting |
| [CHANGELOG.md](CHANGELOG.md) | Release history |
| [AGENTS.md](AGENTS.md) | AI agent configuration |
| [CLAUDE.md](CLAUDE.md) | Claude-specific integration notes |

### Developer Documentation

The [`Dev Docs/`](Dev%20Docs/) directory contains internal design documents including technical specifications, product requirements, monetization audit, roadmap, and optimization reports.

### Additional Docs

The [`docs/`](docs/) directory contains product documentation, agent-law references, and factory documentation.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

**Keywords:** AI game design document generator · GDD generator · indie game concept generator · AI game mechanics generator · game lore generator · genre blending tool · local-first game design AI · Ollama OpenRouter game tooling