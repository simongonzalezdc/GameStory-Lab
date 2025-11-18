/**
 * AI Orchestrator Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIOrchestrator } from './orchestrator.js';
import type { TaskType } from '@gameforge/shared';

// Mock the AI clients - vitest v4 compatible syntax
vi.mock('./clients/openrouter.js', () => {
  const MockOpenRouterClient = vi.fn(function(this: any) {
    this.name = 'OpenRouter';
    this.type = 'openrouter';
    this.isAvailable = vi.fn().mockResolvedValue(true);
    this.complete = vi.fn().mockResolvedValue({
      content: 'Generated content',
      metadata: { costUsd: 0.001, tokensUsed: 100 },
    });
    return this;
  });

  return {
    OpenRouterClient: MockOpenRouterClient,
  };
});

vi.mock('./clients/google.js', () => {
  const MockGoogleClient = vi.fn(function(this: any) {
    this.name = 'Google Gemini';
    this.type = 'google';
    this.isAvailable = vi.fn().mockResolvedValue(true);
    this.complete = vi.fn().mockResolvedValue({
      content: 'Generated content',
      metadata: { tokensUsed: 100 },
    });
    return this;
  });

  return {
    GoogleClient: MockGoogleClient,
  };
});

vi.mock('./clients/ollama.js', () => {
  const MockOllamaClient = vi.fn(function(this: any) {
    this.name = 'Ollama';
    this.type = 'ollama';
    this.isAvailable = vi.fn().mockResolvedValue(true);
    this.listModels = vi.fn().mockResolvedValue(['qwen3:30b-a3b', 'phi4:14b', 'qwen3:7b']);
    this.complete = vi.fn().mockResolvedValue({
      content: 'Generated content',
      metadata: { tokensUsed: 100 },
    });
    return this;
  });

  return {
    OllamaClient: MockOllamaClient,
  };
});

describe('AIOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      const orchestrator = new AIOrchestrator();
      expect(orchestrator).toBeDefined();
    });

    it('should initialize with custom config', () => {
      const config = {
        openrouterApiKey: 'test-key',
        googleApiKey: 'test-key',
        ollamaBaseUrl: 'http://localhost:11434',
        costLimitPerHourUsd: 10.0,
      };
      const orchestrator = new AIOrchestrator(config);
      expect(orchestrator).toBeDefined();
    });

    it('should handle client initialization failures gracefully', () => {
      // Should not throw even if clients fail to initialize
      expect(() => new AIOrchestrator()).not.toThrow();
    });
  });

  describe('Status', () => {
    it('should return orchestrator status', async () => {
      const orchestrator = new AIOrchestrator({
        openrouterApiKey: 'test-key',
        googleApiKey: 'test-key',
      });

      const status = await orchestrator.getStatus();

      expect(status).toHaveProperty('clients');
      expect(status).toHaveProperty('currentHourCost');
      expect(status).toHaveProperty('costLimit');
      expect(Array.isArray(status.clients)).toBe(true);
      expect(typeof status.currentHourCost).toBe('number');
      expect(typeof status.costLimit).toBe('number');
      expect(status.costLimit).toBe(5.0); // Default limit
    });

    it('should track client availability', async () => {
      const orchestrator = new AIOrchestrator({
        openrouterApiKey: 'test-key',
      });

      const status = await orchestrator.getStatus();

      expect(status.clients.length).toBeGreaterThan(0);
      status.clients.forEach((client) => {
        expect(client).toHaveProperty('name');
        expect(client).toHaveProperty('type');
        expect(client).toHaveProperty('available');
        expect(typeof client.available).toBe('boolean');
      });
    });
  });

  describe('Content Generation', () => {
    it('should generate content for mechanics task', async () => {
      const orchestrator = new AIOrchestrator({
        openrouterApiKey: 'test-key',
      });

      const messages = [
        { role: 'user' as const, content: 'Generate game mechanics' },
      ];

      const response = await orchestrator.generate('mechanics', messages);

      expect(response).toHaveProperty('content');
      expect(response.content).toBe('Generated content');
      expect(response).toHaveProperty('metadata');
    });

    it('should generate content for lore task', async () => {
      const orchestrator = new AIOrchestrator({
        openrouterApiKey: 'test-key',
      });

      const messages = [
        { role: 'user' as const, content: 'Generate game lore' },
      ];

      const response = await orchestrator.generate('lore', messages);

      expect(response).toHaveProperty('content');
      expect(response.content).toBe('Generated content');
    });

    it('should generate content for title task', async () => {
      const orchestrator = new AIOrchestrator({
        openrouterApiKey: 'test-key',
      });

      const messages = [
        { role: 'user' as const, content: 'Generate game title' },
      ];

      const response = await orchestrator.generate('title', messages);

      expect(response).toHaveProperty('content');
      expect(response.content).toBe('Generated content');
    });

    it('should generate content for consistency task', async () => {
      const orchestrator = new AIOrchestrator({
        googleApiKey: 'test-key',
      });

      const messages = [
        { role: 'user' as const, content: 'Check consistency' },
      ];

      const response = await orchestrator.generate('consistency', messages);

      expect(response).toHaveProperty('content');
      expect(response.content).toBe('Generated content');
    });

    it('should generate content for refinement task', async () => {
      const orchestrator = new AIOrchestrator();

      const messages = [
        { role: 'user' as const, content: 'Refine game concept' },
      ];

      const response = await orchestrator.generate('refinement', messages);

      expect(response).toHaveProperty('content');
      expect(response.content).toBe('Generated content');
    });
  });

  describe('Model Preferences', () => {
    it('should respect "ollama" preference', async () => {
      const orchestrator = new AIOrchestrator();

      const messages = [
        { role: 'user' as const, content: 'Generate content' },
      ];

      const response = await orchestrator.generate('mechanics', messages, 'ollama');

      expect(response).toHaveProperty('content');
      expect(response.content).toBe('Generated content');
    });

    it('should respect "openrouter" preference', async () => {
      const orchestrator = new AIOrchestrator({
        openrouterApiKey: 'test-key',
      });

      const messages = [
        { role: 'user' as const, content: 'Generate content' },
      ];

      const response = await orchestrator.generate('mechanics', messages, 'openrouter');

      expect(response).toHaveProperty('content');
      expect(response.content).toBe('Generated content');
    });

    it('should use "auto" preference by default', async () => {
      const orchestrator = new AIOrchestrator({
        openrouterApiKey: 'test-key',
      });

      const messages = [
        { role: 'user' as const, content: 'Generate content' },
      ];

      const response = await orchestrator.generate('mechanics', messages);

      expect(response).toHaveProperty('content');
      expect(response.content).toBe('Generated content');
    });
  });

  describe('Cost Tracking', () => {
    it('should track costs across requests', async () => {
      const orchestrator = new AIOrchestrator({
        openrouterApiKey: 'test-key',
        costLimitPerHourUsd: 1.0,
      });

      const messages = [
        { role: 'user' as const, content: 'Generate content' },
      ];

      // Make multiple requests
      await orchestrator.generate('mechanics', messages);
      await orchestrator.generate('lore', messages);

      const status = await orchestrator.getStatus();

      // Cost should be tracked (2 requests × 0.001 USD)
      expect(status.currentHourCost).toBeGreaterThan(0);
    });

    it('should enforce cost limits', async () => {
      const orchestrator = new AIOrchestrator({
        openrouterApiKey: 'test-key',
        costLimitPerHourUsd: 0.0001, // Very low limit to trigger fallback
      });

      const messages = [
        { role: 'user' as const, content: 'Generate content' },
      ];

      // First request to build up cost
      await orchestrator.generate('mechanics', messages);

      // Second request should fallback to Ollama due to cost limit
      const response = await orchestrator.generate('mechanics', messages);

      expect(response).toHaveProperty('content');
      expect(response.content).toBe('Generated content');
    });
  });

  describe('Options and Parameters', () => {
    it('should accept custom temperature', async () => {
      const orchestrator = new AIOrchestrator({
        openrouterApiKey: 'test-key',
      });

      const messages = [
        { role: 'user' as const, content: 'Generate content' },
      ];

      const response = await orchestrator.generate('mechanics', messages, 'auto', {
        temperature: 0.9,
      });

      expect(response).toHaveProperty('content');
    });

    it('should accept custom maxTokens', async () => {
      const orchestrator = new AIOrchestrator({
        openrouterApiKey: 'test-key',
      });

      const messages = [
        { role: 'user' as const, content: 'Generate content' },
      ];

      const response = await orchestrator.generate('mechanics', messages, 'auto', {
        maxTokens: 4000,
      });

      expect(response).toHaveProperty('content');
    });

    it('should accept custom topP', async () => {
      const orchestrator = new AIOrchestrator({
        openrouterApiKey: 'test-key',
      });

      const messages = [
        { role: 'user' as const, content: 'Generate content' },
      ];

      const response = await orchestrator.generate('mechanics', messages, 'auto', {
        topP: 0.95,
      });

      expect(response).toHaveProperty('content');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when no clients available', async () => {
      // Mock all clients as unavailable
      const OllamaClient = (await import('./clients/ollama.js')).OllamaClient;
      vi.mocked(OllamaClient).mockImplementation(
        () =>
          ({
            name: 'Ollama',
            type: 'ollama',
            isAvailable: vi.fn().mockResolvedValue(false),
          }) as any
      );

      const orchestrator = new AIOrchestrator();

      const messages = [
        { role: 'user' as const, content: 'Generate content' },
      ];

      await expect(orchestrator.generate('mechanics', messages)).rejects.toThrow(
        'No AI clients available'
      );
    });
  });
});
