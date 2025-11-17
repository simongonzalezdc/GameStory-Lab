/**
 * Centralized error handling service
 */

import { reportError } from './error-reporting';

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface AppError {
  id: string;
  message: string;
  details?: string;
  severity: ErrorSeverity;
  timestamp: Date;
  userMessage: string;
  recoverable: boolean;
}

type ErrorListener = (error: AppError) => void;

class ErrorHandler {
  private listeners: ErrorListener[] = [];
  private errorLog: AppError[] = [];
  private maxLogSize = 100;

  /**
   * Subscribe to error notifications
   */
  subscribe(listener: ErrorListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Handle an error
   */
  handle(error: unknown, context?: string, severity: ErrorSeverity = ErrorSeverity.ERROR): AppError {
    const appError = this.createAppError(error, context, severity);
    this.logError(appError);
    this.notifyListeners(appError);
    
    // Report critical errors to external service
    if (severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.ERROR) {
      reportError(appError);
    }
    
    return appError;
  }

  /**
   * Create standardized app error
   */
  private createAppError(
    error: unknown,
    context?: string,
    severity: ErrorSeverity = ErrorSeverity.ERROR
  ): AppError {
    const timestamp = new Date();
    const id = `${timestamp.getTime()}-${Math.random().toString(36).substr(2, 9)}`;

    if (error instanceof Error) {
      return {
        id,
        message: error.message,
        details: error.stack,
        severity,
        timestamp,
        userMessage: this.getUserFriendlyMessage(error, context),
        recoverable: this.isRecoverable(error),
      };
    }

    return {
      id,
      message: String(error),
      details: context,
      severity,
      timestamp,
      userMessage: this.getUserFriendlyMessage(error, context),
      recoverable: true,
    };
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(error: unknown, context?: string): string {
    if (error instanceof Error) {
      // Network errors
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return 'Network connection error. Please check your internet connection.';
      }

      // Audio errors
      if (error.message.includes('audio') || error.message.includes('AudioContext')) {
        return 'Audio system error. Please check your browser settings and permissions.';
      }

      // Microphone errors
      if (error.message.includes('microphone') || error.message.includes('getUserMedia')) {
        return 'Microphone access error. Please grant microphone permissions.';
      }

      // File errors
      if (error.message.includes('file') || error.message.includes('FileReader')) {
        return 'File operation error. Please check the file and try again.';
      }

      // AI errors
      if (error.message.includes('AI') || error.message.includes('API')) {
        return 'AI service error. Please check your API configuration.';
      }

      // Default error message
      return `An error occurred${context ? ` in ${context}` : ''}. Please try again.`;
    }

    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Determine if error is recoverable
   */
  private isRecoverable(error: Error): boolean {
    const criticalErrors = [
      'out of memory',
      'stack overflow',
      'maximum call stack',
    ];

    return !criticalErrors.some((msg) =>
      error.message.toLowerCase().includes(msg)
    );
  }

  /**
   * Log error
   */
  private logError(error: AppError): void {
    console.error('[ErrorHandler]', {
      id: error.id,
      severity: error.severity,
      message: error.message,
      timestamp: error.timestamp,
      details: error.details,
    });

    this.errorLog.unshift(error);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(error: AppError): void {
    this.listeners.forEach((listener) => {
      try {
        listener(error);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });
  }

  /**
   * Get error history
   */
  getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearLog(): void {
    this.errorLog = [];
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler();

/**
 * Helper function for handling async errors
 */
export async function handleAsyncError<T>(
  promise: Promise<T>,
  context?: string
): Promise<[T | null, AppError | null]> {
  try {
    const result = await promise;
    return [result, null];
  } catch (error) {
    const appError = errorHandler.handle(error, context);
    return [null, appError];
  }
}

/**
 * Helper function for handling sync errors
 */
export function handleSyncError<T>(
  fn: () => T,
  context?: string
): [T | null, AppError | null] {
  try {
    const result = fn();
    return [result, null];
  } catch (error) {
    const appError = errorHandler.handle(error, context);
    return [null, appError];
  }
}
