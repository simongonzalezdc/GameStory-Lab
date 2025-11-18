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
      // Qwen has a thinking mode that outputs reasoning - we want to disable it
      const isQwenModel = request.model.toLowerCase().includes('qwen');
      if (isQwenModel) {
        // Add explicit instruction to skip thinking/reasoning
        prompt = `You are a helpful assistant. Respond directly without showing your reasoning process or chain of thought. Output only the requested content.\n\n${prompt}`;
      }

      const response = await this.client.generate({
        model: request.model,
        prompt,
        options: {
          temperature: request.temperature ?? 0.7,
          num_predict: request.maxTokens ?? 2000,
          top_p: request.topP ?? 0.9,
          // Disable thinking mode for Qwen (if supported by Ollama)
          ...(isQwenModel && { 
            // Some Qwen models support thinking_mode parameter
            // We'll rely on prompt instructions if Ollama doesn't support this
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
