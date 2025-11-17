/**
 * Euclidean Rhythm Generator
 * Implements Bjorklund's algorithm for even distribution of hits across steps
 */

import { BaseGenerator } from './base-generator';
import type { GeneratorConfig, GenerationContext, NoteSequence, Note, EuclideanParams } from '@/types';
import { noteToMidi } from '../theory/scales';

export class EuclideanGenerator extends BaseGenerator {
  generate(config: GeneratorConfig, context: GenerationContext): NoteSequence {
    this.validateConfig(config);
    this.validateContext(context);

    const params = config.params as EuclideanParams;

    // Generate euclidean rhythm pattern
    const pattern = this.euclideanRhythm(params.steps, params.pulses);
    const rotated = this.rotatePattern(pattern, params.rotation);

    // Convert pattern to notes
    const notes: Note[] = [];
    const stepDuration = context.lengthBars / params.steps;

    rotated.forEach((hit, index) => {
      if (hit === 1) {
        const pitch = this.getPitchForRole(params.patternRole, context);
        notes.push({
          time: index * stepDuration,
          pitch,
          duration: Math.min(stepDuration * 0.8, 0.1), // Short hit
          velocity: 0.8,
        });
      }
    });

    return {
      notes,
      duration: context.lengthBars,
    };
  }

  /**
   * Bjorklund's algorithm for euclidean rhythms
   * Distributes pulses as evenly as possible across steps
   */
  private euclideanRhythm(steps: number, pulses: number): number[] {
    if (pulses === 0) return new Array(steps).fill(0);
    if (pulses >= steps) return new Array(steps).fill(1);

    // Create initial pattern
    const pattern: number[][] = [];

    // Create groups of 1s and 0s
    for (let i = 0; i < pulses; i++) {
      pattern.push([1]);
    }
    for (let i = 0; i < steps - pulses; i++) {
      pattern.push([0]);
    }

    // Apply Bjorklund's algorithm
    let divisor = steps - pulses;
    let remainder = pulses;

    while (remainder > 1) {
      const count = Math.floor(divisor / remainder);
      const newRemainder = divisor % remainder;

      for (let i = 0; i < newRemainder; i++) {
        for (let j = 0; j < count; j++) {
          pattern[i] = pattern[i].concat(pattern[remainder + i]);
        }
      }

      divisor = remainder;
      remainder = newRemainder;
    }

    // Flatten pattern
    const result: number[] = [];
    pattern.forEach((group) => {
      result.push(...group);
    });

    return result.slice(0, steps);
  }

  /**
   * Rotate pattern by a given offset
   */
  private rotatePattern(pattern: number[], rotation: number): number[] {
    if (rotation === 0) return pattern;
    const normalizedRotation = ((rotation % pattern.length) + pattern.length) % pattern.length;
    return [...pattern.slice(normalizedRotation), ...pattern.slice(0, normalizedRotation)];
  }

  /**
   * Get MIDI pitch for different pattern roles
   */
  private getPitchForRole(role: string, context: GenerationContext): number {
    switch (role) {
      case 'kick':
        return noteToMidi('C', 1); // 36
      case 'snare':
        return noteToMidi('D', 2); // 50
      case 'hat':
        return noteToMidi('F#', 3); // 66
      case 'perc':
        return noteToMidi('A', 3); // 69
      case 'bass':
        return noteToMidi(context.key, 2);
      case 'melody':
        return noteToMidi(context.key, 4);
      default:
        return noteToMidi('C', 4); // Middle C
    }
  }
}
