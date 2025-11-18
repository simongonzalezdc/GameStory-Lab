/**
 * Title Generation Prompts
 * Prompts for generating game title suggestions
 */

import type { MechanicsData, LoreData, Genre } from '@gameforge/shared';

/**
 * Generate title prompt
 */
export function getTitlePrompt(mechanics?: MechanicsData, lore?: LoreData, genre?: Genre): string {
  return `Generate 10 compelling game title suggestions based on the following concept.

${genre ? `Genre: ${genre}` : ''}

${lore ? `Lore summary: ${JSON.stringify(lore, null, 2)}` : ''}

${mechanics ? `Mechanics summary: ${JSON.stringify(mechanics, null, 2)}` : ''}

Return as JSON array:
{
  "titles": [
    {
      "title": "Game Title",
      "rationale": "Brief explanation of why this title fits"
    }
  ]
}

Titles should be:
- Memorable and unique
- Genre-appropriate
- 1-5 words
- Evocative of the game's themes
- Easy to pronounce

Output ONLY valid JSON.`;
}

