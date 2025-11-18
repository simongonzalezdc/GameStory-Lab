# GameForge Studio - Complete Setup Guide

This guide will walk you through setting up GameForge Studio on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** ≥ 22.0.0 ([Download](https://nodejs.org/))
- **npm** ≥ 10.0.0 (comes with Node.js)
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))
- **Git** ([Download](https://git-scm.com/))

### Optional (but recommended):
- **Ollama** for free local AI models ([Download](https://ollama.com/download))
- **OpenRouter API Key** for cloud AI models ([Get key](https://openrouter.ai/keys))
- **Google API Key** for Gemini models ([Get key](https://aistudio.google.com/app/apikey))

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/Pastorsimon1798/GameStory-Lab.git
cd GameStory-Lab
```

---

## Step 2: Install Dependencies

Install all npm dependencies for all workspace packages:

```bash
npm install
```

This will install dependencies for:
- Root workspace
- Backend (Express + Prisma)
- Frontend (React + Vite)
- Shared types and validation

**Expected output:** `added XXX packages in XXs`

---

## Step 3: Configure Environment Variables

Create your `.env` file from the example:

```bash
cp .env.example .env
```

### Edit `.env` with your settings:

**Minimum required (for local development):**
```env
DATABASE_URL=postgresql://gameforge:gameforge_dev_password@localhost:5432/gameforge
REDIS_URL=redis://localhost:6379
OLLAMA_BASE_URL=http://localhost:11434
```

**Optional (for cloud AI):**
```env
OPENROUTER_API_KEY=sk-or-v1-YOUR-KEY-HERE
GOOGLE_API_KEY=AIzaSy-YOUR-KEY-HERE
```

**Application settings:**
```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
AI_COST_LIMIT_PER_HOUR_USD=5.00
```

---

## Step 4: Start Infrastructure

Start PostgreSQL and Redis using Docker Compose:

```bash
docker-compose up -d
```

**Verify containers are running:**
```bash
docker ps
```

You should see:
- `gameforge-postgres` on port 5432
- `gameforge-redis` on port 6379

**Check container logs:**
```bash
docker-compose logs -f
```

---

## Step 5: Initialize Database

Navigate to the backend package and run Prisma migrations:

```bash
cd packages/backend
npx prisma migrate dev
```

This will:
1. Create the `gameforge` database
2. Run all migrations to create tables:
   - users
   - projects
   - concepts
   - ai_generations
   - validation_results
3. Generate the Prisma client

**Generate Prisma client only (if needed):**
```bash
npx prisma generate
```

**View database in Prisma Studio (optional):**
```bash
npx prisma studio
```
Opens GUI at http://localhost:5555

---

## Step 6: Install Ollama (Optional but Recommended)

Ollama provides free, unlimited local AI models.

### Install Ollama:

**macOS/Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:**
Download from https://ollama.com/download

### Pull recommended models (November 2025 - Mac M4 16GB Optimized):

```bash
# PRIMARY: MoE model - 30B quality with 3B memory! (MUST HAVE)
ollama pull qwen3:30b-a3b

# HIGH QUALITY: Best reasoning (9.8T tokens training)
ollama pull phi4:14b

# CREATIVE: Best for narrative and lore generation
ollama pull qwen3-coder:7b

# STRUCTURED: Best for JSON and mechanics generation
ollama pull qwen3:7b

# REASONING: Advanced step-by-step reasoning
ollama pull deepseek-r1:8b

# LIGHTWEIGHT: Versatile, uses <8GB RAM
ollama pull llama4:8b
```

**Model Sizes & Performance (Mac M4 16GB):**
- `qwen3:30b-a3b` - 8-12GB RAM, 20-30 tok/s (MoE magic!)
- `phi4:14b` - 11-13GB RAM, 25-35 tok/s (highest quality)
- `qwen3-coder:7b` - 6-8GB RAM, 35-45 tok/s (best creative)
- `qwen3:7b` - 6-8GB RAM, 35-45 tok/s (best JSON)
- `deepseek-r1:8b` - 7-9GB RAM, 30-40 tok/s (reasoning)
- `llama4:8b` - <8GB RAM, 35-45 tok/s (lightweight)

**Verify Ollama is running:**
```bash
ollama list
ollama ps
```

---

## Step 7: Start Development Servers

### Option A: Start both servers with one command (from root):

```bash
npm run dev
```

This starts both backend and frontend concurrently.

### Option B: Start servers separately:

**Terminal 1 - Backend:**
```bash
cd packages/backend
npm run dev
```
Backend runs on http://localhost:3001

**Terminal 2 - Frontend:**
```bash
cd packages/frontend
npm run dev
```
Frontend runs on http://localhost:5173

---

## Step 8: Verify Installation

### Check API Health:
```bash
curl http://localhost:3001/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-17T...",
  "database": "connected",
  "ai": {
    "clients": [
      {"name": "Ollama", "type": "ollama", "available": true},
      ...
    ]
  }
}
```

### Check Frontend:

Open http://localhost:5173 in your browser.

You should see the GameForge Studio dashboard with system status.

---

## Troubleshooting

### Database Connection Failed

**Error:** `Connection refused at localhost:5432`

**Solutions:**
1. Verify Docker containers are running: `docker ps`
2. Restart containers: `docker-compose restart`
3. Check logs: `docker-compose logs postgres`
4. Verify DATABASE_URL in `.env` matches docker-compose.yml

---

### Prisma Migration Fails

**Error:** `P1001: Can't reach database server`

**Solutions:**
1. Ensure PostgreSQL container is healthy: `docker ps`
2. Wait a few seconds after `docker-compose up` for DB to initialize
3. Reset database: `npx prisma migrate reset` (WARNING: deletes all data)

---

### Ollama Not Available

**Error:** `Connection refused at localhost:11434`

**Solutions:**
1. Check if Ollama is running: `ollama list`
2. Start Ollama: `ollama serve`
3. Install recommended model: `ollama pull qwen3:30b-a3b` (MoE - best for 16GB!)
4. Verify `OLLAMA_BASE_URL` in `.env`

**Note:** If Ollama is unavailable, the system will use OpenRouter/Google APIs (if configured).

**Model Selection (November 2025):**
- The system automatically selects the best available model
- Priority: qwen3:30b-a3b > phi4:14b > qwen3-coder:7b > qwen3:7b
- MoE models provide 30B quality with only 3B memory usage!

---

### OpenRouter API Errors

**Error:** `429 Too Many Requests`

**Solutions:**
1. System automatically falls back to Ollama
2. Check current hour cost: `GET /health`
3. Increase cost limit in `.env`: `AI_COST_LIMIT_PER_HOUR_USD=10.00`
4. Wait for next hour (cost limit resets hourly)

---

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3001`

**Solutions:**
1. Change port in `.env`: `PORT=3002`
2. Kill process using port: `lsof -ti:3001 | xargs kill`
3. Or use different ports for frontend/backend

---

### Frontend Build Fails

**Error:** `Module not found` or TypeScript errors

**Solutions:**
1. Rebuild shared package: `cd packages/shared && npm run build`
2. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
3. Restart TypeScript server in your IDE

---

## Development Workflow

### Running Tests

```bash
# All packages
npm test

# Specific package
cd packages/backend
npm test
```

### Database Management

```bash
cd packages/backend

# Create new migration
npx prisma migrate dev --name add_new_field

# View database
npx prisma studio

# Reset database (deletes all data!)
npx prisma migrate reset
```

### Linting and Formatting

```bash
# Lint all packages
npm run lint

# Format all files
npm run format
```

### Building for Production

```bash
# Build all packages
npm run build

# Build specific package
cd packages/backend
npm run build
```

---

## API Usage Examples

### Create a Project

```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Epic RPG",
    "genre": "rpg"
  }'
```

### Generate Mechanics

```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "PROJECT_ID_HERE",
    "taskType": "mechanics",
    "context": {
      "genre": "rpg",
      "userPrompt": "Create turn-based combat with elemental magic"
    },
    "modelPreference": "auto"
  }'
```

### Validate Concept

```bash
curl -X POST http://localhost:3001/api/validate \
  -H "Content-Type: application/json" \
  -d '{
    "conceptId": "CONCEPT_ID_HERE",
    "mechanics": {...},
    "lore": {...}
  }'
```

### Export to Markdown

```bash
curl -X POST http://localhost:3001/api/export \
  -H "Content-Type: application/json" \
  -d '{
    "conceptId": "CONCEPT_ID_HERE",
    "template": "gdd"
  }'
```

---

## Next Steps

1. **Read the docs:** Check `Dev Docs/` for full specifications
2. **Explore the API:** Visit http://localhost:3001/api for endpoint list
3. **Try the examples:** Use the curl commands above to test features
4. **Configure AI models:** Add your API keys to `.env` for cloud AI
5. **Start building:** Create your first game concept!

---

## Getting Help

- **GitHub Issues:** https://github.com/Pastorsimon1798/GameStory-Lab/issues
- **Documentation:** See `Dev Docs/` folder
- **API Reference:** http://localhost:3001/api

---

**Happy game concept creating! 🎮✨**
