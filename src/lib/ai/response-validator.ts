/**
 * AI API Response Validation
 * Validates responses from AI providers to prevent crashes from malformed data
 */

import { z } from 'zod';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';

/**
 * Schema for OpenRouter API response
 */
const OpenRouterResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string(),
        role: z.string(),
      }),
      finish_reason: z.string().optional(),
    })
  ),
  model: z.string().optional(),
  usage: z.object({
    prompt_tokens: z.number().optional(),
    completion_tokens: z.number().optional(),
  }).optional(),
});

/**
 * Schema for Minimax API response
 */
const MinimaxResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string(),
        role: z.string(),
      }),
    })
  ),
  base_resp: z.object({
    status_code: z.number().optional(),
    status_msg: z.string().optional(),
  }).optional(),
});

/**
 * Schema for GLM API response
 */
const GLMResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string(),
        role: z.string(),
      }),
      finish_reason: z.string().optional(),
    })
  ),
  model: z.string().optional(),
  usage: z.object({
    prompt_tokens: z.number().optional(),
    completion_tokens: z.number().optional(),
  }).optional(),
});

/**
 * Schema for Ollama (Local) API response
 * Ollama can return responses in different formats:
 * - Non-streaming: { message: { content: string, role: string }, done: boolean, model: string }
 * - Sometimes content might be empty string if model didn't generate anything
 */
const OllamaResponseSchema = z.object({
  message: z.object({
    content: z.string().optional(), // Make optional to handle empty responses gracefully
    role: z.string().optional(),
  }).optional(), // Make message optional in case of error responses
  done: z.boolean().optional(),
  model: z.string().optional(),
  error: z.string().optional(), // Ollama sometimes returns errors in the response
});

/**
 * Validate OpenRouter API response
 */
export function validateOpenRouterResponse(data: unknown): {
  content: string;
  model?: string;
} {
  try {
    const validated = OpenRouterResponseSchema.parse(data);
    const content = validated.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in response');
    }
    
    return {
      content,
      model: validated.model,
    };
  } catch (error) {
    const message = error instanceof z.ZodError
      ? `Invalid OpenRouter response format: ${error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      : error instanceof Error ? error.message : 'Unknown validation error';
    
    errorHandler.handle(
      new Error(message),
      'AI Response Validation',
      ErrorSeverity.ERROR
    );
    throw new Error(`Response validation failed: ${message}`);
  }
}

/**
 * Validate Minimax API response
 */
export function validateMinimaxResponse(data: unknown): {
  content: string;
} {
  try {
    const validated = MinimaxResponseSchema.parse(data);
    const content = validated.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in response');
    }
    
    return { content };
  } catch (error) {
    const message = error instanceof z.ZodError
      ? `Invalid Minimax response format: ${error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      : error instanceof Error ? error.message : 'Unknown validation error';
    
    errorHandler.handle(
      new Error(message),
      'AI Response Validation',
      ErrorSeverity.ERROR
    );
    throw new Error(`Response validation failed: ${message}`);
  }
}

/**
 * Validate GLM API response
 */
export function validateGLMResponse(data: unknown): {
  content: string;
  model?: string;
} {
  try {
    const validated = GLMResponseSchema.parse(data);
    const content = validated.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in response');
    }
    
    return {
      content,
      model: validated.model,
    };
  } catch (error) {
    const message = error instanceof z.ZodError
      ? `Invalid GLM response format: ${error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      : error instanceof Error ? error.message : 'Unknown validation error';
    
    errorHandler.handle(
      new Error(message),
      'AI Response Validation',
      ErrorSeverity.ERROR
    );
    throw new Error(`Response validation failed: ${message}`);
  }
}

/**
 * Validate Ollama (Local) API response
 */
export function validateOllamaResponse(data: unknown): {
  content: string;
  model?: string;
} {
  try {
    // Log raw response in development for debugging
    if (import.meta.env.MODE === 'development') {
      console.debug('[Ollama Response]', JSON.stringify(data, null, 2));
    }

    const validated = OllamaResponseSchema.parse(data);
    
    // Check for error in response
    if (validated.error) {
      throw new Error(`Ollama API error: ${validated.error}`);
    }
    
    // Check if message exists
    if (!validated.message) {
      throw new Error('No message in Ollama response. The model may have failed to generate a response.');
    }
    
    const content = validated.message.content;
    
    // Handle empty or missing content
    if (!content || content.trim() === '') {
      // Log the full response structure for debugging
      const responseInfo = {
        hasMessage: !!validated.message,
        messageRole: validated.message?.role,
        messageContentLength: validated.message?.content?.length || 0,
        done: validated.done,
        model: validated.model,
        error: validated.error,
        rawData: data,
      };
      
      if (import.meta.env.MODE === 'development') {
        console.warn('[Ollama Response] Empty content received:', responseInfo);
      }
      
      throw new Error(`No content in response. Response structure: ${JSON.stringify(responseInfo)}`);
    }
    
    return {
      content,
      model: validated.model,
    };
  } catch (error) {
    // If it's a Zod validation error, provide more details
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
      const message = `Invalid Ollama response format: ${issues}. Received: ${JSON.stringify(data)}`;
      
      if (import.meta.env.MODE === 'development') {
        console.error('[Ollama Response] Validation error:', error.issues);
        console.error('[Ollama Response] Raw data:', data);
      }
      
      errorHandler.handle(
        new Error(message),
        'AI Response Validation',
        ErrorSeverity.ERROR
      );
      throw new Error(`Response validation failed: ${message}`);
    }
    
    // For other errors (like empty content), pass through the original message
    const message = error instanceof Error ? error.message : 'Unknown validation error';
    
    errorHandler.handle(
      new Error(message),
      'AI Response Validation',
      ErrorSeverity.ERROR
    );
    throw new Error(`Response validation failed: ${message}`);
  }
}

