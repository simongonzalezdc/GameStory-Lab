/**
 * Tests for scene store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sceneStore } from '@/stores/scene-store';
import type { Project, Scene } from '@/types';
import { errorHandler } from '@/lib/errors/error-handler';
import { MIN_BPM, MAX_BPM } from '@/lib/utils/constants';

describe('Scene Store', () => {
  let mockProject: Project;

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
          id: 'scene-1',
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

  describe('addScene', () => {
    it('should add a new scene to the project', () => {
      const sceneData: Omit<Scene, 'id'> = {
        name: 'Scene 2',
        bpm: 140,
        timeSignature: { numerator: 3, denominator: 4 },
        tracks: [],
      };

      const result = sceneStore.addScene(mockProject, sceneData);

      expect(result.project.scenes).toHaveLength(2);
      expect(result.project.scenes[1]).toMatchObject({
        name: 'Scene 2',
        bpm: 140,
        timeSignature: { numerator: 3, denominator: 4 },
      });
      expect(result.project.scenes[1].id).toBeDefined();
      expect(result.currentSceneId).toBe(result.project.scenes[1].id);
    });

    it('should update modified timestamp', () => {
      const sceneData: Omit<Scene, 'id'> = {
        name: 'Scene 2',
        bpm: 140,
        timeSignature: { numerator: 4, denominator: 4 },
        tracks: [],
      };

      const result = sceneStore.addScene(mockProject, sceneData);

      expect(result.project.metadata.modified).toBeDefined();
      expect(typeof result.project.metadata.modified).toBe('string');
    });

    it('should set current scene to the newly added scene', () => {
      const sceneData: Omit<Scene, 'id'> = {
        name: 'Scene 2',
        bpm: 140,
        timeSignature: { numerator: 4, denominator: 4 },
        tracks: [],
      };

      const result = sceneStore.addScene(mockProject, sceneData);

      expect(result.currentSceneId).toBeTruthy();
      expect(result.currentSceneId).toBe(result.project.scenes[1].id);
    });
  });

  describe('updateScene', () => {
    it('should update scene properties', () => {
      const sceneId = mockProject.scenes[0].id;
      const updates = { name: 'Updated Scene', bpm: 140 };

      const result = sceneStore.updateScene(mockProject, sceneId, updates);

      expect(result.scenes[0].name).toBe('Updated Scene');
      expect(result.scenes[0].bpm).toBe(140);
    });

    it('should validate BPM minimum', () => {
      vi.spyOn(errorHandler, 'handle');
      const sceneId = mockProject.scenes[0].id;
      const result = sceneStore.updateScene(mockProject, sceneId, { bpm: MIN_BPM - 1 });

      expect(errorHandler.handle).toHaveBeenCalledWith(
        expect.any(Error),
        'Scene Update',
        expect.anything()
      );
      expect(result.scenes[0].bpm).toBe(120); // Unchanged
    });

    it('should validate BPM maximum', () => {
      vi.spyOn(errorHandler, 'handle');
      const sceneId = mockProject.scenes[0].id;
      const result = sceneStore.updateScene(mockProject, sceneId, { bpm: MAX_BPM + 1 });

      expect(errorHandler.handle).toHaveBeenCalledWith(
        expect.any(Error),
        'Scene Update',
        expect.anything()
      );
      expect(result.scenes[0].bpm).toBe(120); // Unchanged
    });

    it('should accept valid BPM values', () => {
      const sceneId = mockProject.scenes[0].id;
      const result = sceneStore.updateScene(mockProject, sceneId, { bpm: 140 });

      expect(result.scenes[0].bpm).toBe(140);
    });

    it('should update only the specified scene', () => {
      // Add another scene
      const { project: updatedProject } = sceneStore.addScene(mockProject, {
        name: 'Scene 2',
        bpm: 100,
        timeSignature: { numerator: 4, denominator: 4 },
        tracks: [],
      });

      const sceneId = updatedProject.scenes[0].id;
      const result = sceneStore.updateScene(updatedProject, sceneId, { bpm: 150 });

      expect(result.scenes[0].bpm).toBe(150);
      expect(result.scenes[1].bpm).toBe(100); // Unchanged
    });

    it('should update modified timestamp', () => {
      const sceneId = mockProject.scenes[0].id;
      const result = sceneStore.updateScene(mockProject, sceneId, { name: 'Updated' });

      expect(result.metadata.modified).toBeDefined();
      expect(typeof result.metadata.modified).toBe('string');
    });
  });

  describe('deleteScene', () => {
    beforeEach(() => {
      // Add a second scene so we can test deletion
      const result = sceneStore.addScene(mockProject, {
        name: 'Scene 2',
        bpm: 140,
        timeSignature: { numerator: 4, denominator: 4 },
        tracks: [],
      });
      mockProject = result.project;
    });

    it('should delete a scene', () => {
      const sceneId = mockProject.scenes[1].id;
      const result = sceneStore.deleteScene(mockProject, null, sceneId);

      expect(result.project.scenes).toHaveLength(1);
      expect(result.project.scenes.find((s: Scene) => s.id === sceneId)).toBeUndefined();
    });

    it('should not delete the last scene', () => {
      vi.spyOn(errorHandler, 'handle');
      const projectWithOneScene = {
        ...mockProject,
        scenes: [mockProject.scenes[0]],
      };

      const sceneId = projectWithOneScene.scenes[0].id;
      const result = sceneStore.deleteScene(projectWithOneScene, sceneId, sceneId);

      expect(errorHandler.handle).toHaveBeenCalledWith(
        expect.any(Error),
        'Scene Deletion',
        expect.anything()
      );
      expect(result.project.scenes).toHaveLength(1);
    });

    it('should update currentSceneId if deleting current scene', () => {
      const sceneId = mockProject.scenes[0].id;
      const result = sceneStore.deleteScene(mockProject, sceneId, sceneId);

      expect(result.currentSceneId).toBeNull();
    });

    it('should preserve currentSceneId if deleting different scene', () => {
      const currentSceneId = mockProject.scenes[0].id;
      const sceneIdToDelete = mockProject.scenes[1].id;
      const result = sceneStore.deleteScene(mockProject, currentSceneId, sceneIdToDelete);

      expect(result.currentSceneId).toBe(currentSceneId);
    });

    it('should update modified timestamp', () => {
      const sceneId = mockProject.scenes[1].id;
      const result = sceneStore.deleteScene(mockProject, null, sceneId);

      expect(result.project.metadata.modified).toBeDefined();
      expect(typeof result.project.metadata.modified).toBe('string');
    });
  });

  describe('duplicateScene', () => {
    it('should duplicate a scene', () => {
      const sceneId = mockProject.scenes[0].id;
      const result = sceneStore.duplicateScene(mockProject, sceneId);

      expect(result.scenes).toHaveLength(2);
      expect(result.scenes[1].name).toBe('Scene 1 (Copy)');
      expect(result.scenes[1].bpm).toBe(mockProject.scenes[0].bpm);
      expect(result.scenes[1].id).not.toBe(sceneId);
    });

    it('should duplicate scene with tracks', () => {
      mockProject.scenes[0].tracks = [
        {
          id: 'track-1',
          name: 'Track 1',
          type: 'melody',
          instrument: 'synth',
          volume: 0.8,
          pan: 0,
          muted: false,
          solo: false,
          clips: [],
        },
      ];

      const sceneId = mockProject.scenes[0].id;
      const result = sceneStore.duplicateScene(mockProject, sceneId);

      expect(result.scenes[1].tracks).toHaveLength(1);
      expect(result.scenes[1].tracks[0].name).toBe('Track 1');
      expect(result.scenes[1].tracks[0].id).not.toBe('track-1');
    });

    it('should duplicate scene with clips', () => {
      mockProject.scenes[0].tracks = [
        {
          id: 'track-1',
          name: 'Track 1',
          type: 'melody',
          instrument: 'synth',
          volume: 0.8,
          pan: 0,
          muted: false,
          solo: false,
          clips: [
            {
              id: 'clip-1',
              type: 'generated',
              startBar: 0,
              lengthBars: 4,
              generatorType: 'euclidean',
              generatorParams: {},
              customNotes: [],
            },
          ],
        },
      ];

      const sceneId = mockProject.scenes[0].id;
      const result = sceneStore.duplicateScene(mockProject, sceneId);

      expect(result.scenes[1].tracks[0].clips).toHaveLength(1);
      expect(result.scenes[1].tracks[0].clips[0].id).not.toBe('clip-1');
      expect(result.scenes[1].tracks[0].clips[0].generatorType).toBe('euclidean');
    });

    it('should return unchanged project if scene not found', () => {
      const result = sceneStore.duplicateScene(mockProject, 'non-existent-id');

      expect(result).toEqual(mockProject);
    });

    it('should update modified timestamp', () => {
      const sceneId = mockProject.scenes[0].id;
      const result = sceneStore.duplicateScene(mockProject, sceneId);

      expect(result.metadata.modified).toBeDefined();
      expect(typeof result.metadata.modified).toBe('string');
    });
  });
});
