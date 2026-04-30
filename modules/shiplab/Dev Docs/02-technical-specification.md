# ShipLab - Technical Specification

**FOR AI CODING AGENT:** This is your primary implementation guide.  
**Generated:** November 18, 2025  
**Version:** 1.0.0

---

## System Architecture

### High-Level Overview

ShipLab is a local-first web application built on Next.js 15 with hybrid AI capabilities (cloud + local LLMs). The architecture follows a modular pipeline design where each post-production step (analysis, documentation, licensing, marketing, deployment) is an independent module that can be executed sequentially or individually.

**Core Design Principles:**
- **Local-first:** All data stays on user's machine by default, with optional cloud sync
- **AI-agnostic:** Support multiple LLM providers (OpenRouter, Ollama, custom)
- **Extensible:** Plugin architecture for adding new analysis tools and generators
- **Transparent:** Show all AI prompts and allow user override at every step

### Component Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js 15 App Router                  │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React 19 Server Components)                     │
│  ├── Chat Interface (AI Assistant)                         │
│  ├── Project Dashboard (Upload/Select Codebase)            │
│  ├── Analysis Results Viewer                               │
│  ├── Document Editor (Generated Docs)                      │
│  └── Deployment Wizard                                     │
├─────────────────────────────────────────────────────────────┤
│  Backend (API Routes + Server Actions)                     │
│  ├── Code Parser (tree-sitter multi-language)             │
│  ├── Analysis Pipeline Orchestrator                       │
│  ├── LLM Router (OpenRouter / Ollama)                     │
│  ├── Document Generator                                    │
│  └── Template Engine                                       │
├─────────────────────────────────────────────────────────────┤
│  Core Modules (Post-Production Pipeline)                   │
│  ├── Code Quality (ESLint, Semgrep, SonarQube)            │
│  ├── Documentation (OpenAPI, JSDoc, README)               │
│  ├── Licensing (SPDX, license compliance)                 │
│  ├── Marketing (SEO, social media, landing pages)         │
│  └── Deployment (IaC, CI/CD configs)                      │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                │
│  ├── SQLite (local storage)                               │
│  ├── File System (project files, cache)                   │
│  └── PostgreSQL (optional cloud sync)                     │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Project Upload:** User uploads/links codebase → Parser extracts structure, dependencies, README
2. **AI Analysis:** Code sent to LLM (chunked if large) → LLM returns quality assessment + recommendations
3. **User Review:** Results shown with explanations → User can accept/reject/modify suggestions
4. **Generation:** Based on user choices, modules generate docs/configs/content
5. **Export:** Files written to disk or integrated into original project

---

## Tech Stack

### Frontend
- **Framework:** Next.js 15.5
- **Version:** Latest stable (Nov 2025)
- **Key Libraries:**
  - `react` 19.2 (with React Compiler)
  - `next` 15.5 (Turbopack builds in beta)
  - `@ai-sdk/react` (Vercel AI SDK)
  - `react-hook-form` (forms)
  - `zod` (validation)
  - `@tanstack/react-query` (data fetching)
  - `lucide-react` (icons)
  - `@radix-ui/react-*` (accessible components via shadcn/ui)
  - `react-markdown` (render generated docs)
  - `@uiw/react-codemirror` (code editor)
- **Styling:** Tailwind CSS v4 + shadcn/ui component library
- **State Management:** React Server Components + Zustand (client state only)

### Backend
- **Framework:** Next.js 15 API Routes + Server Actions
- **Version:** 15.5
- **Language:** TypeScript 5.6
- **Runtime:** Node.js 22 LTS
- **Key Libraries:**
  - `openai` (OpenRouter-compatible SDK)
  - `ollama` (local LLM client)
  - `tree-sitter` + language parsers (code analysis)
  - `eslint` + plugins (JavaScript/TypeScript linting)
  - `semgrep` (multi-language SAST)
  - `swagger-jsdoc` + `redoc` (API doc generation)
  - `spdx-license-list` (license validation)
  - `gray-matter` (Markdown frontmatter)
  - `ejs` (template engine)
  - `zod` (schema validation)

### Database

