/**
 * GameForge Studio Backend Server
 * Express API server with AI orchestration and validation
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { AIOrchestrator } from './services/ai/orchestrator.js';
import { handleApiError, createErrorResponse } from './utils/errors.js';
import { logger } from './utils/logger.js';

// Load environment variables
config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Prisma
export const prisma = new PrismaClient();

// Initialize AI Orchestrator
export const aiOrchestrator = new AIOrchestrator();

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute default
  max: parseInt(process.env.RATE_LIMIT_MAX || '20', 10), // 20 requests per window default
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

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

// Apply rate limiting to all API routes (excluding health check)
app.use('/api', limiter);

// Request logging
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`, { ip: req.ip });
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
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const apiError = handleApiError(err);
  const statusCode = apiError.statusCode;
  const includeStack = process.env.NODE_ENV === 'development';

  res.status(statusCode).json(createErrorResponse(apiError, includeStack));
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
    logger.info('Database connected');

    // Check AI providers
    const aiStatus = await aiOrchestrator.getStatus();
    logger.info('AI Orchestrator initialized', {
      availableProviders: aiStatus.clients.filter((c) => c.available).map((c) => c.name),
    });

    // Start listening
    app.listen(PORT, () => {
      logger.info(`GameForge Studio API running on http://localhost:${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully (SIGINT)');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully (SIGTERM)');
  await prisma.$disconnect();
  process.exit(0);
});

start();
