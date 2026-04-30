/**
 * AI service for handling chat messages and applying actions
 */

import { createAIClient, buildMusicSystemPrompt } from './index';
import type { AIConfig, ChatMessage, AIResponse, MusicAction, ProjectContext, Scene, Track, Clip, Project } from '@/types';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';
import { MIN_BPM, MAX_BPM } from '@/lib/utils/constants';

/**
 * Project store interface for AI actions
 */
interface ProjectStoreActions {
  updateScene: (sceneId: string, updates: Partial<Scene>) => void;
  updateTrack: (sceneId: string, trackId: string, updates: Partial<Track>) => void;
  updateClip: (sceneId: string, trackId: string, clipId: string, updates: Partial<Clip>) => void;
  addTrack: (sceneId: string, track: Omit<Track, 'id'> | Record<string, unknown>) => void;
  project?: Project | null;
}

/**
 * Send a message to the AI and get response
 */
export async function sendAIMessage(
  config: AIConfig,
  messages: ChatMessage[],
  projectContext?: ProjectContext,
  signal?: AbortSignal
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
      signal,
    });

    return response;
  } catch (error) {
    // Check if error is from abort
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        message: '',
        error: 'Request cancelled',
      };
    }

    errorHandler.handle(error, 'AI Chat', ErrorSeverity.ERROR);
    return {
      message: 'Sorry, I encountered an error processing your request.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Optimize actions by removing duplicates and merging similar actions
 */
function optimizeActions(actions: MusicAction[]): MusicAction[] {
  if (actions.length === 0) return actions;
  
  // Step 1: Remove exact duplicates (same type + target)
  const seen = new Set<string>();
  const deduplicatedActions: MusicAction[] = [];
  
  for (const action of actions) {
    const key = `${action.type}:${action.target}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicatedActions.push(action);
    }
  }
  
  // Step 2: Merge multiple actions of the same type targeting the same entity
  const mergedActions: MusicAction[] = [];
  const actionGroups = new Map<string, MusicAction[]>();
  
  // Group actions by type and target
  for (const action of deduplicatedActions) {
    const groupKey = `${action.type}:${action.target}`;
    if (!actionGroups.has(groupKey)) {
      actionGroups.set(groupKey, []);
    }
    actionGroups.get(groupKey)!.push(action);
  }
  
  // Merge actions within each group
  for (const [groupKey, groupActions] of actionGroups.entries()) {
    if (groupActions.length === 1) {
      // Single action, just add it
      mergedActions.push(groupActions[0]);
    } else {
      // Multiple actions of same type+target, merge their parameters
      const [actionType, target] = groupKey.split(':');
      const mergedParams: Record<string, unknown> = {};
      
      // Merge all parameters from the group
      for (const action of groupActions) {
        Object.assign(mergedParams, action.params);
      }
      
      // Create the merged action
      const mergedAction: MusicAction = {
        type: actionType as MusicAction['type'],
        target,
        params: mergedParams
      };
      
      mergedActions.push(mergedAction);
    }
  }
  
  return mergedActions;
}

/**
 * Apply music actions from AI to project store
 * Resolves "currentScene" placeholder to actual scene ID if available
 */
export function applyMusicActions(
  actions: MusicAction[],
  projectStore: ProjectStoreActions & { currentSceneId?: string | null }
): { success: number; failed: number; errors: string[] } {
  // Optimize actions to remove duplicates and merge similar actions
  const optimizedActions = optimizeActions(actions);
  
  if (optimizedActions.length < actions.length && import.meta.env.MODE === 'development') {
    console.info(`[AI Action] Optimized ${actions.length} actions down to ${optimizedActions.length} actions`);
  }
  
  // Helper to resolve scene ID (handles "currentScene" placeholder)
  const resolveSceneId = (target: string): string | null => {
    if (target === 'currentScene' && projectStore.currentSceneId) {
      return projectStore.currentSceneId;
    }
    return target || null;
  };

  // Helper to resolve track ID by role name (fallback for AI mistakes)
  const resolveTrackIdByRole = (sceneId: string, roleName: string): string | null => {
    if (!projectStore.project) return null;
    const scene = projectStore.project.scenes.find(s => s.id === sceneId);
    if (!scene) return null;
    
    // Normalize role name (handle variations like "snare", "kick", "hihat" for drums)
    const normalizedRole = roleName.toLowerCase();
    const roleMap: Record<string, string[]> = {
      'drums': ['drums', 'drum', 'snare', 'kick', 'hihat', 'hi-hat', 'hi hat', 'percussion'],
      'bass': ['bass', 'bassline', 'low'],
      'pad': ['pad', 'pads', 'atmosphere', 'ambient'],
      'lead': ['lead', 'melody', 'melodic'],
      'fx': ['fx', 'effects', 'effect'],
      'other': ['other', 'misc']
    };
    
    // Find matching role
    let targetRole: string | null = null;
    for (const [role, aliases] of Object.entries(roleMap)) {
      if (aliases.includes(normalizedRole)) {
        targetRole = role;
        break;
      }
    }
    
    if (!targetRole) {
      // Try direct match
      targetRole = normalizedRole;
    }
    
    // Find first track with matching role
    const track = scene.tracks.find(t => t.role === targetRole);
    return track?.id || null;
  };

  // Helper to resolve clip ID by track role (fallback)
  const resolveClipIdByRole = (sceneId: string, roleName: string): { trackId: string; clipId: string } | null => {
    const trackId = resolveTrackIdByRole(sceneId, roleName);
    if (!trackId || !projectStore.project) return null;
    
    const scene = projectStore.project.scenes.find(s => s.id === sceneId);
    if (!scene) return null;
    const track = scene.tracks.find(t => t.id === trackId);
    const clips = track?.clips ?? [];
    if (!track || clips.length === 0) return null;
    
    // Return first clip ID
    return { trackId, clipId: clips[0].id };
  };

  // Validation helpers
  const validateAndClampBPM = (bpm: number): number => {
    return Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(bpm)));
  };

  const validateAndClampVolume = (volume: number): number => {
    return Math.max(0, Math.min(1, volume));
  };

  const validateAndClampPan = (pan: number): number => {
    return Math.max(-1, Math.min(1, pan));
  };

  const validateAndClampDensity = (density: number): number => {
    return Math.max(0, Math.min(1, density));
  };

  const validateAndClampProbability = (probability: number): number => {
    return Math.max(0, Math.min(1, probability));
  };

  const validateIntensityRange = (range: [number, number]): [number, number] => {
    const min = Math.max(0, Math.min(1, range[0]));
    const max = Math.max(0, Math.min(1, range[1]));
    // Ensure min < max, with minimum 0.1 difference
    if (min >= max) {
      return [min, Math.min(1, min + 0.1)];
    }
    return [min, max];
  };

  const validateKey = (key: string): string | null => {
    const validKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return validKeys.includes(key) ? key : null;
  };

  const validateScale = (scale: string): string | null => {
    const validScales = ['major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian'];
    return validScales.includes(scale.toLowerCase()) ? scale.toLowerCase() : null;
  };

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  // Process optimized actions instead of original actions
  for (const action of optimizedActions) {
    try {
      // Log action in development
      if (import.meta.env.MODE === 'development') {
        console.info(`[AI Action] Applying ${action.type} to ${action.target}`, action.params);
      }

      switch (action.type) {
        case 'updateScene': {
          const sceneId = resolveSceneId(action.target);
          if (!sceneId) {
            throw new Error(`Invalid scene ID: "${action.target}". Must use exact scene ID from context or "currentScene".`);
          }
          
          // Validate and clamp parameters
          const validatedParams: Partial<Scene> = {};
          if (action.params.bpm !== undefined) {
            validatedParams.bpm = validateAndClampBPM(action.params.bpm);
            if (import.meta.env.MODE === 'development' && action.params.bpm !== validatedParams.bpm) {
              console.info(`[AI Action] Clamped BPM from ${action.params.bpm} to ${validatedParams.bpm}`);
            }
          }
          if (action.params.intensityRange) {
            validatedParams.intensityRange = validateIntensityRange(action.params.intensityRange as [number, number]);
          }
          if (action.params.key !== undefined) {
            const validKey = validateKey(action.params.key);
            if (validKey) {
              validatedParams.key = validKey;
            } else {
              throw new Error(`Invalid key: "${action.params.key}". Must be one of: C, C#, D, D#, E, F, F#, G, G#, A, A#, B`);
            }
          }
          if (action.params.scale !== undefined) {
            const validScale = validateScale(action.params.scale);
            if (validScale) {
              validatedParams.scale = validScale;
            } else {
              throw new Error(`Invalid scale: "${action.params.scale}". Must be one of: major, minor, dorian, phrygian, lydian, mixolydian, locrian`);
            }
          }
          
          // Merge with original params for any other fields
          const finalParams = { ...action.params, ...validatedParams };
          projectStore.updateScene(sceneId, finalParams);
          success++;
          break;
        }

        case 'updateTrack': {
          const [sceneIdPart, trackId] = action.target.split('/');
          const sceneId = resolveSceneId(sceneIdPart);
          if (!sceneId || !trackId) {
            throw new Error(`Invalid track target: "${action.target}". Must use format "sceneId/trackId" with exact IDs from context.`);
          }
          
          // Try to resolve role name to actual track ID (fallback)
          let resolvedTrackId = trackId;
          const roleNames = ['drums', 'bass', 'pad', 'lead', 'fx', 'other', 'snare', 'kick', 'hihat'];
          if (roleNames.includes(trackId.toLowerCase())) {
            const resolved = resolveTrackIdByRole(sceneId, trackId);
            if (resolved) {
              resolvedTrackId = resolved;
              if (import.meta.env.MODE === 'development') {
                console.info(`[AI Action] Resolved role "${trackId}" to track ID "${resolvedTrackId}"`);
              }
            } else {
              throw new Error(`Could not find track with role "${trackId}" in scene "${sceneId}". Available roles: ${projectStore.project?.scenes.find(s => s.id === sceneId)?.tracks.map(t => t.role).join(', ') || 'none'}`);
            }
          }
          
          // Validate and clamp parameters
          const validatedParams: Partial<Track> = {};
          if (action.params.volume !== undefined) {
            validatedParams.volume = validateAndClampVolume(action.params.volume);
            if (import.meta.env.MODE === 'development' && action.params.volume !== validatedParams.volume) {
              console.info(`[AI Action] Clamped volume from ${action.params.volume} to ${validatedParams.volume}`);
            }
          }
          if (action.params.pan !== undefined) {
            validatedParams.pan = validateAndClampPan(action.params.pan);
            if (import.meta.env.MODE === 'development' && action.params.pan !== validatedParams.pan) {
              console.info(`[AI Action] Clamped pan from ${action.params.pan} to ${validatedParams.pan}`);
            }
          }
          if (action.params.muted !== undefined) {
            validatedParams.muted = Boolean(action.params.muted);
          }
          if (action.params.solo !== undefined) {
            validatedParams.solo = Boolean(action.params.solo);
          }
          
          // Merge with original params
          const finalParams = { ...action.params, ...validatedParams };
          projectStore.updateTrack(sceneId, resolvedTrackId, finalParams);
          success++;
          break;
        }

        case 'updateClip': {
          const parts = action.target.split('/');
          const sceneIdPart = parts[0];
          const trackIdPart = parts[1];
          const clipIdPart = parts[2];
          
          const sceneId = resolveSceneId(sceneIdPart);
          if (!sceneId) {
            throw new Error(`Invalid scene ID: "${sceneIdPart}". Must use exact scene ID from context or "currentScene".`);
          }
          
          // Try to resolve role name to actual track/clip IDs (fallback)
          let resolvedTrackId = trackIdPart;
          let resolvedClipId = clipIdPart;
          
          const roleNames = ['drums', 'bass', 'pad', 'lead', 'fx', 'other', 'snare', 'kick', 'hihat'];
          if (roleNames.includes(trackIdPart?.toLowerCase() || '')) {
            const resolved = resolveClipIdByRole(sceneId, trackIdPart);
            if (resolved) {
              resolvedTrackId = resolved.trackId;
              resolvedClipId = resolved.clipId;
              if (import.meta.env.MODE === 'development') {
                console.info(`[AI Action] Resolved role "${trackIdPart}" to track ID "${resolvedTrackId}", clip ID "${resolvedClipId}"`);
              }
            } else {
              throw new Error(`Could not find clip for track with role "${trackIdPart}" in scene "${sceneId}". Available roles: ${projectStore.project?.scenes.find(s => s.id === sceneId)?.tracks.map(t => t.role).join(', ') || 'none'}`);
            }
          }
          
          if (!resolvedTrackId || !resolvedClipId) {
            throw new Error(`Invalid clip target: "${action.target}". Must use format "sceneId/trackId/clipId" with exact IDs from context.`);
          }
          
          // Validate and clamp parameters
          const validatedParams: Partial<Clip> = {};
          if (action.params.muted !== undefined) {
            validatedParams.muted = Boolean(action.params.muted);
          }
          if (action.params.density !== undefined) {
            validatedParams.density = validateAndClampDensity(action.params.density);
            if (import.meta.env.MODE === 'development' && action.params.density !== validatedParams.density) {
              console.info(`[AI Action] Clamped density from ${action.params.density} to ${validatedParams.density}`);
            }
          }
          if (action.params.probability !== undefined) {
            validatedParams.probability = validateAndClampProbability(action.params.probability);
            if (import.meta.env.MODE === 'development' && action.params.probability !== validatedParams.probability) {
              console.info(`[AI Action] Clamped probability from ${action.params.probability} to ${validatedParams.probability}`);
            }
          }
          if (action.params.generator !== undefined) {
            validatedParams.generator = action.params.generator;
          }
          
          // Merge with original params
          const finalParams = { ...action.params, ...validatedParams };
          projectStore.updateClip(sceneId, resolvedTrackId, resolvedClipId, finalParams);
          success++;
          break;
        }

        case 'addTrack': {
          const sceneId = resolveSceneId(action.target);
          if (!sceneId) {
            throw new Error(`Invalid scene ID: "${action.target}". Must use exact scene ID from context or "currentScene".`);
          }
          projectStore.addTrack(sceneId, action.params);
          success++;
          break;
        }

        case 'changeKey': {
          const sceneId = resolveSceneId(action.target);
          if (!sceneId) {
            throw new Error(`Invalid scene ID: "${action.target}". Must use exact scene ID from context or "currentScene".`);
          }
          if (!action.params.key || !action.params.scale) {
            throw new Error('changeKey action requires both key and scale parameters');
          }
          
          // Validate key and scale
          const validKey = validateKey(action.params.key);
          const validScale = validateScale(action.params.scale);
          
          if (!validKey) {
            throw new Error(`Invalid key: "${action.params.key}". Must be one of: C, C#, D, D#, E, F, F#, G, G#, A, A#, B`);
          }
          if (!validScale) {
            throw new Error(`Invalid scale: "${action.params.scale}". Must be one of: major, minor, dorian, phrygian, lydian, mixolydian, locrian`);
          }
          
          projectStore.updateScene(sceneId, {
            key: validKey,
            scale: validScale,
          });
          success++;
          break;
        }

        default: {
          // TypeScript exhaustiveness check
          const _exhaustive: never = action as never;
          throw new Error(`Unknown action type: ${(_exhaustive as MusicAction).type}`);
        }
      }
    } catch (error) {
      failed++;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      // Enhanced error message with suggestions
      let enhancedError = errorMsg;
      
      // Get scene context for better error messages
      let currentScene: Scene | undefined;
      let sceneTracks: Array<{role: string, id: string}> = [];
      
      try {
        // Try to extract scene ID from the action target
        const sceneIdPart = action.target.split('/')[0] || action.target;
        const resolvedSceneId = resolveSceneId(sceneIdPart);
        
        if (resolvedSceneId && projectStore.project) {
          currentScene = projectStore.project.scenes.find(s => s.id === resolvedSceneId);
          if (currentScene) {
            sceneTracks = currentScene.tracks.map(t => ({ role: t.role, id: t.id }));
          }
        }
      } catch {
        // Ignore errors in error enhancement
      }
      
      // Add specific suggestions based on error type
      if (errorMsg.includes('Invalid track ID') || errorMsg.includes('track with role')) {
        if (sceneTracks.length > 0) {
          enhancedError += `. Available tracks: ${sceneTracks.map(t => `${t.role} (${t.id})`).join(', ')}`;
        } else {
          enhancedError += `. No tracks available in this scene.`;
        }
      }
      
      if (errorMsg.includes('Invalid scene ID')) {
        const availableScenes = projectStore.project?.scenes.map(s => `${s.name} (${s.id})`).join(', ') || 'none';
        enhancedError += `. Available scenes: ${availableScenes}`;
        if (projectStore.currentSceneId) {
          enhancedError += `. Current scene: ${projectStore.currentSceneId}`;
        }
      }
      
      if (errorMsg.includes('Invalid key')) {
        enhancedError += `. Valid keys: C, C#, D, D#, E, F, F#, G, G#, A, A#, B`;
      }
      
      if (errorMsg.includes('Invalid scale')) {
        enhancedError += `. Valid scales: major, minor, dorian, phrygian, lydian, mixolydian, locrian`;
      }
      
      if (errorMsg.includes('Invalid clip target') || errorMsg.includes('Could not find clip')) {
        if (sceneTracks.length > 0) {
          enhancedError += `. Try using track roles instead: ${sceneTracks.map(t => t.role).join(', ')}`;
        }
      }
      
      const actionDescription = `${action.type}(${action.target})`;
      errors.push(`${actionDescription}: ${enhancedError}`);
      errorHandler.handle(error, `AI Action: ${actionDescription}`, ErrorSeverity.WARNING);
    }
  }

  return { success, failed, errors };
}
