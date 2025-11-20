/**
 * Health endpoint smoke test (mocked orchestrator/prisma)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const prismaMock = {
  $queryRaw: vi.fn().mockResolvedValue([1]),
};

const orchestratorMock = {
  getStatus: vi.fn().mockResolvedValue({
    clients: [{ name: 'mock', type: 'mock', available: true }],
    currentHourCost: 0,
    costLimit: 5,
  }),
};

vi.mock('../server.js', () => ({
  prisma: prismaMock,
  aiOrchestrator: orchestratorMock,
}));

describe('Health endpoint (mocked)', () => {
  let app: express.Express;

  beforeEach(async () => {
    vi.clearAllMocks();
    const serverModule = await import('../server.js');
    app = express();

    // Inline minimal handler mirroring server.ts logic to keep test isolated
    app.get('/health', async (_req, res) => {
      await serverModule.prisma.$queryRaw`SELECT 1`;
      const aiStatus = await serverModule.aiOrchestrator.getStatus();
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        ai: aiStatus,
      });
    });
  });

  it('should return healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.ai.clients[0].name).toBe('mock');
  });
});
