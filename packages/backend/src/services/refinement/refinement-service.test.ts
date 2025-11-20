/**
 * Refinement Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RefinementService } from './refinement-service.js';
import type { RefinementRequest } from './refinement-service.js';
import { mockPrisma } from '../../test/setup.js';

// Mock Prisma and AI Orchestrator
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma),
}));

const mockAIOrchestrator = {
  generate: vi.fn().mockResolvedValue({
    content: JSON.stringify({
      mechanics: { coreLoop: 'Refined gameplay loop' },
      lore: { setting: { location: 'Refined world' } },
    }),
    model: 'qwen3:30b-a3b',
    tokensUsed: { prompt: 10, completion: 50, total: 60 },
    metadata: { durationMs: 100, costUsd: 0 },
  }),
};

describe('RefinementService', () => {
  let service: RefinementService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RefinementService(mockPrisma as any, mockAIOrchestrator as any);

    // Setup mock responses
    vi.mocked(mockPrisma.version.findUnique).mockResolvedValue({
      id: 'version-123',
      projectId: 'project-123',
      version: 1,
      title: 'Test Game',
      mechanics: { coreLoop: 'Original gameplay' },
      lore: { setting: { location: 'Original world' } },
      metadata: {},
      createdAt: new Date(),
    } as any);

    vi.mocked(mockPrisma.version.create).mockResolvedValue({
      id: 'version-456',
      projectId: 'project-123',
      version: 2,
      title: 'Test Game',
      mechanics: { coreLoop: 'Refined gameplay loop' },
      lore: { setting: { location: 'Refined world' } },
      metadata: { refinedFrom: 'version-123' },
      createdAt: new Date(),
    } as any);
  });

  describe('Concept Refinement', () => {
    it('should refine concept with balance focus', async () => {
      const request: RefinementRequest = {
        conceptId: 'version-123',
        focus: 'balance',
      };

      const result = await service.refineConcept(request);

      expect(result).toHaveProperty('newVersionId');
      expect(result).toHaveProperty('newVersion');
      expect(result).toHaveProperty('previousVersion');
      expect(result).toHaveProperty('mechanics');
      expect(result).toHaveProperty('lore');
      expect(result).toHaveProperty('changesApplied');
      expect(result.newVersion).toBe(2);
      expect(result.previousVersion).toBe(1);
    });

    it('should refine concept with depth focus', async () => {
      const request: RefinementRequest = {
        conceptId: 'version-123',
        focus: 'depth',
      };

      const result = await service.refineConcept(request);

      expect(result).toBeDefined();
      expect(mockAIOrchestrator.generate).toHaveBeenCalled();
    });

    it('should refine concept with clarity focus', async () => {
      const request: RefinementRequest = {
        conceptId: 'version-123',
        focus: 'clarity',
      };

      const result = await service.refineConcept(request);

      expect(result).toBeDefined();
      expect(result.mechanics).toBeDefined();
      expect(result.lore).toBeDefined();
    });

    it('should refine concept with innovation focus', async () => {
      const request: RefinementRequest = {
        conceptId: 'version-123',
        focus: 'innovation',
      };

      const result = await service.refineConcept(request);

      expect(result).toBeDefined();
    });

    it('should handle specific instructions', async () => {
      const request: RefinementRequest = {
        conceptId: 'version-123',
        focus: 'balance',
        specificInstructions: 'Make combat more tactical',
      };

      const result = await service.refineConcept(request);

      expect(result).toBeDefined();
      expect(mockAIOrchestrator.generate).toHaveBeenCalled();
      const callArgs = vi.mocked(mockAIOrchestrator.generate).mock.calls[0];
      expect(callArgs[1][1].content).toContain('Make combat more tactical');
    });

    it('should respect preserve fields', async () => {
      const request: RefinementRequest = {
        conceptId: 'version-123',
        focus: 'balance',
        preserveFields: ['coreLoop', 'protagonist'],
      };

      const result = await service.refineConcept(request);

      expect(result).toBeDefined();
      expect(mockAIOrchestrator.generate).toHaveBeenCalled();
    });

    it('should throw error for non-existent version', async () => {
      vi.mocked(mockPrisma.version.findUnique).mockResolvedValue(null);

      const request: RefinementRequest = {
        conceptId: 'non-existent',
        focus: 'balance',
      };

      await expect(service.refineConcept(request)).rejects.toThrow('Version not found');
    });
  });

  describe('Change Tracking', () => {
    it('should track changes between versions', async () => {
      const request: RefinementRequest = {
        conceptId: 'version-123',
        focus: 'balance',
      };

      const result = await service.refineConcept(request);

      expect(result.changesApplied).toBeDefined();
      expect(Array.isArray(result.changesApplied)).toBe(true);
    });

    it('should create new version with metadata', async () => {
      const request: RefinementRequest = {
        conceptId: 'version-123',
        focus: 'depth',
      };

      await service.refineConcept(request);

      expect(mockPrisma.version.create).toHaveBeenCalled();
      const createCall = vi.mocked(mockPrisma.version.create).mock.calls[0][0];
      expect(createCall.data.version).toBe(2);
      expect(createCall.data.metadata).toHaveProperty('refinedFrom');
      expect(createCall.data.metadata).toHaveProperty('refinementFocus');
    });
  });

  describe('Version Management', () => {
    it('should increment version number', async () => {
      const request: RefinementRequest = {
        conceptId: 'version-123',
        focus: 'balance',
      };

      const result = await service.refineConcept(request);

      expect(result.newVersion).toBe(2);
      expect(result.previousVersion).toBe(1);
    });

    it('should maintain project ID', async () => {
      const request: RefinementRequest = {
        conceptId: 'version-123',
        focus: 'balance',
      };

      await service.refineConcept(request);

      const createCall = vi.mocked(mockPrisma.version.create).mock.calls[0][0];
      expect(createCall.data.projectId).toBe('project-123');
    });

    it('should preserve title', async () => {
      const request: RefinementRequest = {
        conceptId: 'version-123',
        focus: 'balance',
      };

      await service.refineConcept(request);

      const createCall = vi.mocked(mockPrisma.version.create).mock.calls[0][0];
      expect(createCall.data.title).toBe('Test Game');
    });
  });

  describe('AI Integration', () => {
    it('should use AI orchestrator for refinement', async () => {
      const request: RefinementRequest = {
        conceptId: 'version-123',
        focus: 'balance',
      };

      await service.refineConcept(request);

      const call = vi.mocked(mockAIOrchestrator.generate).mock.calls[0];
      expect(call[0]).toBe('refinement');
      expect(Array.isArray(call[1])).toBe(true);
      expect(call[1].length).toBeGreaterThan(0);
      // Third arg is model preference, now passed as options
      expect(call[2]).toBe('auto');
      // Optional fourth arg is options bag in current implementation
      expect(call[3]).toEqual(expect.objectContaining({ maxTokens: expect.any(Number) }));
    });

    it('should include system message for focus', async () => {
      const request: RefinementRequest = {
        conceptId: 'version-123',
        focus: 'innovation',
      };

      await service.refineConcept(request);

      const callArgs = vi.mocked(mockAIOrchestrator.generate).mock.calls[0];
      expect(callArgs[1][0].role).toBe('system');
      expect(callArgs[1][0].content).toBeDefined();
    });

    it('should track AI model used', async () => {
      const request: RefinementRequest = {
        conceptId: 'version-123',
        focus: 'balance',
      };

      await service.refineConcept(request);

      const createCall = vi.mocked(mockPrisma.version.create).mock.calls[0][0];
      expect(createCall.data.metadata.aiModel).toBe('qwen3:30b-a3b');
    });
  });

  describe('Error Handling', () => {
    it('should handle AI generation errors', async () => {
      vi.mocked(mockAIOrchestrator.generate).mockRejectedValue(
        new Error('AI error')
      );

      const request: RefinementRequest = {
        conceptId: 'version-123',
        focus: 'balance',
      };

      await expect(service.refineConcept(request)).rejects.toThrow();
    });

    it('should handle database errors', async () => {
      vi.mocked(mockPrisma.version.create).mockRejectedValue(
        new Error('Database error')
      );

      const request: RefinementRequest = {
        conceptId: 'version-123',
        focus: 'balance',
      };

      await expect(service.refineConcept(request)).rejects.toThrow();
    });
  });
});
