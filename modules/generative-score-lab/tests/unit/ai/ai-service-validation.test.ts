/**
 * Tests for AI service validation and clamping functions
 */

import { describe, it, expect } from 'vitest';
import { applyMusicActions } from '@/lib/ai/ai-service';
import type { MusicAction } from '@/types';
import { MIN_BPM, MAX_BPM } from '@/lib/utils/constants';

// Mock project store
const createMockProjectStore = (project: any) => ({
  project,
  currentSceneId: project?.scenes[0]?.id || null,
  updateScene: (sceneId: string, updates: any) => {
    const scene = project.scenes.find((s: any) => s.id === sceneId);
    if (scene) {
      Object.assign(scene, updates);
    }
  },
  updateTrack: (sceneId: string, trackId: string, updates: any) => {
    const scene = project.scenes.find((s: any) => s.id === sceneId);
    const track = scene?.tracks.find((t: any) => t.id === trackId);
    if (track) {
      Object.assign(track, updates);
    }
  },
  updateClip: (sceneId: string, trackId: string, clipId: string, updates: any) => {
    const scene = project.scenes.find((s: any) => s.id === sceneId);
    const track = scene?.tracks.find((t: any) => t.id === trackId);
    const clip = track?.clips.find((c: any) => c.id === clipId);
    if (clip) {
      Object.assign(clip, updates);
    }
  },
  addTrack: () => {},
});

