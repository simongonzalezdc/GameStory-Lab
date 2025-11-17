/**
 * Markov Chain Generator
 * Generates melodies based on Markov chain probabilities
 */

import { BaseGenerator } from './base-generator';
import type { GeneratorConfig, GenerationContext, NoteSequence, Note, MarkovParams } from '@/types';
import { getScaleNotes, quantizeToScale } from '../theory/scales';

export class MarkovGenerator extends BaseGenerator {
  generate(config: GeneratorConfig, context: GenerationContext): NoteSequence {
    this.validateConfig(config);
    this.validateContext(context);

    const params = config.params as MarkovParams;

    // Get scale notes for quantization
    const scaleNotes = getScaleNotes(context.key, context.scale, 3, 6);

    // Use seed melody or generate default
    const seedMelody = params.seedMelody && params.seedMelody.length > 0
      ? params.seedMelody
      : this.generateDefaultSeed(scaleNotes);

    // Build transition matrix
    const transitionMatrix = this.buildTransitionMatrix(seedMelody, params.order);

    // Generate new melody
    const melody = this.generateMelody(
      seedMelody,
      transitionMatrix,
      params.length,
      params.order
    );

    // Convert to notes
    const notes = this.melodyToNotes(melody, context);

    return {
      notes,
      duration: context.lengthBars,
    };
  }

  /**
   * Generate a default seed melody from scale
   */
  private generateDefaultSeed(scaleNotes: number[]): number[] {
    const length = Math.min(8, scaleNotes.length);
    const seed: number[] = [];

    for (let i = 0; i < length; i++) {
      seed.push(scaleNotes[Math.floor(Math.random() * scaleNotes.length)]);
    }

    return seed;
  }

  /**
   * Build Markov chain transition matrix
   */
  private buildTransitionMatrix(
    melody: number[],
    order: number
  ): Map<string, Map<number, number>> {
    const matrix = new Map<string, Map<number, number>>();

    for (let i = 0; i < melody.length - order; i++) {
      const state = melody.slice(i, i + order).join(',');
      const nextNote = melody[i + order];

      if (!matrix.has(state)) {
        matrix.set(state, new Map());
      }

      const transitions = matrix.get(state)!;
      transitions.set(nextNote, (transitions.get(nextNote) || 0) + 1);
    }

    // Normalize probabilities
    matrix.forEach((transitions) => {
      const total = Array.from(transitions.values()).reduce((sum, count) => sum + count, 0);
      transitions.forEach((count, note) => {
        transitions.set(note, count / total);
      });
    });

    return matrix;
  }

  /**
   * Generate melody using Markov chain
   */
  private generateMelody(
    seed: number[],
    matrix: Map<string, Map<number, number>>,
    length: number,
    order: number
  ): number[] {
    const melody = [...seed.slice(0, order)];

    while (melody.length < length) {
      const state = melody.slice(-order).join(',');
      const transitions = matrix.get(state);

      if (!transitions || transitions.size === 0) {
        // No transitions found, use random note from seed
        melody.push(seed[Math.floor(Math.random() * seed.length)]);
        continue;
      }

      // Pick next note based on probabilities
      const random = Math.random();
      let cumulative = 0;
      let nextNote = melody[melody.length - 1];

      for (const [note, probability] of transitions) {
        cumulative += probability;
        if (random <= cumulative) {
          nextNote = note;
          break;
        }
      }

      melody.push(nextNote);
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
        velocity: 0.6 + Math.random() * 0.2, // Slight velocity variation
      });
    });

    return notes;
  }
}
