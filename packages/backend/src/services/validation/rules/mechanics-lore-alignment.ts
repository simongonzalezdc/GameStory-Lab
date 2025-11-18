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

/**
 * Validate that win conditions make narrative sense
 */
export async function validateWinConditionsNarrativeSound(
  mechanics: MechanicsData,
  lore: LoreData
): Promise<ValidationIssue | null> {
  const winConditions = mechanics.winConditions || [];
  const conflict = lore.conflict;

  if (winConditions.length === 0) {
    return null;
  }

  if (!conflict?.primary) {
    return {
      rule: 'win-conditions-narratively-sound',
      severity: 'warning',
      confidence: 0.80,
      message: 'Win conditions exist but no primary conflict defined in lore',
      suggestion: 'Define the primary conflict that victory should resolve',
      location: {
        mechanics: ['winConditions'],
        lore: ['conflict.primary'],
      },
    };
  }

  // Check if win conditions seem arbitrary (contain "points", "score" without context)
  const arbitraryConditions = winConditions.filter((condition) => {
    const lower = condition.toLowerCase();
    return (
      (lower.includes('point') || lower.includes('score')) &&
      !JSON.stringify(lore).toLowerCase().includes('compet') && // competition/competitive
      !JSON.stringify(lore).toLowerCase().includes('tournament')
    );
  });

  if (arbitraryConditions.length > 0) {
    return {
      rule: 'win-conditions-narratively-sound',
      severity: 'warning',
      confidence: 0.75,
      message: `Win condition(s) seem arbitrary: ${arbitraryConditions.join(', ')}. Should resolve the conflict: ${conflict.primary}`,
      suggestion: `Tie victory to resolving "${conflict.primary}" rather than arbitrary scoring`,
      location: {
        mechanics: ['winConditions'],
        lore: ['conflict'],
      },
    };
  }

  return null;
}

/**
 * Validate progression systems align with narrative arc
 */
export async function validateProgressionExplainsPowerGrowth(
  mechanics: MechanicsData,
  lore: LoreData
): Promise<ValidationIssue | null> {
  const progression = mechanics.progressionSystems;
  const protagonist = lore.protagonist;

  if (!progression) {
    return null;
  }

  if (!protagonist?.motivation && !protagonist?.background) {
    return {
      rule: 'progression-explains-power-growth',
      severity: 'info',
      confidence: 0.70,
      message: 'Progression system exists but protagonist lacks background/motivation to explain growth',
      suggestion: 'Add protagonist background that explains why and how they grow in power',
      location: {
        mechanics: ['progressionSystems'],
        lore: ['protagonist.background', 'protagonist.motivation'],
      },
    };
  }

  return null;
}

/**
 * Validate combat system matches world rules
 */
export async function validateCombatSystemConsistency(
  mechanics: MechanicsData,
  lore: LoreData
): Promise<ValidationIssue | null> {
  const playerActions = mechanics.playerActions || [];
  const worldRules = lore.worldRules;
  const setting = lore.setting;

  // Check for combat actions
  const combatActions = playerActions.filter((action) => {
    const lower = action.toLowerCase();
    return (
      lower.includes('attack') ||
      lower.includes('fight') ||
      lower.includes('combat') ||
      lower.includes('shoot') ||
      lower.includes('weapon')
    );
  });

  if (combatActions.length === 0) {
    return null;
  }

  // Check for anachronisms (e.g., guns in medieval setting)
  const hasGuns = combatActions.some((action) =>
    action.toLowerCase().match(/gun|rifle|pistol|firearm|shoot/)
  );
  const hasMagic = combatActions.some((action) =>
    action.toLowerCase().match(/magic|spell|cast|enchant/)
  );

  const settingText = JSON.stringify(setting).toLowerCase();
  const isMedieval = settingText.includes('medieval') || settingText.includes('fantasy');

  if (hasGuns && isMedieval && !settingText.includes('steampunk')) {
    return {
      rule: 'combat-system-consistency',
      severity: 'error',
      confidence: 0.90,
      message: 'Combat includes guns/firearms but setting is medieval/fantasy',
      suggestion: 'Either remove guns or change setting to steampunk/modern, OR add world rules explaining anachronistic technology',
      location: {
        mechanics: ['playerActions'],
        lore: ['setting', 'worldRules.technology'],
      },
    };
  }

  if (hasMagic && !worldRules?.magic && !settingText.includes('magic')) {
    return {
      rule: 'combat-system-consistency',
      severity: 'warning',
      confidence: 0.85,
      message: 'Combat uses magic but world rules do not explain how magic works',
      suggestion: 'Add world rules defining the magic system',
      location: {
        mechanics: ['playerActions'],
        lore: ['worldRules.magic'],
      },
    };
  }

  return null;
}

/**
 * Validate magic system has defined rules
 */
export async function validateMagicSystemRules(
  mechanics: MechanicsData,
  lore: LoreData
): Promise<ValidationIssue | null> {
  const playerActions = mechanics.playerActions || [];
  const worldRules = lore.worldRules;

  const hasMagicMechanics = playerActions.some((action) =>
    action.toLowerCase().match(/magic|spell|cast|enchant|summon|mystical/)
  );

  if (!hasMagicMechanics) {
    return null; // No magic in game
  }

  if (!worldRules?.magic || worldRules.magic.toLowerCase() === 'none') {
    return {
      rule: 'magic-system-rules',
      severity: 'error',
      confidence: 0.95,
      message: 'Game mechanics include magic but world rules do not define how magic works',
      suggestion: 'Define magic system rules: source of power, limitations, costs, etc.',
      location: {
        mechanics: ['playerActions'],
        lore: ['worldRules.magic'],
      },
    };
  }

  return null;
}

