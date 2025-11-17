# GameForge Studio - Technical Specification

**FOR AI CODING AGENT:** This is your primary implementation guide.  
**Generated:** November 17, 2025  
**Version:** 1.0.0

---

## System Architecture

### High-Level Overview

GameForge Studio is a full-stack web application with three primary subsystems:

1. **AI Orchestration Layer**: Routes requests to optimal AI models (OpenRouter, Google, Ollama)
2. **Consistency Validation Engine**: Analyzes game concepts for lore/mechanics coherence
3. **Concept Management System**: Handles project CRUD, versioning, and export

The architecture prioritizes flexibility (start with mechanics OR lore), cost optimization (intelligent model selection), and offline capability (Ollama fallback).

### Component Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│  ┌───────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ Genre         │  │ Mechanics    │  │ Lore              │  │
│  │ Selector      │  │ Generator    │  │ Generator          │  │
│  └───────┬───────┘  └──────┬───────┘  └─────┬──────────────┘  │
│          │                  │                 │                  │
│  ┌───────┴──────────────────┴─────────────────┴──────────────┐ │
│  │         Consistency Validation UI (Real-time)              │ │
│  └───────────────────────────┬────────────────────────────────┘ │
└────────────────────────────┬─┴─────────────────────────────────┘
                             │
                      REST API (Express)
                             │
┌────────────────────────────┴──────────────────────────────────┐
│                      BACKEND (Node.js)                         │
│  ┌────────────────────────────────────────────────────────┐   │
│  │     AI Model Orchestrator (Model Selection Logic)      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────┐  ┌────────┐ │   │
│  │  │OpenRouter│  │  Google  │  │  GLM    │  │ Ollama │ │   │
│  │  │ Client   │  │  Client  │  │ Client  │  │ Client │ │   │
│  │  └──────────┘  └──────────┘  └─────────┘  └────────┘ │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Consistency Validation Engine (Rule-Based + AI)       │   │
│  │  • Mechanics-Lore Alignment Checker                    │   │
│  │  • Genre Convention Validator                          │   │
│  │  • Player Progression Coherence Analyzer               │   │
│  │  • World Physics Consistency Scanner                   │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │            Concept Management Service                   │   │
│  │  • Project CRUD                                        │   │
│  │  • Version Control (Iteration Tracking)               │   │
│  │  • Export Engine (Markdown Templates)                 │   │
│  └────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬─────────────────────────────────┘
                               │
                   ┌───────────┴──────────┐
                   │  PostgreSQL Database  │
                   │  • Projects           │
                   │  • Concepts (JSONB)   │
                   │  • AI Generations     │
                   │  • Validation Results │
                   └───────────────────────┘
