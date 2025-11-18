/**
 * Tests for time utilities
 */

import { describe, it, expect } from 'vitest';
import {
  barsToSeconds,
  secondsToBars,
  beatsToBars,
  barsToBeats,
} from '@/lib/utils/time';

describe('Time Utilities', () => {
  describe('barsToSeconds', () => {
    it('should convert bars to seconds at 120 BPM', () => {
      const result = barsToSeconds(1, 120);
      expect(result).toBeCloseTo(2, 5); // 1 bar = 4 beats, 120 BPM = 2 beats/sec, 4/2 = 2 seconds
    });

    it('should convert bars to seconds at 60 BPM', () => {
      const result = barsToSeconds(1, 60);
      expect(result).toBeCloseTo(4, 5); // 1 bar = 4 beats, 60 BPM = 1 beat/sec, 4/1 = 4 seconds
    });

    it('should handle fractional bars', () => {
      const result = barsToSeconds(0.5, 120);
      expect(result).toBeCloseTo(1, 5);
    });

    it('should handle different time signatures', () => {
      const result = barsToSeconds(1, 120, '3/4');
      expect(result).toBeCloseTo(1.5, 5); // 1 bar = 3 beats, 120 BPM = 2 beats/sec, 3/2 = 1.5 seconds
    });

    it('should handle multiple bars', () => {
      const result = barsToSeconds(4, 120);
      expect(result).toBeCloseTo(8, 5);
    });

    it('should default to 4/4 time signature', () => {
      const result1 = barsToSeconds(1, 120);
      const result2 = barsToSeconds(1, 120, '4/4');
      expect(result1).toBe(result2);
    });
  });

  describe('secondsToBars', () => {
    it('should convert seconds to bars at 120 BPM', () => {
      const result = secondsToBars(2, 120);
      expect(result).toBeCloseTo(1, 5);
    });

    it('should convert seconds to bars at 60 BPM', () => {
      const result = secondsToBars(4, 60);
      expect(result).toBeCloseTo(1, 5);
    });

    it('should handle fractional seconds', () => {
      const result = secondsToBars(1, 120);
      expect(result).toBeCloseTo(0.5, 5);
    });

    it('should handle different time signatures', () => {
      const result = secondsToBars(1.5, 120, '3/4');
      expect(result).toBeCloseTo(1, 5);
    });

    it('should be inverse of barsToSeconds', () => {
      const bars = 2.5;
      const seconds = barsToSeconds(bars, 120);
      const backToBars = secondsToBars(seconds, 120);
      expect(backToBars).toBeCloseTo(bars, 10);
    });
  });

  describe('beatsToBars', () => {
    it('should convert beats to bars in 4/4', () => {
      expect(beatsToBars(4)).toBeCloseTo(1, 5);
    });

    it('should convert beats to bars in 3/4', () => {
      expect(beatsToBars(3, '3/4')).toBeCloseTo(1, 5);
    });

    it('should handle fractional beats', () => {
      expect(beatsToBars(2)).toBeCloseTo(0.5, 5);
    });

    it('should handle multiple bars worth of beats', () => {
      expect(beatsToBars(16)).toBeCloseTo(4, 5);
    });

    it('should default to 4/4 time signature', () => {
      const result1 = beatsToBars(8);
      const result2 = beatsToBars(8, '4/4');
      expect(result1).toBe(result2);
    });
  });

  describe('barsToBeats', () => {
    it('should convert bars to beats in 4/4', () => {
      expect(barsToBeats(1)).toBe(4);
    });

    it('should convert bars to beats in 3/4', () => {
      expect(barsToBeats(1, '3/4')).toBe(3);
    });

    it('should handle fractional bars', () => {
      expect(barsToBeats(0.5)).toBe(2);
    });

    it('should handle multiple bars', () => {
      expect(barsToBeats(4)).toBe(16);
    });

    it('should be inverse of beatsToBars', () => {
      const beats = 12;
      const bars = beatsToBars(beats);
      const backToBeats = barsToBeats(bars);
      expect(backToBeats).toBe(beats);
    });

    it('should default to 4/4 time signature', () => {
      const result1 = barsToBeats(2);
      const result2 = barsToBeats(2, '4/4');
      expect(result1).toBe(result2);
    });

    it('should handle 6/8 time signature', () => {
      expect(barsToBeats(1, '6/8')).toBe(6);
    });
  });
});
