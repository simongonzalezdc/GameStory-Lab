/**
 * Tests for error handler
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';

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
      const log = errorHandler.getLog();
      expect(log.length).toBe(1);
      expect(log[0].message).toBe('Test error');
    });

    it('should limit log size', () => {
      // Add more errors than MAX_ERROR_LOG_SIZE
      for (let i = 0; i < 150; i++) {
        errorHandler.handle(new Error(`Error ${i}`), 'Test', ErrorSeverity.ERROR);
      }
      const log = errorHandler.getLog();
      expect(log.length).toBeLessThanOrEqual(100); // MAX_ERROR_LOG_SIZE
    });

    it('should handle different severity levels', () => {
      errorHandler.handle(new Error('Info'), 'Test', ErrorSeverity.INFO);
      errorHandler.handle(new Error('Warning'), 'Test', ErrorSeverity.WARNING);
      errorHandler.handle(new Error('Error'), 'Test', ErrorSeverity.ERROR);
      
      const log = errorHandler.getLog();
      expect(log.length).toBe(3);
      expect(log[0].severity).toBe(ErrorSeverity.INFO);
      expect(log[1].severity).toBe(ErrorSeverity.WARNING);
      expect(log[2].severity).toBe(ErrorSeverity.ERROR);
    });
  });

  describe('getLog', () => {
    it('should return empty array initially', () => {
      const log = errorHandler.getLog();
      expect(log).toEqual([]);
    });

    it('should return errors in chronological order', () => {
      errorHandler.handle(new Error('First'), 'Test', ErrorSeverity.ERROR);
      errorHandler.handle(new Error('Second'), 'Test', ErrorSeverity.ERROR);
      
      const log = errorHandler.getLog();
      expect(log[0].message).toBe('First');
      expect(log[1].message).toBe('Second');
    });
  });

  describe('clearLog', () => {
    it('should clear the error log', () => {
      errorHandler.handle(new Error('Test'), 'Test', ErrorSeverity.ERROR);
      expect(errorHandler.getLog().length).toBe(1);
      
      errorHandler.clearLog();
      expect(errorHandler.getLog().length).toBe(0);
    });
  });
});

