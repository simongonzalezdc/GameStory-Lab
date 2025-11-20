/**
 * Ollama Client Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OllamaClient } from './ollama.js';
import type { AICompletionRequest } from './base.js';

// Mock the Ollama library - vitest v4 compatible syntax
vi.mock('ollama', () => {
  const MockOllama = vi.fn(function(this: any) {
    this.generate = vi.fn().mockResolvedValue({
      response: 'Generated response',
      prompt_eval_count: 10,
      eval_count: 50,
    });
    this.list = vi.fn().mockResolvedValue({
      models: [
        { name: 'qwen3:30b-a3b' },
        { name: 'phi4:14b' },
        { name: 'qwen3:7b' },
      ],
    });
    this.pull = vi.fn().mockResolvedValue({});
    return this;
  });

  return {
    Ollama: MockOllama,
  };
});

describe('OllamaClient', () => {
  let client: OllamaClient;

  beforeEach(() => {
    vi.clearAllMocks();
    // Stub fetch to avoid real network/fallbacks
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ response: 'Generated response', prompt_eval_count: 0, eval_count: 0 }),
      text: async () => '',
    });
    client = new OllamaClient();
  });

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      expect(client.name).toBe('Ollama');
      expect(client.type).toBe('ollama');
    });

    it('should initialize with custom base URL', () => {
      const customClient = new OllamaClient({
        baseUrl: 'http://custom:11434',
      });
      expect(customClient).toBeDefined();
    });
  });

  describe('Availability', () => {
    it('should check availability successfully', async () => {
      const available = await client.isAvailable();
      expect(available).toBe(true);
    });

    it('should return false when unavailable', async () => {
      const { Ollama } = await import('ollama');
      vi.mocked(Ollama).mockImplementationOnce(function(this: any) {
        this.list = vi.fn().mockRejectedValue(new Error('Connection failed'));
        return this;
      });

      const unavailableClient = new OllamaClient();
      const available = await unavailableClient.isAvailable();
      expect(available).toBe(false);
    });
  });

  describe('Model Listing', () => {
    it('should list available models', async () => {
      const models = await client.listModels();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      expect(models).toContain('qwen3:30b-a3b');
      expect(models).toContain('phi4:14b');
      expect(models).toContain('qwen3:7b');
    });

    it('should return empty array on error', async () => {
      const { Ollama } = await import('ollama');
      vi.mocked(Ollama).mockImplementationOnce(function(this: any) {
        this.list = vi.fn().mockRejectedValue(new Error('Failed'));
        return this;
      });

      const errorClient = new OllamaClient();
      const models = await errorClient.listModels();
      expect(models).toEqual([]);
    });
  });

  describe('Content Generation', () => {
    it('should generate completion', async () => {
      const request: AICompletionRequest = {
        model: 'qwen3:7b',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const response = await client.complete(request);

      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('model');
      expect(response).toHaveProperty('tokensUsed');
      expect(response).toHaveProperty('finishReason');
      expect(response).toHaveProperty('metadata');
      expect(response.content).toBe('Generated response');
      expect(response.model).toBe('qwen3:7b');
    });

    it('should handle Qwen models with special prompting', async () => {
      const request: AICompletionRequest = {
        model: 'qwen3:30b-a3b',
        messages: [{ role: 'user', content: 'Generate JSON' }],
      };

      const response = await client.complete(request);

      expect(response).toHaveProperty('content');
      expect(response.content).toBe('Generated response');
    });

    it('should handle DeepSeek R1 with special prompting', async () => {
      const request: AICompletionRequest = {
        model: 'deepseek-r1:8b',
        messages: [{ role: 'user', content: 'Generate content' }],
      };

      const response = await client.complete(request);

      expect(response).toHaveProperty('content');
      expect(response.content).toBe('Generated response');
    });

    it('should track token usage', async () => {
      const request: AICompletionRequest = {
        model: 'qwen3:7b',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const response = await client.complete(request);

      expect(response.tokensUsed).toHaveProperty('prompt');
      expect(response.tokensUsed).toHaveProperty('completion');
      expect(response.tokensUsed).toHaveProperty('total');
      expect(response.tokensUsed.prompt).toBe(10);
      expect(response.tokensUsed.completion).toBe(50);
      expect(response.tokensUsed.total).toBe(60);
    });

    it('should track metadata', async () => {
      const request: AICompletionRequest = {
        model: 'qwen3:7b',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const response = await client.complete(request);

      expect(response.metadata).toHaveProperty('provider');
      expect(response.metadata).toHaveProperty('durationMs');
      expect(response.metadata).toHaveProperty('costUsd');
      expect(response.metadata?.provider).toBe('ollama');
      expect(response.metadata?.costUsd).toBe(0); // Ollama is free
      expect(response.metadata?.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle custom temperature', async () => {
      const request: AICompletionRequest = {
        model: 'qwen3:7b',
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 0.9,
      };

      const response = await client.complete(request);

      expect(response).toHaveProperty('content');
    });

    it('should handle custom maxTokens', async () => {
      const request: AICompletionRequest = {
        model: 'qwen3:7b',
        messages: [{ role: 'user', content: 'Hello' }],
        maxTokens: 4000,
      };

      const response = await client.complete(request);

      expect(response).toHaveProperty('content');
    });

    it('should handle custom topP', async () => {
      const request: AICompletionRequest = {
        model: 'qwen3:7b',
        messages: [{ role: 'user', content: 'Hello' }],
        topP: 0.95,
      };

      const response = await client.complete(request);

      expect(response).toHaveProperty('content');
    });

    it('should format multiple messages correctly', async () => {
      const request: AICompletionRequest = {
        model: 'qwen3:7b',
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
          { role: 'user', content: 'How are you?' },
        ],
      };

      const response = await client.complete(request);

      expect(response).toHaveProperty('content');
    });

    it.skip('should handle generation errors', async () => {
      (global as any).fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'fail' }),
        text: async () => 'fail',
      });
      const { Ollama } = await import('ollama');
      vi.mocked(Ollama).mockImplementationOnce(function(this: any) {
        this.generate = vi.fn().mockRejectedValue(new Error('Generation failed'));
        return this;
      });

      const errorClient = new OllamaClient();
      const request: AICompletionRequest = {
        model: 'qwen3:7b',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      await expect(errorClient.complete(request)).rejects.toThrow();
    });
  });

  describe('Model Management', () => {
    it('should pull a model successfully', async () => {
      await expect(client.pullModel('qwen3:3b')).resolves.not.toThrow();
    });

    it('should handle pull errors', async () => {
      const { Ollama } = await import('ollama');
      vi.mocked(Ollama).mockImplementationOnce(function(this: any) {
        this.pull = vi.fn().mockRejectedValue(new Error('Pull failed'));
        return this;
      });

      const errorClient = new OllamaClient();
      await expect(errorClient.pullModel('invalid-model')).rejects.toThrow();
    });
  });
});
