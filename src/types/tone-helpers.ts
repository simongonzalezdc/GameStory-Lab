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
 */
export function toToneOscillatorConfig(
  osc: SafeOscillatorType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  if (isSimpleOscillatorType(osc)) {
    return { type: osc };
  }
  return osc;
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
 */
export function toPolySynthOptions(
  options: PolySynthOptions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {};

  if (options.oscillator) {
    result.oscillator = toToneOscillatorConfig(options.oscillator);
  }

  if (options.envelope) {
    result.envelope = options.envelope;
  }

  if (options.filter) {
    result.filter = {
      type: options.filter.type,
      frequency: options.filter.frequency,
      Q: options.filter.Q,
    };
  }

  return result;
}
