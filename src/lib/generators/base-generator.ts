/**
 * Base generator interface and abstract class
 */

import type { Generator, GeneratorConfig, GenerationContext, NoteSequence } from '@/types';

export abstract class BaseGenerator implements Generator {
  abstract generate(config: GeneratorConfig, context: GenerationContext): NoteSequence;

  /**
   * Validate generator configuration
   */
  protected validateConfig(config: GeneratorConfig): void {
    if (!config.type) {
      throw new Error('Generator type is required');
    }
    if (!config.params) {
      throw new Error('Generator parameters are required');
    }
  }

  /**
   * Validate generation context
   */
  protected validateContext(context: GenerationContext): void {
    if (!context.bpm || context.bpm <= 0) {
      throw new Error('Invalid BPM');
    }
    if (!context.lengthBars || context.lengthBars <= 0) {
      throw new Error('Invalid length');
    }
  }
}
