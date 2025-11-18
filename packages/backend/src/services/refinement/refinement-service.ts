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

    // 2. Generate refinement prompt based on focus
    const refinementPrompt = this.buildRefinementPrompt(
      existingVersion.mechanics as MechanicsData,
      existingVersion.lore as LoreData,
      request.focus,
      request.specificInstructions,
      request.preserveFields
    );

    // 3. Call AI to refine
    const aiResponse = await this.aiOrchestrator.generate(
      'refinement',
      [
        { role: 'system', content: this.getRefinementSystemMessage(request.focus) },
        { role: 'user', content: refinementPrompt },
      ],
      'auto'
    );

    // Parse AI response
    const refined = this.parseRefinementResponse(aiResponse.content);

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
    preserveFields?: string[]
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
        focusInstruction = `CRITICALLY IMPORTANT: Improve consistency and alignment between mechanics and lore. Your goal is to fix inconsistencies and improve the validation score.

SPECIFIC CONSISTENCY REQUIREMENTS:
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

ACTIVELY FIX INCONSISTENCIES: Don't just preserve what exists - actively identify and fix misalignments. Add missing lore elements to justify mechanics, or modify mechanics to match existing lore. The goal is a higher consistency score.`;
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
    prompt += `Provide refined versions of both mechanics and lore as JSON.\n`;
    prompt += `CRITICAL: You MUST return a JSON object with exactly these two fields: "mechanics" and "lore".\n`;
    prompt += `The JSON structure must be:\n`;
    prompt += `{\n  "mechanics": { ...your refined mechanics object... },\n  "lore": { ...your refined lore object... }\n}\n\n`;
    prompt += `Output ONLY valid JSON, no markdown formatting, no explanations, no reasoning, no chain of thought. Just the JSON object starting with { and ending with }.`;

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
   */
  private parseRefinementResponse(content: string): { mechanics: MechanicsData; lore: LoreData } {
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
      
      // Remove markdown code blocks
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/```\n?/g, '');
      }
      
      // Try to extract JSON if wrapped in text
      // Find the first complete JSON object by tracking bracket depth
      let jsonStart = cleanedContent.indexOf('{');
      if (jsonStart === -1) {
        logger.error('No JSON found in refinement response', { content: content.substring(0, 500) });
        throw new Error('No JSON found in response');
      }
      
      // Track bracket depth to find the matching closing brace
      let depth = 0;
      let jsonEnd = jsonStart;
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
      
      // Parse JSON
      const parsed = JSON.parse(cleanedContent);
      
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
      
      // Ensure we have mechanics and lore
      // Handle cases where they might be empty objects (which is valid)
      if (parsed.mechanics === undefined || parsed.mechanics === null) {
        logger.error('Missing mechanics in refinement response', { 
          keys: Object.keys(parsed),
          parsedPreview: JSON.stringify(parsed).substring(0, 500)
        });
        throw new Error('Response missing required mechanics field');
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
