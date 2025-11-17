# AI Game Asset Generator (Local Edition)

A privacy-first, local-first web application that generates game-ready 2D and isometric assets using AI. **Everything runs locally** - your data never leaves your machine!

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Storage](https://img.shields.io/badge/storage-local%20SQLite-green)
![Privacy](https://img.shields.io/badge/privacy-100%25%20local-brightgreen)

## 🎮 Features

### Core Features
- **Text-to-Sprite Generation** - Generate assets from natural language prompts
- **Image-to-Sprite Conversion** - Upload reference images and generate variations
- **Natural Language Refinement** - Chat-based asset refinement
- **🔥 Ollama Integration** - Run AI models locally for complete privacy & no API costs
- **Local Storage** - All data stored in local SQLite database + file system
- **No Authentication** - Simple single-user setup
- **Asset Library** - Auto-organized local library with search and filter
- **Game-Ready Export** - Export as PNG, sprite sheets, or texture atlases
- **Game Engine Support** - Unity, Godot, Unreal, and generic formats

### Privacy & Local-First
- ✅ **100% Local** - All assets, database, and files stay on your machine
- ✅ **No Cloud Required** - Works completely offline with Ollama
- ✅ **No Authentication** - No accounts, no logins, no tracking
- ✅ **No External Dependencies** - SQLite + local file storage

## 🚀 Quick Start (5 Minutes)

### Prerequisites

- **Python 3.11+**
- **Node.js 18+** and npm
- **Ollama** (for local AI - recommended!)

### Step-by-Step Setup

```bash
# 1. Install Ollama (one-time setup)
# macOS/Linux:
curl -fsSL https://ollama.ai/install.sh | sh
# Windows: Download from https://ollama.ai/download

# 2. Pull a vision model
ollama pull llama3.2-vision:11b
# Alternative smaller model:
# ollama pull llava:7b

# 3. Start Ollama server (keep running in a terminal)
ollama serve

# 4. Clone and setup project
git clone <your-repo-url>
cd Generative-Assets-Lab

# 5. Backend setup
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 6. Create .env (optional - works without API keys if using Ollama!)
cp .env.example .env
# No changes needed! Everything has sensible defaults

# 7. Start backend
uvicorn app.main:app --reload

# 8. Frontend setup (new terminal)
cd ../frontend
npm install

# 9. Create frontend .env (optional - has defaults)
cp .env.example .env

# 10. Start frontend
npm run dev

# 11. Open http://localhost:5173 and start generating!
```

That's it! No database setup, no cloud accounts, no API keys needed if using Ollama!

## 📁 Where Is My Data?

All your data is stored locally in:

```
Generative-Assets-Lab/
├── backend/
│   └── data/              # Created automatically on first run
│       ├── assets.db      # SQLite database (all metadata)
│       └── assets/        # All generated image files
│           └── local-user/  # Your assets organized by user
```

**To backup your work:** Just copy the `backend/data/` folder!

## 🎯 Usage

### Generating Your First Asset

1. Open http://localhost:5173
2. Enter a prompt: "pixel art fantasy sword with blue gems, 32x32"
3. Select model:
   - **Ollama (Local)** ✓ - If Ollama is running (recommended!)
   - OpenRouter - Requires API key
   - Google Gemini - Requires API key
   - ChatGPT - Requires API key
4. Click "Generate Asset"
5. Asset appears in library below!

### Using Cloud Providers (Optional)

If you want to use cloud AI providers in addition to Ollama:

1. Edit `backend/.env`:
```env
# Add any of these (all optional):
OPENROUTER_API_KEY=sk-or-v1-your-key
GOOGLE_API_KEY=AIzaSy-your-key
OPENAI_API_KEY=sk-proj-your-key
```

2. Restart backend
3. Cloud models will appear in the dropdown

### Exporting Assets

1. Click assets in library to select them (purple border)
2. Click "Export Selected"
3. Downloads a ZIP with your assets
4. Import into Unity, Godot, or your game engine!

## 🛠️ Project Structure

```
Generative-Assets-Lab/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── services/       # Business logic
│   │   │   ├── ai_service.py          # Multi-provider AI
│   │   │   ├── database_service.py     # SQLite operations
│   │   │   ├── local_storage_service.py  # File storage
│   │   │   ├── image_service.py        # Image processing
│   │   │   └── export_service.py       # Sprite sheets
│   │   ├── core/           # Configuration
│   │   ├── models/         # Pydantic models
│   │   └── main.py         # FastAPI app
│   ├── data/               # Local data (auto-created)
│   │   ├── assets.db       # SQLite database
│   │   └── assets/         # Image files
│   ├── requirements.txt
│   └── .env
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API client
│   │   └── types/         # TypeScript types
│   ├── package.json
│   └── .env
└── README.md
```

## 🔧 Troubleshooting

### Ollama Not Working

**Issue**: "Ollama not available" error

**Solutions**:
1. Check Ollama is installed: `ollama --version`
2. Start Ollama: `ollama serve` (keep running)
3. Verify: `curl http://localhost:11434/api/tags`
4. Pull a model: `ollama pull llama3.2-vision:11b`

### Backend Won't Start

**Issue**: Import errors or database errors

**Solutions**:
1. Activate venv: `source .venv/bin/activate`
2. Reinstall deps: `pip install -r requirements.txt`
3. Check Python version: `python --version` (need 3.11+)
4. Delete `data/` folder to reset database

### Frontend Can't Reach Backend

**Issue**: Connection refused or CORS errors

**Solutions**:
1. Check backend is running: `curl http://localhost:8000/api/health`
2. Check frontend .env: `VITE_API_BASE_URL=http://localhost:8000`
3. Restart both services

### Generation Fails

**Issue**: "Generation failed" errors

**For Ollama**:
- Ensure model is downloaded: `ollama list`
- Restart Ollama: `ollama serve`
- Try a smaller model: `ollama pull llava:7b`

**For Cloud Providers**:
- Check API keys are valid in `.env`
- Check you have API credits

## 🌟 Recommended Ollama Models

| Model | Size | Speed | Quality | Command |
|-------|------|-------|---------|---------|
| llama3.2-vision:11b | 11GB | Medium | ⭐⭐⭐⭐ | `ollama pull llama3.2-vision:11b` |
| llava:13b | 7GB | Fast | ⭐⭐⭐ | `ollama pull llava:13b` |
| llava:7b | 4GB | Very Fast | ⭐⭐ | `ollama pull llava:7b` |

**Hardware Requirements**:
- **Minimum**: 8GB RAM, CPU only (slow but works)
- **Recommended**: 16GB RAM, GPU with 8GB+ VRAM
- **Optimal**: 32GB RAM, GPU with 16GB+ VRAM

## 📚 API Documentation

Full interactive API docs available at: `http://localhost:8000/docs`

### Key Endpoints

**Generate Asset**
```bash
POST /api/generate
{
  "prompt": "pixel art sword",
  "model": "ollama",
  "ollama_model": "llama3.2-vision:11b",
  "dimensions": {"width": 64, "height": 64}
}
```

**List Assets**
```bash
GET /api/assets?limit=50&offset=0
```

**Export Assets**
```bash
POST /api/export
{
  "asset_ids": ["uuid1", "uuid2"],
  "format": "sprite-sheet-json"
}
```

## 🔐 Privacy & Security

- ✅ No data ever sent to external servers (except when using cloud AI providers by choice)
- ✅ No analytics, tracking, or telemetry
- ✅ No user accounts or authentication
- ✅ All data stored locally in SQLite + file system
- ✅ Open source - audit the code yourself!

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! This is a personal-use tool made simple and local-first.

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai) - Local AI inference
- [FastAPI](https://fastapi.tiangolo.com) - Backend framework
- [React](https://react.dev) - Frontend framework
- [SQLite](https://www.sqlite.org) - Local database

---

**Built for privacy-conscious game developers** | **100% Local** | **No Cloud Required** | **Open Source**
