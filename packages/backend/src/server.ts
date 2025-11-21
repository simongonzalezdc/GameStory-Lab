/**
 * GameForge Studio Backend Server
 * Express API server with AI orchestration and validation
 */

// Load environment variables FIRST, before any other imports that might use them
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Go up from src/ to backend/ to packages/ to root
const rootEnvPath = resolve(__dirname, '../../../.env');

// Load .env file synchronously before any other code runs
// Try multiple paths to ensure we find the .env file
const envPaths = [
  rootEnvPath, // Expected: packages/backend/src/../../../.env (root)
  resolve(process.cwd(), '.env'), // Current working directory (most reliable)
  resolve(__dirname, '../../.env'), // packages/.env
];

let envResult: { error?: Error; parsed?: Record<string, string> } = { error: new Error('No .env file found') };
let loadedEnvPath: string | null = null;

for (const envPath of envPaths) {
  const result = config({ path: envPath });
  if (!result.error) {
    envResult = result;
    loadedEnvPath = envPath;
    break;
  }
}

if (envResult.error || !loadedEnvPath) {
  console.warn('⚠️ Failed to load .env file from any path:', {
    attemptedPaths: envPaths,
    error: envResult.error?.message,
  });
  console.warn('   Using environment variables from process.env only');
} else {
  console.log(`✅ Loaded .env file from: ${loadedEnvPath}`);
  console.log(`   PORT=${process.env.PORT || 'NOT SET (will use default 3001)'}`);
}

// Now import other modules (they will have access to process.env)
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { AIOrchestrator } from './services/ai/orchestrator.js';
import { handleApiError, createErrorResponse } from './utils/errors.js';
import { logger } from './utils/logger.js';

// Log environment variable status
logger.debug('Environment variables loaded', { 
  loadedKeys: Object.keys(envResult.parsed || {}).length,
  hasMinimaxKey: !!process.env.MINIMAX_API_KEY,
  minimaxKeyPreview: process.env.MINIMAX_API_KEY ? process.env.MINIMAX_API_KEY.substring(0, 15) + '...' : 'NOT SET',
  hasGLMKey: !!process.env.GLM_API_KEY,
  glmKeyPreview: process.env.GLM_API_KEY ? process.env.GLM_API_KEY.substring(0, 15) + '...' : 'NOT SET'
});

// Initialize Express app
const app = express();
// Parse PORT as number, fallback to 3001 if not set
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Log port configuration for debugging
console.log('🔧 Server Configuration:', {
  PORT_ENV: process.env.PORT || 'NOT SET',
  PORT_PARSED: PORT,
  NODE_ENV: process.env.NODE_ENV || 'development',
});

// Initialize Prisma
export const prisma = new PrismaClient();

// Initialize AI Orchestrator (with error handling to prevent startup failure)
let aiOrchestrator: AIOrchestrator;
try {
  aiOrchestrator = new AIOrchestrator();
} catch (error) {
  logger.error('Failed to initialize AI Orchestrator during module load', {
    error: error instanceof Error ? error.message : String(error),
  });
  // Create a minimal orchestrator to prevent crashes
  aiOrchestrator = new AIOrchestrator();
}
export { aiOrchestrator };

// Rate limiting middleware - more lenient for validation endpoint
const generalLimiter = rateLimit({
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

// More lenient limiter for validation (allows more frequent validation checks)
const validationLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 30, // 30 validation requests per minute (very lenient for auto-validation)
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many validation requests. Please wait a moment before validating again.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development for easier testing
    return process.env.NODE_ENV === 'development' && req.headers['x-skip-rate-limit'] === 'true';
  },
});

// Middleware
app.use(helmet());

// Enable gzip compression for all responses
app.use(compression({
  // Only compress responses larger than 1KB
  threshold: 1024,
  // Compression level (0-9, where 6 is default and good balance)
  level: 6,
  // Filter function to determine which responses to compress
  filter: (req, res) => {
    // Don't compress if client doesn't accept encoding
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression's default filter
    return compression.filter(req, res);
  },
}));

// CORS configuration - always use an array to support multiple frontend ports
const allowedOrigins = [
  'http://localhost:4173', // Vite preview server
  'http://localhost:5173', // Vite dev server (default)
  'http://localhost:5174', // Vite dev server (alternative)
  'http://localhost:5176', // Additional dev port
  'http://localhost:5178', // Additional dev port
  'http://localhost:5179', // Additional dev port
];

