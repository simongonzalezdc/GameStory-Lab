/**
 * Project JSON deserialization
 */

import type { Project } from '@/types';
import { validateProject } from './serializer';

/**
 * Deserialize JSON string to project
 */
export function deserializeProject(json: string): Project {
  try {
    const data = JSON.parse(json);

    if (!validateProject(data)) {
      throw new Error('Invalid project structure');
    }

    return data as Project;
  } catch (error) {
    console.error('Failed to deserialize project:', error);
    throw new Error('Invalid project JSON');
  }
}
