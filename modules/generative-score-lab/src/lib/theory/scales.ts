/**
 * Music theory: Scales and note calculations
 */

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const ENHARMONIC_EQUIVALENTS: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Fb: 'E',
  'E#': 'F',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
  Cb: 'B',
  'B#': 'C',
};

export const SCALE_INTERVALS: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10], // Natural minor
  locrian: [0, 1, 3, 5, 6, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],
  pentatonicMajor: [0, 2, 4, 7, 9],
  pentatonicMinor: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

/**
 * Get MIDI note number from note name and octave
 */
export function noteToMidi(note: string, octave: number): number {
  const noteIndex = NOTES.indexOf(note.toUpperCase());
  if (noteIndex === -1) return 60; // Default to middle C
  return 12 * (octave + 1) + noteIndex;
}

/**
 * Get note name and octave from MIDI note number
 */
export function midiToNote(midi: number): { note: string; octave: number } {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return {
    note: NOTES[noteIndex],
    octave,
  };
}

/**
 * Convert a note name (e.g., "C#4", "Bb3") to a MIDI note number.
 */
export function noteNameToMidi(noteName: string): number {
  const match = noteName.match(/^([A-Ga-g][#b]?)(-?\d+)$/);
  if (!match) {
    return 60; // Default to middle C on invalid input
  }

  const [, rawNote, octaveStr] = match;
  const normalizedNote =
    ENHARMONIC_EQUIVALENTS[formatNoteName(rawNote)] ?? formatNoteName(rawNote);
  const octave = parseInt(octaveStr, 10);

  return noteToMidi(normalizedNote, octave);
}

function formatNoteName(note: string): string {
  if (note.length === 1) {
    return note.toUpperCase();
  }

  return note[0].toUpperCase() + note.slice(1);
}

/**
 * Get all MIDI notes in a scale
 */
export function getScaleNotes(
  rootNote: string,
  scaleName: string,
  startOctave: number,
  endOctave: number
): number[] {
  const intervals = SCALE_INTERVALS[scaleName] || SCALE_INTERVALS.major;
  const notes: number[] = [];

  for (let octave = startOctave; octave <= endOctave; octave++) {
    intervals.forEach((interval) => {
      const midi = noteToMidi(rootNote, octave) + interval;
      if (midi >= 0 && midi <= 127) {
        notes.push(midi);
      }
    });
  }

  return notes.sort((a, b) => a - b);
}

/**
 * Snap a MIDI note to the nearest note in a scale
 * For better performance, pass pre-computed scaleNotes if calling repeatedly
 */
export function quantizeToScale(
  midi: number,
  rootNote: string,
  scaleName: string,
  scaleNotes?: number[]
): number {
  const notes = scaleNotes || getScaleNotes(rootNote, scaleName, 0, 10);
  return notes.reduce((closest, note) =>
    Math.abs(note - midi) < Math.abs(closest - midi) ? note : closest
  );
}

/**
 * Get interval in semitones between two notes
 */
export function getInterval(note1: number, note2: number): number {
  return Math.abs(note2 - note1);
}
