/**
 * AI client factory and exports
 */

import type {
  AIClient,
  AIConfig,
  AIClientId,
  OpenRouterConfig,
  MinimaxConfig,
  GLMConfig,
  LocalConfig,
} from '@/types';
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
      if (!('apiKey' in config) || !('model' in config)) {
        throw new Error('OpenRouter config requires apiKey and model');
      }
      return new OpenRouterClient(config as OpenRouterConfig);
    case 'minimax':
      if (!('apiKey' in config) || !('groupId' in config) || !('model' in config)) {
        throw new Error('Minimax config requires apiKey, groupId, and model');
      }
      return new MinimaxClient(config as MinimaxConfig);
    case 'glm':
      if (!('apiKey' in config) || !('model' in config)) {
        throw new Error('GLM config requires apiKey and model');
      }
      return new GLMClient(config as GLMConfig);
    case 'local':
      if (!('baseURL' in config) || !('model' in config)) {
        throw new Error('Local config requires baseURL and model');
      }
      return new LocalAIClient(config as LocalConfig);
    default: {
      // This should never happen, but TypeScript needs this for exhaustiveness
      throw new Error(`Unknown AI provider: ${(config as AIConfig).provider}`);
    }
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
