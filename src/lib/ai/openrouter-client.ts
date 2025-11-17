/**
 * OpenRouter AI Client
 */

import type { AIClient, AIRequest, AIResponse, OpenRouterConfig } from '@/types';
import { buildMusicSystemPrompt } from './prompt-builder';
import { parseActions, extractCleanMessage } from './intent-parser';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';

export class OpenRouterClient implements AIClient {
  readonly id = 'openrouter' as const;
  readonly name = 'OpenRouter';
  private config: OpenRouterConfig;

  constructor(config: OpenRouterConfig) {
    this.config = config;
  }

  async sendMessage(input: AIRequest): Promise<AIResponse> {
    try {
      const systemPrompt = buildMusicSystemPrompt(input.projectContext);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Generative Score Lab',
        },
        body: JSON.stringify({
          model: this.config.model || 'anthropic/claude-3.5-sonnet',
          messages: [
            { role: 'system', content: systemPrompt },
            ...input.messages,
          ],
          max_tokens: input.maxTokens || 2048,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      const actions = parseActions(content);
      const message = extractCleanMessage(content);

      return {
        message,
        actions,
      };
    } catch (error) {
      errorHandler.handle(error, 'OpenRouter AI Client', ErrorSeverity.ERROR);
      return {
        message: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async isConfigured(): Promise<boolean> {
    return !!this.config.apiKey;
  }
}
