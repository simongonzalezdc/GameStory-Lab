/**
 * Ollama AI Client
 * Local AI model provider - free, unlimited usage
 */

import { Ollama } from 'ollama';
import type {
  IAIClient,
  AIClientConfig,
  AICompletionRequest,
  AICompletionResponse,
} from './base.js';

export class OllamaClient implements IAIClient {
  readonly name = 'Ollama';
  readonly type = 'ollama' as const;

  private client: Ollama;
  private baseUrl: string;

  constructor(config: AIClientConfig = {}) {
    this.baseUrl = config.baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.client = new Ollama({
      host: this.baseUrl,
    });
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const startTime = Date.now();

    try {
      // Convert messages to Ollama format
      let prompt = this.formatMessages(request.messages);

      // For Qwen models, disable chain-of-thought/thinking mode
      // Qwen 3 (released April 2025) has thinking mode that outputs reasoning tags
      // Qwen 3 series: 600M, 1.5B, 3B, 7B, 14B, 32B + MoE variants (30B-A3B)
      // Also handle DeepSeek R1 which has explicit reasoning mode
      const isQwenModel = request.model.toLowerCase().includes('qwen');
      const isDeepSeekR1 = request.model.toLowerCase().includes('deepseek-r1');

      if (isQwenModel || isDeepSeekR1) {
        // Add explicit instruction to skip thinking/reasoning and output clean JSON
        // DeepSeek R1 shows thinking process by default - we want final answer only
        prompt = `You are a helpful assistant. CRITICAL: Respond directly with ONLY the requested JSON content. Do NOT show your reasoning process, chain of thought, <think> tags, thinking steps, or any explanatory text. Output must start with { and end with }. No markdown code fences.\n\n${prompt}`;
      }

      const response = await this.client.generate({
        model: request.model,
        prompt,
        options: {
          temperature: request.temperature ?? 0.7,
          num_predict: request.maxTokens ?? 2000,
          top_p: request.topP ?? 0.9,
          // Additional options for better JSON output
          ...((isQwenModel || isDeepSeekR1) && {
            // Qwen 3 and DeepSeek R1 benefit from lower temperature for structured output
            temperature: request.temperature ?? 0.6,
          }),
        },
        stream: false,
      });

      const durationMs = Date.now() - startTime;

      return {
        content: response.response,
        model: request.model,
        tokensUsed: {
          prompt: response.prompt_eval_count || 0,
          completion: response.eval_count || 0,
          total: (response.prompt_eval_count || 0) + (response.eval_count || 0),
        },
        finishReason: 'stop',
        metadata: {
          provider: 'ollama',
          durationMs,
          costUsd: 0, // Ollama is free (local)
        },
      };
    } catch (error) {
      throw {
        name: 'AIClientError',
        message: `Ollama generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        provider: 'ollama',
        originalError: error,
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.list();
      return true;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await this.client.list();
      return response.models.map((model) => model.name);
    } catch {
      return [];
    }
  }

  /**
   * Format messages array into a single prompt string for Ollama
   */
  private formatMessages(messages: AICompletionRequest['messages']): string {
    return messages
      .map((msg) => {
        if (msg.role === 'system') {
          return `System: ${msg.content}\n`;
        } else if (msg.role === 'user') {
          return `User: ${msg.content}\n`;
        } else {
          return `Assistant: ${msg.content}\n`;
        }
      })
      .join('\n');
  }

  /**
   * Pull a model from Ollama registry
   */
  async pullModel(modelName: string): Promise<void> {
    try {
      await this.client.pull({ model: modelName });
    } catch (error) {
      throw {
        name: 'AIClientError',
        message: `Failed to pull model ${modelName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        provider: 'ollama',
        originalError: error,
      };
    }
  }
}
