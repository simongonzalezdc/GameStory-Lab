/**
 * Tests for history store
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useHistoryStore } from '@/stores/history-store';
import type { Project } from '@/types';
import { DEFAULT_BPM } from '@/lib/utils/constants';

function createTestProject(name: string, bpm: number = DEFAULT_BPM): Project {
  return {
    schemaVersion: '1.0.0',
    projectId: crypto.randomUUID(),
    name,
    bpm,
    timeSignature: '4/4',
    defaultKey: 'C',
    defaultScale: 'major',
    scenes: [],
    metadata: {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    },
  };
}

describe('History Store', () => {
  beforeEach(() => {
    useHistoryStore.getState().clear();
  });

  describe('push', () => {
    it('should add project to history', () => {
      const project = createTestProject('Test');
      useHistoryStore.getState().push(project);

      const state = useHistoryStore.getState();
      expect(state.present).not.toBeNull();
      expect(state.present?.name).toBe('Test');
      expect(state.past.length).toBe(0); // First push has no past
      expect(state.future.length).toBe(0);
    });

    it('should limit history size', () => {
      const limit = useHistoryStore.getState().maxHistorySize;

      // Push more projects than the limit
      for (let i = 0; i < limit + 10; i++) {
        useHistoryStore.getState().push(createTestProject(`Project ${i}`));
      }

      const state = useHistoryStore.getState();
      // Past should be trimmed to maxHistorySize
      expect(state.past.length).toBeLessThanOrEqual(limit);
    });
  });

  describe('undo', () => {
    it('should return previous state', () => {
      const project1 = createTestProject('Project 1');
      const project2 = createTestProject('Project 2');

      useHistoryStore.getState().push(project1);
      useHistoryStore.getState().push(project2);

      const previous = useHistoryStore.getState().undo();
      expect(previous?.name).toBe('Project 1');

      const state = useHistoryStore.getState();
      expect(state.present?.name).toBe('Project 1');
      expect(state.past.length).toBe(0);
      expect(state.future.length).toBe(1);
      expect(state.future[0].name).toBe('Project 2');
    });

    it('should return null if at beginning', () => {
      const project = createTestProject('Test');
      useHistoryStore.getState().push(project);

      // Can't undo when there's no past
      expect(useHistoryStore.getState().undo()).toBeNull();
    });
  });

  describe('redo', () => {
    it('should return next state', () => {
      const project1 = createTestProject('Project 1');
      const project2 = createTestProject('Project 2');

      useHistoryStore.getState().push(project1);
      useHistoryStore.getState().push(project2);
      useHistoryStore.getState().undo();

      const next = useHistoryStore.getState().redo();
      expect(next?.name).toBe('Project 2');

      const state = useHistoryStore.getState();
      expect(state.present?.name).toBe('Project 2');
      expect(state.past.length).toBe(1);
      expect(state.past[0].name).toBe('Project 1');
      expect(state.future.length).toBe(0);
    });

    it('should return null if at end', () => {
      const project = createTestProject('Test');
      useHistoryStore.getState().push(project);

      // Can't redo when there's no future
      expect(useHistoryStore.getState().redo()).toBeNull();
    });
  });

  describe('canUndo/canRedo', () => {
    it('should correctly report undo/redo availability', () => {
      const project1 = createTestProject('Project 1');
      const project2 = createTestProject('Project 2');

      // Initial state: no undo/redo available
      useHistoryStore.getState().push(project1);
      expect(useHistoryStore.getState().canUndo()).toBe(false);
      expect(useHistoryStore.getState().canRedo()).toBe(false);

      // After second push: can undo, but not redo
      useHistoryStore.getState().push(project2);
      expect(useHistoryStore.getState().canUndo()).toBe(true);
      expect(useHistoryStore.getState().canRedo()).toBe(false);

      // After undo: can't undo (no past), but can redo
      useHistoryStore.getState().undo();
      expect(useHistoryStore.getState().canUndo()).toBe(false);
      expect(useHistoryStore.getState().canRedo()).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear all history', () => {
      const project1 = createTestProject('Project 1');
      const project2 = createTestProject('Project 2');

      useHistoryStore.getState().push(project1);
      useHistoryStore.getState().push(project2);
      useHistoryStore.getState().clear();

      const state = useHistoryStore.getState();
      expect(state.past).toEqual([]);
      expect(state.present).toBeNull();
      expect(state.future).toEqual([]);
    });
  });

  describe('duplicate detection', () => {
    it('should not push if project is identical', () => {
      const project = createTestProject('Test');

      useHistoryStore.getState().push(project);
      const state1 = useHistoryStore.getState();

      // Push the same project again
      useHistoryStore.getState().push(project);
      const state2 = useHistoryStore.getState();

      // State should not have changed
      expect(state2.past.length).toBe(state1.past.length);
      expect(state2.present).toEqual(state1.present);
    });
  });
});