// Add FRONTEND_URL from environment if set and not already in the array
if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to API routes
// IMPORTANT: Apply specific limiters BEFORE general ones (order matters!)
// Health check is excluded (no limiter applied)
app.use('/api/validate', validationLimiter); // More lenient for validation (10/min)
app.use('/api', generalLimiter); // General rate limiting for other endpoints (20/min)

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
    
    logger.debug('Health check - AI status', {
      clientCount: aiStatus.clients.length,
      clients: aiStatus.clients.map(c => ({ name: c.name, type: c.type, available: c.available }))
    });
    
    // Log the actual response being sent
    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      ai: aiStatus,
    };
    logger.debug('Health check response', { 
      aiClientsCount: response.ai.clients.length,
      aiClientNames: response.ai.clients.map(c => c.name)
    });

    res.json(response);
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
      architect: '/api/architect',
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
import architectRouter from './routes/architect.js';
import assistantRouter from './routes/assistant.js';

app.use('/api/projects', projectsRouter);
app.use('/api/generate', generateRouter);
app.use('/api/validate', validateRouter);
app.use('/api/export', exportRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/refinement', refinementRouter);
app.use('/api/titles', titlesRouter);
app.use('/api/architect', architectRouter);
app.use('/api/assistant', assistantRouter);

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
  logger.info('Starting GameForge Studio API server...', {
    port: PORT,
    nodeEnv: process.env.NODE_ENV || 'development',
    envFileLoaded: !!envResult.parsed,
    envKeysCount: Object.keys(envResult.parsed || {}).length,
  });

  // Start listening FIRST to ensure server is available even if initialization fails
  let server: ReturnType<typeof app.listen>;
  try {
    server = app.listen(PORT, () => {
      logger.info(`✅ GameForge Studio API running on http://localhost:${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
      });
    });
    
    // Set server timeout to 10 minutes for long-running AI requests (local LLMs can be slow)
    server.timeout = 600000; // 10 minutes
    
    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. Please stop the process using this port or change PORT in .env`);
      } else {
        logger.error('Server error:', error);
      }
      process.exit(1);
    });
  } catch (listenError) {
    logger.error('Failed to start server listener', {
      error: listenError instanceof Error ? listenError.message : String(listenError),
      port: PORT,
    });
    process.exit(1);
  }

  // Initialize services (non-blocking - server already listening)
  try {
    // Test database connection (non-blocking)
    try {
      await prisma.$connect();
      logger.info('✅ Database connected');
    } catch (dbError) {
      logger.warn('⚠️ Database connection failed - server will start but database features will be unavailable', {
        error: dbError instanceof Error ? dbError.message : String(dbError),
      });
    }

    // Initialize Ollama only if Minimax is not available (Ollama is fallback only)
    const minimaxAvailable = process.env.MINIMAX_API_KEY && process.env.MINIMAX_API_KEY.length > 0;
    if (!minimaxAvailable) {
      logger.info('Minimax not available, initializing Ollama as primary provider');
      try {
        const { initializeOllama } = await import('./utils/ollama-setup.js');
        await initializeOllama();
      } catch (ollamaError) {
        logger.warn('⚠️ Ollama initialization failed - AI features may be limited', {
          error: ollamaError instanceof Error ? ollamaError.message : String(ollamaError),
        });
      }
    } else {
      logger.debug('Skipping Ollama setup - Minimax is available as primary provider');
    }

    // Check AI providers
    try {
      const aiStatus = await aiOrchestrator.getStatus();
      logger.info('✅ AI Orchestrator initialized', {
        availableProviders: aiStatus.clients.filter((c) => c.available).map((c) => c.name),
        totalClients: aiStatus.clients.length,
      });
    } catch (aiError) {
      logger.warn('⚠️ AI Orchestrator initialization warning', {
        error: aiError instanceof Error ? aiError.message : String(aiError),
      });
    }
  } catch (initError) {
    logger.error('⚠️ Some services failed to initialize, but server is running', {
      error: initError instanceof Error ? initError.message : String(initError),
      stack: initError instanceof Error ? initError.stack : undefined,
    });
    // Don't exit - server is already listening
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

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: String(promise),
  });
  // Don't exit - let the server continue running
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  // Exit on uncaught exceptions as they indicate a serious problem
  process.exit(1);
});

// Start the server
start().catch((error) => {
  logger.error('Failed to start server (unhandled error in start function)', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  process.exit(1);
});
