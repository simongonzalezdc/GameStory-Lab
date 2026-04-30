/**
 * Tests for math utilities
 */

import { describe, it, expect } from 'vitest';
import {
  clamp,
  lerp,
  mapRange,
  easeIn,
  easeOut,
  easeInOut,
  exponential,
  randomInt,
  randomFloat,
  randomChoice,
} from '@/lib/utils/math';

describe('Math Utilities', () => {
  describe('clamp', () => {
    it('should clamp value to minimum', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('should clamp value to maximum', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should return value if within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('should handle equal min and max', () => {
      expect(clamp(5, 10, 10)).toBe(10);
    });

    it('should handle negative ranges', () => {
      expect(clamp(-15, -10, -5)).toBe(-10);
      expect(clamp(-3, -10, -5)).toBe(-5);
    });
  });

  describe('lerp', () => {
    it('should interpolate at t=0', () => {
      expect(lerp(0, 10, 0)).toBe(0);
    });

    it('should interpolate at t=1', () => {
      expect(lerp(0, 10, 1)).toBe(10);
    });

    it('should interpolate at t=0.5', () => {
      expect(lerp(0, 10, 0.5)).toBe(5);
    });

    it('should handle negative values', () => {
      expect(lerp(-10, 10, 0.5)).toBe(0);
    });

    it('should handle extrapolation', () => {
      expect(lerp(0, 10, 1.5)).toBe(15);
    });
  });

  describe('mapRange', () => {
    it('should map value from one range to another', () => {
      expect(mapRange(5, 0, 10, 0, 100)).toBe(50);
    });

    it('should handle inverted ranges', () => {
      expect(mapRange(5, 0, 10, 100, 0)).toBe(50);
    });

    it('should handle negative ranges', () => {
      expect(mapRange(0, -10, 10, 0, 100)).toBe(50);
    });

    it('should handle zero input range', () => {
      expect(mapRange(5, 10, 10, 0, 100)).toBe(50);
    });

    it('should map minimum value', () => {
      expect(mapRange(0, 0, 10, 0, 100)).toBe(0);
    });

    it('should map maximum value', () => {
      expect(mapRange(10, 0, 10, 0, 100)).toBe(100);
    });
  });

  describe('easeIn', () => {
    it('should return 0 at t=0', () => {
      expect(easeIn(0)).toBe(0);
    });

    it('should return 1 at t=1', () => {
      expect(easeIn(1)).toBe(1);
    });

    it('should be slower at start', () => {
      const result = easeIn(0.5);
      expect(result).toBeLessThan(0.5);
    });

    it('should produce quadratic curve', () => {
      expect(easeIn(0.5)).toBe(0.25);
    });
  });

  describe('easeOut', () => {
    it('should return 0 at t=0', () => {
      expect(easeOut(0)).toBe(0);
    });

    it('should return 1 at t=1', () => {
      expect(easeOut(1)).toBe(1);
    });

    it('should be faster at start', () => {
      const result = easeOut(0.5);
      expect(result).toBeGreaterThan(0.5);
    });
  });

  describe('easeInOut', () => {
    it('should return 0 at t=0', () => {
      expect(easeInOut(0)).toBe(0);
    });

    it('should return 1 at t=1', () => {
      expect(easeInOut(1)).toBe(1);
    });

    it('should return 0.5 at t=0.5', () => {
      expect(easeInOut(0.5)).toBe(0.5);
    });

    it('should be slower at start and end', () => {
      expect(easeInOut(0.25)).toBeLessThan(0.25);
      expect(easeInOut(0.75)).toBeGreaterThan(0.75);
    });
  });

  describe('exponential', () => {
    it('should return 0 at t=0', () => {
      expect(exponential(0)).toBe(0);
    });

    it('should return 1 at t=1', () => {
      expect(exponential(1)).toBeCloseTo(1, 5);
    });

    it('should produce exponential curve', () => {
      expect(exponential(0.5)).toBeCloseTo(0.03125, 5);
    });
  });

  describe('randomInt', () => {
    it('should generate integer within range', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomInt(0, 10);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(10);
        expect(Number.isInteger(result)).toBe(true);
      }
    });

    it('should handle single value range', () => {
      expect(randomInt(5, 5)).toBe(5);
    });

    it('should handle negative ranges', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomInt(-10, -5);
        expect(result).toBeGreaterThanOrEqual(-10);
        expect(result).toBeLessThanOrEqual(-5);
      }
    });
  });

  describe('randomFloat', () => {
    it('should generate float within range', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomFloat(0, 10);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(10);
      }
    });

    it('should handle negative ranges', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomFloat(-10, -5);
        expect(result).toBeGreaterThanOrEqual(-10);
        expect(result).toBeLessThanOrEqual(-5);
      }
    });

    it('should generate floats (not integers)', () => {
      let foundFloat = false;
      for (let i = 0; i < 100; i++) {
        const result = randomFloat(0, 1);
        if (!Number.isInteger(result) && result !== 0 && result !== 1) {
          foundFloat = true;
          break;
        }
      }
      expect(foundFloat).toBe(true);
    });
  });

  describe('randomChoice', () => {
    it('should pick element from array', () => {
      const arr = [1, 2, 3, 4, 5];
      for (let i = 0; i < 100; i++) {
        const result = randomChoice(arr);
        expect(arr).toContain(result);
      }
    });

    it('should handle single element array', () => {
      expect(randomChoice([42])).toBe(42);
    });

    it('should throw error for empty array', () => {
      expect(() => randomChoice([])).toThrow('Cannot pick random element from empty array');
    });

    it('should work with different types', () => {
      const strArr = ['a', 'b', 'c'];
      const result = randomChoice(strArr);
      expect(strArr).toContain(result);
      expect(typeof result).toBe('string');
    });
  });
});
