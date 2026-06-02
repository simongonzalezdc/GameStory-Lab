/**
 * GLM Client Tests
 * Tests for the GLM (Zhipu AI) API client with new endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { GLMClient } from './glm.js';
import type { AICompletionRequest } from './base.js';

vi.mock('axios', () => {
  const post = vi.fn();
  const create = vi.fn(() => ({ post }));
  const isAxiosError = (err: any) => !!err?.isAxiosError;
  return {
    default: { create, isAxiosError },
    create,
    post,
    isAxiosError,
  };
});

// Mock logger to avoid noise in tests
vi.mock('../../../utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('GLMClient', () => {
  let client: GLMClient;
  const mockApiKey = 'test-key';
  let mockPost: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    
    // Create mock for axios.post
    mockPost = vi.fn();
    (axios.create as any).mockReturnValue({ post: mockPost });
    (axios as any).isAxiosError = (err: any) => !!err?.isAxiosError;
    
    // Mock environment variables
    vi.stubEnv('GLM_API_KEY', mockApiKey);
    vi.stubEnv('GLM_API_BASE_URL', 'https://api.z.ai/api/coding/paas/v4');
    
    client = new GLMClient({
      apiKey: mockApiKey,
      baseUrl: 'https://api.z.ai/api/coding/paas/v4',
    });
  });

  describe('Initialization', () => {
    it('should initialize with correct API endpoint', () => {
      expect(client.name).toBe('GLM (Zhipu AI)');
      expect(client.type).toBe('glm');
    });

    it('should use the new coding API endpoint', () => {
      // Create client with environment variables
      const envClient = new GLMClient();
      expect(envClient).toBeDefined();
    });

    it('should throw error without API key', () => {
      vi.unstubAllEnvs();
      expect(() => {
        new GLMClient({ apiKey: '' });
      }).toThrow('GLM API key is required');
    });
  });

  describe('Availability', () => {
    it('should return true when API key is present', async () => {
      const available = await client.isAvailable();
      expect(available).toBe(true);
    });

    it('should return false when API key is empty', async () => {
      const noKeyClient = new GLMClient({ apiKey: 'test-key' });
      // Manually set empty key to test
      (noKeyClient as any).apiKey = '';
      const available = await noKeyClient.isAvailable();
      expect(available).toBe(false);
    });
  });

  describe('Model Listing', () => {
    it('should list available models', async () => {
      const models = await client.listModels();
      expect(Array.isArray(models)).toBe(true);
      expect(models).toContain('glm-4.6');
      expect(models).toContain('glm-3-turbo');
    });
  });

  describe('API Connection Tests', () => {
    it('should successfully connect to new API endpoint', async () => {
      const mockResponse = {
        data: {
          id: 'chat-123',
          model: 'GLM-4.6',
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Hello! This is a test response from GLM-4.6.',
              },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 15,
            total_tokens: 25,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
      };

      mockPost.mockResolvedValue(mockResponse);

      const request: AICompletionRequest = {
        model: 'GLM-4.6',
        messages: [{ role: 'user', content: 'Hello, test connection' }],
      };

      const response = await client.complete(request);

      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('model');
      expect(response).toHaveProperty('tokensUsed');
      expect(response).toHaveProperty('finishReason');
      expect(response).toHaveProperty('metadata');
      expect(response.content).toBe('Hello! This is a test response from GLM-4.6.');
      expect(response.model).toBe('GLM-4.6');
      expect(response.tokensUsed.total).toBe(25);
      expect(response.finishReason).toBe('stop');
      expect(response.metadata?.provider).toBe('glm');
    });

    it('should use correct endpoint URL', async () => {
      const mockResponse = {
        data: {
          id: 'chat-123',
          model: 'GLM-4.6',
          choices: [{ message: { role: 'assistant', content: 'Test' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 15, total_tokens: 25 },
        },
      };

      mockPost.mockResolvedValue(mockResponse);

      const request: AICompletionRequest = {
        model: 'GLM-4.6',
        messages: [{ role: 'user', content: 'Test' }],
      };

      await client.complete(request);

      // Verify axios.create was called with correct base URL
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.z.ai/api/coding/paas/v4',
        headers: {
          'Authorization': `Bearer ${mockApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 300000,
      });

      // Verify POST was called to correct endpoint
      expect(mockPost).toHaveBeenCalledWith(
        '/chat/completions',
        expect.objectContaining({
          model: 'GLM-4.6',
          messages: [{ role: 'user', content: 'Test' }],
        })
      );
    });

    it('should handle authentication correctly', async () => {
      const mockResponse = {
        data: {
          id: 'chat-123',
          model: 'GLM-4.6',
          choices: [{ message: { role: 'assistant', content: 'Test' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 15, total_tokens: 25 },
        },
      };

      mockPost.mockResolvedValue(mockResponse);

      const request: AICompletionRequest = {
        model: 'GLM-4.6',
        messages: [{ role: 'user', content: 'Test' }],
      };

      await client.complete(request);

      // Verify correct authorization header
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json',
          },
        })
      );
    });
  });

  describe('Content Generation', () => {
    it('should generate completion with GLM-4.6 model', async () => {
      const mockResponse = {
        data: {
          id: 'chat-456',
          model: 'GLM-4.6',
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'This is a response from GLM-4.6 model.',
              },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 20,
            completion_tokens: 30,
            total_tokens: 50,
          },
        },
      };

      mockPost.mockResolvedValue(mockResponse);

      const request: AICompletionRequest = {
        model: 'GLM-4.6',
        messages: [{ role: 'user', content: 'Generate a response' }],
        temperature: 0.7,
        maxTokens: 2000,
        topP: 0.9,
      };

      const response = await client.complete(request);

      expect(response.content).toBe('This is a response from GLM-4.6 model.');
      expect(response.model).toBe('GLM-4.6');
      expect(response.tokensUsed.prompt).toBe(20);
      expect(response.tokensUsed.completion).toBe(30);
      expect(response.tokensUsed.total).toBe(50);
      expect(response.metadata?.provider).toBe('glm');
      expect(response.metadata?.costUsd).toBeGreaterThanOrEqual(0);
      expect(response.metadata?.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple messages', async () => {
      const mockResponse = {
        data: {
          id: 'chat-789',
          model: 'GLM-4.6',
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Response to conversation',
              },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 30,
            completion_tokens: 25,
            total_tokens: 55,
          },
        },
      };

      mockPost.mockResolvedValue(mockResponse);

      const request: AICompletionRequest = {
        model: 'GLM-4.6',
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
          { role: 'user', content: 'How are you?' },
        ],
      };

      const response = await client.complete(request);

      expect(response.content).toBe('Response to conversation');
      expect(response.tokensUsed.total).toBe(55);
    });

    it('should handle default model when none specified', async () => {
      const mockResponse = {
        data: {
          id: 'chat-default',
          model: 'GLM-4.6',
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Default model response',
              },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 15,
            total_tokens: 25,
          },
        },
      };

      mockPost.mockResolvedValue(mockResponse);

      const request: AICompletionRequest = {
        model: 'GLM-4.6', // Add required model property
        messages: [{ role: 'user', content: 'Test with default model' }],
      };

      const response = await client.complete(request);

      expect(response.content).toBe('Default model response');
      expect(response.model).toBe('GLM-4.6');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const mockError = Object.assign(new Error('Internal server error'), {
        isAxiosError: true,
        response: {
          status: 500,
          data: {
            error: {
              message: 'Internal server error',
            },
          },
        },
      });

      mockPost.mockRejectedValue(mockError);

      const request: AICompletionRequest = {
        model: 'GLM-4.6',
        messages: [{ role: 'user', content: 'Test error' }],
      };

      await expect(client.complete(request)).rejects.toMatchObject({
        name: 'AIClientError',
        provider: 'glm',
        statusCode: 500,
        message: expect.stringContaining('GLM generation failed'),
      });
    });

    it('should handle empty response content', async () => {
      const mockResponse = {
        data: {
          id: 'chat-empty',
          model: 'GLM-4.6',
          choices: [
            {
              message: {
                role: 'assistant',
                content: '',
              },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 0,
            total_tokens: 10,
          },
        },
      };

      mockPost.mockResolvedValue(mockResponse);

      const request: AICompletionRequest = {
        model: 'GLM-4.6',
        messages: [{ role: 'user', content: 'Test empty response' }],
      };

      await expect(client.complete(request)).rejects.toThrow('GLM API returned empty content');
    });

    it('should handle network errors', async () => {
      const networkError = Object.assign(new Error('Network connection failed'), {
        isAxiosError: true,
        response: { status: 503, data: { message: 'down' } },
      });
      
      mockPost.mockRejectedValue(networkError);

      const request: AICompletionRequest = {
        model: 'GLM-4.6',
        messages: [{ role: 'user', content: 'Test network error' }],
      };

      await expect(client.complete(request)).rejects.toMatchObject({
        name: 'AIClientError',
        provider: 'glm',
        message: expect.stringContaining('GLM generation failed'),
      });
    });
  });

  describe('Integration Tests', () => {
    it('should work with real API configuration', async () => {
      // Test with environment-based configuration
      const envClient = new GLMClient();
      expect(envClient).toBeDefined();
      expect(await envClient.isAvailable()).toBe(true);
      
      const models = await envClient.listModels();
      expect(models).toContain('glm-4.6');
    });
  });
});
