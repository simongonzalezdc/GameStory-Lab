# AI Game Asset Generator - Technical Specification

**FOR AI CODING AGENT:** This is your primary implementation guide.  
**Generated:** November 17, 2025  
**Version:** 1.0.0

---

## System Architecture

### High-Level Overview
A decoupled web application with React frontend communicating with FastAPI backend via REST API. Backend orchestrates multiple AI providers (OpenRouter, Google, ChatGPT) through LangChain, processes images, generates assets, and stores them in Supabase. Frontend provides real-time chat interface for generation requests and refinements.

### Component Diagram
```
┌─────────────────────────────────────────────────────┐
│                   Browser (Client)                   │
│  ┌──────────────────────────────────────────────┐  │
│  │  React 19.2 + TypeScript 5.9 (Frontend)     │  │
│  │  - Asset generation UI                        │  │
│  │  - Chat interface (natural language)          │  │
│  │  - Asset library browser                      │  │
│  │  - Export manager                             │  │
│  │  - Model selector (cloud/local toggle)        │  │
│  └───────────────┬──────────────────────────────┘  │
└──────────────────┼──────────────────────────────────┘
                   │ HTTPS/REST API
                   ▼
┌─────────────────────────────────────────────────────┐
│              FastAPI 0.121.1 Backend                │
│  ┌──────────────────────────────────────────────┐  │
│  │  API Layer (FastAPI routes)                  │  │
│  └───────────────┬──────────────────────────────┘  │
│                  │                                   │
│  ┌───────────────▼──────────────────────────────┐  │
│  │  LangChain Orchestration Layer              │  │
│  │  - Multi-model routing (cloud + local)       │  │
│  │  - Prompt optimization                        │  │
│  │  - Response parsing                           │  │
│  └───────────────┬──────────────────────────────┘  │
│                  │                                   │
│       ┌──────────┴──────────┬────────────────┬─────┤
│       ▼                     ▼                 ▼     │
│  ┌─────────┐        ┌──────────┐      ┌─────────┐ │
│  │OpenRouter│       │ Google   │      │ChatGPT  │ │
│  │(FLUX etc)│       │(Gemini)  │      │(DALL-E3)│ │
│  └─────────┘        └──────────┘      └─────────┘ │
│       │                     │                 │     │
│       └──────────┬──────────┴────────────────┘     │
│                  │                                   │
│                  │          ┌──────────────────┐    │
│                  │          │ Ollama (Local)   │    │
│                  │          │ - LLaMA 3.2      │    │
│                  ├──────────┤ - Stable Diffusion│   │
│                  │          │ - Custom models  │    │
│                  │          └──────────────────┘    │
│                  ▼                                   │
│  ┌───────────────────────────────────────────────┐ │
│  │  Image Processing Service                    │ │
│  │  - Style transfer                             │ │
│  │  - Background removal                         │ │
│  │  - Color adjustment                           │ │
│  │  - Sprite sheet generation                    │ │
│  └───────────────┬──────────────────────────────┘ │
└──────────────────┼──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│              Supabase (Storage + DB)                │
│  - Asset files (PNG, sprite sheets)                 │
│  - Metadata (tags, projects, dimensions)            │
│  - User auth & sessions                              │
│  - Generation history                                │
└─────────────────────────────────────────────────────┘
```

### Data Flow
1. User enters text prompt or uploads image → Frontend validates input
2. Frontend sends generation request to `/api/generate` endpoint
3. Backend receives request, validates API keys, selects AI model via LangChain
4. LangChain sends optimized prompt to AI provider (OpenRouter/Google/ChatGPT)
5. AI generates image → Backend receives raw image data
6. Image Processing Service applies refinements (crop, resize, format)
7. Processed asset uploaded to Supabase Storage
8. Metadata saved to Supabase database with tags, dimensions, style info
9. Backend returns asset URL + metadata to Frontend
10. Frontend displays generated asset, adds to library

---

## Tech Stack

### Frontend
- **Framework:** React 19.2
- **Version:** 19.2.0 (October 2025)
- **Key Libraries:**
  - `typescript@5.9.3` - Type safety
  - `vite@6.0` - Build tool & dev server
  - `tailwindcss@3.4` - Utility-first CSS
  - `@tanstack/react-query@5.x` - Server state management
  - `zustand@4.x` - Client state management
  - `lucide-react@0.456` - Icon library
  - `@supabase/supabase-js@2.x` - Supabase client
  - `react-dropzone@14.x` - File uploads
  - `konva@9.x` + `react-konva@18.x` - Canvas manipulation
- **Styling:** Tailwind CSS with custom game-asset theme
- **State Management:** 
  - React Query for server state (API calls, caching)
  - Zustand for local UI state (selected assets, filters)

