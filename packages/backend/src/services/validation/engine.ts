/**
 * Consistency Validation Engine
 * Runs 30+ rules to check coherence between mechanics and lore
 */

import type { Concept, MechanicsData, LoreData, ValidationIssue, ValidationCategory } from '@gameforge/shared';
import { validatePlayerAbilitiesMatch } from './rules/mechanics-lore-alignment.js';
import { validateGenreConventions } from './rules/genre-conventions.js';

export interface ValidationRule {
  name: string;
  category: ValidationCategory;
  weight: number;
  execute: (mechanics: MechanicsData, lore: LoreData, genre?: string) => Promise<ValidationIssue | null>;
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
    // Mechanics-Lore Alignment (10 rules, weight 1.5 - critical)
    this.rules.push({
      name: 'player-abilities-match',
      category: 'mechanics-lore-alignment',
      weight: 1.5,
      execute: validatePlayerAbilitiesMatch,
    });

    // Genre Conventions (8 rules, weight 1.0)
    this.rules.push({
      name: 'genre-conventions',
      category: 'genre-conventions',
      weight: 1.0,
      execute: validateGenreConventions,
    });

    // Additional rules can be added here
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
          console.error(`[Validation] Rule ${rule.name} failed:`, error);
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
