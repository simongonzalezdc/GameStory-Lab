/**
 * Narrative Structure Validation Rules
 * Basic storytelling coherence checks
 */

import type { MechanicsData, LoreData, ValidationIssue } from '@gameforge/shared';

/**
 * Validate protagonist has clear motivation
 */
export async function validateProtagonistMotivation(
  _mechanics: MechanicsData,
  lore: LoreData
): Promise<ValidationIssue | null> {
  const protagonist = lore.protagonist;

  if (!protagonist) {
    return {
      rule: 'protagonist-motivation',
      severity: 'warning',
      confidence: 0.85,
      message: 'No protagonist defined in lore',
      suggestion: 'Define who the player character is and why they are on this journey',
      location: {
        lore: ['protagonist'],
      },
    };
  }

  if (!protagonist.motivation || protagonist.motivation.length < 10) {
    return {
      rule: 'protagonist-motivation',
      severity: 'warning',
      confidence: 0.80,
      message: 'Protagonist lacks clear motivation for their actions',
      suggestion: 'Define WHY the protagonist undertakes this journey: revenge, duty, curiosity, survival, etc.',
      location: {
        lore: ['protagonist.motivation'],
      },
    };
  }

  return null;
}

/**
 * Validate conflict has resolution path
 */
export async function validateConflictResolution(
  mechanics: MechanicsData,
  lore: LoreData
): Promise<ValidationIssue | null> {
  const conflict = lore.conflict;
  const winConditions = mechanics.winConditions || [];

  if (!conflict?.primary) {
    return {
      rule: 'conflict-resolution',
      severity: 'warning',
      confidence: 0.85,
      message: 'No primary conflict defined in lore',
      suggestion: 'Define the main problem or antagonist the player must overcome',
      location: {
        lore: ['conflict.primary'],
      },
    };
  }

  if (winConditions.length === 0) {
    return {
      rule: 'conflict-resolution',
      severity: 'warning',
      confidence: 0.75,
      message: 'Primary conflict exists but no win conditions define how to resolve it',
      suggestion: `Add win conditions that resolve: ${conflict.primary}`,
      location: {
        mechanics: ['winConditions'],
        lore: ['conflict.primary'],
      },
    };
  }

  // Check if win conditions relate to conflict
  const conflictText = conflict.primary.toLowerCase();
  const winText = winConditions.join(' ').toLowerCase();

  // Extract key conflict terms
  const conflictWords = conflictText.split(' ').filter((word) => word.length > 4);
  const hasRelation = conflictWords.some((word) => winText.includes(word));

  if (!hasRelation && conflictWords.length > 0) {
    return {
      rule: 'conflict-resolution',
      severity: 'info',
      confidence: 0.70,
      message: 'Win conditions may not directly resolve the primary conflict',
      suggestion: `Ensure victory addresses: ${conflict.primary}`,
      location: {
        mechanics: ['winConditions'],
        lore: ['conflict.primary'],
      },
    };
  }

  return null;
}

/**
 * Validate themes are consistent
 */
export async function validateThemeConsistency(
  mechanics: MechanicsData,
  lore: LoreData
): Promise<ValidationIssue | null> {
  const themes = lore.themes || [];

  if (themes.length === 0) {
    return {
      rule: 'theme-consistency',
      severity: 'info',
      confidence: 0.60,
      message: 'No themes defined - themes help unify narrative and mechanics',
      suggestion: 'Define 1-3 central themes: survival, redemption, discovery, sacrifice, etc.',
      location: {
        lore: ['themes'],
      },
    };
  }

  // Check if mechanics reinforce themes
  const mechanicsText = JSON.stringify(mechanics).toLowerCase();
  const loreText = JSON.stringify(lore).toLowerCase();

  const themesNotReinforced: string[] = [];

  for (const theme of themes) {
    const themeWords = theme.toLowerCase().split(' ');
    const reinforced = themeWords.some((word) =>
      mechanicsText.includes(word) || loreText.includes(word)
    );

    if (!reinforced) {
      themesNotReinforced.push(theme);
    }
  }

  if (themesNotReinforced.length > 0 && themesNotReinforced.length === themes.length) {
    return {
      rule: 'theme-consistency',
      severity: 'info',
      confidence: 0.65,
      message: `Themes (${themes.join(', ')}) are not reflected in mechanics or lore`,
      suggestion: 'Weave themes into gameplay and narrative, not just list them',
      location: {
        mechanics: ['coreLoop', 'playerActions'],
        lore: ['themes', 'conflict'],
      },
    };
  }

  return null;
}
