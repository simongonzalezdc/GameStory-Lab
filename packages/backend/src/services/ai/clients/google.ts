/**
 * Google Gemini AI Client
 * Used for consistency validation (fast reasoning, multimodal, 1M context)
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import type {
  IAIClient,
  AIClientConfig,
  AICompletionRequest,
  AICompletionResponse,
  AIClientError,
} from './base.js';

export class GoogleClient implements IAIClient {
  readonly name = 'Google Gemini';
  readonly type = 'google' as const;

  private client: GoogleGenerativeAI;
  private apiKey: string;

  constructor(config: AIClientConfig = {}) {
    this.apiKey = config.apiKey || process.env.GOOGLE_API_KEY || '';

    if (!this.apiKey) {
      throw new Error('Google API key is required');
    }

    this.client = new GoogleGenerativeAI(this.apiKey);
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const startTime = Date.now();

    try {
      const model: GenerativeModel = this.client.getGenerativeModel({
        model: request.model,
      });

      // Convert messages to Gemini format
      const { systemInstruction, contents } = this.formatMessages(request.messages);

      const generationConfig = {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 2000,
        topP: request.topP ?? 0.9,
      };

      const result = await model.generateContent({
        contents,
        systemInstruction,
        generationConfig,
      });

      const response = result.response;
      const text = response.text();
      const durationMs = Date.now() - startTime;

      // Extract token usage
      const usageMetadata = response.usageMetadata;
      const promptTokens = usageMetadata?.promptTokenCount || 0;
      const completionTokens = usageMetadata?.candidatesTokenCount || 0;

      // Estimate cost (Gemini 2.5 Flash pricing as of Nov 2025)
      const costPer1MPrompt = 0.075; // $0.075 per 1M tokens
      const costPer1MCompletion = 0.30; // $0.30 per 1M tokens
      const costUsd =
        (promptTokens / 1_000_000) * costPer1MPrompt +
        (completionTokens / 1_000_000) * costPer1MCompletion;

      return {
        content: text,
        model: request.model,
        tokensUsed: {
          prompt: promptTokens,
          completion: completionTokens,
          total: promptTokens + completionTokens,
        },
        finishReason: response.candidates?.[0]?.finishReason === 'STOP' ? 'stop' : 'error',
        metadata: {
          provider: 'google',
          costUsd,
          durationMs,
        },
      };
    } catch (error) {
      const aiError = error as AIClientError;
      throw {
        name: 'AIClientError',
        message: `Google Gemini generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        provider: 'google',
        originalError: error,
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      // Quick test with minimal model
      const model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'test' }] }],
        generationConfig: { maxOutputTokens: 1 },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Format messages for Gemini API
   * Gemini uses a different format than OpenAI-style messages
   */
  private formatMessages(messages: AICompletionRequest['messages']) {
    const systemMessages = messages.filter((m) => m.role === 'system');
    const chatMessages = messages.filter((m) => m.role !== 'system');

    const systemInstruction = systemMessages.map((m) => m.content).join('\n');

    const contents = chatMessages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    return {
      systemInstruction: systemInstruction || undefined,
      contents,
    };
  }
}