```

### Data Flow

**Concept Generation Flow:**
1. User selects genre OR enters free-form description
2. Frontend sends request to `/api/generate` with starting point (mechanics/lore)
3. AI Orchestrator selects optimal model based on task type
4. Model generates initial content
5. Consistency Engine validates output
6. If conflicts detected, Orchestrator triggers refinement pass
7. Frontend displays result with conflict warnings
8. User iterates or accepts

**Consistency Checking Flow:**
1. User modifies mechanics OR lore
2. Frontend debounces changes (500ms), sends to `/api/validate`
3. Validation Engine runs 30+ rules in parallel
4. Each rule returns confidence score + explanation
5. High-confidence conflicts highlighted in UI
6. User can request AI suggestions for resolution

---

## Tech Stack

### Frontend
- **Framework:** React 19.0.0
- **TypeScript:** 5.6.3
- **Key Libraries:**
  - `@reduxjs/toolkit` ^2.5.0 - State management
  - `react-router-dom` ^7.1.0 - Client-side routing
  - `axios` ^1.7.9 - HTTP client
  - `react-markdown` ^9.0.0 - Markdown rendering
  - `zustand` ^5.0.3 - Lightweight state (alternative to Redux for simple cases)
- **Styling:** Tailwind CSS 4.0 + shadcn/ui components
- **State Management:** Redux Toolkit (complex state), Zustand (simple modals/UI state)

### Backend
- **Framework:** Express 5.0.1
- **Language:** TypeScript 5.6.3
- **Runtime:** Node.js 22 LTS
- **Key Libraries:**
  - `@openrouter/sdk` ^1.0.0 - OpenRouter API client
  - `@google/genai` ^0.17.0 - Google Gemini client
  - `ollama` ^0.5.10 - Ollama client
  - `zod` ^3.23.8 - Schema validation
  - `bullmq` ^5.28.0 - Job queue for async AI tasks
  - `ioredis` ^5.4.1 - Redis client (for queue + caching)

### Database
- **Type:** PostgreSQL 17
- **ORM:** Prisma 6.1.0
- **Migration Tool:** Prisma Migrate
- **Key Design:**
  - Structured tables for projects, users, generations
  - JSONB columns for flexible concept storage (mechanics/lore vary by genre)
  - Full-text search on concept content

### AI Providers
- **OpenRouter:** Multi-model gateway (primary)
- **Google Gemini:** Direct access via @google/genai
- **GLM 4.6 / MiniMax M2:** Via OpenRouter
- **Ollama:** Local models (fallback, cost savings)

**Model Selection Strategy (Nov 2025 benchmarks):**
- **Mechanics Generation:** DeepSeek V3 (40.5% LiveCodeBench, excellent structured output)
- **Lore Creation:** Qwen3-32B (128K context, "thinking budget" for depth)
- **Consistency Checking:** Gemini 2.5 Flash (1M context, fast reasoning, multimodal)
- **Title Generation:** GPT-OSS 120B (creative, low cost)
- **Iterative Refinement:** Ollama Llama 3.3 70B (local, unlimited iterations)

### Infrastructure
- **Hosting:** Docker Compose (self-hosted)
- **CI/CD:** GitHub Actions
- **Package Manager:** npm (workspaces for monorepo)
- **Build Tool:** Vite 6.0 (frontend), tsc (backend)

---

## Project Structure

```
gameforge-studio/
├── packages/
│   ├── frontend/                # React app
│   │   ├── src/
│   │   │   ├── components/     # UI components
│   │   │   │   ├── GenreSelector/
│   │   │   │   ├── MechanicsEditor/
│   │   │   │   ├── LoreEditor/
│   │   │   │   ├── ConsistencyPanel/
│   │   │   │   └── ExportDialog/
│   │   │   ├── features/       # Redux slices
│   │   │   │   ├── concept/
│   │   │   │   ├── validation/
│   │   │   │   └── generation/
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── services/       # API clients
│   │   │   ├── types/          # TypeScript types
│   │   │   ├── utils/          # Helper functions
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── public/
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   ├── backend/                # Node.js API
│   │   ├── src/
│   │   │   ├── routes/         # API endpoints
│   │   │   │   ├── projects.ts
│   │   │   │   ├── generate.ts
│   │   │   │   ├── validate.ts
│   │   │   │   └── export.ts
│   │   │   ├── services/       # Business logic
│   │   │   │   ├── ai/
│   │   │   │   │   ├── orchestrator.ts
│   │   │   │   │   ├── clients/
│   │   │   │   │   │   ├── openrouter.ts
│   │   │   │   │   │   ├── google.ts
│   │   │   │   │   │   ├── glm.ts
│   │   │   │   │   │   └── ollama.ts
│   │   │   │   │   └── prompts/
│   │   │   │   ├── validation/
│   │   │   │   │   ├── engine.ts
│   │   │   │   │   └── rules/
│   │   │   │   │       ├── mechanics-lore-alignment.ts
│   │   │   │   │       ├── genre-conventions.ts
│   │   │   │   │       ├── progression-coherence.ts
│   │   │   │   │       └── physics-consistency.ts
│   │   │   │   └── export/
│   │   │   ├── models/         # Prisma schema
│   │   │   ├── middleware/     # Express middleware
│   │   │   ├── types/          # TypeScript types
│   │   │   ├── utils/          # Helper functions
│   │   │   └── server.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared/                 # Shared types/utils
│       ├── src/
│       │   ├── types/
│       │   └── validation/
│       └── package.json
│
├── docker-compose.yml
├── .env.example
├── README.md
└── package.json (workspace root)
```

### File Organization Principles
- **Colocation:** Keep related files together (component + test + styles)
- **Feature-based:** Group by feature, not file type
- **Shared code:** Only in `packages/shared` if used by 2+ packages
- **Types first:** Define TypeScript interfaces before implementation
- **One concern per file:** Each file has a single, clear responsibility

---

## Database Schema

### Tables & Relationships

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Purpose:** Track users for multi-user support (future feature)

#### projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  genre VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_projects_user ON projects(user_id);
```
**Purpose:** Top-level container for game concepts

