/**
 * Zod validation schemas for runtime type checking
 */

import { z } from 'zod';

// ============================================================================
// Request Schemas
// ============================================================================

export const CreateProjectSchema = z.object({
  name: z.string().min(3).max(255),
  genre: z.string().max(100).optional(),
});

export const UpdateProjectSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  genre: z.string().max(100).optional(),
});

export const GenerationRequestSchema = z.object({
  projectId: z.string().uuid(),
  taskType: z.enum(['mechanics', 'lore', 'title', 'refinement', 'consistency']),
  context: z.object({
    genre: z.string().optional(),
    existingContent: z
      .object({
        mechanics: z.record(z.unknown()).optional(),
        lore: z.record(z.unknown()).optional(),
      })
      .optional(),
    userPrompt: z.string().optional(),
  }),
  modelPreference: z.union([
    z.literal('auto'),
    z.literal('openrouter'),
    z.literal('ollama'),
    z.string(),
  ]).optional(),
});

export const ValidationRequestSchema = z.object({
  conceptId: z.string().uuid(),
  mechanics: z.record(z.unknown()),
  lore: z.record(z.unknown()),
});

export const ExportRequestSchema = z.object({
  conceptId: z.string().uuid(),
  template: z.enum(['gdd', 'pitch', 'technical']),
});

export const RefinementRequestSchema = z.object({
  conceptId: z.string().uuid(),
  focus: z.enum([
    'deepen-mechanics',
    'enrich-lore',
    'improve-consistency',
    'enhance-genre-fit',
  ]),
  currentContent: z.object({
    mechanics: z.record(z.unknown()),
    lore: z.record(z.unknown()),
  }),
});

// ============================================================================
// Response Schemas
// ============================================================================

export const ValidationIssueSchema = z.object({
  rule: z.string(),
  severity: z.enum(['error', 'warning', 'info']),
  confidence: z.number().min(0).max(1),
  message: z.string(),
  suggestion: z.string().optional(),
  location: z
    .object({
      mechanics: z.array(z.string()).optional(),
      lore: z.array(z.string()).optional(),
    })
    .optional(),
});

export const ValidationResponseSchema = z.object({
  validationId: z.string().uuid(),
  issues: z.array(ValidationIssueSchema),
  overallScore: z.number().min(0).max(1),
});

// ============================================================================
// Data Schemas
// ============================================================================

export const MechanicsDataSchema = z.object({
  coreLoop: z.string().optional(),
  playerActions: z.array(z.string()).optional(),
  progressionSystems: z
    .object({
      type: z.enum(['linear', 'branching', 'open']),
      mechanics: z.array(z.string()),
    })
    .optional(),
  winConditions: z.array(z.string()).optional(),
  failConditions: z.array(z.string()).optional(),
  resourceSystems: z
    .array(
      z.object({
        name: z.string(),
        mechanics: z.string(),
        scarcity: z.enum(['abundant', 'balanced', 'scarce']),
      })
    )
    .optional(),
}).passthrough();

export const LoreDataSchema = z.object({
  setting: z
    .object({
      era: z.string().optional(),
      location: z.string().optional(),
      worldType: z.string().optional(),
    })
    .optional(),
  protagonist: z
    .object({
      background: z.string().optional(),
      motivation: z.string().optional(),
      abilities: z.array(z.string()).optional(),
    })
    .optional(),
  conflict: z
    .object({
      primary: z.string().optional(),
      secondary: z.array(z.string()).optional(),
    })
    .optional(),
  worldRules: z
    .object({
      physics: z.string().optional(),
      magic: z.string().optional(),
      technology: z.string().optional(),
    })
    .optional(),
  themes: z.array(z.string()).optional(),
}).passthrough();

// ============================================================================
// Environment Schema
// ============================================================================

export const EnvironmentSchema = z.object({
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  OPENROUTER_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  GLM_API_KEY: z.string().optional(),
  MINIMAX_API_KEY: z.string().optional(),
  MINIMAX_GROUP_ID: z.string().optional(),
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  RATE_LIMIT_MAX: z.string().default('20'),
  RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
  AI_COST_LIMIT_PER_HOUR_USD: z.string().default('5.00'),
});

export type Environment = z.infer<typeof EnvironmentSchema>;
