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
 */
const OllamaResponseSchema = z.object({
  message: z.object({
    content: z.string(),
    role: z.string(),
  }),
  done: z.boolean().optional(),
  model: z.string().optional(),
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
    const validated = OllamaResponseSchema.parse(data);
    const content = validated.message?.content;
    
    if (!content) {
      throw new Error('No content in response');
    }
    
    return {
      content,
      model: validated.model,
    };
  } catch (error) {
    const message = error instanceof z.ZodError
      ? `Invalid Ollama response format: ${error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      : error instanceof Error ? error.message : 'Unknown validation error';
    
    errorHandler.handle(
      new Error(message),
      'AI Response Validation',
      ErrorSeverity.ERROR
    );
    throw new Error(`Response validation failed: ${message}`);
  }
}