/**
 * Validate technology level matches between mechanics and lore
 */
export async function validateTechnologyLevelMatch(
  mechanics: MechanicsData,
  lore: LoreData
): Promise<ValidationIssue | null> {
  const playerActions = mechanics.playerActions || [];
  const worldRules = lore.worldRules;
  const setting = lore.setting;

  // Detect tech level from actions
  const hasAdvancedTech = playerActions.some((action) =>
    action.toLowerCase().match(/hack|cyber|robot|ai|laser|plasma|digital/)
  );

  const settingText = JSON.stringify(setting).toLowerCase();

  if (hasAdvancedTech && settingText.includes('medieval')) {
    return {
      rule: 'technology-level-match',
      severity: 'error',
      confidence: 0.90,
      message: 'Mechanics use advanced technology (hacking, AI, lasers) but setting is medieval',
      suggestion: 'Change setting to sci-fi/cyberpunk OR remove advanced tech mechanics OR add magitech explanation',
      location: {
        mechanics: ['playerActions'],
        lore: ['setting.worldType', 'worldRules.technology'],
      },
    };
  }

  if (hasAdvancedTech && !worldRules?.technology) {
    return {
      rule: 'technology-level-match',
      severity: 'warning',
      confidence: 0.75,
      message: 'Advanced technology in mechanics but world rules do not explain tech level',
      suggestion: 'Define technology rules and level in worldRules.technology',
      location: {
        mechanics: ['playerActions'],
        lore: ['worldRules.technology'],
      },
    };
  }

  return null;
}

/**
 * Validate death/failure consequences align with lore
 */
export async function validateDeathConsequencesAlign(
  mechanics: MechanicsData,
  lore: LoreData
): Promise<ValidationIssue | null> {
  const failConditions = mechanics.failConditions || [];

  if (failConditions.length === 0) {
    return null;
  }

  const hasRespawn = failConditions.some((condition) =>
    condition.toLowerCase().match(/respawn|revive|continue/)
  );

  const loreText = JSON.stringify(lore).toLowerCase();

  // Check for immersion-breaking respawn without explanation
  if (hasRespawn && !loreText.includes('immortal') && !loreText.includes('clone') && !loreText.includes('simulation')) {
    return {
      rule: 'death-consequences-align',
      severity: 'info',
      confidence: 0.65,
      message: 'Player can respawn but lore does not explain how (immortality, clones, simulation, etc.)',
      suggestion: 'Add lore explanation for respawning OR make death more permanent',
      location: {
        mechanics: ['failConditions'],
        lore: ['worldRules', 'setting'],
      },
    };
  }

  return null;
}

/**
 * Validate multiplayer has narrative justification
 */
export async function validateMultiplayerJustification(
  mechanics: MechanicsData,
  lore: LoreData
): Promise<ValidationIssue | null> {
  const mechanicsText = JSON.stringify(mechanics).toLowerCase();
  const hasMultiplayer = mechanicsText.includes('multiplayer') ||
                        mechanicsText.includes('co-op') ||
                        mechanicsText.includes('pvp') ||
                        mechanicsText.includes('other players');

  if (!hasMultiplayer) {
    return null;
  }

  const loreText = JSON.stringify(lore).toLowerCase();
  const hasJustification = loreText.includes('team') ||
                          loreText.includes('group') ||
                          loreText.includes('party') ||
                          loreText.includes('multiple') ||
                          loreText.includes('companions');

  if (!hasJustification) {
    return {
      rule: 'multiplayer-justification',
      severity: 'info',
      confidence: 0.70,
      message: 'Multiplayer mechanics exist but lore describes solo protagonist',
      suggestion: 'Explain why multiple players exist: team of heroes, parallel dimensions, different timelines, etc.',
      location: {
        mechanics: ['coreLoop'],
        lore: ['protagonist', 'setting'],
      },
    };
  }

  return null;
}

/**
 * Validate economy/currency has worldbuilding explanation
 */
export async function validateEconomyWorldbuilding(
  mechanics: MechanicsData,
  lore: LoreData
): Promise<ValidationIssue | null> {
  const resourceSystems = mechanics.resourceSystems || [];

  const hasCurrency = resourceSystems.some((resource) =>
    resource.name.toLowerCase().match(/gold|coin|credit|money|currency|cash/)
  );

  if (!hasCurrency) {
    return null;
  }

  const loreText = JSON.stringify(lore).toLowerCase();
  const hasEconomyLore = loreText.includes('trade') ||
                        loreText.includes('merchant') ||
                        loreText.includes('economy') ||
                        loreText.includes('market') ||
                        loreText.includes('shop');

  if (!hasEconomyLore) {
    return {
      rule: 'economy-worldbuilding',
      severity: 'info',
      confidence: 0.60,
      message: 'Currency/economy in mechanics but no mention of trade or markets in lore',
      suggestion: 'Add worldbuilding about economy, merchants, or why currency exists',
      location: {
        mechanics: ['resourceSystems'],
        lore: ['setting', 'worldRules'],
      },
    };
  }

  return null;
}
