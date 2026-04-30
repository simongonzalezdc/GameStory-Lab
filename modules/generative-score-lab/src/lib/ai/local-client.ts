/**
 * Local LLM Client (Ollama)
 */

import type { AIClient, AIRequest, AIResponse, LocalConfig } from '@/types';
import { buildMusicSystemPrompt } from './prompt-builder';
import { parseActions, extractCleanMessage } from './intent-parser';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';
import { validateOllamaResponse } from './response-validator';
import { checkOllamaStatus, setupOllama } from './ollama-setup';

export class LocalAIClient implements AIClient {
  readonly id = 'local' as const;
  readonly name = 'Local LLM (Ollama)';
  private config: LocalConfig;

  constructor(config: LocalConfig) {
    this.config = config;
  }

  async sendMessage(input: AIRequest): Promise<AIResponse> {
    try {
      // Check Ollama status before sending message
      const status = await checkOllamaStatus(this.config);
      
      if (!status.isRunning) {
        const setupResult = await setupOllama(this.config);
        return {
          message: '',
          error: setupResult.message || 'Ollama is not running. Please start Ollama first.',
        };
      }

      if (!status.isModelAvailable) {
        // Try to automatically pull the missing model
        const setupResult = await setupOllama(this.config, true);
        if (!setupResult.success) {
          return {
            message: '',
            error: setupResult.message || `Model '${this.config.model}' is not available.`,
          };
        }
        // Model was downloaded, retry the request
        // Re-check status after pull
        const newStatus = await checkOllamaStatus(this.config);
        if (!newStatus.isModelAvailable) {
          return {
            message: '',
            error: `Model '${this.config.model}' is still not available after download attempt.`,
          };
        }
      }

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
        signal: input.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Local LLM error: ${response.status} - ${errorText}`;
        
        // Provide helpful error messages for common issues
        if (response.status === 404) {
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error?.includes('model') && errorData.error?.includes('not found')) {
              const setupResult = await setupOllama(this.config);
              errorMessage = setupResult.message || `Model '${this.config.model}' is not available. ${errorText}`;
            }
          } catch {
            // If parsing fails, use original error
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Log raw response in development
      if (import.meta.env.MODE === 'development') {
        console.debug('[Ollama] Raw API response:', data);
      }
      
      // Validate response structure
      let validated;
      try {
        validated = validateOllamaResponse(data);
      } catch (validationError) {
        // If validation fails, try to extract content anyway for better error messages
        if (import.meta.env.MODE === 'development') {
          console.error('[Ollama] Validation failed, raw response:', data);
        }
        throw validationError;
      }
      
      const content = validated.content;

      // If content is empty after validation, provide a helpful message
      if (!content || content.trim() === '') {
        const errorMsg = 'Ollama returned an empty response. The model may not have generated any content. Try rephrasing your request.';
        if (import.meta.env.MODE === 'development') {
          console.warn('[Ollama] Empty content after validation:', { data, validated });
        }
        return {
          message: '',
          error: errorMsg,
        };
      }

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
