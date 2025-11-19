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
      reasoning_content?: string; // GLM-4.6 may return reasoning_content
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
    this.baseUrl = config.baseUrl || process.env.GLM_API_BASE_URL || 'https://api.z.ai/api/coding/paas/v4';

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
      // Use glm-4.6 as model name (correct format for Zhipu AI API)
      const modelName = request.model || 'glm-4.6';
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

      // Enhanced debugging for international API
      logger.debug('GLM API request details', {
        url: `${this.baseUrl}/chat/completions`,
        headers: {
          'Authorization': `Bearer ${this.apiKey.substring(0, 10)}...`,
          'Content-Type': 'application/json',
        },
        requestPayload: JSON.stringify(glmRequest, null, 2),
        apiKeyLength: this.apiKey.length,
        apiKeyFormat: this.apiKey.includes('.') ? 'contains.dots' : 'simple',
        baseUrl: this.baseUrl,
        model: modelName,
      });

      const response = await this.client.post<GLMResponse>(
        '/chat/completions',
        glmRequest
      );

      // Log successful response details
      logger.debug('GLM API response received', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        dataKeys: Object.keys(response.data || {}),
        hasChoices: !!(response.data?.choices?.length),
        choicesLength: response.data?.choices?.length || 0,
        hasUsage: !!(response.data?.usage),
        model: response.data?.model,
      });

      const data = response.data;
      const durationMs = Date.now() - startTime;

      // Extract content and tokens - handle both content and reasoning_content
      const choice = data.choices?.[0];
      const message = choice?.message;
      
      // Try content first, then reasoning_content if content is empty
      let content = message?.content || '';
      if (!content && message?.reasoning_content) {
        content = message.reasoning_content;
      }
      
      const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      
      if (!content) {
        logger.warn('GLM API returned empty content', {
          responseData: JSON.stringify(data).substring(0, 1000),
          choicesLength: data.choices?.length || 0,
          model: modelName,
          hasContent: !!(message?.content),
          hasReasoningContent: !!(message?.reasoning_content),
        });
        throw new Error('GLM API returned empty content');
      }

      logger.info(`GLM API request successful with model: ${modelName}`, {
        durationMs,
        tokensUsed: usage.total_tokens,
        contentLength: content.length,
        contentType: message?.content ? 'content' : 'reasoning_content'
      });

      // Estimate cost (GLM 4.6 pricing - based on actual pricing from Zhipu AI)
      // GLM-4.5 is priced at 1/10th of Claude (~$0.30-0.50 per 1M tokens)
      // GLM-4.6 being the latest version should be slightly more expensive
      const costUsd = this.estimateCost(usage.prompt_tokens, usage.completion_tokens);

      return {
        content,
        model: data.model,
        tokensUsed: {
          prompt: usage.prompt_tokens,
          completion: usage.completion_tokens,
          total: usage.total_tokens,
        },
        finishReason: choice?.finish_reason === 'stop' ? 'stop' : 
                     choice?.finish_reason === 'length' ? 'length' : 'error',
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
        
        // Enhanced error logging for debugging
        logger.error('GLM API request failed', {
          statusCode,
          errorMessage,
          errorData: errorData ? JSON.stringify(errorData).substring(0, 1000) : undefined,
          url: error.config?.url,
          method: error.config?.method,
          requestData: error.config?.data ? JSON.stringify(error.config.data).substring(0, 500) : undefined,
          requestHeaders: error.config?.headers,
          apiKeyLength: this.apiKey.length,
          apiKeyFormat: this.apiKey.includes('.') ? 'contains.dots' : 'simple',
          baseUrl: this.baseUrl,
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
    // The actual API call will handle errors if key is invalid
    return !!this.apiKey && this.apiKey.length > 0;
  }

  async listModels(): Promise<string[]> {
    // GLM 4.6 is primary model for international coding plan
    return ['glm-4.6', 'glm-3-turbo'];
  }

  /**
   * Estimate cost based on token usage
   * Updated pricing based on actual GLM 4.6 international coding plan pricing
   * GLM-4.5 is ~1/10th of Claude pricing (~$0.30-0.50 per 1M tokens)
   * GLM-4.6 being the latest version is estimated at slightly higher pricing
   */
  private estimateCost(promptTokens: number, completionTokens: number): number {
    // GLM 4.6 pricing estimates (based on GLM-4.5 pricing of 1/10th Claude)
    // Claude 3.5 Sonnet: ~$3.00 per 1M input tokens, ~$15.00 per 1M output tokens
    // GLM-4.5: ~$0.30 per 1M input tokens, ~$1.50 per 1M output tokens
    // GLM-4.6: Estimated at ~$0.40 per 1M input tokens, ~$2.00 per 1M output tokens
    const costPer1MPrompt = 0.40; // $0.40 per 1M prompt tokens (estimated)
    const costPer1MCompletion = 2.00; // $2.00 per 1M completion tokens (estimated)

    const cost =
      (promptTokens / 1_000_000) * costPer1MPrompt +
      (completionTokens / 1_000_000) * costPer1MCompletion;

    return cost;
  }
}
