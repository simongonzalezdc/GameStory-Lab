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
      
      expect(useHistoryStore.getState().history.length).toBe(1);
      expect(useHistoryStore.getState().currentIndex).toBe(0);
    });

    it('should limit history size', () => {
      const limit = useHistoryStore.getState().limit;
      for (let i = 0; i < limit + 10; i++) {
        useHistoryStore.getState().push(createTestProject(`Project ${i}`));
      }
      
      expect(useHistoryStore.getState().history.length).toBeLessThanOrEqual(limit);
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
      expect(useHistoryStore.getState().currentIndex).toBe(0);
    });

    it('should return undefined if at beginning', () => {
      const project = createTestProject('Test');
      useHistoryStore.getState().push(project);
      
      expect(useHistoryStore.getState().undo()).toBeUndefined();
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
      expect(useHistoryStore.getState().currentIndex).toBe(1);
    });

    it('should return undefined if at end', () => {
      const project = createTestProject('Test');
      useHistoryStore.getState().push(project);
      
      expect(useHistoryStore.getState().redo()).toBeUndefined();
    });
  });

  describe('canUndo/canRedo', () => {
    it('should correctly report undo/redo availability', () => {
      const project1 = createTestProject('Project 1');
      const project2 = createTestProject('Project 2');
      
      useHistoryStore.getState().push(project1);
      expect(useHistoryStore.getState().canUndo()).toBe(false);
      expect(useHistoryStore.getState().canRedo()).toBe(false);
      
      useHistoryStore.getState().push(project2);
      expect(useHistoryStore.getState().canUndo()).toBe(true);
      expect(useHistoryStore.getState().canRedo()).toBe(false);
      
      useHistoryStore.getState().undo();
      expect(useHistoryStore.getState().canUndo()).toBe(false);
      expect(useHistoryStore.getState().canRedo()).toBe(true);
    });
  });
});

