/**
 * Architect Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArchitectService } from './architect-service.js';
import { DOCUMENT_TYPES } from './prompts/document-prompts.js';

// Mock the dependencies - vitest v4 compatible syntax
vi.mock('./interview-manager.js', () => {
  const MockInterviewManager = vi.fn(function() {
    this.createSession = vi.fn().mockReturnValue({
      id: 'test-session-123',
      projectId: 'project-123',
      currentPhase: 'vision',
      answers: {},
      startedAt: new Date(),
    });
    this.submitAnswer = vi.fn().mockReturnValue({
      nextQuestion: {
        id: 'q2',
        phase: 'vision',
        question: 'Next question?',
        type: 'text',
      },
      currentPhase: 'vision',
      progress: { completed: 1, total: 20 },
      isComplete: false,
    });
    this.getSessionProgress = vi.fn().mockReturnValue({
      sessionId: 'test-session-123',
      currentPhase: 'vision',
      completedPhases: [],
      progress: { completed: 0, total: 20 },
      isComplete: false,
    });
    this.buildProjectContext = vi.fn().mockReturnValue({
      projectName: 'Test Project',
      vision: { tagline: 'Test tagline' },
      targetAudience: { primaryAge: '18-35' },
      features: { coreFeatures: [] },
      technical: { targetPlatforms: ['PC'] },
    });
    return this;
  });

  return {
    InterviewManager: MockInterviewManager,
  };
});

vi.mock('./document-generator.js', () => {
  const MockDocumentGenerator = vi.fn(function() {
    this.generateDocumentation = vi.fn().mockResolvedValue({
      projectId: 'project-123',
      sessionId: 'test-session-123',
      context: {} as any,
      generatedAt: new Date(),
      generationStatus: 'completed',
      documents: [
        { templateName: 'executive-summary', content: '# Exec', generatedAt: new Date(), status: 'completed' },
        { templateName: 'technical-specification', content: '# Tech', generatedAt: new Date(), status: 'completed' },
        { templateName: 'product-requirements', content: '# Product', generatedAt: new Date(), status: 'completed' },
        { templateName: 'roadmap', content: '# Roadmap', generatedAt: new Date(), status: 'completed' },
        { templateName: 'launch-checklist', content: '# Launch', generatedAt: new Date(), status: 'completed' },
      ],
    });
    return this;
  });

  return {
    DocumentGenerator: MockDocumentGenerator,
  };
});

vi.mock('./ai-document-generator.js', () => {
  const mockDocuments = [
    {
      documentType: 'executive-summary',
      content: '# Executive Summary\nGenerated content',
      tokensUsed: 150,
      generationTimeMs: 120,
      success: true,
    },
    {
      documentType: 'technical-specification',
      content: '# Technical Specification\nGenerated content',
      tokensUsed: 200,
      generationTimeMs: 140,
      success: true,
    },
    {
      documentType: 'product-requirements',
      content: '# Product Requirements\nGenerated content',
      tokensUsed: 180,
      generationTimeMs: 130,
      success: true,
    },
    {
      documentType: 'roadmap',
      content: '# Roadmap\nGenerated content',
      tokensUsed: 160,
      generationTimeMs: 110,
      success: true,
    },
    {
      documentType: 'launch-checklist',
      content: '# Launch Checklist\nGenerated content',
      tokensUsed: 170,
      generationTimeMs: 90,
      success: true,
    },
  ];

  const MockAIDocumentGenerator = vi.fn(function() {
    this.generateAllDocuments = vi.fn().mockResolvedValue({
      documents: mockDocuments,
      totalTokensUsed: mockDocuments.reduce((sum, doc) => sum + doc.tokensUsed, 0),
      totalTimeMs: mockDocuments.reduce((sum, doc) => sum + doc.generationTimeMs, 0),
      success: true,
      failedDocuments: [],
    });
    this.setInterviewManager = vi.fn();
    return this;
  });

  return {
    AIDocumentGenerator: MockAIDocumentGenerator,
  };
});

describe('ArchitectService', () => {
  let service: ArchitectService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ArchitectService();
  });

  describe('Interview Management', () => {
    it('should start a new interview session', () => {
      const result = service.startInterview('project-123');

      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('currentPhase');
      expect(result).toHaveProperty('firstQuestion');
      expect(result).toHaveProperty('totalQuestions');
      expect(result.sessionId).toBe('test-session-123');
      expect(result.currentPhase).toBe('vision');
      expect(typeof result.totalQuestions).toBe('number');
      expect(result.totalQuestions).toBeGreaterThan(0);
    });

    it('should submit an answer and get next question', () => {
      const result = service.submitAnswer('test-session-123', 'q1', 'Test answer');

      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('nextQuestion');
      expect(result).toHaveProperty('currentPhase');
      expect(result).toHaveProperty('progress');
      expect(result).toHaveProperty('isComplete');
      expect(result.sessionId).toBe('test-session-123');
      expect(result.isComplete).toBe(false);
    });

    it('should get session progress', () => {
      const progress = service.getSessionProgress('test-session-123');

      expect(progress).toHaveProperty('sessionId');
      expect(progress).toHaveProperty('currentPhase');
      expect(progress).toHaveProperty('completedPhases');
      expect(progress).toHaveProperty('progress');
      expect(progress).toHaveProperty('isComplete');
      expect(progress.sessionId).toBe('test-session-123');
      expect(Array.isArray(progress.completedPhases)).toBe(true);
    });

    it('should get all interview questions', () => {
      const questions = service.getAllQuestions();

      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);
      questions.forEach((q) => {
        expect(q).toHaveProperty('id');
        expect(q).toHaveProperty('phase');
        expect(q).toHaveProperty('question');
        expect(q).toHaveProperty('category');
      });
    });
  });

  describe('Documentation Generation', () => {
    it('should start generation and store documents after completion', async () => {
      const result = await service.generateDocumentation('project-123', 'test-session-123');

      expect(result.status).toBe('accepted');
      expect(result.message).toMatch(/Documentation generation started/);

      await new Promise((resolve) => setImmediate(resolve));

      const retrieved = service.getDocumentation('project-123');

      expect(retrieved).toBeDefined();
      expect(retrieved?.projectId).toBe('project-123');
      expect(retrieved?.generationStatus).toBe('completed');
      expect(retrieved?.documents.length).toBe(5);
      retrieved?.documents.forEach((doc) => {
        expect(doc.content).toContain('#');
        expect(['completed', 'generating', 'failed']).toContain(doc.status);
      });
    });

    it('should return null for non-existent documentation', () => {
      const result = service.getDocumentation('non-existent-project');

      expect(result).toBeNull();
    });
  });

  describe('Integration', () => {
    it('should complete full workflow from interview to documentation', async () => {
      // Start interview
      const startResult = service.startInterview('project-123');
      expect(startResult.sessionId).toBeDefined();

      // Submit answer
      const answerResult = service.submitAnswer(
        startResult.sessionId,
        'q1',
        'My amazing game'
      );
      expect(answerResult.nextQuestion).toBeDefined();

      // Check progress
      const progress = service.getSessionProgress(startResult.sessionId);
      expect(progress).toBeDefined();

      // Generate documentation (async)
      const result = await service.generateDocumentation(
        'project-123',
        startResult.sessionId
      );
      expect(result.status).toBe('accepted');

      await new Promise((resolve) => setImmediate(resolve));

      const docs = service.getDocumentation('project-123');
      expect(docs).toBeDefined();
      expect(docs?.projectId).toBe('project-123');

      const retrieved = service.getDocumentation('project-123');
      expect(retrieved).toEqual(docs);
    });

    it('should handle multiple concurrent projects', async () => {
      const session1 = service.startInterview('project-1');
      const result1 = await service.generateDocumentation('project-1', session1.sessionId);
      expect(result1.status).toBe('accepted');
      await new Promise((resolve) => setImmediate(resolve));

      const session2 = service.startInterview('project-2');
      const result2 = await service.generateDocumentation('project-2', session2.sessionId);
      expect(result2.status).toBe('accepted');
      await new Promise((resolve) => setImmediate(resolve));

      expect(service.getDocumentation('project-1')).toBeDefined();
      expect(service.getDocumentation('project-2')).toBeDefined();
      expect(service.getDocumentation('project-1')).not.toBe(service.getDocumentation('project-2'));
    });
  });
});
