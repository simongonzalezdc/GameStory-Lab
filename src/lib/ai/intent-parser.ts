/**
 * Parse AI responses and extract structured actions
 */

import type { MusicAction } from '@/types';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';

/**
 * Parse actions from AI response
 */
export function parseActions(content: string): MusicAction[] {
  const match = content.match(/<actions>(.*?)<\/actions>/s);
  if (!match) return [];

  try {
    const actions = JSON.parse(match[1]);
    if (Array.isArray(actions)) {
      return actions as MusicAction[];
    }
    return [actions as MusicAction];
  } catch (error) {
    errorHandler.handle(error, 'AI Action Parsing', ErrorSeverity.WARNING);
    return [];
  }
}

/**
 * Extract clean message (without action tags)
 */
export function extractCleanMessage(content: string): string {
  return content.replace(/<actions>.*?<\/actions>/gs, '').trim();
}
