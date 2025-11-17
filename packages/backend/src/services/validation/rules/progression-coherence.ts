/**
 * Player Progression Coherence Validation Rules
 * Validate progression systems make sense
 */

import type { MechanicsData, LoreData, ValidationIssue } from '@gameforge/shared';

/**
 * Validate power curve is gradual
 */
export async function validatePowerCurve(
  mechanics: MechanicsData,
  lore: LoreData
): Promise<ValidationIssue | null> {
  const progression = mechanics.progressionSystems;

  if (!progression) {
    return null;
  }

  // Check for sudden power spikes in progression description
  const progressionText = JSON.stringify(progression).toLowerCase();
  const hasSuddenJumps = progressionText.includes('instant') ||
                        progressionText.includes('immediately powerful') ||
                        progressionText.includes('godlike');

  if (hasSuddenJumps && progression.type === 'linear') {
    return {
      rule: 'power-curve',
      severity: 'warning',
      confidence: 0.70,
      message: 'Linear progression with sudden power spikes may feel unbalanced',
      suggestion: 'Smooth out power increases or change to branching progression',
      location: {
        mechanics: ['progressionSystems'],
        lore: ['protagonist'],
      },
    };
  }

  return null;
}

/**
 * Validate gating has narrative justification
 */
export async function validateGatingJustification(
  mechanics: MechanicsData,
  lore: LoreData
): Promise<ValidationIssue | null> {
  const mechanicsText = JSON.stringify(mechanics).toLowerCase();
  const hasGating = mechanicsText.includes('locked') ||
                   mechanicsText.includes('gate') ||
                   mechanicsText.includes('requires level') ||
                   mechanicsText.includes('unlock');

  if (!hasGating) {
    return null;
  }

  const _loreText = JSON.stringify(lore).toLowerCase();
  const hasJustification = loreText.includes('barrier') ||
                          loreText.includes('seal') ||
                          loreText.includes('forbidden') ||
                          loreText.includes('guardian') ||
                          loreText.includes('prerequisite');

  if (!hasJustification) {
    return {
      rule: 'gating-justification',
      severity: 'info',
      confidence: 0.65,
      message: 'Locked areas/content exist but lore does not explain why',
      suggestion: 'Add narrative reasons for gates: magical seals, guarded areas, required knowledge, etc.',
      location: {
        mechanics: ['progressionSystems'],
        lore: ['setting', 'conflict'],
      },
    };
  }

  return null;
}

/**
 * Validate skill mastery progression
 */
export async function validateSkillMastery(
  mechanics: MechanicsData,
  lore: LoreData
): Promise<ValidationIssue | null> {
  const progression = mechanics.progressionSystems;
  const _playerActions = mechanics.playerActions || [];

  if (!progression || playerActions.length === 0) {
    return null;
  }

  // Check if player learns mechanics before advanced challenges
  const mechanicsText = JSON.stringify(mechanics).toLowerCase();
  const hasTutorial = mechanicsText.includes('tutorial') ||
                     mechanicsText.includes('learn') ||
                     mechanicsText.includes('introduction');

  const hasComplexMechanics = playerActions.length > 5;

  if (hasComplexMechanics && !hasTutorial) {
    return {
      rule: 'skill-mastery',
      severity: 'info',
      confidence: 0.60,
      message: `${playerActions.length} player actions exist but no tutorial/learning phase mentioned`,
      suggestion: 'Add progression mechanics for teaching player actions gradually',
      location: {
        mechanics: ['progressionSystems', 'playerActions'],
        lore: ['protagonist.background'],
      },
    };
  }

  return null;
}

/**
 * Validate endgame rewards are appropriately epic
 */
export async function validateEndgameReward(
  mechanics: MechanicsData,
  lore: LoreData
): Promise<ValidationIssue | null> {
  const winConditions = mechanics.winConditions || [];
  const conflict = lore.conflict;

  if (winConditions.length === 0 || !conflict?.primary) {
    return null;
  }

  // Check if victory feels proportional to conflict
  const conflictText = conflict.primary.toLowerCase();
  const isEpicConflict = conflictText.includes('world') ||
                        conflictText.includes('universe') ||
                        conflictText.includes('humanity') ||
                        conflictText.includes('destroy') ||
                        conflictText.includes('apocalypse');

  const winText = winConditions.join(' ').toLowerCase();
  const hasEpicReward = winText.includes('save') ||
                       winText.includes('defeat') ||
                       winText.includes('victory') ||
                       winText.includes('triumph');

  if (isEpicConflict && !hasEpicReward) {
    return {
      rule: 'endgame-reward',
      severity: 'warning',
      confidence: 0.75,
      message: 'Epic conflict deserves epic victory condition, not mundane win condition',
      suggestion: `Victory should match stakes: ${conflict.primary}`,
      location: {
        mechanics: ['winConditions'],
        lore: ['conflict.primary'],
      },
    };
  }

  return null;
}
