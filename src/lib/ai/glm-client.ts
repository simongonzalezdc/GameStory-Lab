/**
 * GLM 4.6 AI Client
 */

import type { AIClient, AIRequest, AIResponse, GLMConfig } from '@/types';
import { buildMusicSystemPrompt } from './prompt-builder';
import { parseActions, extractCleanMessage } from './intent-parser';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';
import { validateGLMResponse } from './response-validator';

export class GLMClient implements AIClient {
  readonly id = 'glm' as const;
  readonly name = 'GLM 4.6';
  private config: GLMConfig;

  constructor(config: GLMConfig) {
    this.config = config;
  }

  async sendMessage(input: AIRequest): Promise<AIResponse> {
    try {
      const systemPrompt = buildMusicSystemPrompt(input.projectContext);

      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model || 'glm-4-plus',
          messages: [
            { role: 'system', content: systemPrompt },
            ...input.messages,
          ],
          max_tokens: input.maxTokens || 2048,
          temperature: 0.7,
          top_p: 0.95,
        }),
        signal: input.signal,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`GLM API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      
      // Validate response structure
      const validated = validateGLMResponse(data);
      const content = validated.content;

      const actions = parseActions(content);
      const message = extractCleanMessage(content);

      return {
        message,
        actions,
      };
    } catch (error) {
      errorHandler.handle(error, 'GLM AI Client', ErrorSeverity.ERROR);
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
