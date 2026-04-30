import OpenAI from 'openai';
import { Ollama } from 'ollama';
import { getModel } from './models';
import { trackLLMUsage } from '../db/queries';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

/**
 * Routes LLM requests to either Ollama (local) or OpenRouter (cloud)
 */
export class LLMRouter {
  private ollamaClient: Ollama;
  private openRouterClient: OpenAI | null = null;

  constructor() {
    const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
    this.ollamaClient = new Ollama({ host: ollamaHost });

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (openRouterKey) {
      this.openRouterClient = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: openRouterKey,
        defaultHeaders: {
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'ShipLab',
        },
      });
    }
  }

  /**
   * Send a chat completion request
   */
  async chat(
    messages: LLMMessage[],
    modelId: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      projectId?: string;
    }
  ): Promise<LLMResponse> {
    const model = getModel(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (model.provider === 'ollama') {
      return this.chatWithOllama(messages, modelId, options);
    } else {
      return this.chatWithOpenRouter(messages, modelId, options);
    }
  }

  /**
   * Stream chat completion (for real-time responses)
   */
  async *chatStream(
    messages: LLMMessage[],
    modelId: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      projectId?: string;
    }
  ): AsyncGenerator<StreamChunk> {
    const model = getModel(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (model.provider === 'ollama') {
      yield* this.streamWithOllama(messages, modelId, options);
    } else {
      yield* this.streamWithOpenRouter(messages, modelId, options);
    }
  }

  private async chatWithOllama(
    messages: LLMMessage[],
    modelId: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      projectId?: string;
    }
  ): Promise<LLMResponse> {
    try {
      const response = await this.ollamaClient.chat({
        model: modelId,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        options: {
          temperature: options?.temperature || 0.7,
          num_predict: options?.maxTokens,
        },
      });

      // Track usage (no cost for local models)
      if (options?.projectId) {
        await trackLLMUsage({
          projectId: options.projectId,
          provider: 'ollama',
          model: modelId,
          tokensInput: response.prompt_eval_count || 0,
          tokensOutput: response.eval_count || 0,
          cost: 0,
        });
      }

      return {
        content: response.message.content,
        usage: {
          promptTokens: response.prompt_eval_count || 0,
          completionTokens: response.eval_count || 0,
          totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0),
        },
      };
    } catch (error) {
      console.error('Ollama error:', error);
      throw new Error(
        `Failed to connect to Ollama. Make sure Ollama is running at ${process.env.OLLAMA_HOST || 'http://localhost:11434'}`
      );
    }
  }

  private async chatWithOpenRouter(
    messages: LLMMessage[],
    modelId: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      projectId?: string;
    }
  ): Promise<LLMResponse> {
    if (!this.openRouterClient) {
      throw new Error('OpenRouter API key not configured');
    }

    const response = await this.openRouterClient.chat.completions.create({
      model: modelId,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens,
    });

    const usage = response.usage;
    const model = getModel(modelId);
    let cost = 0;

    if (usage && model?.cost) {
      cost =
        (usage.prompt_tokens / 1_000_000) * model.cost.input +
        (usage.completion_tokens / 1_000_000) * model.cost.output;
    }

    // Track usage with cost
    if (options?.projectId && usage) {
      await trackLLMUsage({
        projectId: options.projectId,
        provider: 'openrouter',
        model: modelId,
        tokensInput: usage.prompt_tokens,
        tokensOutput: usage.completion_tokens,
        cost,
      });
    }

    return {
      content: response.choices[0]?.message?.content || '',
      usage: usage
        ? {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
          }
        : undefined,
    };
  }

  private async *streamWithOllama(
    messages: LLMMessage[],
    modelId: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      projectId?: string;
    }
  ): AsyncGenerator<StreamChunk> {
    try {
      const stream = await this.ollamaClient.chat({
        model: modelId,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        options: {
          temperature: options?.temperature || 0.7,
          num_predict: options?.maxTokens,
        },
        stream: true,
      });

      let totalPromptTokens = 0;
      let totalCompletionTokens = 0;

      for await (const chunk of stream) {
        yield {
          content: chunk.message.content,
          done: chunk.done,
        };

        if (chunk.done) {
          totalPromptTokens = chunk.prompt_eval_count || 0;
          totalCompletionTokens = chunk.eval_count || 0;

          // Track usage after stream completes
          if (options?.projectId) {
            await trackLLMUsage({
              projectId: options.projectId,
              provider: 'ollama',
              model: modelId,
              tokensInput: totalPromptTokens,
              tokensOutput: totalCompletionTokens,
              cost: 0,
            });
          }
        }
      }
    } catch (error) {
      console.error('Ollama streaming error:', error);
      throw new Error(
        `Failed to connect to Ollama. Make sure Ollama is running at ${process.env.OLLAMA_HOST || 'http://localhost:11434'}`
      );
    }
  }

  private async *streamWithOpenRouter(
    messages: LLMMessage[],
    modelId: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      projectId?: string;
    }
  ): AsyncGenerator<StreamChunk> {
    if (!this.openRouterClient) {
      throw new Error('OpenRouter API key not configured');
    }

    const stream = await this.openRouterClient.chat.completions.create({
      model: modelId,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens,
      stream: true,
    });

    let fullContent = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullContent += content;

      yield {
        content,
        done: chunk.choices[0]?.finish_reason !== null,
      };
    }

    // Note: OpenRouter streaming doesn't provide token counts
    // We would need to estimate or make a follow-up request
  }
}

// Singleton instance
let llmRouter: LLMRouter | null = null;

export function getLLMRouter(): LLMRouter {
  if (!llmRouter) {
    llmRouter = new LLMRouter();
  }
  return llmRouter;
}
