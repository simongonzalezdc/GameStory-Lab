# Launch Instructions for GameForge Studio

## Quick Start

### 1. Start Docker Desktop
Make sure Docker Desktop is running on your Mac.

### 2. Start Database Services
```bash
cd "/Volumes/External Drive/02_DEVELOPMENT/Active Projects/Vibecoding/GameStory Lab"
docker-compose up -d
```

Wait 5-10 seconds for PostgreSQL to initialize.

### 3. Set Up Database
```bash
cd packages/backend
npx prisma migrate dev --name init
```

### 4. Start Development Servers

**Option A: Both servers together (recommended)**
```bash
cd "/Volumes/External Drive/02_DEVELOPMENT/Active Projects/Vibecoding/GameStory Lab"
npm run dev
```

**Option B: Separate terminals**
```bash
# Terminal 1 - Backend
cd packages/backend
npm run dev

# Terminal 2 - Frontend  
cd packages/frontend
npm run dev
```

### 5. Access the Application

- **Frontend UI**: http://localhost:5173 (or the port shown in terminal)
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health
- **API Documentation**: http://localhost:3001/api

## Troubleshooting

### Port Already in Use
If ports 3001 or 5173 are in use:
- Change `PORT=3001` in `.env` to a different port
- Frontend will auto-select next available port

### Database Connection Failed
- Ensure Docker containers are running: `docker-compose ps`
- Check database is ready: `docker-compose logs postgres`
- Verify `.env` has correct `DATABASE_URL`

### Docker Not Running
- Start Docker Desktop application
- Wait for it to fully start
- Then run `docker-compose up -d`

## Environment Variables

The `.env` file has been created with defaults. For AI features, add your API keys:
- `OPENROUTER_API_KEY` - Optional, for cloud AI models
- `GOOGLE_API_KEY` - Optional, for Gemini validation
- `OLLAMA_BASE_URL` - Default: http://localhost:11434 (if using Ollama)

Without API keys, the system will use Ollama (if installed) or show errors when trying to generate content.
