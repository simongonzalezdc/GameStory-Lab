/**
 * Scene store - manages scene operations
 * Extracted from project-store for better organization
 */

import type { Scene } from '@/types';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';
import { MIN_BPM, MAX_BPM } from '@/lib/utils/constants';

export interface SceneStoreActions {
  addScene: (project: any, sceneData: Omit<Scene, 'id'>) => { project: any; currentSceneId: string | null };
  updateScene: (project: any, sceneId: string, updates: Partial<Scene>) => any;
  deleteScene: (project: any, currentSceneId: string | null, sceneId: string) => { project: any; currentSceneId: string | null };
  duplicateScene: (project: any, sceneId: string) => any;
}

export const sceneStore: SceneStoreActions = {
  addScene: (project, sceneData) => {
    const newScene: Scene = {
      ...sceneData,
      id: crypto.randomUUID(),
    };

    return {
      project: {
        ...project,
        scenes: [...project.scenes, newScene],
        metadata: {
          ...project.metadata,
          modified: new Date().toISOString(),
        },
      },
      currentSceneId: newScene.id,
    };
  },

  updateScene: (project, sceneId, updates) => {
    // Validate BPM if being updated
    if (updates.bpm !== undefined) {
      if (typeof updates.bpm !== 'number' || updates.bpm < MIN_BPM || updates.bpm > MAX_BPM) {
        errorHandler.handle(
          new Error(`Scene BPM must be between ${MIN_BPM} and ${MAX_BPM}`),
          'Scene Update',
          ErrorSeverity.WARNING
        );
        return project; // Return unchanged
      }
    }

    const updatedScenes = project.scenes.map((scene: Scene) =>
      scene.id === sceneId ? { ...scene, ...updates } : scene
    );

    return {
      ...project,
      scenes: updatedScenes,
      metadata: {
        ...project.metadata,
        modified: new Date().toISOString(),
      },
    };
  },

  deleteScene: (project, currentSceneId, sceneId) => {
    if (project.scenes.length === 1) {
      errorHandler.handle(
        new Error('Cannot delete the last scene in a project'),
        'Scene Deletion',
        ErrorSeverity.WARNING
      );
      return { project, currentSceneId };
    }

    const updatedScenes = project.scenes.filter((scene: Scene) => scene.id !== sceneId);
    const newCurrentSceneId = currentSceneId === sceneId ? null : currentSceneId;

    return {
      project: {
        ...project,
        scenes: updatedScenes,
        metadata: {
          ...project.metadata,
          modified: new Date().toISOString(),
        },
      },
      currentSceneId: newCurrentSceneId,
    };
  },

  duplicateScene: (project, sceneId) => {
    const sceneToDuplicate = project.scenes.find((s: Scene) => s.id === sceneId);
    if (!sceneToDuplicate) return project;

    const duplicatedScene: Scene = {
      ...sceneToDuplicate,
      id: crypto.randomUUID(),
      name: `${sceneToDuplicate.name} (Copy)`,
      tracks: sceneToDuplicate.tracks.map((track) => ({
        ...track,
        id: crypto.randomUUID(),
        clips: track.clips.map((clip) => ({
          ...clip,
          id: crypto.randomUUID(),
        })),
      })),
    };

    return {
      ...project,
      scenes: [...project.scenes, duplicatedScene],
      metadata: {
        ...project.metadata,
        modified: new Date().toISOString(),
      },
    };
  },
};

