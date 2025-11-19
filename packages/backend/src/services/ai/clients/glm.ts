/**
 * GLM (Zhipu AI) Client
 * Direct API access for GLM 4.6 (International Coding Plan)
 * Uses OpenAI-compatible API format
 */

import axios, { AxiosInstance } from 'axios';
import type {
  IAIClient,
  AIClientConfig,
  AICompletionRequest,
  AICompletionResponse,
  AIClientError,
} from './base.js';
import { logger } from '../../../utils/logger.js';

interface GLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GLMRequest {
  model: string;
  messages: GLMMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

interface GLMResponse {
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

export class GLMClient implements IAIClient {
  readonly name = 'GLM (Zhipu AI)';
  readonly type = 'glm' as const;

  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;

  constructor(config: AIClientConfig = {}) {
    this.apiKey = config.apiKey || process.env.GLM_API_KEY || '';
    this.baseUrl = config.baseUrl || process.env.GLM_API_BASE_URL || 'https://api.z.ai/api/paas/v4';

    if (!this.apiKey) {
      throw new Error('GLM API key is required');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: config.timeout || 300000, // 5 minutes timeout for long generations
    });
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const startTime = Date.now();

    try {
      // Use glm-4-6 as the model name (user confirmed this is correct)
      const modelName = request.model || 'glm-4-6';
      const glmRequest: GLMRequest = {
        model: modelName,
        messages: request.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2000,
        top_p: request.topP ?? 0.9,
        stream: false,
      };

      logger.debug('GLM API request', {
        model: modelName,
        messageCount: glmRequest.messages.length,
        maxTokens: glmRequest.max_tokens,
        baseUrl: this.baseUrl,
        endpoint: '/chat/completions'
      });

      const response = await this.client.post<GLMResponse>(
        '/chat/completions',
        glmRequest
      );

      const data = response.data;
      const durationMs = Date.now() - startTime;

      // Extract content and tokens
      const content = data.choices?.[0]?.message?.content || '';
      const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      
      if (!content) {
        logger.warn('GLM API returned empty content', {
          responseData: JSON.stringify(data).substring(0, 500),
          choicesLength: data.choices?.length || 0,
          model: modelName
        });
        throw new Error('GLM API returned empty content');
      }

      logger.info(`GLM API request successful with model: ${modelName}`, {
        durationMs,
        tokensUsed: usage.total_tokens
      });

      // Estimate cost (GLM 4.6 pricing - adjust based on actual pricing)
      // Using conservative estimates until we have exact pricing
      const costUsd = this.estimateCost(usage.prompt_tokens, usage.completion_tokens);

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
          provider: 'glm',
          costUsd,
          durationMs,
        },
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        const errorMessage = errorData?.error?.message || 
                           errorData?.message || 
                           error.message || 
                           'Unknown GLM API error';
        const statusCode = error.response?.status;
        
        logger.error('GLM API request failed', {
          statusCode,
          errorMessage,
          errorData: errorData ? JSON.stringify(errorData).substring(0, 500) : undefined,
          url: error.config?.url,
          method: error.config?.method
        });
        
        const aiError: AIClientError = {
          name: 'AIClientError',
          message: `GLM generation failed: ${errorMessage}`,
          provider: 'glm',
          statusCode,
          originalError: error,
        };
        throw aiError;
      }
      
      logger.error('GLM generation failed with non-Axios error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      throw {
        name: 'AIClientError',
        message: `GLM generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        provider: 'glm',
        originalError: error,
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    // If API key is set, consider it available
    // The actual API call will handle errors if the key is invalid
    return !!this.apiKey && this.apiKey.length > 0;
  }

  async listModels(): Promise<string[]> {
    // GLM 4.6 is the primary model for international coding plan
    return ['glm-4-6', 'glm-4', 'glm-3-turbo'];
  }

  /**
   * Estimate cost based on token usage
   * Adjust pricing based on actual GLM 4.6 international coding plan pricing
   */
  private estimateCost(promptTokens: number, completionTokens: number): number {
    // GLM 4.6 pricing estimates (adjust based on actual pricing from Zhipu AI)
    // Using conservative estimates - update with actual pricing when available
    const costPer1MPrompt = 0.10; // $0.10 per 1M prompt tokens (estimate)
    const costPer1MCompletion = 0.10; // $0.10 per 1M completion tokens (estimate)

    const cost =
      (promptTokens / 1_000_000) * costPer1MPrompt +
      (completionTokens / 1_000_000) * costPer1MCompletion;

    return cost;
  }
}

