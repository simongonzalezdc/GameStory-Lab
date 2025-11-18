/**
 * Integration tests for instrument creation
 * These tests verify that instruments are created correctly and match expected types
 */

import { describe, it, expect } from 'vitest';
import * as Tone from 'tone';
import { createInstrument, type InstrumentConfig } from '@/lib/audio/instruments';

describe('createInstrument', () => {
  it('should create a PolySynth for synth type', () => {
    const config: InstrumentConfig = {
      id: 'test-synth',
      type: 'synth',
      name: 'Test Synth',
      description: 'Test',
      oscillator: { type: 'sine' },
    };

    const instrument = createInstrument(config);
    expect(instrument).toBeInstanceOf(Tone.PolySynth);
  });

  it('should create a MonoSynth for mono type', () => {
    const config: InstrumentConfig = {
      id: 'test-mono',
      type: 'mono',
      name: 'Test Mono',
      description: 'Test',
      oscillator: { type: 'sawtooth' },
    };

    const instrument = createInstrument(config);
    expect(instrument).toBeInstanceOf(Tone.MonoSynth);
  });

  it('should create a DuoSynth for duo type', () => {
    const config: InstrumentConfig = {
      id: 'test-duo',
      type: 'duo',
      name: 'Test Duo',
      description: 'Test',
      oscillator: { type: 'square' },
    };

    const instrument = createInstrument(config);
    expect(instrument).toBeInstanceOf(Tone.DuoSynth);
  });

  it('should create an FMSynth for fm type', () => {
    const config: InstrumentConfig = {
      id: 'test-fm',
      type: 'fm',
      name: 'Test FM',
      description: 'Test',
      oscillator: { type: 'triangle' },
    };

    const instrument = createInstrument(config);
    expect(instrument).toBeInstanceOf(Tone.FMSynth);
  });

  it('should create an AMSynth for am type', () => {
    const config: InstrumentConfig = {
      id: 'test-am',
      type: 'am',
      name: 'Test AM',
      description: 'Test',
      oscillator: { type: 'sine' },
    };

    const instrument = createInstrument(config);
    expect(instrument).toBeInstanceOf(Tone.AMSynth);
  });

  it('should create a Sampler for sampler type with URLs', () => {
    const config: InstrumentConfig = {
      id: 'test-sampler',
      type: 'sampler',
      name: 'Test Sampler',
      description: 'Test',
      samplerUrls: {
        'C4': 'test.wav',
      },
    };

    const instrument = createInstrument(config);
    expect(instrument).toBeInstanceOf(Tone.Sampler);
  });

  it('should create a PolySynth when sampler has no URLs (fallback)', () => {
    const config: InstrumentConfig = {
      id: 'test-sampler-fallback',
      type: 'sampler',
      name: 'Test Sampler Fallback',
      description: 'Test',
    };

    const instrument = createInstrument(config);
    expect(instrument).toBeInstanceOf(Tone.PolySynth);
  });

  it('should handle custom envelope settings', () => {
    const config: InstrumentConfig = {
      id: 'test-envelope',
      type: 'synth',
      name: 'Test Envelope',
      description: 'Test',
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.5,
        decay: 0.3,
        sustain: 0.7,
        release: 1.0,
      },
    };

    const instrument = createInstrument(config);
    expect(instrument).toBeInstanceOf(Tone.PolySynth);
    // The envelope should be configured (we can't easily test the exact values without accessing internals)
  });

  it('should handle filter settings for synth', () => {
    const config: InstrumentConfig = {
      id: 'test-filter',
      type: 'synth',
      name: 'Test Filter',
      description: 'Test',
      oscillator: { type: 'sawtooth' },
      filter: {
        type: 'lowpass',
        frequency: 1000,
        Q: 5,
      },
    };

    const instrument = createInstrument(config);
    expect(instrument).toBeInstanceOf(Tone.PolySynth);
  });
});
