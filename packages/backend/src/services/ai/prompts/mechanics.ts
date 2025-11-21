/**
 * Prompts for AI mechanics generation
 * Guides AI to create coherent, genre-appropriate game mechanics
 * Optimized for Minimax M2's advanced reasoning and creative capabilities
 * Uses unified prompt template for consistent structured output
 */

import type { Genre, LoreData } from '@gameforge/shared';
import { buildUnifiedPrompt, getMinimaxOptimizationInstructions } from './unified-template.js';

export function getMechanicsPrompt(genre?: Genre, lore?: LoreData, userPrompt?: string): string {
  const genreGuidance = getGenreGuidance(genre);
  const loreContext = lore ? getLoreContext(lore) : '';

  const context = `${genreGuidance}\n\n${loreContext}\n\n${userPrompt ? `User's Creative Vision: ${userPrompt}` : ''}`;

  const jsonSchema = `{
  "coreLoop": "A concise 1-2 sentence description of main gameplay loop - what players do repeatedly every 30-120 seconds",
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
}`;

  const additionalInstructions = `DESIGN PRINCIPLES (must follow):
1. **Internal Consistency**: Every mechanic must logically support others - no contradictions
2. **Achievability**: All playerActions must be possible using resources/systems defined
3. **Clarity**: Win/fail conditions must be unambiguous and measurable (use numbers/thresholds)
4. **Pacing**: Progression should create a satisfying difficulty curve with clear milestones
5. **Lore Alignment**: If lore is provided above, mechanics MUST respect world rules (e.g., no magic in realistic settings, tech level matches era)
6. **Focus**: 5-8 core actions > 20 shallow ones. Depth over breadth
7. **Skill Expression**: Include mechanics that reward mastery and player creativity
8. **Feedback Loops**: Ensure actions have clear, immediate consequences players can see/feel

${getMinimaxOptimizationInstructions('mechanics')}`;

  return buildUnifiedPrompt({
    taskType: 'mechanics',
    roleDescription: `You are an expert game designer with 20+ years of experience creating balanced, engaging game mechanics for AAA titles and innovative indie games. Your designs are known for emergent gameplay, tight feedback loops, and player agency.`,
    taskDescription: `CRITICAL TASK: Generate game mechanics following the EXACT JSON structure below. Use your full reasoning capabilities to create innovative, well-designed mechanics.`,
    context,
    jsonSchema,
    additionalInstructions,
  });
}