**Relationships:**
- One user has many projects (1:N)
- One project has many concepts (1:N) - versions/iterations

#### concepts
```sql
CREATE TABLE concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  title VARCHAR(500),
  mechanics JSONB NOT NULL DEFAULT '{}',
  lore JSONB NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_concepts_project ON concepts(project_id);
CREATE INDEX idx_concepts_mechanics_gin ON concepts USING GIN (mechanics);
CREATE INDEX idx_concepts_lore_gin ON concepts USING GIN (lore);
```
**Purpose:** Store versioned game concepts with flexible JSONB structure

**JSONB Structure:**
```typescript
// mechanics JSONB
{
  "coreLoop": string,
  "playerActions": string[],
  "progressionSystems": {
    "type": "linear" | "branching" | "open",
    "mechanics": string[]
  },
  "winConditions": string[],
  "failConditions": string[],
  "resourceSystems": {
    "name": string,
    "mechanics": string,
    "scarcity": "abundant" | "balanced" | "scarce"
  }[]
}

// lore JSONB
{
  "setting": {
    "era": string,
    "location": string,
    "worldType": string
  },
  "protagonist": {
    "background": string,
    "motivation": string,
    "abilities": string[]
  },
  "conflict": {
    "primary": string,
    "secondary": string[]
  },
  "worldRules": {
    "physics": string,
    "magic": string,
    "technology": string
  },
  "themes": string[]
}

// metadata JSONB
{
  "aiModel": string,
  "promptTokens": number,
  "completionTokens": number,
  "generationTime": number,
  "userEdited": boolean
}
```

**Relationships:**
- One project has many concepts (versions)
- Concepts are immutable (new version = new row)

#### ai_generations
```sql
CREATE TABLE ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
  task_type VARCHAR(50) NOT NULL, -- 'mechanics', 'lore', 'title', 'refinement'
  model_used VARCHAR(100) NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 6),
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_generations_concept ON ai_generations(concept_id);
CREATE INDEX idx_generations_task ON ai_generations(task_type);
```
**Purpose:** Track all AI API calls for cost analysis and debugging

#### validation_results
```sql
CREATE TABLE validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
  rule_name VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL, -- 'error', 'warning', 'info'
  confidence DECIMAL(3, 2) NOT NULL, -- 0.00 to 1.00
  message TEXT NOT NULL,
  suggestion TEXT,
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_validations_concept ON validation_results(concept_id);
CREATE INDEX idx_validations_severity ON validation_results(severity);
```
**Purpose:** Store consistency check results

### Migration Strategy
- Use Prisma Migrate for all schema changes
- Never modify production schema directly
- Always create migrations locally first: `npx prisma migrate dev --name <description>`
- Test migrations on staging before production
- Backup database before applying migrations in production

---

## API Specification

### Authentication
**Method:** JWT Bearer tokens (future feature - MVP is single-user)

**Headers Required:**
```
Content-Type: application/json
```

### Endpoints

#### POST /api/projects
**Purpose:** Create a new game project

**Request:**
```json
{
  "name": "My Sci-Fi RPG",
  "genre": "rpg"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "My Sci-Fi RPG",
  "genre": "rpg",
  "createdAt": "2025-11-17T12:00:00Z"
}
```

**Validation Rules:**
- `name`: Required, 3-255 characters
- `genre`: Optional, enum of supported genres

#### GET /api/projects/:id
**Purpose:** Retrieve project with all concept versions

**Response:**
```json
{
  "id": "uuid",
  "name": "My Sci-Fi RPG",
  "genre": "rpg",
  "concepts": [
    {
      "id": "uuid",
      "version": 1,
      "title": "Stellar Voyager",
      "mechanics": {},
      "lore": {},
      "createdAt": "2025-11-17T12:00:00Z"
    }
  ]
}
```

