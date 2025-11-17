import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, Scene, Track, Clip } from '@/types';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';
import { MIN_BPM, MAX_BPM } from '@/lib/utils/constants';

interface ProjectState {
  // State
  project: Project | null;
  currentSceneId: string | null;
  selectedTrackId: string | null;
  isDirty: boolean;

  // Actions
  loadProject: (project: Project) => void;
  createNewProject: (name: string) => void;
  updateProject: (updates: Partial<Omit<Project, 'scenes'>>) => void;

  // Scene operations
  addScene: (scene: Omit<Scene, 'id'>) => void;
  updateScene: (sceneId: string, updates: Partial<Scene>) => void;
  deleteScene: (sceneId: string) => void;
  duplicateScene: (sceneId: string) => void;
  setCurrentScene: (sceneId: string | null) => void;

  // Track operations
  addTrack: (sceneId: string, track: Omit<Track, 'id'>) => void;
  updateTrack: (sceneId: string, trackId: string, updates: Partial<Track>) => void;
  deleteTrack: (sceneId: string, trackId: string) => void;
  setSelectedTrack: (trackId: string | null) => void;

  // Clip operations
  addClip: (sceneId: string, trackId: string, clip: Omit<Clip, 'id'>) => void;
  updateClip: (
    sceneId: string,
    trackId: string,
    clipId: string,
    updates: Partial<Clip>
  ) => void;
  deleteClip: (sceneId: string, trackId: string, clipId: string) => void;

  // Import/Export
  exportProject: () => string;
  importProject: (json: string) => void;

  // Utility
  markDirty: () => void;
  markClean: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      project: null,
      currentSceneId: null,
      selectedTrackId: null,
      isDirty: false,

      loadProject: (project) => {
        set({ project, isDirty: false });
      },

      createNewProject: (name) => {
        const newProject: Project = {
          schemaVersion: '1.0.0',
          projectId: crypto.randomUUID(),
          name,
          bpm: 120,
          timeSignature: '4/4',
          defaultKey: 'C',
          defaultScale: 'major',
          scenes: [],
          metadata: {
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
          },
        };
        set({ project: newProject, isDirty: false, currentSceneId: null });
      },

      updateProject: (updates) => {
        const { project } = get();
        if (!project) return;

        // Validate BPM if being updated
        if (updates.bpm !== undefined) {
          if (typeof updates.bpm !== 'number' || updates.bpm < MIN_BPM || updates.bpm > MAX_BPM) {
            errorHandler.handle(
              new Error(`BPM must be between ${MIN_BPM} and ${MAX_BPM}`),
              'Project Update',
              ErrorSeverity.WARNING
            );
            return;
          }
        }

        set({
          project: {
            ...project,
            ...updates,
            metadata: {
              ...project.metadata,
              modified: new Date().toISOString(),
            },
          },
          isDirty: true,
        });
      },

      addScene: (sceneData) => {
        const { project } = get();
        if (!project) return;

        const newScene: Scene = {
          ...sceneData,
          id: crypto.randomUUID(),
        };

        set({
          project: {
            ...project,
            scenes: [...project.scenes, newScene],
            metadata: {
              ...project.metadata,
              modified: new Date().toISOString(),
            },
          },
          isDirty: true,
          currentSceneId: newScene.id,
        });
      },

      updateScene: (sceneId, updates) => {
        const { project } = get();
        if (!project) return;

        const updatedScenes = project.scenes.map((scene) =>
          scene.id === sceneId ? { ...scene, ...updates } : scene
        );

        set({
          project: {
            ...project,
            scenes: updatedScenes,
            metadata: {
              ...project.metadata,
              modified: new Date().toISOString(),
            },
          },
          isDirty: true,
        });
      },

      deleteScene: (sceneId) => {
        const { project, currentSceneId } = get();
        if (!project) return;
        if (project.scenes.length === 1) {
          errorHandler.handle(
            new Error('Cannot delete the last scene in a project'),
            'Scene Deletion',
            ErrorSeverity.WARNING
          );
          return;
        }

        const updatedScenes = project.scenes.filter((scene) => scene.id !== sceneId);
        const newCurrentSceneId = currentSceneId === sceneId ? null : currentSceneId;

        set({
          project: {
            ...project,
            scenes: updatedScenes,
            metadata: {
              ...project.metadata,
              modified: new Date().toISOString(),
            },
          },
          currentSceneId: newCurrentSceneId,
          isDirty: true,
        });
      },

      duplicateScene: (sceneId) => {
        const { project } = get();
        if (!project) return;

        const sceneToDuplicate = project.scenes.find((s) => s.id === sceneId);
        if (!sceneToDuplicate) return;

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

        set({
          project: {
            ...project,
            scenes: [...project.scenes, duplicatedScene],
            metadata: {
              ...project.metadata,
              modified: new Date().toISOString(),
            },
          },
          isDirty: true,
        });
      },

