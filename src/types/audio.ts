/**
 * Audio engine and playback types
 */

export interface NoteSequence {
  notes: Note[];
  duration: number; // In bars
}

export interface Note {
  time: number; // In bars (0-based)
  pitch: number; // MIDI note number (0-127)
  duration: number; // In bars
  velocity: number; // 0-1
}

export interface GenerationContext {
  bpm: number;
  key: string;
  scale: string;
  chordProgression?: Chord[];
  lengthBars: number;
}

export interface Chord {
  root: string; // Note name (C, D, E, etc.)
  type: ChordType;
  duration: number; // In bars
}

export type ChordType =
  | 'major'
  | 'minor'
  | 'diminished'
  | 'augmented'
  | 'major7'
  | 'minor7'
  | 'dominant7';

export interface Instrument {
  id: string;
  name: string;
  type: InstrumentType;
  samples?: SampleMap;
  synthParams?: SynthParams;
}

export type InstrumentType = 'sampler' | 'synth';

export interface SampleMap {
  [note: string]: string; // Note name -> audio file URL
}

export interface SynthParams {
  oscillator: {
    type: 'sine' | 'square' | 'sawtooth' | 'triangle';
  };
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
}

export interface AudioEngineState {
  isInitialized: boolean;
  isPlaying: boolean;
  currentTime: number; // In bars
  currentScene: string | null;
}
