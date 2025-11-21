/**
 * Base AI Client Interface
 * All AI providers must implement this interface for consistent usage
 */

export interface AIClientConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionRequest {
  model: string;
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  responseFormat?: {
    type: 'json_object' | 'text';
  } | {
    type: 'json_schema';
    json_schema: {
      name: string;
      description?: string;
      schema: Record<string, any>;
    };
  };
}

export interface AICompletionResponse {
  content: string;
  model: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  finishReason: 'stop' | 'length' | 'error';
  metadata?: {
    provider: string;
    costUsd?: number;
    durationMs: number;
  };
}

export interface IAIClient {
  readonly name: string;
  readonly type: 'openrouter' | 'google' | 'ollama' | 'glm' | 'minimax';

  /**
   * Generate a completion from the AI model
   */
  complete(request: AICompletionRequest): Promise<AICompletionResponse>;

  /**
   * Check if the client is available and configured
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get list of available models for this provider
   */
  listModels?(): Promise<string[]>;
}

export class AIClientError extends Error {
  constructor(
    message: string,
    public provider: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AIClientError';
  }
}
