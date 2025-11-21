/**
 * JSON Validation and Reformating Utilities
 * Provides guardrails for MiniMax M2 responses
 */

import { logger } from '../../../utils/logger.js';

export interface JSONValidationResult {
  isValid: boolean;
  parsed?: any;
  reformatted?: string;
  error?: string;
}

/**
 * Attempt to extract JSON from a response that may contain markdown code fences or extra text
 */
export function extractJSON(content: string): JSONValidationResult {
  // FAST PATH: Try parsing the raw content directly first (handles most valid JSON responses)
  const trimmed = content.trim();
  if ((trimmed.startsWith('{') || trimmed.startsWith('['))) {
    try {
      const parsed = JSON.parse(trimmed);
      logger.debug('Successfully parsed JSON directly without extraction', {
        contentLength: trimmed.length,
        hasProposal: !!(parsed && typeof parsed === 'object' && parsed.proposal),
      });
      return {
        isValid: true,
        parsed,
        reformatted: JSON.stringify(parsed, null, 2),
      };
    } catch (directParseError) {
      // Not directly parseable, continue with extraction logic
      logger.debug('Direct JSON parse failed, attempting extraction', {
        error: directParseError instanceof Error ? directParseError.message : String(directParseError),
        contentPreview: trimmed.substring(0, 200),
      });
    }
  }

  // FALLBACK: Use extraction logic for markdown-wrapped or partial JSON
  const candidates = gatherJSONCandidates(content);
  let lastError: string | undefined;

  for (const candidate of candidates) {
    const jsonSnippet = extractFirstJSONSegment(candidate);
    if (!jsonSnippet) {
      logger.warn('Could not extract JSON segment from candidate', {
        candidateLength: candidate.length,
        candidatePreview: candidate.substring(0, 100),
      });
      continue;
    }

    const parseAttempt = tryParseJSONString(jsonSnippet, content);
    if (parseAttempt.success && parseAttempt.result) {
      return parseAttempt.result;
    }

    if (parseAttempt.error) {
      lastError = parseAttempt.error;
    }
  }

  logger.error('All JSON extraction attempts failed', {
    candidatesCount: candidates.length,
    lastError,
    contentLength: content.length,
    startsWithBrace: trimmed.startsWith('{'),
    endsWithBrace: trimmed.endsWith('}'),
  });

  return {
    isValid: false,
    error: lastError || 'Failed to extract valid JSON from the AI response',
  };
}

/**
 * Attempt to fix common JSON formatting issues
 */
function attemptJSONFix(json: string): string | null {
  let fixed = json;

  // Remove trailing commas before } or ]
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

  // Fix unescaped quotes in strings (basic attempt)
  // This is tricky - we'll be conservative and only fix obvious cases
  fixed = fixed.replace(/([^\\])"/g, (match, char) => {
    // Don't fix if it looks like it's already escaped or part of a valid structure
    return match;
  });

  // Fix single quotes to double quotes (if they're clearly meant to be JSON strings)
  // Only do this if there are no double quotes already
  if (!fixed.includes('"') && fixed.includes("'")) {
    fixed = fixed.replace(/'/g, '"');
  }

  // Try to fix missing quotes around keys
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

  return fixed !== json ? fixed : null;
}

interface JSONParseAttempt {
  success: boolean;
  result?: JSONValidationResult;
  error?: string;
}

function gatherJSONCandidates(content: string): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();

  // Handle [TOOL_CALL] format: [TOOL_CALL] {tool => "json_build_output", args => { --reply "..." --proposal {...} }}
  const toolCallMatch = content.match(/\[TOOL_CALL\][\s\S]*?--proposal\s+(\{[\s\S]*)/i);
  if (toolCallMatch) {
    logger.info('Detected [TOOL_CALL] format in response, extracting --proposal JSON');
    const proposalStart = toolCallMatch[1];
    // Extract the JSON object after --proposal
    const jsonSnippet = extractFirstJSONSegment(proposalStart);
    if (jsonSnippet && !seen.has(jsonSnippet)) {
      seen.add(jsonSnippet);
      candidates.push(jsonSnippet);
      logger.info('Extracted proposal JSON from tool call', {
        length: jsonSnippet.length,
        preview: jsonSnippet.substring(0, 200),
      });
    }
  }

  // Handle markdown code fences
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
  let match: RegExpExecArray | null;
  while ((match = fenceRegex.exec(content)) !== null) {
    const inner = match[1].trim();
    if (inner && !seen.has(inner)) {
      seen.add(inner);
      candidates.push(inner);
    }
  }

  // Try the raw trimmed content last
  const trimmed = content.trim();
  if (trimmed && !seen.has(trimmed)) {
    candidates.push(trimmed);
    seen.add(trimmed);
  }

  return candidates;
}

