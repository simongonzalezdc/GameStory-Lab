/**
 * Arpeggiator Generator
 * Creates arpeggiated patterns from chords or scales
 */

import { BaseGenerator } from './base-generator';
import type { GeneratorConfig, GenerationContext, NoteSequence, Note, ArpParams } from '@/types';
import { getScaleNotes } from '../theory/scales';
import { getChordNotes } from '../theory/chords';

export class ArpeggiatorGenerator extends BaseGenerator {
  generate(config: GeneratorConfig, context: GenerationContext): NoteSequence {
    this.validateConfig(config);
    this.validateContext(context);

    const params = config.params as ArpParams;
    
    // Validate arpeggiator parameters
    if (params.notesPerBeat < 1 || params.notesPerBeat > 16) {
      throw new Error('Arpeggiator notesPerBeat must be between 1 and 16');
    }
    if (params.octaveRange < 1 || params.octaveRange > 4) {
      throw new Error('Arpeggiator octaveRange must be between 1 and 4');
    }

    // Get base notes (from chord progression or scale)
    const baseNotes = this.getBaseNotes(params, context);

    // Generate arpeggio pattern
    const notes = this.generateArpeggio(baseNotes, params, context);

    return {
      notes,
      duration: context.lengthBars,
    };
  }

  /**
   * Get base notes to arpeggiate
   */
  private getBaseNotes(params: ArpParams, context: GenerationContext): number[] {
    if (params.followChordProgression && context.chordProgression) {
      // Use chord progression
      const chord = context.chordProgression[0]; // For MVP, use first chord
      return getChordNotes(chord.root, chord.type, 4);
    } else {
      // Use scale
      const octaveStart = 4 - Math.floor(params.octaveRange / 2);
      const octaveEnd = octaveStart + params.octaveRange - 1;
      return getScaleNotes(context.key, context.scale, octaveStart, octaveEnd);
    }
  }

  /**
   * Generate arpeggio pattern
   */
  private generateArpeggio(
    baseNotes: number[],
    params: ArpParams,
    context: GenerationContext
  ): Note[] {
    const notes: Note[] = [];
    const totalNotes = context.lengthBars * 4 * params.notesPerBeat; // 4 beats per bar
    const noteDuration = context.lengthBars / totalNotes;

    // Create note sequence based on mode
    let noteSequence: number[];

    switch (params.mode) {
      case 'up':
        noteSequence = this.repeatArray(baseNotes, totalNotes);
        break;
      case 'down':
        noteSequence = this.repeatArray([...baseNotes].reverse(), totalNotes);
        break;
      case 'upDown':
        noteSequence = this.repeatArray(
          [...baseNotes, ...baseNotes.slice(1, -1).reverse()],
          totalNotes
        );
        break;
      case 'downUp':
        noteSequence = this.repeatArray(
          [[...baseNotes].reverse(), ...baseNotes.slice(1, -1)].flat(),
          totalNotes
        );
        break;
      case 'random':
        noteSequence = Array.from({ length: totalNotes }, () =>
          baseNotes[Math.floor(Math.random() * baseNotes.length)]
        );
        break;
      default:
        noteSequence = this.repeatArray(baseNotes, totalNotes);
    }

    // Convert to Note objects
    noteSequence.forEach((pitch, index) => {
      notes.push({
        time: index * noteDuration,
        pitch,
        duration: noteDuration * 0.8,
        velocity: 0.7,
      });
    });

    return notes;
  }

  /**
   * Repeat array to reach desired length
   */
  private repeatArray(arr: number[], length: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < length; i++) {
      result.push(arr[i % arr.length]);
    }
    return result;
  }
}
