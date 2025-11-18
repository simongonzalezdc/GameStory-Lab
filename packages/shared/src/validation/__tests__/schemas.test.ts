/**
 * Tests for Zod validation schemas
 */

import { describe, it, expect } from 'vitest';
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  GenerationRequestSchema,
  ValidationRequestSchema,
  ExportRequestSchema,
  RefinementRequestSchema,
  ValidationIssueSchema,
  ValidationResponseSchema,
  MechanicsDataSchema,
  LoreDataSchema,
  EnvironmentSchema,
} from '../schemas';

describe('CreateProjectSchema', () => {
  it('should validate valid project data', () => {
    const result = CreateProjectSchema.safeParse({
      name: 'My Game Project',
      genre: 'rpg',
    });
    expect(result.success).toBe(true);
  });

  it('should accept project without genre', () => {
    const result = CreateProjectSchema.safeParse({
      name: 'My Game Project',
    });
    expect(result.success).toBe(true);
  });

  it('should reject names shorter than 3 characters', () => {
    const result = CreateProjectSchema.safeParse({ name: 'ab' });
    expect(result.success).toBe(false);
  });

  it('should reject names longer than 255 characters', () => {
    const result = CreateProjectSchema.safeParse({ name: 'a'.repeat(256) });
    expect(result.success).toBe(false);
  });

  it('should reject empty name', () => {
    const result = CreateProjectSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('should reject genre longer than 100 characters', () => {
    const result = CreateProjectSchema.safeParse({
      name: 'Valid Name',
      genre: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateProjectSchema', () => {
  it('should validate with both fields', () => {
    const result = UpdateProjectSchema.safeParse({
      name: 'Updated Name',
      genre: 'fps',
    });
    expect(result.success).toBe(true);
  });

  it('should validate with only name', () => {
    const result = UpdateProjectSchema.safeParse({
      name: 'Updated Name',
    });
    expect(result.success).toBe(true);
  });

  it('should validate with only genre', () => {
    const result = UpdateProjectSchema.safeParse({
      genre: 'strategy',
    });
    expect(result.success).toBe(true);
  });

  it('should validate with empty object', () => {
    const result = UpdateProjectSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should reject invalid name length', () => {
    const result = UpdateProjectSchema.safeParse({ name: 'ab' });
    expect(result.success).toBe(false);
  });
});

describe('GenerationRequestSchema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('should validate minimal generation request', () => {
    const result = GenerationRequestSchema.safeParse({
      projectId: validUUID,
      taskType: 'mechanics',
      context: {},
    });
    expect(result.success).toBe(true);
  });

  it('should validate all task types', () => {
    const taskTypes = ['mechanics', 'lore', 'title', 'refinement', 'consistency'];

    taskTypes.forEach((taskType) => {
      const result = GenerationRequestSchema.safeParse({
        projectId: validUUID,
        taskType,
        context: {},
      });
      expect(result.success).toBe(true);
    });
  });

  it('should validate with full context', () => {
    const result = GenerationRequestSchema.safeParse({
      projectId: validUUID,
      taskType: 'lore',
      context: {
        genre: 'rpg',
        existingContent: {
          mechanics: { coreLoop: 'Combat and exploration' },
          lore: { setting: { era: 'Medieval' } },
        },
        userPrompt: 'Make it epic',
      },
      modelPreference: 'ollama',
    });
    expect(result.success).toBe(true);
  });

  it('should validate model preferences', () => {
    const preferences = ['auto', 'openrouter', 'ollama', 'custom-model'];

    preferences.forEach((pref) => {
      const result = GenerationRequestSchema.safeParse({
        projectId: validUUID,
        taskType: 'mechanics',
        context: {},
        modelPreference: pref,
      });
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid UUID', () => {
    const result = GenerationRequestSchema.safeParse({
      projectId: 'not-a-uuid',
      taskType: 'mechanics',
      context: {},
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid task type', () => {
    const result = GenerationRequestSchema.safeParse({
      projectId: validUUID,
      taskType: 'invalid-task',
      context: {},
    });
    expect(result.success).toBe(false);
  });
});

describe('ValidationRequestSchema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('should validate valid validation request', () => {
    const result = ValidationRequestSchema.safeParse({
      conceptId: validUUID,
      mechanics: { coreLoop: 'Turn-based combat' },
      lore: { setting: { era: 'Future' } },
    });
    expect(result.success).toBe(true);
  });

  it('should accept empty mechanics and lore objects', () => {
    const result = ValidationRequestSchema.safeParse({
      conceptId: validUUID,
      mechanics: {},
      lore: {},
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid conceptId', () => {
    const result = ValidationRequestSchema.safeParse({
      conceptId: 'invalid',
      mechanics: {},
      lore: {},
    });
    expect(result.success).toBe(false);
  });
});

describe('ExportRequestSchema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('should validate all template types', () => {
    const templates = ['gdd', 'pitch', 'technical'];

    templates.forEach((template) => {
      const result = ExportRequestSchema.safeParse({
        conceptId: validUUID,
        template,
      });
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid template type', () => {
    const result = ExportRequestSchema.safeParse({
      conceptId: validUUID,
      template: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

describe('RefinementRequestSchema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('should validate all focus types', () => {
    const focuses = [
      'deepen-mechanics',
      'enrich-lore',
      'improve-consistency',
      'enhance-genre-fit',
    ];

    focuses.forEach((focus) => {
      const result = RefinementRequestSchema.safeParse({
        conceptId: validUUID,
        focus,
        currentContent: {
          mechanics: { coreLoop: 'Test' },
          lore: { themes: ['Adventure'] },
        },
      });
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid focus type', () => {
    const result = RefinementRequestSchema.safeParse({
      conceptId: validUUID,
      focus: 'invalid-focus',
      currentContent: {
        mechanics: {},
        lore: {},
      },
    });
    expect(result.success).toBe(false);
  });
});

describe('ValidationIssueSchema', () => {
  it('should validate complete validation issue', () => {
    const result = ValidationIssueSchema.safeParse({
      rule: 'mechanics-lore-alignment',
      severity: 'warning',
      confidence: 0.85,
      message: 'Mechanics and lore may not align',
      suggestion: 'Consider revising the lore',
      location: {
        mechanics: ['coreLoop'],
        lore: ['setting', 'worldRules'],
      },
    });
    expect(result.success).toBe(true);
  });

  it('should validate minimal validation issue', () => {
    const result = ValidationIssueSchema.safeParse({
      rule: 'test-rule',
      severity: 'info',
      confidence: 0.5,
      message: 'Test message',
    });
    expect(result.success).toBe(true);
  });

  it('should validate all severity levels', () => {
    const severities = ['error', 'warning', 'info'];

    severities.forEach((severity) => {
      const result = ValidationIssueSchema.safeParse({
        rule: 'test-rule',
        severity,
        confidence: 0.5,
        message: 'Test',
      });
      expect(result.success).toBe(true);
    });
  });

  it('should reject confidence below 0', () => {
    const result = ValidationIssueSchema.safeParse({
      rule: 'test',
      severity: 'info',
      confidence: -0.1,
      message: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('should reject confidence above 1', () => {
    const result = ValidationIssueSchema.safeParse({
      rule: 'test',
      severity: 'info',
      confidence: 1.1,
      message: 'Test',
    });
    expect(result.success).toBe(false);
  });
});

describe('ValidationResponseSchema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('should validate complete validation response', () => {
    const result = ValidationResponseSchema.safeParse({
      validationId: validUUID,
      issues: [
        {
          rule: 'test-rule',
          severity: 'warning',
          confidence: 0.8,
          message: 'Test issue',
        },
      ],
      overallScore: 0.75,
    });
    expect(result.success).toBe(true);
  });

  it('should validate with empty issues array', () => {
    const result = ValidationResponseSchema.safeParse({
      validationId: validUUID,
      issues: [],
      overallScore: 1.0,
    });
    expect(result.success).toBe(true);
  });

  it('should reject score below 0', () => {
    const result = ValidationResponseSchema.safeParse({
      validationId: validUUID,
      issues: [],
      overallScore: -0.1,
    });
    expect(result.success).toBe(false);
  });

  it('should reject score above 1', () => {
    const result = ValidationResponseSchema.safeParse({
      validationId: validUUID,
      issues: [],
      overallScore: 1.1,
    });
    expect(result.success).toBe(false);
  });
});

describe('MechanicsDataSchema', () => {
  it('should validate complete mechanics data', () => {
    const result = MechanicsDataSchema.safeParse({
      coreLoop: 'Explore, fight, upgrade',
      playerActions: ['move', 'attack', 'defend'],
      progressionSystems: {
        type: 'branching',
        mechanics: ['skill tree', 'level up'],
      },
      winConditions: ['defeat final boss'],
      failConditions: ['player death'],
      resourceSystems: [
        {
          name: 'Health',
          mechanics: 'Regenerates over time',
          scarcity: 'balanced',
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('should validate empty mechanics data', () => {
    const result = MechanicsDataSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should validate all progression types', () => {
    const types = ['linear', 'branching', 'open'];

    types.forEach((type) => {
      const result = MechanicsDataSchema.safeParse({
        progressionSystems: {
          type,
          mechanics: ['test'],
        },
      });
      expect(result.success).toBe(true);
    });
  });

  it('should validate all resource scarcity levels', () => {
    const scarcities = ['abundant', 'balanced', 'scarce'];

    scarcities.forEach((scarcity) => {
      const result = MechanicsDataSchema.safeParse({
        resourceSystems: [
          {
            name: 'Test',
            mechanics: 'Test mechanics',
            scarcity,
          },
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  it('should allow passthrough fields', () => {
    const result = MechanicsDataSchema.safeParse({
      customField: 'custom value',
      anotherField: { nested: 'data' },
    });
    expect(result.success).toBe(true);
  });
});

describe('LoreDataSchema', () => {
  it('should validate complete lore data', () => {
    const result = LoreDataSchema.safeParse({
      setting: {
        era: 'Medieval',
        location: 'Mystical Kingdom',
        worldType: 'High Fantasy',
      },
      protagonist: {
        background: 'Orphaned warrior',
        motivation: 'Revenge',
        abilities: ['sword mastery', 'magic'],
      },
      conflict: {
        primary: 'Dark lord threatens the realm',
        secondary: ['Internal political strife', 'Ancient curse'],
      },
      worldRules: {
        physics: 'Normal except for magic',
        magic: 'Elemental-based',
        technology: 'Medieval level',
      },
      themes: ['redemption', 'sacrifice'],
    });
    expect(result.success).toBe(true);
  });

  it('should validate empty lore data', () => {
    const result = LoreDataSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should validate partial lore data', () => {
    const result = LoreDataSchema.safeParse({
      themes: ['adventure'],
      setting: {
        era: 'Future',
      },
    });
    expect(result.success).toBe(true);
  });

  it('should allow passthrough fields', () => {
    const result = LoreDataSchema.safeParse({
      customLoreField: 'custom value',
      extraData: { some: 'data' },
    });
    expect(result.success).toBe(true);
  });
});

describe('EnvironmentSchema', () => {
  it('should validate complete environment config', () => {
    const result = EnvironmentSchema.safeParse({
      DATABASE_URL: 'postgresql://localhost:5432/gameforge',
      REDIS_URL: 'redis://localhost:6379',
      OPENROUTER_API_KEY: 'sk-test-key',
      GOOGLE_API_KEY: 'google-key',
      GLM_API_KEY: 'glm-key',
      OLLAMA_BASE_URL: 'http://localhost:11434',
      NODE_ENV: 'production',
      PORT: '3001',
      FRONTEND_URL: 'http://localhost:5173',
      RATE_LIMIT_MAX: '20',
      RATE_LIMIT_WINDOW_MS: '60000',
      AI_COST_LIMIT_PER_HOUR_USD: '5.00',
    });
    expect(result.success).toBe(true);
  });

  it('should validate minimal environment config with defaults', () => {
    const result = EnvironmentSchema.safeParse({
      DATABASE_URL: 'postgresql://localhost:5432/gameforge',
      REDIS_URL: 'redis://localhost:6379',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.OLLAMA_BASE_URL).toBe('http://localhost:11434');
      expect(result.data.NODE_ENV).toBe('development');
      expect(result.data.PORT).toBe('3001');
    }
  });

  it('should validate all NODE_ENV values', () => {
    const envs = ['development', 'production', 'test'];

    envs.forEach((env) => {
      const result = EnvironmentSchema.safeParse({
        DATABASE_URL: 'postgresql://localhost:5432/gameforge',
        REDIS_URL: 'redis://localhost:6379',
        NODE_ENV: env,
      });
      expect(result.success).toBe(true);
    });
  });

  it('should reject missing required DATABASE_URL', () => {
    const result = EnvironmentSchema.safeParse({
      REDIS_URL: 'redis://localhost:6379',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing required REDIS_URL', () => {
    const result = EnvironmentSchema.safeParse({
      DATABASE_URL: 'postgresql://localhost:5432/gameforge',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid NODE_ENV', () => {
    const result = EnvironmentSchema.safeParse({
      DATABASE_URL: 'postgresql://localhost:5432/gameforge',
      REDIS_URL: 'redis://localhost:6379',
      NODE_ENV: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});
