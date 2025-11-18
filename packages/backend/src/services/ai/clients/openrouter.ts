/**
 * OpenRouter AI Client
 * Multi-model gateway for cost-optimized generations
 * Supports DeepSeek V3, Qwen, GPT, Claude, and more
 */

import axios, { AxiosInstance } from 'axios';
import type {
  IAIClient,
  AIClientConfig,
  AICompletionRequest,
  AICompletionResponse,
  AIClientError,
} from './base.js';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterClient implements IAIClient {
  readonly name = 'OpenRouter';
  readonly type = 'openrouter' as const;

  private client: AxiosInstance;
  private apiKey: string;

  constructor(config: AIClientConfig = {}) {
    this.apiKey = config.apiKey || process.env.OPENROUTER_API_KEY || '';

    if (!this.apiKey) {
      throw new Error('OpenRouter API key is required');
    }

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://gameforge.studio',
        'X-Title': 'GameForge Studio',
      },
      timeout: config.timeout || 60000, // 60s timeout
    });
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const startTime = Date.now();

    try {
      const openrouterRequest: OpenRouterRequest = {
        model: request.model,
        messages: request.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2000,
        top_p: request.topP ?? 0.9,
      };

      const response = await this.client.post<OpenRouterResponse>(
        '/chat/completions',
        openrouterRequest
      );

      const data = response.data;
      const durationMs = Date.now() - startTime;

      // Extract content and tokens
      const content = data.choices[0]?.message?.content || '';
      const usage = data.usage;

      // Estimate cost based on model (OpenRouter provides this in response headers sometimes)
      // For now, use conservative estimates
      const costUsd = this.estimateCost(request.model, usage.prompt_tokens, usage.completion_tokens);

      return {
        content,
        model: data.model,
        tokensUsed: {
          prompt: usage.prompt_tokens,
          completion: usage.completion_tokens,
          total: usage.total_tokens,
        },
        finishReason: data.choices[0]?.finish_reason === 'stop' ? 'stop' : 'error',
        metadata: {
          provider: 'openrouter',
          costUsd,
          durationMs,
        },
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const aiError: AIClientError = {
          name: 'AIClientError',
          message: `OpenRouter generation failed: ${error.response?.data?.error?.message || error.message}`,
          provider: 'openrouter',
          statusCode: error.response?.status,
          originalError: error,
        };
        throw aiError;
      }
      throw {
        name: 'AIClientError',
        message: `OpenRouter generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        provider: 'openrouter',
        originalError: error,
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      // Test with a simple completion
      await this.complete({
        model: 'deepseek/deepseek-chat',
        messages: [{ role: 'user', content: 'test' }],
        maxTokens: 5,
      });
      return true;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await this.client.get('/models');
      return response.data.data.map((model: { id: string }) => model.id);
    } catch {
      return [];
    }
  }

  /**
   * Estimate cost based on model and token usage
   * Based on Nov 2025 pricing from OpenRouter
   */
  private estimateCost(model: string, promptTokens: number, completionTokens: number): number {
    // Model pricing (per 1M tokens)
    const pricing: Record<string, { prompt: number; completion: number }> = {
      'deepseek/deepseek-chat': { prompt: 0.14, completion: 0.28 },
      'deepseek/deepseek-reasoner': { prompt: 0.55, completion: 2.19 },
      'qwen/qwen-2.5-72b-instruct': { prompt: 0.35, completion: 0.40 },
      'qwen/qwq-32b-preview': { prompt: 0.18, completion: 0.18 },
      'google/gemini-2.0-flash-exp': { prompt: 0.075, completion: 0.30 },
      'openai/gpt-4o': { prompt: 2.50, completion: 10.00 },
      'anthropic/claude-3.5-sonnet': { prompt: 3.00, completion: 15.00 },
    };

    // Normalize model name (remove provider prefix if present)
    const normalizedModel = model.toLowerCase();
    const modelPricing = Object.entries(pricing).find(([key]) =>
      normalizedModel.includes(key.toLowerCase())
    )?.[1] || { prompt: 0.50, completion: 1.00 }; // Default pricing

    const cost =
      (promptTokens / 1_000_000) * modelPricing.prompt +
      (completionTokens / 1_000_000) * modelPricing.completion;

    return cost;
  }
}
