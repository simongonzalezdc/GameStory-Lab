/**
 * Instrument definitions and factory
 */

import * as Tone from 'tone';
import type { TrackRole } from '@/types';

export type InstrumentType = 'synth' | 'sampler' | 'fm' | 'am' | 'mono' | 'duo';

export interface InstrumentConfig {
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
}

/**
 * Instrument presets by role
 */
export const INSTRUMENT_PRESETS: Record<TrackRole, InstrumentConfig[]> = {
  drums: [
    {
      type: 'synth',
      name: 'Kick',
      description: 'Deep kick drum',
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.1 },
    },
    {
      type: 'synth',
      name: 'Snare',
      description: 'Snappy snare',
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 },
    },
  ],
  bass: [
    {
      type: 'mono',
      name: 'Bass Synth',
      description: 'Deep bass synthesizer',
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.3 },
      filter: { type: 'lowpass', frequency: 800, Q: 1 },
    },
    {
      type: 'fm',
      name: 'FM Bass',
      description: 'FM synthesis bass',
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.2 },
    },
  ],
  pad: [
    {
      type: 'synth',
      name: 'Warm Pad',
      description: 'Smooth pad sound',
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.5, decay: 0.3, sustain: 0.7, release: 1.0 },
      filter: { type: 'lowpass', frequency: 2000, Q: 1 },
    },
    {
      type: 'synth',
      name: 'Bright Pad',
      description: 'Bright pad sound',
      oscillator: { type: 'square' },
      envelope: { attack: 0.3, decay: 0.2, sustain: 0.6, release: 0.8 },
    },
  ],
  lead: [
    {
      type: 'mono',
      name: 'Lead Synth',
      description: 'Classic lead sound',
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.5 },
    },
    {
      type: 'duo',
      name: 'Duo Lead',
      description: 'Dual oscillator lead',
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.3 },
    },
  ],
  fx: [
    {
      type: 'synth',
      name: 'FX Synth',
      description: 'Effect synthesizer',
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.1, release: 0.5 },
    },
  ],
  other: [
    {
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
export function createInstrument(config: InstrumentConfig): Tone.PolySynth | Tone.MonoSynth | Tone.DuoSynth | Tone.FMSynth | Tone.AMSynth {
  const envelope = config.envelope || {
    attack: 0.02,
    decay: 0.1,
    sustain: 0.3,
    release: 0.5,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const oscillatorConfig: any = config.oscillator || { type: 'sine' };

  switch (config.type) {
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
  return presets.find(p => p.name === id) || null;
}

