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
        // Try to get an available model
        // Default: Qwen 2.5 7B - best balance of quality/performance on Mac M4 16GB
        let fallbackModel = 'qwen2.5:7b';
        try {
          const availableModels = await ollamaClient.listModels?.() || [];
          if (availableModels.length > 0) {
            // Optimized for Mac M4 16GB: Prefer models that fit in memory with good performance
            // Priority order based on Dec 2024 benchmarks for structured output & creative writing:
            // 1. qwen2.5-coder:7b (best for creative narrative, 4.7GB)
            // 2. qwen2.5:7b (excellent structured output, 4.7GB)
            // 3. phi4:14b (highest quality but uses 9GB, may strain 16GB systems)
            // 4. qwen2.5:3b (fast, lightweight fallback, 1.9GB)
            const preferredModels = [
              'qwen2.5-coder:7b',  // Best for lore/narrative (creative writing optimized)
              'qwen2.5:7b',        // Best for mechanics (JSON/structured output)
              'phi4:14b',          // Highest quality but higher memory usage
              'qwen2.5:3b',        // Fast, lightweight
              'llama3.2:3b',       // Ultra-lightweight fallback
            ];
            const generalPurposeModel = availableModels.find(m =>
              preferredModels.some(pref => m.toLowerCase().includes(pref.toLowerCase())) &&
              !m.toLowerCase().includes('embed')
            );
            fallbackModel = generalPurposeModel || availableModels.find(m => m.toLowerCase().includes('qwen2.5')) || availableModels[0];
          }
        } catch {
          // If we can't list models, use default
        }
        const fallbackRequest: AICompletionRequest = {
          ...request,
          model: fallbackModel,
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
        // Try to get an available model, fallback to default if listModels fails
        // Default: Qwen 2.5 7B - excellent for Mac M4 16GB (4.7GB model size, ~6-8GB RAM usage)
        let model = 'qwen2.5:7b';
        try {
          const availableModels = await ollamaClient.listModels?.() || [];
          if (availableModels.length > 0) {
            // OPTIMIZED FOR MAC M4 16GB (Dec 2024):
            // Qwen 2.5 series offers best structured output + creative writing
            // Model selection strategy:
            // - Task-agnostic: Use qwen2.5:7b (balanced, 35-45 tok/s)
            // - Creative tasks: qwen2.5-coder:7b performs better for narrative
            // - Memory constrained: qwen2.5:3b (55-75 tok/s, only 1.9GB)
            // - Max quality: phi4:14b (25-35 tok/s, needs 11-13GB RAM)
            const preferredModels = [
              'qwen2.5-coder:7b',  // Best creative writing (lore, titles)
              'qwen2.5:7b',        // Best structured output (mechanics, JSON)
              'phi4:14b',          // Highest quality (if RAM allows)
              'qwen2.5:3b',        // Lightweight, fast
              'llama3.2:3b',       // Ultra-lightweight
            ];
            const generalPurposeModel = availableModels.find(m =>
              preferredModels.some(pref => m.toLowerCase().includes(pref.toLowerCase())) &&
              !m.toLowerCase().includes('embed')
            );
            model = generalPurposeModel || availableModels.find(m => m.toLowerCase().includes('qwen2.5')) || availableModels[0];
          }
        } catch {
          // If we can't list models, use default
        }
        return {
          client: ollamaClient,
          model,
          rationale: `Ollama ${model} (user preference, local, free, optimized for Mac M4 16GB)`,
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
          // Fallback to Ollama if OpenRouter not available
          const ollamaClient = this.clients.get('ollama');
          if (ollamaClient && (await ollamaClient.isAvailable())) {
            // For mechanics: Prefer models with strong structured JSON output
            let model = 'qwen2.5:7b';
            try {
              const availableModels = await ollamaClient.listModels?.() || [];
              if (availableModels.length > 0) {
                // Mechanics generation needs structured output - Qwen 2.5 series excels at this
                const preferredModels = [
                  'qwen2.5:7b',       // Best JSON/structured output
                  'phi4:14b',         // High quality reasoning
                  'qwen2.5:3b',       // Fast, lightweight
                ];
                const mechanicsModel = availableModels.find(m =>
                  preferredModels.some(pref => m.toLowerCase().includes(pref.toLowerCase())) &&
                  !m.toLowerCase().includes('embed') &&
                  !m.toLowerCase().includes('coder')  // Avoid coder variants for pure JSON tasks
                );
                model = mechanicsModel || availableModels.find(m => m.toLowerCase().includes('qwen2.5')) || availableModels[0];
              }
            } catch {
              // If we can't list models, use default
            }
            return {
              client: ollamaClient,
              model,
              rationale: `Ollama ${model} for mechanics (excellent structured output, Mac M4 16GB optimized)`,
            };
          }
          break;
        }

        case 'lore': {
          // Qwen 2.5 72B via OpenRouter - 128K context for deep creative narratives
          const openrouterClient = this.clients.get('openrouter');
          if (openrouterClient && (await openrouterClient.isAvailable())) {
            return {
              client: openrouterClient,
              model: 'qwen/qwen-2.5-72b-instruct',
              rationale: 'Qwen 2.5 72B for lore (128K context, creative depth)',
            };
          }
          // Fallback to Ollama if OpenRouter not available
          const ollamaClient = this.clients.get('ollama');
          if (ollamaClient && (await ollamaClient.isAvailable())) {
            // For lore: Prefer creative writing models (coder variants excel at narrative)
            let model = 'qwen2.5-coder:7b';
            try {
              const availableModels = await ollamaClient.listModels?.() || [];
              if (availableModels.length > 0) {
                // Lore needs creative, narrative-focused models
                // Qwen 2.5 Coder variants perform better at creative writing than base models
                const preferredModels = [
                  'qwen2.5-coder:7b',  // Best creative writing
                  'phi4:14b',          // High quality narrative
                  'qwen2.5:7b',        // Solid general purpose
                  'qwen2.5:3b',        // Lightweight
                ];
                const loreModel = availableModels.find(m =>
                  preferredModels.some(pref => m.toLowerCase().includes(pref.toLowerCase())) &&
                  !m.toLowerCase().includes('embed')
                );
                model = loreModel || availableModels.find(m => m.toLowerCase().includes('qwen2.5')) || availableModels[0];
              }
            } catch {
              // If we can't list models, use default
            }
            return {
              client: ollamaClient,
              model,
              rationale: `Ollama ${model} for lore (creative narrative optimized, Mac M4 16GB)`,
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
          // Ollama for unlimited iterations - refinement benefits from best available model
          const ollamaClient = this.clients.get('ollama');
          if (ollamaClient && (await ollamaClient.isAvailable())) {
            // For refinement: Use highest quality model available (needs both creative + analytical skills)
            let model = 'qwen2.5-coder:7b';
            try {
              const availableModels = await ollamaClient.listModels?.() || [];
              if (availableModels.length > 0) {
                // Refinement needs balanced creative + analytical capabilities
                const preferredModels = [
                  'phi4:14b',          // Highest quality (if memory allows)
                  'qwen2.5-coder:7b',  // Excellent all-rounder
                  'qwen2.5:7b',        // Strong analytical
                  'qwen2.5:3b',        // Fast iterations
                ];
                const refinementModel = availableModels.find(m =>
                  preferredModels.some(pref => m.toLowerCase().includes(pref.toLowerCase())) &&
                  !m.toLowerCase().includes('embed')
                );
                model = refinementModel || availableModels.find(m => m.toLowerCase().includes('qwen2.5')) || availableModels[0];
              }
            } catch {
              // If we can't list models, use default
            }
            return {
              client: ollamaClient,
              model,
              rationale: `Ollama ${model} for refinement (local, unlimited iterations, Mac M4 16GB optimized)`,
            };
          }
          break;
        }
      }
    }

    // Fallback chain: try clients in order of preference
    for (const [_name, client] of this.clients.entries()) {
      if (await client.isAvailable()) {
        let model = this.getDefaultModel(client);
        // For Ollama, try to get an available model optimized for Mac M4 16GB
        if (client.type === 'ollama' && client.listModels) {
          try {
            const availableModels = await client.listModels();
            if (availableModels.length > 0) {
              // Prefer Qwen 2.5 series (best for Mac M4 16GB)
              const preferredModels = [
                'qwen2.5-coder:7b',  // Best creative + analytical
                'qwen2.5:7b',        // Best structured output
                'phi4:14b',          // Highest quality (if RAM allows)
                'qwen2.5:3b',        // Lightweight, fast
                'llama3.2:3b',       // Ultra-lightweight
              ];
              const generalPurposeModel = availableModels.find(m =>
                preferredModels.some(pref => m.toLowerCase().includes(pref.toLowerCase())) &&
                !m.toLowerCase().includes('embed')
              );
              model = generalPurposeModel || availableModels.find(m => m.toLowerCase().includes('qwen2.5')) || availableModels[0];
            }
          } catch {
            // If we can't list models, use default
          }
        }
        return {
          client,
          model,
          rationale: `${client.name} ${model} (fallback, Mac M4 16GB optimized)`,
        };
      }
    }

    return null;
  }

  /**
   * Get default model name for a client
   * Optimized for Mac M4 16GB when using Ollama
   */
  private getDefaultModel(client: IAIClient): string {
    switch (client.type) {
      case 'openrouter':
        return 'deepseek/deepseek-chat';
      case 'google':
        return 'gemini-2.0-flash-exp';
      case 'ollama':
        // Qwen 2.5 7B: Best balance for Mac M4 16GB (4.7GB model, ~6-8GB RAM usage, 35-45 tok/s)
        return 'qwen2.5:7b';
      default:
        return 'qwen2.5:7b';
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
