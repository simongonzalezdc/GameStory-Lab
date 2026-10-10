# Operations Guide

Hard-won, non-obvious facts about this repo. Read before touching CI,
dependencies, forges, or the build.

## Forgejo is canonical, GitHub is a mirror

- Canonical: `https://git.kyanitelabs.tech/simon/GameStory-Lab` (private Forgejo).
- GitHub `simongonzalezdc/GameStory-Lab` is a **mirror only**.
- Flow: land work on Forgejo first (branch → PR → green CI → merge),
  then fast-forward GitHub main to the Forgejo hash. Never merge GitHub-only
  branches into GitHub main and expect Forgejo to follow.
- The two mains diverged badly once (Oct 2026, 9 vs 14 commits). Reconcile by
  merging GitHub-newer work _into_ Forgejo, resolving in Forgejo's favor on
  conflicts of authority (license, CI), then remirroring.
- The Forgejo token on this box (`CODESITTER_FORGEJO_TOKEN` in `~/.bashrc`)
  has repo scope but **no** `read:organization` / `write:admin`. It can do
  branches, PRs, merges, CI status — not user/org admin.
- `main` is branch-protected on Forgejo (pre-receive hook): only PR merges
  land. Direct pushes to `main` are rejected; other branches push fine.

## CI gotchas (all bitten before)

- **Prisma client must be generated in CI** before lint/test/build:
  `npm run db:generate -w packages/backend`. Fresh clones ship an
  ungenerated `@prisma/client` whose `Prisma` namespace lacks `JsonValue`
  and the model types. Local trees pass by luck of prior generation.
- **The `node:22` runner image has no pip and enforces PEP 668.**
  Python lanes must `apt-get install python3-venv`, create a venv, and use
  it. `ensurepip` is also stripped — don't rely on it.
- **`--legacy-peer-deps` lockfiles can drop transitive deps.** Two module
  lockfiles silently lost `@testing-library/dom`, which React's types and
  runtime both require. Gates passed locally only via root `node_modules`
  leakage upward. Verify module gates in isolation (no root install
  present) whenever lockfiles change.
- **Vitest does not typecheck.** Tests can be green while types are broken
  (esbuild strips types). `tsc --noEmit` is the type gate, not the suite.
- **Backend build must ship runtime assets.** `tsc` emits no JSON/Markdown,
  but services read genre/architect templates from `dist/` at runtime.
  `scripts/copy-assets.mjs` runs as part of `npm run build`, and CI asserts
  the files landed. A green build without this check once shipped a backend
  with zero templates.

## Renovate (self-hosted, Forgejo)

- Runner lives at `~/renovate/` (`run.sh`, `config.js`, `shim.js`, pinned
  `app/` install), cron Mondays 04:30 (`30 4 * * 1`), ahead of the repo's
  `before 6am monday` schedule window.
- The runner token lacks `read:organization`, and Renovate's Forgejo
  platform treats anything but 404 on `GET /api/v1/orgs/{owner}` as fatal.
  `shim.js` (localhost proxy) answers that single lookup with the truthful
  404 — `simon` is a user, not an org — and forwards everything else
  untouched. It never logs headers or bodies. **Delete the shim the day
  the token gains `read:organization`.**
- `renovate.json` must say `"platform": "forgejo"` with the Forgejo
  endpoint. The default is GitHub, which would push bot branches to the
  mirror. `matchFileNames` needs `{,**/}package.json` — bare
  `"package.json"` matches only the root manifest (verified 1/7 vs 7/7
  with minimatch), silently excluding all three JS modules.
- Commits need a git identity: `run.sh` exports `GIT_AUTHOR_*` /
  `GIT_COMMITTER_*` as the historical `renovate@kyanitelabs.tech` bot.
  Fresh clones carry no git config, and Renovate dies on first push
  without it.
- `prConcurrentLimit: 5` bounds each run; default `prHourlyLimit` (2/hr)
  paces creation. A manual "run now" needs `--schedule="at any time"` to
  bypass the Monday window (dry-run first).

## Docs policy

- One canonical setup guide: `SETUP.md`. Superseded material goes to
  `docs/archive/` with an index entry, never deleted outright.
- Prisma commands run from the **repo root** (it reads `.env` from cwd);
  `cd packages/backend && npx prisma ...` fails with missing `DATABASE_URL`.
  Root `db:*` scripts already encode this.
- Counts that drift: 27 validation rules (engine is source of truth),
  15 genre templates, 9 endpoint groups, TypeScript ^6.0.3.

## Known dependency risk (tracked, not fixed)

`npm audit` reports 3 HIGH advisories, all rooted in one transitive chain:

```
prisma 6.19.3
└── @prisma/config 6.19.3
    └── deepmerge-ts 7.1.5   (stack exhaustion on recursive graphs)
```

Clearing them requires a **Prisma major**, and the first Prisma 8 release is
still an RC (`8.0.0-rc.22` at time of writing) — installing an RC into a
project that other repos depend on is not a trade worth making silently.
Prisma 6 remains supported.

Revisit when Prisma 8 reaches stable. Expect to check:

- `prisma migrate` behavior changes across the major
- `JsonValue` / `InputJsonValue` type paths (backend uses both)
- generated-client output differences

Everything else was closed in the security pass that took this repo from 26
vulnerabilities (3 critical, 14 high) to these 3.
