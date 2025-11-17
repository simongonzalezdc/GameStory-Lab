/**
 * Prompts for AI mechanics generation
 * Guides the AI to create coherent, genre-appropriate game mechanics
 */

import type { Genre, LoreData } from '@gameforge/shared';

export function getMechanicsPrompt(genre?: Genre, lore?: LoreData, userPrompt?: string): string {
  const genreGuidance = getGenreGuidance(genre);
  const loreContext = lore ? getLoreContext(lore) : '';

  return `You are an expert game designer specializing in creating balanced, engaging game mechanics.

${genreGuidance}

${loreContext}

${userPrompt ? `User's concept: ${userPrompt}\n\n` : ''}

Generate game mechanics in the following JSON structure:

{
  "coreLoop": "Brief description of the main gameplay loop (what the player does repeatedly)",
  "playerActions": ["list", "of", "specific", "actions", "player", "can", "perform"],
  "progressionSystems": {
    "type": "linear" | "branching" | "open",
    "mechanics": ["how players advance/improve"]
  },
  "winConditions": ["ways to achieve victory"],
  "failConditions": ["ways to lose or game over"],
  "resourceSystems": [
    {
      "name": "resource name",
      "mechanics": "how it works",
      "scarcity": "abundant" | "balanced" | "scarce"
    }
  ]
}

IMPORTANT RULES:
1. Mechanics must be internally consistent (no contradictions)
2. All player actions must be achievable with the resources/systems provided
3. Win conditions must be clear and measurable
4. Progression should feel rewarding and paced appropriately
5. If lore is provided, ensure mechanics align with the world's rules (e.g., no magic mechanics in a realistic setting)
6. Keep mechanics focused - avoid feature creep
7. Consider player skill ceiling and learning curve

Output ONLY valid JSON, no markdown formatting.`;
}

function getGenreGuidance(genre?: Genre): string {
  if (!genre || genre === 'blank') {
    return 'Genre: Not specified - create innovative mechanics that could define a new genre.';
  }

  const guidance: Record<Genre, string> = {
    rpg: `Genre: RPG (Role-Playing Game)
Expected mechanics: Character progression (leveling, skills, attributes), equipment/inventory system, quest structure, combat system (turn-based or real-time), dialogue/choice systems, exploration mechanics.
Key principles: Player growth should be tangible, choices should matter, world should react to player actions.`,

    fps: `Genre: FPS (First-Person Shooter)
Expected mechanics: Weapon systems, aiming/shooting mechanics, movement (running, crouching, jumping), health/armor, ammunition management, enemy AI patterns, level navigation.
Key principles: Tight, responsive controls, balanced weapons, clear feedback on hits, strategic positioning.`,

    strategy: `Genre: Strategy
Expected mechanics: Resource gathering/management, unit production, tech trees/upgrades, tactical positioning, fog of war, victory conditions (domination, score, objectives).
Key principles: Meaningful strategic decisions, risk/reward trade-offs, multiple viable strategies, balanced unit types.`,

    puzzle: `Genre: Puzzle
Expected mechanics: Core puzzle mechanic (matching, physics, logic), difficulty progression, hint system, move/time limits (optional), combo/scoring system.
Key principles: Clear rules that emerge into complex possibilities, gradual learning curve, satisfying "aha!" moments.`,

    survival: `Genre: Survival
Expected mechanics: Resource scarcity (food, water, materials), crafting system, environmental hazards, day/night cycles, health/status effects, base building (optional), permadeath or consequences.
Key principles: Constant tension between safety and progress, meaningful resource decisions, emergent problem-solving.`,

    blank: '',
  };

  return guidance[genre] || '';
}

function getLoreContext(lore: LoreData): string {
  let context = 'LORE CONTEXT (mechanics must align with this):\n';

  if (lore.setting) {
    context += `Setting: ${lore.setting.era || ''} ${lore.setting.worldType || ''} in ${lore.setting.location || 'unspecified location'}\n`;
  }

  if (lore.protagonist) {
    context += `Protagonist: ${lore.protagonist.background || 'unspecified background'}\n`;
    if (lore.protagonist.abilities && lore.protagonist.abilities.length > 0) {
      context += `Character abilities: ${lore.protagonist.abilities.join(', ')}\n`;
    }
  }

  if (lore.worldRules) {
    if (lore.worldRules.physics) {
      context += `Physics: ${lore.worldRules.physics}\n`;
    }
    if (lore.worldRules.magic) {
      context += `Magic: ${lore.worldRules.magic}\n`;
    }
    if (lore.worldRules.technology) {
      context += `Technology: ${lore.worldRules.technology}\n`;
    }
  }

  return context;
}
