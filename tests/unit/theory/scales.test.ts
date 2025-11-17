/**
 * Tests for scale theory utilities
 */

import { describe, it, expect } from 'vitest';
import {
  getScaleNotes,
  noteToMidi,
  midiToNote,
  quantizeToScale,
} from '@/lib/theory/scales';

describe('Scale Theory', () => {
  describe('noteToMidi', () => {
    it('should convert C4 to MIDI 60', () => {
      expect(noteToMidi('C', 4)).toBe(60);
    });

    it('should convert A4 to MIDI 69', () => {
      expect(noteToMidi('A', 4)).toBe(69);
    });

    it('should handle sharps', () => {
      expect(noteToMidi('C#', 4)).toBe(61);
    });

    it('should handle flats', () => {
      expect(noteToMidi('A#', 4)).toBe(70);
    });
  });

  describe('midiToNote', () => {
    it('should convert MIDI 60 to C4', () => {
      const result = midiToNote(60);
      expect(result.note).toBe('C');
      expect(result.octave).toBe(4);
    });

    it('should convert MIDI 69 to A4', () => {
      const result = midiToNote(69);
      expect(result.note).toBe('A');
      expect(result.octave).toBe(4);
    });
  });

  describe('getScaleNotes', () => {
    it('should return C major scale notes', () => {
      const notes = getScaleNotes('C', 'major', 4, 4);
      expect(notes).toContain(60); // C4
      expect(notes).toContain(62); // D4
      expect(notes).toContain(64); // E4
      expect(notes).toContain(65); // F4
      expect(notes).toContain(67); // G4
      expect(notes).toContain(69); // A4
      expect(notes).toContain(71); // B4
    });

    it('should return A minor scale notes', () => {
      const notes = getScaleNotes('A', 'minor', 4, 4);
      // A minor scale starting at A4 (octave 4)
      expect(notes).toContain(69); // A4
      expect(notes).toContain(71); // B4
      expect(notes).toContain(72); // C5
      expect(notes).toContain(74); // D5
      expect(notes).toContain(76); // E5
      expect(notes).toContain(77); // F5
      expect(notes).toContain(79); // G5
    });

    it('should handle different octaves', () => {
      const notes = getScaleNotes('C', 'major', 3, 5);
      expect(notes.length).toBeGreaterThan(7);
      expect(notes[0]).toBeLessThan(notes[notes.length - 1]);
    });
  });

  describe('quantizeToScale', () => {
    it('should quantize note to nearest scale note', () => {
      const scaleNotes = getScaleNotes('C', 'major', 4, 4);
      // 61 is C#4, should quantize to C4 (60) or D4 (62)
      const quantized = quantizeToScale(61, 'C', 'major', scaleNotes);
      expect([60, 62]).toContain(quantized);
    });

    it('should return same note if already in scale', () => {
      const scaleNotes = getScaleNotes('C', 'major', 4, 4);
      const quantized = quantizeToScale(60, 'C', 'major', scaleNotes); // C4
      expect(quantized).toBe(60);
    });
  });
});

