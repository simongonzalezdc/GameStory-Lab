import * as Tone from 'tone';

/**
 * Type-safe oscillator configuration
 * Tone.js accepts various oscillator types, but TypeScript is overly strict about the type union
 */
export type SafeOscillatorType =
  | Tone.ToneOscillatorType
  | { type: Tone.ToneOscillatorType; partials?: number[] };

/**
 * Type guard to check if oscillator config is a string type
 */
export function isSimpleOscillatorType(
  osc: SafeOscillatorType
): osc is Tone.ToneOscillatorType {
  return typeof osc === 'string';
}

/**
 * Convert our oscillator config to Tone.js compatible format
 * This function safely handles the type conversion that TypeScript struggles with
 * We use 'as any' here intentionally because Tone.js's types are overly restrictive
 * Always returns a valid object to prevent null/undefined errors
 */
export function toToneOscillatorConfig(
  osc: SafeOscillatorType | null | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  if (!osc) {
    return { type: 'sine' };
  }
  
  if (isSimpleOscillatorType(osc)) {
    return { type: osc };
  }
  
  // Ensure we return a valid object
  if (typeof osc === 'object' && osc !== null) {
    return osc;
  }
  
  // Fallback to default
  return { type: 'sine' };
}

/**
 * Type-safe PolySynth constructor options
 */
export interface PolySynthOptions {
  oscillator?: SafeOscillatorType;
  envelope?: Partial<Tone.EnvelopeOptions>;
  filter?: {
    type: 'lowpass' | 'highpass' | 'bandpass';
    frequency?: number;
    Q?: number;
  };
}

/**
 * Convert our options to Tone.js PolySynth options
 * Handles the complex type conversions needed for PolySynth constructor
 * We use 'as any' here because Tone.js PolySynthOptions type is overly complex
 * Always returns a valid object to prevent null/undefined errors
 */
export function toPolySynthOptions(
  options: PolySynthOptions | null | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {};

  if (!options) {
    // Return default options if none provided
    return {
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 0.5,
      },
    };
  }

  // Always provide oscillator (required by Tone.js)
  result.oscillator = options.oscillator
    ? toToneOscillatorConfig(options.oscillator)
    : { type: 'sine' };

  // Always provide envelope (required by Tone.js)
  result.envelope = options.envelope || {
    attack: 0.02,
    decay: 0.1,
    sustain: 0.3,
    release: 0.5,
  };

  if (options.filter) {
    result.filter = {
      type: options.filter.type,
      frequency: options.filter.frequency,
      Q: options.filter.Q,
    };
  }

  return result;
}
