/**
 * Architect Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArchitectService } from './architect-service.js';

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
      generatedAt: new Date(),
      documents: [
        {
          type: 'game-design-doc',
          title: 'Game Design Document',
          content: 'Test GDD content',
          format: 'markdown',
          generatedAt: new Date(),
        },
      ],
    });
    return this;
  });

  return {
    DocumentGenerator: MockDocumentGenerator,
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
    it('should generate complete documentation package', async () => {
      const result = await service.generateDocumentation('project-123', 'test-session-123');

      expect(result).toHaveProperty('projectId');
      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('generatedAt');
      expect(result).toHaveProperty('documents');
      expect(result.projectId).toBe('project-123');
      expect(result.sessionId).toBe('test-session-123');
      expect(Array.isArray(result.documents)).toBe(true);
      expect(result.documents.length).toBeGreaterThan(0);
    });

    it('should store generated documentation', async () => {
      await service.generateDocumentation('project-123', 'test-session-123');

      const retrieved = service.getDocumentation('project-123');

      expect(retrieved).toBeDefined();
      expect(retrieved).toHaveProperty('projectId');
      expect(retrieved?.projectId).toBe('project-123');
    });

    it('should return null for non-existent documentation', () => {
      const result = service.getDocumentation('non-existent-project');

      expect(result).toBeNull();
    });

    it('should include proper document structure', async () => {
      const result = await service.generateDocumentation('project-123', 'test-session-123');

      expect(result.documents.length).toBeGreaterThan(0);
      const doc = result.documents[0];

      expect(doc).toHaveProperty('type');
      expect(doc).toHaveProperty('title');
      expect(doc).toHaveProperty('content');
      expect(doc).toHaveProperty('format');
      expect(doc).toHaveProperty('generatedAt');
      expect(doc.type).toBe('game-design-doc');
      expect(doc.format).toBe('markdown');
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

      // Generate documentation
      const docs = await service.generateDocumentation(
        'project-123',
        startResult.sessionId
      );
      expect(docs.documents.length).toBeGreaterThan(0);

      // Retrieve documentation
      const retrieved = service.getDocumentation('project-123');
      expect(retrieved).toEqual(docs);
    });

    it('should handle multiple concurrent projects', async () => {
      // The mock always returns 'project-123' so we verify they're stored separately
      // by checking that each call stores its own documentation
      const session1 = service.startInterview('project-1');
      const docs1 = await service.generateDocumentation('project-1', session1.sessionId);
      expect(service.getDocumentation('project-1')).toEqual(docs1);

      const session2 = service.startInterview('project-2');
      const docs2 = await service.generateDocumentation('project-2', session2.sessionId);
      expect(service.getDocumentation('project-2')).toEqual(docs2);

      // Verify both are stored
      expect(service.getDocumentation('project-1')).toBeDefined();
      expect(service.getDocumentation('project-2')).toBeDefined();
    });
  });
});
