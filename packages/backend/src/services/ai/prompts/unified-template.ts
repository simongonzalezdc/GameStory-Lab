/**
 * Unified Prompt Template for MiniMax M2
 * Provides canonical instruction blocks for consistent, structured responses
 * Last Updated: November 21, 2025
 */

/**
 * Get the unified output format requirements instruction block
 * This should be included in all prompts that require structured JSON output
 */
export function getUnifiedOutputFormatInstructions(): string {
  return `MINIMAX M2 OUTPUT FORMAT REQUIREMENTS:

1. **Response Structure**: 
   - For structured data (mechanics, lore, refinement, titles): Output MUST be valid JSON only
   - For conversational responses (assistant chat): Output MUST be JSON with \`reply\` (string) and optional \`proposal\` (object)
   - NO markdown code fences (\`\`\`json or \`\`\`)
   - NO explanatory text before/after JSON
   - Start response with \`{\` and end with \`}\`

2. **JSON Schema Compliance**:
   - All required fields MUST be present
   - All field types MUST match schema exactly
   - Arrays MUST contain valid objects (not empty or null)
   - Strings MUST be non-empty (minimum 1 character)
   - Numbers MUST be valid (no NaN, Infinity)

3. **Content Quality Standards**:
   - Use specific, concrete details (avoid vague descriptions)
   - Maintain internal consistency (no contradictions)
   - Ensure ludonarrative harmony (mechanics align with lore)
   - Provide measurable values where applicable (numbers, thresholds, rates)

4. **Error Prevention**:
   - Validate JSON syntax before responding
   - Ensure all nested objects are complete
   - Avoid truncation (use appropriate max_tokens)
   - Test that response can be parsed as valid JSON

5. **Thinking Process** (when applicable):
   - MiniMax M2 may include thinking blocks in response
   - Thinking content is automatically separated from main response
   - Use thinking to reason through complex requirements before generating JSON`;
}

/**
 * Get MiniMax M2 optimization instructions
 * Tailored for different task types
 */
export function getMinimaxOptimizationInstructions(taskType: 'mechanics' | 'lore' | 'refinement' | 'title' | 'assistant'): string {
  const base = `MINIMAX M2 OPTIMIZATION: Leverage your advanced reasoning and creative capabilities. Use your analytical mind to ensure perfect internal consistency, innovative design patterns, and engaging experiences. Your strength lies in balancing creativity with logical structure.`;

  const specific: Record<string, string> = {
    mechanics: `MINIMAX M2 MECHANICS OPTIMIZATION:
- **Coding-First Thinking**: Design mechanics with programmer mindset - consider implementation feasibility, edge cases, and system interactions
- **Systemic Depth**: Create mechanics that interact in interesting ways, enabling emergent gameplay
- **Mathematical Precision**: Use exact numbers for damage, rates, thresholds - avoid vague descriptions
- **Innovation Within Constraints**: Push boundaries while maintaining genre conventions and player expectations
- **Technical Considerations**: Design with performance, scalability, and platform limitations in mind`,

    lore: `MINIMAX M2 NARRATIVE OPTIMIZATION:
- **Character Psychology**: Create protagonists with complex motivations, internal conflicts, and realistic emotional responses
- **World-Building Depth**: Design societies with history, politics, economics, and cultural nuances
- **Narrative Pacing**: Structure reveals and discoveries to maximize emotional impact and player engagement
- **Thematic Integration**: Weave themes naturally through all story elements, not as explicit statements
- **Foreshadowing & Mystery**: Plant seeds for future revelations and player theories
- **Emotional Resonance**: Focus on creating moments that players remember and discuss`,

    refinement: `MINIMAX M2 REFINEMENT OPTIMIZATION:
- **Systems Thinking**: Analyze how mechanics interact as complex systems, not isolated features
- **Player Psychology**: Consider how changes affect player experience, learning curves, and emotional engagement
- **Narrative Integration**: Ensure story elements enhance rather than restrict gameplay
- **Mathematical Balance**: Use precise numbers for progression, difficulty, and resource economics
- **Emergent Gameplay**: Design refinements that create new player strategies and possibilities
- **Technical Feasibility**: Consider implementation complexity and performance implications`,

    title: `MINIMAX M2 TITLE OPTIMIZATION:
- **Linguistic Analysis**: Consider phonetic appeal, cross-cultural resonance, and memorability factors
- **Market Intelligence**: Analyze current gaming trends, SEO optimization, and platform-specific naming conventions
- **Creative Wordplay**: Use your advanced language capabilities for clever combinations, alliterations, and meaningful word choices
- **Cultural Sensitivity**: Ensure titles work across global markets without unintended meanings
- **Brand Potential**: Create names that could support sequels, expansions, or franchise development`,

    assistant: `MINIMAX M2 ASSISTANT OPTIMIZATION:
- **Contextual Understanding**: Deeply analyze project context, validation issues, and user intent
- **Proposal Quality**: Create comprehensive proposals with complete mechanics/lore objects, not placeholders
- **Conversational Flow**: Maintain natural, helpful tone while providing expert game design guidance
- **Structured Thinking**: Use reasoning to break down complex requests into actionable proposals
- **User-Centric Design**: Focus on what users can approve and implement, not abstract suggestions`,
  };

  return `${base}\n\n${specific[taskType] || ''}`;
}

/**
 * Get strict output requirements for JSON-only responses
 */
export function getStrictJSONOutputRequirements(): string {
  return `STRICT OUTPUT REQUIREMENTS:
- Output ONLY the JSON object - start with { and end with }
- NO markdown code fences (\`\`\`json or \`\`\`)
- NO explanatory text before or after the JSON
- NO comments in JSON (comments are not valid JSON)
- Ensure proper JSON escaping for strings (quotes, newlines, etc.)
- Validate JSON syntax before responding`;
}

/**
 * Build a complete prompt with unified template
 */
export function buildUnifiedPrompt(options: {
  taskType: 'mechanics' | 'lore' | 'refinement' | 'title' | 'assistant';
  roleDescription: string;
  taskDescription: string;
  context?: string;
  jsonSchema?: string;
  additionalInstructions?: string;
}): string {
  const parts: string[] = [];

  // Role description
  parts.push(options.roleDescription);

  // MiniMax optimization instructions
  parts.push(getMinimaxOptimizationInstructions(options.taskType));

  // Context (if provided)
  if (options.context) {
    parts.push(options.context);
  }

  // Task description
  parts.push(options.taskDescription);

  // JSON schema (if provided)
  if (options.jsonSchema) {
    parts.push(`REQUIRED JSON STRUCTURE (must match exactly):\n${options.jsonSchema}`);
  }

  // Unified output format instructions
  parts.push(getUnifiedOutputFormatInstructions());

  // Strict output requirements (for JSON-only tasks)
  if (options.taskType !== 'assistant') {
    parts.push(getStrictJSONOutputRequirements());
  }

  // Additional instructions (if provided)
  if (options.additionalInstructions) {
    parts.push(options.additionalInstructions);
  }

  return parts.join('\n\n');
}

