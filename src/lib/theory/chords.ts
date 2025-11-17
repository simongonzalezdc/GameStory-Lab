/**
 * Music theory: Chords and progressions
 */

import { noteToMidi } from './scales';
import type { Chord, ChordType } from '@/types';

export const CHORD_INTERVALS: Record<ChordType, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  major7: [0, 4, 7, 11],
  minor7: [0, 3, 7, 10],
  dominant7: [0, 4, 7, 10],
};

/**
 * Get MIDI notes for a chord
 */
export function getChordNotes(root: string, type: ChordType, octave: number = 4): number[] {
  const rootMidi = noteToMidi(root, octave);
  const intervals = CHORD_INTERVALS[type] || CHORD_INTERVALS.major;
  return intervals.map((interval) => rootMidi + interval);
}

/**
 * Common chord progressions
 */
export const CHORD_PROGRESSIONS: Record<string, string[]> = {
  'I-IV-V-I': ['C', 'F', 'G', 'C'],
  'I-V-vi-IV': ['C', 'G', 'Am', 'F'],
  'ii-V-I': ['Dm', 'G', 'C'],
  'I-vi-IV-V': ['C', 'Am', 'F', 'G'],
  'I-IV-I-V': ['C', 'F', 'C', 'G'],
};

/**
 * Generate a chord progression in a given key
 */
export function generateProgression(
  key: string,
  progressionName: string,
  beatsPerChord: number = 4
): Chord[] {
  const pattern = CHORD_PROGRESSIONS[progressionName] || CHORD_PROGRESSIONS['I-IV-V-I'];

  return pattern.map((chordSymbol) => ({
    root: chordSymbol.replace(/m|maj|dim|aug|\d/g, ''),
    type: chordSymbol.includes('m') ? 'minor' : 'major',
    duration: beatsPerChord / 4, // Convert to bars
  }));
}
