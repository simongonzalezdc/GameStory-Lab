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
  // Remove markdown code fences if present
  let cleaned = content.trim();
  
  // Remove ```json or ``` code fences
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/gm, '');
  cleaned = cleaned.replace(/\n?```\s*$/gm, '');
  cleaned = cleaned.trim();

  // Try to find JSON object/array boundaries
  const jsonStart = cleaned.indexOf('{');
  const jsonArrayStart = cleaned.indexOf('[');
  
  let jsonContent = cleaned;
  if (jsonStart !== -1 && (jsonArrayStart === -1 || jsonStart < jsonArrayStart)) {
    // Find matching closing brace
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace > jsonStart) {
      jsonContent = cleaned.substring(jsonStart, lastBrace + 1);
    }
  } else if (jsonArrayStart !== -1) {
    // Find matching closing bracket
    const lastBracket = cleaned.lastIndexOf(']');
    if (lastBracket > jsonArrayStart) {
      jsonContent = cleaned.substring(jsonArrayStart, lastBracket + 1);
    }
  }

  // Try to parse as JSON
  try {
    const parsed = JSON.parse(jsonContent);
    return {
      isValid: true,
      parsed,
      reformatted: JSON.stringify(parsed, null, 2),
    };
  } catch (error) {
    // Try to fix common JSON issues
    const fixed = attemptJSONFix(jsonContent);
    if (fixed) {
      try {
        const parsed = JSON.parse(fixed);
        logger.warn('JSON response required reformatting', {
          originalLength: content.length,
          fixedLength: fixed.length,
        });
        return {
          isValid: true,
          parsed,
          reformatted: JSON.stringify(parsed, null, 2),
        };
      } catch (fixError) {
        // Fix attempt failed
      }
    }

    return {
      isValid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
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

