/**
 * Core TypeScript types for GameForge Studio
 * Based on technical specification v1.0.0
 */

// ============================================================================
// Database Models
// ============================================================================

export interface User {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  userId?: string | null;
  name: string;
  genre?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Concept {
  id: string;
  projectId: string;
  version: number;
  title?: string | null;
  mechanics: MechanicsData;
  lore: LoreData;
  metadata: ConceptMetadata;
  createdAt: Date;
}

export interface AiGeneration {
  id: string;
  conceptId: string;
  taskType: TaskType;
  modelUsed: string;
  prompt: string;
  response: string;
  tokensUsed?: number | null;
  costUsd?: number | null;
  durationMs?: number | null;
  createdAt: Date;
}

export interface ValidationResult {
  id: string;
  conceptId: string;
  ruleName: string;
  severity: ValidationSeverity;
  confidence: number;
  message: string;
  suggestion?: string | null;
  dismissed: boolean;
  createdAt: Date;
}

// ============================================================================
// Concept Data Structures
// ============================================================================

export interface MechanicsData {
  coreLoop?: string;
  playerActions?: string[];
  progressionSystems?: {
    type: 'linear' | 'branching' | 'open';
    mechanics: string[];
  };
  winConditions?: string[];
  failConditions?: string[];
  resourceSystems?: Array<{
    name: string;
    mechanics: string;
    scarcity: 'abundant' | 'balanced' | 'scarce';
  }>;
  [key: string]: unknown;
}

export interface LoreData {
  setting?: {
    era?: string;
    location?: string;
    worldType?: string;
  };
  protagonist?: {
    background?: string;
    motivation?: string;
    abilities?: string[];
  };
  conflict?: {
    primary?: string;
    secondary?: string[];
  };
  worldRules?: {
    physics?: string;
    magic?: string;
    technology?: string;
  };
  themes?: string[];
  [key: string]: unknown;
}

export interface ConceptMetadata {
  aiModel?: string;
  promptTokens?: number;
  completionTokens?: number;
  generationTime?: number;
  userEdited?: boolean;
  startedWith?: 'mechanics' | 'lore';
  consistencyScore?: number;
}

// ============================================================================
// Enums and Literal Types
// ============================================================================

export type TaskType =
  | 'mechanics'
  | 'lore'
  | 'title'
  | 'refinement'
  | 'consistency'
  | 'assistant';

export type ValidationSeverity = 'error' | 'warning' | 'info';

export type ModelPreference = 'auto' | 'openrouter' | 'ollama' | string;

export type Genre =
  | 'rpg'
  | 'fps'
  | 'strategy'
  | 'puzzle'
  | 'survival'
  | 'action-adventure'
  | 'adventure'
  | 'battle-royale'
  | 'sports'
  | 'fighting'
  | 'platformer'
  | 'horror'
  | 'roguelike'
  | 'simulation'
  | 'racing'
  | 'blank';

export type ExportTemplate = 'gdd' | 'pitch' | 'technical';

export type RefinementFocus =
  | 'deepen-mechanics'
  | 'enrich-lore'
  | 'improve-consistency'
  | 'enhance-genre-fit';

// ============================================================================
// AI Provider Types
// ============================================================================

export interface AIProvider {
  name: string;
  type: 'openrouter' | 'google' | 'ollama' | 'glm';
  baseUrl?: string;
  apiKey?: string;
}

export interface AIModelConfig {
  provider: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

export interface GenerationRequest {
  projectId: string;
  taskType: TaskType;
  context: {
    genre?: string;
    existingContent?: {
      mechanics?: MechanicsData;
      lore?: LoreData;
    };
    userPrompt?: string;
  };
  modelPreference?: ModelPreference;
}

export interface GenerationResponse {
  conceptId: string;
  content: {
    mechanics?: MechanicsData;
    lore?: LoreData;
    title?: string;
  };
  metadata: {
    model: string;
    tokensUsed: number;
    durationMs: number;
    costUsd?: number;
  };
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationRequest {
  conceptId: string;
  mechanics: MechanicsData;
  lore: LoreData;
}

export interface ValidationIssue {
  rule: string;
  severity: ValidationSeverity;
  confidence: number;
  message: string;
  suggestion?: string;
  location?: {
    mechanics?: string[];
    lore?: string[];
  };
}

export interface ValidationResponse {
  validationId: string;
  issues: ValidationIssue[];
  overallScore: number;
}

export interface ValidationRule {
  name: string;
  category: ValidationCategory;
  weight: number;
  execute: (concept: Concept) => Promise<ValidationIssue | null>;
}

export type ValidationCategory =
  | 'mechanics-lore-alignment'
  | 'genre-conventions'
  | 'world-physics'
  | 'progression-coherence'
  | 'narrative-structure'
  | 'technical-feasibility';

// ============================================================================
// Export Types
// ============================================================================

export interface ExportRequest {
  conceptId: string;
  template: ExportTemplate;
}

export interface ExportResponse {
  markdown: string;
  filename: string;
}

// ============================================================================
// Project Types
// ============================================================================

export interface CreateProjectRequest {
  name: string;
  genre?: Genre;
}

export interface UpdateProjectRequest {
  name?: string;
  genre?: Genre;
}

export interface ProjectWithConcepts extends Project {
  concepts: Concept[];
}

// ============================================================================
// Refinement Types
// ============================================================================

export interface RefinementRequest {
  conceptId: string;
  focus: RefinementFocus;
  currentContent: {
    mechanics: MechanicsData;
    lore: LoreData;
  };
}

export interface RefinementResponse {
  newConceptId: string;
  changes: {
    mechanics?: Partial<MechanicsData>;
    lore?: Partial<LoreData>;
  };
  improvements: string[];
  newScore: number;
}

// ============================================================================
// Error Types
// ============================================================================

export interface APIError {
  code: string;
  message: string;
  details?: unknown;
}

export class AppError extends Error {
  readonly code: string;
  readonly _statusCode: number;
  readonly _details?: unknown;

  constructor(
    code: string,
    message: string,
    _statusCode: number = 500,
    _details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this._statusCode = _statusCode;
    this._details = _details;
  }
}
