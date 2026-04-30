/**
 * Tests for AI response validator
 */

import { describe, it, expect, vi } from 'vitest';
import {
  validateOpenRouterResponse,
  validateMinimaxResponse,
  validateGLMResponse,
  validateOllamaResponse,
} from '@/lib/ai/response-validator';
import { errorHandler } from '@/lib/errors/error-handler';

describe('Response Validator', () => {
  describe('validateOpenRouterResponse', () => {
    it('should validate valid OpenRouter response', () => {
      const validResponse = {
        choices: [
          {
            message: {
              content: 'Hello, world!',
              role: 'assistant',
            },
            finish_reason: 'stop',
          },
        ],
        model: 'gpt-3.5-turbo',
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
        },
      };

      const result = validateOpenRouterResponse(validResponse);

      expect(result.content).toBe('Hello, world!');
      expect(result.model).toBe('gpt-3.5-turbo');
    });

    it('should validate response without optional fields', () => {
      const validResponse = {
        choices: [
          {
            message: {
              content: 'Hello!',
              role: 'assistant',
            },
          },
        ],
      };

      const result = validateOpenRouterResponse(validResponse);

      expect(result.content).toBe('Hello!');
    });

    it('should throw error for invalid response structure', () => {
      vi.spyOn(errorHandler, 'handle');
      const invalidResponse = {
        invalid: 'response',
      };

      expect(() => validateOpenRouterResponse(invalidResponse)).toThrow('Response validation failed');
      expect(errorHandler.handle).toHaveBeenCalled();
    });

    it('should throw error for empty content', () => {
      vi.spyOn(errorHandler, 'handle');
      const invalidResponse = {
        choices: [
          {
            message: {
              content: '',
              role: 'assistant',
            },
          },
        ],
      };

      expect(() => validateOpenRouterResponse(invalidResponse)).toThrow();
    });

    it('should throw error for missing choices', () => {
      vi.spyOn(errorHandler, 'handle');
      const invalidResponse = {
        model: 'gpt-3.5-turbo',
      };

      expect(() => validateOpenRouterResponse(invalidResponse)).toThrow();
    });
  });

  describe('validateMinimaxResponse', () => {
    it('should validate valid Minimax response', () => {
      const validResponse = {
        choices: [
          {
            message: {
              content: 'Test response',
              role: 'assistant',
            },
          },
        ],
        base_resp: {
          status_code: 200,
          status_msg: 'OK',
        },
      };

      const result = validateMinimaxResponse(validResponse);

      expect(result.content).toBe('Test response');
    });

    it('should validate response without base_resp', () => {
      const validResponse = {
        choices: [
          {
            message: {
              content: 'Test',
              role: 'assistant',
            },
          },
        ],
      };

      const result = validateMinimaxResponse(validResponse);

      expect(result.content).toBe('Test');
    });

    it('should throw error for invalid response', () => {
      vi.spyOn(errorHandler, 'handle');
      const invalidResponse = {
        error: 'Failed',
      };

      expect(() => validateMinimaxResponse(invalidResponse)).toThrow();
      expect(errorHandler.handle).toHaveBeenCalled();
    });

    it('should throw error for empty content', () => {
      vi.spyOn(errorHandler, 'handle');
      const invalidResponse = {
        choices: [
          {
            message: {
              content: '',
              role: 'assistant',
            },
          },
        ],
      };

      expect(() => validateMinimaxResponse(invalidResponse)).toThrow('No content in response');
    });
  });

  describe('validateGLMResponse', () => {
    it('should validate valid GLM response', () => {
      const validResponse = {
        choices: [
          {
            message: {
              content: 'GLM response',
              role: 'assistant',
            },
            finish_reason: 'stop',
          },
        ],
        model: 'glm-4',
        usage: {
          prompt_tokens: 15,
          completion_tokens: 10,
        },
      };

      const result = validateGLMResponse(validResponse);

      expect(result.content).toBe('GLM response');
      expect(result.model).toBe('glm-4');
    });

    it('should validate response without optional fields', () => {
      const validResponse = {
        choices: [
          {
            message: {
              content: 'Response',
              role: 'assistant',
            },
          },
        ],
      };

      const result = validateGLMResponse(validResponse);

      expect(result.content).toBe('Response');
    });

    it('should throw error for invalid response', () => {
      vi.spyOn(errorHandler, 'handle');
      const invalidResponse = {};

      expect(() => validateGLMResponse(invalidResponse)).toThrow();
    });

    it('should throw error for empty content', () => {
      vi.spyOn(errorHandler, 'handle');
      const invalidResponse = {
        choices: [],
      };

      expect(() => validateGLMResponse(invalidResponse)).toThrow();
    });
  });

  describe('validateOllamaResponse', () => {
    it('should validate valid Ollama response', () => {
      const validResponse = {
        message: {
          content: 'Ollama response',
          role: 'assistant',
        },
        done: true,
        model: 'llama2',
      };

      const result = validateOllamaResponse(validResponse);

      expect(result.content).toBe('Ollama response');
      expect(result.model).toBe('llama2');
    });

    it('should validate minimal response', () => {
      const validResponse = {
        message: {
          content: 'Test',
        },
      };

      const result = validateOllamaResponse(validResponse);

      expect(result.content).toBe('Test');
    });

    it('should throw error for response with error field', () => {
      vi.spyOn(errorHandler, 'handle');
      const errorResponse = {
        error: 'Model not found',
      };

      expect(() => validateOllamaResponse(errorResponse)).toThrow('Ollama API error');
    });

    it('should throw error for missing message', () => {
      vi.spyOn(errorHandler, 'handle');
      const invalidResponse = {
        done: true,
        model: 'llama2',
      };

      expect(() => validateOllamaResponse(invalidResponse)).toThrow('No message in Ollama response');
    });

    it('should throw error for empty content', () => {
      vi.spyOn(errorHandler, 'handle');
      const invalidResponse = {
        message: {
          content: '',
          role: 'assistant',
        },
        done: true,
      };

      expect(() => validateOllamaResponse(invalidResponse)).toThrow('No content in response');
    });

    it('should throw error for whitespace-only content', () => {
      vi.spyOn(errorHandler, 'handle');
      const invalidResponse = {
        message: {
          content: '   ',
          role: 'assistant',
        },
      };

      expect(() => validateOllamaResponse(invalidResponse)).toThrow();
    });

    it('should handle Zod validation errors', () => {
      vi.spyOn(errorHandler, 'handle');
      const invalidResponse = 'not an object';

      expect(() => validateOllamaResponse(invalidResponse)).toThrow();
    });
  });
});
