/**
 * Audio Engine - Wrapper around Tone.js for music playback
 */

import * as Tone from 'tone';
import type { Scene, Track, Clip } from '@/types';
import { generateNotes } from '@/lib/generators/factory';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';
import { createInstrument, getDefaultInstrument, getInstrumentById } from './instruments';
import { DEFAULT_BPM, AUDIO_INIT_RETRY_BASE_DELAY_MS, AUDIO_INIT_MAX_RETRIES } from '@/lib/utils/constants';
import { toPolySynthOptions } from '@/types/tone-helpers';

export class AudioEngine {
  private instruments: Map<string, Tone.PolySynth | Tone.Sampler | Tone.MonoSynth | Tone.DuoSynth | Tone.FMSynth | Tone.AMSynth>;
  private panners: Map<string, Tone.Panner>;
  private scheduledParts: Tone.Part[];
  private currentScene: Scene | null = null;
  private isInitialized = false;

  constructor() {
    this.instruments = new Map();
    this.panners = new Map();
    this.scheduledParts = [];
  }

  /**
   * Initialize audio context (requires user interaction)
   * Implements retry logic with exponential backoff for reliability
   */
  async init(maxRetries: number = AUDIO_INIT_MAX_RETRIES): Promise<void> {
    if (this.isInitialized) return;

    let lastError: Error | null = null;
    const baseDelay = AUDIO_INIT_RETRY_BASE_DELAY_MS;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await Tone.start();
        errorHandler.handle(
          new Error('Audio engine initialized'),
          'Audio Engine',
          ErrorSeverity.INFO
        );
        this.isInitialized = true;
        return; // Success, exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown audio initialization error');
        
        // Don't retry on the last attempt
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff: 500ms, 1s, 2s
          errorHandler.handle(
            new Error(`Audio initialization attempt ${attempt + 1} failed, retrying in ${delay}ms...`),
            'Audio Engine Initialization',
            ErrorSeverity.WARNING
          );
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    const errorMessage = `Audio initialization failed after ${maxRetries} attempts`;
    errorHandler.handle(
      lastError || new Error(errorMessage),
      'Audio Engine Initialization',
      ErrorSeverity.ERROR
    );
    throw new Error(errorMessage);
  }

