# Deployment

GameStory Lab is a local-first application. There is no hosted control plane,
no telemetry endpoint, and no phone-home — so "deploying" it means running a
PostgreSQL instance, the backend, and the frontend build yourself.

## Prerequisites

- Node.js ≥ 22 and npm ≥ 10
- PostgreSQL 17 (any reachable instance works — container, managed
  service, or local install)
- At least one AI provider key, or a local Ollama (see
  [SETUP.md](../SETUP.md); the app boots fine with none, but generation
  needs a provider)
- Ollama, if you want local-only inference

## Quick start (local)

```bash
git clone https://github.com/simongonzalezdc/GameStory-Lab.git
cd GameStory-Lab
npm install
cp .env.example .env          # edit: DATABASE_URL + any provider keys
docker compose up -d          # starts PostgreSQL (or use your own)
npm run db:migrate            # from repo root — Prisma reads .env from cwd
npm run build
npm start                     # backend on PORT (default 3001)
```

The frontend is a static build in `packages/frontend/dist/`. Serve it with
any static host, SPA-capable web server, or `npm run preview`.

## Environment

| Variable                     | Required | Purpose                              |
| ---------------------------- | -------- | ------------------------------------ |
| `DATABASE_URL`               | yes      | PostgreSQL connection string         |
| `MINIMAX_API_KEY`            | no       | Primary cloud provider               |
| `GLM_API_KEY`                | no       | Secondary cloud provider             |
| `OPENROUTER_API_KEY`         | no       | Additional cloud provider            |
| `GOOGLE_API_KEY`             | no       | Gemini for consistency validation    |
| `OLLAMA_BASE_URL`            | no       | Local Ollama endpoint                |
| `PORT`                       | no       | Backend port (default 3001)          |
| `FRONTEND_URL`               | no       | Allowed CORS origin                  |
| `AI_COST_LIMIT_PER_HOUR_USD` | no       | Per-hour cloud spend cap (default 5) |

Never commit `.env` — it is gitignored and contains credentials. Rotate any
key immediately if it is ever exposed.

## Production notes

- **Migrations run once per release.** `npm run db:migrate` is safe to run
  against an existing database; only unapplied migrations run.
- **The backend must build with its assets.** `npm run build` runs
  `scripts/copy-assets.mjs`, which is what puts the genre templates and
  architect markdown into `dist/`. Skipping it yields a backend that boots
  with zero templates. CI asserts they shipped.
- **Reverse proxy / TLS** are your responsibility. Terminate TLS at your
  proxy and set `FRONTEND_URL` to your public origin.
- **Secrets** go in environment variables or your orchestrator's secret store,
  not in the repository.
- **No runtime database writes from the frontend** — every mutation is a
  backend API call, which keeps the trust boundary at one place.

## Backups

Back up your PostgreSQL instance. There is nothing else to back up: concepts,
versions, and AI generation logs all live there. Concept mechanics and lore
are JSONB, so a logical dump (`pg_dump`) captures everything.

## Observability

- `GET /health` — liveness plus database connectivity and per-provider AI
  availability with cost tracking
- Winston logs at `LOG_LEVEL` (default `info`) — startup, provider
  selection, fallbacks, cost-cap events
- The `/health` page in the UI shows the same information

There is no built-in metrics stack; run one if you need it — the endpoints
above are enough to wire into Prometheus or Uptime Kuma.
