/**
 * Holistic validation helpers
 * Catch missing fundamentals that make other rules less reliable
 */

import type { MechanicsData, LoreData, ValidationIssue } from '@gameforge/shared';

/**
 * Ensure core sections exist so other rules have context
 */
export async function validateContentCompleteness(
  mechanics: MechanicsData,
  lore: LoreData
): Promise<ValidationIssue | null> {
  const missingMechanics: string[] = [];
  const missingLore: string[] = [];

  // Mechanics coverage
  if (!mechanics.coreLoop || mechanics.coreLoop.trim().length === 0) {
    missingMechanics.push('core loop');
  }
  if (!mechanics.playerActions || mechanics.playerActions.length === 0) {
    missingMechanics.push('player actions');
  }
  if (!mechanics.winConditions || mechanics.winConditions.length === 0) {
    missingMechanics.push('win conditions');
  }

  // Lore coverage
  const setting = lore.setting || {};
  if (!setting.era && !setting.location && !setting.worldType) {
    missingLore.push('setting/era');
  }
  if (!lore.protagonist?.motivation && !lore.protagonist?.background) {
    missingLore.push('protagonist motivation/background');
  }
  if (!lore.conflict?.primary) {
    missingLore.push('primary conflict');
  }
  if (!lore.worldRules?.physics && !lore.worldRules?.technology && !lore.worldRules?.magic) {
    missingLore.push('world rules (physics/tech/magic)');
  }

  const missingCount = missingMechanics.length + missingLore.length;
  if (missingCount === 0) {
    return null;
  }

  const severity: 'warning' | 'info' = missingCount >= 3 ? 'warning' : 'info';
  const confidence = missingCount >= 3 ? 0.82 : 0.68;

  const messageParts = [];
  if (missingMechanics.length) {
    messageParts.push(`mechanics missing ${missingMechanics.join(', ')}`);
  }
  if (missingLore.length) {
    messageParts.push(`lore missing ${missingLore.join(', ')}`);
  }

  return {
    rule: 'content-completeness',
    severity,
    confidence,
    message: `Key sections are incomplete: ${messageParts.join(' and ')}. Validation accuracy is reduced until these are filled in.`,
    suggestion: 'Add the missing sections so other validation rules have enough context. Start with core loop, player actions, primary conflict, and world rules.',
    location: {
      mechanics: ['coreLoop', 'playerActions', 'winConditions'],
      lore: ['setting', 'protagonist', 'conflict', 'worldRules'],
    },
  };
}
