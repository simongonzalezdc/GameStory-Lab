/**
 * AI Model Orchestrator
 * Intelligently routes tasks to optimal AI models based on:
 * - Task type (mechanics, lore, validation, etc.)
 * - Model capabilities (structured output, creativity, reasoning)
 * - Cost optimization (prefer Ollama when quality is sufficient)
 * - Availability (fallback chain)
 */

import type { TaskType, ModelPreference } from '@gameforge/shared';
import { OpenRouterClient } from './clients/openrouter.js';
import { GoogleClient } from './clients/google.js';
import { OllamaClient } from './clients/ollama.js';
import type { IAIClient, AICompletionRequest, AICompletionResponse } from './clients/base.js';
import { logger } from '../../utils/logger.js';

export interface OrchestratorConfig {
  openrouterApiKey?: string;
  googleApiKey?: string;
  ollamaBaseUrl?: string;
  costLimitPerHourUsd?: number;
}

interface ModelSelection {
  client: IAIClient;
  model: string;
  rationale: string;
}

export class AIOrchestrator {
  private clients: Map<string, IAIClient> = new Map();
  private costTracker: Map<number, number> = new Map(); // hourTimestamp -> costUsd
  private costLimit: number;

  constructor(config: OrchestratorConfig = {}) {
    this.costLimit = config.costLimitPerHourUsd || 5.0;

    // Initialize available clients
    try {
      if (config.openrouterApiKey || process.env.OPENROUTER_API_KEY) {
        this.clients.set('openrouter', new OpenRouterClient({ apiKey: config.openrouterApiKey }));
      }
    } catch (error) {
      logger.warn('OpenRouter client initialization failed', { error });
    }

    try {
      if (config.googleApiKey || process.env.GOOGLE_API_KEY) {
        this.clients.set('google', new GoogleClient({ apiKey: config.googleApiKey }));
      }
    } catch (error) {
      logger.warn('Google client initialization failed', { error });
    }

    try {
      this.clients.set('ollama', new OllamaClient({ baseUrl: config.ollamaBaseUrl }));
    } catch (error) {
      logger.warn('Ollama client initialization failed', { error });
    }
  }

  /**
   * Generate content using the optimal model for the task
   */
  async generate(
    taskType: TaskType,
    messages: AICompletionRequest['messages'],
    preference: ModelPreference = 'auto',
    options?: Partial<AICompletionRequest>
  ): Promise<AICompletionResponse> {
    // Check cost limits
    const currentHourCost = this.getCurrentHourCost();
    if (currentHourCost >= this.costLimit) {
      logger.warn('Cost limit reached, forcing Ollama', {
        currentCost: currentHourCost,
        limit: this.costLimit,
      });
      preference = 'ollama';
    }

    // Select the best model for this task
    const selection = await this.selectModel(taskType, preference);

    if (!selection) {
      throw new Error('No AI clients available. Please configure at least one AI provider.');
    }

    logger.debug('Model selected', { rationale: selection.rationale, model: selection.model });

    // Execute the completion
    const request: AICompletionRequest = {
      model: selection.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? 2000,
      topP: options?.topP ?? 0.9,
    };

    try {
      const response = await selection.client.complete(request);

      // Track cost
      if (response.metadata?.costUsd) {
        this.trackCost(response.metadata.costUsd);
      }

      return response;
    } catch (error) {
      logger.error('Generation failed, attempting fallback', {
        client: selection.client.name,
        error,
      });

      // Fallback to Ollama if available
      if (selection.client.type !== 'ollama' && this.clients.has('ollama')) {
        logger.info('Falling back to Ollama');
        const ollamaClient = this.clients.get('ollama')!;
        const fallbackRequest: AICompletionRequest = {
          ...request,
          model: 'llama3.3:70b',
        };
        return await ollamaClient.complete(fallbackRequest);
      }

      throw error;
    }
  }

