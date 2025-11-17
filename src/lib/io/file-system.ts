/**
 * File System Access API wrapper
 */

import type { Project } from '@/types';
import { serializeProject } from './serializer';

/**
 * Export project to user's file system
 */
export async function exportProject(project: Project): Promise<void> {
  try {
    // Check if File System Access API is supported
    if (!('showSaveFilePicker' in window)) {
      // Fallback to download
      downloadProject(project);
      return;
    }

    // Show save file picker
    const handle = await (window as any).showSaveFilePicker({
      suggestedName: `${project.name.replace(/[^a-z0-9]/gi, '-')}.json`,
      types: [
        {
          description: 'Generative Score Lab Project',
          accept: {
            'application/json': ['.json'],
          },
        },
      ],
    });

    // Write file
    const writable = await handle.createWritable();
    const json = serializeProject(project);
    await writable.write(json);
    await writable.close();

    console.log('Project exported successfully');
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      // User cancelled
      return;
    }
    console.error('Failed to export project:', error);
    throw error;
  }
}

/**
 * Fallback: Download project as JSON file
 */
function downloadProject(project: Project): void {
  const json = serializeProject(project);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.replace(/[^a-z0-9]/gi, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import project from file
 */
export async function importProject(): Promise<string> {
  try {
    // Check if File System Access API is supported
    if (!('showOpenFilePicker' in window)) {
      // Fallback to file input
      return importProjectFallback();
    }

    // Show open file picker
    const [handle] = await (window as any).showOpenFilePicker({
      types: [
        {
          description: 'Generative Score Lab Project',
          accept: {
            'application/json': ['.json'],
          },
        },
      ],
      multiple: false,
    });

    // Read file
    const file = await handle.getFile();
    const text = await file.text();
    return text;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new Error('Import cancelled');
    }
    console.error('Failed to import project:', error);
    throw error;
  }
}

/**
 * Fallback: Use file input for import
 */
function importProjectFallback(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      try {
        const text = await file.text();
        resolve(text);
      } catch (error) {
        reject(error);
      }
    };

    input.oncancel = () => {
      reject(new Error('Import cancelled'));
    };

    input.click();
  });
}
