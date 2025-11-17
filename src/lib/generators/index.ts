/**
 * Generator factory and exports
 */

import type { Generator, GeneratorType } from '@/types';
import { EuclideanGenerator } from './euclidean';
import { ArpeggiatorGenerator } from './arpeggiator';
import { MarkovGenerator } from './markov';
import { RandomWalkGenerator } from './random-walk';

/**
 * Get generator instance by type
 */
export function getGenerator(type: GeneratorType): Generator {
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
}

export { EuclideanGenerator, ArpeggiatorGenerator, MarkovGenerator, RandomWalkGenerator };
