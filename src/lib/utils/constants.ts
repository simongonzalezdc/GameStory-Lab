/**
 * Global constants for the application
 */

export const DEFAULT_BPM = 120;
export const DEFAULT_TIME_SIGNATURE = '4/4';
export const DEFAULT_KEY = 'C';
export const DEFAULT_SCALE = 'major';
export const DEFAULT_INTENSITY_RANGE: [number, number] = [0.2, 0.8];

export const MIN_BPM = 40;
export const MAX_BPM = 300;

export const MAX_SCENES_PER_PROJECT = 50;
export const MAX_TRACKS_PER_SCENE = 16;
export const MAX_CLIPS_PER_TRACK = 32;

export const AUDIO_LATENCY_MS = 100;
export const GENERATOR_TIMEOUT_MS = 1000;

export const SCHEMA_VERSION = '1.0.0';
