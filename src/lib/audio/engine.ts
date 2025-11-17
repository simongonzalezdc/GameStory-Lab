/**
 * Audio Engine - Wrapper around Tone.js for music playback
 */

import * as Tone from 'tone';
import type { Scene, Track, Clip } from '@/types';
import { barsToSeconds } from '../utils/time';

export class AudioEngine {
  private context: Tone.BaseContext;
  private transport: typeof Tone.getTransport;
  private instruments: Map<string, Tone.PolySynth | Tone.Sampler>;
  private scheduledParts: Tone.Part[];
  private currentScene: Scene | null = null;
  private isInitialized = false;

  constructor() {
    this.context = Tone.getContext();
    this.transport = Tone.getTransport;
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
      console.log('Audio engine initialized');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
      throw new Error('Audio initialization failed');
    }
  }

  /**
   * Load and prepare a scene for playback
   */
  async loadScene(scene: Scene): Promise<void> {
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

    console.log(`Scene "${scene.name}" loaded successfully`);
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
        type: this.getOscillatorType(track.role),
      },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 0.5,
      },
    }).toDestination();

    // Apply volume and pan
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
    track: Track,
    clip: Clip,
    instrument: Tone.PolySynth | Tone.Sampler
  ): void {
    // This is a placeholder - actual note generation will be done by generators
    // For now, create a simple test pattern
    const notes: Array<[string, string, number]> = [];

    // Example: simple pattern (will be replaced by generators)
    for (let i = 0; i < clip.lengthBars * 4; i++) {
      notes.push(['C4', `0:${i}:0`, 0.5]);
    }

    const part = new Tone.Part((time, note) => {
      if (instrument instanceof Tone.PolySynth) {
        instrument.triggerAttackRelease(note[0], note[2], time, note[1] as number);
      }
    }, notes);

    part.start(clip.offset || 0);
    part.loop = true;
    part.loopEnd = clip.lengthBars + 'n';

    this.scheduledParts.push(part);
  }

  /**
   * Start playback
   */
  play(): void {
    if (!this.isInitialized) {
      console.warn('Audio engine not initialized');
      return;
    }

    if (this.currentScene) {
      this.scheduleScene();
    }

    Tone.getTransport().start();
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
