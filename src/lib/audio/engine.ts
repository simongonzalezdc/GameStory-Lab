/**
 * Audio Engine - Wrapper around Tone.js for music playback
 */

import * as Tone from 'tone';
import type { Scene, Track, Clip } from '@/types';
import { generateNotes } from '@/lib/generators/factory';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';

export class AudioEngine {
  private instruments: Map<string, Tone.PolySynth | Tone.Sampler>;
  private scheduledParts: Tone.Part[];
  private currentScene: Scene | null = null;
  private isInitialized = false;

  constructor() {
    this.instruments = new Map();
    this.scheduledParts = [];
  }

  /**
   * Initialize audio context (requires user interaction)
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await Tone.start();
      errorHandler.handle(
        new Error('Audio engine initialized'),
        'Audio Engine',
        ErrorSeverity.INFO
      );
      this.isInitialized = true;
    } catch (error) {
      errorHandler.handle(error, 'Audio Engine Initialization', ErrorSeverity.ERROR);
      throw new Error('Audio initialization failed');
    }
  }

  /**
   * Load and prepare a scene for playback
   */
  async loadScene(scene: Scene): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.init();
      }

      // Stop current playback
      this.stop();
      this.clearScheduledParts();

      this.currentScene = scene;

      // Set BPM
      const bpm = scene.bpm || 120;
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

    // For MVP, use simple PolySynth for all tracks
    // TODO: Load different instrument types based on track.instrumentRef
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: this.getOscillatorType(track.role) as any,
      },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 0.5,
      },
    });

    // Create panner for stereo positioning
    const panner = new Tone.Panner(track.pan).toDestination();
    synth.connect(panner);

    // Apply volume
    synth.volume.value = Tone.gainToDb(track.volume);

    this.instruments.set(track.id, synth);
  }

  /**
   * Get oscillator type based on track role
   */
  private getOscillatorType(role: string): Tone.ToneOscillatorType {
    switch (role) {
      case 'bass':
        return 'sawtooth';
      case 'lead':
        return 'square';
      case 'pad':
        return 'sine';
      case 'drums':
        return 'triangle';
      default:
        return 'triangle';
    }
  }

  /**
   * Schedule clips for playback
   */
  scheduleScene(): void {
    if (!this.currentScene) return;

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
    instrument: Tone.PolySynth | Tone.Sampler
  ): void {
    if (!this.currentScene) return;

    // Get scene key and scale
    const key = this.currentScene.key || 'C';
    const scale = this.currentScene.scale || 'major';
    const bpm = this.currentScene.bpm || 120;

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
      if (instrument instanceof Tone.PolySynth) {
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