#### POST /api/generate
**Purpose:** Generate game concept content using AI

**Request:**
```json
{
  "projectId": "uuid",
  "taskType": "mechanics" | "lore" | "title" | "refinement",
  "context": {
    "genre": "rpg",
    "existingContent": {},
    "userPrompt": "Create a space exploration RPG"
  },
  "modelPreference": "auto" | "deepseek" | "qwen" | "gemini" | "ollama"
}
```

**Response:**
```json
{
  "conceptId": "uuid",
  "content": {
    "mechanics": {},
    "lore": {}
  },
  "metadata": {
    "model": "deepseek-v3",
    "tokensUsed": 1250,
    "durationMs": 3400
  }
}
```

**Error Handling:**
- 400: Invalid task type or missing required fields
- 429: Rate limit exceeded (10 generations per minute)
- 500: AI model error (fallback to Ollama)
- 503: All AI providers unavailable

#### POST /api/validate
**Purpose:** Run consistency validation on concept

**Request:**
```json
{
  "conceptId": "uuid",
  "mechanics": {},
  "lore": {}
}
```

**Response:**
```json
{
  "validationId": "uuid",
  "issues": [
    {
      "rule": "mechanics-lore-alignment",
      "severity": "error",
      "confidence": 0.95,
      "message": "Protagonist lacks superpowers but mechanics require telekinesis",
      "suggestion": "Add telekinesis to protagonist abilities OR remove telekinesis-based mechanics",
      "location": {
        "mechanics": ["playerActions[2]"],
        "lore": ["protagonist.abilities"]
      }
    }
  ],
  "overallScore": 0.78
}
```

**Validation Rules:**
30+ rules organized by category (see Validation Engine section)

#### POST /api/export
**Purpose:** Export concept to markdown

**Request:**
```json
{
  "conceptId": "uuid",
  "template": "gdd" | "pitch" | "technical"
}
```

**Response:**
```json
{
  "markdown": "# Game Design Document\n\n...",
  "filename": "stellar-voyager-gdd.md"
}
```

### Rate Limiting
- **OpenRouter:** 100 requests/minute (enforced by provider)
- **Ollama:** Unlimited (local)
- **Application-level:** 20 generations/minute per IP
- **Cost protection:** $5/hour spending limit, auto-fallback to Ollama

### Versioning
API v1 (no version in URL for MVP, add `/v2/` prefix for breaking changes)

---

## Consistency Validation Engine

### Rule Categories & Implementation

Based on game design research, the validation engine implements 30+ rules across 6 categories:

#### 1. Mechanics-Lore Alignment (10 rules)
**Purpose:** Ensure gameplay mechanics are justified by narrative/worldbuilding

**Rules:**
- **player-abilities-match**: Player can only perform actions their character is capable of (based on lore)
- **resource-logic**: Resources must have in-world explanation (e.g., mana = magical energy, not arbitrary points)
- **win-conditions-narratively-sound**: Victory must make sense within story (defeating villain, not random point threshold)
- **progression-explains-power-growth**: Character growth mechanics align with narrative arc
- **combat-system-consistency**: Combat rules match world physics (no lightsabers in medieval fantasy)
- **magic-system-rules**: If magic exists, mechanics must follow established magical laws
- **technology-level-match**: Tech in mechanics matches tech level in lore
- **death-consequences-align**: What happens when player dies fits narrative (respawn vs permadeath)
- **multiplayer-justification**: If multiplayer, explain how multiple players exist in world
- **economy-worldbuilding**: Currency/trade mechanics reflect world economy

