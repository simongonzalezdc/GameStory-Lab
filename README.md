# AI Game Asset Generator

A powerful web application that generates game-ready 2D and isometric assets using AI. Supports multiple AI providers including **Ollama for local, privacy-focused generation**.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎮 Features

### Core Features
- **Text-to-Sprite Generation** - Generate assets from natural language prompts
- **Image-to-Sprite Conversion** - Upload reference images and generate variations
- **Natural Language Refinement** - Chat-based asset refinement
- **🔥 Local Model Support (Ollama)** - Run AI models locally for complete privacy, no API costs, and offline usage
- **Multi-Provider Support** - OpenRouter (FLUX), Google Gemini, ChatGPT (DALL-E 3), and Ollama
- **Asset Library** - Auto-organized library with search, filter, and tagging
- **Game-Ready Export** - Export as PNG, sprite sheets, or texture atlases
- **Game Engine Support** - Unity, Godot, Unreal, and generic formats

### 🌟 Ollama Integration Highlights
- **100% Private** - All data stays on your machine
- **Zero API Costs** - Unlimited generations with no usage fees
- **Offline Capable** - Works without internet after model download
- **Custom Models** - Use any Ollama-compatible model
- **Recommended Models**: `llama3.2-vision:11b`, `llava:13b`

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│   React 19 + TypeScript Frontend   │
│   - Generation UI                   │
│   - Asset Library                   │
│   - Model Selector (Cloud/Local)    │
└───────────────┬─────────────────────┘
                │ REST API
                ▼
┌─────────────────────────────────────┐
│   FastAPI Backend (Python 3.14)    │
│   - LangChain Orchestration         │
│   - Multi-provider AI routing       │
│   - Image processing                │
└───────────────┬─────────────────────┘
                │
        ┌───────┴───────┬────────────┬─────────┐
        ▼               ▼            ▼         ▼
  ┌──────────┐   ┌──────────┐  ┌────────┐ ┌─────────┐
  │OpenRouter│   │  Google  │  │ChatGPT │ │ Ollama  │
  │  (FLUX)  │   │ (Gemini) │  │(DALL-E)│ │ (Local) │
  └──────────┘   └──────────┘  └────────┘ └─────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.14** (or 3.11+)
- **Node.js 20+** and npm
- **Supabase Account** (free tier works)
- **At least one AI provider**:
  - OpenRouter API key, OR
  - Google API key, OR
  - OpenAI API key, OR
  - **Ollama installed locally** (recommended for privacy)

### Option 1: Quick Setup with Ollama (Recommended)

This option requires no API keys and runs everything locally!

```bash
# 1. Install Ollama (https://ollama.ai)
# macOS/Linux:
curl -fsSL https://ollama.ai/install.sh | sh

# Windows: Download installer from https://ollama.ai/download

# 2. Pull a vision model
ollama pull llama3.2-vision:11b

# 3. Start Ollama server (keep this running)
ollama serve

# 4. Clone and setup project
git clone <your-repo-url>
cd Generative-Assets-Lab

# 5. Backend setup
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 6. Create .env file
cp .env.example .env
# Edit .env and add your Supabase credentials
# Ollama will work out of the box!

# 7. Start backend
uvicorn app.main:app --reload

# 8. Frontend setup (new terminal)
cd ../frontend
npm install
npm run dev

# 9. Open http://localhost:5173
```

That's it! You can now generate assets locally with Ollama.

### Option 2: Setup with Cloud Providers

```bash
# Follow steps 1-6 from Option 1, but in .env add:
OPENROUTER_API_KEY=sk-or-v1-...  # Get from https://openrouter.ai/keys
# OR
GOOGLE_API_KEY=AIzaSy...  # Get from https://makersuite.google.com
# OR
OPENAI_API_KEY=sk-proj-...  # Get from https://platform.openai.com

# Continue with steps 7-9
```

## 📋 Detailed Setup

### Backend Setup

