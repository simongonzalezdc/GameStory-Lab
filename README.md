# GameStory Lab

**AI-assisted game design document (GDD) generator for indie developers — generate mechanics, write lore, validate consistency, and export complete documentation packages.**

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)

## What it is

GameStory Lab is a local web application that helps indie game developers turn an idea into a professional game design document. You start from mechanics or from lore — the AI adapts — and it generates concepts, runs 26 consistency-validation rules across 6 categories, blends genres from 15 templates, and exports a GDD, pitch deck, or technical spec as markdown. An AI Model Orchestrator routes work across cloud providers (OpenRouter, Google Gemini) and free local models (Ollama), automatically falling back to local models to keep API costs down. It runs on your own machine with PostgreSQL and Redis.

## Install / Quick start

**Prerequisites:** Node.js ≥ 22, Docker + Docker Compose (PostgreSQL & Redis), and optionally Ollama (free local models) and/or an OpenRouter / Google API key for cloud models.

```bash
# 1. Clone and install (npm workspaces monorepo)
git clone https://github.com/simongonzalezdc/GameStory-Lab.git
cd GameStory-Lab
npm install

# 2. Configure environment
cp .env.example .env   # add API keys (all optional if you use Ollama)

# 3. Start infrastructure
docker-compose up -d   # PostgreSQL 17 + Redis 7

# 4. Initialize the database
cd packages/backend && npx prisma migrate dev && npx prisma generate && cd ../..

# 5. Run backend + frontend together
npm run dev
```

- **Frontend UI:** http://localhost:5173
- **Backend API:** http://localhost:3001 (health check at `/health`)

`npm run dev` starts both packages via `concurrently`; you can also run `npm run dev -w packages/backend` and `-w packages/frontend` separately.

## Usage

Drive the full pipeline from the API — create a project, generate mechanics, validate, and export:

```bash
# Create a project
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "My Sci-Fi RPG", "genre": "rpg"}'

# Generate mechanics (taskType: mechanics | lore | title | refinement)
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{"projectId": "<id>", "taskType": "mechanics",
       "context": {"genre": "rpg", "userPrompt": "Space exploration RPG with ship customization"},
       "modelPreference": "auto"}'

# Export to markdown (template: gdd | pitch | technical)
curl -X POST http://localhost:3001/api/export \
  -H "Content-Type: application/json" \
  -d '{"conceptId": "<id>", "template": "gdd"}'
```

The REST API also covers genre templates and blending (`/api/templates/...`), consistency validation (`/api/validate`), iterative refinement with version history (`/api/refinement/...`), title generation (`/api/titles/...`), and the AI Project Architect interview/export flow (`/api/architect/...`). The same workflows are available through the React web UI.

## Why / how it works

The core idea is **consistency as a first-class feature**. Instead of generating one block of text, GameStory Lab models a game concept as versioned mechanics + lore stored as JSONB in PostgreSQL, then runs a validation engine (26 rules across mechanics–lore alignment, world physics, progression, narrative, genre conventions, and technical feasibility) that scores how coherent the design actually is. The **AI Model Orchestrator** picks a model per task and degrades gracefully to local Ollama models on rate limits or to save cost, and the **AI Project Architect** turns a finished concept into an AI-agent-ready documentation package (executive summary, technical spec, requirements, roadmap) via a structured interview.

**Stack:** React 19 + Vite + TypeScript (frontend) · Node.js + Express (backend) · Prisma 6 ORM · PostgreSQL 17 (JSONB) · Redis 7 + BullMQ · OpenRouter + Google Gemini + Ollama for AI · npm workspaces monorepo.

## Best-fit searches

AI game design document generator · GDD generator · indie game concept generator · AI game mechanics generator · game lore generator · genre blending tool · local-first game design AI · Ollama OpenRouter game tooling

## Links

- **Tutorial:** [TUTORIAL.md](TUTORIAL.md)
- **Setup guide:** [SETUP.md](SETUP.md)
- **Quick start:** [QUICK_START.md](QUICK_START.md)
- **License:** [MIT](LICENSE)
- **KyaniteLabs:** [kyanitelabs.tech](https://kyanitelabs.tech)
- **Sibling projects:** [Print-OS](https://github.com/simongonzalezdc/Print-OS) · [voice-to-sculpture-app](https://github.com/simongonzalezdc/voice-to-scultpure-app) · [CyberWitches](https://github.com/simongonzalezdc/CyberWitches) · [grocery-flywheel](https://github.com/simongonzalezdc/grocery-flywheel) · [HealthAdvocate](https://github.com/simongonzalezdc/healthadvocate)
