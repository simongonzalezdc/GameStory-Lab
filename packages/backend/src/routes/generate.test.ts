/**
 * POST /api/generate — unified AI error envelope (defect D1, card t_4d397065)
 *
 * AI-unavailable failures must return the refinement-style envelope
 * { error: "<actionable, provider-naming message>", details: "<original>" }
 * — never UNKNOWN_ERROR with details "[object Object]".
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import generateRouter from './generate.js';
import { handleApiError, createErrorResponse } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const prismaMock = {
  project: {
    findUnique: vi.fn().mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440000' }),
  },
  version: {
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: 'version-1', version: 1 }),
    update: vi.fn().mockResolvedValue({ id: 'version-1', version: 1 }),
  },
};

const orchestratorMock = {
  generate: vi.fn(),
};

vi.mock('../server.js', () => ({
  prisma: prismaMock,
  aiOrchestrator: orchestratorMock,
}));

const app = express();
app.use(express.json());
app.use('/api/generate', generateRouter);
// Mirror the global error handler in server.ts so non-AI errors keep their
// original status-code mapping (Prisma 409/404, validation 400, timeout 504).
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const apiError = handleApiError(err);
  res.status(apiError.statusCode).json(createErrorResponse(apiError, false));
});

const VALID_BODY = {
  projectId: '550e8400-e29b-41d4-a716-446655440000',
  taskType: 'mechanics',
  context: {},
};

describe('POST /api/generate — AI-unavailable envelope (D1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.project.findUnique.mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440000' });
    process.env.NODE_ENV = 'development';
  });

  it('returns the refinement-style envelope for plain-object AIClientError throws', async () => {
    // Exact shape thrown by OllamaClient.complete() on failure — the source
    // of the old UNKNOWN_ERROR + "[object Object]" response.
    orchestratorMock.generate.mockRejectedValueOnce({
      name: 'AIClientError',
      message: 'Ollama generation failed: model "qwen3:8b" not found',
      provider: 'ollama',
    });

    const response = await request(app).post('/api/generate').send(VALID_BODY);

    expect(response.status).toBe(500);
    expect(typeof response.body.error).toBe('string');
    expect(response.body.error).not.toBe('[object Object]');
    expect(response.body.error).toContain('ollama pull');
    expect(response.body.error).toContain('MINIMAX_API_KEY');
    expect(JSON.stringify(response.body)).not.toContain('UNKNOWN_ERROR');
    expect(response.body.details).toBe('Ollama generation failed: model "qwen3:8b" not found');
  });

  it('names providers when no AI client is available', async () => {
    orchestratorMock.generate.mockRejectedValueOnce(
      new Error('No AI clients available. Please configure at least one AI provider.'),
    );

    const response = await request(app).post('/api/generate').send(VALID_BODY);

    expect(response.status).toBe(500);
    expect(response.body.error).toContain('MINIMAX_API_KEY');
    expect(response.body.error).toContain('GOOGLE_API_KEY');
    expect(response.body.error).toContain('ollama pull');
  });

  it('never advises destructive pkill commands (D7)', async () => {
    orchestratorMock.generate.mockRejectedValueOnce({
      name: 'AIClientError',
      message: 'Ollama generation failed: model "qwen3:8b" not found',
      provider: 'ollama',
    });

    const response = await request(app).post('/api/generate').send(VALID_BODY);

    expect(response.status).toBe(500);
    expect(JSON.stringify(response.body).toLowerCase()).not.toContain('pkill');
  });

  it('logs the original client message, never "[object Object]"', async () => {
    orchestratorMock.generate.mockRejectedValueOnce({
      name: 'AIClientError',
      message: 'Ollama generation failed: model "qwen3:8b" not found',
      provider: 'ollama',
    });
    const errorSpy = vi.spyOn(logger, 'error').mockReturnValue(logger);

    try {
      await request(app).post('/api/generate').send(VALID_BODY);

      expect(errorSpy).toHaveBeenCalledWith(
        'AI generation failed',
        expect.objectContaining({ error: 'Ollama generation failed: model "qwen3:8b" not found' }),
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});

/**
 * D1 must not regress non-AI error handling: the unified AI envelope applies
 * to AI failures only. Everything else keeps the status-code mapping it had
 * before (Prisma P2002 -> 409, P2025 -> 404, Zod -> 400, timeout -> 504).
 */
describe('POST /api/generate — non-AI errors keep their status mapping (D1 regression guard)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.project.findUnique.mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440000' });
    process.env.NODE_ENV = 'development';
    // The AI call succeeds; the failure under test happens in the DB layer
    // that runs after it (version lookup / insert).
    orchestratorMock.generate.mockResolvedValue({
      content: JSON.stringify({ coreLoop: 'explore', resources: ['gold'] }),
      model: 'test-model',
      tokensUsed: { total: 10 },
      metadata: { durationMs: 1 },
    });
  });

  it('maps a Prisma unique-constraint violation to 409', async () => {
    prismaMock.version.findMany.mockRejectedValueOnce(
      Object.assign(new Error('Unique constraint failed'), { code: 'P2002', meta: { target: ['title'] } }),
    );

    const response = await request(app).post('/api/generate').send(VALID_BODY);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('DUPLICATE_ENTRY');
  });

  it('maps a Prisma record-not-found to 404', async () => {
    prismaMock.version.findMany.mockRejectedValueOnce(
      Object.assign(new Error('Record to update not found'), { code: 'P2025' }),
    );

    const response = await request(app).post('/api/generate').send(VALID_BODY);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('maps a timeout to 504', async () => {
    prismaMock.version.findMany.mockRejectedValueOnce(new Error('Request timeout exceeded'));

    const response = await request(app).post('/api/generate').send(VALID_BODY);

    expect(response.status).toBe(504);
    expect(response.body.error.code).toBe('TIMEOUT');
  });

  it('maps a Zod validation failure to 400', async () => {
    prismaMock.version.findMany.mockRejectedValueOnce(
      Object.assign(new Error('Invalid request data'), {
        issues: [{ path: ['context'], message: 'Required' }],
      }),
    );

    const response = await request(app).post('/api/generate').send(VALID_BODY);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
