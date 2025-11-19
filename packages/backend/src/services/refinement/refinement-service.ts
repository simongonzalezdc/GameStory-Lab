/**
 * Refinement Service
 * Handles iterative improvement of game concepts with version tracking
 */

import type { MechanicsData, LoreData, RefinementFocus } from '@gameforge/shared';
import { PrismaClient } from '@prisma/client';
import { AIOrchestrator } from '../ai/orchestrator.js';
import { logger } from '../../utils/logger.js';

export interface RefinementRequest {
  conceptId: string; // Keep as conceptId for API compatibility (maps to version.id)
  focus: RefinementFocus;
  specificInstructions?: string;
  preserveFields?: string[]; // Fields that should not be changed
}

export interface RefinementResult {
  newVersionId: string;
  newVersion: number;
  previousVersion: number;
  mechanics: MechanicsData;
  lore: LoreData;
  changesApplied: ChangeLog[];
}

export interface ChangeLog {
  field: string;
  changeType: 'added' | 'modified' | 'removed';
  before?: any;
  after?: any;
  reason?: string;
}

export class RefinementService {
  constructor(
    private prisma: PrismaClient,
    private aiOrchestrator: AIOrchestrator
  ) {}

  /**
   * Refine an existing concept and create a new version
   */
  async refineConcept(request: RefinementRequest): Promise<RefinementResult> {
    // 1. Get existing version
    const existingVersion = await this.prisma.version.findUnique({
      where: { id: request.conceptId },
    });

    if (!existingVersion) {
      throw new Error(`Version not found: ${request.conceptId}`);
    }

    // 2. If improving consistency, fetch validation results to know what to fix
    let validationIssues: Array<{
      rule: string;
      severity: string;
      message: string;
      suggestion: string | null;
      confidence: number;
    }> = [];

    if (request.focus === 'improve-consistency') {
      const validationResults = await this.prisma.validationResult.findMany({
        where: {
          conceptId: request.conceptId,
          dismissed: false, // Only include non-dismissed issues
        },
        orderBy: [
          { severity: 'desc' }, // Errors first, then warnings, then info
          { confidence: 'desc' }, // Higher confidence first
        ],
      });

      validationIssues = validationResults.map((result) => ({
        rule: result.ruleName,
        severity: result.severity,
        message: result.message,
        suggestion: result.suggestion,
        confidence: Number(result.confidence),
      }));

      logger.info('Fetched validation issues for consistency refinement', {
        conceptId: request.conceptId,
        issueCount: validationIssues.length,
        errors: validationIssues.filter((i) => i.severity === 'error').length,
        warnings: validationIssues.filter((i) => i.severity === 'warning').length,
        info: validationIssues.filter((i) => i.severity === 'info').length,
      });
    }

    // 3. Generate refinement prompt based on focus
    const refinementPrompt = this.buildRefinementPrompt(
      existingVersion.mechanics as MechanicsData,
      existingVersion.lore as LoreData,
      request.focus,
      request.specificInstructions,
      request.preserveFields,
      validationIssues
    );

    // 3. Call AI to refine
    // Use higher token limit for refinement (refined concepts can be large)
    const aiResponse = await this.aiOrchestrator.generate(
      'refinement',
      [
        { role: 'system', content: this.getRefinementSystemMessage(request.focus) },
        { role: 'user', content: refinementPrompt },
      ],
      'auto',
      { maxTokens: 8000 } // Increased from default 2000 to handle full refined concepts
    );

    // Parse AI response - pass existing mechanics/lore for fallback reconstruction
    const refined = this.parseRefinementResponse(
      aiResponse.content,
      existingVersion.mechanics as MechanicsData,
      existingVersion.lore as LoreData
    );

    // 4. Track changes
    const changes = this.detectChanges(
      existingVersion.mechanics as MechanicsData,
      existingVersion.lore as LoreData,
      refined.mechanics,
      refined.lore
    );

    // 5. Create new version
    const newVersion = await this.prisma.version.create({
      data: {
        projectId: existingVersion.projectId,
        version: existingVersion.version + 1,
        title: existingVersion.title,
        mechanics: refined.mechanics as any,
        lore: refined.lore as any,
        metadata: {
          ...existingVersion.metadata,
          aiModel: aiResponse.model,
          userEdited: false,
          refinedFrom: request.conceptId,
          refinementFocus: request.focus,
        } as any,
      },
    });

    // 6. Log AI generation
    await this.prisma.aiGeneration.create({
      data: {
        conceptId: newVersion.id,
        taskType: 'refinement',
        modelUsed: aiResponse.model,
        prompt: refinementPrompt,
        response: aiResponse.content,
        tokensUsed: aiResponse.tokensUsed.total,
        costUsd: aiResponse.metadata?.costUsd,
        durationMs: aiResponse.metadata?.durationMs,
      },
    });

    return {
      newVersionId: newVersion.id,
      newVersion: newVersion.version,
      previousVersion: existingVersion.version,
      mechanics: refined.mechanics,
      lore: refined.lore,
      changesApplied: changes,
    };
  }

