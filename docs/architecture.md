# Architecture

A tour of how GameStory Lab is put together — for a new test user or
contributor who wants the map before reading code.

## The shape

```
packages/
├── shared/     Types and validation schemas used by both other packages
├── backend/    Node + Express API, Prisma, AI orchestration
└── frontend/   React SPA (Vite + React Router)

modules/        Standalone experiments (own deps, own CI, own lockfiles)
e2e/            Playwright journeys against the frontend production build
```

`shared` is built first — the backend consumes its compiled output, and the
frontend consumes its types. A one-way dependency:

```
frontend ──HTTP──▶ backend ──▶ shared
```

No package imports from `modules/`; they are isolated by design.

## Backend request path

Every `/api/*` request walks this chain:

```
HTTP request
  │
  ▼
server.ts ──── helmet, compression, CORS
  │            express.json (10mb limit)
  │            rate limiting (general 20/min, validation 30/min)
  ▼
routes/*.ts ── zod-validated request bodies
  │            thin: parse → call a service → shape the response
  ▼
services/** ── business logic lives here
  │
  ├── ai/orchestrator.ts     picks a model, tracks cost
  ├── services/ai/clients/   one client per provider
  ├── validation/            27 rules in parallel
  ├── templates/             15 genre templates + blending
  ├── architect/             interview → document generation
  └── assistant/             chat + proposal system
  ▼
prisma ─────── PostgreSQL (JSONB for concept mechanics/lore)
```

Two things matter about that layout:

1. **Routes stay thin.** Validation happens at the route boundary; logic
   lives in services. If a route file is growing, the logic belongs in a
   service.
2. **Prisma reads `.env` from cwd.** Everything Prisma runs from the repo
   root via the `db:*` scripts — see [SETUP.md](../SETUP.md).

## The AI layer

`AIOrchestrator` is the only thing the rest of the backend talks to. It
owns:

- **Provider selection** — MiniMax first, then GLM, then OpenRouter/Google,
  then local Ollama, based on which keys are present
- **Cost tracking** — per-hour spend against `AI_COST_LIMIT_PER_HOUR_USD`
  (default $5/hour). When the cap is hit, it forces the local Ollama path
- **Model fallback** — a failing model rolls to the next candidate

Provider implementations sit in `services/ai/clients/`, one per API shape
(Anthropic-compatible, OpenAI-compatible, Google, Ollama). Adding a provider
means adding a client and registering it — no other file should change.

Callers that just want content use `AIService` (a singleton wrapper);
callers needing selection detail use the orchestrator directly.

## The validation engine

27 rules run **in parallel** over the mechanics + lore pair and return
issues with severity, confidence, and a suggestion. Rules live in
`services/validation/rules/`, grouped into six categories. The rule list is
the source of truth for the count documented in the README — if you add or
remove one, update both.

## Data model

Five tables, `Concept` mechanics/lore stored as JSONB so the schema can
evolve without migrations for every new field:

- `User` — placeholder for future multi-user support
- `Project` — the container
- `Version` — every concept revision (immutable, append-only)
- `AIGeneration` — audit log of every AI call, including cost
- `ValidationResult` — every validation run, dismissible per issue

`Version` is append-only, which is what makes refinement, comparison, and
rollback straightforward — nothing is edited in place.

## AI Project Architect

A separate flow from the concept editor: a structured interview builds a
`ProjectContext`, then a document generator renders 4–6 markdown documents
from templates. Documents are regenerable; the interview is resumable and
persisted in session metadata.

## Frontend

A single React Router shell with lazy route boundaries. TanStack Query holds
server state; the API client is one module (`services/api.ts`) so every call
shares timeout and error handling. Generation, refinement, assistant, and
architect calls get a 5-minute timeout; everything else gets 30 seconds.

## Modules

`modules/` holds three standalone experiments — a FastAPI asset lab, a
Vite/React 18 score lab, and a Next.js/Drizzle ship lab. They are _not_ part
of the root npm workspaces and are not imported by production code. They
exist as isolated probes and carry their own CI lane.

## Testing strategy

| Layer       | Where                               | What it proves                                 |
| ----------- | ----------------------------------- | ---------------------------------------------- |
| Unit        | `packages/*/src/**/*.test.ts`       | Logic and edge cases in isolation              |
| Integration | `packages/backend/src/**/*.test.ts` | Routes, services, orchestration wired together |
| Module      | `modules/*/{src,tests}`             | Each experiment still works                    |
| End-to-end  | `e2e/tests/*.spec.ts`               | Critical user journeys through the built UI    |
| Types       | `tsc --noEmit` in CI                | Vitest does not typecheck — this gate does     |

Coverage runs in CI on the backend and frontend workspaces
(`npm run test:coverage`).
