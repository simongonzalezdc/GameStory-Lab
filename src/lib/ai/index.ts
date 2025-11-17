/**
 * AI client factory and exports
 */

import type { AIClient, AIConfig, AIClientId } from '@/types';
import { OpenRouterClient } from './openrouter-client';
import { MinimaxClient } from './minimax-client';
import { GLMClient } from './glm-client';
import { LocalAIClient } from './local-client';

/**
 * Create AI client from configuration
 */
export function createAIClient(config: AIConfig): AIClient {
  switch (config.provider) {
    case 'openrouter':
      return new OpenRouterClient(config as any);
    case 'minimax':
      return new MinimaxClient(config as any);
    case 'glm':
      return new GLMClient(config as any);
    case 'local':
      return new LocalAIClient(config as any);
    default:
      throw new Error(`Unknown AI provider: ${(config as any).provider}`);
  }
}

/**
 * Get default configuration for a provider
 */
export function getDefaultConfig(provider: AIClientId): Partial<AIConfig> {
  switch (provider) {
    case 'openrouter':
      return {
        provider: 'openrouter',
        model: 'anthropic/claude-3.5-sonnet',
      };
    case 'minimax':
      return {
        provider: 'minimax',
        model: 'abab6.5-chat',
      };
    case 'glm':
      return {
        provider: 'glm',
        model: 'glm-4-plus',
      };
    case 'local':
      return {
        provider: 'local',
        baseURL: 'http://localhost:11434',
        model: 'llama3.1',
      };
  }
}

export { OpenRouterClient } from './openrouter-client';
export { MinimaxClient } from './minimax-client';
export { GLMClient } from './glm-client';
export { LocalAIClient } from './local-client';
export { buildMusicSystemPrompt } from './prompt-builder';
export { parseActions, extractCleanMessage } from './intent-parser';
