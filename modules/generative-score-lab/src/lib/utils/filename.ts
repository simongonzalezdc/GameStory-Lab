/**
 * Filename sanitization utilities
 */

/**
 * Sanitize filename for safe download across all OSes
 * Removes/replaces invalid characters for Windows/Mac/Linux
 */
export function sanitizeFilename(filename: string): string {
  // Remove/replace invalid characters for Windows/Mac/Linux
  return filename
    // eslint-disable-next-line no-control-regex
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_') // Replace invalid chars
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, '') // Remove trailing dots
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 255); // Limit length
}

