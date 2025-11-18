/**
 * Tests for prompt builder
 */

import { describe, it, expect } from 'vitest';
import { buildMusicSystemPrompt } from '@/lib/ai/prompt-builder';
import type { ProjectContext } from '@/types';

describe('Prompt Builder', () => {
  describe('buildMusicSystemPrompt', () => {
    it('should build prompt without context', () => {
      const result = buildMusicSystemPrompt();

      expect(result).toBeTruthy();
      expect(result).toContain('music composition assistant');
      expect(result).toContain('No project loaded yet');
    });

    it('should include current scene information', () => {
      const context: ProjectContext = {
        currentScene: {
          id: 'scene-1',
          name: 'Intro',
          key: 'C',
          scale: 'major',
          bpm: 120,
          intensityRange: [0.3, 0.7],
          tracks: [],
          mappings: [],
        },
      };

      const result = buildMusicSystemPrompt(context);

      expect(result).toContain('scene-1');
      expect(result).toContain('Intro');
      expect(result).toContain('C major');
      expect(result).toContain('120');
      expect(result).toContain('[0.3, 0.7]');
    });

    it('should include track information', () => {
      const context: ProjectContext = {
        currentScene: {
          id: 'scene-1',
          name: 'Intro',
          key: 'C',
          scale: 'major',
          intensityRange: [0, 1],
          tracks: [
            {
              id: 'track-1',
              name: 'Drums',
              role: 'drums',
              instrumentRef: 'drums',
              volume: 0.8,
              pan: 0,
              muted: false,
              solo: false,
              clips: [],
            },
          ],
          mappings: [],
        },
      };

      const result = buildMusicSystemPrompt(context);

      expect(result).toContain('track-1');
      expect(result).toContain('Drums');
      expect(result).toContain('drums');
      expect(result).toContain('0.8');
    });

    it('should include clip information', () => {
      const context: ProjectContext = {
        currentScene: {
          id: 'scene-1',
          name: 'Intro',
          key: 'C',
          scale: 'major',
          intensityRange: [0, 1],
          tracks: [
            {
              id: 'track-1',
              role: 'drums',
              instrumentRef: 'drums',
              volume: 0.8,
              pan: 0,
              muted: false,
              solo: false,
              clips: [
                {
                  id: 'clip-1',
                  lengthBars: 4,
                  generator: {
                    type: 'euclidean',
                    params: {},
                  },
                  muted: false,
                  density: 0.5,
                  probability: 0.8,
                },
              ],
            },
          ],
          mappings: [],
        },
      };

      const result = buildMusicSystemPrompt(context);

      expect(result).toContain('clip-1');
      expect(result).toContain('euclidean');
      expect(result).toContain('0.5');
      expect(result).toContain('0.8');
    });

    it('should include recent actions', () => {
      const context: ProjectContext = {
        currentScene: {
          id: 'scene-1',
          name: 'Intro',
          key: 'C',
          scale: 'major',
          intensityRange: [0, 1],
          tracks: [],
          mappings: [],
        },
        recentActions: [
          {
            action: {
              type: 'updateScene',
              target: 'scene-1',
              params: { bpm: 140 },
            },
            success: true,
          },
          {
            action: {
              type: 'updateTrack',
              target: 'scene-1/track-1',
              params: { volume: 0.5 },
            },
            success: false,
            error: 'Track not found',
          },
        ],
      };

      const result = buildMusicSystemPrompt(context);

      expect(result).toContain('Recent Action Results');
      expect(result).toContain('updateScene');
      expect(result).toContain('SUCCESS');
      expect(result).toContain('updateTrack');
      expect(result).toContain('FAILED');
      expect(result).toContain('Track not found');
    });

    it('should include project snapshot', () => {
      const context: ProjectContext = {
        currentScene: {
          id: 'scene-1',
          name: 'Intro',
          key: 'C',
          scale: 'major',
          intensityRange: [0, 1],
          tracks: [],
          mappings: [],
        },
        projectSnapshot: {
          id: 'project-1',
          name: 'Test Project',
          bpm: 120,
          defaultKey: 'C',
          defaultScale: 'major',
          scenes: [
            {
              id: 'scene-1',
              name: 'Intro',
              key: 'C',
              scale: 'major',
              intensityRange: [0, 1],
              tracks: [],
              mappings: [],
            },
            {
              id: 'scene-2',
              name: 'Verse',
              key: 'D',
              scale: 'minor',
              intensityRange: [0, 1],
              tracks: [],
              mappings: [],
            },
          ],
        },
      };

      const result = buildMusicSystemPrompt(context);

      expect(result).toContain('Project Overview');
      expect(result).toContain('Total Scenes: 2');
      expect(result).toContain('Intro (scene-1)');
      expect(result).toContain('Verse (scene-2)');
      expect(result).toContain('Global BPM: 120');
    });

    it('should include validation constraints', () => {
      const result = buildMusicSystemPrompt();

      expect(result).toContain('VALIDATION CONSTRAINTS');
      expect(result).toContain('40-300'); // BPM range
      expect(result).toContain('C, C#, D, D#, E, F, F#, G, G#, A, A#, B'); // Keys
      expect(result).toContain('major, minor, dorian, phrygian, lydian, mixolydian, locrian'); // Scales
    });

    it('should describe available actions', () => {
      const result = buildMusicSystemPrompt();

      expect(result).toContain('updateScene');
      expect(result).toContain('updateTrack');
      expect(result).toContain('updateClip');
      expect(result).toContain('addTrack');
    });

    it('should include guardrails', () => {
      const result = buildMusicSystemPrompt();

      expect(result).toContain('CRITICAL GUARDRAILS');
      expect(result).toContain('MUSICAL PARAMETERS');
      expect(result).toContain('Never mention front-end components');
    });

    it('should handle empty tracks array', () => {
      const context: ProjectContext = {
        currentScene: {
          id: 'scene-1',
          name: 'Intro',
          key: 'C',
          scale: 'major',
          intensityRange: [0, 1],
          tracks: [],
          mappings: [],
        },
      };

      const result = buildMusicSystemPrompt(context);

      expect(result).toBeTruthy();
      expect(result).toContain('scene-1');
    });

    it('should handle scene with undefined BPM', () => {
      const context: ProjectContext = {
        currentScene: {
          id: 'scene-1',
          name: 'Intro',
          key: 'C',
          scale: 'major',
          intensityRange: [0, 1],
          tracks: [],
          mappings: [],
        },
      };

      const result = buildMusicSystemPrompt(context);

      expect(result).toContain('default');
    });

    it('should handle track without name', () => {
      const context: ProjectContext = {
        currentScene: {
          id: 'scene-1',
          name: 'Intro',
          key: 'C',
          scale: 'major',
          intensityRange: [0, 1],
          tracks: [
            {
              id: 'track-1',
              role: 'drums',
              instrumentRef: 'drums',
              volume: 0.8,
              pan: 0,
              muted: false,
              solo: false,
              clips: [],
            },
          ],
          mappings: [],
        },
      };

      const result = buildMusicSystemPrompt(context);

      expect(result).toContain('Unnamed');
    });
  });
});
