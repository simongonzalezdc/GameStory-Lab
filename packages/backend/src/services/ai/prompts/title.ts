/**
 * Title Generation Prompts
 * Prompts for generating game title suggestions
 * Optimized for MINIMAX M2's advanced reasoning capabilities
 * Uses unified prompt template for consistent structured output
 */

import type { MechanicsData, LoreData, Genre } from '@gameforge/shared';
import { buildUnifiedPrompt, getMinimaxOptimizationInstructions } from './unified-template.js';

/**
 * Generate title prompt
 */
export function getTitlePrompt(mechanics?: MechanicsData, lore?: LoreData, genre?: Genre): string {
  const context = `${genre ? `Genre: ${genre.toUpperCase()}` : 'Genre: Not specified'}

${lore ? `\nLORE CONTEXT:\n${JSON.stringify(lore, null, 2)}\n` : ''}

${mechanics ? `\nMECHANICS CONTEXT:\n${JSON.stringify(mechanics, null, 2)}\n` : ''}`;

  const jsonSchema = `{
  "titles": [
    {
      "title": "The Title Here",
      "rationale": "2-3 sentence explanation: What makes this title effective? What core theme/mechanic/emotion does it evoke? Why would it catch a player's eye on Steam/App Store?"
    }
  ]
}`;

  const additionalInstructions = `TITLE DESIGN PRINCIPLES:
1. **Memorable**: Easy to remember after hearing once - strong phonetics, rhythm, or imagery
2. **Unique**: Searchable, stands out from competitors, not generic (avoid "The Adventure", "Hero's Quest")
3. **Genre-Appropriate**: Matches player expectations (FPS = punchy/tactical, RPG = epic/mythic, Puzzle = clever/intriguing)
4. **Length**: 1-5 words optimal (1 word = iconic but risky, 2-3 = sweet spot, 4-5 = descriptive)
5. **Evocative**: Hints at themes, setting, or core mechanic without being literal
6. **Pronounceable**: Phonetically clear, works across languages, no confusing spelling
7. **Marketable**: Looks good in logo form, works as Steam thumbnail, generates curiosity

${getMinimaxOptimizationInstructions('title')}

TITLE VARIETY (provide diverse approaches):
- **1-2 Single-Word Titles**: Bold, iconic (e.g., "Hades", "Portal", "Celeste")
- **3-4 Two-Word Combinations**: Balanced (e.g., "Hollow Knight", "Dead Cells", "Disco Elysium")
- **2-3 Phrase/Sentence Titles**: Descriptive or poetic (e.g., "The Binding of Isaac", "Return of the Obra Dinn")
- **1-2 Metaphorical/Abstract**: Artistic, mysterious (e.g., "Inside", "Limbo", "Journey")

INSPIRATION (study these naming patterns):
- **Strong Verbs**: "Furi", "Slay the Spire", "Control", "Prey"
- **Evocative Nouns**: "Bastion", "Transistor", "Firewatch", "Outer Wilds"
- **Contradictions**: "Darkest Dungeon", "Immortal Redneck", "Superhot"
- **Place Names**: "Hollow Knight", "Hyper Light Drifter", "Kentucky Route Zero"
- **Character/Lore**: "Hades", "Bayonetta", "Ori and the Blind Forest"

AVOID:
- Generic fantasy/sci-fi clichés ("Chronicles of...", "Legacy of...", "...of Destiny")
- Trademarked conflicts (research similar titles before suggesting)
- Unpronounceable combinations or forced acronyms
- Overly long or convoluted phrases (6+ words)
- Titles that spoil narrative twists or mysteries
- Cultural insensitivity or problematic meanings in other languages

IMPORTANT: Generate EXACTLY 10 title suggestions`;

  return buildUnifiedPrompt({
    taskType: 'title',
    roleDescription: `You are an expert game marketing professional specializing in title creation. You've named dozens of successful indie and AAA games, with expertise in creating memorable, marketable titles that capture the essence of games while standing out in crowded marketplaces.`,
    taskDescription: `CRITICAL TASK: Generate 10 compelling, marketable game title suggestions based on the concept above. Use your full reasoning capabilities to create titles that resonate with target audiences.`,
    context,
    jsonSchema,
    additionalInstructions,
  });
}
