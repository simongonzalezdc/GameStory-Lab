/**
 * Mechanics-Lore Alignment Validation Rules
 * Ensure gameplay mechanics are justified by narrative/worldbuilding
 */

import type { MechanicsData, LoreData, ValidationIssue } from '@gameforge/shared';

/**
 * Validate that player actions match character abilities
 */
export async function validatePlayerAbilitiesMatch(
  mechanics: MechanicsData,
  lore: LoreData
): Promise<ValidationIssue | null> {
  const playerActions = mechanics.playerActions || [];
  const characterAbilities = lore.protagonist?.abilities || [];

  if (playerActions.length === 0) {
    return null; // No actions to validate
  }

  // Simple keyword matching for basic validation
  // In production, this could use AI for semantic matching
  const unmatchedActions: string[] = [];

  for (const action of playerActions) {
    const actionLower = action.toLowerCase();
    const hasMatchingAbility = characterAbilities.some((ability) => {
      const abilityLower = ability.toLowerCase();
      // Check if action words appear in abilities or vice versa
      return (
        actionLower.includes(abilityLower) ||
        abilityLower.includes(actionLower) ||
        // Check for common synonyms
        checkSemanticMatch(actionLower, abilityLower)
      );
    });

    if (!hasMatchingAbility && characterAbilities.length > 0) {
      unmatchedActions.push(action);
    }
  }

  if (unmatchedActions.length === 0) {
    return null; // All actions justified
  }

  // Determine severity based on how many actions are unjustified
  const unmatchedRatio = unmatchedActions.length / playerActions.length;
  let severity: 'error' | 'warning' | 'info';
  let confidence: number;

  if (unmatchedRatio > 0.5) {
    severity = 'error';
    confidence = 0.90;
  } else if (unmatchedRatio > 0.25) {
    severity = 'warning';
    confidence = 0.75;
  } else {
    severity = 'info';
    confidence = 0.60;
  }

  return {
    rule: 'player-abilities-match',
    severity,
    confidence,
    message: `${unmatchedActions.length} player action(s) not justified by character abilities: ${unmatchedActions.join(', ')}`,
    suggestion: `Add these abilities to protagonist: ${unmatchedActions.join(', ')} OR remove unjustified actions from mechanics`,
    location: {
      mechanics: ['playerActions'],
      lore: ['protagonist.abilities'],
    },
  };
}

/**
 * Simple semantic matching for common gameplay terms
 */
function checkSemanticMatch(action: string, ability: string): boolean {
  const synonymGroups = [
    ['shoot', 'fire', 'gun', 'weapon', 'combat', 'attack'],
    ['jump', 'leap', 'climb', 'acrobatic', 'agile'],
    ['magic', 'spell', 'cast', 'enchant', 'mystical'],
    ['stealth', 'sneak', 'hide', 'invisible', 'silent'],
    ['craft', 'build', 'create', 'construct', 'make'],
    ['heal', 'cure', 'restore', 'regenerate', 'recovery'],
    ['fly', 'flight', 'aerial', 'soar', 'hover'],
  ];

  for (const group of synonymGroups) {
    const actionMatches = group.some((word) => action.includes(word));
    const abilityMatches = group.some((word) => ability.includes(word));
    if (actionMatches && abilityMatches) {
      return true;
    }
  }

  return false;
}

/**
 * Validate that resource systems have in-world explanations
 */
export async function validateResourceLogic(
  mechanics: MechanicsData,
  lore: LoreData
): Promise<ValidationIssue | null> {
  const resourceSystems = mechanics.resourceSystems || [];

  if (resourceSystems.length === 0) {
    return null;
  }

  // Check if world rules explain resources
  const worldRules = lore.worldRules;
  const loreText = JSON.stringify(lore).toLowerCase();

  const unexplainedResources: string[] = [];

  for (const resource of resourceSystems) {
    const resourceName = resource.name.toLowerCase();
    // Check if resource is mentioned in lore
    if (!loreText.includes(resourceName) && !loreText.includes(resource.name)) {
      unexplainedResources.push(resource.name);
    }
  }

  if (unexplainedResources.length === 0) {
    return null;
  }

  return {
    rule: 'resource-logic',
    severity: 'warning',
    confidence: 0.70,
    message: `${unexplainedResources.length} resource(s) not explained in lore: ${unexplainedResources.join(', ')}`,
    suggestion: `Add world rules or setting details that explain these resources: ${unexplainedResources.join(', ')}`,
    location: {
      mechanics: ['resourceSystems'],
      lore: ['worldRules', 'setting'],
    },
  };
}
