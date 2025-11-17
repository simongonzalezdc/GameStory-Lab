/**
 * Minimax M2 AI Client
 */

import type { AIClient, AIRequest, AIResponse, MinimaxConfig } from '@/types';
import { buildMusicSystemPrompt } from './prompt-builder';
import { parseActions, extractCleanMessage } from './intent-parser';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';

export class MinimaxClient implements AIClient {
  readonly id = 'minimax' as const;
  readonly name = 'Minimax M2';
  private config: MinimaxConfig;

  constructor(config: MinimaxConfig) {
    this.config = config;
  }

  async sendMessage(input: AIRequest): Promise<AIResponse> {
    try {
      const systemPrompt = buildMusicSystemPrompt(input.projectContext);

      const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model || 'abab6.5-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            ...input.messages,
          ],
          tokens_to_generate: input.maxTokens || 2048,
          temperature: 0.7,
          top_p: 0.95,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Minimax API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || data.reply || '';

      const actions = parseActions(content);
      const message = extractCleanMessage(content);

      return {
        message,
        actions,
      };
    } catch (error) {
      errorHandler.handle(error, 'Minimax AI Client', ErrorSeverity.ERROR);
      return {
        message: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async isConfigured(): Promise<boolean> {
    return !!(this.config.apiKey && this.config.groupId);
  }
}
