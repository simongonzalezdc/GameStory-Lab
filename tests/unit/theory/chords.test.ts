/**
 * Tests for chord theory utilities
 */

import { describe, it, expect } from 'vitest';
import { getChordNotes } from '@/lib/theory/chords';

describe('Chord Theory', () => {
  describe('getChordNotes', () => {
    it('should return C major chord notes', () => {
      const notes = getChordNotes('C', 'major', 4);
      expect(notes).toContain(60); // C4
      expect(notes).toContain(64); // E4
      expect(notes).toContain(67); // G4
    });

    it('should return A minor chord notes', () => {
      const notes = getChordNotes('A', 'minor', 4);
      expect(notes).toContain(57); // A4
      expect(notes).toContain(60); // C5
      expect(notes).toContain(64); // E5
    });

    it('should handle different octaves', () => {
      const notes = getChordNotes('C', 'major', 3);
      expect(notes[0]).toBeLessThan(60); // Should be in octave 3
    });

    it('should return correct number of notes', () => {
      const notes = getChordNotes('C', 'major', 4);
      expect(notes.length).toBe(3);
    });
  });
});

