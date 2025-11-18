/**
 * Instrument definitions and factory
 */

import * as Tone from 'tone';
import type { TrackRole } from '@/types';
import { AUDIO_FILTER_DEFAULT_FREQUENCY, AUDIO_FILTER_DEFAULT_Q } from '@/lib/utils/constants';
import {
  SafeOscillatorType,
  toToneOscillatorConfig,
  toPolySynthOptions,
} from '@/types/tone-helpers';

export type InstrumentType = 'synth' | 'sampler' | 'fm' | 'am' | 'mono' | 'duo';

export interface InstrumentConfig {
  id: string;
  type: InstrumentType;
  name: string;
  description: string;
  oscillator?: {
    type: Tone.ToneOscillatorType;
    partials?: number[];
  };
  envelope?: {
    attack?: number;
    decay?: number;
    sustain?: number;
    release?: number;
  };
  filter?: {
    type: 'lowpass' | 'highpass' | 'bandpass';
    frequency?: number;
    Q?: number;
  };
  samplerUrls?: Record<string, string>; // For sampler instruments: note -> URL mapping
}

/**
 * Instrument presets by role
 */
export const INSTRUMENT_PRESETS: Record<TrackRole, InstrumentConfig[]> = {
  drums: [
    {
      id: 'kick',
      type: 'synth',
      name: 'Kick',
      description: 'Deep kick drum',
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.2 },
    },
    {
      id: 'snare',
      type: 'synth',
      name: 'Snare',
      description: 'Snappy snare',
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 },
    },
  ],
  bass: [
    {
      id: 'bass-synth',
      type: 'mono',
      name: 'Bass Synth',
      description: 'Deep bass synthesizer',
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.3 },
      filter: { type: 'lowpass', frequency: 800, Q: 1 },
    },
    {
      id: 'fm-bass',
      type: 'fm',
      name: 'FM Bass',
      description: 'FM synthesis bass',
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.2 },
    },
  ],
  pad: [
    {
      id: 'warm-pad',
      type: 'synth',
      name: 'Warm Pad',
      description: 'Smooth pad sound',
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.5, decay: 0.3, sustain: 0.7, release: 1.0 },
      filter: { type: 'lowpass', frequency: AUDIO_FILTER_DEFAULT_FREQUENCY, Q: AUDIO_FILTER_DEFAULT_Q },
    },
    {
      id: 'bright-pad',
      type: 'synth',
      name: 'Bright Pad',
      description: 'Bright pad sound',
      oscillator: { type: 'square' },
      envelope: { attack: 0.3, decay: 0.2, sustain: 0.6, release: 0.8 },
    },
  ],
  lead: [
    {
      id: 'lead-synth',
      type: 'mono',
      name: 'Lead Synth',
      description: 'Classic lead sound',
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.5 },
    },
    {
      id: 'duo-lead',
      type: 'duo',
      name: 'Duo Lead',
      description: 'Dual oscillator lead',
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.3 },
    },
  ],
  fx: [
    {
      id: 'fx-synth',
      type: 'synth',
      name: 'FX Synth',
      description: 'Effect synthesizer',
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.1, release: 0.5 },
    },
  ],
  other: [
    {
      id: 'default-synth',
      type: 'synth',
      name: 'Default Synth',
      description: 'Standard synthesizer',
      oscillator: { type: 'sine' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.5 },
    },
  ],
};

/**
 * Create instrument instance based on config
 */
export function createInstrument(config: InstrumentConfig): Tone.PolySynth | Tone.Sampler | Tone.MonoSynth | Tone.DuoSynth | Tone.FMSynth | Tone.AMSynth {
  const envelope = config.envelope || {
    attack: 0.02,
    decay: 0.1,
    sustain: 0.3,
    release: 0.5,
  };

  const oscillatorConfig: SafeOscillatorType = config.oscillator || { type: 'sine' };

  switch (config.type) {
    case 'sampler':
      if (!config.samplerUrls) {
        // Fallback to synth if no sampler URLs provided
        return new Tone.PolySynth(
          Tone.Synth,
          toPolySynthOptions({
            oscillator: oscillatorConfig,
            envelope,
          })
        );
      }
      return new Tone.Sampler({
        urls: config.samplerUrls,
        onload: () => {
          console.log('Sampler loaded successfully');
        },
        onerror: (error) => {
          console.error('Sampler error:', error);
        },
      });
    case 'mono': {
      const oscillator = toToneOscillatorConfig(oscillatorConfig);
      const options: any = {
        oscillator: oscillator || { type: 'sine' },
        envelope: envelope || {
          attack: 0.02,
          decay: 0.1,
          sustain: 0.3,
          release: 0.5,
        },
      };
      
      if (config.filter) {
        options.filter = {
          type: config.filter.type,
          frequency: config.filter.frequency,
          Q: config.filter.Q,
        };
      }
      
      return new Tone.MonoSynth(options);
    }

    case 'duo': {
      const oscillator = toToneOscillatorConfig(oscillatorConfig) || { type: 'sine' };
      const safeEnvelope = envelope || {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 0.5,
      };
      
      return new Tone.DuoSynth({
        voice0: {
          oscillator,
          envelope: safeEnvelope,
        },
        voice1: {
          oscillator,
          envelope: safeEnvelope,
        },
      });
    }

    case 'fm': {
      const oscillator = toToneOscillatorConfig(oscillatorConfig) || { type: 'sine' };
      const safeEnvelope = envelope || {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 0.5,
      };
      
      return new Tone.FMSynth({
        oscillator,
        envelope: safeEnvelope,
      });
    }

    case 'am': {
      const oscillator = toToneOscillatorConfig(oscillatorConfig) || { type: 'sine' };
      const safeEnvelope = envelope || {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 0.5,
      };
      
      return new Tone.AMSynth({
        oscillator,
        envelope: safeEnvelope,
      });
    }

    case 'synth':
    default:
      return new Tone.PolySynth(
        Tone.Synth,
        toPolySynthOptions({
          oscillator: oscillatorConfig,
          envelope,
          filter: config.filter,
        })
      );
  }
}

/**
 * Get default instrument config for a role
 */
export function getDefaultInstrument(role: TrackRole): InstrumentConfig {
  const presets = INSTRUMENT_PRESETS[role];
  return presets[0] || INSTRUMENT_PRESETS.other[0];
}

/**
 * Get instrument config by ID
 */
export function getInstrumentById(role: TrackRole, id: string): InstrumentConfig | null {
  const presets = INSTRUMENT_PRESETS[role];
  return presets.find(p => p.id === id) || null;
}

