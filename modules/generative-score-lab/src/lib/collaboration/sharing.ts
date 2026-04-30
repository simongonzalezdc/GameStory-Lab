/**
 * Collaboration and project sharing functionality
 * 
 * This module provides basic project sharing via URL parameters.
 * For full real-time collaboration, a backend service would be needed.
 */

import type { Project } from '@/types';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';

/**
 * Generate a shareable URL for a project
 * Encodes project data in URL hash (for privacy, not sent to server)
 */
export function generateShareableUrl(project: Project): string {
  try {
    const encoded = btoa(JSON.stringify(project));
    const url = new URL(window.location.href);
    url.hash = `share=${encoded}`;
    return url.toString();
  } catch (error) {
    errorHandler.handle(error, 'Project Sharing', ErrorSeverity.ERROR);
    throw new Error('Failed to generate shareable URL');
  }
}

/**
 * Extract project from shareable URL
 */
export function extractProjectFromUrl(): Project | null {
  try {
    const hash = window.location.hash;
    const match = hash.match(/share=([^&]+)/);
    if (!match) return null;

    const decoded = atob(match[1]);
    return JSON.parse(decoded) as Project;
  } catch (error) {
    errorHandler.handle(error, 'Project Sharing', ErrorSeverity.ERROR);
    return null;
  }
}

/**
 * Copy shareable URL to clipboard
 */
export async function copyShareableUrl(project: Project): Promise<boolean> {
  try {
    const url = generateShareableUrl(project);
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    errorHandler.handle(error, 'Project Sharing', ErrorSeverity.ERROR);
    return false;
  }
}

/**
 * Check if current URL contains a shared project
 */
export function hasSharedProjectInUrl(): boolean {
  return window.location.hash.includes('share=');
}

