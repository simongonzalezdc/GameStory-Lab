/**
 * Genre Conventions Validation Rules
 * Validate concept follows genre expectations
 */

import type { MechanicsData, LoreData, ValidationIssue } from '@gameforge/shared';

/**
 * Validate genre-specific conventions
 */
export async function validateGenreConventions(
  mechanics: MechanicsData,
  lore: LoreData,
  genre?: string
): Promise<ValidationIssue | null> {
  if (!genre || genre === 'blank') {
    return null; // No genre to validate against
  }

  const issues: string[] = [];

  switch (genre.toLowerCase()) {
    case 'rpg': {
      // RPG should have progression systems
      if (!mechanics.progressionSystems) {
        issues.push('RPG missing progression/leveling system');
      }
      // RPG should have character abilities
      if (!lore.protagonist?.abilities || lore.protagonist.abilities.length === 0) {
        issues.push('RPG protagonist should have defined abilities/skills');
      }
      break;
    }

    case 'fps': {
      // FPS should have combat/weapons
      const hasWeapons =
        mechanics.playerActions?.some((action) =>
          ['shoot', 'fire', 'aim', 'reload', 'weapon'].some((w) =>
            action.toLowerCase().includes(w)
          )
        ) || false;
      if (!hasWeapons) {
        issues.push('FPS should have shooting/weapon mechanics');
      }
      break;
    }

    case 'strategy': {
      // Strategy should have resource management
      if (!mechanics.resourceSystems || mechanics.resourceSystems.length === 0) {
        issues.push('Strategy games typically require resource management');
      }
      break;
    }

    case 'puzzle': {
      // Puzzle should have clear objectives
      if (!mechanics.winConditions || mechanics.winConditions.length === 0) {
        issues.push('Puzzle games need clear win/completion conditions');
      }
      break;
    }

    case 'survival': {
      // Survival should have resource scarcity
      const hasScarcity = mechanics.resourceSystems?.some(
        (r) => r.scarcity === 'scarce' || r.scarcity === 'balanced'
      );
      if (!hasScarcity) {
        issues.push('Survival games should have scarce resources');
      }
      break;
    }
  }

  if (issues.length === 0) {
    return null;
  }

  return {
    rule: 'genre-conventions',
    severity: 'info',
    confidence: 0.65,
    message: `Genre conventions for ${genre}: ${issues.join('; ')}`,
    suggestion: `Consider adding genre-typical elements or changing genre classification`,
  };
}
