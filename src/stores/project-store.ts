import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, Scene, Track, Clip } from '@/types';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';
import { MIN_BPM, MAX_BPM } from '@/lib/utils/constants';
import { useHistoryStore } from './history-store';
import { sceneStore } from './scene-store';
import { trackStore } from './track-store';
import { clipStore } from './clip-store';

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
  reorderScenes: (fromIndex: number, toIndex: number) => void;
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
  
  // History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
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
        useHistoryStore.getState().push(project);
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
        useHistoryStore.getState().push(newProject);
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

        const updatedProject = {
          ...project,
          ...updates,
          metadata: {
            ...project.metadata,
            modified: new Date().toISOString(),
          },
        };
        set({
          project: updatedProject,
          isDirty: true,
        });
        useHistoryStore.getState().push(updatedProject);
      },

      addScene: (sceneData) => {
        const { project } = get();
        if (!project) return;

        const result = sceneStore.addScene(project, sceneData);
        set({
          project: result.project,
          isDirty: true,
          currentSceneId: result.currentSceneId,
        });
        useHistoryStore.getState().push(result.project);
      },

      updateScene: (sceneId, updates) => {
        const { project } = get();
        if (!project) return;

        const updatedProject = sceneStore.updateScene(project, sceneId, updates);
        if (updatedProject === project) return; // Validation failed, no change

        set({
          project: updatedProject,
          isDirty: true,
        });
        useHistoryStore.getState().push(updatedProject);
      },

      deleteScene: (sceneId) => {
        const { project, currentSceneId } = get();
        if (!project) return;

        const result = sceneStore.deleteScene(project, currentSceneId, sceneId);
        if (result.project === project) return; // Validation failed, no change

        set({
          project: result.project,
          currentSceneId: result.currentSceneId,
          isDirty: true,
        });
        useHistoryStore.getState().push(result.project);
      },

      duplicateScene: (sceneId) => {
        const { project } = get();
        if (!project) return;

        const updatedProject = sceneStore.duplicateScene(project, sceneId);
        if (updatedProject === project) return; // Scene not found

        set({
          project: updatedProject,
          isDirty: true,
        });
        useHistoryStore.getState().push(updatedProject);
      },

      reorderScenes: (fromIndex, toIndex) => {
        const { project } = get();
        if (!project) return;

        const scenes = [...project.scenes];
        const [moved] = scenes.splice(fromIndex, 1);
        scenes.splice(toIndex, 0, moved);

        const updatedProject = {
          ...project,
          scenes,
          metadata: {
            ...project.metadata,
            modified: new Date().toISOString(),
          },
        };
        set({
          project: updatedProject,
          isDirty: true,
        });
        useHistoryStore.getState().push(updatedProject);
      },

      setCurrentScene: (sceneId) => {
        set({ currentSceneId: sceneId });
      },

      addTrack: (sceneId, trackData) => {
        const { project } = get();
        if (!project) return;

        const result = trackStore.addTrack(project, sceneId, trackData);
        set({
          project: result.project,
          isDirty: true,
          selectedTrackId: result.selectedTrackId,
        });
        useHistoryStore.getState().push(result.project);
      },

      updateTrack: (sceneId, trackId, updates) => {
        const { project } = get();
        if (!project) return;

        const updatedProject = trackStore.updateTrack(project, sceneId, trackId, updates);
        set({
          project: updatedProject,
          isDirty: true,
        });
        useHistoryStore.getState().push(updatedProject);
      },

      deleteTrack: (sceneId, trackId) => {
        const { project, selectedTrackId } = get();
        if (!project) return;

        const result = trackStore.deleteTrack(project, selectedTrackId, sceneId, trackId);
        set({
          project: result.project,
          selectedTrackId: result.selectedTrackId,
          isDirty: true,
        });
        useHistoryStore.getState().push(result.project);
      },

      setSelectedTrack: (trackId) => {
        set({ selectedTrackId: trackId });
      },

      addClip: (sceneId, trackId, clipData) => {
        const { project } = get();
        if (!project) return;

        const updatedProject = clipStore.addClip(project, sceneId, trackId, clipData);
        set({
          project: updatedProject,
          isDirty: true,
        });
        useHistoryStore.getState().push(updatedProject);
      },

      updateClip: (sceneId, trackId, clipId, updates) => {
        const { project } = get();
        if (!project) return;

        const updatedProject = clipStore.updateClip(project, sceneId, trackId, clipId, updates);
        if (updatedProject === project) return; // Validation failed, no change

        set({
          project: updatedProject,
          isDirty: true,
        });
        useHistoryStore.getState().push(updatedProject);
      },

      deleteClip: (sceneId, trackId, clipId) => {
        const { project } = get();
        if (!project) return;

        const updatedProject = clipStore.deleteClip(project, sceneId, trackId, clipId);
        set({
          project: updatedProject,
          isDirty: true,
        });
        useHistoryStore.getState().push(updatedProject);
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
          useHistoryStore.getState().push(project);
        } catch (error) {
          errorHandler.handle(error, 'Project Import', ErrorSeverity.ERROR);
          throw new Error('Invalid project JSON');
        }
      },

      markDirty: () => set({ isDirty: true }),
      markClean: () => set({ isDirty: false }),
      
      // History operations
      undo: () => {
        const historyStore = useHistoryStore.getState();
        const previous = historyStore.undo();
        if (previous) {
          set({ project: previous, isDirty: true });
        }
      },
      redo: () => {
        const historyStore = useHistoryStore.getState();
        const next = historyStore.redo();
        if (next) {
          set({ project: next, isDirty: true });
        }
      },
      canUndo: () => useHistoryStore.getState().canUndo(),
      canRedo: () => useHistoryStore.getState().canRedo(),
    }),
    {
      name: 'generative-score-lab-project',
      partialize: (state) => ({ project: state.project }),
    }
  )
);