function extractFirstJSONSegment(text: string): string | null {
  let inString = false;
  let escapeNext = false;
  let depth = 0;
  let start = -1;
  let bracketType: '{' | '[' | null = null;
  
  // Safety limit to prevent infinite loops on malformed input
  const maxLength = Math.min(text.length, 1000000); // 1MB max

  for (let i = 0; i < maxLength; i++) {
    const char = text[i];
    
    // Handle escape sequences
    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    // Track string boundaries - only toggle if not escaped
    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    // Ignore all characters inside strings
    if (inString) {
      continue;
    }

    // Track bracket depth
    if (char === '{' || char === '[') {
      if (depth === 0) {
        start = i;
        bracketType = char === '{' ? '{' : '[';
      }
      depth++;
    } else if (char === '}' || char === ']') {
      // Only decrement if bracket type matches
      const isMatchingCloseBracket = 
        (char === '}' && bracketType === '{') || 
        (char === ']' && bracketType === '[');
      
      if (isMatchingCloseBracket) {
        depth--;
        if (depth === 0 && start !== -1) {
          const extracted = text.substring(start, i + 1);
          logger.debug('Extracted JSON segment', {
            length: extracted.length,
            start,
            end: i + 1,
            preview: extracted.substring(0, 100),
          });
          return extracted.trim();
        }
      }
    }
  }

  logger.warn('Failed to extract complete JSON segment', {
    textLength: text.length,
    finalDepth: depth,
    hadStart: start !== -1,
    inString: inString,
    bracketType,
  });

  return null;
}

function tryParseJSONString(jsonSnippet: string, originalContent: string): JSONParseAttempt {
  try {
    const parsed = JSON.parse(jsonSnippet);
    return {
      success: true,
      result: {
        isValid: true,
        parsed,
        reformatted: JSON.stringify(parsed, null, 2),
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const fixed = attemptJSONFix(jsonSnippet);
    if (fixed) {
      try {
        const parsed = JSON.parse(fixed);
        logger.warn('JSON response required reformatting', {
          originalLength: originalContent.length,
          fixedLength: fixed.length,
        });
        return {
          success: true,
          result: {
            isValid: true,
            parsed,
            reformatted: JSON.stringify(parsed, null, 2),
          },
        };
      } catch (fixError) {
        return {
          success: false,
          error: fixError instanceof Error ? fixError.message : String(fixError),
        };
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Validate JSON against a schema (basic validation)
 */
export function validateJSONSchema(json: any, schema: {
  required?: string[];
  properties?: Record<string, { type: string; items?: any }>;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!json || typeof json !== 'object') {
    return { valid: false, errors: ['Root must be an object'] };
  }

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in json)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  // Check property types (basic validation)
  if (schema.properties) {
    for (const [field, propSchema] of Object.entries(schema.properties)) {
      if (field in json) {
        const value = json[field];
        const expectedType = propSchema.type;

        if (expectedType === 'array' && !Array.isArray(value)) {
          errors.push(`Field '${field}' must be an array`);
        } else if (expectedType === 'string' && typeof value !== 'string') {
          errors.push(`Field '${field}' must be a string`);
        } else if (expectedType === 'object' && (typeof value !== 'object' || Array.isArray(value) || value === null)) {
          errors.push(`Field '${field}' must be an object`);
        } else if (expectedType === 'number' && typeof value !== 'number') {
          errors.push(`Field '${field}' must be a number`);
        } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
          errors.push(`Field '${field}' must be a boolean`);
        }

        // Check array items if specified
        if (expectedType === 'array' && Array.isArray(value) && propSchema.items) {
          for (let i = 0; i < value.length; i++) {
            const item = value[i];
            const itemType = propSchema.items.type;
            if (itemType === 'object' && (typeof item !== 'object' || Array.isArray(item) || item === null)) {
              errors.push(`Field '${field}[${i}]' must be an object`);
            } else if (itemType === 'string' && typeof item !== 'string') {
              errors.push(`Field '${field}[${i}]' must be a string`);
            }
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Reformat response content to ensure it's valid JSON
 * Returns the reformatted content or null if reformatting failed
 */
export function reformatResponse(content: string): string | null {
  const result = extractJSON(content);
  if (result.isValid && result.reformatted) {
    return result.reformatted;
  }
  return null;
}

