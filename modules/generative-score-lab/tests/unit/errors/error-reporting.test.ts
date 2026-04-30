/**
 * Tests for error reporting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initErrorReporting, reportError, mapSeverityToSentryLevel } from '@/lib/errors/error-reporting';
import type { AppError } from '@/lib/errors/error-handler';
import { ErrorSeverity } from '@/lib/errors/error-handler';

describe('Error Reporting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initErrorReporting', () => {
    it('should initialize without errors', () => {
      expect(() => initErrorReporting()).not.toThrow();
    });

    it('should be idempotent (can call multiple times)', () => {
      initErrorReporting();
      initErrorReporting();
      initErrorReporting();
      expect(true).toBe(true); // Should not throw
    });
  });

  describe('reportError', () => {
    it('should report error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const error: AppError = {
        id: 'test-1',
        message: 'Test error',
        severity: ErrorSeverity.ERROR,
        timestamp: new Date(),
        userMessage: 'User error message',
        recoverable: true,
      };

      reportError(error);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should report critical errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const error: AppError = {
        id: 'test-2',
        message: 'Critical error',
        severity: ErrorSeverity.CRITICAL,
        timestamp: new Date(),
        userMessage: 'Critical error message',
        recoverable: false,
      };

      reportError(error);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle error with details', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const error: AppError = {
        id: 'test-3',
        message: 'Error with details',
        severity: ErrorSeverity.ERROR,
        timestamp: new Date(),
        userMessage: 'Error message',
        recoverable: true,
        details: 'Detailed error information',
      };

      reportError(error);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('mapSeverityToSentryLevel', () => {
    it('should map info severity', () => {
      expect(mapSeverityToSentryLevel('info')).toBe('info');
    });

    it('should map warning severity', () => {
      expect(mapSeverityToSentryLevel('warning')).toBe('warning');
    });

    it('should map error severity', () => {
      expect(mapSeverityToSentryLevel('error')).toBe('error');
    });

    it('should map critical severity to fatal', () => {
      expect(mapSeverityToSentryLevel('critical')).toBe('fatal');
    });

    it('should default to error for unknown severity', () => {
      expect(mapSeverityToSentryLevel('unknown')).toBe('error');
    });
  });
});
