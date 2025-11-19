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
import { logger } from '../../../utils/logger.js';

export class OllamaClient implements IAIClient {
  readonly name = 'Ollama';
  readonly type = 'ollama' as const;

  private client: Ollama;
  private baseUrl: string;

  constructor(config: AIClientConfig = {}) {
    // Try multiple possible Ollama URLs - sometimes localhost vs 127.0.0.1 matters
    this.baseUrl = config.baseUrl || process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
    this.client = new Ollama({
      host: this.baseUrl.replace('http://', '').replace('https://', ''), // Ollama client expects just host:port
    });
    logger.debug('Ollama client initialized', { baseUrl: this.baseUrl });
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

      // Try to generate - even if API says model doesn't exist, it might work
      // This handles the case where Ollama API list() is broken but models work
      let response;
      try {
        // Add timeout wrapper (5 minutes max for generation)
        const timeoutMs = 300000; // 5 minutes
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Ollama generation timeout after 5 minutes')), timeoutMs);
        });

        const generatePromise = this.client.generate({
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

        response = await Promise.race([generatePromise, timeoutPromise]) as any;
      } catch (generateError: any) {
        // If generation fails with "model not found", try loading it first via CLI
        const errorMsg = generateError?.error?.error || generateError?.message || String(generateError);
        if (errorMsg.includes('not found') || errorMsg.includes('404')) {
          logger.warn(`Model ${request.model} not found via API, attempting to load via CLI...`);
          
          // Try to load the model via CLI (forces Ollama to recognize it)
          try {
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);
            
            // Run the model via CLI to force load
            await execAsync(`timeout 30 ollama run ${request.model} "test" || ollama run ${request.model} "test"`, {
              timeout: 35000,
            });
            
            // Wait a moment for API to update
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Try again
            logger.info(`Retrying generation with ${request.model} after CLI load...`);
            response = await this.client.generate({
              model: request.model,
              prompt,
              options: {
                temperature: request.temperature ?? 0.7,
                num_predict: request.maxTokens ?? 2000,
                top_p: request.topP ?? 0.9,
                ...((isQwenModel || isDeepSeekR1) && {
                  temperature: request.temperature ?? 0.6,
                }),
              },
              stream: false,
            });
          } catch (loadError) {
            // If loading fails, throw original error
            throw generateError;
          }
        } else {
          throw generateError;
        }
      }

      const durationMs = Date.now() - startTime;

      // Log response details for debugging
      logger.debug('Ollama generation completed', {
        model: request.model,
        hasResponse: !!response.response,
        responseLength: response.response?.length || 0,
        responsePreview: response.response?.substring(0, 200) || 'EMPTY',
        hasThinking: !!response.thinking,
        thinkingLength: response.thinking?.length || 0,
        durationMs,
        tokensUsed: (response.prompt_eval_count || 0) + (response.eval_count || 0),
      });

      // Handle Qwen3 models that output to thinking field instead of response
      // Qwen3 models have thinking mode that separates reasoning from final answer
      let content = response.response;
      
      if (!content || content.trim().length === 0) {
        if (response.thinking && response.thinking.trim().length > 0) {
          // Qwen3 sometimes puts the actual answer in thinking field
          // Try to extract JSON from thinking field
          logger.warn('Ollama response is empty, attempting to extract from thinking field', {
            model: request.model,
            thinkingLength: response.thinking.length,
          });
          
          // Look for JSON in the thinking field (usually at the end)
          const thinkingText = response.thinking;
          const jsonMatch = thinkingText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            content = jsonMatch[0];
            logger.info('Extracted JSON from thinking field', {
              extractedLength: content.length,
            });
          } else {
            // If no JSON found, use the last part of thinking (might be the answer)
            // Split by common delimiters and take the last meaningful part
            const parts = thinkingText.split(/\n\n|\.\s+/);
            const lastPart = parts[parts.length - 1] || thinkingText;
            if (lastPart.trim().startsWith('{')) {
              content = lastPart.trim();
            } else {
              // Fallback: use entire thinking as content (might contain the answer)
              content = thinkingText;
            }
          }
        }
      }

      // Final check if content is still empty
      if (!content || content.trim().length === 0) {
        logger.error('Ollama returned empty response', {
          model: request.model,
          responseKeys: Object.keys(response),
          hasThinking: !!response.thinking,
          thinkingPreview: response.thinking?.substring(0, 200),
        });
        throw new Error('Ollama returned empty response - model may have failed silently');
      }

      return {
        content: content,
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
      // Handle both old and new Ollama API formats
      if (response.models && Array.isArray(response.models)) {
        return response.models.map((model: any) => model.name || model);
      }
      // If response is an array directly (older API format)
      if (Array.isArray(response)) {
        return response.map((model: any) => model.name || model);
      }
      return [];
    } catch (error) {
      logger.warn('Failed to list Ollama models', { error });
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
