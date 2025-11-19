/**
 * Error Handling Utilities
 * Centralized error handling for API routes
 */

import type { Prisma } from '@prisma/client';

/**
 * Custom application error class
 */
export class ApiError extends Error {
  public code: string;
  public statusCode: number;
  public details?: unknown;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Handle API errors and convert them to appropriate HTTP responses
 */
export function handleApiError(error: unknown): ApiError {
  // If it's already an ApiError, return it
  if (error instanceof ApiError) {
    return error;
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as Prisma.PrismaClientKnownRequestError;

    switch (prismaError.code) {
      case 'P2002':
        // Unique constraint violation
        return new ApiError(
          'DUPLICATE_ENTRY',
          'A record with this value already exists',
          409,
          prismaError.meta
        );

      case 'P2025':
        // Record not found
        return new ApiError('NOT_FOUND', 'Record not found', 404, prismaError.meta);

      case 'P2003':
        // Foreign key constraint violation
        return new ApiError(
          'FOREIGN_KEY_VIOLATION',
          'Referenced record does not exist',
          400,
          prismaError.meta
        );

      case 'P2014':
        // Required relation violation
        return new ApiError(
          'RELATION_VIOLATION',
          'Required relation is missing',
          400,
          prismaError.meta
        );

      default:
        return new ApiError(
          'DATABASE_ERROR',
          `Database error: ${prismaError.message}`,
          500,
          { code: prismaError.code }
        );
    }
  }

  // Handle validation errors (Zod)
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as { issues: Array<{ path: string[]; message: string }> };
    return new ApiError(
      'VALIDATION_ERROR',
      'Invalid request data',
      400,
      zodError.issues
    );
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Check for common error patterns
    if (error.message.includes('ECONNREFUSED')) {
      return new ApiError(
        'SERVICE_UNAVAILABLE',
        'External service is unavailable',
        503,
        { originalError: error.message }
      );
    }

    if (error.message.includes('timeout')) {
      return new ApiError(
        'TIMEOUT',
        'Request timed out',
        504,
        { originalError: error.message }
      );
    }

    return new ApiError('INTERNAL_ERROR', error.message, 500, {
      originalError: error.message,
    });
  }

  // Unknown error type
  return new ApiError(
    'UNKNOWN_ERROR',
    'An unexpected error occurred',
    500,
    { error: String(error) }
  );
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: ApiError, includeStack = false) {
  const response: {
    error: {
      code: string;
      message: string;
      details?: unknown;
      stack?: string;
    };
  } = {
    error: {
      code: error.code,
      message: error.message,
    },
  };
  
  if (error.details) {
    response.error.details = error.details;
  }
  
  if (includeStack && process.env.NODE_ENV === 'development' && error.stack) {
    response.error.stack = error.stack;
  }
  
  return response;
}

