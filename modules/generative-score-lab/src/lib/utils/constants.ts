/**
 * Global constants for the application
 * Centralizes magic numbers and configuration values
 */

// ===== MUSIC THEORY =====
export const DEFAULT_BPM = 120;
export const DEFAULT_TIME_SIGNATURE = '4/4';
export const DEFAULT_KEY = 'C';
export const DEFAULT_SCALE = 'major';
export const DEFAULT_INTENSITY_RANGE: [number, number] = [0.2, 0.8];

export const MIN_BPM = 40;
export const MAX_BPM = 300;

export const MIDI_NOTE_MIN = 0;
export const MIDI_NOTE_MAX = 127;
export const MIDI_MIDDLE_C = 60;

// ===== PROJECT LIMITS =====
export const MAX_SCENES_PER_PROJECT = 50;
export const MAX_TRACKS_PER_SCENE = 16;
export const MAX_CLIPS_PER_TRACK = 32;
export const MAX_FILENAME_LENGTH = 255;

// ===== AUDIO =====
export const DEFAULT_VOLUME = 0.8;
export const DEFAULT_PAN = 0;
export const DEFAULT_ATTACK = 0.02;
export const DEFAULT_DECAY = 0.1;
export const DEFAULT_SUSTAIN = 0.3;
export const DEFAULT_RELEASE = 0.5;
export const AUDIO_LATENCY_MS = 100;
export const AUDIO_INIT_RETRY_BASE_DELAY_MS = 500; // Base delay for exponential backoff
export const AUDIO_INIT_MAX_RETRIES = 3;
export const AUDIO_FILTER_DEFAULT_FREQUENCY = 2000; // Hz
export const AUDIO_FILTER_DEFAULT_Q = 1;

// ===== GENERATORS =====
export const DEFAULT_EUCLIDEAN_STEPS = 16;
export const DEFAULT_EUCLIDEAN_PULSES = 4;
export const DEFAULT_ARP_NOTES_PER_BEAT = 2;
export const DEFAULT_MARKOV_ORDER = 1;
export const DEFAULT_MARKOV_LENGTH = 16;
export const DEFAULT_RANDOM_WALK_STEP_SIZE = 2;
export const DEFAULT_CLIP_LENGTH_BARS = 4;
export const GENERATOR_TIMEOUT_MS = 1000;

// ===== UI TIMING =====
export const TUTORIAL_START_DELAY = 500; // ms
export const ERROR_NOTIFICATION_DURATION = 5000; // ms
export const CRITICAL_ERROR_DURATION = 10000; // ms
export const AUTO_SAVE_INTERVAL = 60000; // ms (1 minute)

// ===== ERROR HANDLING =====
export const MAX_ERROR_LOG_SIZE = 100;

// ===== GENERAL MIDI =====
export const GM_DRUM_CHANNEL = 9; // MIDI channel 10 (0-indexed)
export const GM_INSTRUMENTS = {
  ACOUSTIC_GRAND_PIANO: 0,
  ACOUSTIC_BASS: 33,
  PAD_WARM: 89,
  LEAD_SAWTOOTH: 81,
  FX_ATMOSPHERE: 99,
} as const;

// ===== SCHEMA =====
export const SCHEMA_VERSION = '1.0.0';
