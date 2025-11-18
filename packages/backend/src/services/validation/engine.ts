/**
 * Consistency Validation Engine
 * Runs 30+ rules to check coherence between mechanics and lore
 */

import type { MechanicsData, LoreData, ValidationIssue, ValidationCategory } from '@gameforge/shared';
import { logger } from '../../utils/logger.js';

// Mechanics-Lore Alignment rules
import {
  validatePlayerAbilitiesMatch,
  validateResourceLogic,
  validateWinConditionsNarrativeSound,
  validateProgressionExplainsPowerGrowth,
  validateCombatSystemConsistency,
  validateMagicSystemRules,
  validateTechnologyLevelMatch,
  validateDeathConsequencesAlign,
  validateMultiplayerJustification,
  validateEconomyWorldbuilding,
} from './rules/mechanics-lore-alignment.js';

// Genre Conventions rules
import { validateGenreConventions } from './rules/genre-conventions.js';

// World Physics rules
import {
  validateGravityConsistency,
  validateMaterialProperties,
  validateTimeConsistency,
  validateSpatialLogic,
  validateCausality,
} from './rules/world-physics.js';

// Progression Coherence rules
import {
  validatePowerCurve,
  validateGatingJustification,
  validateSkillMastery,
  validateEndgameReward,
} from './rules/progression-coherence.js';

// Narrative Structure rules
import {
  validateProtagonistMotivation,
  validateConflictResolution,
  validateThemeConsistency,
} from './rules/narrative-structure.js';

// Technical Feasibility rules
import {
  validateComplexityEstimate,
  validatePerformanceConsiderations,
  validateScopeRealityCheck,
} from './rules/technical-feasibility.js';

export interface ValidationRule {
  name: string;
  category: ValidationCategory;
  weight: number;
  execute: (_mechanics: MechanicsData, lore: LoreData, genre?: string) => Promise<ValidationIssue | null>;
}

export class ValidationEngine {
  private rules: ValidationRule[] = [];

  constructor() {
    this.registerRules();
  }

