/**
 * Project JSON serialization
 */

import { z } from 'zod';
import type { Project } from '@/types';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';

/**
 * Serialize project to JSON string
 */
export function serializeProject(project: Project): string {
  return JSON.stringify(project, null, 2);
}

// Zod schemas for project validation
const ProjectMetadataSchema = z.object({
  created: z.string(),
  modified: z.string(),
  author: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const GeneratorConfigSchema = z.object({
  type: z.enum(['euclidean', 'arp', 'patternDSL', 'markov', 'randomWalk', 'magenta', 'audioModelStem'] as const),
  params: z.record(z.string(), z.unknown()),
});

const ClipSchema = z.object({
  id: z.string(),
  lengthBars: z.number(),
  generator: GeneratorConfigSchema,
  density: z.number().min(0).max(1).optional(),
  probability: z.number().min(0).max(1).optional(),
  muted: z.boolean(),
  offset: z.number().optional(),
});

const TrackSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  role: z.enum(['drums', 'bass', 'pad', 'lead', 'fx', 'other'] as const),
  instrumentRef: z.string(),
  clips: z.array(ClipSchema),
  volume: z.number().min(0).max(1),
  pan: z.number().min(-1).max(1),
  muted: z.boolean(),
  solo: z.boolean(),
  effects: z.record(z.string(), z.unknown()).optional(),
});

const MappingSchema = z.object({
  source: z.string(),
  target: z.string(),
  inputRange: z.tuple([z.number(), z.number()]),
  outputRange: z.tuple([z.number(), z.number()]),
  curve: z.enum(['linear', 'easeIn', 'easeOut', 'easeInOut', 'exponential'] as const),
});

const TransitionSchema = z.object({
  fromSceneId: z.string(),
  toSceneId: z.string(),
  conditions: z.string(),
  crossfadeBars: z.number(),
});

const SceneSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional(),
  bpm: z.number().positive().optional(),
  key: z.string(),
  scale: z.string(),
  intensityRange: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]),
  tracks: z.array(TrackSchema),
  mappings: z.array(MappingSchema),
  transitions: z.array(TransitionSchema).optional(),
});

const ProjectSchema = z.object({
  schemaVersion: z.string(),
  projectId: z.string(),
  name: z.string(),
  bpm: z.number().positive(),
  timeSignature: z.string(),
  defaultKey: z.string(),
  defaultScale: z.string(),
  scenes: z.array(SceneSchema),
  globalMappings: z.array(MappingSchema).optional(),
  metadata: ProjectMetadataSchema,
});

/**
 * Validate project structure using Zod schema
 */
export function validateProject(data: unknown): data is Project {
  try {
    ProjectSchema.parse(data);
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = `Invalid project structure: ${error.issues.map((issue) => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ')}`;
      errorHandler.handle(
        new Error(errorMessage),
        'Project Validation',
        ErrorSeverity.WARNING
      );
    }
    return false;
  }
}
