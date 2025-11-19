/**
 * Assistant Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssistantService } from './assistant-service.js';
import type { PrismaClient } from '@prisma/client';
import type { AIOrchestrator } from '../ai/orchestrator.js';

// Mock Prisma Client
const mockPrisma = {
  chatSession: {
    findFirst: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  chatMessage: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  assistantProposal: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
  },
  project: {
    findUnique: vi.fn(),
  },
  version: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
} as unknown as PrismaClient;

// Mock AI Orchestrator
const mockAIOrchestrator = {
  generate: vi.fn().mockResolvedValue({
    content: JSON.stringify({
      reply: 'Test assistant response',
      proposal: {
        mechanics: { coreLoop: 'test' },
        lore: { setting: { era: 'test' } },
      },
    }),
    model: 'qwen3:4b',
    tokensUsed: { prompt: 100, completion: 50, total: 150 },
    finishReason: 'stop' as const,
  }),
} as unknown as AIOrchestrator;

describe('AssistantService', () => {
  let service: AssistantService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AssistantService(mockPrisma, mockAIOrchestrator);
  });

  describe('Session Management', () => {
    it('should get or create a session', async () => {
      mockPrisma.chatSession.findFirst = vi.fn().mockResolvedValue(null);
      mockPrisma.chatSession.create = vi.fn().mockResolvedValue({
        id: 'session-123',
        projectId: 'project-123',
        type: 'concept',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const session = await service.getOrCreateSession('project-123', 'concept');

      expect(session).toHaveProperty('id');
      expect(session.projectId).toBe('project-123');
      expect(mockPrisma.chatSession.create).toHaveBeenCalled();
    });

    it('should return existing session if found', async () => {
      const existingSession = {
        id: 'session-123',
        projectId: 'project-123',
        type: 'concept',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.chatSession.findFirst = vi.fn().mockResolvedValue(existingSession);

      const session = await service.getOrCreateSession('project-123', 'concept');

      expect(session.id).toBe('session-123');
      expect(mockPrisma.chatSession.create).not.toHaveBeenCalled();
    });
  });

  describe('Message Handling', () => {
    it('should send a message and get response', async () => {
      const session = {
        id: 'session-123',
        projectId: 'project-123',
        type: 'concept',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.chatSession.findUnique = vi.fn().mockResolvedValue(session);
      mockPrisma.chatMessage.create = vi.fn().mockResolvedValue({
        id: 'msg-123',
        sessionId: 'session-123',
        role: 'user',
        content: 'Test message',
        createdAt: new Date(),
      });
      mockPrisma.chatMessage.findMany = vi.fn().mockResolvedValue([]);
      mockPrisma.project.findUnique = vi.fn().mockResolvedValue({
        id: 'project-123',
        name: 'Test Project',
        genre: 'rpg',
      });
      mockPrisma.version.findFirst = vi.fn().mockResolvedValue(null);

      const response = await service.sendMessage('session-123', 'Test message');

      expect(response).toHaveProperty('message');
      expect(response.message.content).toBe('Test assistant response');
      expect(mockAIOrchestrator.generate).toHaveBeenCalled();
    });

    it('should get messages for a session', async () => {
      const messages = [
        {
          id: 'msg-1',
          sessionId: 'session-123',
          role: 'user',
          content: 'Hello',
          createdAt: new Date(),
        },
        {
          id: 'msg-2',
          sessionId: 'session-123',
          role: 'assistant',
          content: 'Hi there!',
          createdAt: new Date(),
        },
      ];

      mockPrisma.chatMessage.findMany = vi.fn().mockResolvedValue(messages);

      const result = await service.getMessages('session-123');

      expect(result).toHaveLength(2);
      expect(mockPrisma.chatMessage.findMany).toHaveBeenCalledWith({
        where: { sessionId: 'session-123' },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('Proposal Management', () => {
    it('should list pending proposals', async () => {
      const proposals = [
        {
          id: 'proposal-1',
          sessionId: 'session-123',
          projectId: 'project-123',
          proposalType: 'concept-update',
          status: 'pending',
          payload: { mechanics: {}, lore: {} },
          createdAt: new Date(),
        },
      ];

      mockPrisma.assistantProposal.findMany = vi.fn().mockResolvedValue(proposals);

      const result = await service.listPendingProposals('session-123');

      expect(result).toHaveLength(1);
      expect(mockPrisma.assistantProposal.findMany).toHaveBeenCalledWith({
        where: {
          sessionId: 'session-123',
          status: 'pending',
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should apply a proposal', async () => {
      const proposal = {
        id: 'proposal-123',
        sessionId: 'session-123',
        projectId: 'project-123',
        conceptId: 'concept-123',
        proposalType: 'concept-update',
        status: 'pending',
        payload: {
          mechanics: { coreLoop: 'test' },
          lore: { setting: { era: 'test' } },
        },
        createdAt: new Date(),
      };

      mockPrisma.assistantProposal.findUnique = vi.fn().mockResolvedValue(proposal);
      mockPrisma.version.findFirst = vi.fn().mockResolvedValue({
        id: 'concept-123',
        projectId: 'project-123',
        version: 1,
        mechanics: {},
        lore: {},
        metadata: {},
      });
      mockPrisma.version.findUnique = vi.fn().mockResolvedValue({
        id: 'concept-123',
        projectId: 'project-123',
        version: 1,
        mechanics: {},
        lore: {},
        metadata: {},
      });
      mockPrisma.version.create = vi.fn().mockResolvedValue({
        id: 'concept-124',
        projectId: 'project-123',
        version: 2,
        mechanics: { coreLoop: 'test' },
        lore: { setting: { era: 'test' } },
        metadata: {},
      });
      mockPrisma.assistantProposal.update = vi.fn().mockResolvedValue({
        ...proposal,
        status: 'accepted',
        resolvedAt: new Date(),
      });

      const result = await service.applyProposal('proposal-123');

      expect(result).toHaveProperty('version');
      expect(mockPrisma.assistantProposal.update).toHaveBeenCalledWith({
        where: { id: 'proposal-123' },
        data: {
          status: 'accepted',
          resolvedAt: expect.any(Date),
        },
      });
    });

    it('should reject a proposal', async () => {
      const proposal = {
        id: 'proposal-123',
        sessionId: 'session-123',
        projectId: 'project-123',
        proposalType: 'concept-update',
        status: 'pending',
        createdAt: new Date(),
      };

      mockPrisma.assistantProposal.findUnique = vi.fn().mockResolvedValue(proposal);
      mockPrisma.assistantProposal.update = vi.fn().mockResolvedValue({
        ...proposal,
        status: 'rejected',
        resolvedAt: new Date(),
      });

      await service.rejectProposal('proposal-123');

      expect(mockPrisma.assistantProposal.update).toHaveBeenCalledWith({
        where: { id: 'proposal-123' },
        data: {
          status: 'rejected',
          resolvedAt: expect.any(Date),
        },
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error if session not found when sending message', async () => {
      mockPrisma.chatSession.findUnique = vi.fn().mockResolvedValue(null);

      await expect(
        service.sendMessage('invalid-session', 'Test message')
      ).rejects.toThrow('Session not found');
    });

    it('should handle AI generation errors gracefully', async () => {
      const session = {
        id: 'session-123',
        projectId: 'project-123',
        type: 'concept',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.chatSession.findUnique = vi.fn().mockResolvedValue(session);
      mockPrisma.chatMessage.create = vi.fn().mockResolvedValue({
        id: 'msg-123',
        sessionId: 'session-123',
        role: 'user',
        content: 'Test message',
        createdAt: new Date(),
      });
      mockPrisma.chatMessage.findMany = vi.fn().mockResolvedValue([]);
      mockPrisma.project.findUnique = vi.fn().mockResolvedValue({
        id: 'project-123',
        name: 'Test Project',
      });
      mockPrisma.version.findFirst = vi.fn().mockResolvedValue(null);
      mockAIOrchestrator.generate = vi.fn().mockRejectedValue(new Error('AI error'));

      await expect(
        service.sendMessage('session-123', 'Test message')
      ).rejects.toThrow();
    });
  });
});

