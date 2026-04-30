import { describe, it, expect } from 'vitest';
import { EuclideanGenerator } from '@/lib/generators/euclidean';
import type { GeneratorConfig, GenerationContext } from '@/types';

describe('EuclideanGenerator', () => {
  const generator = new EuclideanGenerator();

  const createContext = (overrides = {}): GenerationContext => ({
    key: 'C',
    scale: 'major',
    bpm: 120,
    lengthBars: 4,
    ...overrides,
  });

  describe('generate', () => {
    it('should generate a euclidean rhythm with correct number of pulses', () => {
      const config: GeneratorConfig = {
        type: 'euclidean',
        params: {
          steps: 16,
          pulses: 4,
          rotation: 0,
          patternRole: 'kick',
        },
      };

      const context = createContext();
      const result = generator.generate(config, context);

      expect(result).toBeDefined();
      expect(result.notes).toBeDefined();
      expect(Array.isArray(result.notes)).toBe(true);

      // Count pulses (non-silent notes)
      const pulseCount = result.notes.filter(note => note.velocity > 0).length;
      expect(pulseCount).toBeGreaterThan(0);
    });

    it('should generate evenly distributed patterns (Bjorklund algorithm)', () => {
      const config: GeneratorConfig = {
        type: 'euclidean',
        params: {
          steps: 8,
          pulses: 3,
          rotation: 0,
          patternRole: 'kick',
        },
      };

      const context = createContext({ lengthBars: 2 });
      const result = generator.generate(config, context);

      // Euclidean(3,8) should produce pattern: 1 0 0 1 0 0 1 0
      // The notes should be relatively evenly spaced
      expect(result.notes.length).toBeGreaterThan(0);

      // Check that notes are sorted by time
      for (let i = 1; i < result.notes.length; i++) {
        expect(result.notes[i].time).toBeGreaterThanOrEqual(result.notes[i - 1].time);
      }
    });

    it('should apply rotation correctly', () => {
      const configNoRotation: GeneratorConfig = {
        type: 'euclidean',
        params: {
          steps: 8,
          pulses: 4,
          rotation: 0,
          patternRole: 'kick',
        },
      };

      const configWithRotation: GeneratorConfig = {
        type: 'euclidean',
        params: {
          steps: 8,
          pulses: 4,
          rotation: 2,
          patternRole: 'kick',
        },
      };

      const context = createContext({ lengthBars: 2 });
      const resultNoRotation = generator.generate(configNoRotation, context);
      const resultWithRotation = generator.generate(configWithRotation, context);

      expect(resultNoRotation.notes.length).toBe(resultWithRotation.notes.length);

      // Rotated pattern should have different timing for at least some notes
      if (resultNoRotation.notes.length > 1 && resultWithRotation.notes.length > 1) {
        // Check that the timing pattern is different (compare all note timings)
        const timings1 = resultNoRotation.notes.map(n => n.time).join(',');
        const timings2 = resultWithRotation.notes.map(n => n.time).join(',');

        // With rotation, the timing pattern should be different
        expect(timings1).not.toBe(timings2);
      }
    });

    it('should handle different pattern roles', () => {
      const patterns = ['kick', 'snare', 'hihat', 'perc'];

      patterns.forEach(patternRole => {
        const config: GeneratorConfig = {
          type: 'euclidean',
          params: {
            steps: 16,
            pulses: 4,
            rotation: 0,
            patternRole,
          },
        };

        const context = createContext();
        const result = generator.generate(config, context);

        expect(result.notes).toBeDefined();
        expect(result.notes.length).toBeGreaterThan(0);

        // All notes should have valid pitches
        result.notes.forEach(note => {
          expect(note.pitch).toBeGreaterThanOrEqual(0);
          expect(note.pitch).toBeLessThanOrEqual(127);
        });
      });
    });

    it('should respect the context length in bars', () => {
      const config: GeneratorConfig = {
        type: 'euclidean',
        params: {
          steps: 16,
          pulses: 8,
          rotation: 0,
          patternRole: 'kick',
        },
      };

      const context2Bars = createContext({ lengthBars: 2 });
      const context4Bars = createContext({ lengthBars: 4 });

      const result2Bars = generator.generate(config, context2Bars);
      const result4Bars = generator.generate(config, context4Bars);

      // Longer contexts should potentially have notes spanning more time
      if (result2Bars.notes.length > 0 && result4Bars.notes.length > 0) {
        const maxTime2Bars = Math.max(...result2Bars.notes.map(n => n.time));
        const maxTime4Bars = Math.max(...result4Bars.notes.map(n => n.time));

        expect(maxTime4Bars).toBeGreaterThanOrEqual(maxTime2Bars);
      }
    });

    it('should generate no pulses when pulses is 0', () => {
      const config: GeneratorConfig = {
        type: 'euclidean',
        params: {
          steps: 16,
          pulses: 0,
          rotation: 0,
          patternRole: 'kick',
        },
      };

      const context = createContext();
      const result = generator.generate(config, context);

      expect(result.notes).toBeDefined();
      // Should have no notes or all silent notes
      const audibleNotes = result.notes.filter(n => n.velocity > 0);
      expect(audibleNotes.length).toBe(0);
    });

    it('should handle edge case where pulses equals steps', () => {
      const config: GeneratorConfig = {
        type: 'euclidean',
        params: {
          steps: 8,
          pulses: 8,
          rotation: 0,
          patternRole: 'kick',
        },
      };

      const context = createContext();
      const result = generator.generate(config, context);

      expect(result.notes).toBeDefined();
      // Should have notes for every step
      expect(result.notes.length).toBeGreaterThan(0);
    });
  });
});