  /**
   * Select the optimal model based on task type and preferences
   * Based on Nov 2025 benchmarks from technical spec
   */
  private async selectModel(
    taskType: TaskType,
    preference: ModelPreference
  ): Promise<ModelSelection | null> {
    // Handle explicit preferences
    if (preference === 'ollama') {
      const ollamaClient = this.clients.get('ollama');
      if (ollamaClient && (await ollamaClient.isAvailable())) {
        return {
          client: ollamaClient,
          model: 'llama3.3:70b',
          rationale: 'Ollama Llama 3.3 70B (user preference, local, free)',
        };
      }
    }

    if (preference === 'openrouter') {
      const openrouterClient = this.clients.get('openrouter');
      if (openrouterClient && (await openrouterClient.isAvailable())) {
        const model = this.getDefaultOpenRouterModel(taskType);
        return {
          client: openrouterClient,
          model,
          rationale: `OpenRouter ${model} (user preference)`,
        };
      }
    }

    // Auto selection based on task type (optimal model per task)
    if (preference === 'auto') {
      switch (taskType) {
        case 'mechanics': {
          // DeepSeek V3 - excellent structured output
          const openrouterClient = this.clients.get('openrouter');
          if (openrouterClient && (await openrouterClient.isAvailable())) {
            return {
              client: openrouterClient,
              model: 'deepseek/deepseek-chat',
              rationale: 'DeepSeek V3 for mechanics (40.5% LiveCodeBench, structured output)',
            };
          }
          break;
        }

        case 'lore': {
          // Qwen3-32B - 128K context, "thinking budget" for depth
          const openrouterClient = this.clients.get('openrouter');
          if (openrouterClient && (await openrouterClient.isAvailable())) {
            return {
              client: openrouterClient,
              model: 'qwen/qwen-2.5-72b-instruct',
              rationale: 'Qwen 2.5 72B for lore (128K context, creative depth)',
            };
          }
          break;
        }

        case 'consistency': {
          // Gemini 2.5 Flash - 1M context, fast reasoning
          const googleClient = this.clients.get('google');
          if (googleClient && (await googleClient.isAvailable())) {
            return {
              client: googleClient,
              model: 'gemini-2.0-flash-exp',
              rationale: 'Gemini 2.0 Flash for consistency (1M context, fast reasoning)',
            };
          }
          break;
        }

        case 'title': {
          // Use cheaper models for title generation
          const openrouterClient = this.clients.get('openrouter');
          if (openrouterClient && (await openrouterClient.isAvailable())) {
            return {
              client: openrouterClient,
              model: 'deepseek/deepseek-chat',
              rationale: 'DeepSeek Chat for titles (creative, low cost)',
            };
          }
          break;
        }

        case 'refinement': {
          // Ollama for unlimited iterations
          const ollamaClient = this.clients.get('ollama');
          if (ollamaClient && (await ollamaClient.isAvailable())) {
            return {
              client: ollamaClient,
              model: 'llama3.3:70b',
              rationale: 'Ollama Llama 3.3 70B for refinement (local, unlimited iterations)',
            };
          }
          break;
        }
      }
    }

    // Fallback chain: try clients in order of preference
    for (const [_name, client] of this.clients.entries()) {
      if (await client.isAvailable()) {
        const model = this.getDefaultModel(client);
        return {
          client,
          model,
          rationale: `${client.name} ${model} (fallback)`,
        };
      }
    }

    return null;
  }

  /**
   * Get default model name for a client
   */
  private getDefaultModel(client: IAIClient): string {
    switch (client.type) {
      case 'openrouter':
        return 'deepseek/deepseek-chat';
      case 'google':
        return 'gemini-2.0-flash-exp';
      case 'ollama':
        return 'llama3.3:70b';
      default:
        return 'llama3.3:70b';
    }
  }

  /**
   * Get default OpenRouter model for task type
   */
  private getDefaultOpenRouterModel(taskType: TaskType): string {
    switch (taskType) {
      case 'mechanics':
        return 'deepseek/deepseek-chat';
      case 'lore':
        return 'qwen/qwen-2.5-72b-instruct';
      case 'consistency':
        return 'google/gemini-2.0-flash-exp';
      case 'title':
      case 'refinement':
        return 'deepseek/deepseek-chat';
      default:
        return 'deepseek/deepseek-chat';
    }
  }

  /**
   * Track API costs to enforce spending limits
   */
  private trackCost(costUsd: number): void {
    const currentHour = Math.floor(Date.now() / (60 * 60 * 1000));
    const existingCost = this.costTracker.get(currentHour) || 0;
    this.costTracker.set(currentHour, existingCost + costUsd);

    // Clean up old hours (keep only current hour)
    for (const hour of this.costTracker.keys()) {
      if (hour < currentHour) {
        this.costTracker.delete(hour);
      }
    }
  }

  /**
   * Get total cost for current hour
   */
  private getCurrentHourCost(): number {
    const currentHour = Math.floor(Date.now() / (60 * 60 * 1000));
    return this.costTracker.get(currentHour) || 0;
  }

  /**
   * Get available clients status
   */
  async getStatus(): Promise<{
    clients: Array<{ name: string; type: string; available: boolean }>;
    currentHourCost: number;
    costLimit: number;
  }> {
    const clientStatus = await Promise.all(
      Array.from(this.clients.entries()).map(async ([_name, client]) => ({
        name: client.name,
        type: client.type,
        available: await client.isAvailable(),
      }))
    );

    return {
      clients: clientStatus,
      currentHourCost: this.getCurrentHourCost(),
      costLimit: this.costLimit,
    };
  }
}