      setCurrentScene: (sceneId) => {
        set({ currentSceneId: sceneId });
      },

      addTrack: (sceneId, trackData) => {
        const { project } = get();
        if (!project) return;

        const newTrack: Track = {
          ...trackData,
          id: crypto.randomUUID(),
        };

        const updatedScenes = project.scenes.map((scene) =>
          scene.id === sceneId
            ? { ...scene, tracks: [...scene.tracks, newTrack] }
            : scene
        );

        set({
          project: {
            ...project,
            scenes: updatedScenes,
            metadata: {
              ...project.metadata,
              modified: new Date().toISOString(),
            },
          },
          isDirty: true,
          selectedTrackId: newTrack.id,
        });
      },

      updateTrack: (sceneId, trackId, updates) => {
        const { project } = get();
        if (!project) return;

        const updatedScenes = project.scenes.map((scene) =>
          scene.id === sceneId
            ? {
                ...scene,
                tracks: scene.tracks.map((track) =>
                  track.id === trackId ? { ...track, ...updates } : track
                ),
              }
            : scene
        );

        set({
          project: {
            ...project,
            scenes: updatedScenes,
            metadata: {
              ...project.metadata,
              modified: new Date().toISOString(),
            },
          },
          isDirty: true,
        });
      },

      deleteTrack: (sceneId, trackId) => {
        const { project, selectedTrackId } = get();
        if (!project) return;

        const updatedScenes = project.scenes.map((scene) =>
          scene.id === sceneId
            ? {
                ...scene,
                tracks: scene.tracks.filter((track) => track.id !== trackId),
              }
            : scene
        );

        const newSelectedTrackId = selectedTrackId === trackId ? null : selectedTrackId;

        set({
          project: {
            ...project,
            scenes: updatedScenes,
            metadata: {
              ...project.metadata,
              modified: new Date().toISOString(),
            },
          },
          selectedTrackId: newSelectedTrackId,
          isDirty: true,
        });
      },

      setSelectedTrack: (trackId) => {
        set({ selectedTrackId: trackId });
      },

      addClip: (sceneId, trackId, clipData) => {
        const { project } = get();
        if (!project) return;

        const newClip: Clip = {
          ...clipData,
          id: crypto.randomUUID(),
        };

        const updatedScenes = project.scenes.map((scene) =>
          scene.id === sceneId
            ? {
                ...scene,
                tracks: scene.tracks.map((track) =>
                  track.id === trackId
                    ? { ...track, clips: [...track.clips, newClip] }
                    : track
                ),
              }
            : scene
        );

        set({
          project: {
            ...project,
            scenes: updatedScenes,
            metadata: {
              ...project.metadata,
              modified: new Date().toISOString(),
            },
          },
          isDirty: true,
        });
      },

      updateClip: (sceneId, trackId, clipId, updates) => {
        const { project } = get();
        if (!project) return;

        const updatedScenes = project.scenes.map((scene) =>
          scene.id === sceneId
            ? {
                ...scene,
                tracks: scene.tracks.map((track) =>
                  track.id === trackId
                    ? {
                        ...track,
                        clips: track.clips.map((clip) =>
                          clip.id === clipId ? { ...clip, ...updates } : clip
                        ),
                      }
                    : track
                ),
              }
            : scene
        );

        set({
          project: {
            ...project,
            scenes: updatedScenes,
            metadata: {
              ...project.metadata,
              modified: new Date().toISOString(),
            },
          },
          isDirty: true,
        });
      },

      deleteClip: (sceneId, trackId, clipId) => {
        const { project } = get();
        if (!project) return;

        const updatedScenes = project.scenes.map((scene) =>
          scene.id === sceneId
            ? {
                ...scene,
                tracks: scene.tracks.map((track) =>
                  track.id === trackId
                    ? {
                        ...track,
                        clips: track.clips.filter((clip) => clip.id !== clipId),
                      }
                    : track
                ),
              }
            : scene
        );

        set({
          project: {
            ...project,
            scenes: updatedScenes,
            metadata: {
              ...project.metadata,
              modified: new Date().toISOString(),
            },
          },
          isDirty: true,
        });
      },

      exportProject: () => {
        const { project } = get();
        if (!project) return '{}';
        return JSON.stringify(project, null, 2);
      },

      importProject: (json) => {
        try {
          const project: Project = JSON.parse(json);
          // Basic validation
          if (!project.schemaVersion || !project.projectId) {
            throw new Error('Invalid project file');
          }
          set({ project, isDirty: false });
        } catch (error) {
          errorHandler.handle(error, 'Project Import', ErrorSeverity.ERROR);
          throw new Error('Invalid project JSON');
        }
      },

      markDirty: () => set({ isDirty: true }),
      markClean: () => set({ isDirty: false }),
    }),
    {
      name: 'generative-score-lab-project',
      partialize: (state) => ({ project: state.project }),
    }
  )
);