### Backend
- **Framework:** FastAPI 0.121.1
- **Version:** 0.121.1 (November 2025)
- **Language:** Python 3.14
- **Runtime:** Uvicorn (ASGI server)
- **Key Libraries:**
  - `fastapi[standard]==0.121.1` - Web framework
  - `langchain==0.3.x` - AI orchestration
  - `langchain-openai==0.2.x` - ChatGPT/DALL-E integration
  - `langchain-google-genai==2.x` - Google Gemini integration
  - `langchain-ollama==0.2.x` - Local model integration
  - `supabase==2.x` - Supabase client
  - `python-multipart==0.0.18` - File uploads
  - `Pillow==11.x` - Image processing
  - `httpx==0.28.x` - Async HTTP client
  - `pydantic==2.12.x` - Data validation
  - `python-dotenv==1.0.x` - Environment config

### Database
- **Type:** PostgreSQL (via Supabase)
- **Version:** PostgreSQL 15 (Supabase managed)
- **ORM/Query Builder:** Supabase Python client (abstracts raw SQL)
- **Migration Tool:** Supabase migrations (SQL-based)

### Local AI (Ollama)
- **Runtime:** Ollama (runs locally on user's machine or server)
- **Version:** Latest stable (auto-updates)
- **Supported Models:**
  - `llama3.2-vision:11b` - Vision + text generation (recommended)
  - `llava:13b` - Image understanding + generation
  - `stable-diffusion` - Image generation (via Ollama plugin)
  - Custom models via `ollama create`
- **Integration:** LangChain Ollama wrapper
- **Default URL:** `http://localhost:11434` (configurable)
- **Benefits:**
  - Complete privacy (data never leaves local machine)
  - No API costs (unlimited generations)
  - Offline usage (no internet required after model download)
  - Custom model fine-tuning support


### Infrastructure
- **Hosting:**
  - Frontend: Vercel (optimized for React/Vite)
  - Backend: Railway or Render (Python support, easy scaling)
- **CI/CD:** GitHub Actions (test → build → deploy)
- **Package Manager:**
  - Frontend: npm 10.x
  - Backend: pip 24.x with venv
- **Build Tool:**
  - Frontend: Vite 6.0
  - Backend: No build step (Python)

---

## Project Structure

```
ai-game-asset-generator/
├── frontend/                      # React app
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── AssetCard.tsx
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── GenerationForm.tsx
│   │   │   ├── AssetLibrary.tsx
│   │   │   └── ExportModal.tsx
│   │   ├── pages/                # Page components
│   │   │   ├── HomePage.tsx
│   │   │   ├── LibraryPage.tsx
│   │   │   └── GeneratePage.tsx
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── useGenerate.ts
│   │   │   ├── useAssetLibrary.ts
│   │   │   └── useSupabase.ts
│   │   ├── services/             # API clients
│   │   │   ├── api.ts
│   │   │   └── supabase.ts
│   │   ├── types/                # TypeScript types
│   │   │   ├── asset.ts
│   │   │   └── generation.ts
│   │   ├── store/                # Zustand stores
│   │   │   └── assetStore.ts
│   │   ├── utils/                # Helper functions
│   │   │   ├── export.ts
│   │   │   └── imageProcessing.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
│
├── backend/                       # FastAPI app
│   ├── app/
│   │   ├── api/                  # API routes
│   │   │   ├── __init__.py
│   │   │   ├── generate.py       # /api/generate
│   │   │   ├── assets.py         # /api/assets
│   │   │   ├── export.py         # /api/export
│   │   │   └── health.py         # /api/health
│   │   ├── core/                 # Core configuration
│   │   │   ├── __init__.py
│   │   │   ├── config.py         # Settings/env vars
│   │   │   └── security.py       # Auth helpers
│   │   ├── services/             # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── ai_service.py     # LangChain orchestration
│   │   │   ├── image_service.py  # Image processing
│   │   │   ├── export_service.py # Sprite sheet generation
│   │   │   └── storage_service.py# Supabase uploads
│   │   ├── models/               # Pydantic models
│   │   │   ├── __init__.py
│   │   │   ├── generation.py
│   │   │   ├── asset.py
│   │   │   └── export.py
│   │   ├── utils/                # Utilities
│   │   │   ├── __init__.py
│   │   │   ├── prompts.py        # AI prompt templates
│   │   │   └── validators.py
│   │   └── main.py               # FastAPI app instance
│   ├── tests/
│   │   ├── test_api/
│   │   ├── test_services/
│   │   └── conftest.py
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── .env.example
│   └── pyproject.toml
│
├── docs/                          # Project documentation
│   ├── 01-executive-summary.md
│   ├── 02-technical-specification.md
│   ├── 03-product-requirements.md
│   └── 04-roadmap.md
│
├── .github/
│   └── workflows/
│       ├── frontend-ci.yml
│       └── backend-ci.yml
│
├── README.md
└── .gitignore
```

### File Organization Principles
- **Colocation:** Keep related files together (component + test + styles)
- **Feature-based:** Group by feature, not file type (avoid huge /utils folders)
- **Flat when possible:** Avoid deep nesting (max 3-4 levels)
- **Explicit imports:** Use absolute paths via tsconfig/path aliases
- **Single responsibility:** One component/service per file

---

## Database Schema

### Tables & Relationships

#### assets
```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,                    -- Supabase Storage URL
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,                -- bytes
  mime_type TEXT NOT NULL DEFAULT 'image/png',
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  generation_prompt TEXT,                     -- original prompt
  generation_model TEXT NOT NULL,             -- 'openrouter', 'google', 'chatgpt'
  style_tags TEXT[] DEFAULT '{}',            -- ['pixel-art', 'fantasy']
  project_name TEXT,                          -- user-defined project
  is_favorite BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',                -- extensible metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_assets_project_name ON assets(project_name) WHERE project_name IS NOT NULL;
CREATE INDEX idx_assets_style_tags ON assets USING GIN(style_tags);
CREATE INDEX idx_assets_created_at ON assets(created_at DESC);
```

**Purpose:** Store all generated game assets with metadata for search and organization

**Relationships:**
- `user_id` → auth.users (Supabase Auth): One user has many assets
- File stored separately in Supabase Storage bucket: `game-assets`

**Indexes:**
- `idx_assets_user_id`: Fast filtering by user
- `idx_assets_project_name`: Fast project-based queries
- `idx_assets_style_tags`: GIN index for array searches (style filtering)
- `idx_assets_created_at`: Efficient recent assets queries

#### generation_history
```sql
CREATE TABLE generation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  model_used TEXT NOT NULL,
  model_params JSONB DEFAULT '{}',            -- model-specific settings
  status TEXT NOT NULL DEFAULT 'pending',     -- 'pending', 'success', 'failed'
  error_message TEXT,
  generation_time_ms INTEGER,                 -- performance tracking
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_history_user_id ON generation_history(user_id);
CREATE INDEX idx_history_asset_id ON generation_history(asset_id);
CREATE INDEX idx_history_created_at ON generation_history(created_at DESC);
```

**Purpose:** Track all generation attempts for debugging, analytics, and user history

**Relationships:**
- `user_id` → auth.users
- `asset_id` → assets (nullable: failed generations won't have assets)

#### export_configs
```sql
CREATE TABLE export_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  config_name TEXT NOT NULL,
  export_format TEXT NOT NULL,                -- 'png', 'sprite-sheet-json', 'texture-atlas-xml'
  target_engine TEXT,                         -- 'unity', 'godot', 'unreal', 'generic'
  settings JSONB NOT NULL DEFAULT '{}',       -- format-specific settings
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, config_name)
);

CREATE INDEX idx_export_configs_user_id ON export_configs(user_id);
```

**Purpose:** Save export presets for quick re-use (e.g., "Unity Sprite Sheet 512x512")

### Data Models

```python
# backend/app/models/asset.py
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class AssetCreate(BaseModel):
    """Model for creating new asset"""
    file_name: str
    file_size: int = Field(gt=0)
    width: int = Field(gt=0)
    height: int = Field(gt=0)
    generation_prompt: Optional[str] = None
    generation_model: str
    style_tags: List[str] = []
    project_name: Optional[str] = None

class AssetResponse(BaseModel):
    """Model for asset API responses"""
    id: UUID
    user_id: UUID
    file_url: HttpUrl
    file_name: str
    file_size: int
    mime_type: str
    width: int
    height: int
    generation_prompt: Optional[str]
    generation_model: str
    style_tags: List[str]
    project_name: Optional[str]
    is_favorite: bool
    metadata: dict
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AssetFilter(BaseModel):
    """Model for filtering assets"""
    project_name: Optional[str] = None
    style_tags: Optional[List[str]] = None
    search_query: Optional[str] = None  # full-text search on prompt
    limit: int = Field(50, le=100)
    offset: int = 0
```

### Migration Strategy
Use Supabase SQL migrations:
1. Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_assets_table.sql`
2. Write SQL statements (CREATE TABLE, indexes, RLS policies)
3. Apply via Supabase CLI: `supabase db push`
4. Versioned in git, auto-applied on deploy

---

## API Specification

### Authentication
**Method:** Supabase Auth (JWT tokens)

**Headers Required:**
```
Authorization: Bearer <supabase_jwt_token>
Content-Type: application/json
```

### Endpoints

#### POST /api/generate
**Purpose:** Generate game asset from text prompt or reference image

**Request:**
```json
{
  "prompt": "pixel art fantasy sword with blue gems, 32x32, transparent background",
  "negative_prompt": "blurry, realistic, photograph",
  "model": "openrouter",  // 'openrouter' | 'google' | 'chatgpt' | 'ollama'
  "ollama_model": "llama3.2-vision:11b",  // required if model='ollama'
  "reference_image": "data:image/png;base64,...",  // optional
  "style_tags": ["pixel-art", "fantasy", "weapon"],
  "project_name": "RPG Game Assets",
  "dimensions": {
    "width": 32,
    "height": 32
  }
}
```

**Response:**
```json
{
  "success": true,
  "asset": {
    "id": "uuid",
    "file_url": "https://...",
    "file_name": "sword_001.png",
    "width": 32,
    "height": 32,
    "generation_model": "openrouter",
    "style_tags": ["pixel-art", "fantasy", "weapon"],
    "created_at": "2025-11-17T10:30:00Z"
  },
  "generation_id": "uuid",
  "generation_time_ms": 2340
}
```

**Validation Rules:**
- `prompt`: Required, 10-2000 characters
- `model`: Must be one of supported models
- `dimensions`: Both width/height must be 16-2048px
- `reference_image`: Must be valid base64 PNG/JPEG, max 10MB

**Error Handling:**
- 400: Invalid input (validation failure)
- 401: Unauthorized (missing/invalid JWT)
- 429: Rate limit exceeded
- 500: AI provider error or server error

#### POST /api/generate/refine
**Purpose:** Refine existing asset with natural language instruction

**Request:**
```json
{
  "asset_id": "uuid",
  "instruction": "make it darker and add more detail",
  "model": "openrouter"
}
```

**Response:** Same as `/api/generate`

#### GET /api/assets
**Purpose:** List user's assets with filtering

**Query Parameters:**
- `project_name`: Filter by project
- `style_tags`: Comma-separated tags
- `search`: Full-text search in prompts
- `limit`: Results per page (default 50, max 100)
- `offset`: Pagination offset

**Response:**
```json
{
  "assets": [/* array of AssetResponse */],
  "total": 234,
  "limit": 50,
  "offset": 0
}
```

#### DELETE /api/assets/{asset_id}
**Purpose:** Delete asset and remove from storage

**Response:**
```json
{
  "success": true,
  "message": "Asset deleted"
}
```

#### POST /api/export
**Purpose:** Export assets as sprite sheet or texture atlas

**Request:**
```json
{
  "asset_ids": ["uuid1", "uuid2", "uuid3"],
  "format": "sprite-sheet-json",  // 'png' | 'sprite-sheet-json' | 'texture-atlas-xml'
  "target_engine": "unity",        // 'unity' | 'godot' | 'unreal' | 'generic'
  "settings": {
    "sheet_width": 512,
    "sheet_height": 512,
    "padding": 2,
    "trim_transparency": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "export_url": "https://.../sprite_sheet.zip",
  "files": [
    {"name": "sprite_sheet.png", "url": "https://..."},
    {"name": "sprite_sheet.json", "url": "https://..."}
  ]
}
```

### Rate Limiting
- **Anonymous users:** Not allowed (require auth)
- **Authenticated users:** 100 generations/hour per user
- **Implementation:** In-memory rate limiter with Redis (future) or simple dict counter

### Versioning
- **Strategy:** URL versioning (e.g., `/api/v1/generate`)
- **Current version:** v1 (implicit, no version in URL for now)
- **Future:** Add `/api/v2/` when breaking changes needed

---

## Testing Strategy

### Test Coverage Goals
- **Unit tests:** 80% coverage minimum
- **Integration tests:** All API endpoints
- **E2E tests:** Critical user flows (generate → library → export)

### Testing Frameworks
- **Backend Unit:** pytest 8.x
- **Backend Integration:** pytest + httpx (FastAPI TestClient)
- **Frontend Unit:** Vitest 2.x
- **Frontend Integration:** React Testing Library
- **E2E:** Playwright 1.x

### Required Tests

**For every feature:**
1. Happy path test (normal successful flow)
2. Error handling test (invalid inputs, API failures)
3. Edge case tests (empty data, max limits, etc.)
4. Security test (unauthorized access)

**Test file naming:**
- Backend: `test_<module_name>.py` (e.g., `test_ai_service.py`)
- Frontend: `<component_name>.test.tsx` (e.g., `AssetCard.test.tsx`)

**Example test structure (Backend):**
```python
# backend/tests/test_api/test_generate.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_generate_asset_success():
    """Test successful asset generation with valid prompt"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/generate",
            json={
                "prompt": "pixel art sword",
                "model": "openrouter",
                "dimensions": {"width": 32, "height": 32}
            },
            headers={"Authorization": "Bearer test_token"}
        )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "asset" in data
    assert data["asset"]["width"] == 32

@pytest.mark.asyncio
async def test_generate_asset_invalid_prompt():
    """Test generation fails with empty prompt"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/generate",
            json={"prompt": "", "model": "openrouter"},
            headers={"Authorization": "Bearer test_token"}
        )
    
    assert response.status_code == 400
    assert "prompt" in response.json()["detail"].lower()
```

**Example test structure (Frontend):**
```typescript
// frontend/src/components/AssetCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AssetCard } from './AssetCard';

describe('AssetCard', () => {
  it('renders asset with correct details', () => {
    const mockAsset = {
      id: '123',
      file_url: 'https://example.com/sword.png',
      file_name: 'sword.png',
      width: 32,
      height: 32,
      style_tags: ['pixel-art', 'fantasy']
    };
    
    render(<AssetCard asset={mockAsset} />);
    
    expect(screen.getByText('sword.png')).toBeInTheDocument();
    expect(screen.getByText('32x32')).toBeInTheDocument();
    expect(screen.getByText('pixel-art')).toBeInTheDocument();
  });

  it('calls onDelete when delete button clicked', () => {
    const mockAsset = { /* ... */ };
    const handleDelete = vi.fn();
    
    render(<AssetCard asset={mockAsset} onDelete={handleDelete} />);
    
    fireEvent.click(screen.getByLabelText('Delete asset'));
    
    expect(handleDelete).toHaveBeenCalledWith('123');
  });
});
```

### Running Tests
```bash
# Backend - Run all tests
cd backend
pytest

# Backend - Run with coverage
pytest --cov=app --cov-report=html

# Backend - Run specific test
pytest tests/test_api/test_generate.py::test_generate_asset_success

# Frontend - Run all tests
cd frontend
npm run test

# Frontend - Run with UI
npm run test:ui

# Frontend - Run with coverage
npm run test:coverage

# E2E tests
npx playwright test
```

---

## Code Style & Standards

### Formatting
- **Backend Tool:** Black 24.x + isort 5.x
- **Backend Config:** `pyproject.toml`
- **Backend Run:** `black . && isort .`
- **Frontend Tool:** Prettier 3.x
- **Frontend Config:** `.prettierrc.json`
- **Frontend Run:** `npm run format`

### Linting
- **Backend Tool:** Ruff 0.6.x (replaces flake8, pylint)
- **Backend Config:** `pyproject.toml`
- **Backend Run:** `ruff check .`
- **Frontend Tool:** ESLint 9.x
- **Frontend Config:** `eslint.config.js`
- **Frontend Run:** `npm run lint`

### Naming Conventions
- **Python Variables:** `snake_case`
- **Python Functions:** `snake_case`
- **Python Classes:** `PascalCase`
- **Python Files:** `snake_case.py`
- **TypeScript Variables:** `camelCase`
- **TypeScript Functions:** `camelCase`
- **TypeScript Classes/Types:** `PascalCase`
- **TypeScript Files:** `PascalCase.tsx` for components, `camelCase.ts` for utilities
- **React Components:** `PascalCase` in `PascalCase.tsx` files

### Code Patterns

**Preferred (Backend):**
```python
# Use Pydantic for validation
from pydantic import BaseModel, Field

class GenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=10, max_length=2000)
    model: str = Field(..., pattern="^(openrouter|google|chatgpt)$")

# Use dependency injection for services
from fastapi import Depends

def get_ai_service() -> AIService:
    return AIService()

@app.post("/api/generate")
async def generate(
    request: GenerationRequest,
    ai_service: AIService = Depends(get_ai_service)
):
    return await ai_service.generate(request)
```

**Avoid (Backend):**
```python
# Don't use manual validation
@app.post("/api/generate")
async def generate(data: dict):
    if "prompt" not in data or len(data["prompt"]) < 10:
        raise HTTPException(400, "Invalid prompt")
    # BAD: repetitive validation logic
```

**Preferred (Frontend):**
```typescript
// Use React Query for server state
import { useQuery } from '@tanstack/react-query';

export function AssetLibrary() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['assets'],
    queryFn: () => api.getAssets()
  });

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;
  return <AssetGrid assets={data.assets} />;
}
```

**Avoid (Frontend):**
```typescript
// Don't manage server state with useState
export function AssetLibrary() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/assets').then(/* ... */);
    // BAD: manual cache management, no automatic refetching
  }, []);
}
```

### Comments & Documentation
- **Backend:** Docstrings for all public functions/classes (Google style)
- **Frontend:** JSDoc comments for complex functions/hooks
- **Inline comments:** Explain "why", not "what"
- **Type hints:** Required in Python, TypeScript strict mode enforced

---

## Implementation Order

### Phase 1: Foundation (Week 1-2, Critical Priority)

1. **Backend Project Setup**
   - Files to create: 
     - `backend/app/main.py` (FastAPI app)
     - `backend/app/core/config.py` (settings)
     - `backend/requirements.txt`
     - `backend/.env.example`
   - Dependencies: FastAPI, Uvicorn, python-dotenv
   - Tests required: `test_health_endpoint.py`

2. **Frontend Project Setup**
   - Files to create:
     - `frontend/src/main.tsx`
     - `frontend/src/App.tsx`
     - `frontend/vite.config.ts`
     - `frontend/tailwind.config.ts`
   - Dependencies: React, Vite, Tailwind
   - Tests required: `App.test.tsx`

3. **Supabase Configuration**
   - Files to create:
     - `supabase/migrations/001_create_assets_table.sql`
     - `backend/app/services/storage_service.py`
   - Dependencies: Supabase Python SDK
   - Tests required: `test_storage_service.py`

4. **Basic AI Integration**
   - Files to create:
     - `backend/app/services/ai_service.py` (LangChain wrapper)
     - `backend/app/api/generate.py`
     - `backend/app/services/ollama_service.py` (Ollama integration)
   - Dependencies: LangChain, OpenRouter SDK, langchain-ollama
   - Tests required: `test_ai_service.py`, `test_ollama_service.py`, `test_generate_endpoint.py`

### Phase 2: Core Features (Week 3-6, High Priority)

5. **Text-to-Image Generation**
   - Files to create:
     - `frontend/src/components/GenerationForm.tsx`
     - `frontend/src/hooks/useGenerate.ts`
     - `backend/app/models/generation.py`
   - Dependencies: React Query, Zustand
   - Tests required: `GenerationForm.test.tsx`, `test_generation_model.py`

6. **Image-to-Image Refinement**
   - Files to create:
     - `frontend/src/components/ImageUpload.tsx`
     - `backend/app/services/image_service.py` (Pillow processing)
     - `backend/app/api/generate.py` (add refine endpoint)
   - Dependencies: Pillow, react-dropzone
   - Tests required: `test_image_service.py`

7. **Natural Language Chat Interface**
   - Files to create:
     - `frontend/src/components/ChatInterface.tsx`
     - `frontend/src/hooks/useChatHistory.ts`
   - Dependencies: None (use existing API)
   - Tests required: `ChatInterface.test.tsx`

8. **Asset Library & Organization**
   - Files to create:
     - `frontend/src/components/AssetLibrary.tsx`
     - `frontend/src/components/AssetCard.tsx`
     - `backend/app/api/assets.py`
   - Dependencies: None
   - Tests required: `AssetLibrary.test.tsx`, `test_assets_endpoint.py`

### Phase 3: Export & Polish (Week 7-8, Medium Priority)

9. **Sprite Sheet Export**
   - Files to create:
     - `backend/app/services/export_service.py`
     - `backend/app/api/export.py`
     - `frontend/src/components/ExportModal.tsx`
   - Dependencies: TexturePacker logic (custom)
   - Tests required: `test_export_service.py`

10. **Multi-Resolution Export**
    - Files to create:
      - `backend/app/utils/image_utils.py` (resizing logic)
    - Dependencies: Pillow
    - Tests required: `test_image_utils.py`

11. **Game Engine Format Support**
    - Files to create:
      - `backend/app/services/format_converters.py` (Unity/Godot/Unreal)
    - Dependencies: None (pure Python)
    - Tests required: `test_format_converters.py`

---

## AI Agent Instructions

### Setup Commands
```bash
# Initial setup
git clone <repo-url>
cd ai-game-asset-generator

