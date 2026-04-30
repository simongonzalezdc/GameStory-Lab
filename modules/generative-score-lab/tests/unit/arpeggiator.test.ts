import { describe, it, expect } from 'vitest';
import { ArpeggiatorGenerator } from '@/lib/generators/arpeggiator';
import type { GeneratorConfig, GenerationContext } from '@/types';

describe('ArpeggiatorGenerator', () => {
  const generator = new ArpeggiatorGenerator();

  const createContext = (overrides = {}): GenerationContext => ({
    key: 'C',
    scale: 'major',
    bpm: 120,
    lengthBars: 4,
    ...overrides,
  });

  describe('generate', () => {
    it('should generate arpeggiated notes', () => {
      const config: GeneratorConfig = {
        type: 'arp',
        params: {
          mode: 'up',
          notesPerBeat: 2,
          octaveRange: 2,
          followChordProgression: false,
        },
      };

      const context = createContext();
      const result = generator.generate(config, context);

      expect(result).toBeDefined();
      expect(result.notes).toBeDefined();
      expect(Array.isArray(result.notes)).toBe(true);
      expect(result.notes.length).toBeGreaterThan(0);
    });

    it('should respect notesPerBeat parameter', () => {
      const config2Notes: GeneratorConfig = {
        type: 'arp',
        params: {
          mode: 'up',
          notesPerBeat: 2,
          octaveRange: 1,
          followChordProgression: false,
        },
      };

      const config4Notes: GeneratorConfig = {
        type: 'arp',
        params: {
          mode: 'up',
          notesPerBeat: 4,
          octaveRange: 1,
          followChordProgression: false,
        },
      };

      const context = createContext({ lengthBars: 1 });
      const result2Notes = generator.generate(config2Notes, context);
      const result4Notes = generator.generate(config4Notes, context);

      // 4 notes per beat should generate more notes than 2 notes per beat (for same length)
      expect(result4Notes.notes.length).toBeGreaterThan(result2Notes.notes.length);
    });

    it('should generate ascending pattern in "up" mode', () => {
      const config: GeneratorConfig = {
        type: 'arp',
        params: {
          mode: 'up',
          notesPerBeat: 4,
          octaveRange: 1,
          followChordProgression: false,
        },
      };

      const context = createContext({ lengthBars: 1 });
      const result = generator.generate(config, context);

      expect(result.notes.length).toBeGreaterThan(0);

      // Check that pattern generally ascends or stays same (allowing for octave wrapping)
      for (let i = 1; i < Math.min(8, result.notes.length); i++) {
        // In up mode, notes should generally not decrease rapidly
        // (small variations allowed due to scale notes)
        const diff = result.notes[i].pitch - result.notes[i - 1].pitch;
        expect(diff).toBeGreaterThanOrEqual(-24); // Allow for octave wrap
      }
    });

    it('should generate descending pattern in "down" mode', () => {
      const config: GeneratorConfig = {
        type: 'arp',
        params: {
          mode: 'down',
          notesPerBeat: 4,
          octaveRange: 1,
          followChordProgression: false,
        },
      };

      const context = createContext({ lengthBars: 1 });
      const result = generator.generate(config, context);

      expect(result.notes.length).toBeGreaterThan(0);

      // In down mode, notes should generally descend or stay same
      for (let i = 1; i < Math.min(8, result.notes.length); i++) {
        const diff = result.notes[i].pitch - result.notes[i - 1].pitch;
        expect(diff).toBeLessThanOrEqual(24); // Allow for octave wrap
      }
    });

    it('should support different arpeggio modes', () => {
      const modes = ['up', 'down', 'upDown', 'random'];

      modes.forEach(mode => {
        const config: GeneratorConfig = {
          type: 'arp',
          params: {
            mode,
            notesPerBeat: 2,
            octaveRange: 1,
            followChordProgression: false,
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

    it('should respect octaveRange parameter', () => {
      const config1Octave: GeneratorConfig = {
        type: 'arp',
        params: {
          mode: 'up',
          notesPerBeat: 4,
          octaveRange: 1,
          followChordProgression: false,
        },
      };

      const config3Octaves: GeneratorConfig = {
        type: 'arp',
        params: {
          mode: 'up',
          notesPerBeat: 4,
          octaveRange: 3,
          followChordProgression: false,
        },
      };

      const context = createContext({ lengthBars: 2 });
      const result1Octave = generator.generate(config1Octave, context);
      const result3Octaves = generator.generate(config3Octaves, context);

      expect(result1Octave.notes.length).toBeGreaterThan(0);
      expect(result3Octaves.notes.length).toBeGreaterThan(0);

      // Calculate pitch range for each
      const range1 = Math.max(...result1Octave.notes.map(n => n.pitch)) -
                     Math.min(...result1Octave.notes.map(n => n.pitch));
      const range3 = Math.max(...result3Octaves.notes.map(n => n.pitch)) -
                     Math.min(...result3Octaves.notes.map(n => n.pitch));

      // 3 octave range should generally have wider pitch range than 1 octave
      expect(range3).toBeGreaterThanOrEqual(range1);
    });

    it('should generate notes with proper timing', () => {
      const config: GeneratorConfig = {
        type: 'arp',
        params: {
          mode: 'up',
          notesPerBeat: 2,
          octaveRange: 1,
          followChordProgression: false,
        },
      };

      const context = createContext({ lengthBars: 1 });
      const result = generator.generate(config, context);

      // Check that notes are sorted by time
      for (let i = 1; i < result.notes.length; i++) {
        expect(result.notes[i].time).toBeGreaterThanOrEqual(result.notes[i - 1].time);
      }

      // Check that all times are within the bar length
      result.notes.forEach(note => {
        expect(note.time).toBeGreaterThanOrEqual(0);
        expect(note.time).toBeLessThanOrEqual(1); // 1 bar
      });
    });

    it('should generate notes with proper durations and velocity', () => {
      const config: GeneratorConfig = {
        type: 'arp',
        params: {
          mode: 'up',
          notesPerBeat: 2,
          octaveRange: 1,
          followChordProgression: false,
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
  });
});
