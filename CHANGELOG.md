# Changelog

All notable changes to GameForge Studio will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-18

### Added

#### Core Features
- **Flexible Workflow Engine**: Start with mechanics OR lore - AI adapts to your creative process
- **Full Web Interface**: Complete React UI with project management, concept editing, validation, and export
- **AI Model Orchestration**: Automatically selects optimal AI models (DeepSeek, Qwen, Gemini, Ollama)
- **Comprehensive Validation**: 26 validation rules across 6 categories with real-time feedback
- **Genre Templates**: 5 pre-built templates (RPG, FPS, Strategy, Puzzle, Survival) with visual browser
- **Iterative Refinement**: Full version tracking and change comparison with 4 refinement focuses
- **Professional Export**: Generate GDD, pitch decks, or technical specs in markdown
- **Title Generation**: Advanced title suggestions with SEO analysis and market fit scoring
- **Cost Optimization**: Intelligent fallback to local Ollama models to minimize API costs
- **Full REST API**: Complete backend with 7 endpoint categories
- **Health Monitoring**: Real-time system status with AI provider tracking and cost monitoring

#### Technical Infrastructure
- Rate limiting middleware (20 requests/minute per IP)
- Winston logging system (replaces console.* calls)
- Centralized error handling utilities
- Basic test infrastructure with Vitest
- Environment variable template (.env.example)
- Project documentation (LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, CHANGELOG)

#### Validation Rules (26 total)
- **Mechanics-Lore Alignment** (10 rules): Player abilities match, resource logic, win conditions, progression, combat consistency, magic system, technology level, death consequences, multiplayer justification, economy worldbuilding
- **Genre Conventions** (1 meta-rule): Validates genre-specific expectations
- **World Physics** (5 rules): Gravity, material properties, time consistency, spatial logic, causality
- **Progression Coherence** (4 rules): Power curve, gating justification, skill mastery, endgame reward
- **Narrative Structure** (3 rules): Protagonist motivation, conflict resolution, theme consistency
- **Technical Feasibility** (3 rules): Complexity estimate, performance considerations, scope reality check

#### API Endpoints
- `GET /health` - System health check
- `GET /api` - API documentation
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project with concepts
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/generate` - Generate mechanics, lore, or titles
- `POST /api/validate` - Run consistency validation
- `GET /api/validate/rules` - List all validation rules
- `PATCH /api/validate/:conceptId/dismiss/:ruleId` - Dismiss validation issue
- `POST /api/export` - Export concept to markdown
- `GET /api/templates` - List genre templates
- `GET /api/templates/:genre` - Get specific template
- `POST /api/templates/:genre/customize` - Customize template
- `POST /api/templates/:genre/create-project` - Create project from template
- `POST /api/refinement` - Refine concept
- `GET /api/refinement/history/:projectId` - Get version history
- `POST /api/refinement/compare` - Compare versions
- `POST /api/refinement/rollback` - Rollback to previous version
- `POST /api/titles/generate` - Generate title suggestions
- `POST /api/titles/variations` - Generate title variations
- `POST /api/titles/analyze` - Analyze title SEO and market fit

### Technical Details
- **Backend**: Node.js 22 + Express 4 + TypeScript 5.6
- **Frontend**: React 19 + TypeScript + Vite
- **Database**: PostgreSQL 17 + Prisma 6
- **AI Providers**: OpenRouter, Google Gemini, Ollama
- **Infrastructure**: Docker Compose (PostgreSQL + Redis)

### Known Limitations
- Single-user mode (no authentication in MVP)
- Manual Ollama setup required for local AI
- No automated test coverage yet (basic smoke tests only)
- Redis queue not yet implemented (planned for future)

---

## [Unreleased]

### Planned
- Multi-user support with authentication
- Cloud deployment guides
- Advanced features (concept art generation, community templates)
- Mobile responsive optimizations
- Comprehensive test suite
- Performance optimizations

---

[1.0.0]: https://github.com/yourusername/gameforge-studio/releases/tag/v1.0.0

