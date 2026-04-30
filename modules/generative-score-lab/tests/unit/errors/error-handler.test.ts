/**
 * Tests for error handler
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';

// Mock console.error to avoid noise in test output
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('Error Handler', () => {
  beforeEach(() => {
    // Clear error log before each test
    errorHandler.clearLog();
  });

  describe('handle', () => {
    it('should handle errors without throwing', () => {
      expect(() => {
        errorHandler.handle(new Error('Test error'), 'Test', ErrorSeverity.ERROR);
      }).not.toThrow();
    });

    it('should log errors to the error log', () => {
      errorHandler.handle(new Error('Test error'), 'Test', ErrorSeverity.ERROR);
      const log = errorHandler.getErrorLog();
      expect(log.length).toBeGreaterThanOrEqual(1);
      expect(log[0].message).toContain('Test error');
    });

    it('should limit log size', () => {
      errorHandler.clearLog();
      // Add more errors than MAX_ERROR_LOG_SIZE
      for (let i = 0; i < 150; i++) {
        errorHandler.handle(new Error(`Error ${i}`), 'Test', ErrorSeverity.ERROR);
      }
      const log = errorHandler.getErrorLog();
      expect(log.length).toBeLessThanOrEqual(100); // MAX_ERROR_LOG_SIZE
    });

    it('should handle different severity levels', () => {
      errorHandler.clearLog();
      errorHandler.handle(new Error('Info'), 'Test', ErrorSeverity.INFO);
      errorHandler.handle(new Error('Warning'), 'Test', ErrorSeverity.WARNING);
      errorHandler.handle(new Error('Error'), 'Test', ErrorSeverity.ERROR);

      const log = errorHandler.getErrorLog();
      // INFO messages are not added to the log, only WARNING and ERROR
      expect(log.length).toBe(2);
      expect(log[0].severity).toBe(ErrorSeverity.ERROR); // Most recent first (unshift)
      expect(log[1].severity).toBe(ErrorSeverity.WARNING);
    });
  });

  describe('getErrorLog', () => {
    it('should return error log', () => {
      errorHandler.handle(new Error('Test'), 'Test', ErrorSeverity.ERROR);
      const log = errorHandler.getErrorLog();
      expect(Array.isArray(log)).toBe(true);
    });

    it('should return errors in reverse chronological order (newest first)', () => {
      errorHandler.clearLog();
      errorHandler.handle(new Error('First'), 'Test', ErrorSeverity.ERROR);
      errorHandler.handle(new Error('Second'), 'Test', ErrorSeverity.ERROR);
      
      const log = errorHandler.getErrorLog();
      expect(log.length).toBeGreaterThanOrEqual(2);
      expect(log[0].message).toContain('Second'); // Newest first
      expect(log[1].message).toContain('First');
    });
  });

  describe('clearLog', () => {
    it('should clear the error log', () => {
      errorHandler.handle(new Error('Test'), 'Test', ErrorSeverity.ERROR);
      expect(errorHandler.getErrorLog().length).toBeGreaterThanOrEqual(1);
      
      errorHandler.clearLog();
      expect(errorHandler.getErrorLog().length).toBe(0);
    });
  });
});