describe('AI Service Validation', () => {
  const mockProject = {
    scenes: [
      {
        id: 'scene-1',
        name: 'Test Scene',
        key: 'C',
        scale: 'major',
        bpm: 120,
        intensityRange: [0.3, 0.7] as [number, number],
        tracks: [
          {
            id: 'track-1',
            role: 'drums',
            volume: 0.5,
            pan: 0,
            muted: false,
            solo: false,
            clips: [
              {
                id: 'clip-1',
                muted: false,
                density: 0.5,
                probability: 1.0,
              },
            ],
          },
          {
            id: 'track-2',
            role: 'bass',
            volume: 0.5,
            pan: 0,
            muted: false,
            solo: false,
            clips: [],
          },
        ],
      },
    ],
  };

  describe('BPM Validation', () => {
    it('should clamp BPM to minimum value', () => {
      const store = createMockProjectStore(mockProject);
      const actions: MusicAction[] = [
        {
          type: 'updateScene',
          target: 'scene-1',
          params: { bpm: 10 }, // Below minimum
        },
      ];

      const result = applyMusicActions(actions, store);
      expect(result.success).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockProject.scenes[0].bpm).toBe(MIN_BPM);
    });

    it('should clamp BPM to maximum value', () => {
      const store = createMockProjectStore(mockProject);
      const actions: MusicAction[] = [
        {
          type: 'updateScene',
          target: 'scene-1',
          params: { bpm: 500 }, // Above maximum
        },
      ];

      const result = applyMusicActions(actions, store);
      expect(result.success).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockProject.scenes[0].bpm).toBe(MAX_BPM);
    });

    it('should round BPM to nearest integer', () => {
      const store = createMockProjectStore(mockProject);
      const actions: MusicAction[] = [
        {
          type: 'updateScene',
          target: 'scene-1',
          params: { bpm: 120.7 },
        },
      ];

      const result = applyMusicActions(actions, store);
      expect(result.success).toBe(1);
      expect(mockProject.scenes[0].bpm).toBe(121);
    });

    it('should accept valid BPM values', () => {
      const store = createMockProjectStore(mockProject);
      const actions: MusicAction[] = [
        {
          type: 'updateScene',
          target: 'scene-1',
          params: { bpm: 90 },
        },
      ];

      const result = applyMusicActions(actions, store);
      expect(result.success).toBe(1);
      expect(mockProject.scenes[0].bpm).toBe(90);
    });
  });

  describe('Volume Validation', () => {
    it('should clamp volume to 0-1 range', () => {
      const store = createMockProjectStore(mockProject);
      const actions: MusicAction[] = [
        {
          type: 'updateTrack',
          target: 'scene-1/track-1',
          params: { volume: 2.0 }, // Above maximum
        },
      ];

      const result = applyMusicActions(actions, store);
      expect(result.success).toBe(1);
      expect(mockProject.scenes[0].tracks[0].volume).toBe(1.0);
    });

    it('should clamp negative volume to 0', () => {
      const store = createMockProjectStore(mockProject);
      const actions: MusicAction[] = [
        {
          type: 'updateTrack',
          target: 'scene-1/track-1',
          params: { volume: -0.5 }, // Below minimum
        },
      ];

      const result = applyMusicActions(actions, store);
      expect(result.success).toBe(1);
      expect(mockProject.scenes[0].tracks[0].volume).toBe(0);
    });
  });

  describe('Pan Validation', () => {
    it('should clamp pan to -1 to 1 range', () => {
      const store = createMockProjectStore(mockProject);
      const actions: MusicAction[] = [
        {
          type: 'updateTrack',
          target: 'scene-1/track-1',
          params: { pan: 2.0 }, // Above maximum
        },
      ];

      const result = applyMusicActions(actions, store);
      expect(result.success).toBe(1);
      expect(mockProject.scenes[0].tracks[0].pan).toBe(1.0);
    });

    it('should clamp negative pan to -1', () => {
      const store = createMockProjectStore(mockProject);
      const actions: MusicAction[] = [
        {
          type: 'updateTrack',
          target: 'scene-1/track-1',
          params: { pan: -2.0 }, // Below minimum
        },
      ];

      const result = applyMusicActions(actions, store);
      expect(result.success).toBe(1);
      expect(mockProject.scenes[0].tracks[0].pan).toBe(-1.0);
    });
  });

  describe('Intensity Range Validation', () => {
    it('should fix invalid intensity range (min >= max)', () => {
      const store = createMockProjectStore(mockProject);
      const actions: MusicAction[] = [
        {
          type: 'updateScene',
          target: 'scene-1',
          params: { intensityRange: [0.8, 0.5] }, // Invalid: min > max
        },
      ];

      const result = applyMusicActions(actions, store);
      expect(result.success).toBe(1);
      const range = mockProject.scenes[0].intensityRange;
      expect(range[0]).toBeLessThan(range[1]);
      expect(range[0]).toBeGreaterThanOrEqual(0);
      expect(range[1]).toBeLessThanOrEqual(1);
    });

    it('should clamp intensity range values to 0-1', () => {
      const store = createMockProjectStore(mockProject);
      const actions: MusicAction[] = [
        {
          type: 'updateScene',
          target: 'scene-1',
          params: { intensityRange: [-0.1, 1.5] }, // Out of range
        },
      ];

      const result = applyMusicActions(actions, store);
      expect(result.success).toBe(1);
      const range = mockProject.scenes[0].intensityRange;
      expect(range[0]).toBe(0);
      expect(range[1]).toBe(1);
    });
  });

  describe('Key and Scale Validation', () => {
    it('should reject invalid key', () => {
      const store = createMockProjectStore(mockProject);
      const actions: MusicAction[] = [
        {
          type: 'changeKey',
          target: 'scene-1',
          params: { key: 'X', scale: 'major' }, // Invalid key
        },
      ];

      const result = applyMusicActions(actions, store);
      expect(result.success).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors[0]).toContain('Invalid key');
    });

    it('should reject invalid scale', () => {
      const store = createMockProjectStore(mockProject);
      const actions: MusicAction[] = [
        {
          type: 'changeKey',
          target: 'scene-1',
          params: { key: 'C', scale: 'invalid' }, // Invalid scale
        },
      ];

      const result = applyMusicActions(actions, store);
      expect(result.success).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors[0]).toContain('Invalid scale');
    });

    it('should accept valid key and scale', () => {
      const store = createMockProjectStore(mockProject);
      const actions: MusicAction[] = [
        {
          type: 'changeKey',
          target: 'scene-1',
          params: { key: 'D', scale: 'minor' },
        },
      ];

      const result = applyMusicActions(actions, store);
      expect(result.success).toBe(1);
      expect(mockProject.scenes[0].key).toBe('D');
      expect(mockProject.scenes[0].scale).toBe('minor');
    });

    it('should normalize scale to lowercase', () => {
      const store = createMockProjectStore(mockProject);
      const actions: MusicAction[] = [
        {
          type: 'changeKey',
          target: 'scene-1',
          params: { key: 'C', scale: 'MAJOR' }, // Uppercase
        },
      ];

      const result = applyMusicActions(actions, store);
      expect(result.success).toBe(1);
      expect(mockProject.scenes[0].scale).toBe('major');
    });
  });

  describe('Density and Probability Validation', () => {
    it('should clamp density to 0-1 range', () => {
      const store = createMockProjectStore(mockProject);
      const actions: MusicAction[] = [
        {
          type: 'updateClip',
          target: 'scene-1/track-1/clip-1',
          params: { density: 2.0 }, // Above maximum
        },
      ];

      const result = applyMusicActions(actions, store);
      expect(result.success).toBe(1);
      expect(mockProject.scenes[0].tracks[0].clips[0].density).toBe(1.0);
    });

    it('should clamp probability to 0-1 range', () => {
      const store = createMockProjectStore(mockProject);
      const actions: MusicAction[] = [
        {
          type: 'updateClip',
          target: 'scene-1/track-1/clip-1',
          params: { probability: -0.5 }, // Below minimum
        },
      ];

      const result = applyMusicActions(actions, store);
      expect(result.success).toBe(1);
      expect(mockProject.scenes[0].tracks[0].clips[0].probability).toBe(0);
    });
  });

  describe('Role Name Resolution', () => {
    it('should resolve "drums" role name to actual track ID', () => {
      const store = createMockProjectStore(mockProject);
      const actions: MusicAction[] = [
        {
          type: 'updateTrack',
          target: 'scene-1/drums', // Role name instead of ID
          params: { muted: true },
        },
      ];

      const result = applyMusicActions(actions, store);
      expect(result.success).toBe(1);
      expect(mockProject.scenes[0].tracks[0].muted).toBe(true);
    });

    it('should resolve "bass" role name to actual track ID', () => {
      const store = createMockProjectStore(mockProject);
      const actions: MusicAction[] = [
        {
          type: 'updateTrack',
          target: 'scene-1/bass', // Role name instead of ID
          params: { volume: 0.8 },
        },
      ];

      const result = applyMusicActions(actions, store);
      expect(result.success).toBe(1);
      expect(mockProject.scenes[0].tracks[1].volume).toBe(0.8);
    });
  });

  describe('Multiple Actions', () => {
    it('should handle multiple actions with mixed validations', () => {
      const store = createMockProjectStore(mockProject);
      const actions: MusicAction[] = [
        {
          type: 'updateScene',
          target: 'scene-1',
          params: { bpm: 500 }, // Will be clamped
        },
        {
          type: 'updateTrack',
          target: 'scene-1/track-1',
          params: { volume: 2.0 }, // Will be clamped
        },
        {
          type: 'changeKey',
          target: 'scene-1',
          params: { key: 'G', scale: 'major' }, // Valid
        },
      ];

      const result = applyMusicActions(actions, store);
      expect(result.success).toBe(3);
      expect(result.failed).toBe(0);
      expect(mockProject.scenes[0].bpm).toBe(MAX_BPM);
      expect(mockProject.scenes[0].tracks[0].volume).toBe(1.0);
      expect(mockProject.scenes[0].key).toBe('G');
    });
  });
});