  /**
   * Register all validation rules
   */
  private registerRules(): void {
    // =================================================================
    // Mechanics-Lore Alignment (10 rules, weight 1.5 - critical)
    // =================================================================
    this.rules.push({
      name: 'player-abilities-match',
      category: 'mechanics-lore-alignment',
      weight: 1.5,
      execute: validatePlayerAbilitiesMatch,
    });

    this.rules.push({
      name: 'resource-logic',
      category: 'mechanics-lore-alignment',
      weight: 1.2,
      execute: validateResourceLogic,
    });

    this.rules.push({
      name: 'win-conditions-narratively-sound',
      category: 'mechanics-lore-alignment',
      weight: 1.4,
      execute: validateWinConditionsNarrativeSound,
    });

    this.rules.push({
      name: 'progression-explains-power-growth',
      category: 'mechanics-lore-alignment',
      weight: 1.2,
      execute: validateProgressionExplainsPowerGrowth,
    });

    this.rules.push({
      name: 'combat-system-consistency',
      category: 'mechanics-lore-alignment',
      weight: 1.5,
      execute: validateCombatSystemConsistency,
    });

    this.rules.push({
      name: 'magic-system-rules',
      category: 'mechanics-lore-alignment',
      weight: 1.5,
      execute: validateMagicSystemRules,
    });

    this.rules.push({
      name: 'technology-level-match',
      category: 'mechanics-lore-alignment',
      weight: 1.4,
      execute: validateTechnologyLevelMatch,
    });

    this.rules.push({
      name: 'death-consequences-align',
      category: 'mechanics-lore-alignment',
      weight: 1.0,
      execute: validateDeathConsequencesAlign,
    });

    this.rules.push({
      name: 'multiplayer-justification',
      category: 'mechanics-lore-alignment',
      weight: 1.0,
      execute: validateMultiplayerJustification,
    });

    this.rules.push({
      name: 'economy-worldbuilding',
      category: 'mechanics-lore-alignment',
      weight: 0.9,
      execute: validateEconomyWorldbuilding,
    });

    // =================================================================
    // Genre Conventions (1 meta-rule, weight 1.0)
    // =================================================================
    this.rules.push({
      name: 'genre-conventions',
      category: 'genre-conventions',
      weight: 1.0,
      execute: validateGenreConventions,
    });

    // =================================================================
    // World Physics (5 rules, weight 1.2)
    // =================================================================
    this.rules.push({
      name: 'gravity-consistency',
      category: 'world-physics',
      weight: 1.2,
      execute: validateGravityConsistency,
    });

    this.rules.push({
      name: 'material-properties',
      category: 'world-physics',
      weight: 1.3,
      execute: validateMaterialProperties,
    });

    this.rules.push({
      name: 'time-consistency',
      category: 'world-physics',
      weight: 1.2,
      execute: validateTimeConsistency,
    });

    this.rules.push({
      name: 'spatial-logic',
      category: 'world-physics',
      weight: 0.9,
      execute: validateSpatialLogic,
    });

    this.rules.push({
      name: 'causality',
      category: 'world-physics',
      weight: 1.0,
      execute: validateCausality,
    });

    // =================================================================
    // Progression Coherence (4 rules, weight 1.1)
    // =================================================================
    this.rules.push({
      name: 'power-curve',
      category: 'progression-coherence',
      weight: 1.1,
      execute: validatePowerCurve,
    });

    this.rules.push({
      name: 'gating-justification',
      category: 'progression-coherence',
      weight: 0.9,
      execute: validateGatingJustification,
    });

    this.rules.push({
      name: 'skill-mastery',
      category: 'progression-coherence',
      weight: 1.0,
      execute: validateSkillMastery,
    });

    this.rules.push({
      name: 'endgame-reward',
      category: 'progression-coherence',
      weight: 1.2,
      execute: validateEndgameReward,
    });

    // =================================================================
    // Narrative Structure (3 rules, weight 1.3)
    // =================================================================
    this.rules.push({
      name: 'protagonist-motivation',
      category: 'narrative-structure',
      weight: 1.3,
      execute: validateProtagonistMotivation,
    });

    this.rules.push({
      name: 'conflict-resolution',
      category: 'narrative-structure',
      weight: 1.4,
      execute: validateConflictResolution,
    });

    this.rules.push({
      name: 'theme-consistency',
      category: 'narrative-structure',
      weight: 0.9,
      execute: validateThemeConsistency,
    });

    // =================================================================
    // Technical Feasibility (3 rules, weight 0.8 - informational)
    // =================================================================
    this.rules.push({
      name: 'complexity-estimate',
      category: 'technical-feasibility',
      weight: 0.8,
      execute: validateComplexityEstimate,
    });

    this.rules.push({
      name: 'performance-considerations',
      category: 'technical-feasibility',
      weight: 0.7,
      execute: validatePerformanceConsiderations,
    });

    this.rules.push({
      name: 'scope-reality-check',
      category: 'technical-feasibility',
      weight: 0.9,
      execute: validateScopeRealityCheck,
    });

    logger.info('Validation engine initialized', {
      ruleCount: this.rules.length,
      categoryCount: new Set(this.rules.map((r) => r.category)).size,
    });
  }

  /**
   * Run all validation rules on a concept
   */
  async validate(
    mechanics: MechanicsData,
    lore: LoreData,
    genre?: string
  ): Promise<{
    issues: ValidationIssue[];
    overallScore: number;
  }> {
    // Run all rules in parallel
    const results = await Promise.all(
      this.rules.map(async (rule) => {
        try {
          const issue = await rule.execute(mechanics, lore, genre);
          return { rule, issue };
        } catch (error) {
          logger.error('Validation rule failed', { rule: rule.name, error });
          return { rule, issue: null };
        }
      })
    );

    // Filter out null results (rules that passed)
    const issues: ValidationIssue[] = results
      .filter(({ issue }) => issue !== null)
      .map(({ issue }) => issue!);

    // Calculate overall score
    const overallScore = this.calculateOverallScore(issues, this.rules);

    return {
      issues,
      overallScore,
    };
  }

  /**
   * Calculate overall consistency score (0-1)
   */
  private calculateOverallScore(issues: ValidationIssue[], rules: ValidationRule[]): number {
    // Start with perfect score
    let score = 1.0;

    // Penalties for issues
    for (const issue of issues) {
      const rule = rules.find((r) => r.name === issue.rule);
      const weight = rule?.weight || 1.0;

      if (issue.severity === 'error') {
        score -= 0.10 * weight * issue.confidence;
      } else if (issue.severity === 'warning') {
        score -= 0.05 * weight * issue.confidence;
      } else if (issue.severity === 'info') {
        score -= 0.02 * weight * issue.confidence;
      }
    }

    // Clamp to 0-1 range
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Get all registered rules
   */
  getRules(): ValidationRule[] {
    return this.rules;
  }
}
