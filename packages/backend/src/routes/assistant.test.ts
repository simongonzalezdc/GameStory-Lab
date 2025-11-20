/**
 * Assistant API Routes Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

const mockAssistantService = {
  getOrCreateSession: vi.fn(),
  getMessages: vi.fn(),
  listPendingProposals: vi.fn(),
  sendMessage: vi.fn(),
  applyProposal: vi.fn(),
  rejectProposal: vi.fn(),
};

vi.mock('../services/assistant/assistant-service.js', () => ({
  getAssistantService: vi.fn(() => mockAssistantService),
}));

// Mock server exports to avoid real Prisma/AI init
vi.mock('../server.js', () => ({
  prisma: {} as any,
  aiOrchestrator: {} as any,
}));

describe('Assistant API Routes', () => {
  let app: express.Express;

  beforeEach(async () => {
    vi.clearAllMocks();
    const routerModule = await import('./assistant.js');
    app = express();
    app.use(express.json());
    app.use('/api/assistant', routerModule.default);
  });

  it('POST /session should create a session and return messages/proposals', async () => {
    mockAssistantService.getOrCreateSession.mockResolvedValue({
      id: 'session-123',
      projectId: 'project-123',
      type: 'concept',
    });
    mockAssistantService.getMessages.mockResolvedValue([{ id: 'm1', content: 'hi' }]);
    mockAssistantService.listPendingProposals.mockResolvedValue([{ id: 'p1' }]);

    const res = await request(app)
      .post('/api/assistant/session')
      .send({ projectId: 'project-123', type: 'concept' });

    expect(res.status).toBe(200);
    expect(res.body.session.id).toBe('session-123');
    expect(mockAssistantService.getOrCreateSession).toHaveBeenCalledWith('project-123', 'concept');
    expect(res.body.messages).toEqual([{ id: 'm1', content: 'hi' }]);
    expect(res.body.proposals).toEqual([{ id: 'p1' }]);
  });

  it('POST /session should 400 without projectId', async () => {
    const res = await request(app).post('/api/assistant/session').send({ type: 'concept' });
    expect(res.status).toBe(400);
  });

  it('POST /session/:sessionId/message should send a message', async () => {
    mockAssistantService.sendMessage.mockResolvedValue({ message: { id: 'm2', content: 'pong' } });

    const res = await request(app)
      .post('/api/assistant/session/s-1/message')
      .send({ content: 'ping' });

    expect(res.status).toBe(200);
    expect(res.body.message).toEqual({ id: 'm2', content: 'pong' });
    expect(mockAssistantService.sendMessage).toHaveBeenCalledWith('s-1', 'ping');
  });

  it('POST /session/:sessionId/message should 400 without content', async () => {
    const res = await request(app)
      .post('/api/assistant/session/s-1/message')
      .send({});
    expect(res.status).toBe(400);
  });

  it('POST /proposals/:proposalId/accept should apply proposal', async () => {
    mockAssistantService.applyProposal.mockResolvedValue({ newVersion: { id: 'v1' } });

    const res = await request(app).post('/api/assistant/proposals/p-1/accept');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.result).toEqual({ newVersion: { id: 'v1' } });
    expect(mockAssistantService.applyProposal).toHaveBeenCalledWith('p-1');
  });

  it('POST /proposals/:proposalId/reject should reject proposal', async () => {
    mockAssistantService.rejectProposal.mockResolvedValue(undefined);

    const res = await request(app).post('/api/assistant/proposals/p-1/reject');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockAssistantService.rejectProposal).toHaveBeenCalledWith('p-1');
  });
});
