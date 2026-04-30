/**
 * Tests for project store
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '@/stores/project-store';
import { useHistoryStore } from '@/stores/history-store';
import { DEFAULT_BPM, DEFAULT_KEY, DEFAULT_SCALE, DEFAULT_INTENSITY_RANGE } from '@/lib/utils/constants';

describe('Project Store', () => {
  beforeEach(() => {
    // Clear stores before each test
    useProjectStore.setState({
      project: null,
      currentSceneId: null,
      selectedTrackId: null,
      isDirty: false,
    });
    useHistoryStore.getState().clear();
  });

  describe('createNewProject', () => {
    it('should create a new project with default values', () => {
      useProjectStore.getState().createNewProject('Test Project');
      const project = useProjectStore.getState().project;
      
      expect(project).not.toBeNull();
      expect(project?.name).toBe('Test Project');
      expect(project?.bpm).toBe(DEFAULT_BPM);
      expect(project?.defaultKey).toBe(DEFAULT_KEY);
      expect(project?.defaultScale).toBe(DEFAULT_SCALE);
      expect(project?.scenes).toEqual([]);
      expect(project?.projectId).toBeDefined();
    });

    it('should push initial state to history', () => {
      useProjectStore.getState().createNewProject('Test Project');
      expect(useHistoryStore.getState().canUndo()).toBe(false); // Only one state
      expect(useHistoryStore.getState().canRedo()).toBe(false);
    });
  });

  describe('updateProject', () => {
    it('should update project properties', () => {
      useProjectStore.getState().createNewProject('Test');
      useProjectStore.getState().updateProject({ bpm: 140 });
      
      expect(useProjectStore.getState().project?.bpm).toBe(140);
      expect(useProjectStore.getState().isDirty).toBe(true);
    });

    it('should validate BPM range', () => {
      useProjectStore.getState().createNewProject('Test');
      const initialBpm = useProjectStore.getState().project?.bpm;
      
      useProjectStore.getState().updateProject({ bpm: 500 }); // Invalid
      expect(useProjectStore.getState().project?.bpm).toBe(initialBpm); // Should not change
      
      useProjectStore.getState().updateProject({ bpm: 150 }); // Valid
      expect(useProjectStore.getState().project?.bpm).toBe(150);
    });
  });

  describe('addScene', () => {
    it('should add a scene to the project', () => {
      useProjectStore.getState().createNewProject('Test');
      useProjectStore.getState().addScene({
        name: 'Scene 1',
        key: 'C',
        scale: 'major',
        intensityRange: DEFAULT_INTENSITY_RANGE,
        tracks: [],
        mappings: [],
      });

      const project = useProjectStore.getState().project;
      expect(project?.scenes.length).toBe(1);
      expect(project?.scenes[0].name).toBe('Scene 1');
      expect(useProjectStore.getState().currentSceneId).toBe(project?.scenes[0].id);
    });
  });

  describe('undo/redo', () => {
    it('should undo project changes', () => {
      useProjectStore.getState().createNewProject('Test');
      const initialBpm = useProjectStore.getState().project?.bpm;
      
      useProjectStore.getState().updateProject({ bpm: 150 });
      expect(useProjectStore.getState().project?.bpm).toBe(150);
      
      useProjectStore.getState().undo();
      expect(useProjectStore.getState().project?.bpm).toBe(initialBpm);
    });

    it('should redo project changes', () => {
      useProjectStore.getState().createNewProject('Test');
      
      useProjectStore.getState().updateProject({ bpm: 150 });
      useProjectStore.getState().undo();
      useProjectStore.getState().redo();
      
      expect(useProjectStore.getState().project?.bpm).toBe(150);
    });
  });
});

