/**
 * History store for undo/redo functionality
 */

import { create } from 'zustand';
import type { Project } from '@/types';

interface HistoryState {
  past: Project[];
  present: Project | null;
  future: Project[];
  maxHistorySize: number;

  // Actions
  push: (project: Project) => void;
  undo: () => Project | null;
  redo: () => Project | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  present: null,
  future: [],
  maxHistorySize: 50,

  push: (project: Project) => {
    const { present, past, maxHistorySize } = get();
    
    // Don't push if project hasn't changed
    if (present && JSON.stringify(present) === JSON.stringify(project)) {
      return;
    }

    const newPast = present ? [...past, present] : past;
    
    // Limit history size
    const trimmedPast = newPast.slice(-maxHistorySize);

    set({
      past: trimmedPast,
      present: project,
      future: [], // Clear future when new action is performed
    });
  },

  undo: () => {
    const { past, present } = get();
    if (past.length === 0 || !present) return null;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);

    set({
      past: newPast,
      present: previous,
      future: [present, ...get().future],
    });

    return previous;
  },

  redo: () => {
    const { future, present } = get();
    if (future.length === 0 || !present) return null;

    const next = future[0];
    const newFuture = future.slice(1);

    set({
      past: [...get().past, present],
      present: next,
      future: newFuture,
    });

    return next;
  },

  canUndo: () => {
    return get().past.length > 0;
  },

  canRedo: () => {
    return get().future.length > 0;
  },

  clear: () => {
    set({
      past: [],
      present: null,
      future: [],
    });
  },
}));

