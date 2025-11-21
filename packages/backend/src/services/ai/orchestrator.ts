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
import { GLMClient } from './clients/glm.js';
import { MinimaxClient } from './clients/minimax.js';
import type { IAIClient, AICompletionRequest, AICompletionResponse } from './clients/base.js';
import { logger } from '../../utils/logger.js';

export interface OrchestratorConfig {
  openrouterApiKey?: string;
  googleApiKey?: string;
  glmApiKey?: string;
  minimaxApiKey?: string;
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

    // Initialize Minimax client first (primary provider, Anthropic-compatible API)
    try {
      const minimaxApiKey = config.minimaxApiKey || process.env.MINIMAX_API_KEY;
      logger.debug('Checking Minimax API key', {
        hasConfigKey: !!config.minimaxApiKey,
        hasEnvKey: !!process.env.MINIMAX_API_KEY,
        envKeyLength: process.env.MINIMAX_API_KEY?.length || 0,
        finalKey: minimaxApiKey ? minimaxApiKey.substring(0, 15) + '...' : 'NOT SET'
      });
      if (minimaxApiKey) {
        this.clients.set('minimax', new MinimaxClient({ apiKey: minimaxApiKey }));
        logger.info('Minimax M2 client initialized (primary AI provider, Anthropic-compatible API)');
      } else {
        logger.debug('Minimax API key not found, skipping Minimax client initialization');
      }
    } catch (error) {
      logger.warn('Minimax client initialization failed', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }

    // Initialize GLM client as fallback (if Minimax not available)
    try {
      const glmApiKey = config.glmApiKey || process.env.GLM_API_KEY;
      if (glmApiKey && !this.clients.has('minimax')) {
        this.clients.set('glm', new GLMClient({ apiKey: glmApiKey }));
        logger.info('GLM client initialized (fallback AI provider)');
      }
    } catch (error) {
      logger.warn('GLM client initialization failed', { 
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Initialize other clients as fallbacks
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

    // Initialize Ollama client only if Minimax is not available
    if (!this.clients.has('minimax')) {
      try {
        this.clients.set('ollama', new OllamaClient({ baseUrl: config.ollamaBaseUrl }));
        logger.info('Ollama client initialized (fallback provider - Minimax not available)');
      } catch (error) {
        logger.warn('Ollama client initialization failed', { error });
      }
    } else {
      logger.debug('Ollama client disabled - Minimax is primary provider');
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
    // Check cost limits - only force Ollama if GLM is not available
    const currentHourCost = this.getCurrentHourCost();
    if (currentHourCost >= this.costLimit) {
      const glmClient = this.clients.get('glm');
      if (glmClient && (await glmClient.isAvailable())) {
        logger.warn('Cost limit reached, but GLM is available - continuing with GLM', {
          currentCost: currentHourCost,
          limit: this.costLimit,
        });
        // Keep preference as-is, GLM will be used
      } else {
        logger.warn('Cost limit reached, forcing Ollama (GLM not available)', {
          currentCost: currentHourCost,
          limit: this.costLimit,
        });
        preference = 'ollama';
      }
    }

    // Select the best model for this task
    const selection = await this.selectModel(taskType, preference);

    if (!selection) {
      throw new Error('No AI clients available. Please configure at least one AI provider.');
    }

    logger.debug('Model selected', { rationale: selection.rationale, model: selection.model });

    // Execute the completion
    // Auto-set response_format for structured output tasks (MiniMax optimization)
    const shouldUseJSONFormat = taskType === 'mechanics' || taskType === 'lore' || taskType === 'refinement' || taskType === 'title';
    const responseFormat = options?.responseFormat || (shouldUseJSONFormat ? { type: 'json_object' as const } : undefined);

    const request: AICompletionRequest = {
      model: selection.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? 2000,
      topP: options?.topP ?? 0.9,
      ...(responseFormat ? { responseFormat } : {}),
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
        error: error instanceof Error ? error.message : String(error),
      });

      // If Minimax failed, try GLM fallback if available
      if (selection.client.type === 'minimax' && this.clients.has('glm')) {
        logger.info('Minimax generation failed, trying GLM fallback');
        const glmClient = this.clients.get('glm')!;
        try {
          const fallbackRequest: AICompletionRequest = {
            ...request,
            model: 'glm-4.6',
          };
          return await glmClient.complete(fallbackRequest);
        } catch (glmError) {
          logger.warn('GLM fallback also failed', {
            minimaxError: error instanceof Error ? error.message : String(error),
            glmError: glmError instanceof Error ? glmError.message : String(glmError),
          });
        }
      }
      
      // If GLM failed, try Minimax fallback if available
      if (selection.client.type === 'glm' && this.clients.has('minimax')) {
        logger.info('GLM generation failed, trying Minimax fallback');
        const minimaxClient = this.clients.get('minimax')!;
        try {
          const fallbackRequest: AICompletionRequest = {
            ...request,
            model: 'MiniMax-M2',
          };
          return await minimaxClient.complete(fallbackRequest);
        } catch (minimaxError) {
          logger.warn('Minimax fallback also failed', {
            glmError: error instanceof Error ? error.message : String(error),
            minimaxError: minimaxError instanceof Error ? minimaxError.message : String(minimaxError),
          });
        }
      }

      const defaultOllamaModels = [
        'qwen3:4b',
        'qwen3:8b',
        'llama3.1:8b',
        'phi4-mini:latest',
        'deepseek-coder-v2:latest',
      ];

      // If Ollama failed and we're already using Ollama, try alternative models
      if (selection.client.type === 'ollama') {
        // Try each model until one works
        for (const modelName of defaultOllamaModels) {
          if (modelName === selection.model) {
            logger.debug(`Skipping ${modelName} - already tried`);
            continue; // Skip the one we already tried
          }
          
          try {
            logger.info(`Trying alternative Ollama model: ${modelName}`, {
              previousModel: selection.model,
              attempt: defaultOllamaModels.indexOf(modelName) + 1,
              total: defaultOllamaModels.length,
            });
            const fallbackRequest: AICompletionRequest = {
              ...request,
              model: modelName,
            };
            const response = await selection.client.complete(fallbackRequest);
            logger.info(`Successfully used Ollama model: ${modelName}`, {
              previousModel: selection.model,
            });
            return response;
          } catch (modelError: any) {
            const errorMsg = modelError?.message || String(modelError);
            logger.warn(`Model ${modelName} failed, trying next`, { 
              error: errorMsg,
              attempt: defaultOllamaModels.indexOf(modelName) + 1,
            });
            continue;
          }
        }
        
        // If all models failed, log detailed error
        logger.error('All Ollama models failed', {
          triedModels: defaultOllamaModels,
          originalError: error instanceof Error ? error.message : String(error),
        });
      }

      // Fallback to Ollama only if we're not using Minimax/GLM and Ollama is available
      // (Minimax/GLM fallback is handled above)
      if (selection.client.type !== 'ollama' && 
          selection.client.type !== 'minimax' &&
          selection.client.type !== 'glm' && 
          this.clients.has('ollama')) {
        logger.info('Falling back to Ollama (non-Minimax/GLM provider failed)');
        const ollamaClient = this.clients.get('ollama')!;
        // Try known models in order
        for (const modelName of defaultOllamaModels) {
          try {
            const fallbackRequest: AICompletionRequest = {
              ...request,
              model: modelName,
            };
            return await ollamaClient.complete(fallbackRequest);
          } catch (modelError) {
            continue; // Try next model
          }
        }
      }

      // If all fallbacks failed, throw original error with helpful message
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('model') && errorMessage.includes('not found')) {
        // Provide more helpful error message with troubleshooting steps
        const helpfulMessage = 
          `Ollama model not accessible. Tried models: ${defaultOllamaModels.join(', ')}. ` +
          `The models may exist locally but not be accessible via the Ollama API. ` +
          `Try: ollama pull qwen3:8b (to re-register the model) or restart Ollama. ` +
          `If using Google Gemini, add GEMINI_API_KEY to your .env file for more reliable access.`;
        throw new Error(helpfulMessage);
      }
      throw error;
    }
  }

  /**
   * Select the optimal model based on task type and preferences
   * Based on November 2025 benchmarks (Qwen 3, Phi-4, Llama 4, DeepSeek R1)
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
        // Default: qwen3:8b (widely available, good quality)
        let model = 'qwen3:8b';
        try {
          const availableModels = await ollamaClient.listModels?.() || [];
          if (availableModels.length > 0) {
            // OPTIMIZED FOR MAC M4 16GB (November 2025):
            // Model selection strategy based on April-November 2025 releases:
            // - Best overall: qwen3:30b-a3b (MoE: 30B quality, 3B memory, 20-30 tok/s)
            // - Max quality: phi4:14b (9.8T tokens training, 25-35 tok/s, 11-13GB RAM)
            // - Creative tasks: qwen3-coder:7b (excellent narrative, 35-45 tok/s)
            // - Structured output: qwen3:7b (best JSON, 35-45 tok/s)
            // - Reasoning: deepseek-r1:8b (shows thinking process, 30-40 tok/s)
            // - Lightweight: llama4:8b (<8GB, 35-45 tok/s)
            const preferredModels = [
              'qwen3:30b-a3b',     // MoE: 30B quality, 3B memory!
              'phi4:14b',          // Highest quality reasoning
              'qwen3-coder:7b',    // Best creative writing
              'qwen3:7b',          // Best structured JSON
              'deepseek-r1:8b',    // Best reasoning
              'llama4:8b',         // Versatile lightweight
              'mistral:7b',        // Fast workhorse
              'qwen3:3b',          // Ultra-lightweight
            ];
            const generalPurposeModel = availableModels.find(m =>
              preferredModels.some(pref => m.toLowerCase().includes(pref.toLowerCase())) &&
              !m.toLowerCase().includes('embed')
            );
            model = generalPurposeModel || availableModels.find(m => m.toLowerCase().includes('qwen3')) || availableModels[0];
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

    if (preference === 'minimax') {
      const minimaxClient = this.clients.get('minimax');
      if (minimaxClient && (await minimaxClient.isAvailable())) {
        return {
          client: minimaxClient,
          model: 'MiniMax-M2', // Minimax M2 model name (Anthropic-compatible format)
          rationale: 'Minimax M2 (user preference)',
        };
      }
    }

    if (preference === 'glm') {
      const glmClient = this.clients.get('glm');
      if (glmClient && (await glmClient.isAvailable())) {
        return {
          client: glmClient,
          model: 'glm-4.6', // GLM 4.6 model name
          rationale: 'GLM 4.6 (user preference)',
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
      // Prioritize Minimax M2 for all tasks if available
      const minimaxClient = this.clients.get('minimax');
      if (minimaxClient && (await minimaxClient.isAvailable())) {
        return {
          client: minimaxClient,
          model: 'MiniMax-M2', // Minimax M2 model name (Anthropic-compatible format)
          rationale: 'Minimax M2 (auto-selected, optimal for all tasks)',
        };
      }
      
      // Fallback to GLM 4.6 if Minimax not available
      const glmClient = this.clients.get('glm');
      if (glmClient && (await glmClient.isAvailable())) {
        return {
          client: glmClient,
          model: 'glm-4.6', // GLM 4.6 model name
          rationale: `GLM 4.6 for ${taskType} (primary AI provider, excellent for all tasks)`,
        };
      }

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
            let model = 'qwen3:8b';
            try {
              const availableModels = await ollamaClient.listModels?.() || [];
              if (availableModels.length > 0) {
                // Mechanics generation needs structured output - Qwen 3 excels, MoE gives best quality/memory
                const preferredModels = [
                  'qwen3:30b-a3b',  // MoE: Best quality for JSON (Qwen3-4B rivals Qwen2.5-72B!)
                  'phi4:14b',       // High quality reasoning (9.8T tokens)
                  'qwen3:7b',       // Excellent JSON/structured output
                  'deepseek-r1:8b', // Good reasoning for complex mechanics
                  'qwen3:3b',       // Fast, lightweight
                ];
                const mechanicsModel = availableModels.find(m =>
                  preferredModels.some(pref => m.toLowerCase().includes(pref.toLowerCase())) &&
                  !m.toLowerCase().includes('embed') &&
                  !m.toLowerCase().includes('coder')  // Avoid coder variants for pure JSON tasks
                );
                model = mechanicsModel || availableModels.find(m => m.toLowerCase().includes('qwen3')) || availableModels[0];
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
          // GLM 4.6 is already checked above, fallback to OpenRouter
          // Qwen 3 72B via OpenRouter - 128K context for deep creative narratives
          const openrouterClient = this.clients.get('openrouter');
          if (openrouterClient && (await openrouterClient.isAvailable())) {
            return {
              client: openrouterClient,
              model: 'qwen/qwen-2.5-72b-instruct',
              rationale: 'Qwen 3 72B for lore (128K context, creative depth)',
            };
          }
          // Fallback to Ollama if OpenRouter not available
          const ollamaClient = this.clients.get('ollama');
          if (ollamaClient && (await ollamaClient.isAvailable())) {
            // For lore: Prefer creative writing models (coder variants + MoE excel at narrative)
            let model = 'qwen3:8b';
            try {
              const availableModels = await ollamaClient.listModels?.() || [];
              if (availableModels.length > 0) {
                // Lore needs creative, narrative-focused models
                // Qwen 3 Coder variants + Phi-4 excel at creative writing
                // MoE models provide superior quality for worldbuilding
                const preferredModels = [
                  'qwen3:30b-a3b',     // MoE: Best quality for deep lore
                  'phi4:14b',          // Excellent narrative quality (9.8T tokens)
                  'qwen3-coder:7b',    // Best creative writing in 7B class
                  'llama4:8b',         // Good narrative, versatile
                  'qwen3:7b',          // Solid general purpose
                  'qwen3:3b',          // Lightweight
                ];
                const loreModel = availableModels.find(m =>
                  preferredModels.some(pref => m.toLowerCase().includes(pref.toLowerCase())) &&
                  !m.toLowerCase().includes('embed')
                );
                model = loreModel || availableModels.find(m => m.toLowerCase().includes('qwen3')) || availableModels[0];
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
          // GLM 4.6 is already checked above, fallback to Gemini
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
          // GLM 4.6 is already checked above, fallback to OpenRouter
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
          // GLM 4.6 is already checked above, fallback to Ollama if GLM not available
          // Ollama for unlimited iterations - refinement benefits from best available model
          const ollamaClient = this.clients.get('ollama');
          if (ollamaClient && (await ollamaClient.isAvailable())) {
            // For refinement: Use highest quality model (needs creative + analytical + reasoning)
            // Known models that exist (even if API list() returns empty)
            // Ordered by preference for refinement tasks
            const knownModels = [
              'qwen3:8b',              // Best balance of quality/speed
              'qwen3:4b',              // Fast and capable
              'llama3.1:8b',           // Versatile and reliable
              'phi4-mini:latest',      // Good reasoning
              'deepseek-coder-v2:latest', // Good for structured output
              'qwen3:7b',              // Alternative
              'qwen3:30b-a3b',         // MoE: Best overall quality (if available)
              'phi4:14b',              // Highest quality reasoning (if available)
            ];
            
            let model: string | null = null;
            try {
              const availableModels = await ollamaClient.listModels?.() || [];
              if (availableModels.length > 0) {
                // Refinement needs balanced creative + analytical + deep reasoning
                const preferredModels = [
                  'qwen3:30b-a3b',     // MoE: Best overall quality
                  'phi4:14b',          // Highest quality reasoning (9.8T tokens)
                  'deepseek-r1:8b',    // Explicit reasoning for improvements
                  'qwen3-coder:7b',    // Excellent all-rounder
                  'qwen3:7b',          // Strong analytical
                  'qwen3:8b',          // Strong analytical (alternative)
                  'qwen3:4b',          // Fast iterations
                  'qwen3:3b',          // Fast iterations
                  'phi4-mini',         // Good reasoning (alternative)
                  'llama3.1:8b',       // Versatile
                ];
                const refinementModel = availableModels.find(m => {
                  const modelLower = m.toLowerCase();
                  return preferredModels.some(pref => 
                    modelLower.includes(pref.toLowerCase()) && 
                    !modelLower.includes('embed')
                  );
                });
                model = refinementModel || 
                        availableModels.find(m => m.toLowerCase().includes('qwen3') && !m.toLowerCase().includes('embed')) ||
                        availableModels.find(m => !m.toLowerCase().includes('embed')) ||
                        availableModels[0];
              }
            } catch (error) {
              logger.warn('Failed to list Ollama models, will try known models', { error });
            }
            
            // If API list() returned empty (common Ollama issue), try known models
            // Ollama API sometimes can't list models but they're still usable
            // We know models exist via CLI, so trust that and use them
            if (!model) {
              // Start with qwen3:4b (smaller, faster to load)
              // Even if API says models don't exist, they might work when we try to use them
              model = knownModels[0]; // qwen3:4b
              logger.info(`API list() returned empty, but models exist via CLI. Using ${model} directly.`);
            }
            
            return {
              client: ollamaClient,
              model,
              rationale: `Ollama ${model} for refinement (local, unlimited iterations, Mac M4 16GB optimized)`,
            };
          }
          break;
        }

        case 'assistant': {
          // GLM 4.6 is already checked above, fallback to Ollama Qwen models
          const ollamaClient = this.clients.get('ollama');
          if (ollamaClient && (await ollamaClient.isAvailable())) {
            const qwenPreferred = [
              'qwen3:30b-a3b',
              'qwen3:8b',
              'qwen3:7b',
              'qwen3:4b',
            ];
            let model = 'qwen3:8b';
            try {
              const availableModels = await ollamaClient.listModels?.() || [];
              const qwenModel = availableModels.find((m) =>
                qwenPreferred.some((pref) => m.toLowerCase().includes(pref.toLowerCase()))
              );
              if (qwenModel) {
                model = qwenModel;
              }
            } catch {
              // fallback to default
            }
            return {
              client: ollamaClient,
              model,
              rationale: `Ollama ${model} for assistant conversations (Qwen 3 requirement)`,
            };
          }
          break;
        }
      }
    }

    // Fallback chain: try clients in order of preference (GLM first)
    const clientOrder = ['glm', 'openrouter', 'google', 'ollama'];
    for (const clientName of clientOrder) {
      const client = this.clients.get(clientName);
      if (client && (await client.isAvailable())) {
        let model = this.getDefaultModel(client);
        // For Ollama, try to get an available model optimized for Mac M4 16GB
        if (client.type === 'ollama' && client.listModels) {
          try {
            const availableModels = await client.listModels();
            if (availableModels.length > 0) {
              // Prefer November 2025 models (optimized for Mac M4 16GB)
              const preferredModels = [
                'qwen3:30b-a3b',     // MoE: Best quality/memory ratio
                'phi4:14b',          // Highest quality reasoning
                'qwen3-coder:7b',    // Best creative + analytical
                'qwen3:7b',          // Best structured output
                'deepseek-r1:8b',    // Best reasoning
                'llama4:8b',         // Versatile lightweight
                'mistral:7b',        // Fast workhorse
                'qwen3:3b',          // Lightweight, fast
              ];
              const generalPurposeModel = availableModels.find(m =>
                preferredModels.some(pref => m.toLowerCase().includes(pref.toLowerCase())) &&
                !m.toLowerCase().includes('embed')
              );
              model = generalPurposeModel || availableModels.find(m => m.toLowerCase().includes('qwen3')) || availableModels[0];
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
      case 'glm':
        return 'glm-4.6'; // GLM 4.6 model name
      case 'openrouter':
        return 'deepseek/deepseek-chat';
      case 'google':
        return 'gemini-2.0-flash-exp';
      case 'ollama':
        // Default to qwen3:8b (widely available, good quality)
        // Falls back to qwen3:4b if 8b not available
        return 'qwen3:8b';
      default:
        return 'glm-4.6'; // GLM 4.6 model name
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
    const clientEntries = Array.from(this.clients.entries());
    logger.debug('getStatus called', { 
      totalClients: clientEntries.length,
      clientNames: clientEntries.map(([name]) => name)
    });
    
    const clientStatus = await Promise.all(
      clientEntries.map(async ([name, client]) => {
        try {
          const available = await client.isAvailable();
          logger.debug('Client status check', { name, type: client.type, available });
          return {
            name: client.name,
            type: client.type,
            available,
          };
        } catch (error) {
          logger.warn('Error checking client availability', { 
            name, 
            error: error instanceof Error ? error.message : String(error) 
          });
          return {
            name: client.name,
            type: client.type,
            available: false,
          };
        }
      })
    );

    return {
      clients: clientStatus,
      currentHourCost: this.getCurrentHourCost(),
      costLimit: this.costLimit,
    };
  }
}
