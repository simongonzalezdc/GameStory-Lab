/**
 * POST /api/refinement — the reference AI-error envelope (defects D1/D7, card t_4d397065)
 *
 * /api/refinement is the route whose error shape D1 unifies the other AI
 * routes on. Its refactor to the shared envelope (and the removal of the
 * destructive `pkill -9 ollama` advice, D7) had no test; these pin it.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import refinementRouter from './refinement.js';
import { logger } from '../utils/logger.js';

const serviceMock = vi.hoisted(() => ({
  refineConcept: vi.fn(),
}));

vi.mock('../server.js', () => ({
  prisma: {},
  aiOrchestrator: {},
}));

vi.mock('../services/refinement/refinement-service.js', () => ({
  RefinementService: class {
    refineConcept = serviceMock.refineConcept;
  },
}));

const app = express();
app.use(express.json());
app.use('/api/refinement', refinementRouter);

// Exact shape thrown by the AI clients when nothing is configured.
const NO_AI = {
  name: 'AIClientError',
  message: 'No AI clients available. Please configure at least one AI provider.',
  provider: 'none',
};

const VALID_BODY = {
  conceptId: '550e8400-e29b-41d4-a716-446655440000',
  focus: 'enrich-lore',
};

describe('POST /api/refinement — AI-unavailable envelope (D1/D7)', () => {
  const previousNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = previousNodeEnv;
  });

  it('returns the envelope every AI route is unified on', async () => {
    process.env.NODE_ENV = 'development';
    serviceMock.refineConcept.mockRejectedValueOnce(NO_AI);

    const response = await request(app).post('/api/refinement').send(VALID_BODY);

    expect(response.status).toBe(500);
    expect(typeof response.body.error).toBe('string');
    expect(response.body.error).toContain('MINIMAX_API_KEY');
    expect(response.body.details).toBe(NO_AI.message);
  });

  it('never advises a destructive pkill against a shared Ollama daemon (D7)', async () => {
    serviceMock.refineConcept.mockRejectedValueOnce({
      name: 'AIClientError',
      message: 'Ollama model not found',
      provider: 'ollama',
    });

    const response = await request(app).post('/api/refinement').send(VALID_BODY);

    expect(response.status).toBe(500);
    expect(JSON.stringify(response.body).toLowerCase()).not.toContain('pkill');
    expect(response.body.error).toContain('OLLAMA_BASE_URL');
  });

  it('logs the original client message even when details are withheld (production)', async () => {
    process.env.NODE_ENV = 'production';
    serviceMock.refineConcept.mockRejectedValueOnce(NO_AI);
    const errorSpy = vi.spyOn(logger, 'error').mockReturnValue(logger);

    try {
      const response = await request(app).post('/api/refinement').send(VALID_BODY);

      // details is withheld outside development ...
      expect(response.status).toBe(500);
      expect(response.body.details).toBeUndefined();
      // ... so the server log must still carry what actually failed.
      expect(errorSpy).toHaveBeenCalledWith(
        'Refinement request failed',
        expect.objectContaining({ error: NO_AI.message, conceptId: VALID_BODY.conceptId }),
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
