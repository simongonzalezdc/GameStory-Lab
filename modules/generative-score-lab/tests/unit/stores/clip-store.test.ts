/**
 * Tests for clip store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clipStore } from '@/stores/clip-store';
import type { Clip, Project, Scene, Track } from '@/types';
import { errorHandler } from '@/lib/errors/error-handler';

describe('Clip Store', () => {
  let mockProject: Project;
  const sceneId = 'scene-1';
  const trackId = 'track-1';

  beforeEach(() => {
    mockProject = {
      id: 'project-1',
      name: 'Test Project',
      bpm: 120,
      timeSignature: { numerator: 4, denominator: 4 },
      key: 'C',
      scale: 'major',
      scenes: [
        {
          id: sceneId,
          name: 'Scene 1',
          bpm: 120,
          timeSignature: { numerator: 4, denominator: 4 },
          tracks: [
            {
              id: trackId,
              name: 'Track 1',
              type: 'melody',
              instrument: 'synth',
              volume: 0.8,
              pan: 0,
              muted: false,
              solo: false,
              clips: [],
            },
          ],
        },
      ],
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        version: '1.0.0',
        author: 'Test Author',
      },
    };
  });

  describe('addClip', () => {
    it('should add a clip to a track', () => {
      const clipData: Omit<Clip, 'id'> = {
        type: 'generated',
        startBar: 0,
        lengthBars: 4,
        generatorType: 'euclidean',
        generatorParams: {},
        customNotes: [],
      };

      const result = clipStore.addClip(mockProject, sceneId, trackId, clipData);

      expect(result.scenes[0].tracks[0].clips).toHaveLength(1);
      expect(result.scenes[0].tracks[0].clips[0]).toMatchObject({
        type: 'generated',
        startBar: 0,
        lengthBars: 4,
        generatorType: 'euclidean',
      });
      expect(result.scenes[0].tracks[0].clips[0].id).toBeDefined();
      expect(result.metadata.modified).toBeDefined();
    });

    it('should initialize customNotes as empty array if not provided', () => {
      const clipData: Omit<Clip, 'id'> = {
        type: 'generated',
        startBar: 0,
        lengthBars: 4,
        generatorType: 'euclidean',
        generatorParams: {},
      } as Omit<Clip, 'id'>;

      const result = clipStore.addClip(mockProject, sceneId, trackId, clipData);

      expect(result.scenes[0].tracks[0].clips[0].customNotes).toEqual([]);
    });

    it('should add a clip with custom notes', () => {
      const clipData: Omit<Clip, 'id'> = {
        type: 'custom',
        startBar: 0,
        lengthBars: 2,
        customNotes: [
          { pitch: 60, startTime: 0, duration: 0.5, velocity: 0.8 },
          { pitch: 64, startTime: 0.5, duration: 0.5, velocity: 0.8 },
        ],
      };

      const result = clipStore.addClip(mockProject, sceneId, trackId, clipData);

      expect(result.scenes[0].tracks[0].clips[0].customNotes).toHaveLength(2);
    });

    it('should add clip to correct scene and track', () => {
      const otherSceneId = 'scene-2';
      const otherTrackId = 'track-2';

      mockProject.scenes.push({
        id: otherSceneId,
        name: 'Scene 2',
        bpm: 120,
        timeSignature: { numerator: 4, denominator: 4 },
        tracks: [
          {
            id: otherTrackId,
            name: 'Track 2',
            type: 'drums',
            instrument: 'drums',
            volume: 0.8,
            pan: 0,
            muted: false,
            solo: false,
            clips: [],
          },
        ],
      });

      const clipData: Omit<Clip, 'id'> = {
        type: 'generated',
        startBar: 0,
        lengthBars: 4,
        generatorType: 'euclidean',
        generatorParams: {},
        customNotes: [],
      };

      const result = clipStore.addClip(mockProject, otherSceneId, otherTrackId, clipData);

      expect(result.scenes[0].tracks[0].clips).toHaveLength(0);
      expect(result.scenes[1].tracks[0].clips).toHaveLength(1);
    });
  });

  describe('updateClip', () => {
    let clipId: string;

    beforeEach(() => {
      const clipData: Omit<Clip, 'id'> = {
        type: 'generated',
        startBar: 0,
        lengthBars: 4,
        generatorType: 'euclidean',
        generatorParams: {},
        customNotes: [],
      };
      mockProject = clipStore.addClip(mockProject, sceneId, trackId, clipData);
      clipId = mockProject.scenes[0].tracks[0].clips[0].id;
    });

    it('should update clip properties', () => {
      const updates = { lengthBars: 8, startBar: 4 };
      const result = clipStore.updateClip(mockProject, sceneId, trackId, clipId, updates);

      expect(result.scenes[0].tracks[0].clips[0].lengthBars).toBe(8);
      expect(result.scenes[0].tracks[0].clips[0].startBar).toBe(4);
    });

    it('should validate clip length minimum', () => {
      vi.spyOn(errorHandler, 'handle');
      const result = clipStore.updateClip(mockProject, sceneId, trackId, clipId, { lengthBars: 0 });

      expect(errorHandler.handle).toHaveBeenCalledWith(
        expect.any(Error),
        'Clip Update',
        expect.anything()
      );
      expect(result.scenes[0].tracks[0].clips[0].lengthBars).toBe(4); // Unchanged
    });

    it('should validate clip length maximum', () => {
      vi.spyOn(errorHandler, 'handle');
      const result = clipStore.updateClip(mockProject, sceneId, trackId, clipId, { lengthBars: 200 });

      expect(errorHandler.handle).toHaveBeenCalledWith(
        expect.any(Error),
        'Clip Update',
        expect.anything()
      );
      expect(result.scenes[0].tracks[0].clips[0].lengthBars).toBe(4); // Unchanged
    });

    it('should accept valid clip length', () => {
      const result = clipStore.updateClip(mockProject, sceneId, trackId, clipId, { lengthBars: 16 });

      expect(result.scenes[0].tracks[0].clips[0].lengthBars).toBe(16);
    });

    it('should update only the specified clip', () => {
      // Add another clip
      const clipData2: Omit<Clip, 'id'> = {
        type: 'generated',
        startBar: 4,
        lengthBars: 4,
        generatorType: 'markov',
        generatorParams: {},
        customNotes: [],
      };
      mockProject = clipStore.addClip(mockProject, sceneId, trackId, clipData2);

      const result = clipStore.updateClip(mockProject, sceneId, trackId, clipId, { lengthBars: 8 });

      expect(result.scenes[0].tracks[0].clips[0].lengthBars).toBe(8);
      expect(result.scenes[0].tracks[0].clips[1].lengthBars).toBe(4); // Unchanged
    });
  });

  describe('deleteClip', () => {
    let clipId: string;

    beforeEach(() => {
      const clipData: Omit<Clip, 'id'> = {
        type: 'generated',
        startBar: 0,
        lengthBars: 4,
        generatorType: 'euclidean',
        generatorParams: {},
        customNotes: [],
      };
      mockProject = clipStore.addClip(mockProject, sceneId, trackId, clipData);
      clipId = mockProject.scenes[0].tracks[0].clips[0].id;
    });

    it('should delete a clip', () => {
      const result = clipStore.deleteClip(mockProject, sceneId, trackId, clipId);

      expect(result.scenes[0].tracks[0].clips).toHaveLength(0);
    });

    it('should delete only the specified clip', () => {
      // Add another clip
      const clipData2: Omit<Clip, 'id'> = {
        type: 'generated',
        startBar: 4,
        lengthBars: 4,
        generatorType: 'markov',
        generatorParams: {},
        customNotes: [],
      };
      mockProject = clipStore.addClip(mockProject, sceneId, trackId, clipData2);
      const clipId2 = mockProject.scenes[0].tracks[0].clips[1].id;

      const result = clipStore.deleteClip(mockProject, sceneId, trackId, clipId);

      expect(result.scenes[0].tracks[0].clips).toHaveLength(1);
      expect(result.scenes[0].tracks[0].clips[0].id).toBe(clipId2);
    });

    it('should update modified timestamp', () => {
      const result = clipStore.deleteClip(mockProject, sceneId, trackId, clipId);

      expect(result.metadata.modified).toBeDefined();
      expect(typeof result.metadata.modified).toBe('string');
    });
  });
});
