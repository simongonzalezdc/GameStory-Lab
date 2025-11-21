# MiniMax M2 Optimization Specification
**Last Updated**: November 21, 2025  
**API Version**: Anthropic-compatible (2023-06-01)

## Overview

This document defines the unified prompt and output contract for MiniMax M2 integration, ensuring consistent, structured responses across all AI features in GameStory Lab.

## Current MiniMax Usage Audit

### Client Configuration (`packages/backend/src/services/ai/clients/minimax.ts`)
- **Endpoint**: `https://api.minimax.io/anthropic/v1/messages`
- **Authentication**: `x-api-key` header (Anthropic-compatible)
- **Model**: `MiniMax-M2` (default) or `MiniMax-M2-Stable`
- **Current Parameters**:
  - `temperature`: 1.0 (default, range: 0.0-1.0)
  - `top_p`: 0.9 (default)
  - `max_tokens`: 2000 (default, can be overridden)
  - `stream`: false (always)
- **Response Format**: Anthropic-compatible with `thinking` and `text` content blocks

### Prompt Files Using MiniMax M2
1. **`mechanics.ts`**: Game mechanics generation - requires JSON output
2. **`lore.ts`**: Narrative/worldbuilding generation - requires JSON output
3. **`refinement.ts`**: Concept refinement - requires JSON output
4. **`title.ts`**: Title generation - requires JSON output
5. **`assistant-service.ts`**: Chat assistant - requires JSON with `reply` and optional `proposal`

### Current Issues Identified
1. ❌ No `response_format` parameter enforcement for JSON schemas
2. ❌ Prompts rely on text instructions rather than structured output
3. ❌ No unified instruction template across prompts
4. ❌ Response parsing assumes JSON but doesn't validate structure
5. ❌ No guardrails for reformatting malformed responses

## Unified Prompt + Output Contract

### Canonical Instruction Template

All MiniMax M2 prompts MUST include this unified instruction block:

```markdown
MINIMAX M2 OUTPUT FORMAT REQUIREMENTS:

1. **Response Structure**: 
   - For structured data (mechanics, lore, refinement): Output MUST be valid JSON only
   - For conversational responses (assistant chat): Output MUST be JSON with `reply` (string) and optional `proposal` (object)
   - NO markdown code fences (```json or ```)
   - NO explanatory text before/after JSON
   - Start response with `{` and end with `}`

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
   - Use thinking to reason through complex requirements before generating JSON
```

### Output Format Specifications

#### 1. Mechanics Generation
**Required JSON Schema**:
```json
{
  "coreLoop": "string (1-2 sentences)",
  "playerActions": ["string", "string", ...],
  "progressionSystems": {
    "type": "linear" | "branching" | "open",
    "mechanics": ["string", ...]
  },
  "winConditions": ["string", ...],
  "failConditions": ["string", ...],
  "resourceSystems": [
    {
      "name": "string",
      "mechanics": "string",
      "scarcity": "abundant" | "balanced" | "scarce"
    }
  ]
}
```

#### 2. Lore Generation
**Required JSON Schema**:
```json
{
  "setting": {
    "era": "string",
    "location": "string",
    "worldType": "string"
  },
  "protagonist": {
    "background": "string (2-3 sentences)",
    "motivation": "string",
    "abilities": ["string", ...]
  },
  "conflict": {
    "primary": "string",
    "secondary": ["string", ...]
  },
  "worldRules": {
    "physics": "string",
    "magic": "string",
    "technology": "string"
  },
  "themes": ["string", ...]
}
```

#### 3. Refinement Generation
**Required JSON Schema**:
```json
{
  "mechanics": { /* Mechanics schema */ },
  "lore": { /* Lore schema */ },
  "improvements": ["string", ...]
}
```

#### 4. Title Generation
**Required JSON Schema**:
```json
{
  "titles": [
    {
      "title": "string",
      "rationale": "string (2-3 sentences)"
    }
  ]
}
```

#### 5. Assistant Chat Response
**Required JSON Schema**:
```json
{
  "reply": "string (markdown-formatted conversational response)",
  "proposal": {
    "explanation": "string",
    "mechanics": { /* optional, Mechanics schema */ },
    "lore": { /* optional, Lore schema */ },
    "architectDocuments": [ /* optional */ ]
  }
}
```

## Implementation Requirements

### 1. MiniMax Client Updates
- ✅ Add `response_format` parameter support (when JSON schema is required)
- ✅ Implement JSON schema validation
- ✅ Add response reformatting guardrails
- ✅ Improve error handling for malformed JSON

### 2. Prompt Builder Updates
- ✅ Inject unified instruction template into all prompts
- ✅ Add JSON schema validation instructions
- ✅ Standardize error prevention guidelines
- ✅ Ensure consistent formatting across all prompt files

### 3. Response Handling Updates
- ✅ Parse and validate JSON responses
- ✅ Handle thinking blocks separately
- ✅ Reformat malformed responses when possible
- ✅ Provide clear error messages for invalid responses

### 4. Testing Requirements
- ✅ Unit tests for JSON schema validation
- ✅ Integration tests for prompt/response compliance
- ✅ Regression tests for known edge cases
- ✅ Performance tests for response parsing

## Parameter Guidelines (Per MiniMax Documentation)

### Temperature
- **Range**: (0.0, 1.0] - values outside this range will error
- **Default**: 1.0 (recommended by Anthropic)
- **Usage**: 
  - 0.7-0.9 for creative tasks (lore, titles)
  - 0.5-0.7 for structured tasks (mechanics, refinement)
  - 1.0 for conversational tasks (assistant chat)

### Top-P
- **Range**: (0.0, 1.0]
- **Default**: 0.9
- **Usage**: Keep at 0.9 for balanced creativity/consistency

### Max Tokens
- **Required**: Yes
- **Default**: 2000
- **Usage**:
  - 2000 for simple tasks (titles)
  - 4000-8000 for complex tasks (mechanics, lore)
  - 20000 for assistant chat (full proposals)

### Response Format
- **Type**: `{ "type": "json_object" }` or JSON schema
- **Usage**: Use when structured output is required (mechanics, lore, refinement, titles)
- **Note**: Anthropic-compatible API may support JSON schema in `response_format`

## Migration Notes

### Breaking Changes
- None - this is an optimization, not a breaking change
- Existing prompts will continue to work
- New unified template enhances consistency

### Backward Compatibility
- All existing prompts remain functional
- New validation is additive (warns but doesn't fail)
- Response parsing handles both old and new formats

## References

- MiniMax Platform: https://platform.minimax.io
- Anthropic Messages API: https://docs.anthropic.com/claude/reference/messages_post
- Anthropic API Version: 2023-06-01