**Local Development:**
- **Type:** SQLite (via `better-sqlite3`)
- **Version:** 3.x
- **ORM/Query Builder:** Drizzle ORM
- **Migration Tool:** Drizzle Kit

**Production (Optional Cloud):**
- **Type:** PostgreSQL 16
- **Hosting:** Vercel Postgres / Supabase
- **Same ORM:** Drizzle ORM (supports both)

**Schema Design:**
```typescript
// Projects table
projects: {
  id: string (uuid)
  name: string
  path: string (local file path or git URL)
  language: string (primary language)
  created_at: timestamp
  updated_at: timestamp
}

// Analysis Results
analysis_results: {
  id: string (uuid)
  project_id: string (FK)
  module: string (quality | docs | license | marketing | deploy)
  results: json (module-specific output)
  created_at: timestamp
}

// Generated Documents
documents: {
  id: string (uuid)
  project_id: string (FK)
  type: string (README | API | LICENSE | MARKETING)
  content: text (generated markdown/text)
  metadata: json (template used, LLM settings)
  created_at: timestamp
}

// LLM Usage Tracking
llm_usage: {
  id: string (uuid)
  project_id: string
  provider: string (openrouter | ollama)
  model: string
  tokens_input: number
  tokens_output: number
  cost: number (if applicable)
  created_at: timestamp
}
```

### Infrastructure
- **Hosting:** Vercel (primary), Docker (self-host option)
- **CI/CD:** GitHub Actions
- **Package Manager:** npm (lockfile v3)
- **Build Tool:** Turbopack (Next.js 15 default)
- **Containerization:** Docker + Docker Compose (for self-hosting)

---

## Project Structure

```
shiplab/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Landing page
│   │   ├── dashboard/          # Main app interface
│   │   │   ├── page.tsx        # Project list
│   │   │   └── [id]/           # Project detail pages
│   │   ├── api/                # API routes
│   │   │   ├── analyze/        # Code analysis endpoints
│   │   │   ├── generate/       # Document generation
│   │   │   ├── llm/            # LLM proxy routes
│   │   │   └── projects/       # Project CRUD
│   │   └── globals.css         # Tailwind imports
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── chat/               # AI chat interface
│   │   ├── analysis/           # Analysis result displays
│   │   ├── editor/             # Document editor
│   │   └── wizard/             # Step-by-step wizards
│   ├── lib/                    # Core libraries
│   │   ├── ai/                 # LLM integration
│   │   │   ├── router.ts       # Route to OpenRouter or Ollama
│   │   │   ├── prompts/        # Prompt templates
│   │   │   └── models.ts       # Model configurations
│   │   ├── analysis/           # Code analysis modules
│   │   │   ├── parser.ts       # tree-sitter wrapper
│   │   │   ├── quality.ts      # ESLint/Semgrep integration
│   │   │   ├── docs.ts         # Extract JSDoc/comments
│   │   │   └── dependencies.ts # Package.json analysis
│   │   ├── generators/         # Content generators
│   │   │   ├── readme.ts       # README generator
│   │   │   ├── api-docs.ts     # OpenAPI/Swagger
│   │   │   ├── license.ts      # License file generator
│   │   │   └── marketing.ts    # Marketing content
│   │   ├── db/                 # Database layer
│   │   │   ├── schema.ts       # Drizzle schema
│   │   │   ├── client.ts       # DB client
│   │   │   └── queries.ts      # Common queries
│   │   └── utils/              # Utility functions
│   └── types/                  # TypeScript types
├── public/                     # Static assets
├── prisma/                     # (Alternative) Prisma migrations
├── tests/                      # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docker/                     # Docker configs
│   ├── Dockerfile
│   └── docker-compose.yml
├── .github/
│   └── workflows/              # CI/CD pipelines
├── docs/                       # Project documentation
├── scripts/                    # Utility scripts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── drizzle.config.ts
└── README.md
```

### File Organization Principles

1. **Co-location:** Keep related files together (components with their tests/styles)
2. **Feature folders:** Group by feature, not by file type
3. **Barrel exports:** Use index.ts for clean imports
4. **Server/Client split:** Mark client components explicitly with 'use client'
5. **API routes:** RESTful naming (GET /api/projects, POST /api/projects)