# Backend setup
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with API keys

# Optional: Install Ollama for local models
# macOS/Linux:
curl -fsSL https://ollama.ai/install.sh | sh
# Windows: Download installer from https://ollama.ai/download

# Pull recommended model
ollama pull llama3.2-vision:11b

# Start Ollama server (runs in background)
ollama serve

# Frontend setup
cd ../frontend
npm install

# Start development
# Terminal 1 (backend):
cd backend && uvicorn app.main:app --reload

# Terminal 2 (frontend):
cd frontend && npm run dev

# Terminal 3 (Ollama - if using local models):
ollama serve
```

### Development Workflow

**For each new feature:**
1. Create feature branch: `git checkout -b feature/text-to-sprite-generation`
2. Implement in this order:
   - Pydantic models (backend) or TypeScript types (frontend)
   - Service/business logic (backend) or custom hooks (frontend)
   - API endpoints (backend) or components (frontend)
   - Tests (ALWAYS - coverage required)
3. Run tests: 
   - Backend: `pytest`
   - Frontend: `npm run test`
4. Format code:
   - Backend: `black . && isort .`
   - Frontend: `npm run format`
5. Lint:
   - Backend: `ruff check .`
   - Frontend: `npm run lint`
6. Commit: `git commit -m "feat: add text-to-sprite generation"`

### File Creation Rules

**ALWAYS:**
- Create tests alongside implementation (TDD preferred)
- Follow project structure exactly (see diagram above)
- Use established patterns (Pydantic, React Query, etc.)
- Add proper error handling (try/except, error boundaries)
- Include input validation (Pydantic, Zod)

**NEVER:**
- Skip tests (will be rejected in PR)
- Hardcode API keys/secrets (use .env)
- Create files outside project structure
- Use deprecated dependencies (check package.json/requirements.txt)
- Ignore linting errors (fix them)

### Critical Files (Do NOT modify without asking)
- `backend/app/main.py` (core app setup)
- `frontend/src/main.tsx` (app entry point)
- `supabase/migrations/*.sql` (database schema)
- `package.json`, `requirements.txt` (dependencies)

### Security Requirements
- **API keys:** Never commit to git, always use environment variables
- **User data:** All API endpoints require authentication (Supabase JWT)
- **File uploads:** Validate file types, limit size to 10MB
- **SQL injection:** Use Supabase client (parameterized queries)
- **XSS:** React escapes by default, be careful with dangerouslySetInnerHTML

### Performance Requirements
- **API response time:** < 5 seconds for generation (depends on AI provider)
- **Page load:** < 2 seconds (Lighthouse score > 90)
- **Asset library:** Paginate after 50 items, lazy load images
- **Export:** Process in background for large batches (future: job queue)

### Error Handling Pattern

**Backend:**
```python
from fastapi import HTTPException

try:
    result = await ai_service.generate(prompt)
except ValueError as e:
    raise HTTPException(400, f"Invalid input: {str(e)}")
except ExternalAPIError as e:
    logger.error(f"AI provider error: {e}")
    raise HTTPException(503, "AI service unavailable")
except Exception as e:
    logger.exception("Unexpected error in generation")
    raise HTTPException(500, "Internal server error")
```

**Frontend:**
```typescript
try {
  const asset = await api.generate(prompt);
  queryClient.invalidateQueries(['assets']);
  return asset;
} catch (error) {
  if (error.response?.status === 400) {
    toast.error('Invalid prompt. Please try again.');
  } else if (error.response?.status === 429) {
    toast.error('Rate limit exceeded. Please wait.');
  } else {
    toast.error('Generation failed. Please try again.');
    Sentry.captureException(error);
  }
  throw error;
}
```

---

## Environment Configuration

### Required Environment Variables

**Backend (.env):**
```bash
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# AI Providers
OPENROUTER_API_KEY=sk-or-v1-...
GOOGLE_API_KEY=AIzaSy...
OPENAI_API_KEY=sk-proj-...

# Ollama (Local AI)
OLLAMA_BASE_URL=http://localhost:11434  # or remote server URL
OLLAMA_ENABLED=true  # set to false to disable local models

# MiniMax (if using)
MINIMAX_API_KEY=...
MINIMAX_GROUP_ID=...

# GLM (if using)
GLM_API_KEY=...

# App settings
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com
ENVIRONMENT=development  # 'development' or 'production'
LOG_LEVEL=INFO
```

**Frontend (.env):**
```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_API_BASE_URL=http://localhost:8000
```

### Local Development Setup
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your API keys from:
# - Supabase: https://app.supabase.com
# - OpenRouter: https://openrouter.ai/keys
# - Google: https://makersuite.google.com/app/apikey
# - OpenAI: https://platform.openai.com/api-keys

# Frontend
cd frontend
cp .env.example .env
# Copy SUPABASE_URL and SUPABASE_ANON_KEY from Supabase dashboard
```

### Environment-Specific Settings
- **Development:** 
  - CORS allows localhost
  - Debug logging enabled
  - No rate limiting
- **Production:**
  - CORS restricted to domain
  - Error logging only
  - Rate limiting active
  - HTTPS only

---

## Deployment

### Build Process
```bash
# Frontend
cd frontend
npm run build
# Creates: frontend/dist/

# Backend (no build needed, Python runtime)
cd backend
# Just copy files
```

### Pre-Deployment Checklist
- [ ] All tests passing (`pytest` and `npm run test`)
- [ ] No linting errors (`ruff check .` and `npm run lint`)
- [ ] Environment variables configured on hosting platform
- [ ] Database migrations applied (`supabase db push`)
- [ ] Supabase Storage bucket created: `game-assets`
- [ ] CORS origins updated for production domain

### Deployment Commands

**Frontend (Vercel):**
```bash
# One-time setup
npm install -g vercel
vercel login

# Deploy
cd frontend
vercel --prod
```

**Backend (Railway):**
```bash
# One-time setup
npm install -g railway
railway login
railway init

# Deploy
cd backend
railway up
```

### Rollback Procedure
- **Frontend:** Vercel: Go to deployments → select previous → "Promote to Production"
- **Backend:** Railway: Go to deployments → select previous → "Rollback"
- **Database:** Supabase: Apply rollback migration: `supabase db reset --linked`

---

## Troubleshooting

### Common Issues

**Issue:** `ModuleNotFoundError: No module named 'app'`  
**Solution:** Ensure you're running from `backend/` directory and venv is activated: `source .venv/bin/activate`

**Issue:** Frontend can't connect to backend (CORS error)  
**Solution:** Check `CORS_ORIGINS` in backend `.env` includes frontend URL

**Issue:** AI generation returns 503 error  
**Solution:** Check API keys are valid, check provider status page, verify rate limits not exceeded

**Issue:** Supabase uploads fail  
**Solution:** Verify `SUPABASE_SERVICE_ROLE_KEY` (not anon key) is set, check bucket exists and has correct RLS policies

### Debugging Commands
```bash
# Backend - Check logs
cd backend
uvicorn app.main:app --reload --log-level=debug

# Backend - Test API endpoint manually
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"prompt": "test", "model": "openrouter"}'

# Frontend - Check build output
cd frontend
npm run build -- --debug

# Frontend - Check environment variables loaded
console.log(import.meta.env)
```

---

## Dependencies

### Production Dependencies

**Backend (requirements.txt):**
```txt
fastapi[standard]==0.121.1
langchain==0.3.10
langchain-openai==0.2.15
langchain-google-genai==2.0.8
langchain-ollama==0.2.5
supabase==2.12.0
python-multipart==0.0.18
Pillow==11.0.0
httpx==0.28.1
pydantic==2.12.1
python-dotenv==1.0.1
```

**Frontend (package.json):**
```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "@tanstack/react-query": "^5.62.3",
    "zustand": "^4.5.6",
    "@supabase/supabase-js": "^2.49.1",
    "lucide-react": "^0.456.0",
    "react-dropzone": "^14.3.5",
    "konva": "^9.3.18",
    "react-konva": "^18.2.10"
  }
}
```

### Development Dependencies

**Backend (requirements-dev.txt):**
```txt
pytest==8.3.4
pytest-asyncio==0.25.0
pytest-cov==6.0.0
black==24.11.1
isort==5.13.2
ruff==0.6.10
```

**Frontend (package.json devDependencies):**
```json
{
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "~5.9.3",
    "vite": "^6.0.5",
    "tailwindcss": "^3.4.16",
    "vitest": "^2.1.8",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "eslint": "^9.16.0",
    "prettier": "^3.4.2",
    "playwright": "^1.49.1"
  }
}
```

### Dependency Update Policy
- **Security patches:** Apply immediately when notified
- **Minor versions:** Update monthly, test thoroughly
- **Major versions:** Update quarterly, read migration guides, test extensively
- **Lock files:** Always commit `package-lock.json` and `requirements.txt`

---

## Additional Resources

**Documentation:**
- FastAPI: https://fastapi.tiangolo.com/
- React 19: https://react.dev/
- LangChain Python: https://python.langchain.com/
- Supabase: https://supabase.com/docs
- Tailwind CSS: https://tailwindcss.com/docs

**Tutorials:**
- FastAPI + React full-stack: https://testdriven.io/blog/fastapi-react/
- LangChain multi-model orchestration: https://python.langchain.com/docs/tutorials/
- Supabase Auth: https://supabase.com/docs/guides/auth
- Game asset export formats: https://www.codeandweb.com/texturepacker/documentation

**Community:**
- FastAPI Discord: https://discord.gg/fastapi
- React Discord: https://discord.gg/react
- r/gamedev: https://reddit.com/r/gamedev

---

**This document is the single source of truth for implementation.**  
**All technical decisions, patterns, and requirements are defined here.**

**Last Updated:** November 17, 2025
