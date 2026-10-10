# 🚀 Quick Start Guide

## Prerequisites
1. **Docker Desktop** must be running
2. Node.js 22+ installed
3. npm 10+ installed

## Launch Steps

### Step 1: Start Docker Desktop
Open Docker Desktop application and wait for it to fully start.

### Step 2: Start Database
```bash
cd "/Volumes/External Drive/02_DEVELOPMENT/Active Projects/Vibecoding/GameStory Lab"
docker-compose up -d
```

Wait 5-10 seconds for PostgreSQL to initialize.

### Step 3: Run Database Migrations
```bash
cd packages/backend
npx prisma migrate dev --name init
```

### Step 4: Start Development Servers
```bash
cd "/Volumes/External Drive/02_DEVELOPMENT/Active Projects/Vibecoding/GameStory Lab"
npm run dev
```

This will start both backend and frontend servers.

### Step 5: Access the Application

- **Frontend UI**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **API Docs**: http://localhost:3001/api

## Troubleshooting

### "Docker daemon not running"
- Start Docker Desktop application
- Wait for it to fully initialize
- Then run `docker-compose up -d`

### "Port already in use"
- Backend: Change `PORT=3001` in `.env` file
- Frontend: Will auto-select next available port

### "Database connection failed"
- Ensure Docker containers are running: `docker-compose ps`
- Check logs: `docker-compose logs postgres`
- Wait a few more seconds for database to initialize

### "Cannot find module @gameforge/shared"
- Build shared package: `cd packages/shared && npm run build`
- Then restart: `npm run dev`

## Current Status

✅ Frontend is running at http://localhost:5173
⏳ Backend needs Docker to be running for database connection

Once Docker is started and database is migrated, the backend will connect successfully!
