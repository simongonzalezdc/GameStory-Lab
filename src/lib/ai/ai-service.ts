/**
 * AI service for handling chat messages and applying actions
 */

import { createAIClient, buildMusicSystemPrompt } from './index';
import type { AIConfig, ChatMessage, AIResponse, MusicAction, ProjectContext } from '@/types';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';

/**
 * Send a message to the AI and get response
 */
export async function sendAIMessage(
  config: AIConfig,
  messages: ChatMessage[],
  projectContext?: ProjectContext
): Promise<AIResponse> {
  try {
    const client = createAIClient(config);

    // Build system prompt with project context
    const systemPrompt = buildMusicSystemPrompt(projectContext);

    // Add system message if not already present
    const messagesWithSystem: ChatMessage[] = messages[0]?.role === 'system'
      ? messages
      : [{ role: 'system', content: systemPrompt }, ...messages];

    // Send request
    const response = await client.sendMessage({
      messages: messagesWithSystem,
      projectContext,
    });

    return response;
  } catch (error) {
    errorHandler.handle(error, 'AI Chat', ErrorSeverity.ERROR);
    return {
      message: 'Sorry, I encountered an error processing your request.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Apply music actions from AI to project store
 */
export function applyMusicActions(
  actions: MusicAction[],
  projectStore: any
): { success: number; failed: number; errors: string[] } {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const action of actions) {
    try {
      switch (action.type) {
        case 'updateScene': {
          const sceneId = action.target;
          projectStore.updateScene(sceneId, action.params);
          success++;
          break;
        }

        case 'updateTrack': {
          const [sceneId, trackId] = action.target.split('/');
          if (!sceneId || !trackId) {
            throw new Error(`Invalid track target: ${action.target}`);
          }
          projectStore.updateTrack(sceneId, trackId, action.params);
          success++;
          break;
        }

        case 'updateClip': {
          const [sceneId, trackId, clipId] = action.target.split('/');
          if (!sceneId || !trackId || !clipId) {
            throw new Error(`Invalid clip target: ${action.target}`);
          }
          projectStore.updateClip(sceneId, trackId, clipId, action.params);
          success++;
          break;
        }

        case 'addTrack': {
          const sceneId = action.target;
          projectStore.addTrack(sceneId, action.params);
          success++;
          break;
        }

        case 'changeKey': {
          const sceneId = action.target;
          projectStore.updateScene(sceneId, {
            key: action.params.key,
            scale: action.params.scale,
          });
          success++;
          break;
        }

        default:
          throw new Error(`Unknown action type: ${(action as any).type}`);
      }
    } catch (error) {
      failed++;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Action ${action.type} failed: ${errorMsg}`);
      errorHandler.handle(error, `AI Action: ${action.type}`, ErrorSeverity.WARNING);
    }
  }

  return { success, failed, errors };
}