**Implementation:**
```typescript
// packages/backend/src/services/validation/rules/mechanics-lore-alignment.ts

export async function validatePlayerAbilitiesMatch(
  concept: Concept
): Promise<ValidationResult> {
  const playerActions = concept.mechanics.playerActions || [];
  const characterAbilities = concept.lore.protagonist?.abilities || [];
  
  const conflicts: string[] = [];
  
  for (const action of playerActions) {
    const hasAbility = characterAbilities.some(ability => 
      semanticMatch(action, ability) // Uses AI for semantic comparison
    );
    
    if (!hasAbility) {
      conflicts.push(`Action "${action}" not justified by character abilities`);
    }
  }
  
  if (conflicts.length === 0) {
    return {
      rule: 'player-abilities-match',
      severity: 'info',
      confidence: 1.0,
      message: 'All player actions are justified by character abilities',
      suggestion: null
    };
  }
  
  return {
    rule: 'player-abilities-match',
    severity: conflicts.length > 2 ? 'error' : 'warning',
    confidence: 0.85,
    message: conflicts.join('; '),
    suggestion: `Add these abilities to protagonist: ${conflicts.join(', ')} OR remove unjustified actions`
  };
}
```

#### 2. Genre Conventions (8 rules)
**Purpose:** Validate concept follows genre expectations (unless intentionally subverting)

**Rules:**
- **rpg-progression**: RPG must have leveling/progression system
- **fps-perspective**: FPS requires first-person view
- **strategy-units**: Strategy games need unit control mechanics
- **puzzle-challenge-curve**: Puzzle games need increasing difficulty
- **horror-atmosphere**: Horror needs tension/fear mechanics
- **platformer-precision**: Platformers require tight jump controls
- **survival-scarcity**: Survival games need resource management
- **sports-competition**: Sports games need competitive scoring

**Confidence Scoring:**
- 1.0: Hard requirement violated (FPS without first-person view)
- 0.7-0.9: Convention missing (RPG without progression)
- 0.5-0.7: Subgenre ambiguity (Action-RPG hybrid)

#### 3. World Physics Consistency (5 rules)
**Purpose:** Ensure world rules don't contradict themselves

