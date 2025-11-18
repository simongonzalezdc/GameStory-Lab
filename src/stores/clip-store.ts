/**
 * Clip store - manages clip operations
 * Extracted from project-store for better organization
 */

import type { Clip } from '@/types';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';

export interface ClipStoreActions {
  addClip: (project: any, sceneId: string, trackId: string, clipData: Omit<Clip, 'id'>) => any;
  updateClip: (project: any, sceneId: string, trackId: string, clipId: string, updates: Partial<Clip>) => any;
  deleteClip: (project: any, sceneId: string, trackId: string, clipId: string) => any;
}

export const clipStore: ClipStoreActions = {
  addClip: (project, sceneId, trackId, clipData) => {
    const newClip: Clip = {
      ...clipData,
      id: crypto.randomUUID(),
    };

    const updatedScenes = project.scenes.map((scene: any) =>
      scene.id === sceneId
        ? {
            ...scene,
            tracks: scene.tracks.map((track: any) =>
              track.id === trackId
                ? { ...track, clips: [...track.clips, newClip] }
                : track
            ),
          }
        : scene
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

  updateClip: (project, sceneId, trackId, clipId, updates) => {
    // Validate clip length if being updated
    if (updates.lengthBars !== undefined) {
      if (typeof updates.lengthBars !== 'number' || updates.lengthBars < 1 || updates.lengthBars > 128) {
        errorHandler.handle(
          new Error('Clip length must be between 1 and 128 bars'),
          'Clip Update',
          ErrorSeverity.WARNING
        );
        return project; // Return unchanged
      }
    }

    const updatedScenes = project.scenes.map((scene: any) =>
      scene.id === sceneId
        ? {
            ...scene,
            tracks: scene.tracks.map((track: any) =>
              track.id === trackId
                ? {
                    ...track,
                    clips: track.clips.map((clip: Clip) =>
                      clip.id === clipId ? { ...clip, ...updates } : clip
                    ),
                  }
                : track
            ),
          }
        : scene
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

  deleteClip: (project, sceneId, trackId, clipId) => {
    const updatedScenes = project.scenes.map((scene: any) =>
      scene.id === sceneId
        ? {
            ...scene,
            tracks: scene.tracks.map((track: any) =>
              track.id === trackId
                ? {
                    ...track,
                    clips: track.clips.filter((clip: Clip) => clip.id !== clipId),
                  }
                : track
            ),
          }
        : scene
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
};

