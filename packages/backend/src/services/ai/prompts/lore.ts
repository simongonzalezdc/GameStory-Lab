/**
 * Prompts for AI lore generation
 * Guides the AI to create rich, coherent game narratives and worldbuilding
 */

import type { Genre, MechanicsData } from '@gameforge/shared';

export function getLorePrompt(genre?: Genre, mechanics?: MechanicsData, userPrompt?: string): string {
  const genreGuidance = getGenreGuidance(genre);
  const mechanicsContext = mechanics ? getMechanicsContext(mechanics) : '';

  return `You are an expert narrative designer and worldbuilder specializing in video game storytelling.

${genreGuidance}

${mechanicsContext}

${userPrompt ? `User's concept: ${userPrompt}\n\n` : ''}

Generate game lore and narrative in the following JSON structure:

{
  "setting": {
    "era": "time period or age",
    "location": "where the game takes place",
    "worldType": "genre/type of world (sci-fi, fantasy, realistic, etc.)"
  },
  "protagonist": {
    "background": "character's history and current situation",
    "motivation": "why they're undertaking this journey/quest",
    "abilities": ["list", "of", "special", "abilities", "or", "skills"]
  },
  "conflict": {
    "primary": "main antagonist or central problem",
    "secondary": ["additional challenges", "subplots", "faction conflicts"]
  },
  "worldRules": {
    "physics": "how the physical world works",
    "magic": "if applicable, how magic/supernatural elements function",
    "technology": "tech level and key technologies"
  },
  "themes": ["central themes", "explored in", "the narrative"]
}

IMPORTANT RULES:
1. Lore must be internally consistent (no contradictions)
2. Protagonist's abilities must justify the gameplay actions (if mechanics provided)
3. Conflict must be compelling and resolvable through gameplay
4. World rules must explain why mechanics work the way they do
5. Setting should be vivid but leave room for player discovery
6. Motivation should emotionally engage players
7. Themes should be woven into gameplay, not just told

Output ONLY valid JSON, no markdown formatting.`;
}

function getGenreGuidance(genre?: Genre): string {
  if (!genre || genre === 'blank') {
    return 'Genre: Not specified - create original, compelling lore that could define a new experience.';
  }

  const guidance: Record<Genre, string> = {
    rpg: `Genre: RPG (Role-Playing Game)
Expected lore elements: Rich world history, multiple factions/cultures, deep protagonist backstory, character-driven narrative, meaningful choices, lore that explains why the player grows in power.
Tone: Epic, personal growth, hero's journey or subversion thereof.`,

    fps: `Genre: FPS (First-Person Shooter)
Expected lore elements: Military/conflict context, clear enemy motivation, soldier/operative protagonist, mission-driven narrative, wartime/combat setting.
Tone: Intense, action-focused, but with human stakes. Lore should justify constant combat.`,

    strategy: `Genre: Strategy
Expected lore elements: Factional conflict, leaders/commanders as protagonists, political intrigue, resource scarcity reasons, historical context for war/competition.
Tone: Grand scale, tactical thinking, consequences of decisions. Lore explains why factions fight.`,

    puzzle: `Genre: Puzzle
Expected lore elements: Mystery to unravel, reason for puzzles (ancient civilization, training, test), curious protagonist, secrets to discover.
Tone: Thoughtful, mysterious, discovery-focused. Lore makes puzzles feel purposeful, not arbitrary.`,

    survival: `Genre: Survival
Expected lore elements: Catastrophe or harsh environment, desperate circumstances, isolation or small group dynamics, hostile world explanation.
Tone: Tense, atmospheric, struggle against nature/disaster. Lore justifies why resources are scarce and threats constant.`,

    blank: '',
  };

  return guidance[genre] || '';
}

function getMechanicsContext(mechanics: MechanicsData): string {
  let context = 'MECHANICS CONTEXT (lore must justify these gameplay elements):\n';

  if (mechanics.coreLoop) {
    context += `Core gameplay loop: ${mechanics.coreLoop}\n`;
  }

  if (mechanics.playerActions && mechanics.playerActions.length > 0) {
    context += `Player can perform: ${mechanics.playerActions.join(', ')}\n`;
    context += 'IMPORTANT: Protagonist must have abilities/background that justify these actions.\n';
  }

  if (mechanics.progressionSystems) {
    context += `Progression: ${mechanics.progressionSystems.type} - ${mechanics.progressionSystems.mechanics.join(', ')}\n`;
    context += 'IMPORTANT: Lore must explain WHY and HOW the character grows in power.\n';
  }

  if (mechanics.resourceSystems && mechanics.resourceSystems.length > 0) {
    context += `Resources: ${mechanics.resourceSystems.map((r) => r.name).join(', ')}\n`;
    context += 'IMPORTANT: World rules must explain what these resources are and why they matter.\n';
  }

  if (mechanics.winConditions && mechanics.winConditions.length > 0) {
    context += `Victory achieved by: ${mechanics.winConditions.join(', ')}\n`;
    context += 'IMPORTANT: Conflict and motivation must align with these victory conditions.\n';
  }

  return context;
}
