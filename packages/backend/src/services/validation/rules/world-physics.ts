/**
 * World Physics Consistency Validation Rules
 * Ensure world rules don't contradict themselves
 */

import type { MechanicsData, LoreData, ValidationIssue } from '@gameforge/shared';

/**
 * Validate gravity consistency
 */
export async function validateGravityConsistency(
  mechanics: MechanicsData,
  lore: LoreData
): Promise<ValidationIssue | null> {
  const playerActions = mechanics.playerActions || [];
  const worldRules = lore.worldRules;

  const hasJump = playerActions.some((action) =>
    action.toLowerCase().match(/jump|leap|fall|drop/)
  );
  const hasFly = playerActions.some((action) =>
    action.toLowerCase().match(/fly|float|hover|levitate/)
  );

  if (!hasJump && !hasFly) {
    return null; // No gravity-related mechanics
  }

  const physicsText = worldRules?.physics?.toLowerCase() || '';

  if (hasFly && !physicsText.includes('gravity') && !physicsText.includes('float') && !lore.worldRules?.magic) {
    return {
      rule: 'gravity-consistency',
      severity: 'warning',
      confidence: 0.70,
      message: 'Flight mechanics exist but physics rules do not explain how (anti-gravity, magic, wings, etc.)',
      suggestion: 'Add world rules explaining flight capability: magic, technology, natural ability, etc.',
      location: {
        mechanics: ['playerActions'],
        lore: ['worldRules.physics', 'worldRules.magic'],
      },
    };
  }

  return null;
}

/**
 * Validate material properties
 */
export async function validateMaterialProperties(
  mechanics: MechanicsData,
  lore: LoreData
): Promise<ValidationIssue | null> {
  const playerActions = mechanics.playerActions || [];
  const mechanicsText = JSON.stringify(mechanics).toLowerCase();

  // Check for physically impossible actions
  const burnWater = mechanicsText.includes('burn water') || mechanicsText.includes('ignite water');
  const freezeFire = mechanicsText.includes('freeze fire') || mechanicsText.includes('ice fire');

  const worldRules = lore.worldRules;
  const hasMagic = worldRules?.magic && worldRules.magic.toLowerCase() !== 'none';

  if ((burnWater || freezeFire) && !hasMagic) {
    return {
      rule: 'material-properties',
      severity: 'error',
      confidence: 0.85,
      message: 'Mechanics violate material properties (burning water, freezing fire) without magic explanation',
      suggestion: 'Either add magic system to world rules OR adjust mechanics to follow real-world physics',
      location: {
        mechanics: ['playerActions', 'resourceSystems'],
        lore: ['worldRules.physics', 'worldRules.magic'],
      },
    };
  }

  return null;
}

/**
 * Validate time consistency
 */
export async function validateTimeConsistency(
  mechanics: MechanicsData,
  lore: LoreData
): Promise<ValidationIssue | null> {
  const mechanicsText = JSON.stringify(mechanics).toLowerCase();
  const hasTimeTravel = mechanicsText.includes('time travel') ||
                       mechanicsText.includes('rewind time') ||
                       mechanicsText.includes('temporal');

  if (!hasTimeTravel) {
    return null;
  }

  const worldRules = lore.worldRules;
  const physicsText = worldRules?.physics?.toLowerCase() || '';
  const hasTemporal Rules = physicsText.includes('time') || physicsText.includes('temporal');

  if (!hasTemporalRules) {
    return {
      rule: 'time-consistency',
      severity: 'warning',
      confidence: 0.80,
      message: 'Time manipulation mechanics exist but world rules do not define temporal physics',
      suggestion: 'Add world rules explaining how time travel/manipulation works and its limitations',
      location: {
        mechanics: ['playerActions', 'coreLoop'],
        lore: ['worldRules.physics'],
      },
    };
  }

  return null;
}

/**
 * Validate spatial logic (inventory, distance)
 */
export async function validateSpatialLogic(
  mechanics: MechanicsData,
  lore: LoreData
): Promise<ValidationIssue | null> {
  const mechanicsText = JSON.stringify(mechanics).toLowerCase();
  const hasInventory = mechanicsText.includes('inventory') ||
                      mechanicsText.includes('carry') ||
                      mechanicsText.includes('collect items');

  if (!hasInventory) {
    return null;
  }

  const hasUnlimitedStorage = mechanicsText.includes('unlimited') ||
                             mechanicsText.includes('infinite inventory');

  const worldRules = lore.worldRules;
  const hasMagicStorage = worldRules?.magic?.toLowerCase().includes('storage') ||
                         worldRules?.magic?.toLowerCase().includes('pocket dimension') ||
                         worldRules?.magic?.toLowerCase().includes('bag of holding');

  if (hasUnlimitedStorage && !hasMagicStorage) {
    return {
      rule: 'spatial-logic',
      severity: 'info',
      confidence: 0.65,
      message: 'Unlimited inventory without magical explanation breaks spatial logic',
      suggestion: 'Add magic/tech explanation for infinite storage OR make inventory limited',
      location: {
        mechanics: ['resourceSystems'],
        lore: ['worldRules.magic', 'worldRules.technology'],
      },
    };
  }

  return null;
}

/**
 * Validate cause and effect (causality)
 */
export async function validateCausality(
  mechanics: MechanicsData,
  lore: LoreData
): Promise<ValidationIssue | null> {
  const winConditions = mechanics.winConditions || [];
  const failConditions = mechanics.failConditions || [];

  // Check if actions have consequences
  const hasConsequences = failConditions.length > 0;

  if (winConditions.length > 0 && !hasConsequences) {
    return {
      rule: 'causality',
      severity: 'info',
      confidence: 0.60,
      message: 'Game has win conditions but no defined fail conditions or consequences',
      suggestion: 'Define what happens when player fails: death, game over, setbacks, etc.',
      location: {
        mechanics: ['failConditions'],
        lore: ['worldRules'],
      },
    };
  }

  return null;
}
