/**
 * Generator presets for quick configuration
 */

import type { GeneratorConfig } from '@/types';

export interface GeneratorPreset {
  id: string;
  name: string;
  description: string;
  config: GeneratorConfig;
  category: 'rhythm' | 'melody' | 'harmony' | 'experimental';
}

export const generatorPresets: GeneratorPreset[] = [
  // Rhythm Presets
  {
    id: 'kick-4-4',
    name: 'Kick 4/4',
    description: 'Standard four-on-the-floor kick pattern',
    category: 'rhythm',
    config: {
      type: 'euclidean',
      params: {
        steps: 16,
        pulses: 4,
        rotation: 0,
        patternRole: 'kick',
      },
    },
  },
  {
    id: 'snare-backbeat',
    name: 'Snare Backbeat',
    description: 'Classic backbeat on 2 and 4',
    category: 'rhythm',
    config: {
      type: 'euclidean',
      params: {
        steps: 16,
        pulses: 2,
        rotation: 4,
        patternRole: 'snare',
      },
    },
  },
  {
    id: 'hihat-shuffle',
    name: 'Hi-Hat Shuffle',
    description: 'Shuffled hi-hat pattern',
    category: 'rhythm',
    config: {
      type: 'euclidean',
      params: {
        steps: 16,
        pulses: 6,
        rotation: 0,
        patternRole: 'hihat',
      },
    },
  },
  {
    id: 'drum-and-bass',
    name: 'Drum & Bass',
    description: 'Fast-paced D&B pattern',
    category: 'rhythm',
    config: {
      type: 'euclidean',
      params: {
        steps: 32,
        pulses: 8,
        rotation: 0,
        patternRole: 'kick',
      },
    },
  },

  // Melody Presets
  {
    id: 'arp-up',
    name: 'Arpeggio Up',
    description: 'Ascending arpeggio',
    category: 'melody',
    config: {
      type: 'arp',
      params: {
        mode: 'up',
        notesPerBeat: 2,
        octaveRange: 2,
        followChordProgression: false,
      },
    },
  },
  {
    id: 'arp-down',
    name: 'Arpeggio Down',
    description: 'Descending arpeggio',
    category: 'melody',
    config: {
      type: 'arp',
      params: {
        mode: 'down',
        notesPerBeat: 2,
        octaveRange: 2,
        followChordProgression: false,
      },
    },
  },
  {
    id: 'arp-ping-pong',
    name: 'Ping Pong',
    description: 'Up and down arpeggio',
    category: 'melody',
    config: {
      type: 'arp',
      params: {
        mode: 'pingpong',
        notesPerBeat: 2,
        octaveRange: 2,
        followChordProgression: false,
      },
    },
  },
  {
    id: 'markov-melodic',
    name: 'Markov Melody',
    description: 'Smooth melodic line using Markov chains',
    category: 'melody',
    config: {
      type: 'markov',
      params: {
        order: 2,
        length: 16,
      },
    },
  },
  {
    id: 'random-walk-smooth',
    name: 'Smooth Walk',
    description: 'Gentle random walk melody',
    category: 'melody',
    config: {
      type: 'randomWalk',
      params: {
        stepSize: 2,
        stayInScale: true,
        length: 16,
      },
    },
  },

  // Harmony Presets
  {
    id: 'arp-chord-follow',
    name: 'Chord Arpeggio',
    description: 'Arpeggio following chord progression',
    category: 'harmony',
    config: {
      type: 'arp',
      params: {
        mode: 'up',
        notesPerBeat: 1,
        octaveRange: 1,
        followChordProgression: true,
      },
    },
  },
  {
    id: 'markov-harmonic',
    name: 'Harmonic Markov',
    description: 'Markov chain respecting harmony',
    category: 'harmony',
    config: {
      type: 'markov',
      params: {
        order: 3,
        length: 32,
      },
    },
  },

  // Experimental Presets
  {
    id: 'euclidean-complex',
    name: 'Complex Euclidean',
    description: 'Intricate rhythm pattern',
    category: 'experimental',
    config: {
      type: 'euclidean',
      params: {
        steps: 24,
        pulses: 7,
        rotation: 3,
        patternRole: 'perc',
      },
    },
  },
  {
    id: 'random-walk-wide',
    name: 'Wide Walk',
    description: 'Large interval random walk',
    category: 'experimental',
    config: {
      type: 'randomWalk',
      params: {
        stepSize: 5,
        stayInScale: false,
        length: 24,
      },
    },
  },
  {
    id: 'markov-high-order',
    name: 'High Order Markov',
    description: 'Complex Markov chain with high order',
    category: 'experimental',
    config: {
      type: 'markov',
      params: {
        order: 4,
        length: 64,
      },
    },
  },
];

/**
 * Get presets by category
 */
export function getPresetsByCategory(category: GeneratorPreset['category']): GeneratorPreset[] {
  return generatorPresets.filter((preset) => preset.category === category);
}

/**
 * Get preset by ID
 */
export function getPresetById(id: string): GeneratorPreset | undefined {
  return generatorPresets.find((preset) => preset.id === id);
}

/**
 * Get presets by generator type
 */
export function getPresetsByType(type: GeneratorConfig['type']): GeneratorPreset[] {
  return generatorPresets.filter((preset) => preset.config.type === type);
}

