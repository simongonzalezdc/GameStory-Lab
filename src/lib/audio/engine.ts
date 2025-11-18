/**
 * Audio Engine - Wrapper around Tone.js for music playback
 */

import * as Tone from 'tone';
import type { Scene, Track, Clip } from '@/types';
import { getClipPlaybackNotes } from '@/lib/audio/clip-note-utils';
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
      // Validate scene parameter
      if (!scene) {
        throw new Error('Scene is required but was null or undefined');
      }

      if (!this.isInitialized) {
        await this.init();
      }

      // Stop current playback and clean up previous scene
      this.stop();
      this.clearScheduledParts();
      
      // Dispose of previous scene's instruments and panners to prevent memory leaks
      if (this.instruments && this.instruments instanceof Map) {
        this.instruments.forEach((instrument) => {
          if (instrument) {
            try {
              instrument.dispose();
            } catch {
              // Ignore disposal errors
            }
          }
        });
        this.instruments.clear();
      } else {
        this.instruments = new Map();
      }
      
      if (this.panners && this.panners instanceof Map) {
        this.panners.forEach((panner) => {
          if (panner) {
            try {
              panner.dispose();
            } catch {
              // Ignore disposal errors
            }
          }
        });
        this.panners.clear();
      } else {
        this.panners = new Map();
      }

      this.currentScene = scene;

      // Set BPM
      const bpm = scene.bpm || DEFAULT_BPM;
      try {
        const transport = Tone.getTransport();
        if (transport && transport.bpm) {
          transport.bpm.value = bpm;
        }
      } catch (error) {
        errorHandler.handle(
          error,
          'Audio BPM Setting',
          ErrorSeverity.WARNING
        );
      }

      // Validate and load instruments for all tracks
      if (!scene.tracks || !Array.isArray(scene.tracks)) {
        errorHandler.handle(
          new Error('Scene tracks is missing or not an array'),
          'Audio Scene Loading',
          ErrorSeverity.WARNING
        );
        return; // Exit early if tracks are invalid
      }

      // Load instruments for all tracks
      for (const track of scene.tracks) {
        if (track && track.id) {
          await this.loadInstrument(track);
        }
      }

      // Schedule clips after instruments are loaded
      // Only schedule if transport is already started (playing)
      // Otherwise, scheduleScene() will be called when play() is called
      const transport = Tone.getTransport();
      if (transport && transport.state === 'started') {
        this.scheduleScene();
      }
    } catch (error) {
      errorHandler.handle(error, 'Audio Scene Loading', ErrorSeverity.ERROR);
      throw error; // Re-throw to allow caller to handle
    }
  }

  /**
   * Load an instrument for a track
   */
  private async loadInstrument(track: Track): Promise<void> {
    if (!track || !track.id) {
      errorHandler.handle(
        new Error('Invalid track provided to loadInstrument'),
        'Audio Instrument Loading',
        ErrorSeverity.WARNING
      );
      return;
    }

    if (this.instruments.has(track.id)) return;

    // Get instrument config based on track.instrumentRef or use default for role
    const instrumentConfig = track.instrumentRef && track.instrumentRef !== 'default-synth'
      ? getInstrumentById(track.role, track.instrumentRef) || getDefaultInstrument(track.role)
      : getDefaultInstrument(track.role);

    if (!instrumentConfig) {
      errorHandler.handle(
        new Error(`Failed to get instrument config for track ${track.id}`),
        'Audio Instrument Loading',
        ErrorSeverity.WARNING
      );
      return;
    }

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
      // Determine synth class based on instrument type
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

      // PolySynth requires all constructors to be same type, but we have a union
      // This is a limitation of Tone.js's type system, not our code
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
    const pan = typeof track.pan === 'number' ? track.pan : 0;
    const volume = typeof track.volume === 'number' ? track.volume : 0.5;
    
    const panner = new Tone.Panner(pan).toDestination();
    polyInstrument.connect(panner);

    // Apply volume
    polyInstrument.volume.value = Tone.gainToDb(volume);

    this.instruments.set(track.id, polyInstrument);
    this.panners.set(track.id, panner);
  }

  /**
   * Schedule clips for playback
   */
  scheduleScene(): void {
    if (!this.currentScene) return;

    // Validate tracks array
    if (!this.currentScene.tracks || !Array.isArray(this.currentScene.tracks)) {
      errorHandler.handle(
        new Error('Scene tracks is missing or not an array'),
        'Audio Scene Scheduling',
        ErrorSeverity.WARNING
      );
      return;
    }

    // Clear any existing scheduled parts to prevent memory leaks
    this.clearScheduledParts();

    // Check if any track is soloed
    const hasSoloedTrack = this.currentScene.tracks.some(track => track && track.solo);

    for (const track of this.currentScene.tracks) {
      if (!track) continue;

      // Skip muted tracks
      if (track.muted) continue;

      // If any track is soloed, only play soloed tracks
      if (hasSoloedTrack && !track.solo) continue;

      const instrument = this.instruments.get(track.id);
      if (!instrument) {
        // Instrument not loaded yet, try to load it
        this.loadInstrument(track).catch((error) => {
          errorHandler.handle(error, 'Audio Instrument Loading', ErrorSeverity.WARNING);
        });
        continue;
      }

      // Validate clips array
      const clips = Array.isArray(track.clips) ? track.clips : [];
      if (clips.length === 0) continue;

      for (const clip of clips) {
        if (!clip || clip.muted) continue;
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

    // Generate notes using clip's generator
    const generatedNotes = getClipPlaybackNotes(clip, key, scale, bpm);

    // Convert to Tone.js Part format
    const toneNotes = generatedNotes.map((note) => ({
      time: note.time,
      note: note.note,
      duration: note.duration,
      velocity: note.velocity,
    }));

    // Create and schedule Tone.js Part
    const part = new Tone.Part((time, value) => {
      // Check if instrument is still valid (not disposed)
      // Tone.js instruments have a `disposed` property when disposed
      const instrumentAny = instrument as { disposed?: boolean };
      if (!instrument || instrumentAny.disposed === true) {
        return; // Instrument was disposed, skip this note
      }
      
      if (instrument instanceof Tone.PolySynth || instrument instanceof Tone.MonoSynth || 
          instrument instanceof Tone.DuoSynth || instrument instanceof Tone.FMSynth || 
          instrument instanceof Tone.AMSynth || instrument instanceof Tone.Sampler) {
        try {
          instrument.triggerAttackRelease(
            value.note,
            value.duration,
            time,
            value.velocity
          );
        } catch {
          // Instrument may have been disposed between check and use
          // Silently ignore - this is expected when scene changes
        }
      }
    }, toneNotes);

    // Start at clip offset
    part.start(clip.offset || 0);

    // Loop pattern
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
    try {
      const transport = Tone.getTransport();
      if (transport) {
        transport.stop();
        transport.position = 0;
      }
      this.clearScheduledParts();
    } catch (error) {
      // Ignore errors if transport is not available
      errorHandler.handle(error, 'Audio Stop', ErrorSeverity.WARNING);
    }
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
   * Reschedule the current scene (useful when scene data changes while playing)
   */
  rescheduleScene(): void {
    if (!this.currentScene) return;
    
    const transport = Tone.getTransport();
    const wasPlaying = transport && transport.state === 'started';
    
    // If playing, reschedule
    if (wasPlaying) {
      this.scheduleScene();
    }
  }

  /**
   * Clear all scheduled parts
   */
  private clearScheduledParts(): void {
    if (!this.scheduledParts || !Array.isArray(this.scheduledParts)) {
      this.scheduledParts = [];
      return;
    }

    this.scheduledParts.forEach((part) => {
      if (part) {
        try {
          part.stop();
          part.dispose();
        } catch {
          // Ignore disposal errors - part may already be disposed
        }
      }
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