  /**
   * Load and prepare a scene for playback
   */
  async loadScene(scene: Scene): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.init();
      }

      // Stop current playback and clean up previous scene
      this.stop();
      this.clearScheduledParts();
      
      // Dispose of previous scene's instruments and panners to prevent memory leaks
      this.instruments.forEach((instrument) => {
        try {
          instrument.dispose();
        } catch {
          // Ignore disposal errors
        }
      });
      this.instruments.clear();
      
      this.panners.forEach((panner) => {
        try {
          panner.dispose();
        } catch {
          // Ignore disposal errors
        }
      });
      this.panners.clear();

      this.currentScene = scene;

      // Set BPM
      const bpm = scene.bpm || DEFAULT_BPM;
      Tone.getTransport().bpm.value = bpm;

      // Load instruments for all tracks
      for (const track of scene.tracks) {
        await this.loadInstrument(track);
      }

      errorHandler.handle(
        new Error(`Scene "${scene.name}" loaded successfully`),
        'Audio Engine',
        ErrorSeverity.INFO
      );
    } catch (error) {
      errorHandler.handle(error, 'Audio Scene Loading', ErrorSeverity.ERROR);
      throw error; // Re-throw to allow caller to handle
    }
  }

  /**
   * Load an instrument for a track
   */
  private async loadInstrument(track: Track): Promise<void> {
    if (this.instruments.has(track.id)) return;

    // Get instrument config based on track.instrumentRef or use default for role
    const instrumentConfig = track.instrumentRef && track.instrumentRef !== 'default-synth'
      ? getInstrumentById(track.role, track.instrumentRef) || getDefaultInstrument(track.role)
      : getDefaultInstrument(track.role);

    const instrument = createInstrument(instrumentConfig);
    
    // Wrap MonoSynth, DuoSynth, FMSynth, AMSynth in PolySynth for polyphonic support
    // Sampler and PolySynth don't need wrapping
    let polyInstrument: Tone.PolySynth | Tone.Sampler | Tone.MonoSynth | Tone.DuoSynth | Tone.FMSynth | Tone.AMSynth;
    if (instrument instanceof Tone.Sampler || instrument instanceof Tone.PolySynth) {
      // Sampler and PolySynth are already polyphonic
      polyInstrument = instrument;
    } else if (instrument instanceof Tone.MonoSynth || instrument instanceof Tone.DuoSynth ||
        instrument instanceof Tone.FMSynth || instrument instanceof Tone.AMSynth) {
      // For monophonic synths, wrap in PolySynth for polyphonic support
      // Determine the synth class based on instrument type
      let SynthClass: typeof Tone.MonoSynth | typeof Tone.DuoSynth | typeof Tone.FMSynth | typeof Tone.AMSynth;
      if (instrument instanceof Tone.MonoSynth) {
        SynthClass = Tone.MonoSynth;
      } else if (instrument instanceof Tone.DuoSynth) {
        SynthClass = Tone.DuoSynth;
      } else if (instrument instanceof Tone.FMSynth) {
        SynthClass = Tone.FMSynth;
      } else {
        SynthClass = Tone.AMSynth;
      }

      // PolySynth requires all constructors to be the same type, but we have a union
      // This is a limitation of Tone.js's type system, not our code
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      polyInstrument = new Tone.PolySynth(
        SynthClass as any,
        toPolySynthOptions({
          oscillator: instrumentConfig.oscillator,
          envelope: instrumentConfig.envelope,
        })
      );
    } else {
      polyInstrument = instrument;
    }

    // Create panner for stereo positioning
    const panner = new Tone.Panner(track.pan).toDestination();
    polyInstrument.connect(panner);

    // Apply volume
    polyInstrument.volume.value = Tone.gainToDb(track.volume);

    this.instruments.set(track.id, polyInstrument);
    this.panners.set(track.id, panner);
  }

  /**
   * Schedule clips for playback
   */
  scheduleScene(): void {
    if (!this.currentScene) return;

    // Clear any existing scheduled parts to prevent memory leaks
    this.clearScheduledParts();

    for (const track of this.currentScene.tracks) {
      if (track.muted) continue;

      const instrument = this.instruments.get(track.id);
      if (!instrument) continue;

      for (const clip of track.clips) {
        if (clip.muted) continue;
        this.scheduleClip(track, clip, instrument);
      }
    }
  }

  /**
   * Schedule a single clip
   */
  private scheduleClip(
    _track: Track,
    clip: Clip,
    instrument: Tone.PolySynth | Tone.Sampler | Tone.MonoSynth | Tone.DuoSynth | Tone.FMSynth | Tone.AMSynth
  ): void {
    if (!this.currentScene) return;

    // Get scene key and scale
    const key = this.currentScene.key || 'C';
    const scale = this.currentScene.scale || 'major';
    const bpm = this.currentScene.bpm || DEFAULT_BPM;

    // Generate notes using the clip's generator
    const generatedNotes = generateNotes(
      clip.generator,
      key,
      scale,
      clip.lengthBars,
      bpm
    );

    // Convert to Tone.js Part format
    const toneNotes = generatedNotes.map((note) => ({
      time: note.time,
      note: note.note,
      duration: note.duration,
      velocity: note.velocity,
    }));

    // Create and schedule Tone.js Part
    const part = new Tone.Part((time, value) => {
      if (instrument instanceof Tone.PolySynth || instrument instanceof Tone.MonoSynth || 
          instrument instanceof Tone.DuoSynth || instrument instanceof Tone.FMSynth || 
          instrument instanceof Tone.AMSynth || instrument instanceof Tone.Sampler) {
        instrument.triggerAttackRelease(
          value.note,
          value.duration,
          time,
          value.velocity
        );
      }
    }, toneNotes);

    // Start at clip offset
    part.start(clip.offset || 0);

    // Loop the pattern
    part.loop = true;
    part.loopEnd = `${clip.lengthBars * 4}:0:0`; // Bars to Tone.js time format

    this.scheduledParts.push(part);
  }

  /**
   * Start playback
   */
  play(): void {
    try {
      if (!this.isInitialized) {
        errorHandler.handle(
          new Error('Audio engine not initialized'),
          'Audio Playback',
          ErrorSeverity.WARNING
        );
        return;
      }

      if (this.currentScene) {
        this.scheduleScene();
      }

      Tone.getTransport().start();
    } catch (error) {
      errorHandler.handle(error, 'Audio Playback', ErrorSeverity.ERROR);
    }
  }

  /**
   * Pause playback
   */
  pause(): void {
    Tone.getTransport().pause();
  }

  /**
   * Stop playback and return to beginning
   */
  stop(): void {
    Tone.getTransport().stop();
    Tone.getTransport().position = 0;
    this.clearScheduledParts();
  }

  /**
   * Set global tempo (BPM)
   */
  setBPM(bpm: number): void {
    Tone.getTransport().bpm.value = bpm;
  }

  /**
   * Get current playback position in bars
   */
  getCurrentPosition(): number {
    const position = Tone.getTransport().position;
    // Convert Tone.js position to bars
    const parts = (position as string).split(':');
    const bars = parseInt(parts[0], 10);
    const beats = parseInt(parts[1], 10) / 4;
    return bars + beats;
  }

  /**
   * Seek to a specific position in bars
   */
  seek(bars: number): void {
    Tone.getTransport().position = `${bars}:0:0`;
  }

  /**
   * Update pan value for a track
   */
  updatePan(trackId: string, pan: number): void {
    const panner = this.panners.get(trackId);
    if (panner) {
      panner.pan.value = pan;
    }
  }

  /**
   * Update volume for a track
   */
  updateVolume(trackId: string, volume: number): void {
    const instrument = this.instruments.get(trackId);
    if (instrument) {
      instrument.volume.value = Tone.gainToDb(volume);
    }
  }

  /**
   * Clear all scheduled parts
   */
  private clearScheduledParts(): void {
    this.scheduledParts.forEach((part) => {
      part.stop();
      part.dispose();
    });
    this.scheduledParts = [];
  }

  /**
   * Clean up and dispose of all resources
   */
  dispose(): void {
    this.stop();
    this.clearScheduledParts();

    this.instruments.forEach((instrument) => {
      instrument.dispose();
    });
    this.instruments.clear();

    this.panners.forEach((panner) => {
      panner.dispose();
    });
    this.panners.clear();

    this.currentScene = null;
    this.isInitialized = false;
  }

  /**
   * Get initialization status
   */
  get initialized(): boolean {
    return this.isInitialized;
  }
}

// Singleton instance
let audioEngineInstance: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (!audioEngineInstance) {
    audioEngineInstance = new AudioEngine();
  }
  return audioEngineInstance;
}
