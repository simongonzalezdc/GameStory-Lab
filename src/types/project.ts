/**
 * Core project type definitions
 */

export interface Project {
  schemaVersion: string; // "1.0.0"
  projectId: string; // Unique ID
  name: string;
  bpm: number; // Global tempo
  timeSignature: string; // "4/4", "3/4", etc.
  defaultKey: string; // "C", "G", etc.
  defaultScale: string; // "major", "minor", "dorian", etc.
  scenes: Scene[];
  globalMappings?: Mapping[];
  metadata: ProjectMetadata;
}

export interface ProjectMetadata {
  created: string; // ISO timestamp
  modified: string;
  author?: string;
  description?: string;
  tags?: string[];
}

export interface Scene {
  id: string;
  name: string;
  color?: string; // Hex color for UI
  bpm?: number; // Override global BPM
  key: string;
  scale: string;
  intensityRange: [number, number]; // [0-1, 0-1]
  tracks: Track[];
  mappings: Mapping[];
  transitions?: Transition[];
}

export interface Track {
  id: string;
  name?: string;
  role: TrackRole;
  instrumentRef: string; // References instrument preset
  clips: Clip[];
  volume: number; // 0-1
  pan: number; // -1 to 1
  muted: boolean;
  solo: boolean;
  effects?: EffectChain;
}

export type TrackRole = 'drums' | 'bass' | 'pad' | 'lead' | 'fx' | 'other';

export interface PianoRollNote {
  id: string;
  pitch: number; // MIDI note number
  time: number; // In bars
  duration: number; // In bars
  velocity: number; // 0-1
}

export interface Clip {
  id: string;
  lengthBars: number;
  generator: GeneratorConfig;
  density?: number; // 0-1, how many notes/events
  probability?: number; // 0-1, likelihood of playing
  muted: boolean;
  offset?: number; // Start offset in bars
  customNotes?: PianoRollNote[]; // Optional piano roll override data
}

export interface GeneratorConfig {
  type: GeneratorType;
  params: Record<string, any>; // Type-specific parameters
}

export type GeneratorType =
  | 'euclidean'
  | 'arp'
  | 'patternDSL'
  | 'markov'
  | 'randomWalk'
  | 'magenta'
  | 'audioModelStem';

// Generator-specific parameter types
export interface EuclideanParams {
  steps: number; // Total steps in pattern
  pulses: number; // Number of hits
  rotation: number; // Pattern rotation
  patternRole: 'kick' | 'snare' | 'hat' | 'perc' | 'bass' | 'melody';
}

export interface ArpParams {
  mode: 'up' | 'down' | 'upDown' | 'downUp' | 'random';
  notesPerBeat: number;
  octaveRange: number;
  followChordProgression: boolean;
}

export interface MarkovParams {
  order: 1 | 2 | 3; // Markov chain order
  seedMelody?: number[]; // MIDI note numbers
  length: number; // Number of notes to generate
}

export interface RandomWalkParams {
  stepSize: number; // 1-12 semitones
  stayInScale: boolean;
  length: number; // Number of notes
}

export interface PatternDSLParams {
  pattern: string; // Strudel pattern string
}

export interface Mapping {
  source: string; // Game variable name
  target: string; // Dot notation path (e.g., "scene.intensity")
  inputRange: [number, number];
  outputRange: [number, number];
  curve: MappingCurve;
}

export type MappingCurve = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'exponential';

export interface Transition {
  fromSceneId: string;
  toSceneId: string;
  conditions: string; // Simple expression DSL
  crossfadeBars: number;
}

export interface EffectChain {
  effects: Effect[];
}

export interface Effect {
  id: string;
  type: EffectType;
  params: Record<string, any>;
  enabled: boolean;
}

export type EffectType = 'reverb' | 'delay' | 'filter' | 'distortion' | 'compressor';
