# GameForge Studio

**AI-Powered Game Concept Generator for Indie Developers**

GameForge Studio helps indie game developers create cohesive, professional game concepts before development starts. Using AI orchestration and consistency validation, it ensures your mechanics and lore work together seamlessly.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue.svg)](https://www.typescriptlang.org/)

---

## ✨ Features

### ✅ Implemented & Working:
- **🎮 Flexible Workflow**: Start with mechanics OR lore - AI adapts to your creative process
- **🖥️ Full Web Interface**: Complete React UI with project management, concept editing, validation, and export
- **🤖 AI Model Orchestration**: Automatically selects optimal AI models (DeepSeek, Qwen, Gemini, Ollama)
- **✅ Comprehensive Validation**: 26 validation rules across 6 categories with real-time feedback
- **🎯 Genre Templates**: 5 pre-built templates (RPG, FPS, Strategy, Puzzle, Survival) with visual browser
- **🔄 Iterative Refinement**: Full version tracking and change comparison with 4 refinement focuses
- **📝 Professional Export**: Generate GDD, pitch decks, or technical specs in markdown
- **🏷️ Title Generation**: Advanced title suggestions with SEO analysis and market fit scoring
- **💰 Cost Optimization**: Intelligent fallback to local Ollama models to minimize API costs
- **🔧 Full REST API**: Complete backend with 7 endpoint categories
- **📊 Health Monitoring**: Real-time system status with AI provider tracking and cost monitoring

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 22.0.0
- **Docker** and **Docker Compose** (for PostgreSQL and Redis)
- **Ollama** (optional, for local AI models)
- **OpenRouter API Key** (optional, for cloud AI models)
- **Google API Key** (optional, for Gemini models)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Pastorsimon1798/GameStory-Lab.git
   cd GameStory-Lab
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

4. **Start infrastructure (PostgreSQL + Redis)**
   ```bash
   docker-compose up -d
   ```

5. **Initialize database**
   ```bash
   cd packages/backend
   npx prisma migrate dev
   npx prisma generate
   cd ../..
   ```

6. **Install and configure Ollama (optional but recommended)**
   ```bash
   # macOS/Linux
   curl -fsSL https://ollama.com/install.sh | sh

   # Pull recommended model
   ollama pull llama3.3:70b
   ```

7. **Start development servers**
   ```bash
   # Terminal 1: Backend
   cd packages/backend
   npm run dev

   # Terminal 2: Frontend
   cd packages/frontend
   npm run dev
   ```

8. **Access the application**
   - **Frontend UI**: http://localhost:5173
   - **Backend API**: http://localhost:3001
   - **API Health Check**: http://localhost:3001/health

---

## 🏗️ Architecture

GameForge Studio uses a monorepo structure with npm workspaces:

```
gameforge-studio/
├── packages/
│   ├── frontend/          # React + TypeScript UI ✅
│   ├── backend/           # Node.js + Express API ✅
│   └── shared/            # Shared types and validation ✅
├── docker-compose.yml     # PostgreSQL + Redis ✅
├── .env.example          # Environment template ✅
└── README.md             # This file
```

### Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | React 19 + TypeScript | User interface |
| **Backend** | Node.js + Express | API server |
| **Database** | PostgreSQL 17 | Structured data + JSONB |
| **Cache/Queue** | Redis 7 | Job queue (BullMQ) |
| **ORM** | Prisma 6 | Type-safe database access |
| **AI Gateway** | OpenRouter + Google + Ollama | Multi-model AI orchestration |

---

## 🔑 AI Provider Configuration

### OpenRouter (Recommended for Cloud AI)

1. Get API key from [OpenRouter](https://openrouter.ai/keys)
2. Add to `.env`:
   ```
   OPENROUTER_API_KEY=sk-or-v1-your-key-here
   ```
3. Provides access to DeepSeek, Qwen, GPT, Claude, and more

### Google Gemini (For Consistency Validation)

1. Get API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add to `.env`:
   ```
   GOOGLE_API_KEY=AIzaSy-your-key-here
   ```
3. Used for fast consistency checking with 1M context

### Ollama (Free Local Models)

1. Install Ollama: https://ollama.com/download
2. Pull models:
   ```bash
   ollama pull llama3.3:70b  # Primary model
   ollama pull qwen2.5:32b   # Alternative
   ```
3. Ollama runs on `http://localhost:11434` by default
4. **No API key required** - completely free and unlimited

---

## 📊 Database Schema

The database uses PostgreSQL with JSONB for flexible concept storage:

- **users**: User accounts (future multi-user support)
- **projects**: Top-level game projects
- **concepts**: Versioned game concepts (mechanics + lore as JSONB)
- **ai_generations**: Log of all AI API calls for cost tracking
- **validation_results**: Consistency check results

### Key Features

- **JSONB fields** for flexible mechanics/lore structure
- **GIN indexes** on JSONB for fast queries
- **Versioning** for iterative refinement
- **Automatic timestamps** for all records

---

## 🛠️ API Endpoints

### Projects

- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project with concepts
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Generation

- `POST /api/generate` - Generate mechanics, lore, or titles
  - Task types: `mechanics`, `lore`, `title`, `refinement`
  - Model preference: `auto`, `openrouter`, `ollama`

### Validation

- `POST /api/validate` - Run consistency validation
- `GET /api/validate/rules` - List all validation rules
- `PATCH /api/validate/:conceptId/dismiss/:ruleId` - Dismiss validation issue

### Export

- `POST /api/export` - Export concept to markdown
  - Templates: `gdd`, `pitch`, `technical`

### System

- `GET /health` - API health check
- `GET /api` - API documentation

---

## 💡 Usage Examples

### Creating a New Game Concept

```bash
# 1. Create a project
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Sci-Fi RPG",
    "genre": "rpg"
  }'

# 2. Generate mechanics
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "<project-id>",
    "taskType": "mechanics",
    "context": {
      "genre": "rpg",
      "userPrompt": "Create a space exploration RPG with ship customization"
    },
    "modelPreference": "auto"
  }'

# 3. Validate consistency
curl -X POST http://localhost:3001/api/validate \
  -H "Content-Type: application/json" \
  -d '{
    "conceptId": "<concept-id>",
    "mechanics": { ... },
    "lore": { ... }
  }'

# 4. Export to markdown
curl -X POST http://localhost:3001/api/export \
  -H "Content-Type: application/json" \
  -d '{
    "conceptId": "<concept-id>",
    "template": "gdd"
  }'
```

---

## 🧪 Development

### Running Tests

```bash
# Backend tests
cd packages/backend
npm test

# Frontend tests
cd packages/frontend
npm test
```

### Database Management

```bash
# Create a new migration
cd packages/backend
npx prisma migrate dev --name description_of_changes

# Open Prisma Studio (GUI)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Linting and Formatting

```bash
# Lint all packages
npm run lint

# Format all files
npm run format
```

---

## 🐛 Troubleshooting

### OpenRouter API returns 429 (rate limit)
**Solution**: The orchestrator automatically falls back to Ollama. Check logs for fallback confirmation.

### Prisma migration fails
**Solution**: Ensure Docker containers are running (`docker-compose ps`). Check schema syntax. Rollback with `npx prisma migrate resolve --rolled-back <migration>`.

### Ollama not responding
**Solution**:
```bash
# Check if Ollama is running
ollama list

# Start Ollama
ollama serve

# Ensure model is installed
ollama pull llama3.3:70b
```

### Frontend can't connect to backend
**Solution**: Verify `FRONTEND_URL` in `.env`. Check CORS settings in `packages/backend/src/server.ts`. Ensure backend is running on port 3001.

---

## 📝 Environment Variables

See `.env.example` for all available configuration options.

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string

### Optional (but recommended)
- `OPENROUTER_API_KEY` - For cloud AI models
- `GOOGLE_API_KEY` - For Gemini validation
- `OLLAMA_BASE_URL` - Local Ollama instance (default: http://localhost:11434)

### Application Settings
- `NODE_ENV` - development | production | test
- `PORT` - Backend port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:5173)
- `AI_COST_LIMIT_PER_HOUR_USD` - Spending cap (default: 5.00)

---

## 🗺️ Roadmap

### ✅ Phase 1: Backend Foundation (Completed - 100%)
- [x] Monorepo setup with TypeScript
- [x] Database schema with Prisma (5 tables)
- [x] AI client abstraction (OpenRouter, Google, Ollama)
- [x] AI Model Orchestrator with intelligent routing
- [x] Backend REST API (projects, generate, validate, export)
- [x] Consistency Validation Engine framework
- [x] Markdown export templates (GDD, Pitch, Technical)
- [x] Cost tracking and rate limiting

### ✅ Phase 2: Complete Validation System (Completed - 100%)
- [x] Validation engine architecture with parallel processing
- [x] **All 26 validation rules implemented** ✅
  - [x] Mechanics-Lore Alignment (10 rules)
  - [x] Genre Conventions (1 meta-rule)
  - [x] World Physics (5 rules)
  - [x] Progression Coherence (4 rules)
  - [x] Narrative Structure (3 rules)
  - [x] Technical Feasibility (3 rules)

### ✅ Phase 3: Genre Templates & Refinement (Completed - 100%)
- [x] **Genre template system** ✅
  - [x] 5 JSON template files (RPG, FPS, Strategy, Puzzle, Survival)
  - [x] Template loading service
  - [x] Template customization API
- [x] Dedicated refinement service with version tracking
- [x] Enhanced title generation service with SEO analysis

### ✅ Phase 4: Frontend UI (Completed - 100%)
- [x] React UI with Vite + TypeScript setup
- [x] Main layout with navigation
- [x] Project management dashboard with CRUD operations
- [x] Concept editor with mechanics and lore display
- [x] Real-time validation panel with live issue detection
- [x] Export dialog with multiple template options
- [x] Template browser with visual preview and project creation
- [x] System health monitoring page
- [x] Complete routing and state management

### 🔮 Phase 5: Advanced Features (Future)
- [ ] Multi-user support with authentication
- [ ] Cloud saves and sync
- [ ] Visual concept art generation (Stable Diffusion)
- [ ] Community template marketplace
- [ ] Hosted SaaS offering
- [ ] Custom model training

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with insights from the [game design research community](https://www.gamedeveloper.com)
- AI models powered by [OpenRouter](https://openrouter.ai), [Google Gemini](https://ai.google.dev/), and [Ollama](https://ollama.com)
- Inspired by the needs of indie game developers worldwide

---

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/Pastorsimon1798/GameStory-Lab/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Pastorsimon1798/GameStory-Lab/discussions)

---

**Generated with ❤️ for indie game developers**
