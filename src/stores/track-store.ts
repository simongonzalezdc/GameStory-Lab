/**
 * Track store - manages track operations
 * Extracted from project-store for better organization
 */

import type { Track } from '@/types';

export interface TrackStoreActions {
  addTrack: (project: any, sceneId: string, trackData: Omit<Track, 'id'>) => { project: any; selectedTrackId: string };
  updateTrack: (project: any, sceneId: string, trackId: string, updates: Partial<Track>) => any;
  deleteTrack: (project: any, selectedTrackId: string | null, sceneId: string, trackId: string) => { project: any; selectedTrackId: string | null };
}

export const trackStore: TrackStoreActions = {
  addTrack: (project, sceneId, trackData) => {
    const newTrack: Track = {
      ...trackData,
      id: crypto.randomUUID(),
    };

    const updatedScenes = project.scenes.map((scene: any) =>
      scene.id === sceneId
        ? { ...scene, tracks: [...scene.tracks, newTrack] }
        : scene
    );

    return {
      project: {
        ...project,
        scenes: updatedScenes,
        metadata: {
          ...project.metadata,
          modified: new Date().toISOString(),
        },
      },
      selectedTrackId: newTrack.id,
    };
  },

  updateTrack: (project, sceneId, trackId, updates) => {
    const updatedScenes = project.scenes.map((scene: any) =>
      scene.id === sceneId
        ? {
            ...scene,
            tracks: scene.tracks.map((track: Track) =>
              track.id === trackId ? { ...track, ...updates } : track
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

  deleteTrack: (project, selectedTrackId, sceneId, trackId) => {
    const updatedScenes = project.scenes.map((scene: any) =>
      scene.id === sceneId
        ? {
            ...scene,
            tracks: scene.tracks.filter((track: Track) => track.id !== trackId),
          }
        : scene
    );

    const newSelectedTrackId = selectedTrackId === trackId ? null : selectedTrackId;

    return {
      project: {
        ...project,
        scenes: updatedScenes,
        metadata: {
          ...project.metadata,
          modified: new Date().toISOString(),
        },
      },
      selectedTrackId: newSelectedTrackId,
    };
  },
};

