/**
 * AI Service Interface
 * Provides unified access to AI capabilities across the application
 */

import { AIOrchestrator } from './orchestrator.js';
import type { ModelPreference } from '@gameforge/shared';

export interface GenerateCompletionOptions {
  prompt: string;
  systemMessage?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  modelPreference?: ModelPreference;
}

export interface GenerateCompletionResponse {
  content: string;
  model: string;
  provider: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Singleton instance of AI orchestrator
let aiOrchestratorInstance: AIOrchestrator | null = null;

/**
 * Get the AI orchestrator instance (singleton)
 */
function getAIOrchestrator(): AIOrchestrator {
  if (!aiOrchestratorInstance) {
    aiOrchestratorInstance = new AIOrchestrator({
      openrouterApiKey: process.env.OPENROUTER_API_KEY,
      googleApiKey: process.env.GOOGLE_API_KEY,
      glmApiKey: process.env.GLM_API_KEY,
      minimaxApiKey: process.env.MINIMAX_API_KEY,
      ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
      costLimitPerHourUsd: 5.0, // $5/hour limit
    });
  }
  return aiOrchestratorInstance;
}

/**
 * AI Service - Unified interface for AI operations
 */
export class AIService {
  private orchestrator: AIOrchestrator;

  constructor() {
    this.orchestrator = getAIOrchestrator();
  }

  /**
   * Generate a completion using the optimal AI model
   */
  async generateCompletion(options: GenerateCompletionOptions): Promise<GenerateCompletionResponse> {
    try {
      const messages = [
        ...(options.systemMessage ? [{
          role: 'system' as const,
          content: options.systemMessage
        }] : []),
        {
          role: 'user' as const,
          content: options.prompt
        }
      ];

      const response = await this.orchestrator.generate(
        'assistant',
        messages,
        options.modelPreference || 'auto',
        {
          temperature: options.temperature || 0.7,
          maxTokens: options.maxTokens || 2000,
          topP: options.topP || 0.9,
        }
      );

      return {
        content: response.content,
        model: response.model,
        provider: response.metadata?.provider ?? 'unknown',
        usage: {
          prompt_tokens: response.tokensUsed.prompt,
          completion_tokens: response.tokensUsed.completion,
          total_tokens: response.tokensUsed.total,
        },
      };
    } catch (error) {
      throw new Error(`AI completion failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if AI services are available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.orchestrator.generate(
        'assistant',
        [{ role: 'user', content: 'Hello' }],
        'auto',
        { temperature: 0, maxTokens: 5 }
      );
      return !!response.content;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get available AI providers
   */
  async getAvailableProviders(): Promise<string[]> {
    const orchestrator = getAIOrchestrator();
    const clients = (orchestrator as any).clients;
    const available: string[] = [];
    
    for (const [name, client] of clients.entries()) {
      try {
        if (await client.isAvailable()) {
          available.push(name);
        }
      } catch (error) {
        // Client not available
      }
    }
    
    return available;
  }

  /**
   * Generate a completion with retry logic
   */
  async generateCompletionWithRetry(
    options: GenerateCompletionOptions,
    maxRetries: number = 3
  ): Promise<GenerateCompletionResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.generateCompletion(options);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw lastError;
  }
}

// Export singleton instance
let aiServiceInstance: AIService | null = null;

/**
 * Get the AI service instance (singleton)
 */
export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}

/**
 * Generate completion helper function (for simple use cases)
 */
export async function generateCompletion(options: GenerateCompletionOptions): Promise<GenerateCompletionResponse> {
  const service = getAIService();
  return service.generateCompletion(options);
}