function getGenreGuidance(genre?: Genre): string {
  if (!genre || genre === 'blank') {
    return `Genre: Not Specified - Design Innovative Mechanics
Create genre-defining mechanics that blend familiar elements in novel ways. Think Portal's portal gun, Braid's time manipulation, or Hades' boon system. Focus on a single core mechanic with deep possibilities.

MINIMAX M2 INNOVATION FOCUS: Your advanced reasoning can identify unique mechanic combinations that human designers might miss. Consider cross-genre mechanics that create entirely new gameplay paradigms.`;
  }

  const guidance: Partial<Record<Genre, string>> = {
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

MINIMAX M2 RPG OPTIMIZATION: Design progression systems with mathematical elegance. Use your analytical capabilities to create balanced stat curves, meaningful choice trees, and emergent build variety. Consider how systems interact to create unique character builds.`,

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

MINIMAX M2 FPS OPTIMIZATION: Apply your physics and ballistics knowledge to create realistic weapon behavior. Design movement systems with precise mathematical relationships between speed, momentum, and player input. Consider network optimization for multiplayer scenarios.`,

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

MINIMAX M2 STRATEGY OPTIMIZATION: Design complex systems with emergent strategic depth. Use your analytical capabilities to create balanced unit relationships, economic models, and progression curves. Consider AI pathfinding, computational complexity, and multiplayer balance.`,

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

MINIMAX M2 PUZZLE OPTIMIZATION: Leverage your pattern recognition and logical reasoning to create elegant puzzle designs. Consider computational complexity, solution space analysis, and player cognitive load. Design mechanics that scale from simple to profoundly complex within the same rule set.`,

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

MINIMAX M2 SURVIVAL OPTIMIZATION: Design interconnected systems where every resource and mechanic affects others. Use your analytical capabilities to create balanced scarcity curves, realistic crafting progression, and meaningful survival challenges. Consider player psychology and emergent gameplay patterns.`,

    blank: '',
    'action-adventure': `Genre: Action-Adventure
CORE MECHANICS REQUIRED:
- Exploration-Driven Story: World opens up as player progresses, story revealed through exploration
- Protagonist Journey: Character growth through adventure, discovery, and overcoming challenges
- Balanced Action/Narrative: Combat and exploration serve the story, not just gameplay
- World-Building: Rich environments that tell stories through design and atmosphere

MINIMAX M2 ACTION-ADVENTURE OPTIMIZATION: Create seamless integration between narrative moments and gameplay mechanics. Design exploration systems that reward curiosity while maintaining story progression. Use your reasoning to balance spectacle with player agency.`,

    adventure: `Genre: Adventure
CORE MECHANICS REQUIRED:
- Story-First Design: Narrative drives gameplay, not reverse
- Character Development: Deep character arcs and relationships
- Mystery/Discovery: Unraveling mysteries through exploration and dialogue
- Emotional Engagement: Focus on emotional storytelling and player connection

MINIMAX M2 ADVENTURE OPTIMIZATION: Design dialogue systems and narrative mechanics that create meaningful player choices. Use your advanced reasoning to create branching stories with emotional depth and character development that responds to player actions.`,

    'battle-royale': `Genre: Battle Royale
CORE MECHANICS REQUIRED:
- Competitive Arena: Lore explains why players compete in this format
- Survival Context: Last-person-standing scenario with narrative justification
- World Setting: Arena or battleground with history and purpose
- Character Motivation: Why participants join and what they're fighting for

MINIMAX M2 BATTLE ROYALE OPTIMIZATION: Design shrinking play zones with mathematical precision. Create loot distribution systems that balance randomness with strategic placement. Use your analytical capabilities to ensure fair matchmaking and balanced gameplay mechanics.`,

    sports: `Genre: Sports
CORE MECHANICS REQUIRED:
- Competitive Context: League, tournament, or championship structure
- Team/Player Identity: Character development through sports achievements
- Rivalries: Established rivalries and relationships
- World Integration: How sports fit into larger world

MINIMAX M2 SPORTS OPTIMIZATION: Design physics-based mechanics that accurately simulate the sport. Use your analytical capabilities to create balanced team dynamics, progression systems, and competitive mechanics that reward skill and strategy.`,

    fighting: `Genre: Fighting
CORE MECHANICS REQUIRED:
- Tournament Structure: Fighting tournament with stakes and history
- Character Roster: Diverse fighters with unique backgrounds and motivations
- World Setting: Arena or fighting world with its own culture
- Personal Stakes: What each fighter is fighting for

MINIMAX M2 FIGHTING OPTIMIZATION: Design combat systems with frame-perfect precision. Create move sets with mathematical balance, combo systems with depth, and defensive mechanics that require skill. Use your reasoning to ensure character variety while maintaining competitive balance.`,

    platformer: `Genre: Platformer
CORE MECHANICS REQUIRED:
- Movement-Focused Story: Narrative that emphasizes traversal and exploration
- World Design: Levels that tell stories through design
- Character Journey: Protagonist's journey through challenging environments
- Environmental Storytelling: Story told through level design and atmosphere

MINIMAX M2 PLATFORMER OPTIMIZATION: Design movement mechanics with precise physics and responsive controls. Create level layouts that teach mechanics through design. Use your analytical capabilities to ensure difficulty progression feels natural and rewards mastery.`,

    horror: `Genre: Horror
CORE MECHANICS REQUIRED:
- Atmospheric Tension: World designed to create fear and unease
- Threat Context: What is horror and why does it exist
- Survival Stakes: What happens if protagonist fails
- Psychological Elements: Fear through atmosphere, not just jump scares

MINIMAX M2 HORROR OPTIMIZATION: Design mechanics that create psychological tension through player vulnerability. Use your reasoning to balance threat levels with player agency. Create systems where player imagination is more frightening than explicit dangers.`,

    roguelike: `Genre: Roguelike
CORE MECHANICS REQUIRED:
- Death/Loop Mechanic: Lore explanation for permadeath and restart mechanics
- Procedural Narrative: Story elements that work with randomized content
- Progression Through Failure: How death leads to knowledge and growth
- World Structure: Why world resets or changes

MINIMAX M2 ROGUELIKE OPTIMIZATION: Design procedural generation systems that create meaningful variety. Use your analytical capabilities to ensure run-based progression feels rewarding rather than punitive. Create item and ability synergies that enable creative problem-solving.`,

    simulation: `Genre: Simulation
CORE MECHANICS REQUIRED:
- System-Driven Story: Narrative emerges from simulation systems
- World Context: What is being simulated and why
- Player Agency: How player choices affect simulation
- Realistic Context: Grounded in real-world or established world rules

MINIMAX M2 SIMULATION OPTIMIZATION: Design complex interconnected systems with emergent behavior. Use your reasoning to create realistic economic models, social dynamics, or physical simulations. Balance complexity with accessibility and player understanding.`,

    racing: `Genre: Racing
CORE MECHANICS REQUIRED:
- Racing Context: League, tournament, or street racing scene
- Vehicle Culture: World where vehicles and racing are central
- Competition Stakes: What racers compete for
- Character Identity: Racer background and motivation

MINIMAX M2 RACING OPTIMIZATION: Design physics-based racing mechanics with realistic vehicle behavior. Create track layouts that reward skill and strategy. Use your analytical capabilities to balance vehicle types, progression systems, and competitive mechanics.`,
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
