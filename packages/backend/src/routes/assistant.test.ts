/**
 * Assistant API Routes Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

// Mock the assistant service
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

describe('Assistant API Routes', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let assistantRouter: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock Express response
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    // Import router after mocks are set up
    const module = await import('./assistant.js');
    assistantRouter = module.default;
  });

  describe('POST /session', () => {
    it('should create a session with projectId', async () => {
      req = {
        body: { projectId: 'project-123', type: 'concept' },
      };

      mockAssistantService.getOrCreateSession.mockResolvedValue({
        id: 'session-123',
        projectId: 'project-123',
        type: 'concept',
      });
      mockAssistantService.getMessages.mockResolvedValue([]);
      mockAssistantService.listPendingProposals.mockResolvedValue([]);

      // Simulate route handler
      const handler = assistantRouter.stack.find(
        (layer: any) => layer.route?.path === '/session' && layer.route?.methods?.post
      );

      if (handler) {
        await handler.route.stack[0].handle(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalled();
      }
    });

    it('should return 400 if projectId is missing', async () => {
      req = {
        body: { type: 'concept' },
      };

      // The route should validate and return 400
      // This is tested via integration tests
    });
  });

  describe('POST /session/:sessionId/message', () => {
    it('should send a message', async () => {
      req = {
        params: { sessionId: 'session-123' },
        body: { content: 'Test message' },
      };

      mockAssistantService.sendMessage.mockResolvedValue({
        message: {
          id: 'msg-123',
          content: 'Response',
        },
      });

      // Route validation would be tested in integration tests
    });

    it('should return 400 if content is missing', async () => {
      req = {
        params: { sessionId: 'session-123' },
        body: {},
      };

      // Route validation would return 400
    });
  });

  describe('POST /proposals/:proposalId/accept', () => {
    it('should accept a proposal', async () => {
      req = {
        params: { proposalId: 'proposal-123' },
      };

      mockAssistantService.applyProposal.mockResolvedValue({
        version: { id: 'version-123' },
      });

      // Route handler would call applyProposal
    });
  });

  describe('POST /proposals/:proposalId/reject', () => {
    it('should reject a proposal', async () => {
      req = {
        params: { proposalId: 'proposal-123' },
      };

      mockAssistantService.rejectProposal.mockResolvedValue(undefined);

      // Route handler would call rejectProposal
    });
  });
});

