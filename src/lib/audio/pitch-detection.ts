/**
 * Pitch detection using Web Audio API and autocorrelation
 * Converts audio input (voice/humming) to MIDI note numbers
 */

import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';

/**
 * Auto-correlation pitch detection algorithm
 */
function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  // Minimum pitch is 80Hz (E2), maximum is 1000Hz
  const MIN_SAMPLES = Math.floor(sampleRate / 1000);
  const MAX_SAMPLES = Math.floor(sampleRate / 80);

  // Find the best offset that maximizes correlation
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = 0;

  // Calculate RMS (root mean square) for volume threshold
  for (let i = 0; i < buffer.length; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / buffer.length);

  // Not loud enough - silence
  if (rms < 0.01) return -1;

  // Autocorrelation
  let lastCorrelation = 1;
  for (let offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
    let correlation = 0;

    for (let i = 0; i < buffer.length - offset; i++) {
      correlation += Math.abs(buffer[i] - buffer[i + offset]);
    }

    correlation = 1 - correlation / (buffer.length - offset);

    // Find first peak after going below 0.5
    if (correlation > 0.9 && correlation > lastCorrelation) {
      const foundGoodCorrelation = correlation > bestCorrelation;

      if (foundGoodCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }

    lastCorrelation = correlation;
  }

  if (bestCorrelation > 0.01) {
    return sampleRate / bestOffset;
  }

  return -1;
}

/**
 * Convert frequency to MIDI note number
 */
function frequencyToMidi(frequency: number): number {
  return Math.round(12 * Math.log2(frequency / 440) + 69);
}

/**
 * Convert MIDI note number to note name
 */
export function midiToNoteName(midi: number): string {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const note = notes[midi % 12];
  return `${note}${octave}`;
}

/**
 * Pitch detector class
 */
export class PitchDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private bufferLength = 0;
  private buffer: Float32Array = new Float32Array(0);
  private rafId: number | null = null;
  private onPitchCallback: ((pitch: number, note: string) => void) | null = null;

  /**
   * Initialize pitch detector with microphone
   */
  async init(): Promise<void> {
    try {
      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create audio context and analyser
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;

      this.bufferLength = this.analyser.fftSize;
      this.buffer = new Float32Array(this.bufferLength);

      // Connect microphone to analyser
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      source.connect(this.analyser);

      console.log('Pitch detector initialized');
    } catch (error) {
      errorHandler.handle(error, 'Pitch Detector Initialization', ErrorSeverity.ERROR);
      throw new Error('Microphone access denied');
    }
  }

  /**
   * Start detecting pitch
   */
  start(onPitch: (pitch: number, note: string) => void): void {
    try {
      if (!this.analyser || !this.audioContext) {
        throw new Error('Pitch detector not initialized');
      }

      this.onPitchCallback = onPitch;
      this.detectPitch();
    } catch (error) {
      errorHandler.handle(error, 'Pitch Detection Start', ErrorSeverity.ERROR);
      throw error;
    }
  }

  /**
   * Stop detecting pitch
   */
  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.onPitchCallback = null;
  }

  /**
   * Detect pitch from audio buffer (called continuously)
   */
  private detectPitch = (): void => {
    if (!this.analyser || !this.audioContext) return;

    // Get time domain data
    this.analyser.getFloatTimeDomainData(this.buffer as any);

    // Detect pitch using autocorrelation
    const frequency = autoCorrelate(this.buffer as any, this.audioContext.sampleRate);

    // If valid frequency detected, convert to MIDI and call callback
    if (frequency > 0) {
      const midi = frequencyToMidi(frequency);
      const note = midiToNoteName(midi);

      if (this.onPitchCallback) {
        this.onPitchCallback(midi, note);
      }
    }

    // Continue detection loop
    this.rafId = requestAnimationFrame(this.detectPitch);
  };

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
  }

  /**
   * Check if detector is running
   */
  get isRunning(): boolean {
    return this.rafId !== null;
  }
}
