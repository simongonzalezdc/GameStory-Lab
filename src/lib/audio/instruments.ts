/**
 * Instrument definitions and factory
 */

import * as Tone from 'tone';
import type { TrackRole } from '@/types';
import { AUDIO_FILTER_DEFAULT_FREQUENCY, AUDIO_FILTER_DEFAULT_Q } from '@/lib/utils/constants';

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
      envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.1 },
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const oscillatorConfig: any = config.oscillator || { type: 'sine' };

  switch (config.type) {
    case 'sampler':
      if (!config.samplerUrls) {
        // Fallback to synth if no sampler URLs provided
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new Tone.PolySynth(Tone.Synth, {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          oscillator: oscillatorConfig as any,
          envelope,
        } as any);
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
    case 'mono':
      return new Tone.MonoSynth({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        oscillator: oscillatorConfig as any,
        envelope,
        filter: config.filter ? {
          type: config.filter.type,
          frequency: config.filter.frequency,
          Q: config.filter.Q,
        } : undefined,
      });

    case 'duo':
      return new Tone.DuoSynth({
        voice0: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          oscillator: oscillatorConfig as any,
          envelope,
        },
        voice1: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          oscillator: oscillatorConfig as any,
          envelope,
        },
      });

    case 'fm':
      return new Tone.FMSynth({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        oscillator: oscillatorConfig as any,
        envelope,
      });

    case 'am':
      return new Tone.AMSynth({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        oscillator: oscillatorConfig as any,
        envelope,
      });

    case 'synth':
    default:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new Tone.PolySynth(Tone.Synth, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        oscillator: oscillatorConfig as any,
        envelope,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(config.filter ? {
          filter: {
            type: config.filter.type,
            frequency: config.filter.frequency,
            Q: config.filter.Q,
          },
        } : {}),
      } as any);
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

