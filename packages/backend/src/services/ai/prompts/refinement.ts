/**
 * Refinement Generation Prompts
 * Prompts for refining and improving game concepts
 */

import type { MechanicsData, LoreData } from '@gameforge/shared';

/**
 * Generate refinement prompt
 */
export function getRefinementPrompt(
  mechanics?: MechanicsData,
  lore?: LoreData,
  focus?: string
): string {
  return `Refine and improve the following game concept with focus on: ${focus}

Current Mechanics:
${JSON.stringify(mechanics, null, 2)}

Current Lore:
${JSON.stringify(lore, null, 2)}

Provide refined versions of BOTH mechanics and lore, ensuring they are more coherent and polished.

Return as JSON:
{
  "mechanics": { ...improved mechanics... },
  "lore": { ...improved lore... },
  "improvements": ["list of specific improvements made"]
}

Output ONLY valid JSON, no markdown formatting, no explanations, no reasoning, no chain of thought. Just the JSON object.`;
}

