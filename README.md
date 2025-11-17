# AI Game Asset Generator

A local-first web application that generates game-ready 2D assets using cloud AI providers. **Your assets stay on your machine** - stored locally in SQLite + file system!

![Version](https://img.shields.io/badge/version-2.0.0--phase2-blue)
![Storage](https://img.shields.io/badge/storage-local%20SQLite-green)
![AI](https://img.shields.io/badge/AI-cloud%20%2B%20Ollama-purple)

## 🎮 Features

### ✨ Phase 1 (Complete)
- **Text-to-Sprite Generation** - Generate assets from natural language prompts
  - OpenRouter (Gemini 2.5 Flash Image - Free tier available)
  - Google Imagen 3
  - OpenAI DALL-E 3
- **Image-to-Sprite Conversion** - Upload images to convert into game-ready sprites
  - Automatic transparent background
  - Optimized PNG compression
  - Automatic resizing (max 2048px)
- **Enhanced Asset Library**
  - Full-text search across filenames, prompts, and tags
  - Filter by project and style tags
  - Favorites system (localStorage)
  - Batch export with selection
- **Local Storage** - All data stored in local SQLite database + file system
- **No Authentication** - Simple single-user setup
- **Game-Ready Export** - Export as sprite sheets with JSON metadata

### ✨ Phase 2 (Complete) - Natural Language Refinement
- **Chat-Based Asset Refinement** - Iteratively improve assets with conversational AI
  - Natural language instructions (e.g., "make it darker", "add blue glow")
  - Quick action buttons for common refinements
  - Ollama integration for prompt enhancement
  - Real-time feedback and generation
- **Version History & Rollback** - Full asset versioning system
  - Visual timeline of all refinements
  - View and compare any previous version
  - Rollback or branch from any version
  - Refinement instructions saved for each version
- **Enhanced Asset Detail View** - Detailed modal for asset exploration
  - Large asset preview
  - Complete version history timeline
  - One-click refinement from any version
  - Metadata and download options

### 🔒 Privacy & Local-First
- ✅ **Local Storage** - All assets, database, and files stay on your machine
- ✅ **No Authentication** - No accounts, no logins, no tracking
- ✅ **SQLite Database** - No external database dependencies
- ✅ **Ollama for Chat** - Uses local Ollama for prompt enhancement (optional)

## 🚀 Quick Start (5 Minutes)

### Prerequisites

- **Python 3.11+**
- **Node.js 18+** and npm
- **API Key** from at least one provider:
  - [OpenRouter](https://openrouter.ai/) (Free tier available!)
  - [Google AI Studio](https://aistudio.google.com/) (Free quota)
  - [OpenAI](https://platform.openai.com/)
- **Ollama (Optional)** - For Phase 2 refinement features:
  - [Download Ollama](https://ollama.ai/)
  - Enhances refinement instructions with AI
  - Falls back to simple concatenation if unavailable

### Step-by-Step Setup

```bash
# 1. Clone and setup project
git clone <your-repo-url>
cd Generative-Assets-Lab

# 2. Backend setup
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 3. Configure API keys
cp .env.example .env
# Edit .env and add at least one API key:
# OPENROUTER_API_KEY=sk-or-v1-your-key  # Recommended: Free tier available
# GOOGLE_API_KEY=AIzaSy-your-key        # Alternative: Free quota
# OPENAI_API_KEY=sk-proj-your-key       # Alternative: Paid only

# 4. Start backend
uvicorn app.main:app --reload

# 5. Frontend setup (new terminal)
cd ../frontend
npm install

# 6. Create frontend .env (optional - has defaults)
cp .env.example .env

# 7. Start frontend
npm run dev

# 8. Open http://localhost:5173 and start generating!
```

That's it! No database setup required - SQLite database is created automatically on first run.

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

### Generating Assets from Text

1. Open http://localhost:5173
2. Enter a prompt: "pixel art fantasy sword with blue gems, 32x32"
3. Select AI provider:
   - **OpenRouter** - Gemini 2.5 Flash Image (free tier)
   - **Google** - Imagen 3 (free quota)
   - **ChatGPT** - DALL-E 3 (paid)
4. Optional: Add project name and style tags for organization
5. Click "Generate Asset"
6. Asset appears in library below!

### Converting Images to Sprites

1. Click the "Upload" tab
2. Drag & drop an image (or click to browse)
3. Supported formats: PNG, JPG, GIF, WebP (max 10MB)
4. Click "Convert to Sprite"
5. Conversion automatically:
   - Ensures transparent background
   - Resizes if larger than 2048px
   - Optimizes PNG compression
6. Converted sprite appears in your library!

### Refining Assets with AI (Phase 2)

**Quick Refinement:**
1. Click the "Refine" button on any asset card
2. Type a natural language instruction: "make it glow with blue energy"
3. Or click a quick action button: "Darker", "Lighter", "More Detail", "Simpler"
4. Select your preferred AI provider
5. Click "Refine" - Ollama enhances your instruction, then cloud AI generates
6. New version (v2) is created and added to your library!

**Version History:**
1. Click the "v#" badge on any asset to view version history
2. See a timeline of all refinements from original to latest
3. Click any version to view it in detail
4. Click "Refine This Version" to branch new variations
5. Each version shows the instruction used to create it

**Tips for Better Refinements:**
- Be specific: "add glowing purple energy around the sword" vs "make it better"
- Use descriptive words: darker, brighter, more detailed, simplified
- Ollama will enhance your instruction before generating
- Each refinement creates a new version you can rollback to
- You can refine from any previous version, creating branches

### Managing Your Asset Library

**Search & Filter:**
- Use the search bar to find assets by filename, prompt, or tags
- Filter by project using the project dropdown
- Filter by style tags using the style dropdown
- Click the "Favorites" button to show only favorited assets
- Click "Clear All" to reset filters

**Favorites:**
- Hover over any asset and click the star icon to favorite it
- Favorites are saved in your browser's localStorage
- Click a style tag on any asset to filter by that tag

**Exporting Assets:**
1. Click assets in library to select them (purple border appears)
2. Click "Export (N)" button at the top
3. Downloads a ZIP with:
   - All selected assets as PNG files
   - Sprite sheet with JSON metadata
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

### Backend Won't Start

**Issue**: Import errors or database errors

**Solutions**:
1. Activate venv: `source .venv/bin/activate`
2. Reinstall deps: `pip install -r requirements.txt`
3. Check Python version: `python --version` (need 3.11+)
4. Delete `backend/data/` folder to reset database

### Frontend Can't Reach Backend

**Issue**: Connection refused or CORS errors

**Solutions**:
1. Check backend is running: `curl http://localhost:8000/api/health`
2. Check frontend .env: `VITE_API_BASE_URL=http://localhost:8000`
3. Restart both services

### Generation Fails

**Issue**: "Generation failed" or "503 Service Unavailable" errors

**Solutions**:
- **Check API Keys**: Verify your API key is valid in `backend/.env`
- **Check API Credits**: Ensure you have available credits/quota
  - OpenRouter: Check at https://openrouter.ai/credits
  - Google: Check quota at https://aistudio.google.com/
  - OpenAI: Check usage at https://platform.openai.com/usage
- **Try Different Provider**: If one provider fails, try another
- **Check Backend Logs**: Look for specific error messages in backend terminal

### Image Upload Fails

**Issue**: "File too large" or upload errors

**Solutions**:
- Ensure image is under 10MB
- Use supported formats: PNG, JPG, GIF, WebP
- Try compressing image before upload
- Check backend logs for specific error

### Assets Not Appearing in Library

**Issue**: Generated assets don't show up

**Solutions**:
1. Check browser console for errors
2. Try refreshing the page (Ctrl+R / Cmd+R)
3. Verify `backend/data/assets/` folder exists and has files
4. Check `backend/data/assets.db` database file exists

## 📚 API Documentation

Full interactive API docs available at: `http://localhost:8000/docs`

### Key Endpoints

**Generate Asset from Text**
```bash
POST /api/generate
{
  "prompt": "pixel art sword with blue gem",
  "model": "openrouter",
  "dimensions": {"width": 64, "height": 64},
  "project_name": "My RPG",
  "style_tags": ["pixel-art", "weapon"]
}
```

**Convert Image to Sprite**
```bash
POST /api/generate/convert
Content-Type: multipart/form-data

file: <image file>
project_name: "My RPG" (optional)
style_tags: "pixel-art,weapon" (optional)
```

**List Assets**
```bash
GET /api/assets?limit=50&offset=0&project_name=My%20RPG
```

**Delete Asset**
```bash
DELETE /api/assets/{asset_id}
```

**Export Assets**
```bash
POST /api/export
{
  "asset_ids": ["uuid1", "uuid2"],
  "format": "sprite-sheet-json",
  "target_engine": "generic",
  "resolution_multiplier": 1
}
```

**Health Check**
```bash
GET /api/health
```

## 🔐 Privacy & Security

- ✅ **Local Storage** - All assets and metadata stored locally in SQLite + file system
- ✅ **No Tracking** - No analytics, tracking, or telemetry
- ✅ **No Authentication** - No user accounts or logins required
- ✅ **Open Source** - Audit the code yourself!
- ⚠️ **Cloud AI** - Image generation uses cloud AI providers (prompts sent to provider)
- ✅ **Your Choice** - Choose your preferred AI provider

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! This is a personal-use tool designed for game developers.

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai) - Multi-provider AI API with free tier
- [Google AI Studio](https://aistudio.google.com/) - Imagen 3 API
- [OpenAI](https://platform.openai.com/) - DALL-E 3 API
- [FastAPI](https://fastapi.tiangolo.com) - Backend framework
- [React](https://react.dev) - Frontend framework
- [SQLite](https://www.sqlite.org) - Local database
- [Pillow](https://python-pillow.org/) - Image processing

---

**Built for game developers** | **Local Storage** | **Cloud AI** | **Open Source**
