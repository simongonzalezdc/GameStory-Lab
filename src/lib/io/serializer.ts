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
export function validateProject(data: unknown): data is Project {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  if (!obj.schemaVersion || !obj.projectId) return false;
  if (!obj.name || typeof obj.bpm !== 'number') return false;
  if (!Array.isArray(obj.scenes)) return false;
  return true;
}
