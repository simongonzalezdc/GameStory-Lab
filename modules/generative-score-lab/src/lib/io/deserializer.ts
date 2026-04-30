/**
 * Project JSON deserialization
 */

import type { Project } from '@/types';
import { validateProject } from './serializer';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';

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
    errorHandler.handle(error, 'Project Deserialization', ErrorSeverity.ERROR);
    throw new Error('Invalid project JSON');
  }
}