  /**
   * Get version history for a project
   */
  async getVersionHistory(projectId: string) {
    const versions = await this.prisma.version.findMany({
      where: { projectId },
      orderBy: { version: 'asc' },
    });

    return versions.map((v: any) => ({
      id: v.id,
      version: v.version,
      createdAt: v.createdAt,
      refinedFrom: (v.metadata as any)?.refinedFrom,
      refinementFocus: (v.metadata as any)?.refinementFocus,
      aiModel: (v.metadata as any)?.aiModel,
    }));
  }

  /**
   * Compare two version versions
   */
  async compareVersions(conceptId1: string, conceptId2: string) {
    const [version1, version2] = await Promise.all([
      this.prisma.version.findUnique({ where: { id: conceptId1 } }),
      this.prisma.version.findUnique({ where: { id: conceptId2 } }),
    ]);

    if (!version1 || !version2) {
      throw new Error('One or both versions not found');
    }

    const changes = this.detectChanges(
      version1.mechanics as MechanicsData,
      version1.lore as LoreData,
      version2.mechanics as MechanicsData,
      version2.lore as LoreData
    );

    return {
      version1: version1.version,
      version2: version2.version,
      changes,
      summary: this.generateChangeSummary(changes),
    };
  }

  /**
   * Rollback to a previous version
   */
  async rollbackToVersion(projectId: string, targetVersion: number) {
    // Find the target version
    const targetVersionRecord = await this.prisma.version.findFirst({
      where: {
        projectId,
        version: targetVersion,
      },
    });

    if (!targetVersionRecord) {
      throw new Error(`Version ${targetVersion} not found for project ${projectId}`);
    }

    // Get highest current version
    const latestVersion = await this.prisma.version.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' },
    });

    const newVersionNum = (latestVersion?.version || 0) + 1;

    // Create new version with old content
    const rolledBackVersion = await this.prisma.version.create({
      data: {
        projectId,
        version: newVersionNum,
        title: targetVersionRecord.title,
        mechanics: targetVersionRecord.mechanics,
        lore: targetVersionRecord.lore,
        metadata: {
          ...targetVersionRecord.metadata,
          rolledBackFrom: latestVersion?.id,
          rolledBackToVersion: targetVersion,
          userEdited: false,
        } as any,
      },
    });

    return {
      newVersion: newVersionNum,
      rolledBackFrom: latestVersion?.version,
      rolledBackTo: targetVersion,
      versionId: rolledBackVersion.id,
    };
  }

  /**
   * Build refinement prompt based on focus
   */
  private buildRefinementPrompt(
    mechanics: MechanicsData,
    lore: LoreData,
    focus: RefinementFocus,
    specificInstructions?: string,
    preserveFields?: string[],
    validationIssues?: Array<{
      rule: string;
      severity: string;
      message: string;
      suggestion: string | null;
      confidence: number;
    }>
  ): string {
    let focusInstruction = '';

    switch (focus) {
      case 'deepen-mechanics':
        focusInstruction = 'Add more depth and complexity to the gameplay mechanics. Consider edge cases, balancing, and advanced systems.';
        break;
      case 'enrich-lore':
        focusInstruction = 'Expand and enrich the narrative and worldbuilding. Add character depth, backstory, and thematic elements.';
        break;
      case 'improve-consistency':
        if (validationIssues && validationIssues.length > 0) {
          // Build detailed list of specific issues to fix
          const errors = validationIssues.filter((i) => i.severity === 'error');
          const warnings = validationIssues.filter((i) => i.severity === 'warning');
          const info = validationIssues.filter((i) => i.severity === 'info');

          let issuesList = '';

          if (errors.length > 0) {
            issuesList += '\n\nCRITICAL ERRORS (must fix - these are blocking consistency):\n';
            errors.forEach((issue, idx) => {
              issuesList += `${idx + 1}. [${issue.rule}] ${issue.message}\n`;
              if (issue.suggestion) {
                issuesList += `   Suggestion: ${issue.suggestion}\n`;
              }
            });
          }

          if (warnings.length > 0) {
            issuesList += '\n\nWARNINGS (should fix - these reduce consistency score):\n';
            warnings.forEach((issue, idx) => {
              issuesList += `${idx + 1}. [${issue.rule}] ${issue.message}\n`;
              if (issue.suggestion) {
                issuesList += `   Suggestion: ${issue.suggestion}\n`;
              }
            });
          }

          if (info.length > 0) {
            issuesList += '\n\nINFO (consider fixing - minor improvements):\n';
            info.forEach((issue, idx) => {
              issuesList += `${idx + 1}. [${issue.rule}] ${issue.message}\n`;
              if (issue.suggestion) {
                issuesList += `   Suggestion: ${issue.suggestion}\n`;
              }
            });
          }

          focusInstruction = `CRITICALLY IMPORTANT: Fix the specific validation issues listed below. These are the exact inconsistencies detected by the validation system.

${issuesList}

CRITICAL CONSTRAINTS:
- Fix ONLY the issues listed above - do not change anything else
- Preserve all mechanics and lore that are NOT mentioned in the issues above
- When fixing, make MINIMAL changes - add missing elements or adjust specific fields, don't rewrite entire sections
- Do NOT introduce new inconsistencies while fixing these
- Follow the suggestions provided for each issue when available
- The goal is to resolve these specific validation issues and improve the consistency score

⚠️ CRITICAL: Some issues require MECHANICS changes, not just lore changes:
- "technology-level-match" errors: You MUST modify mechanics to match lore's tech level, OR update lore to support mechanics' tech level
- "resource-logic" warnings: You MUST add explanations to lore.worldRules OR modify mechanics to remove unexplained resources
- "win-conditions-narratively-sound" warnings: You MUST ensure mechanics.winConditions align with lore.conflict.primary

MANDATORY OUTPUT FORMAT - THIS IS CRITICAL:
You MUST return a JSON object with EXACTLY two top-level fields: "mechanics" and "lore".
- The "mechanics" field must contain the FULL mechanics object (even if unchanged, you MUST include it)
- The "lore" field must contain the FULL lore object (even if unchanged, you MUST include it)
- Do NOT return just lore fields directly like {themes: ..., setting: ...} - they must be wrapped in {mechanics: {...}, lore: {...}}
- Output ONLY valid JSON starting with { and ending with }, no markdown code blocks, no explanations, no reasoning
- Example format: {"mechanics": {...all mechanics fields...}, "lore": {...all lore fields...}}`;
        } else {
          // Fallback if no validation issues found
          focusInstruction = `CRITICALLY IMPORTANT: Improve consistency and alignment between mechanics and lore. Your goal is to fix inconsistencies and improve the validation score.

CRITICAL CONSTRAINT: Only fix actual inconsistencies. DO NOT change things that are already consistent. Preserve all working alignments. Only modify what is genuinely misaligned.

SPECIFIC CONSISTENCY REQUIREMENTS (fix ONLY these if they are broken):
1. Player Actions Alignment: Ensure every player action (from mechanics.playerActions) is justified by character abilities (from lore.protagonist.abilities). If actions don't match abilities, either add matching abilities to lore OR modify actions to match existing abilities.

2. Win Conditions Narrative Soundness: Ensure win conditions (from mechanics.winConditions) make narrative sense given the conflict (from lore.conflict.primary). The win conditions should directly address or resolve the primary conflict.

3. Resource Logic: If mechanics include resource systems, ensure they align with the world's technology level, magic system, or economic structure described in lore.worldRules.

4. Progression Justification: If mechanics include progression systems, ensure lore explains how characters gain power/abilities (through training, magic, technology, etc.).

5. Technology Level Match: If mechanics involve technology (computers, cybernetics, advanced weapons), ensure lore.setting.era and lore.worldRules.technology support this level of tech. If mechanics involve magic, ensure lore.worldRules.magic explains how it works.

6. Combat System Consistency: If mechanics include combat, ensure lore explains why combat exists (conflicts, threats, etc.) and how it fits the world.

7. Protagonist Motivation: Ensure lore.protagonist.motivation clearly explains why the protagonist undertakes the actions described in mechanics.playerActions.

8. Conflict Resolution Path: Ensure mechanics.winConditions provide a path to resolve lore.conflict.primary.

9. World Rules Alignment: Ensure all mechanics respect the physical laws, magic systems, and technology levels described in lore.worldRules.

10. Theme Consistency: If lore.themes exist, ensure mechanics reinforce these themes (e.g., if theme is "survival", mechanics should include survival challenges).

STRATEGY:
- First, identify what is ALREADY consistent and PRESERVE it exactly as-is
- Only fix things that are genuinely misaligned
- When fixing, make MINIMAL changes - add missing elements rather than rewriting entire sections
- Do NOT introduce new inconsistencies while fixing old ones
- If something is borderline but not clearly broken, leave it alone
- The goal is to improve the validation score, not to rewrite everything`;
        }
        break;
      case 'enhance-genre-fit':
        focusInstruction = 'Refine the concept to better match genre conventions and player expectations.';
        break;
    }

    let prompt = `You are refining a game concept with the following focus:\n\n${focusInstruction}\n\n`;

    if (specificInstructions) {
      prompt += `Additional instructions: ${specificInstructions}\n\n`;
    }

    if (preserveFields && preserveFields.length > 0) {
      prompt += `IMPORTANT: Do not change these fields: ${preserveFields.join(', ')}\n\n`;
    }

    prompt += `Current Mechanics:\n${JSON.stringify(mechanics, null, 2)}\n\n`;
    prompt += `Current Lore:\n${JSON.stringify(lore, null, 2)}\n\n`;
    prompt += `\n=== CRITICAL OUTPUT REQUIREMENT ===\n`;
    prompt += `You MUST respond with ONLY a valid JSON object. No markdown, no explanations, no text before or after.\n`;
    prompt += `\nThe JSON MUST have this exact structure:\n`;
    prompt += `{\n  "mechanics": { ...all mechanics fields from above, with your refinements... },\n  "lore": { ...all lore fields from above, with your refinements... }\n}\n\n`;
    prompt += `RULES:\n`;
    prompt += `- Start your response with { (opening brace)\n`;
    prompt += `- End your response with } (closing brace)\n`;
    prompt += `- Include ALL mechanics fields (even if unchanged)\n`;
    prompt += `- Include ALL lore fields (even if unchanged)\n`;
    prompt += `- Do NOT use markdown code blocks (no \`\`\`json)\n`;
    prompt += `- Do NOT add any text before or after the JSON\n`;
    prompt += `- Do NOT explain what you changed\n`;
    prompt += `\nYour response must be ONLY this JSON object, nothing else.`;

    return prompt;
  }

  /**
   * Get system message for refinement AI
   */
  private getRefinementSystemMessage(focus: RefinementFocus): string {
    return `You are an expert game designer specializing in ${focus.replace(/-/g, ' ')}. Your refinements should be thoughtful, preserve what works, and improve what doesn't. Always maintain internal consistency.

CRITICAL: You MUST respond with ONLY a valid JSON object containing exactly two fields: "mechanics" and "lore". Do not include any other fields, explanations, or text outside the JSON object.`;
  }

  /**
   * Parse AI refinement response
   * @param content - The AI response content
   * @param fallbackMechanics - Existing mechanics to use if model doesn't return mechanics
   * @param fallbackLore - Existing lore to use if model doesn't return lore
   */
  private parseRefinementResponse(
    content: string,
    fallbackMechanics?: MechanicsData,
    fallbackLore?: LoreData
  ): { mechanics: MechanicsData; lore: LoreData } {
    try {
      // Clean the response (remove markdown code blocks if present)
      let cleanedContent = content.trim();
      
      // For Qwen models, strip any chain-of-thought/reasoning patterns
      // Qwen sometimes outputs thinking tags or reasoning blocks
      cleanedContent = cleanedContent
        .replace(/<think>[\s\S]*?<\/think>/gi, '') // Remove <think> tags
        .replace(/\[REASONING\][\s\S]*?\[\/REASONING\]/gi, '') // Remove [REASONING] blocks
        .replace(/Let me think[\s\S]*?(?=\{)/gi, '') // Remove "Let me think..." prefixes
        .replace(/First, let me[\s\S]*?(?=\{)/gi, '') // Remove "First, let me..." prefixes
        .trim();
      
      // Try to extract JSON from markdown code blocks first
      // Handle both ```json and ``` formats
      // Find code block markers and extract the JSON between them
      let extractedJson: string | null = null;
      
      // Look for markdown code blocks
      const codeBlockStart = content.indexOf('```');
      if (codeBlockStart !== -1) {
        const afterStart = content.substring(codeBlockStart + 3);
        // Skip "json" if present
        const jsonStart = afterStart.match(/^(?:json)?\s*(\{)/);
        if (jsonStart) {
          const jsonStartIndex = codeBlockStart + 3 + (jsonStart[0].length - 1);
          // Find the matching closing ```
          const codeBlockEnd = content.indexOf('```', jsonStartIndex);
          if (codeBlockEnd !== -1) {
            // Extract JSON between the braces, tracking depth
            let jsonContent = '';
            let depth = 0;
            let inString = false;
            let escapeNext = false;
            
            for (let i = jsonStartIndex; i < codeBlockEnd; i++) {
              const char = content[i];
              
              if (escapeNext) {
                jsonContent += char;
                escapeNext = false;
                continue;
              }
              
              if (char === '\\') {
                jsonContent += char;
                escapeNext = true;
                continue;
              }
              
              if (char === '"' && !escapeNext) {
                jsonContent += char;
                inString = !inString;
                continue;
              }
              
              jsonContent += char;
              
              if (!inString) {
                if (char === '{') depth++;
                if (char === '}') {
                  depth--;
                  if (depth === 0) {
                    // Found complete JSON object
                    extractedJson = jsonContent;
                    break;
                  }
                }
              }
            }
            
            if (extractedJson) {
              logger.info('Extracted JSON from markdown code block', { 
                length: extractedJson.length,
                hasMechanics: extractedJson.includes('"mechanics"'),
                hasLore: extractedJson.includes('"lore"')
              });
            }
          }
        }
      }
      
      // If we found JSON in a code block, use it
      if (extractedJson) {
        cleanedContent = extractedJson.trim();
      } else {
        // Remove markdown code blocks (handle both ```json and ```)
        cleanedContent = cleanedContent.replace(/```json\n?/gi, '').replace(/```\n?/g, '');
        
        // Look for JSON object that contains both "mechanics" and "lore" keys
        // This handles cases where the model returns markdown with JSON embedded
        const mechanicsLoreJson = cleanedContent.match(/\{[^{]*"mechanics"[\s\S]*"lore"[\s\S]*\}/);
        if (mechanicsLoreJson) {
          cleanedContent = mechanicsLoreJson[0];
          logger.info('Extracted JSON object containing mechanics and lore from markdown');
        } else {
          // Remove common explanatory prefixes that models sometimes add
          // Look for patterns like "Based on your request..." or "Here is..." before JSON
          cleanedContent = cleanedContent.replace(/^[^{]*?(?=\{[^{]*"mechanics"|"lore")/i, '');
        }
      }
      
      // Try multiple strategies to find the correct JSON object
      // Strategy 1: Look for the top-level object containing both "mechanics" and "lore"
      let jsonStart = -1;
      let jsonEnd = -1;
      
      // First, try to find an object that contains both "mechanics" and "lore" keys
      const mechanicsIndex = cleanedContent.indexOf('"mechanics"');
      const loreIndex = cleanedContent.indexOf('"lore"');
      
      if (mechanicsIndex !== -1 && loreIndex !== -1) {
        // Find the opening brace before the first of these keys
        const firstKeyIndex = Math.min(mechanicsIndex, loreIndex);
        jsonStart = cleanedContent.lastIndexOf('{', firstKeyIndex);
        
        if (jsonStart === -1) {
          // If no brace before, look for the first brace in the content
          jsonStart = cleanedContent.indexOf('{');
        }
      } else {
        // Fallback: just find the first brace
        jsonStart = cleanedContent.indexOf('{');
      }
      
      if (jsonStart === -1) {
        logger.error('No JSON found in refinement response', { content: content.substring(0, 500) });
        throw new Error('No JSON found in response');
      }
      
      // Track bracket depth to find the matching closing brace
      let depth = 0;
      jsonEnd = jsonStart;
      let inString = false;
      let escapeNext = false;
      
      for (let i = jsonStart; i < cleanedContent.length; i++) {
        const char = cleanedContent[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }
        
        if (!inString) {
          if (char === '{') {
            depth++;
          } else if (char === '}') {
            depth--;
            if (depth === 0) {
              jsonEnd = i + 1;
              break;
            }
          }
        }
      }
      
      if (depth !== 0) {
        logger.error('Incomplete JSON object in refinement response', { content: content.substring(0, 500) });
        throw new Error('Incomplete JSON object in response');
      }
      
      cleanedContent = cleanedContent.substring(jsonStart, jsonEnd);
      
      // Clean up common JSON formatting issues before parsing
      // First, ensure we only have the JSON object (remove any trailing text)
      // Find the last closing brace that matches the first opening brace
      const firstBrace = cleanedContent.indexOf('{');
      const lastBrace = cleanedContent.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        // Extract only the JSON portion
        cleanedContent = cleanedContent.substring(firstBrace, lastBrace + 1);
      }
      
      // Fix single quotes to double quotes for property names (but be careful with apostrophes in strings)
      // Only replace single quotes around property names, not in string values
      cleanedContent = cleanedContent.replace(/([{,]\s*)'([^']+)'(\s*:)/g, '$1"$2"$3');
      // Fix trailing commas
      cleanedContent = cleanedContent.replace(/,(\s*[}\]])/g, '$1');
      // Remove comments (JSON doesn't support comments)
      cleanedContent = cleanedContent.replace(/\/\/.*$/gm, '');
      cleanedContent = cleanedContent.replace(/\/\*[\s\S]*?\*\//g, '');
      // Remove any text after the closing brace
      const closingBraceIndex = cleanedContent.lastIndexOf('}');
      if (closingBraceIndex !== -1) {
        cleanedContent = cleanedContent.substring(0, closingBraceIndex + 1);
      }
      
      // Parse JSON
      let parsed: any;
      try {
        parsed = JSON.parse(cleanedContent);
      } catch (parseError) {
        // If parsing fails, try to fix common issues and retry
        logger.warn('Initial JSON parse failed, attempting to fix and retry', {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          contentPreview: cleanedContent.substring(0, 500),
          errorPosition: parseError instanceof SyntaxError ? (parseError as any).position : undefined
        });
        
        // Try to fix the specific error position if available
        if (parseError instanceof SyntaxError) {
          const errorMsg = parseError.message;
          const positionMatch = errorMsg.match(/position (\d+)/);
          if (positionMatch) {
            const errorPos = parseInt(positionMatch[1], 10);
            const beforeError = cleanedContent.substring(0, errorPos);
            const atError = cleanedContent.substring(errorPos, Math.min(errorPos + 50, cleanedContent.length));
            logger.debug('JSON error context', {
              beforeError: beforeError.substring(Math.max(0, beforeError.length - 100)),
              atError,
              errorMessage: errorMsg
            });
          }
        }
        
        // Try to find and extract a valid JSON object by tracking braces properly
        // The regex approach doesn't work well for nested objects, so use brace tracking
        let bestJson: string | null = null;
        let jsonStartPos = cleanedContent.indexOf('{');
        
        while (jsonStartPos !== -1) {
          let depth = 0;
          let jsonEndPos = jsonStartPos;
          let inString = false;
          let escapeNext = false;
          
          for (let i = jsonStartPos; i < cleanedContent.length; i++) {
            const char = cleanedContent[i];
            
            if (escapeNext) {
              escapeNext = false;
              continue;
            }
            
            if (char === '\\') {
              escapeNext = true;
              continue;
            }
            
            if (char === '"' && !escapeNext) {
              inString = !inString;
              continue;
            }
            
            if (!inString) {
              if (char === '{') depth++;
              if (char === '}') {
                depth--;
                if (depth === 0) {
                  jsonEndPos = i + 1;
                  break;
                }
              }
            }
          }
          
          if (depth === 0 && jsonEndPos > jsonStartPos) {
            const candidateJson = cleanedContent.substring(jsonStartPos, jsonEndPos);
            try {
              // Try to fix and parse
              let fixed = candidateJson
                .replace(/([{,]\s*)'([^']+)'(\s*:)/g, '$1"$2"$3')
                .replace(/,(\s*[}\]])/g, '$1');
              const testParsed = JSON.parse(fixed);
              if (testParsed.mechanics && testParsed.lore) {
                bestJson = fixed;
                parsed = testParsed;
                logger.info('Found valid JSON with both mechanics and lore using brace tracking');
                break;
              } else if (!bestJson) {
                // Keep as fallback
                bestJson = fixed;
                parsed = testParsed;
              }
            } catch {
              // Try next JSON object
            }
          }
          
          // Find next potential JSON start
          jsonStartPos = cleanedContent.indexOf('{', jsonStartPos + 1);
        }
        
        // If we found a JSON object but it doesn't have mechanics/lore, try to reconstruct
        if (parsed && (!parsed.mechanics || !parsed.lore)) {
          logger.warn('Found JSON but missing mechanics or lore, will use reconstruction logic');
        }
        
        if (!parsed) {
          // Log the problematic content for debugging
          logger.error('Failed to parse JSON after all attempts', {
            originalError: parseError instanceof Error ? parseError.message : String(parseError),
            contentLength: cleanedContent.length,
            contentPreview: cleanedContent.substring(0, 1000),
            firstBrace: cleanedContent.indexOf('{'),
            lastBrace: cleanedContent.lastIndexOf('}')
          });
          throw parseError;
        }
      }
      
      // Validate that we got meaningful content
      if (!parsed || (typeof parsed === 'object' && Object.keys(parsed).length === 0)) {
        logger.error('Empty or invalid content in refinement response', { 
          parsed,
          contentPreview: cleanedContent.substring(0, 500)
        });
        throw new Error('Empty or invalid content in AI response');
      }
      
      // Log what we actually got for debugging
      logger.debug('Parsed refinement response', { 
        keys: Object.keys(parsed),
        hasMechanics: !!parsed.mechanics,
        hasLore: !!parsed.lore,
        mechanicsType: typeof parsed.mechanics,
        loreType: typeof parsed.lore,
        mechanicsKeys: parsed.mechanics && typeof parsed.mechanics === 'object' ? Object.keys(parsed.mechanics) : null,
        loreKeys: parsed.lore && typeof parsed.lore === 'object' ? Object.keys(parsed.lore) : null,
      });
      
      // Handle case where model returns only lore fields directly (not wrapped in "lore" key)
      // Sometimes models return {themes: ..., setting: ..., conflict: ...} instead of {mechanics: ..., lore: {...}}
      if (parsed.mechanics === undefined || parsed.mechanics === null) {
        // Check if the parsed object contains lore fields directly (themes, setting, conflict, protagonist, etc.)
        const loreFieldNames = ['themes', 'setting', 'conflict', 'protagonist', 'worldRules', 'progression', 'narrative'];
        const hasLoreFields = loreFieldNames.some(field => parsed[field] !== undefined);
        
        if (hasLoreFields && !parsed.mechanics) {
          // Model returned lore fields directly, not wrapped in {mechanics: ..., lore: ...}
          // Reconstruct the proper structure using fallback mechanics and wrapping lore fields
          logger.warn('Model returned lore fields directly without mechanics wrapper - reconstructing response', { 
            keys: Object.keys(parsed),
            hasLoreFields,
            usingFallbackMechanics: !!fallbackMechanics
          });
          
          // Use existing mechanics as fallback (model didn't provide new ones)
          const mechanics = fallbackMechanics || {};
          
          // Wrap the lore fields into a proper lore object
          const lore: LoreData = {
            themes: parsed.themes,
            setting: parsed.setting,
            conflict: parsed.conflict,
            protagonist: parsed.protagonist || parsed.protagon, // Handle typo in model response
            worldRules: parsed.worldRules,
            progression: parsed.progression,
            narrative: parsed.narrative,
            // Preserve any other lore fields from fallback that weren't in the response
            ...(fallbackLore && typeof fallbackLore === 'object' ? fallbackLore : {}),
          };
          
          // Remove undefined fields
          Object.keys(lore).forEach(key => {
            if (lore[key as keyof LoreData] === undefined) {
              delete lore[key as keyof LoreData];
            }
          });
          
          logger.info('Successfully reconstructed response from malformed model output', {
            mechanicsKeys: Object.keys(mechanics),
            loreKeys: Object.keys(lore)
          });
          
          return {
            mechanics: mechanics as MechanicsData,
            lore: lore as LoreData,
          };
        } else {
          // No lore fields found either - this is a real error
          if (!fallbackMechanics) {
            throw new Error('Response missing required mechanics field');
          }
          // Use fallback mechanics and lore
          logger.warn('Model response missing mechanics, using fallback', {
            keys: Object.keys(parsed)
          });
          return {
            mechanics: fallbackMechanics,
            lore: (parsed.lore || fallbackLore || {}) as LoreData,
          };
        }
      }
      
      if (parsed.lore === undefined || parsed.lore === null) {
        logger.error('Missing lore in refinement response', { 
          keys: Object.keys(parsed),
          parsedPreview: JSON.stringify(parsed).substring(0, 500)
        });
        throw new Error('Response missing required lore field');
      }
      
      // Ensure mechanics and lore are objects (even if empty)
      const mechanics = typeof parsed.mechanics === 'object' && parsed.mechanics !== null 
        ? parsed.mechanics 
        : {};
      const lore = typeof parsed.lore === 'object' && parsed.lore !== null 
        ? parsed.lore 
        : {};
      
      return {
        mechanics: mechanics as MechanicsData,
        lore: lore as LoreData,
      };
    } catch (error) {
      logger.error('Failed to parse AI response in refinement service', { 
        error: error instanceof Error ? error.message : String(error),
        contentPreview: content.substring(0, 1000)
      });
      throw new Error(`Failed to parse refinement response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect changes between two concept versions
   */
  private detectChanges(
    oldMechanics: MechanicsData,
    oldLore: LoreData,
    newMechanics: MechanicsData,
    newLore: LoreData
  ): ChangeLog[] {
    const changes: ChangeLog[] = [];

    // Check mechanics changes
    for (const key of Object.keys(newMechanics)) {
      if (JSON.stringify((oldMechanics as any)[key]) !== JSON.stringify((newMechanics as any)[key])) {
        changes.push({
          field: `mechanics.${key}`,
          changeType: (oldMechanics as any)[key] === undefined ? 'added' : 'modified',
          before: (oldMechanics as any)[key],
          after: (newMechanics as any)[key],
        });
      }
    }

    // Check for removed mechanics fields
    for (const key of Object.keys(oldMechanics)) {
      if ((newMechanics as any)[key] === undefined) {
        changes.push({
          field: `mechanics.${key}`,
          changeType: 'removed',
          before: (oldMechanics as any)[key],
        });
      }
    }

    // Check lore changes
    for (const key of Object.keys(newLore)) {
      if (JSON.stringify((oldLore as any)[key]) !== JSON.stringify((newLore as any)[key])) {
        changes.push({
          field: `lore.${key}`,
          changeType: (oldLore as any)[key] === undefined ? 'added' : 'modified',
          before: (oldLore as any)[key],
          after: (newLore as any)[key],
        });
      }
    }

    // Check for removed lore fields
    for (const key of Object.keys(oldLore)) {
      if ((newLore as any)[key] === undefined) {
        changes.push({
          field: `lore.${key}`,
          changeType: 'removed',
          before: (oldLore as any)[key],
        });
      }
    }

    return changes;
  }

  /**
   * Generate human-readable change summary
   */
  private generateChangeSummary(changes: ChangeLog[]): string {
    const added = changes.filter(c => c.changeType === 'added').length;
    const modified = changes.filter(c => c.changeType === 'modified').length;
    const removed = changes.filter(c => c.changeType === 'removed').length;

    return `${added} fields added, ${modified} fields modified, ${removed} fields removed`;
  }
}

