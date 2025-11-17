/**
 * Technical Feasibility Validation Rules
 * Flag ambitious scope and technical complexity (informational only)
 */

import type { MechanicsData, LoreData, ValidationIssue } from '@gameforge/shared';

/**
 * Estimate complexity and warn if extremely complex
 */
export async function validateComplexityEstimate(
  mechanics: MechanicsData,
  lore: LoreData
): Promise<ValidationIssue | null> {
  const playerActions = mechanics.playerActions || [];
  const resourceSystems = mechanics.resourceSystems || [];
  const progression = mechanics.progressionSystems;

  // Calculate complexity score
  let complexityScore = 0;

  complexityScore += playerActions.length * 2; // Each action adds complexity
  complexityScore += resourceSystems.length * 3; // Resource systems are complex
  if (progression) complexityScore += 5;

  const mechanicsText = JSON.stringify(mechanics).toLowerCase();

  // Additional complexity factors
  if (mechanicsText.includes('multiplayer')) complexityScore += 10;
  if (mechanicsText.includes('procedural')) complexityScore += 8;
  if (mechanicsText.includes('physics')) complexityScore += 7;
  if (mechanicsText.includes('ai')) complexityScore += 6;
  if (mechanicsText.includes('online')) complexityScore += 10;

  // Determine severity based on score
  if (complexityScore > 50) {
    return {
      rule: 'complexity-estimate',
      severity: 'info',
      confidence: 0.75,
      message: `Very high complexity (score: ${complexityScore}). Consider scope reduction for indie dev`,
      suggestion: 'Focus on core mechanics first, add features incrementally in updates',
      location: {
        mechanics: ['coreLoop', 'playerActions', 'progressionSystems'],
      },
    };
  } else if (complexityScore > 30) {
    return {
      rule: 'complexity-estimate',
      severity: 'info',
      confidence: 0.65,
      message: `Moderate-high complexity (score: ${complexityScore}). Feasible but challenging for solo dev`,
      suggestion: 'Plan development phases carefully, prototype core loop first',
      location: {
        mechanics: ['coreLoop'],
      },
    };
  }

  return null;
}

/**
 * Flag performance-heavy systems
 */
export async function validatePerformanceConsiderations(
  mechanics: MechanicsData,
  lore: LoreData
): Promise<ValidationIssue | null> {
  const mechanicsText = JSON.stringify(mechanics).toLowerCase();

  const performanceIntensive: string[] = [];

  if (mechanicsText.includes('thousands') || mechanicsText.includes('hundreds of')) {
    performanceIntensive.push('large entity counts');
  }
  if (mechanicsText.includes('physics') && mechanicsText.includes('destructible')) {
    performanceIntensive.push('destructible physics');
  }
  if (mechanicsText.includes('procedural generation')) {
    performanceIntensive.push('procedural generation');
  }
  if (mechanicsText.includes('massive') || mechanicsText.includes('open world')) {
    performanceIntensive.push('large world size');
  }
  if (mechanicsText.includes('real-time') && mechanicsText.includes('multiplayer')) {
    performanceIntensive.push('real-time multiplayer');
  }

  if (performanceIntensive.length >= 2) {
    return {
      rule: 'performance-considerations',
      severity: 'info',
      confidence: 0.70,
      message: `Multiple performance-intensive features: ${performanceIntensive.join(', ')}`,
      suggestion: 'Consider optimization strategies: LOD, culling, instancing, simplified physics, etc.',
      location: {
        mechanics: ['coreLoop', 'playerActions'],
      },
    };
  }

  return null;
}

/**
 * Reality check on scope for indie development
 */
export async function validateScopeRealityCheck(
  mechanics: MechanicsData,
  lore: LoreData,
  genre?: string
): Promise<ValidationIssue | null> {
  const playerActions = mechanics.playerActions || [];
  const mechanicsText = JSON.stringify(mechanics).toLowerCase();
  const loreText = JSON.stringify(lore).toLowerCase();

  const ambitiousFeatures: string[] = [];

  // Check for AAA-scale features
  if (mechanicsText.includes('mmo') || mechanicsText.includes('massively multiplayer')) {
    ambitiousFeatures.push('MMO (requires server infrastructure, anti-cheat, matchmaking)');
  }
  if (mechanicsText.includes('battle royale')) {
    ambitiousFeatures.push('Battle Royale (100+ players, complex netcode)');
  }
  if (mechanicsText.includes('voice chat')) {
    ambitiousFeatures.push('Voice chat (requires VOIP integration)');
  }
  if (mechanicsText.includes('photo realistic') || mechanicsText.includes('photorealistic')) {
    ambitiousFeatures.push('Photorealistic graphics (asset-intensive)');
  }
  if (loreText.includes('cinematic') && mechanicsText.includes('cutscene')) {
    ambitiousFeatures.push('Cinematic cutscenes (animation, voice acting)');
  }
  if (playerActions.length > 20) {
    ambitiousFeatures.push(`${playerActions.length} player actions (complex controls)`);
  }

  // Check for unrealistic combinations
  if (genre === 'rpg' && mechanicsText.includes('open world') && mechanicsText.includes('multiplayer')) {
    ambitiousFeatures.push('Open-world multiplayer RPG (AAA-scale project)');
  }

  if (ambitiousFeatures.length >= 2) {
    return {
      rule: 'scope-reality-check',
      severity: 'warning',
      confidence: 0.80,
      message: `Ambitious scope detected: ${ambitiousFeatures.join('; ')}`,
      suggestion: 'Consider starting with simplified version (vertical slice) and expanding if successful',
      location: {
        mechanics: ['coreLoop', 'playerActions'],
        lore: ['setting'],
      },
    };
  } else if (ambitiousFeatures.length === 1) {
    return {
      rule: 'scope-reality-check',
      severity: 'info',
      confidence: 0.70,
      message: `Ambitious feature: ${ambitiousFeatures[0]}`,
      suggestion: 'Ensure you have resources/team for this feature, or start simpler',
      location: {
        mechanics: ['coreLoop'],
      },
    };
  }

  return null;
}
