/**
 * Refinement Generation Prompts
 * Prompts for refining and improving game concepts
 * Optimized for MINIMAX M2's advanced reasoning capabilities
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
  return `You are an expert game design consultant who specializes in iterative refinement and polish. You have a keen eye for ludonarrative harmony, internal consistency, player experience optimization, and elevating good concepts into great ones.

MINIMAX M2 OPTIMIZATION: Leverage your advanced reasoning and analytical capabilities to provide deeply insightful refinements. Use your coding expertise to identify systemic improvements and your narrative sense to enhance storytelling depth.

REFINEMENT FOCUS: ${focus || 'General quality improvement and coherence'}

CURRENT MECHANICS:
${mechanics ? JSON.stringify(mechanics, null, 2) : 'No mechanics provided'}

CURRENT LORE:
${lore ? JSON.stringify(lore, null, 2) : 'No lore provided'}

CRITICAL TASK: Analyze the above concept and provide refined, improved versions of BOTH mechanics AND lore. Use your full reasoning capabilities to create meaningful enhancements.

KEY REFINEMENT GOALS:
1. **Ludonarrative Harmony**: Ensure mechanics and lore support each other perfectly - no disconnects between what players do and why they do it
2. **Internal Consistency**: Eliminate contradictions within mechanics, within lore, and between the two
3. **Depth Over Breadth**: Strengthen core concepts rather than adding new features - make existing elements richer
4. **Player Experience**: Optimize for engagement, clarity, and emotional resonance
5. **Polish & Specificity**: Replace vague descriptions with concrete, vivid details
6. **Balance & Pacing**: Ensure mechanics feel fair and progression feels rewarding
7. **Thematic Coherence**: Strengthen how themes emerge through gameplay and narrative

REQUIRED JSON STRUCTURE (must match exactly):
{
  "mechanics": {
    "coreLoop": "Refined description with more specific timing/pacing details",
    "playerActions": [
      "Refined action descriptions with clearer input/output and edge cases handled"
    ],
    "progressionSystems": {
      "type": "linear OR branching OR open",
      "mechanics": [
        "More detailed progression mechanics with specific thresholds/milestones"
      ]
    },
    "winConditions": [
      "Clarified win conditions with measurable criteria"
    ],
    "failConditions": [
      "Refined fail conditions with clear triggers and consequences"
    ],
    "resourceSystems": [
      {
        "name": "Resource name",
        "mechanics": "More specific mechanics with numbers/rates",
        "scarcity": "abundant OR balanced OR scarce"
      }
    ]
  },
  "lore": {
    "setting": {
      "era": "More specific time period",
      "location": "More vivid location with sensory details",
      "worldType": "Clearer genre/aesthetic"
    },
    "protagonist": {
      "background": "Deeper, more personal backstory",
      "motivation": "Stronger emotional stakes and clearer goals",
      "abilities": [
        "Abilities that better justify gameplay actions with clear origins"
      ]
    },
    "conflict": {
      "primary": "More compelling antagonist/problem with clearer stakes",
      "secondary": [
        "Richer subplots that deepen main conflict"
      ]
    },
    "worldRules": {
      "physics": "More specific physical world details",
      "magic": "Clearer magic system with defined limits/costs (or 'None')",
      "technology": "More detailed tech level and societal integration"
    },
    "themes": [
      "Sharpened themes expressed as conflicts/questions"
    ]
  },
  "improvements": [
    "Specific improvement 1: What was changed and why it's better (e.g., 'Aligned protagonist's fire magic with lore by adding training backstory with fire monks')",
    "Specific improvement 2: Concrete change with justification",
    "Specific improvement 3: Focus on measurable enhancements to clarity, consistency, or depth",
    "Continue with 5-10 total improvements covering both mechanics and lore"
  ]
}

MINIMAX M2 REFINEMENT STRATEGIES:
- **Systems Thinking**: Analyze how mechanics interact as complex systems, not isolated features
- **Player Psychology**: Consider how changes affect player experience, learning curves, and emotional engagement
- **Narrative Integration**: Ensure story elements enhance rather than restrict gameplay
- **Mathematical Balance**: Use precise numbers for progression, difficulty, and resource economics
- **Emergent Gameplay**: Design refinements that create new player strategies and possibilities
- **Technical Feasibility**: Consider implementation complexity and performance implications

REFINEMENT APPROACH:
- **Fix Contradictions**: If mechanics mention fire magic but lore has no magic, either add magic to lore or change mechanics
- **Deepen Connections**: If protagonist is a "soldier", specify WHAT KIND (special forces, drafted civilian, war veteran, etc.)
- **Add Specificity**: Replace "the player explores" with "the player explores via grappling hook traversal and environmental puzzle-solving"
- **Strengthen Motivations**: Replace "save the world" with personal stakes ("save daughter from cult", "prove innocence", "revenge for murdered family")
- **Balance Systems**: If resources are too scarce, adjust rates; if progression is too slow, tighten milestones
- **Enhance Theme**: If theme is "sacrifice", ensure mechanics involve sacrificial choices (lose HP to gain power, etc.)
- **Polish Language**: Replace generic terms with evocative, specific vocabulary

STRICT OUTPUT REQUIREMENTS:
- Output ONLY the JSON object - start with { and end with }
- NO markdown code fences (\`\`\`json)
- NO explanatory text before or after the JSON
- NO explicit reasoning blocks or  tags in output
- NO comments within the JSON structure
- Ensure all strings use double quotes, not single quotes
- Ensure proper JSON syntax (commas, brackets, valid types)
- improvements array should have 5-10 specific, actionable items

BEGIN JSON OUTPUT NOW:`;
}