1. **Create virtual environment**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your credentials:
   ```env
   # Supabase (Required)
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

   # AI Providers (at least one required)
   OPENROUTER_API_KEY=sk-or-v1-...  # Optional
   GOOGLE_API_KEY=AIzaSy...  # Optional
   OPENAI_API_KEY=sk-proj-...  # Optional

   # Ollama (Recommended - no API key needed!)
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_ENABLED=true

   # App Settings
   CORS_ORIGINS=http://localhost:5173
   ENVIRONMENT=development
   ```

4. **Set up Supabase**
   - Create account at [supabase.com](https://supabase.com)
   - Create new project
   - Go to Settings → API → Copy URL and service_role key
   - Run migration: Copy SQL from `supabase/migrations/001_create_assets_table.sql` and run in Supabase SQL Editor
   - Create storage bucket: Go to Storage → Create bucket → Name: `game-assets` → Public

5. **Start backend**
   ```bash
   uvicorn app.main:app --reload
   ```

   API will be available at `http://localhost:8000`
   - Docs: `http://localhost:8000/docs`
   - Health: `http://localhost:8000/api/health`
   - Ollama status: `http://localhost:8000/api/health/ollama`

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```

   Edit `.env`:
   ```env
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   VITE_API_BASE_URL=http://localhost:8000
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   Frontend will be available at `http://localhost:5173`

### Ollama Setup (Optional but Recommended)

**Why use Ollama?**
- ✅ Complete privacy (data never leaves your machine)
- ✅ No API costs (unlimited generations)
- ✅ Works offline
- ✅ Customizable models

**Installation:**

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai/download
```

**Download models:**

```bash
# Recommended: LLaMA 3.2 Vision (11GB)
ollama pull llama3.2-vision:11b

# Alternative: LLaVA (7GB)
ollama pull llava:13b

# List all models
ollama list
```

**Start Ollama server:**

```bash
ollama serve
```

Keep this running in a terminal. The backend will automatically detect it.

**Verify Ollama is working:**

```bash
curl http://localhost:11434/api/tags
```

## 🎯 Usage

### Generating Your First Asset

1. Open the app at `http://localhost:5173`
2. Enter a prompt, e.g., "pixel art fantasy sword with blue gems, 32x32"
3. Select a model:
   - **Ollama (Local)** - If you installed Ollama (recommended for privacy)
   - **OpenRouter** - Fast cloud generation
   - **Google Gemini** - High quality
   - **ChatGPT** - Photorealistic
4. Click "Generate Asset"
5. Wait a few seconds for generation
6. Asset appears in library below

### Using Ollama Models

When Ollama is running:
1. Model selector shows "Ollama (Local) ✓"
2. Select it to see available local models
3. Choose your model (e.g., `llama3.2-vision:11b`)
4. Generate as normal - everything runs on your machine!
5. **Note**: First generation may be slower (model loading), subsequent ones are faster

### Exporting Assets

1. Click assets in library to select them (purple border)
2. Click "Export Selected"
3. Choose format:
   - **PNG** - Individual files
   - **Sprite Sheet** - Packed with JSON metadata
   - **Unity/Godot** - Engine-specific formats
4. Download ZIP file
5. Import into your game engine

## 🛠️ Development

### Project Structure

```
Generative-Assets-Lab/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   │   ├── generate.py # Generation endpoints
│   │   │   ├── assets.py   # Asset management
│   │   │   ├── export.py   # Export functionality
│   │   │   └── health.py   # Health checks
│   │   ├── core/           # Core configuration
│   │   │   ├── config.py   # Settings
│   │   │   └── security.py # Auth
│   │   ├── services/       # Business logic
│   │   │   ├── ai_service.py       # Multi-provider AI
│   │   │   ├── image_service.py    # Image processing
│   │   │   ├── storage_service.py  # Supabase
│   │   │   └── export_service.py   # Sprite sheets
│   │   ├── models/         # Pydantic models
│   │   └── main.py         # FastAPI app
│   ├── requirements.txt
│   └── .env
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── GenerationForm.tsx
│   │   │   └── AssetLibrary.tsx
│   │   ├── services/      # API client
│   │   ├── types/         # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── .env
├── supabase/              # Database migrations
│   └── migrations/
└── README.md
```

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm run test
```

### Code Formatting

```bash
# Backend
cd backend
black . && isort .

# Frontend
cd frontend
npm run format
```

## 📚 API Documentation

### Key Endpoints

**Generate Asset**
```bash
POST /api/generate
{
  "prompt": "pixel art sword",
  "model": "ollama",  # or "openrouter", "google", "chatgpt"
  "ollama_model": "llama3.2-vision:11b",  # required if model=ollama
  "dimensions": {"width": 64, "height": 64}
}
```

**Check Ollama Status**
```bash
GET /api/health/ollama
# Returns: { "available": true, "models": [...] }
```

**List Assets**
```bash
GET /api/assets?limit=50
```

**Export Assets**
```bash
POST /api/export
{
  "asset_ids": ["uuid1", "uuid2"],
  "format": "sprite-sheet-json",
  "target_engine": "unity"
}
```

Full API docs: `http://localhost:8000/docs`

## 🔧 Troubleshooting

### Ollama Not Working

**Issue**: "Ollama not available" error

**Solutions**:
1. Check Ollama is installed: `ollama --version`
2. Start Ollama server: `ollama serve`
3. Verify it's running: `curl http://localhost:11434/api/tags`
4. Check backend .env: `OLLAMA_ENABLED=true`
5. Try pulling a model: `ollama pull llama3.2-vision:11b`

### Backend Can't Connect to Supabase

**Issue**: "Supabase client not initialized"

**Solutions**:
1. Check `.env` has correct `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
2. Verify credentials in Supabase dashboard
3. Ensure bucket `game-assets` exists and is public

### Frontend Can't Reach Backend

**Issue**: CORS errors or connection refused

**Solutions**:
1. Check backend is running: `curl http://localhost:8000/api/health`
2. Verify frontend `.env` has `VITE_API_BASE_URL=http://localhost:8000`
3. Check backend CORS settings in `.env`: `CORS_ORIGINS=http://localhost:5173`

### Generation Fails

**Issue**: "Generation failed" errors

**Solutions**:
- For cloud providers: Check API keys are valid and have credit
- For Ollama: Ensure model is downloaded (`ollama list`)
- Check logs: `uvicorn app.main:app --reload --log-level=debug`

## 🌟 Recommended Ollama Models

| Model | Size | Use Case | Command |
|-------|------|----------|---------|
| llama3.2-vision:11b | 11GB | Best quality, vision capable | `ollama pull llama3.2-vision:11b` |
| llava:13b | 7GB | Good quality, faster | `ollama pull llava:13b` |
| llava:7b | 4GB | Lightweight, quick | `ollama pull llava:7b` |

**Hardware Requirements**:
- **Minimum**: 8GB RAM, CPU only (slow)
- **Recommended**: 16GB RAM, GPU with 8GB+ VRAM
- **Optimal**: 32GB RAM, GPU with 16GB+ VRAM

## 🚢 Deployment

### Backend (Railway/Render)

```bash
# Install Railway CLI
npm install -g railway

# Login and init
railway login
railway init

# Set environment variables
railway env set SUPABASE_URL="https://..."
railway env set SUPABASE_SERVICE_ROLE_KEY="..."
railway env set OPENROUTER_API_KEY="sk-..."

# Deploy
railway up
```

### Frontend (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel --prod
```

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📧 Support

- Issues: [GitHub Issues](https://github.com/yourusername/repo/issues)
- Docs: See `Dev Docs/` folder
- Ollama Help: [ollama.ai/docs](https://ollama.ai/docs)

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai) - Local AI inference
- [LangChain](https://langchain.com) - AI orchestration
- [FastAPI](https://fastapi.tiangolo.com) - Backend framework
- [React](https://react.dev) - Frontend framework
- [Supabase](https://supabase.com) - Backend as a service

---

**Built with ❤️ for game developers** | **Privacy-first with Ollama** | **Open Source**
