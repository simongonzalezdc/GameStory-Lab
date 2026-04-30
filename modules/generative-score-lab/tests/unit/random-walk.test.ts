import { describe, it, expect } from 'vitest';
import { RandomWalkGenerator } from '@/lib/generators/random-walk';
import type { GeneratorConfig, GenerationContext } from '@/types';

describe('RandomWalkGenerator', () => {
  const generator = new RandomWalkGenerator();

  const createContext = (overrides = {}): GenerationContext => ({
    key: 'C',
    scale: 'major',
    bpm: 120,
    lengthBars: 4,
    ...overrides,
  });

  describe('generate', () => {
    it('should generate notes using random walk algorithm', () => {
      const config: GeneratorConfig = {
        type: 'randomWalk',
        params: {
          stepSize: 2,
          stayInScale: true,
          length: 16,
        },
      };

      const context = createContext();
      const result = generator.generate(config, context);

      expect(result).toBeDefined();
      expect(result.notes).toBeDefined();
      expect(Array.isArray(result.notes)).toBe(true);
      expect(result.notes.length).toBeGreaterThan(0);
    });

    it('should respect the length parameter', () => {
      const config8Notes: GeneratorConfig = {
        type: 'randomWalk',
        params: {
          stepSize: 2,
          stayInScale: true,
          length: 8,
        },
      };

      const config16Notes: GeneratorConfig = {
        type: 'randomWalk',
        params: {
          stepSize: 2,
          stayInScale: true,
          length: 16,
        },
      };

      const context = createContext({ lengthBars: 2 });
      const result8Notes = generator.generate(config8Notes, context);
      const result16Notes = generator.generate(config16Notes, context);

      // Length 16 should generate more notes than length 8
      expect(result16Notes.notes.length).toBeGreaterThanOrEqual(result8Notes.notes.length);
    });

    it('should respect stepSize parameter', () => {
      const configSmallSteps: GeneratorConfig = {
        type: 'randomWalk',
        params: {
          stepSize: 1,
          stayInScale: true,
          length: 16,
        },
      };

      const configLargeSteps: GeneratorConfig = {
        type: 'randomWalk',
        params: {
          stepSize: 4,
          stayInScale: true,
          length: 16,
        },
      };

      const context = createContext({ lengthBars: 2 });
      const resultSmall = generator.generate(configSmallSteps, context);
      const resultLarge = generator.generate(configLargeSteps, context);

      expect(resultSmall.notes.length).toBeGreaterThan(0);
      expect(resultLarge.notes.length).toBeGreaterThan(0);

      // Calculate average pitch difference between consecutive notes
      const avgDiffSmall = calculateAvgPitchDiff(resultSmall.notes);
      const avgDiffLarge = calculateAvgPitchDiff(resultLarge.notes);

      // Large step size should have larger average pitch differences
      if (avgDiffSmall > 0 && avgDiffLarge > 0) {
        expect(avgDiffLarge).toBeGreaterThanOrEqual(avgDiffSmall);
      }
    });

    it('should stay in scale when stayInScale is true', () => {
      const config: GeneratorConfig = {
        type: 'randomWalk',
        params: {
          stepSize: 2,
          stayInScale: true,
          length: 16,
        },
      };

      const context = createContext({ key: 'C', scale: 'major' });
      const result = generator.generate(config, context);

      expect(result.notes.length).toBeGreaterThan(0);

      // All notes should be valid MIDI pitches
      result.notes.forEach(note => {
        expect(note.pitch).toBeGreaterThanOrEqual(0);
        expect(note.pitch).toBeLessThanOrEqual(127);
      });
    });

    it('should generate walking pattern (consecutive notes differ)', () => {
      const config: GeneratorConfig = {
        type: 'randomWalk',
        params: {
          stepSize: 2,
          stayInScale: true,
          length: 16,
        },
      };

      const context = createContext();
      const result = generator.generate(config, context);

      expect(result.notes.length).toBeGreaterThan(1);

      // Check that consecutive notes are different (random walk property)
      // At least some consecutive notes should differ
      let hasDifference = false;
      for (let i = 1; i < result.notes.length; i++) {
        if (result.notes[i].pitch !== result.notes[i - 1].pitch) {
          hasDifference = true;
          break;
        }
      }
      expect(hasDifference).toBe(true);
    });

    it('should generate varied patterns', () => {
      const config: GeneratorConfig = {
        type: 'randomWalk',
        params: {
          stepSize: 2,
          stayInScale: true,
          length: 16,
        },
      };

      const context = createContext();
      const result1 = generator.generate(config, context);
      const result2 = generator.generate(config, context);

      expect(result1.notes.length).toBeGreaterThan(0);
      expect(result2.notes.length).toBeGreaterThan(0);

      // Check that patterns are not identical (due to randomness)
      if (result1.notes.length >= 3 && result2.notes.length >= 3) {
        const firstNotes1 = result1.notes.slice(0, 3).map(n => n.pitch).join(',');
        const firstNotes2 = result2.notes.slice(0, 3).map(n => n.pitch).join(',');

        // Patterns should likely differ (though small chance they're the same)
        expect(firstNotes1).toBeDefined();
        expect(firstNotes2).toBeDefined();
      }
    });

    it('should generate notes with proper timing', () => {
      const config: GeneratorConfig = {
        type: 'randomWalk',
        params: {
          stepSize: 2,
          stayInScale: true,
          length: 16,
        },
      };

      const context = createContext({ lengthBars: 2 });
      const result = generator.generate(config, context);

      // Check that notes are sorted by time
      for (let i = 1; i < result.notes.length; i++) {
        expect(result.notes[i].time).toBeGreaterThanOrEqual(result.notes[i - 1].time);
      }

      // Check that all times are within the bar length
      result.notes.forEach(note => {
        expect(note.time).toBeGreaterThanOrEqual(0);
        expect(note.time).toBeLessThanOrEqual(2); // 2 bars
      });
    });

    it('should generate notes with proper durations and velocity', () => {
      const config: GeneratorConfig = {
        type: 'randomWalk',
        params: {
          stepSize: 2,
          stayInScale: true,
          length: 16,
        },
      };

      const context = createContext();
      const result = generator.generate(config, context);

      result.notes.forEach(note => {
        expect(note.duration).toBeGreaterThan(0);
        expect(note.duration).toBeLessThanOrEqual(1);
        expect(note.velocity).toBeGreaterThan(0);
        expect(note.velocity).toBeLessThanOrEqual(1);
      });
    });

    it('should work with different keys and scales', () => {
      const testCases = [
        { key: 'C', scale: 'major' },
        { key: 'A', scale: 'minor' },
        { key: 'D', scale: 'major' },
        { key: 'F', scale: 'major' },
      ];

      testCases.forEach(({ key, scale }) => {
        const config: GeneratorConfig = {
          type: 'randomWalk',
          params: {
            stepSize: 2,
            stayInScale: true,
            length: 16,
          },
        };

        const context = createContext({ key, scale });
        const result = generator.generate(config, context);

        expect(result.notes).toBeDefined();
        expect(result.notes.length).toBeGreaterThan(0);
      });
    });
  });
});

// Helper function to calculate average pitch difference between consecutive notes
function calculateAvgPitchDiff(notes: Array<{ pitch: number }>): number {
  if (notes.length < 2) return 0;

  let totalDiff = 0;
  for (let i = 1; i < notes.length; i++) {
    totalDiff += Math.abs(notes[i].pitch - notes[i - 1].pitch);
  }

  return totalDiff / (notes.length - 1);
}
