/**
 * Auto-save hook
 * Automatically saves project to localStorage when dirty
 */

import { useEffect, useRef } from 'react';
import { useProjectStore } from '@/stores/project-store';
import { AUTO_SAVE_INTERVAL } from '@/lib/utils/constants';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';

/**
 * Hook to auto-save project when dirty
 * Saves to localStorage with timestamp every AUTO_SAVE_INTERVAL
 */
export function useAutoSave(): void {
  const { project, isDirty, markClean } = useProjectStore();
  const lastSaveRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!project || !isDirty) return;

    const intervalId = setInterval(() => {
      try {
        const now = Date.now();
        const timeSinceLastSave = now - lastSaveRef.current;

        // Only save if enough time has passed and project is dirty
        if (timeSinceLastSave >= AUTO_SAVE_INTERVAL && isDirty) {
          // Save to localStorage with timestamp
          const autoSaveData = {
            project,
            timestamp: new Date().toISOString(),
            version: 'auto-save',
          };

          localStorage.setItem('generative-score-lab-autosave', JSON.stringify(autoSaveData));
          lastSaveRef.current = now;
          markClean();

          // Also update the persisted store (Zustand will handle this)
          // The markClean() call above ensures we don't save again immediately
        }
      } catch (error) {
        errorHandler.handle(
          error,
          'Auto-Save',
          ErrorSeverity.WARNING
        );
      }
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(intervalId);
  }, [project, isDirty, markClean]);

  // Save immediately on unmount if dirty
  useEffect(() => {
    return () => {
      if (project && isDirty) {
        try {
          const autoSaveData = {
            project,
            timestamp: new Date().toISOString(),
            version: 'auto-save',
          };
          localStorage.setItem('generative-score-lab-autosave', JSON.stringify(autoSaveData));
        } catch (error) {
          errorHandler.handle(
            error,
            'Auto-Save (on unmount)',
            ErrorSeverity.WARNING
          );
        }
      }
    };
  }, [project, isDirty]);
}

/**
 * Get auto-saved project if available
 */
export function getAutoSavedProject(): { project: unknown; timestamp: string } | null {
  try {
    const saved = localStorage.getItem('generative-score-lab-autosave');
    if (!saved) return null;

    const data = JSON.parse(saved);
    return {
      project: data.project,
      timestamp: data.timestamp,
    };
  } catch {
    return null;
  }
}

/**
 * Clear auto-saved project
 */
export function clearAutoSave(): void {
  localStorage.removeItem('generative-score-lab-autosave');
}

