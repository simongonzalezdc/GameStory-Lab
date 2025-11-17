/**
 * Generator interface and types
 */

import type { GenerationContext, NoteSequence } from './audio';
import type { GeneratorConfig } from './project';

export interface Generator {
  generate(config: GeneratorConfig, context: GenerationContext): NoteSequence;
}

export interface GeneratorMetadata {
  id: string;
  name: string;
  description: string;
  category: 'rhythm' | 'melody' | 'harmony' | 'experimental';
  parameterSchema: ParameterSchema[];
}

export interface ParameterSchema {
  name: string;
  type: 'number' | 'boolean' | 'select' | 'text';
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: any; label: string }>;
  description: string;
}

export const DEFAULT_BPM = 120;
export const DEFAULT_TIME_SIGNATURE = '4/4';
export const DEFAULT_KEY = 'C';
export const DEFAULT_SCALE = 'major';
