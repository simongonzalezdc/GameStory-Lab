/**
 * Integration tests for instrument creation
 * These tests verify that instruments are created correctly and match expected types
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import type * as ToneType from 'tone';

// Mock Tone.js to avoid Web Audio API issues in test environment
vi.mock('tone', () => {
  // Create mock classes for each synth type
  class MockPolySynth {
    constructor(public voice?: any, public options?: any) {}
  }
  class MockMonoSynth {
    constructor(public options?: any) {}
  }
  class MockDuoSynth {
    constructor(public options?: any) {}
  }
  class MockFMSynth {
    constructor(public options?: any) {}
  }
  class MockAMSynth {
    constructor(public options?: any) {}
  }
  class MockSampler {
    constructor(public options?: any) {}
  }
  class MockSynth {
    constructor(public options?: any) {}
  }

  return {
    PolySynth: MockPolySynth,
    MonoSynth: MockMonoSynth,
    DuoSynth: MockDuoSynth,
    FMSynth: MockFMSynth,
    AMSynth: MockAMSynth,
    Sampler: MockSampler,
    Synth: MockSynth,
  };
});

// Import after mocking
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

    // Verify envelope was passed to constructor
    const polySynth = instrument as any;
    expect(polySynth.options).toBeDefined();
    expect(polySynth.options.envelope).toEqual({
      attack: 0.5,
      decay: 0.3,
      sustain: 0.7,
      release: 1.0,
    });
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

    // Verify filter was passed to constructor
    const polySynth = instrument as any;
    expect(polySynth.options).toBeDefined();
    expect(polySynth.options.filter).toEqual({
      type: 'lowpass',
      frequency: 1000,
      Q: 5,
    });
  });

  it('should handle filter settings for mono synth', () => {
    const config: InstrumentConfig = {
      id: 'test-mono-filter',
      type: 'mono',
      name: 'Test Mono Filter',
      description: 'Test',
      oscillator: { type: 'sawtooth' },
      filter: {
        type: 'highpass',
        frequency: 2000,
        Q: 3,
      },
    };

    const instrument = createInstrument(config);
    expect(instrument).toBeInstanceOf(Tone.MonoSynth);

    // Verify filter was passed to constructor
    const monoSynth = instrument as any;
    expect(monoSynth.options).toBeDefined();
    expect(monoSynth.options.filter).toEqual({
      type: 'highpass',
      frequency: 2000,
      Q: 3,
    });
  });
});
