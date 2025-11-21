# 🚀 GameStory Lab - Local Setup Guide

## Overview
GameStory Lab is an AI-powered game concept generator for indie developers. This guide will help you run it locally on your machine.

## Prerequisites
- **Node.js 22+** and **npm 10+**
- **Docker Desktop** (for database)
- Git (to clone if needed)

## Quick Setup (5 minutes)

### 1. Start Database Services
```bash
# Start PostgreSQL and Redis containers
docker-compose up -d

# Wait 10 seconds for database to initialize
```

### 2. Install Dependencies
```bash
# Install all dependencies (root + workspaces)
npm install
```

### 3. Run Database Migrations
```bash
# Set up the database schema
cd packages/backend
npx prisma migrate dev --name init
cd ../../
```

### 4. Start Development Servers
```bash
# Start both frontend and backend concurrently
npm run dev
```

## 🎯 Access Points
Once running, access your application at:

- **Frontend UI**: http://localhost:5173
- **Backend API**: http://localhost:3001  
- **Health Check**: http://localhost:3001/health
- **API Documentation**: http://localhost:3001/api

## 🏗️ Architecture
```
GameStory Lab/
├── packages/
│   ├── frontend/     # React + TypeScript + Vite
│   ├── backend/      # Express + Prisma + PostgreSQL
│   └── shared/       # Shared types and utilities
├── docker-compose.yml # Database services
└── package.json      # Workspace configuration
```

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Check if Docker containers are running
docker-compose ps

# View database logs
docker-compose logs postgres

# Reset database if needed
docker-compose down -v
docker-compose up -d
```

### Port Already in Use
- Frontend uses port 5173 (will auto-adjust)
- Backend uses port 3001
- PostgreSQL uses port 5432
- Redis uses port 6379

### Permission Issues
If you encounter permission errors:
1. Make sure Docker Desktop is running
2. Check that ports are available
3. Try running commands with appropriate permissions

## 📝 Development Workflow

### Backend Development
```bash
cd packages/backend
npm run dev          # Start with hot reload
npm run db:studio    # Open Prisma database GUI
npm run test         # Run tests
```

### Frontend Development  
```bash
cd packages/frontend
npm run dev          # Start with hot reload
npm run build        # Production build
npm run test         # Run tests
```

### Database Management
```bash
cd packages/backend

# View current schema
npx prisma studio

# Create new migration
npx prisma migrate dev --name your_migration

# Reset database
npx prisma migrate reset
```

## 🐳 Docker Services
The application uses two main services:
- **PostgreSQL 17**: Primary database
- **Redis 7**: Caching and session storage

## 🎨 Technology Stack

### Frontend
- React 19 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Query for API state
- React Router for navigation

### Backend  
- Express.js with TypeScript
- Prisma ORM with PostgreSQL
- AI integration (Google Generative AI, Ollama)
- Winston for logging
- Zod for validation

### Shared
- TypeScript type definitions
- Validation schemas
- Common utilities

## 🚀 Production Deployment
For production deployment:
```bash
# Build all packages
npm run build

# Start production servers
npm run start -w packages/backend
npm run preview -w packages/frontend
```

## 📚 Key Features
- **Template Browser**: Browse and blend game genre templates
- **AI Generation**: Generate game mechanics, lore, and titles
- **Concept Validation**: Ensure consistency and quality
- **Project Management**: Organize multiple game concepts
- **AI Assistant**: Chat-based design assistance
- **Export Options**: Generate GDDs, pitches, and technical docs

## 🤝 Contributing
See `CONTRIBUTING.md` for development guidelines.

## 📄 License
MIT License - see `LICENSE` file for details.

---

**Need Help?** Check the documentation in `/Dev Docs/` for detailed technical information.
