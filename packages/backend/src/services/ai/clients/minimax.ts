/**
 * Minimax M2 Client
 * Uses Anthropic-compatible API format
 * Endpoint: https://api.minimax.io/anthropic (international)
 * Model: MiniMax-M2 or MiniMax-M2-Stable
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
import { extractJSON, reformatResponse } from '../utils/json-validation.js';

// Anthropic-compatible message format
interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: Array<{
    type: 'text' | 'thinking' | 'tool_use' | 'tool_result';
    text?: string;
    thinking?: string;
    [key: string]: unknown;
  }>;
}

// Anthropic-compatible request format
interface AnthropicRequest {
  model: string;
  messages: AnthropicMessage[];
  system?: string;
  max_tokens: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  response_format?: {
    type: 'json_object' | 'text';
  } | {
    type: 'json_schema';
    json_schema: {
      name: string;
      description?: string;
      schema: Record<string, unknown>;
    };
  };
}

// Anthropic-compatible response format
interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text' | 'thinking';
    text?: string;
    thinking?: string;
  }>;
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class MinimaxClient implements IAIClient {
  readonly name = 'Minimax M2';
  readonly type = 'minimax' as const;

  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;

  constructor(config: AIClientConfig = {}) {
    this.apiKey = config.apiKey || process.env.MINIMAX_API_KEY || '';
    // Anthropic-compatible endpoint (international)
    // For China users: https://api.minimaxi.com/anthropic
    this.baseUrl = config.baseUrl || process.env.MINIMAX_API_BASE_URL || 'https://api.minimax.io/anthropic';

    if (!this.apiKey) {
      throw new Error('Minimax API key is required');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'x-api-key': this.apiKey, // Anthropic-compatible format
        'anthropic-version': '2023-06-01', // Anthropic API version
        'Content-Type': 'application/json',
      },
      timeout: config.timeout || 300000, // 5 minutes timeout for long generations
    });
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const startTime = Date.now();

    try {
      // Use MiniMax-M2 as model name (Anthropic-compatible format)
      const modelName = request.model || 'MiniMax-M2';
      
      // Separate system messages from conversation messages
      const systemMessages = request.messages.filter((m) => m.role === 'system');
      const conversationMessages = request.messages.filter((m) => m.role !== 'system');
      
      // Combine system messages into a single system prompt
      const systemPrompt = systemMessages.map((m) => m.content).join('\n\n');
      
      // Convert messages to Anthropic format (content as array)
      const anthropicMessages: AnthropicMessage[] = conversationMessages.map((msg) => ({
        role: msg.role === 'system' ? 'user' : msg.role, // Anthropic doesn't have 'system' in messages array
        content: [
          {
            type: 'text' as const,
            text: msg.content,
          },
        ],
      }));

      const anthropicRequest: AnthropicRequest = {
        model: modelName,
        messages: anthropicMessages,
        ...(systemPrompt ? { system: systemPrompt } : {}),
        max_tokens: request.maxTokens ?? 2000,
        temperature: request.temperature ?? 1.0, // Anthropic recommends 1.0, range (0.0, 1.0]
        top_p: request.topP ?? 0.9,
        stream: false,
        // Add response_format if specified (for structured JSON output)
        ...(request.responseFormat ? { response_format: request.responseFormat } : {}),
      };

      logger.debug('Minimax API (Anthropic-compatible) request details', {
        url: `${this.baseUrl}/v1/messages`,
        headerNames: ['x-api-key', 'anthropic-version', 'Content-Type'],
        requestPayload: JSON.stringify(anthropicRequest, null, 2),
        baseUrl: this.baseUrl,
        model: modelName,
      });

      // Anthropic-compatible API uses /v1/messages endpoint
      const response = await this.client.post<AnthropicResponse>(
        '/v1/messages',
        anthropicRequest
      );

      logger.debug('Minimax API response received', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        dataKeys: Object.keys(response.data || {}),
        hasContent: !!(response.data?.content?.length),
        contentLength: response.data?.content?.length || 0,
        hasUsage: !!(response.data?.usage),
        model: response.data?.model,
      });

      const data = response.data;
      const durationMs = Date.now() - startTime;

      // Extract text content from Anthropic response format
      // Response has content array with blocks: [{type: "thinking", thinking: "..."}, {type: "text", text: "..."}]
      // Elegantly separate thinking blocks from text content
      let content = '';
      let thinkingContent = '';
      
      for (const block of data.content || []) {
        if (block.type === 'text' && block.text) {
          content += block.text;
        } else if (block.type === 'thinking' && block.thinking) {
          // Collect thinking content separately (for debugging/metadata)
          thinkingContent += block.thinking;
        }
      }
      
      const usage = data.usage || { input_tokens: 0, output_tokens: 0 };
      
      // Log thinking content at debug level if present
      if (thinkingContent) {
        logger.debug('Minimax M2 thinking/reasoning content', {
          thinkingLength: thinkingContent.length,
          model: modelName,
          thinkingPreview: thinkingContent.substring(0, 200) + (thinkingContent.length > 200 ? '...' : ''),
        });
      }
      
      if (!content) {
        logger.warn('Minimax API returned empty text content', {
          responseData: JSON.stringify(data).substring(0, 1000),
          contentBlocks: data.content?.length || 0,
          hasThinking: !!thinkingContent,
          thinkingLength: thinkingContent.length,
          model: modelName,
        });
        throw new Error('Minimax API returned empty text content');
      }

      // Apply JSON validation and reformatting guardrails if response_format was requested
      if (request.responseFormat && (request.responseFormat.type === 'json_object' || request.responseFormat.type === 'json_schema')) {
        const jsonResult = extractJSON(content);
        if (jsonResult.isValid && jsonResult.reformatted) {
          // Use reformatted JSON for better consistency
          content = jsonResult.reformatted;
          logger.debug('Minimax response validated and reformatted as JSON', {
            originalLength: content.length,
            reformattedLength: jsonResult.reformatted.length,
          });
        } else {
          // Try to reformat even if extraction failed
          const reformatted = reformatResponse(content);
          if (reformatted) {
            content = reformatted;
            logger.warn('Minimax response required JSON reformatting', {
              error: jsonResult.error,
            });
          } else {
            logger.error('Minimax response failed JSON validation', {
              error: jsonResult.error,
              contentPreview: content.substring(0, 500),
            });
            // Don't throw - let the caller handle malformed JSON
          }
        }
      }

      logger.info(`Minimax API request successful with model: ${modelName}`, {
        durationMs,
        tokensUsed: usage.input_tokens + usage.output_tokens,
        contentLength: content.length,
        hasThinking: !!thinkingContent,
        thinkingLength: thinkingContent.length,
      });

      // Estimate cost (Minimax M2 pricing)
      // Minimax pricing is typically competitive, estimated at ~$0.20-0.30 per 1M input tokens
      const costUsd = this.estimateCost(usage.input_tokens, usage.output_tokens);

      // Map Anthropic stop_reason to our finishReason format
      let finishReason: 'stop' | 'length' | 'error' = 'stop';
      if (data.stop_reason === 'max_tokens') {
        finishReason = 'length';
      } else if (data.stop_reason === null) {
        finishReason = 'error';
      }

      return {
        content, // Only text content, thinking blocks excluded
        model: data.model,
        tokensUsed: {
          prompt: usage.input_tokens,
          completion: usage.output_tokens,
          total: usage.input_tokens + usage.output_tokens,
        },
        finishReason,
        metadata: {
          provider: 'minimax',
          costUsd,
          durationMs,
          // Store thinking content in metadata for debugging (optional)
          ...(thinkingContent ? { thinking: thinkingContent } : {}),
        },
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        const errorMessage = errorData?.error?.message || 
                           errorData?.message || 
                           error.message || 
                           'Unknown Minimax API error';
        const statusCode = error.response?.status;
        
        logger.error('Minimax API request failed', {
          statusCode,
          errorMessage,
          errorData: errorData ? JSON.stringify(errorData).substring(0, 1000) : undefined,
          url: error.config?.url,
          method: error.config?.method,
          requestData: error.config?.data ? JSON.stringify(error.config.data).substring(0, 500) : undefined,
          requestHeaderNames: error.config?.headers ? Object.keys(error.config.headers) : undefined,
          baseUrl: this.baseUrl,
        });
        
        const aiError: AIClientError = {
          name: 'AIClientError',
          message: `Minimax generation failed: ${errorMessage}`,
          provider: 'minimax',
          statusCode,
          originalError: error,
        };
        throw aiError;
      }
      
      logger.error('Minimax generation failed with non-Axios error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      throw {
        name: 'AIClientError',
        message: `Minimax generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        provider: 'minimax',
        originalError: error,
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  async listModels(): Promise<string[]> {
    // Minimax M2 models (Anthropic-compatible format)
    return ['MiniMax-M2', 'MiniMax-M2-Stable'];
  }

  /**
   * Estimate cost based on token usage
   * Minimax M2 pricing estimates
   */
  private estimateCost(inputTokens: number, outputTokens: number): number {
    // Minimax M2 pricing estimates (competitive pricing)
    const costPer1MInput = 0.25; // $0.25 per 1M input tokens (estimated)
    const costPer1MOutput = 1.50; // $1.50 per 1M output tokens (estimated)

    const cost =
      (inputTokens / 1_000_000) * costPer1MInput +
      (outputTokens / 1_000_000) * costPer1MOutput;

    return cost;
  }
}