**Rules:**
- **gravity-consistency**: If gravity exists, it applies uniformly (unless magic)
- **material-properties**: Objects behave according to their properties (wood burns, metal doesn't)
- **time-consistency**: Time flows consistently (unless time manipulation is a mechanic)
- **spatial-logic**: Space/distance makes sense (no infinite backpacks without explanation)
- **causality**: Actions have logical consequences

#### 4. Player Progression Coherence (4 rules)
**Purpose:** Validate progression systems make sense

**Rules:**
- **power-curve**: Player power increases gradually, not erratically
- **gating-justification**: Locked areas have narrative explanation
- **skill-mastery**: Player learns mechanics before advanced challenges
- **endgame-reward**: Final challenges are appropriately epic

#### 5. Narrative Structure (3 rules)
**Purpose:** Basic storytelling coherence

**Rules:**
- **protagonist-motivation**: Clear reason for player's actions
- **conflict-resolution**: Main conflict has resolution path
- **theme-consistency**: Themes reinforced throughout

#### 6. Technical Feasibility (3 rules - informational only)
**Purpose:** Flag ambitious scope

**Rules:**
- **complexity-estimate**: Warn if mechanics are extremely complex
- **performance-considerations**: Flag physics-heavy systems
- **scope-reality-check**: Estimate if project is feasible for indie dev

### Validation Execution

**Parallel Execution:**
All 30+ rules run concurrently for speed. Rules are independent and stateless.

**Confidence Aggregation:**
```typescript
overallScore = (
  sum(rule.confidence * rule.weight) / sum(rule.weight)
) * (1 - errorPenalty)
```

**Error Penalty:**
- Each error: -0.05
- Each warning: -0.02
- Errors in critical rules (mechanics-lore): -0.10

---

## Implementation Order

### Phase 1: Foundation (Week 1-2)
**Priority:** CRITICAL  
**Duration:** 10-14 days

1. **Project Setup & Infrastructure**
   - Files: `docker-compose.yml`, `.env.example`, workspace root `package.json`
   - Setup: Monorepo with npm workspaces, Docker for Postgres/Redis, GitHub repo
   - Tests: N/A (infrastructure)

2. **Database Schema & Prisma Setup**
   - Files: `packages/backend/prisma/schema.prisma`, migrations
   - Implement: All 5 tables, indexes, JSONB fields
   - Tests: Schema validation, migration rollback test

3. **Backend API Scaffolding**
   - Files: `packages/backend/src/server.ts`, Express routes, middleware
   - Implement: CORS, error handling, request validation (Zod)
   - Tests: API health check, error middleware

4. **AI Client Abstraction Layer**
   - Files: `packages/backend/src/services/ai/clients/*`
   - Implement: OpenRouter, Google, Ollama clients with unified interface
   - Tests: Mock API calls, error handling, retry logic

5. **AI Model Orchestrator**
   - Files: `packages/backend/src/services/ai/orchestrator.ts`
   - Implement: Model selection logic based on task type + cost optimization
   - Tests: Model selection for each task type, fallback logic

### Phase 2: Core Generation (Week 3-4)
**Priority:** HIGH  
**Duration:** 10-14 days

6. **Prompt Engineering System**
   - Files: `packages/backend/src/services/ai/prompts/*`
   - Implement: Genre-specific prompts for mechanics, lore, titles
   - Tests: Prompt output validation

7. **Generation API Endpoints**
   - Files: `packages/backend/src/routes/generate.ts`
   - Implement: `/api/generate` with task routing, concept storage
   - Tests: E2E generation flow, error cases

8. **Frontend Concept Editor**
   - Files: `packages/frontend/src/components/MechanicsEditor/`, `LoreEditor/`
   - Implement: Rich text editors, real-time sync to backend
   - Tests: Component rendering, state updates

9. **Genre Template System**
   - Files: `packages/backend/src/services/templates/`
   - Implement: 5 genre templates (RPG, FPS, Strategy, Puzzle, Survival)
   - Tests: Template validation, customization

### Phase 3: Validation Engine (Week 5-6)
**Priority:** HIGH  
**Duration:** 10-14 days

10. **Validation Rule Framework**
    - Files: `packages/backend/src/services/validation/engine.ts`
    - Implement: Rule execution, parallel processing, confidence scoring
    - Tests: Rule runner, aggregation logic

11. **Core Validation Rules (15 rules)**
    - Files: `packages/backend/src/services/validation/rules/*`
    - Implement: Mechanics-lore alignment, genre conventions, world physics
    - Tests: Each rule with positive/negative cases

12. **Validation API & UI**
    - Files: `packages/backend/src/routes/validate.ts`, `packages/frontend/src/components/ConsistencyPanel/`
    - Implement: Real-time validation, issue highlighting, dismiss/accept
    - Tests: E2E validation flow

### Phase 4: Polish & Export (Week 7-8)
**Priority:** MEDIUM  
**Duration:** 10-14 days

13. **Iterative Refinement System**
    - Files: `packages/backend/src/services/refinement/`
    - Implement: Multi-pass improvement, change tracking, version comparison
    - Tests: Refinement convergence, version rollback

14. **Markdown Export Engine**
    - Files: `packages/backend/src/services/export/`, templates
    - Implement: GDD, pitch deck, technical doc templates
    - Tests: Template rendering, variable substitution

15. **Game Title Generator**
    - Files: `packages/backend/src/services/title-generator.ts`
    - Implement: Context-aware naming, genre conventions, market trends
    - Tests: Title quality, uniqueness

16. **Project Management UI**
    - Files: `packages/frontend/src/components/ProjectList/`, `ProjectView/`
    - Implement: CRUD, version history, export dialog
    - Tests: Full user workflow E2E

---

## AI Agent Instructions

### Setup Commands
```bash
# Initial setup
git clone <repo>
cd gameforge-studio

# Install dependencies
npm install

# Setup database
cd packages/backend
cp .env.example .env
# Fill in DATABASE_URL, OPENROUTER_API_KEY, GOOGLE_API_KEY
npx prisma migrate dev

# Install Ollama (local AI)
# MacOS/Linux: curl -fsSL https://ollama.com/install.sh | sh
# Windows: https://ollama.com/download
ollama pull llama3.3:70b

# Start services
cd ../..
docker-compose up -d  # Postgres, Redis

# Start backend dev server
cd packages/backend
npm run dev

# Start frontend dev server (new terminal)
cd packages/frontend
npm run dev
```

### Development Workflow

**For each new feature:**
1. Create feature branch: `git checkout -b feature/validation-engine`
2. Implement in this order:
   - **Backend first:** Data models, business logic, API endpoints
   - **Types:** Shared types in `packages/shared/src/types/`
   - **Frontend:** UI components consuming API
   - **Tests:** Unit tests for services, integration for API, E2E for workflows
3. Run tests: `npm test` (in respective package)
4. Format code: `npm run format`
5. Lint: `npm run lint`
6. Commit: `git commit -m "feat(validation): add mechanics-lore alignment rule"`

### File Creation Rules

**ALWAYS:**
- Use TypeScript for ALL files (no .js)
- Create `.test.ts` file alongside implementation
- Add JSDoc comments for public APIs
- Use `zod` for runtime validation
- Implement proper error handling (try/catch, error boundaries)
- Add loading states for async operations

**NEVER:**
- Use `any` type (use `unknown` instead)
- Skip tests ("I'll add them later" = they never get added)
- Hardcode secrets (use environment variables)
- Commit node_modules or .env
- Use `console.log` in production (use proper logger)

### Critical Files (Do NOT modify without asking)
- `packages/backend/prisma/schema.prisma` - Database schema (requires migration)
- `packages/shared/src/types/core.ts` - Core type definitions (affects entire codebase)
- `docker-compose.yml` - Infrastructure config
- `.github/workflows/*` - CI/CD pipelines

### Security Requirements
- **No API keys in code:** Use environment variables
- **Input validation:** All user input validated with Zod schemas
- **SQL injection:** Prisma ORM handles (no raw SQL)
- **XSS prevention:** React escapes by default, careful with `dangerouslySetInnerHTML`
- **Rate limiting:** 20 requests/minute per IP (use `express-rate-limit`)
- **CORS:** Strict origin allowlist in production

### Performance Requirements
- **API response time:** <500ms for validation, <3s for generation
- **Frontend bundle:** <500kb initial load (use code splitting)
- **Database queries:** <100ms (add indexes, optimize JSONB queries)
- **AI API timeouts:** 30s max, fallback to Ollama if exceeded
- **Caching:** Redis cache for common generations (1 hour TTL)

### Error Handling Pattern
```typescript
// Backend
import { AppError, handleApiError } from './utils/errors';

app.post('/api/generate', async (req, res, next) => {
  try {
    const result = await orchestrator.generate(req.body);
    res.json(result);
  } catch (error) {
    next(handleApiError(error)); // Centralized error handling
  }
});

// Frontend
import { useMutation } from '@tanstack/react-query';

const { mutate, error, isLoading } = useMutation({
  mutationFn: generateConcept,
  onError: (err) => {
    toast.error(err.message || 'Generation failed');
  }
});
```

---

## Environment Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/gameforge

# Redis (for BullMQ job queue)
REDIS_URL=redis://localhost:6379

# AI Providers
OPENROUTER_API_KEY=sk-or-v1-xxx
GOOGLE_API_KEY=AIzaSy-xxx
GLM_API_KEY=xxx  # Optional, via OpenRouter
OLLAMA_BASE_URL=http://localhost:11434

# Application
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_MAX=20
RATE_LIMIT_WINDOW_MS=60000

# Cost Protection
AI_COST_LIMIT_PER_HOUR_USD=5.00
```

### Local Development Setup
```bash
# Copy template
cp .env.example .env

# Fill in API keys (get from respective providers)
# OpenRouter: https://openrouter.ai/keys
# Google: https://aistudio.google.com/app/apikey
```

### Environment-Specific Settings
- **Development:** Verbose logging, hot reload, mock AI (optional)
- **Staging:** Production-like, uses real AI APIs, limited rate limits
- **Production:** Strict rate limits, error tracking (Sentry), metrics (Prometheus)

---

## Deployment

### Build Process
```bash
# Build frontend
cd packages/frontend
npm run build  # Output: dist/

# Build backend
cd packages/backend
npm run build  # Output: dist/

# Copy frontend build to backend static folder
cp -r ../frontend/dist ../backend/dist/public
```

### Pre-Deployment Checklist
- [ ] All tests passing (`npm test` in all packages)
- [ ] No linting errors (`npm run lint`)
- [ ] Environment variables configured in hosting platform
- [ ] Database migrations applied (`npx prisma migrate deploy`)
- [ ] Secrets rotated (new API keys for production)
- [ ] CORS allowlist updated with production domain
- [ ] Rate limits configured appropriately
- [ ] Monitoring/alerting enabled

### Deployment Command
```bash
# Using Docker
docker-compose -f docker-compose.prod.yml up -d

# Using fly.io (example)
fly deploy

# Using Vercel (frontend) + Railway (backend)
vercel --prod  # Frontend
railway up     # Backend
```

### Rollback Procedure
```bash
# Docker
docker-compose -f docker-compose.prod.yml down
git checkout <previous-version-tag>
docker-compose -f docker-compose.prod.yml up -d

# fly.io
fly releases list
fly releases rollback <release-id>
```

---

## Troubleshooting

### Common Issues

**Issue:** OpenRouter API returns 429 (rate limit)  
**Solution:** Automatic fallback to Ollama in orchestrator. Check logs: `tail -f logs/ai-requests.log`

**Issue:** Prisma migration fails  
**Solution:** Check schema syntax, ensure no manual DB changes. Rollback: `npx prisma migrate resolve --rolled-back <migration-name>`

**Issue:** Frontend can't connect to backend  
**Solution:** Check CORS settings, verify FRONTEND_URL in .env, check network tab for actual error

**Issue:** Validation takes >10 seconds  
**Solution:** Rules run in parallel, check Redis is running. Profile with: `NODE_ENV=development DEBUG=validation:* npm run dev`

**Issue:** Ollama not responding  
**Solution:** Check Ollama is running: `ollama list`. Restart: `ollama serve`. Pull model: `ollama pull llama3.3:70b`

### Debugging Commands
```bash
# Backend logs
docker-compose logs -f backend

# Database inspection
docker exec -it gameforge-postgres psql -U user -d gameforge
\dt  # List tables
SELECT * FROM projects LIMIT 5;

# Redis inspection
docker exec -it gameforge-redis redis-cli
KEYS *
GET <key>

# Ollama status
ollama ps  # Running models
ollama list  # Installed models
```

---

## Dependencies

### Production Dependencies (Backend)
```json
{
  "@openrouter/sdk": "^1.0.0",
  "@google/genai": "^0.17.0",
  "@prisma/client": "^6.1.0",
  "express": "^5.0.1",
  "express-rate-limit": "^7.4.1",
  "bullmq": "^5.28.0",
  "ioredis": "^5.4.1",
  "zod": "^3.23.8",
  "dotenv": "^16.4.5",
  "cors": "^2.8.5",
  "helmet": "^8.0.0",
  "winston": "^3.17.0"
}
```

### Production Dependencies (Frontend)
```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "@reduxjs/toolkit": "^2.5.0",
  "react-router-dom": "^7.1.0",
  "axios": "^1.7.9",
  "@tanstack/react-query": "^5.62.7",
  "react-markdown": "^9.0.0",
  "zustand": "^5.0.3"
}
```

### Development Dependencies
```json
{
  "typescript": "^5.6.3",
  "vite": "^6.0.0",
  "@types/node": "^22.10.2",
  "@types/react": "^19.0.2",
  "vitest": "^2.1.8",
  "eslint": "^9.16.0",
  "prettier": "^3.4.2",
  "prisma": "^6.1.0"
}
```

### Dependency Update Policy
- **Security patches:** Apply immediately
- **Minor versions:** Update monthly (check changelogs first)
- **Major versions:** Evaluate breaking changes, allocate refactor time
- **Tool:** Use `npm-check-updates` to find outdated packages

---

## Additional Resources

**Documentation:**
- OpenRouter API: https://openrouter.ai/docs
- Google Gemini: https://ai.google.dev/gemini-api/docs
- Ollama: https://ollama.com/docs
- Prisma: https://www.prisma.io/docs
- React Query: https://tanstack.com/query/latest/docs/react

**Tutorials:**
- Building AI-powered apps: https://www.youtube.com/@builders-ai
- Game design principles: https://www.gamedeveloper.com

**Community:**
- GitHub Issues: <repo-url>/issues
- Discord: (to be created in Phase 4)

---

**This document is the single source of truth for implementation.**  
**All technical decisions, patterns, and requirements are defined here.**

**Last Updated:** November 17, 2025
