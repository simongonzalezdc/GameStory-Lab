/**
 * Generator factory for creating generator instances
 */

import type { Generator, GeneratorConfig, GenerationContext, NoteSequence } from '@/types';
import { EuclideanGenerator } from './euclidean';
import { ArpeggiatorGenerator } from './arpeggiator';
import { MarkovGenerator } from './markov';
import { RandomWalkGenerator } from './random-walk';
import { midiToNote } from '../theory/scales';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';

/**
 * Create a generator instance from config
 */
export function createGenerator(type: string): Generator {
  try {
    switch (type) {
      case 'euclidean':
        return new EuclideanGenerator();

      case 'arp':
        return new ArpeggiatorGenerator();

      case 'markov':
        return new MarkovGenerator();

      case 'randomWalk':
        return new RandomWalkGenerator();

      default:
        throw new Error(`Unknown generator type: ${type}`);
    }
  } catch (error) {
    errorHandler.handle(error, 'Generator Creation', ErrorSeverity.ERROR);
    throw error;
  }
}

/**
 * Generate notes from a generator config for a given duration
 */
export function generateNotes(
  config: GeneratorConfig,
  key: string,
  scale: string,
  lengthBars: number,
  bpm: number = 120
): Array<{ note: string; time: number; duration: number; velocity: number }> {
  try {
    const generator = createGenerator(config.type);

    // Build generation context
    const context: GenerationContext = {
      key,
      scale,
      bpm,
      lengthBars,
    };

    // Generate pattern
    const noteSequence: NoteSequence = generator.generate(config, context);

    // Convert pattern to notes with timing
    const notes: Array<{ note: string; time: number; duration: number; velocity: number }> = [];
    const beatsPerBar = 4;
    const secondsPerBeat = 60 / bpm;
    const secondsPerBar = beatsPerBar * secondsPerBeat;

    noteSequence.notes.forEach((note) => {
      const timeInSeconds = note.time * secondsPerBar;
      const durationInSeconds = note.duration * secondsPerBar;
      const noteInfo = midiToNote(note.pitch);

      notes.push({
        note: `${noteInfo.note}${noteInfo.octave}`,
        time: timeInSeconds,
        duration: durationInSeconds,
        velocity: note.velocity,
      });
    });

    return notes;
  } catch (error) {
    errorHandler.handle(error, 'Note Generation', ErrorSeverity.ERROR);
    throw error;
  }
}
