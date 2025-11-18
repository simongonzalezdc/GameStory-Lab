/**
 * Prompts for AI mechanics generation
 * Guides the AI to create coherent, genre-appropriate game mechanics
 */

import type { Genre, LoreData } from '@gameforge/shared';

export function getMechanicsPrompt(genre?: Genre, lore?: LoreData, userPrompt?: string): string {
  const genreGuidance = getGenreGuidance(genre);
  const loreContext = lore ? getLoreContext(lore) : '';

  return `You are an expert game designer with 20+ years of experience creating balanced, engaging game mechanics for AAA titles and innovative indie games. Your designs are known for emergent gameplay, tight feedback loops, and player agency.

${genreGuidance}

${loreContext}

${userPrompt ? `User's Creative Vision: ${userPrompt}\n\n` : ''}

CRITICAL TASK: Generate game mechanics following the EXACT JSON structure below. Do NOT include any reasoning, explanations, thinking process, markdown code blocks, or commentary. Output ONLY raw JSON.

REQUIRED JSON STRUCTURE (must match exactly):
{
  "coreLoop": "A concise 1-2 sentence description of the main gameplay loop - what players do repeatedly every 30-120 seconds",
  "playerActions": [
    "action1: Brief description of specific action player can perform",
    "action2: Another specific, granular action with clear input/output",
    "action3: Focus on verbs - run, jump, craft, attack, persuade, build, etc."
  ],
  "progressionSystems": {
    "type": "linear OR branching OR open",
    "mechanics": [
      "Specific mechanic 1: How players advance (XP, skill trees, unlocks, etc.)",
      "Specific mechanic 2: Tangible rewards for progression (new abilities, areas, etc.)",
      "Specific mechanic 3: Pacing mechanism (challenges scale with player power)"
    ]
  },
  "winConditions": [
    "Primary victory condition with clear measurable criteria",
    "Alternative victory path (if applicable)",
    "Optional: Score/rank thresholds for grades (S/A/B/C)"
  ],
  "failConditions": [
    "Primary lose condition with clear triggers",
    "Secondary fail states (if applicable)",
    "Consequence of failure (restart level, lose resources, permadeath, etc.)"
  ],
  "resourceSystems": [
    {
      "name": "Resource Name (e.g., Health, Mana, Credits, Ammunition)",
      "mechanics": "How resource is gained, spent, and regenerated - be specific about numbers/rates",
      "scarcity": "abundant OR balanced OR scarce"
    }
  ]
}

DESIGN PRINCIPLES (must follow):
1. **Internal Consistency**: Every mechanic must logically support others - no contradictions
2. **Achievability**: All playerActions must be possible using the resources/systems defined
3. **Clarity**: Win/fail conditions must be unambiguous and measurable (use numbers/thresholds)
4. **Pacing**: Progression should create a satisfying difficulty curve with clear milestones
5. **Lore Alignment**: If lore is provided above, mechanics MUST respect world rules (e.g., no magic in realistic settings, tech level matches era)
6. **Focus**: 5-8 core actions > 20 shallow ones. Depth over breadth
7. **Skill Expression**: Include mechanics that reward mastery and player creativity
8. **Feedback Loops**: Ensure actions have clear, immediate consequences players can see/feel

STRICT OUTPUT REQUIREMENTS:
- Output ONLY the JSON object - start with { and end with }
- NO markdown code fences (\`\`\`json)
- NO explanatory text before or after the JSON
- NO chain-of-thought reasoning
- NO <think> tags or reasoning blocks
- NO comments within the JSON
- Ensure all strings use double quotes, not single quotes
- Ensure proper JSON syntax (commas, brackets, valid types)

BEGIN JSON OUTPUT NOW:`;
}

function getGenreGuidance(genre?: Genre): string {
  if (!genre || genre === 'blank') {
    return `Genre: Not Specified - Design Innovative Mechanics
Create genre-defining mechanics that blend familiar elements in novel ways. Think Portal's portal gun, Braid's time manipulation, or Hades' boon system. Focus on a single core mechanic with deep possibilities.`;
  }

  const guidance: Record<Genre, string> = {
    rpg: `Genre: RPG (Role-Playing Game)
CORE MECHANICS REQUIRED:
- Character Progression: Leveling system (XP thresholds), skill trees (branching choices), attribute allocation (STR/DEX/INT/etc.)
- Equipment/Inventory: Gear slots, stat modifiers, rarity tiers, weight limits
- Combat System: Turn-based (action economy, initiative) OR real-time (combos, dodge windows, resource management)
- Quest Structure: Main story progression + side quests with branching outcomes
- Dialogue/Choice: Conversation trees affecting reputation, story branches, or character relationships
- Exploration: Dungeon design, fast travel, area unlocks tied to progression

DESIGN PILLARS:
- Player growth must be tangible (damage numbers increase, new areas accessible, visible power fantasy)
- Choices must have mechanical consequences (build variety, story branches, faction reputation)
- World reactivity (NPCs remember actions, environments change based on player decisions)
- Risk/reward balance (harder encounters = better loot, exploration = secrets)

INSPIRATION: The Witcher 3 (consequences), Dark Souls (fair difficulty), Divinity: Original Sin (systemic interactions)`,

    fps: `Genre: FPS (First-Person Shooter)
CORE MECHANICS REQUIRED:
- Weapon Systems: 5-8 distinct weapons with different roles (assault rifle, sniper, shotgun), reload mechanics, weapon switching
- Aiming/Shooting: Hipfire vs ADS accuracy, recoil patterns, headshot multipliers (1.5-2x damage)
- Movement: Sprint (consume stamina?), slide, crouch (stealth/accuracy bonus), jump, climbing/vaulting
- Health/Armor: Regenerating (CoD-style) vs medkit-based (Half-Life), armor absorption rates
- Ammunition: Scarcity level, shared vs unique ammo types, ammo pickups vs drops
- Enemy AI: Cover usage, flanking behavior, aggro systems, varied enemy types
- Level Design: Vertical spaces, choke points, flank routes, sight lines

DESIGN PILLARS:
- Tight, responsive controls (input lag < 50ms, 60+ FPS target)
- Weapon balance (no single dominant weapon, situational advantages)
- Clear feedback (hit markers, damage numbers, visual/audio cues for headshots)
- Strategic positioning (cover matters, high ground advantage, movement prediction)
- Player agency (multiple approach vectors, stealth vs assault options)

INSPIRATION: DOOM Eternal (weapon switching), Titanfall 2 (movement flow), Halo (weapon sandbox)`,

    strategy: `Genre: Strategy (RTS/Turn-Based/4X)
CORE MECHANICS REQUIRED:
- Resource Management: 2-4 core resources (gold, wood, food, research points), gathering mechanics, spending sinks
- Unit Production: Build queues, unit costs, population caps, production buildings
- Tech Trees/Upgrades: Era progression, research requirements, unit/building upgrades, strategic choices (military vs economy)
- Tactical Positioning: Terrain bonuses (high ground +1 defense), unit formations, flanking mechanics
- Fog of War: Vision radius, scouting units, map reveal mechanics
- Victory Conditions: Military (eliminate enemies), Economic (control 70% resources), Scientific (complete tech tree), Diplomatic (alliances)

DESIGN PILLARS:
- Meaningful strategic decisions (every choice has opportunity cost)
- Risk/reward trade-offs (aggressive expansion vs defensive buildup)
- Multiple viable strategies (no single dominant meta)
- Unit diversity with rock-paper-scissors counters (infantry < cavalry < archers < infantry)
- Information asymmetry (scouting, spies, incomplete map knowledge)
- Skill scaling (easy to learn basics, high skill ceiling for optimization)

INSPIRATION: StarCraft II (unit micro + macro balance), Civilization VI (asymmetric factions), Into the Breach (perfect information puzzles)`,

    puzzle: `Genre: Puzzle
CORE MECHANICS REQUIRED:
- Core Puzzle Mechanic: ONE central mechanic (match-3, physics manipulation, logic gates, perspective shifting, time control)
- Rule System: 3-5 simple rules that combine into complex emergent solutions
- Difficulty Progression: Tutorial levels → intermediate challenges → mastery tests, introduce 1 new element per 3-5 levels
- Hint System: Progressive hints (vague → specific → solution), optional cost (time penalty, limited hints)
- Move/Time Limits: Optional pressure mechanic (par times for ranking, move count for stars)
- Scoring: Points for efficiency (fewer moves = higher score), combo multipliers, bonus objectives

DESIGN PILLARS:
- Clear, intuitive rules that players grasp in < 30 seconds
- Emergent complexity (simple rules → deep possibilities, like Chess or Go)
- Gradual learning curve (introduce 1 mechanic at a time, build on previous knowledge)
- "Aha!" moments (insight-driven solutions, not trial-and-error brute force)
- Optional challenge (par times for skilled players, accessibility for casual)
- Visual clarity (puzzle state always readable at a glance)

INSPIRATION: Portal (spatial reasoning), The Witness (perspective + pattern recognition), Baba Is You (rule manipulation), Stephen's Sausage Roll (sokoban++)`,

    survival: `Genre: Survival
CORE MECHANICS REQUIRED:
- Resource Scarcity: Food (hunger meter, 100 → 0 over 20 minutes), water (thirst meter), materials (wood, stone, metal for crafting)
- Crafting System: Tiered recipes (wood tools → stone → iron → steel), resource gathering → processing → crafting
- Environmental Hazards: Temperature (hypothermia/heatstroke), radiation, toxic zones, fall damage, wildlife
- Day/Night Cycles: 10 min day / 5 min night, visibility reduction at night, hostile creatures spawn at night
- Health/Status Effects: HP, hunger, thirst, temperature, infections, injuries requiring treatment
- Base Building: Shelter construction, storage, defensive structures (walls, traps), safe zones
- Permadeath/Consequences: Hardcore mode (1 life) vs softcore (respawn with item loss)

DESIGN PILLARS:
- Constant tension between safety (stay in base) vs progress (explore for resources)
- Meaningful resource decisions (eat now vs save for later, use materials for tools vs shelter)
- Emergent problem-solving (players create own survival strategies)
- Risk escalation (venture further → better loot but higher danger)
- Player mastery (experienced players thrive where newbies struggled)
- Fair but brutal (deaths feel like learning experiences, not RNG frustration)

INSPIRATION: Don't Starve (resource loops + permadeath), Subnautica (exploration + base building), The Long Dark (atmospheric survival)`,

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
