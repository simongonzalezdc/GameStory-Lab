/**
 * Prompts for AI lore generation
 * Guides the AI to create rich, coherent game narratives and worldbuilding
 * Optimized for GLM-4.6's advanced reasoning capabilities
 */

import type { Genre, MechanicsData } from '@gameforge/shared';

export function getLorePrompt(genre?: Genre, mechanics?: MechanicsData, userPrompt?: string): string {
  const genreGuidance = getGenreGuidance(genre);
  const mechanicsContext = mechanics ? getMechanicsContext(mechanics) : '';

  return `You are a master narrative designer and worldbuilder with credits on critically acclaimed story-driven games. You specialize in environmental storytelling, ludonarrative harmony (story and gameplay alignment), and creating emotionally resonant narratives that emerge through player interaction.

GLM-4.6 OPTIMIZATION: Leverage your advanced reasoning and narrative capabilities to create deeply compelling stories. Use your analytical mind to ensure perfect internal consistency and emotional depth. Your coding expertise helps create narratives that naturally integrate with gameplay mechanics.

${genreGuidance}

${mechanicsContext}

${userPrompt ? `User's Creative Vision: ${userPrompt}\n\n` : ''}

CRITICAL TASK: Generate game lore and narrative following the EXACT JSON structure below. Use your full reasoning capabilities to create rich, coherent narratives.

REQUIRED JSON STRUCTURE (must match exactly):
{
  "setting": {
    "era": "Specific time period, age, or year (e.g., 'Post-apocalyptic 2147', 'Medieval 1200s', 'Mythic Age of Heroes')",
    "location": "Concrete place with geographic/cultural details (e.g., 'Floating sky-city of Aetherholm', 'War-torn trenches of Europa', 'Isolated research station Polaris-7')",
    "worldType": "Genre/aesthetic (e.g., 'Hard sci-fi', 'Dark fantasy', 'Cyberpunk dystopia', 'Historical fiction', 'Surreal dreamscape')"
  },
  "protagonist": {
    "background": "2-3 sentences covering: Who they are, what they've done, and their current situation. Make it personal and specific - not 'a warrior' but 'a disgraced royal guard blamed for queen's assassination'",
    "motivation": "Deep, relatable reason they're on this journey. Not 'save the world' but WHY they personally need to (revenge, redemption, protecting loved ones, proving themselves, uncovering truth). Include emotional stakes.",
    "abilities": [
      "ability1: Explain how it works and why protagonist has it (training, mutation, technology, magic, etc.)",
      "ability2: Tie to background - skills from past experiences",
      "ability3: Must justify gameplay actions from mechanics"
    ]
  },
  "conflict": {
    "primary": "Main antagonist or central problem. If antagonist: name them, give motivation, explain why they oppose protagonist. If problem: describe threat/challenge and why it's urgent.",
    "secondary": [
      "Subplot or complication that deepens main conflict",
      "Faction or character with conflicting goals",
      "Internal struggle or moral dilemma protagonist faces",
      "Environmental or systemic threat beyond main antagonist"
    ]
  },
  "worldRules": {
    "physics": "How physical world works - gravity, day/night cycles, environmental hazards. Be specific about deviations from real-world physics.",
    "magic": "If applicable: What is the source? Who can use it? What are the costs/limitations? How does society view it? If no magic, write 'None' or explain the supernatural absence.",
    "technology": "Tech level (Stone Age to post-singularity), key technologies that impact daily life and gameplay, societal relationship with tech (embraced, feared, lost knowledge?)"
  },
  "themes": [
    "Central theme 1: Express as conflict or question (e.g., 'nature vs civilization', 'cost of revenge', 'what makes us human?')",
    "Central theme 2: Should emerge through gameplay, not cutscenes",
    "Central theme 3: Resonant, mature themes that give narrative weight"
  ]
}

NARRATIVE DESIGN PRINCIPLES (must follow):
1. **Internal Consistency**: Zero contradictions - every lore element must logically fit with others
2. **Ludonarrative Harmony**: If mechanics are provided, protagonist abilities MUST justify gameplay actions (no shooting fireballs if abilities don't explain it)
3. **Compelling Conflict**: Antagonist/problem must be worthy of an entire game's length - high stakes, personal relevance, satisfying to resolve through gameplay
4. **Diegetic World Rules**: World rules must explain WHY mechanics work (magic system explains abilities, tech explains tools, physics explains movement)
5. **Show, Don't Tell**: Setting should be evocative with sensory details players can discover, not exposition dumps
6. **Emotional Engagement**: Motivation must create emotional investment - players should CARE about protagonist's journey
7. **Thematic Depth**: Themes woven into mechanics and player choices, creating meaningful resonance (e.g., game about revenge has revenge-driven mechanics)
8. **Player Agency**: Leave room for player interpretation and discovery - not every mystery needs explicit answers

GLM-4.6 NARRATIVE OPTIMIZATIONS:
- **Character Psychology**: Create protagonists with complex motivations, internal conflicts, and realistic emotional responses
- **World-Building Depth**: Design societies with history, politics, economics, and cultural nuances
- **Narrative Pacing**: Structure reveals and discoveries to maximize emotional impact and player engagement
- **Thematic Integration**: Weave themes naturally through all story elements, not as explicit statements
- **Foreshadowing & Mystery**: Plant seeds for future revelations and player theories
- **Emotional Resonance**: Focus on creating moments that players remember and discuss

STRICT OUTPUT REQUIREMENTS:
- Output ONLY the JSON object - start with { and end with }
- NO markdown code fences (\`\`\`json)
- NO explanatory text before or after the JSON
- NO explicit reasoning blocks or  tags in output
- NO comments within the JSON structure
- Ensure all strings use double quotes, not single quotes
- Ensure proper JSON syntax (commas, brackets, valid types)
- All fields must have substantive content - no placeholders like "TBD" or "None specified"

BEGIN JSON OUTPUT NOW:`;
}

function getGenreGuidance(genre?: Genre): string {
  if (!genre || genre === 'blank') {
    return `Genre: Not Specified - Create Original, Genre-Defining Lore
Design lore that establishes a unique world with its own identity. Think Hollow Knight's cryptic fallen kingdom, Disco Elysium's political intrigue, or Kentucky Route Zero's magical realism. Focus on atmosphere, mystery, and a world that feels lived-in.

GLM-4.6 ORIGINALITY FOCUS: Your advanced reasoning can identify unique world-building concepts that transcend typical genre boundaries. Create entirely new mythologies, societies, or historical contexts that feel both alien and familiar.`;
  }

  const guidance: Partial<Record<Genre, string>> = {
    rpg: `Genre: RPG (Role-Playing Game)
NARRATIVE ELEMENTS REQUIRED:
- **World History**: Ancient civilizations, fallen empires, wars that shaped current politics, myths/legends that hint at truth
- **Factions/Cultures**: 3-5 distinct groups with conflicting ideologies, cultures, aesthetics. Each should offer different gameplay/story paths
- **Protagonist Backstory**: Deep personal history tied to world events - family legacy, past trauma, connection to major factions
- **Character-Driven Plot**: NPCs with agency, relationships that evolve, companions with personal arcs
- **Meaningful Choices**: Decisions that branch story, affect faction standing, determine endings (no fake choices)
- **Power Justification**: Lore explanation for why protagonist grows stronger (inherited bloodline, ancient pact, training montage, absorbing souls, etc.)

NARRATIVE TONE:
- Epic scope (world-changing stakes) balanced with intimate moments (personal relationships, quiet discoveries)
- Hero's Journey OR deliberate subversion (reluctant hero, anti-hero, chosen one prophecy is a lie)
- Player as active participant in story, not passive observer
- Environmental storytelling (item descriptions, NPC dialogue, world design tells story)

GLM-4.6 RPG NARRATIVE OPTIMIZATION: Create complex political systems with realistic faction dynamics. Design character arcs that respond meaningfully to player choices. Use your analytical capabilities to ensure world history is internally consistent and thematically rich.

INSPIRATION: The Witcher 3 (morally grey choices), Planescape: Torment (philosophical depth), Baldur's Gate 3 (reactivity), Dark Souls (environmental lore)`,

    fps: `Genre: FPS (First-Person Shooter)
NARRATIVE ELEMENTS REQUIRED:
- **Military/Conflict Context**: Active war, covert ops, resistance movement, mercenary work - clear reason for combat
- **Enemy Motivation**: Why are they fighting? Resources, ideology, survival, revenge? Make antagonists understandable, not cartoonish
- **Protagonist Role**: Soldier (elite special forces, grunt promoted through action), operative (spy, assassin), civilian forced into combat
- **Mission Structure**: Overarching campaign goal broken into discrete missions with clear objectives and stakes
- **Wartime Setting**: Front lines, occupied cities, enemy territory, bombed-out landscapes, propaganda, civilian casualties

NARRATIVE TONE:
- Intense, visceral action with breathing room for character moments between missions
- Human stakes amid chaos - focus on squad camaraderie, civilian impact, cost of war
- Lore justifies constant combat (you're in a warzone, behind enemy lines, defending last stronghold)
- Optional: Subvert military shooter tropes (Spec Ops: The Line questioning player actions, Titanfall 2's bond with BT)

GLM-4.6 FPS NARRATIVE OPTIMIZATION: Design military narratives with realistic tactical and strategic elements. Create enemy motivations that go beyond simple evil. Use your reasoning to explore the psychological impact of warfare while maintaining engaging action sequences.

INSPIRATION: Half-Life 2 (environmental storytelling), Titanfall 2 (emotional player-AI bond), Halo (epic sci-fi war), Spec Ops: The Line (war critique)`,

    strategy: `Genre: Strategy (RTS/Turn-Based/4X)
NARRATIVE ELEMENTS REQUIRED:
- **Factional Conflict**: 3-7 factions with distinct cultures, units, playstyles, and ideological differences (democracy vs autocracy, tradition vs progress, etc.)
- **Leader Protagonists**: Player is commander, general, ruler, emperor - decisions have political and strategic weight
- **Political Intrigue**: Alliances shift, betrayals, espionage, internal coups, diplomatic negotiations with hidden agendas
- **Resource Scarcity**: Lore reason for competition (limited fertile land, rare magical crystals, control of hyperspace lanes, etc.)
- **Historical Context**: Deep timeline of past wars, treaties, grudges, technological revolutions that led to current state

NARRATIVE TONE:
- Grand historical scale (centuries of conflict, rise and fall of empires)
- Tactical, cerebral - player as mastermind, not individual soldier
- Consequences ripple across entire civilizations
- Lore explains strategic mechanics (why factions fight, why resources matter, why tech trees follow this path)

GLM-4.6 STRATEGY NARRATIVE OPTIMIZATION: Create intricate political systems with realistic diplomatic relationships. Design historical narratives that explain current conflicts. Use your analytical capabilities to ensure faction motivations are complex but internally consistent.

INSPIRATION: StarCraft (asymmetric factions with deep lore), Civilization VI (historical "what-if" scenarios), Total War (grand strategy meets personal stories), Dune (political intrigue)`,

    puzzle: `Genre: Puzzle
NARRATIVE ELEMENTS REQUIRED:
- **Central Mystery**: What happened here? Who built this? Why do these puzzles exist? What is the protagonist discovering?
- **Purpose for Puzzles**: Ancient civilization's trial, AI testing protocols, magical barriers guarding secrets, architect's grand design, memory reconstruction
- **Curious Protagonist**: Archaeologist, scientist, amnesiac reconstructing past, apprentice learning ancient knowledge, AI gaining sentience
- **Environmental Storytelling**: Puzzle solutions reveal lore (murals, inscriptions, hologram logs, fragmented memories)
- **Discovery Curve**: Early puzzles teach world rules, later puzzles reveal deeper truths about world/protagonist

NARRATIVE TONE:
- Thoughtful, contemplative, patient - rewards observation and deduction
- Mysterious without being obtuse - breadcrumbs lead to "aha!" revelations
- Discovery-focused - players piece together story through exploration, not cutscenes
- Lore makes puzzles feel diegetic (puzzles exist IN the world for a reason, not gamey abstractions)

GLM-4.6 PUZZLE NARRATIVE OPTIMIZATION: Design mysteries that unfold through player discovery. Create environmental storytelling that rewards careful observation. Use your reasoning to craft puzzles that teach through experimentation and reveal narrative through solution.

INSPIRATION: The Witness (environmental philosophy), Portal (dark humor + escalating reveals), Return of the Obra Dinn (deduction-driven narrative), Outer Wilds (knowledge-based progression)`,

    survival: `Genre: Survival
NARRATIVE ELEMENTS REQUIRED:
- **Catastrophic Event**: Apocalypse (nuclear war, plague, alien invasion), natural disaster (volcanic winter, flood), hostile planet colonization
- **Desperate Circumstances**: Resources depleted, infrastructure collapsed, safe zones rare, constant threats
- **Isolation/Group Dynamics**: Lone survivor OR small group with interpersonal tensions, trust issues, rationing conflicts
- **Hostile World**: Nature reclaiming civilization, mutated creatures, environmental hazards, other desperate survivors turned hostile
- **Mystery/Hope**: Why did this happen? Is there a safe zone? Can we rebuild? Is rescue coming? Glimmers of hope drive exploration

NARRATIVE TONE:
- Tense, atmospheric, oppressive - every decision feels weighty
- Struggle against nature/disaster, not heroic power fantasy
- Lore justifies scarcity (why is food gone? why is water toxic? why can't we leave?)
- Environmental storytelling (abandoned camps tell stories of those who didn't make it)
- Balance hopelessness with player agency (situation is dire, but clever players can thrive)

GLM-4.6 SURVIVAL NARRATIVE OPTIMIZATION: Create post-apocalyptic narratives with psychological depth. Design environmental storytelling that reveals the story of the world's end. Use your reasoning to balance despair with hope and create meaningful survival mechanics that serve the narrative.

INSPIRATION: The Long Dark (man vs nature), The Last of Us (humanity in apocalypse), Subnautica (hostile alien ocean), Don't Starve (dark whimsy + permadeath)`,

    blank: '',
    'action-adventure': `Genre: Action-Adventure
NARRATIVE ELEMENTS REQUIRED:
- **Exploration-Driven Story**: World opens up as player progresses, story revealed through exploration
- **Protagonist Journey**: Character growth through adventure, discovery, and overcoming challenges
- **Balanced Action/Narrative**: Combat and exploration serve story, not just gameplay
- **World-Building**: Rich environments that tell stories through design and atmosphere

GLM-4.6 ACTION-ADVENTURE NARRATIVE OPTIMIZATION: Create narratives where exploration reveals story naturally. Design character arcs that develop through discovery rather than exposition. Use your reasoning to balance action sequences with meaningful narrative moments.

INSPIRATION: Zelda series, Uncharted, Tomb Raider, Assassin's Creed`,
    adventure: `Genre: Adventure
NARRATIVE ELEMENTS REQUIRED:
- **Story-First Design**: Narrative drives gameplay, not reverse
- **Character Development**: Deep character arcs and relationships
- **Mystery/Discovery**: Unraveling mysteries through exploration and dialogue
- **Emotional Engagement**: Focus on emotional storytelling and player connection

GLM-4.6 ADVENTURE NARRATIVE OPTIMIZATION: Design character-driven narratives with emotional depth. Create dialogue systems that allow for meaningful player relationships. Use your reasoning to craft stories that balance player agency with compelling narrative arcs.

INSPIRATION: Life is Strange, Telltale Games, Firewatch, What Remains of Edith Finch`,
    'battle-royale': `Genre: Battle Royale
NARRATIVE ELEMENTS REQUIRED:
- **Competitive Arena**: Lore explains why players compete in this format
- **Survival Context**: Last-person-standing scenario with narrative justification
- **World Setting**: Arena or battleground with history and purpose
- **Character Motivation**: Why participants join and what they're fighting for

GLM-4.6 BATTLE ROYALE NARRATIVE OPTIMIZATION: Create compelling justifications for battle royale format. Design world narratives that make the competition feel meaningful. Use your reasoning to balance spectacle with emotional stakes.

INSPIRATION: Apex Legends, Fortnite, PUBG`,
    sports: `Genre: Sports
NARRATIVE ELEMENTS REQUIRED:
- **Competitive Context**: League, tournament, or championship structure
- **Team/Player Identity**: Character development through sports achievements
- **Rivalries**: Established rivalries and relationships
- **World Integration**: How sports fit into larger world

GLM-4.6 SPORTS NARRATIVE OPTIMIZATION: Design sports narratives that go beyond simple competition. Create character arcs that develop through athletic achievement. Use your reasoning to explore themes of teamwork, rivalry, and personal growth through sport.

INSPIRATION: FIFA, NBA 2K, Rocket League`,
    fighting: `Genre: Fighting
NARRATIVE ELEMENTS REQUIRED:
- **Tournament Structure**: Fighting tournament with stakes and history
- **Character Roster**: Diverse fighters with unique backgrounds and motivations
- **World Setting**: Arena or fighting world with its own culture
- **Personal Stakes**: What each fighter is fighting for

GLM-4.6 FIGHTING NARRATIVE OPTIMIZATION: Design fighter narratives with cultural depth and personal motivation. Create tournament structures that feel epic and meaningful. Use your reasoning to explore themes of honor, rivalry, and self-discovery through combat.

INSPIRATION: Street Fighter, Tekken, Mortal Kombat`,
    platformer: `Genre: Platformer
NARRATIVE ELEMENTS REQUIRED:
- **Movement-Focused Story**: Narrative that emphasizes traversal and exploration
- **World Design**: Levels that tell stories through design
- **Character Journey**: Protagonist's journey through challenging environments
- **Environmental Storytelling**: Story told through level design and atmosphere

GLM-4.6 PLATFORMER NARRATIVE OPTIMIZATION: Design narratives where movement itself tells a story. Create environmental storytelling that rewards exploration and mastery. Use your reasoning to craft character journeys that develop through overcoming physical challenges.

INSPIRATION: Super Mario, Celeste, Ori and the Blind Forest`,
    horror: `Genre: Horror
NARRATIVE ELEMENTS REQUIRED:
- **Atmospheric Tension**: World designed to create fear and unease
- **Threat Context**: What is the horror and why does it exist
- **Survival Stakes**: What happens if protagonist fails
- **Psychological Elements**: Fear through atmosphere, not just jump scares

GLM-4.6 HORROR NARRATIVE OPTIMIZATION: Design psychological horror that leverages player imagination. Create atmospheric tension through environmental storytelling. Use your reasoning to build narratives that explore deeper fears and human psychology.

INSPIRATION: Silent Hill, Amnesia, Outlast`,
    roguelike: `Genre: Roguelike
NARRATIVE ELEMENTS REQUIRED:
- **Death/Loop Mechanic**: Lore explanation for permadeath and restart mechanics
- **Procedural Narrative**: Story elements that work with randomized content
- **Progression Through Failure**: How death leads to knowledge and growth
- **World Structure**: Why world resets or changes

GLM-4.6 ROGUELIKE NARRATIVE OPTIMIZATION: Design narratives that make repeated runs meaningful. Create procedural storytelling that adapts to player actions. Use your reasoning to craft death/rebirth cycles that serve the larger narrative.

INSPIRATION: Hades, Dead Cells, The Binding of Isaac`,
    simulation: `Genre: Simulation
NARRATIVE ELEMENTS REQUIRED:
- **System-Driven Story**: Narrative emerges from simulation systems
- **World Context**: What is being simulated and why
- **Player Agency**: How player choices affect simulation
- **Realistic Context**: Grounded in real-world or established world rules

GLM-4.6 SIMULATION NARRATIVE OPTIMIZATION: Design simulation narratives with systemic depth. Create worlds where player actions create emergent stories. Use your reasoning to balance realism with engaging gameplay mechanics.

INSPIRATION: The Sims, Cities: Skylines, Stardew Valley`,
    racing: `Genre: Racing
NARRATIVE ELEMENTS REQUIRED:
- **Racing Context**: League, tournament, or street racing scene
- **Vehicle Culture**: World where vehicles and racing are central
- **Competition Stakes**: What racers compete for
- **Character Identity**: Racer background and motivation

GLM-4.6 RACING NARRATIVE OPTIMIZATION: Design racing narratives that go beyond simple competition. Create character arcs that develop through racing achievement. Use your reasoning to explore themes of speed, skill, and personal growth.

INSPIRATION: Forza, Gran Turismo, Need for Speed`,
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
    context += 'IMPORTANT: Lore must explain WHY and HOW character grows in power.\n';
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
