/**
 * GameForge Studio Backend Server
 * Express API server with AI orchestration and validation
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { AIOrchestrator } from './services/ai/orchestrator.js';

// Load environment variables
config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Prisma
export const prisma = new PrismaClient();

// Initialize AI Orchestrator
export const aiOrchestrator = new AIOrchestrator();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const aiStatus = await aiOrchestrator.getStatus();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      ai: aiStatus,
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// API routes (will be imported)
app.get('/api', (_req, res) => {
  res.json({
    name: 'GameForge Studio API',
    version: '1.0.0',
    endpoints: {
      projects: '/api/projects',
      generate: '/api/generate',
      validate: '/api/validate',
      export: '/api/export',
      templates: '/api/templates',
      refinement: '/api/refinement',
      titles: '/api/titles',
    },
  });
});

// Import and use route handlers
import projectsRouter from './routes/projects.js';
import generateRouter from './routes/generate.js';
import validateRouter from './routes/validate.js';
import exportRouter from './routes/export.js';
import templatesRouter from './routes/templates.js';
import refinementRouter from './routes/refinement.js';
import titlesRouter from './routes/titles.js';

app.use('/api/projects', projectsRouter);
app.use('/api/generate', generateRouter);
app.use('/api/validate', validateRouter);
app.use('/api/export', exportRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/refinement', refinementRouter);
app.use('/api/titles', titlesRouter);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Start server
async function start() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✓ Database connected');

    // Check AI providers
    const aiStatus = await aiOrchestrator.getStatus();
    console.log('✓ AI Orchestrator initialized');
    console.log('  Available providers:', aiStatus.clients.filter((c) => c.available).map((c) => c.name).join(', '));

    // Start listening
    app.listen(PORT, () => {
      console.log(`\n🚀 GameForge Studio API running on http://localhost:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   API Docs: http://localhost:${PORT}/api\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

start();
