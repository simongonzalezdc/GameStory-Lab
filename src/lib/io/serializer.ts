/**
 * Project JSON serialization
 */

import type { Project } from '@/types';

/**
 * Serialize project to JSON string
 */
export function serializeProject(project: Project): string {
  return JSON.stringify(project, null, 2);
}

/**
 * Validate project structure
 */
export function validateProject(data: any): data is Project {
  if (!data || typeof data !== 'object') return false;
  if (!data.schemaVersion || !data.projectId) return false;
  if (!data.name || !data.bpm) return false;
  if (!Array.isArray(data.scenes)) return false;
  return true;
}
