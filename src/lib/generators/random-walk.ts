/**
 * Random Walk Generator
 * Generates melodies using constrained random walk algorithm
 */

import { BaseGenerator } from './base-generator';
import type { GeneratorConfig, GenerationContext, NoteSequence, Note, RandomWalkParams } from '@/types';
import { getScaleNotes, quantizeToScale, noteToMidi } from '../theory/scales';
import { clamp } from '../utils/math';

export class RandomWalkGenerator extends BaseGenerator {
  generate(config: GeneratorConfig, context: GenerationContext): NoteSequence {
    this.validateConfig(config);
    this.validateContext(context);

    const params = config.params as RandomWalkParams;

    // Generate melody using random walk
    const melody = this.generateRandomWalk(params, context);

    // Convert to notes
    const notes = this.melodyToNotes(melody, context);

    return {
      notes,
      duration: context.lengthBars,
    };
  }

  /**
   * Generate melody using random walk
   */
  private generateRandomWalk(params: RandomWalkParams, context: GenerationContext): number[] {
    const melody: number[] = [];

    // Pre-compute scale notes for quantization to avoid regenerating on every iteration
    const scaleNotesForQuantization = params.stayInScale
      ? getScaleNotes(context.key, context.scale, 0, 10)
      : null;

    // Start with tonic
    let currentPitch = noteToMidi(context.key, 4);
    melody.push(currentPitch);

    for (let i = 1; i < params.length; i++) {
      // Random step direction and size
      const direction = Math.random() > 0.5 ? 1 : -1;
      const stepSize = Math.ceil(Math.random() * params.stepSize);
      let nextPitch = currentPitch + direction * stepSize;

      // Clamp to valid MIDI range
      nextPitch = clamp(nextPitch, 36, 96); // C2 to C7

      // Quantize to scale if required - pass pre-computed scale for efficiency
      if (params.stayInScale && scaleNotesForQuantization) {
        nextPitch = quantizeToScale(nextPitch, context.key, context.scale, scaleNotesForQuantization);
      }

      melody.push(nextPitch);
      currentPitch = nextPitch;
    }

    return melody;
  }

  /**
   * Convert melody to Note objects
   */
  private melodyToNotes(melody: number[], context: GenerationContext): Note[] {
    const notes: Note[] = [];
    const noteDuration = context.lengthBars / melody.length;

    melody.forEach((pitch, index) => {
      notes.push({
        time: index * noteDuration,
        pitch,
        duration: noteDuration * 0.9,
        velocity: 0.6 + Math.random() * 0.3, // Velocity variation
      });
    });

    return notes;
  }
}
