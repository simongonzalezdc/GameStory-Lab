/**
 * Local LLM Client (Ollama)
 */

import type { AIClient, AIRequest, AIResponse, LocalConfig } from '@/types';
import { buildMusicSystemPrompt } from './prompt-builder';
import { parseActions, extractCleanMessage } from './intent-parser';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';

export class LocalAIClient implements AIClient {
  readonly id = 'local' as const;
  readonly name = 'Local LLM (Ollama)';
  private config: LocalConfig;

  constructor(config: LocalConfig) {
    this.config = config;
  }

  async sendMessage(input: AIRequest): Promise<AIResponse> {
    try {
      const systemPrompt = buildMusicSystemPrompt(input.projectContext);

      const response = await fetch(`${this.config.baseURL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model || 'llama3.1',
          messages: [
            { role: 'system', content: systemPrompt },
            ...input.messages,
          ],
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.95,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Local LLM error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.message?.content || '';

      const actions = parseActions(content);
      const message = extractCleanMessage(content);

      return {
        message,
        actions,
      };
    } catch (error) {
      errorHandler.handle(error, 'Local AI Client', ErrorSeverity.ERROR);
      return {
        message: '',
        error: error instanceof Error ? error.message : 'Connection failed. Is Ollama running?',
      };
    }
  }

  async isConfigured(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseURL}/api/tags`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