---

## Database Schema

### Tables & Relationships

#### projects
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY DEFAULT (uuid_v4()),
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  language TEXT NOT NULL,
  framework TEXT,
  git_url TEXT,
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_projects_updated_at ON projects(updated_at DESC);
```

**Purpose:** Store project metadata for tracking analyzed codebases

**Relationships:**
- One-to-many with `analysis_results`
- One-to-many with `documents`
- One-to-many with `llm_usage`

#### analysis_results
```sql
CREATE TABLE analysis_results (
  id TEXT PRIMARY KEY DEFAULT (uuid_v4()),
  project_id TEXT NOT NULL,
  module TEXT NOT NULL,
  results JSON NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_analysis_project ON analysis_results(project_id, module);
```

**Purpose:** Cache analysis results from each module (quality, docs, licensing)

**Relationships:**
- Many-to-one with `projects`

#### documents
```sql
CREATE TABLE documents (
  id TEXT PRIMARY KEY DEFAULT (uuid_v4()),
  project_id TEXT NOT NULL,
  type TEXT NOT NULL,
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSON,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_documents_project ON documents(project_id, type);
```

**Purpose:** Store generated documentation, configs, and marketing content

#### llm_usage
```sql
CREATE TABLE llm_usage (
  id TEXT PRIMARY KEY DEFAULT (uuid_v4()),
  project_id TEXT,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  tokens_input INTEGER NOT NULL,
  tokens_output INTEGER NOT NULL,
  cost REAL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE INDEX idx_llm_usage_date ON llm_usage(created_at DESC);
```

**Purpose:** Track LLM API usage for cost monitoring and analytics

### Data Models (TypeScript)

```typescript
// Using Drizzle ORM
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey().default(sql`(uuid_v4())`),
  name: text('name').notNull(),
  path: text('path').notNull(),
  language: text('language').notNull(),
  framework: text('framework'),
  gitUrl: text('git_url'),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
```

### Migration Strategy

Use Drizzle Kit for schema versioning:
```bash
# Generate migration
npx drizzle-kit generate:sqlite

# Apply migration
npx drizzle-kit push:sqlite
```

---

## API Specification

### Authentication

**Method:** Session-based (local app) + API key (if cloud deployed)

**Headers Required (Cloud only):**
```
Authorization: Bearer <api_key>
Content-Type: application/json
```

### Endpoints

#### POST /api/projects
**Purpose:** Create new project entry

**Request:**
```json
{
  "name": "my-awesome-app",
  "path": "/Users/simon/code/my-app",
  "language": "typescript",
  "framework": "next.js"
}
```

**Response:**
```json
{
  "id": "proj_abc123",
  "name": "my-awesome-app",
  "created_at": "2025-11-18T10:00:00Z"
}
```

**Validation Rules:**
- name: 1-100 characters, alphanumeric + hyphens
- path: valid file system path or git URL
- language: from supported list (typescript, javascript, python, go, rust)

#### POST /api/analyze/quality
**Purpose:** Run code quality analysis on project

**Request:**
```json
{
  "project_id": "proj_abc123",
  "tools": ["eslint", "semgrep"],
  "fix_automatically": false
}
```

**Response:**
```json
{
  "analysis_id": "analysis_xyz789",
  "issues_found": 42,
  "severity_breakdown": {
    "error": 5,
    "warning": 30,
    "info": 7
  },
  "issues": [
    {
      "tool": "eslint",
      "file": "src/app/page.tsx",
      "line": 42,
      "severity": "error",
      "message": "Unexpected var, use let or const instead",
      "rule": "no-var"
    }
  ]
}
```

#### POST /api/generate/readme
**Purpose:** Generate README.md from codebase analysis

**Request:**
```json
{
  "project_id": "proj_abc123",
  "style": "comprehensive",
  "include_badges": true,
  "llm_model": "smollm2:1.7b"
}
```

**Response:**
```json
{
  "document_id": "doc_readme_456",
  "content": "# My Awesome App\n\n...",
  "tokens_used": 1250,
  "cost": 0.0
}
```

#### POST /api/llm/chat
**Purpose:** Send message to AI assistant

**Request:**
```json
{
  "message": "Explain this error: 'Unexpected var'",
  "project_id": "proj_abc123",
  "provider": "ollama",
  "model": "llama3.2:3b"
}
```

**Response (streaming):**
```json
{
  "delta": "This error occurs when...",
  "done": false
}
```

### Rate Limiting

**Local deployment:** No rate limits  
**Cloud deployment:** 
- Free tier: 100 requests/hour
- Pro tier: 1000 requests/hour
- Unlimited tier: No limits

### Versioning

API version in URL: `/api/v1/...`  
Breaking changes increment version number.

---

## Testing Strategy

### Test Coverage Goals
- **Unit tests:** 80% coverage
- **Integration tests:** 60% coverage
- **E2E tests:** Critical paths only

### Testing Frameworks
- **Unit:** Vitest (faster than Jest)
- **Integration:** Vitest + Supertest
- **E2E:** Playwright

### Required Tests

**For every feature:**
1. Happy path test (feature works as expected)
2. Error handling test (graceful failures)
3. Edge case tests (empty inputs, large files, etc.)
4. AI response mocking (don't call real LLMs in tests)

**Test file naming:** `<filename>.test.ts` (co-located with source)

**Example test structure:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { analyzeCodeQuality } from '@/lib/analysis/quality';

describe('analyzeCodeQuality', () => {
  it('should detect ESLint errors', async () => {
    const result = await analyzeCodeQuality({
      projectPath: '/test/fixtures/bad-code',
      tools: ['eslint'],
    });
    
    expect(result.issues).toHaveLength(5);
    expect(result.issues[0].severity).toBe('error');
  });

  it('should handle missing project gracefully', async () => {
    await expect(
      analyzeCodeQuality({ projectPath: '/nonexistent', tools: [] })
    ).rejects.toThrow('Project not found');
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
npm test -- src/lib/analysis/quality.test.ts

# Run E2E tests
npm run test:e2e
```

---

## Code Style & Standards

### Formatting
- **Tool:** Prettier 3.x
- **Config:** `.prettierrc.json`
- **Run:** `npm run format`

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### Linting
- **Tool:** ESLint 9.x + TypeScript ESLint
- **Config:** `eslint.config.js`
- **Run:** `npm run lint`

**Key rules:**
- No `any` types (use `unknown` instead)
- Prefer `const` over `let`
- No unused variables
- Consistent import ordering

### Naming Conventions
- **Variables:** camelCase (`projectData`, `userName`)
- **Functions:** camelCase (`analyzeCode`, `generateReadme`)
- **Classes:** PascalCase (`ProjectAnalyzer`, `DocumentGenerator`)
- **Files:** kebab-case (`code-analyzer.ts`, `readme-generator.tsx`)
- **Directories:** kebab-case (`api/analyze`, `lib/generators`)
- **Components:** PascalCase (`ChatInterface.tsx`, `ProjectDashboard.tsx`)

### Code Patterns

**Preferred:**
```typescript
// Use async/await with try-catch
async function analyzeProject(id: string) {
  try {
    const project = await db.query.projects.findFirst({ where: eq(projects.id, id) });
    return project;
  } catch (error) {
    console.error('Failed to analyze:', error);
    throw new Error('Analysis failed');
  }
}

// Use Zod for validation
const ProjectSchema = z.object({
  name: z.string().min(1).max(100),
  path: z.string(),
});
```

**Avoid:**
```typescript
// Don't use .then() chains
function analyzeProject(id) {
  return db.query.projects.findFirst({ where: { id } })
    .then(project => project)
    .catch(err => console.log(err));
}

// Don't skip type annotations
function processData(data) {
  return data.map(item => item.value);
}
```

### Comments & Documentation

- Use JSDoc for public functions
- Explain WHY, not WHAT
- Keep comments up to date
- Document complex algorithms

```typescript
/**
 * Analyzes code quality using multiple static analysis tools.
 * 
 * @param projectPath - Absolute path to project directory
 * @param tools - Array of tool names to run (eslint, semgrep, etc.)
 * @returns Analysis results with issues grouped by severity
 */
export async function analyzeCodeQuality(
  projectPath: string,
  tools: string[]
): Promise<AnalysisResult> {
  // Implementation...
}
```

---

## Implementation Order

### Phase 1: Foundation (Week 1)
**Priority:** CRITICAL  
**Duration:** 5 days

1. **Project Setup** - Next.js 15 app with TypeScript, Tailwind, shadcn/ui
   - Files to create: `src/app/layout.tsx`, `src/app/page.tsx`, `tailwind.config.ts`
   - Dependencies: next, react, typescript, tailwindcss
   - Tests required: None (setup only)

2. **Database Setup** - SQLite with Drizzle ORM
   - Files to create: `src/lib/db/schema.ts`, `src/lib/db/client.ts`
   - Dependencies: drizzle-orm, better-sqlite3
   - Tests required: Connection test, CRUD operations

3. **LLM Integration** - Ollama client + OpenRouter proxy
   - Files to create: `src/lib/ai/router.ts`, `src/lib/ai/models.ts`, `src/app/api/llm/chat/route.ts`
   - Dependencies: ollama, openai (SDK)
   - Tests required: Mock LLM responses, routing logic

4. **Chat Interface** - Basic UI for AI conversation
   - Files to create: `src/components/chat/ChatInterface.tsx`, `src/components/chat/Message.tsx`
   - Dependencies: react-hook-form, @ai-sdk/react
   - Tests required: Message rendering, user input handling

### Phase 2: Code Analysis (Week 2)
**Priority:** HIGH  
**Duration:** 7 days

1. **Code Parser** - tree-sitter integration for multi-language support
   - Files to create: `src/lib/analysis/parser.ts`, `src/lib/analysis/languages/*.ts`
   - Dependencies: tree-sitter, language parsers
   - Tests required: Parse TypeScript, JavaScript, Python projects

2. **ESLint Integration** - Run ESLint programmatically
   - Files to create: `src/lib/analysis/quality.ts`, `src/app/api/analyze/quality/route.ts`
   - Dependencies: eslint, @typescript-eslint/*
   - Tests required: Detect errors in fixture code

3. **Semgrep Integration** - Security scanning
   - Files to create: `src/lib/analysis/security.ts`
   - Dependencies: None (call CLI)
   - Tests required: Detect security issues in fixtures

4. **Results Display** - UI for showing analysis results
   - Files to create: `src/components/analysis/ResultsView.tsx`, `src/components/analysis/IssueCard.tsx`
   - Dependencies: None
   - Tests required: Render issues with correct severity colors

### Phase 3: Documentation Generation (Week 3)
**Priority:** HIGH  
**Duration:** 7 days

1. **README Generator** - AI-powered README creation
   - Files to create: `src/lib/generators/readme.ts`, `src/app/api/generate/readme/route.ts`
   - Dependencies: ejs (templates)
   - Tests required: Generate README from fixture project

2. **API Docs Generator** - OpenAPI/Swagger from code
   - Files to create: `src/lib/generators/api-docs.ts`, `src/app/api/generate/api-docs/route.ts`
   - Dependencies: swagger-jsdoc, redoc
   - Tests required: Extract API routes from Next.js app

3. **License Assistant** - Interactive license selection
   - Files to create: `src/lib/generators/license.ts`, `src/components/wizard/LicenseWizard.tsx`
   - Dependencies: spdx-license-list
   - Tests required: Apply correct license text

4. **Document Editor** - In-app editor for generated docs
   - Files to create: `src/components/editor/DocumentEditor.tsx`
   - Dependencies: @uiw/react-codemirror, react-markdown
   - Tests required: Edit and save documents

### Phase 4: Marketing & Deployment (Week 4)
**Priority:** MEDIUM  
**Duration:** 7 days

1. **Marketing Generator** - Landing page copy, social posts
   - Files to create: `src/lib/generators/marketing.ts`, `src/app/api/generate/marketing/route.ts`
   - Dependencies: None (LLM-based)
   - Tests required: Generate various marketing content types

2. **Deployment Wizard** - Step-by-step deployment guide
   - Files to create: `src/components/wizard/DeploymentWizard.tsx`, `src/lib/generators/deploy.ts`
   - Dependencies: None
   - Tests required: Generate Vercel/Railway/Docker configs

3. **Project Dashboard** - Main UI for managing projects
   - Files to create: `src/app/dashboard/page.tsx`, `src/app/dashboard/[id]/page.tsx`
   - Dependencies: None
   - Tests required: List projects, view project details

4. **Polish & Testing** - E2E tests, error handling, UX improvements
   - Files to create: `tests/e2e/**/*.spec.ts`
   - Dependencies: playwright
   - Tests required: Full user journey from upload to deployment

---

## AI Agent Instructions

### Setup Commands
```bash
# Initial setup
git clone <repo>
cd shiplab

# Install dependencies
npm install

# Set up database
npm run db:migrate

# Set up environment variables
cp .env.example .env
# Edit .env with your settings

# Install Ollama (if not already installed)
# Mac: brew install ollama
ollama pull smollm2:1.7b
ollama pull llama3.2:3b

# Run dev server
npm run dev
```

### Development Workflow

**For each new feature:**
1. Create feature branch: `git checkout -b feature/code-analysis`
2. Implement in this order:
   - Data models (if needed) - `src/lib/db/schema.ts`
   - Business logic - `src/lib/<module>/<feature>.ts`
   - API endpoints (if needed) - `src/app/api/<module>/route.ts`
   - Frontend components (if needed) - `src/components/<feature>/*.tsx`
   - Tests (REQUIRED) - `<feature>.test.ts`
3. Run tests: `npm test`
4. Format code: `npm run format`
5. Lint: `npm run lint`
6. Commit: `git commit -m "feat: add code quality analysis"`

### File Creation Rules

**ALWAYS:**
- Create tests alongside implementation (co-locate test files)
- Follow project structure exactly (no new top-level directories without approval)
- Use established patterns (see Code Patterns section)
- Add proper error handling (try-catch for async, error boundaries for React)
- Include validation (use Zod for API inputs)
- Document public APIs (JSDoc comments)

**NEVER:**
- Skip tests (every feature needs tests)
- Hardcode secrets/credentials (use environment variables)
- Create files outside project structure (ask first)
- Use deprecated dependencies (check npm for latest versions)
- Ignore linting errors (must fix before commit)
- Use `any` type (use `unknown` or proper types)

### Critical Files (Do NOT modify without asking)
- `package.json` - Dependency versions carefully chosen
- `next.config.ts` - Custom build configuration
- `drizzle.config.ts` - Database connection settings
- `.github/workflows/*` - CI/CD pipelines

### Security Requirements

1. **No secrets in code** - Use `.env` files (never commit)
2. **Input validation** - Validate all user inputs with Zod
3. **SQL injection prevention** - Use Drizzle ORM (no raw SQL)
4. **XSS prevention** - React escapes by default, but be careful with `dangerouslySetInnerHTML`
5. **CORS** - Restrict origins in production
6. **Rate limiting** - Implement on API routes in production

### Performance Requirements

1. **Code splitting** - Use dynamic imports for large components
2. **Image optimization** - Use Next.js `<Image>` component
3. **API response time** - Keep under 200ms for simple queries
4. **LLM streaming** - Stream responses for better UX
5. **Database indexes** - Add indexes on frequently queried columns

### Error Handling Pattern
```typescript
// API Route error handling
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = ProjectSchema.parse(body); // Zod validation
    
    const result = await createProject(validated);
    return Response.json(result);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    
    console.error('Project creation failed:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Component error handling (use error boundary)
'use client';
import { ErrorBoundary } from 'react-error-boundary';

export function ProjectDashboard() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <ProjectList />
    </ErrorBoundary>
  );
}
```

---

## Environment Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL="file:./local.db"  # SQLite for local, postgres:// for cloud

# LLM Providers
OPENROUTER_API_KEY="sk-or-v1-..."  # OpenRouter API key (optional)
OLLAMA_HOST="http://localhost:11434"  # Ollama server URL

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: Cloud deployment
POSTGRES_URL="postgres://..."  # If using cloud DB
VERCEL_URL="https://shiplab.vercel.app"
```

### Local Development Setup
```bash
# Copy template
cp .env.example .env

# Fill in values:
# 1. DATABASE_URL: Leave as default for SQLite
# 2. OPENROUTER_API_KEY: Get from https://openrouter.ai (optional)
# 3. OLLAMA_HOST: Default is localhost:11434
```

### Environment-Specific Settings

**Development:**
- Use SQLite database
- Enable verbose logging
- Use local Ollama models by default

**Production:**
- Use PostgreSQL (Vercel Postgres)
- Minimize logging
- Use OpenRouter with rate limiting

---

## Deployment

### Build Process
```bash
# Production build
npm run build

# Test production build locally
npm run start
```

### Pre-Deployment Checklist
- [ ] All tests passing (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Environment variables configured (`.env.production`)
- [ ] Database migrations applied (`npm run db:migrate`)
- [ ] Build succeeds (`npm run build`)
- [ ] Performance check (Lighthouse score > 90)

### Deployment Command

**Vercel (Recommended):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Docker (Self-host):**
```bash
# Build image
docker build -t shiplab .

# Run container
docker run -p 3000:3000 -e DATABASE_URL="..." shiplab
```

### Rollback Procedure

**Vercel:**
```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <deployment-url>
```

**Docker:**
```bash
# Pull previous image version
docker pull shiplab:v1.2.3

# Restart with previous version
docker-compose down && docker-compose up -d
```

---

## Troubleshooting

### Common Issues

**Issue:** `ECONNREFUSED` when calling Ollama  
**Solution:** 
```bash
# Check if Ollama is running
ps aux | grep ollama

# Start Ollama
ollama serve

# Pull models if missing
ollama pull smollm2:1.7b
```

**Issue:** `Database is locked` (SQLite)  
**Solution:** 
```bash
# Close other connections
# Or switch to WAL mode for better concurrency
echo "PRAGMA journal_mode=WAL;" | sqlite3 local.db
```

**Issue:** Next.js build fails with "Module not found"  
**Solution:**
```bash
# Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Debugging Commands
```bash
# Check database contents
npx drizzle-kit studio

# View Ollama logs
ollama logs

# Test API endpoint
curl -X POST http://localhost:3000/api/analyze/quality \
  -H "Content-Type: application/json" \
  -d '{"project_id":"test"}'
```

---

## Dependencies

### Production Dependencies
```json
{
  "next": "^15.5.0",
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "drizzle-orm": "^0.38.0",
  "better-sqlite3": "^11.8.0",
  "openai": "^4.76.0",
  "ollama": "^0.5.12",
  "tree-sitter": "^0.22.1",
  "zod": "^3.24.1",
  "@ai-sdk/react": "^1.2.0",
  "react-hook-form": "^7.55.0",
  "@tanstack/react-query": "^5.62.11",
  "lucide-react": "^0.468.0"
}
```

### Development Dependencies
```json
{
  "typescript": "^5.6.0",
  "vitest": "^2.1.8",
  "playwright": "^1.49.1",
  "eslint": "^9.0.0",
  "@typescript-eslint/parser": "^8.16.0",
  "prettier": "^3.4.2",
  "drizzle-kit": "^0.28.1"
}
```

### Dependency Update Policy

- **Security patches:** Apply immediately
- **Minor versions:** Update monthly
- **Major versions:** Review changelog, test thoroughly before updating
- **Lock file:** Commit `package-lock.json` to ensure reproducible builds

---

## Additional Resources

**Documentation:**
- Next.js 15: https://nextjs.org/docs
- React 19: https://react.dev
- Drizzle ORM: https://orm.drizzle.team
- Ollama: https://ollama.com/docs

**Tutorials:**
- Next.js App Router: https://nextjs.org/learn
- React Server Components: https://react.dev/reference/rsc
- AI SDK: https://sdk.vercel.ai/docs

**Community:**
- GitHub Discussions: (create after launch)
- Discord: (create after launch)
- Twitter/X: (announce updates)

---

**This document is the single source of truth for implementation.**  
**All technical decisions, patterns, and requirements are defined here.**

**Last Updated:** November 18, 2025
