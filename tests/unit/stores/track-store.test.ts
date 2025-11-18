/**
 * Tests for track store
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { trackStore } from '@/stores/track-store';
import type { Project, Track } from '@/types';

describe('Track Store', () => {
  let mockProject: Project;
  const sceneId = 'scene-1';

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
          tracks: [],
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

  describe('addTrack', () => {
    it('should add a track to a scene', () => {
      const trackData: Omit<Track, 'id'> = {
        name: 'Track 1',
        type: 'melody',
        instrument: 'synth',
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        clips: [],
      };

      const result = trackStore.addTrack(mockProject, sceneId, trackData);

      expect(result.project.scenes[0].tracks).toHaveLength(1);
      expect(result.project.scenes[0].tracks[0]).toMatchObject({
        name: 'Track 1',
        type: 'melody',
        instrument: 'synth',
        volume: 0.8,
      });
      expect(result.project.scenes[0].tracks[0].id).toBeDefined();
    });

    it('should set selectedTrackId to the new track', () => {
      const trackData: Omit<Track, 'id'> = {
        name: 'Track 1',
        type: 'melody',
        instrument: 'synth',
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        clips: [],
      };

      const result = trackStore.addTrack(mockProject, sceneId, trackData);

      expect(result.selectedTrackId).toBe(result.project.scenes[0].tracks[0].id);
    });

    it('should add track to the correct scene', () => {
      const otherSceneId = 'scene-2';
      mockProject.scenes.push({
        id: otherSceneId,
        name: 'Scene 2',
        bpm: 120,
        timeSignature: { numerator: 4, denominator: 4 },
        tracks: [],
      });

      const trackData: Omit<Track, 'id'> = {
        name: 'Track 1',
        type: 'drums',
        instrument: 'drums',
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        clips: [],
      };

      const result = trackStore.addTrack(mockProject, otherSceneId, trackData);

      expect(result.project.scenes[0].tracks).toHaveLength(0);
      expect(result.project.scenes[1].tracks).toHaveLength(1);
    });

    it('should update modified timestamp', () => {
      const trackData: Omit<Track, 'id'> = {
        name: 'Track 1',
        type: 'melody',
        instrument: 'synth',
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        clips: [],
      };

      const result = trackStore.addTrack(mockProject, sceneId, trackData);

      expect(result.project.metadata.modified).toBeDefined();
      expect(typeof result.project.metadata.modified).toBe('string');
    });

    it('should add multiple tracks', () => {
      const trackData1: Omit<Track, 'id'> = {
        name: 'Track 1',
        type: 'melody',
        instrument: 'synth',
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        clips: [],
      };

      const trackData2: Omit<Track, 'id'> = {
        name: 'Track 2',
        type: 'drums',
        instrument: 'drums',
        volume: 0.7,
        pan: 0,
        muted: false,
        solo: false,
        clips: [],
      };

      let result = trackStore.addTrack(mockProject, sceneId, trackData1);
      result = trackStore.addTrack(result.project, sceneId, trackData2);

      expect(result.project.scenes[0].tracks).toHaveLength(2);
      expect(result.project.scenes[0].tracks[0].name).toBe('Track 1');
      expect(result.project.scenes[0].tracks[1].name).toBe('Track 2');
    });
  });

  describe('updateTrack', () => {
    let trackId: string;

    beforeEach(() => {
      const trackData: Omit<Track, 'id'> = {
        name: 'Track 1',
        type: 'melody',
        instrument: 'synth',
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        clips: [],
      };
      const result = trackStore.addTrack(mockProject, sceneId, trackData);
      mockProject = result.project;
      trackId = result.selectedTrackId;
    });

    it('should update track properties', () => {
      const updates = { name: 'Updated Track', volume: 0.5, pan: -0.5 };
      const result = trackStore.updateTrack(mockProject, sceneId, trackId, updates);

      expect(result.scenes[0].tracks[0].name).toBe('Updated Track');
      expect(result.scenes[0].tracks[0].volume).toBe(0.5);
      expect(result.scenes[0].tracks[0].pan).toBe(-0.5);
    });

    it('should update muted state', () => {
      const result = trackStore.updateTrack(mockProject, sceneId, trackId, { muted: true });

      expect(result.scenes[0].tracks[0].muted).toBe(true);
    });

    it('should update solo state', () => {
      const result = trackStore.updateTrack(mockProject, sceneId, trackId, { solo: true });

      expect(result.scenes[0].tracks[0].solo).toBe(true);
    });

    it('should update instrument', () => {
      const result = trackStore.updateTrack(mockProject, sceneId, trackId, { instrument: 'piano' });

      expect(result.scenes[0].tracks[0].instrument).toBe('piano');
    });

    it('should update only the specified track', () => {
      // Add another track
      const trackData2: Omit<Track, 'id'> = {
        name: 'Track 2',
        type: 'drums',
        instrument: 'drums',
        volume: 0.7,
        pan: 0,
        muted: false,
        solo: false,
        clips: [],
      };
      mockProject = trackStore.addTrack(mockProject, sceneId, trackData2).project;

      const result = trackStore.updateTrack(mockProject, sceneId, trackId, { volume: 0.5 });

      expect(result.scenes[0].tracks[0].volume).toBe(0.5);
      expect(result.scenes[0].tracks[1].volume).toBe(0.7); // Unchanged
    });

    it('should update modified timestamp', () => {
      const result = trackStore.updateTrack(mockProject, sceneId, trackId, { volume: 0.5 });

      expect(result.metadata.modified).toBeDefined();
      expect(typeof result.metadata.modified).toBe('string');
    });
  });

  describe('deleteTrack', () => {
    let trackId: string;

    beforeEach(() => {
      const trackData: Omit<Track, 'id'> = {
        name: 'Track 1',
        type: 'melody',
        instrument: 'synth',
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        clips: [],
      };
      const result = trackStore.addTrack(mockProject, sceneId, trackData);
      mockProject = result.project;
      trackId = result.selectedTrackId;
    });

    it('should delete a track', () => {
      const result = trackStore.deleteTrack(mockProject, null, sceneId, trackId);

      expect(result.project.scenes[0].tracks).toHaveLength(0);
    });

    it('should clear selectedTrackId if deleting selected track', () => {
      const result = trackStore.deleteTrack(mockProject, trackId, sceneId, trackId);

      expect(result.selectedTrackId).toBeNull();
    });

    it('should preserve selectedTrackId if deleting different track', () => {
      // Add another track
      const trackData2: Omit<Track, 'id'> = {
        name: 'Track 2',
        type: 'drums',
        instrument: 'drums',
        volume: 0.7,
        pan: 0,
        muted: false,
        solo: false,
        clips: [],
      };
      const result2 = trackStore.addTrack(mockProject, sceneId, trackData2);
      mockProject = result2.project;
      const trackId2 = result2.selectedTrackId;

      const result = trackStore.deleteTrack(mockProject, trackId, sceneId, trackId2);

      expect(result.selectedTrackId).toBe(trackId);
    });

    it('should delete only the specified track', () => {
      // Add another track
      const trackData2: Omit<Track, 'id'> = {
        name: 'Track 2',
        type: 'drums',
        instrument: 'drums',
        volume: 0.7,
        pan: 0,
        muted: false,
        solo: false,
        clips: [],
      };
      const result2 = trackStore.addTrack(mockProject, sceneId, trackData2);
      mockProject = result2.project;
      const trackId2 = result2.selectedTrackId;

      const result = trackStore.deleteTrack(mockProject, null, sceneId, trackId);

      expect(result.project.scenes[0].tracks).toHaveLength(1);
      expect(result.project.scenes[0].tracks[0].id).toBe(trackId2);
    });

    it('should update modified timestamp', () => {
      const result = trackStore.deleteTrack(mockProject, null, sceneId, trackId);

      expect(result.project.metadata.modified).toBeDefined();
      expect(typeof result.project.metadata.modified).toBe('string');
    });
  });
});
