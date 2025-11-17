/**
 * Refinement Service
 * Handles iterative improvement of game concepts with version tracking
 */

import type { MechanicsData, LoreData, RefinementFocus } from '@gameforge/shared';
import { PrismaClient } from '@prisma/client';
import { AIOrchestrator } from '../ai/orchestrator.js';

export interface RefinementRequest {
  conceptId: string;
  focus: RefinementFocus;
  specificInstructions?: string;
  preserveFields?: string[]; // Fields that should not be changed
}

export interface RefinementResult {
  newConceptId: string;
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
    // 1. Get existing concept
    const existingConcept = await this.prisma.concept.findUnique({
      where: { id: request.conceptId },
    });

    if (!existingConcept) {
      throw new Error(`Concept not found: ${request.conceptId}`);
    }

    // 2. Generate refinement prompt based on focus
    const refinementPrompt = this.buildRefinementPrompt(
      existingConcept.mechanics as MechanicsData,
      existingConcept.lore as LoreData,
      request.focus,
      request.specificInstructions,
      request.preserveFields
    );

    // 3. Call AI to refine
    const aiResponse = await this.aiOrchestrator.route({
      taskType: 'refinement',
      systemMessage: this.getRefinementSystemMessage(request.focus),
      userMessage: refinementPrompt,
      modelPreference: 'auto',
    });

    // Parse AI response
    const refined = this.parseRefinementResponse(aiResponse.content);

    // 4. Track changes
    const changes = this.detectChanges(
      existingConcept.mechanics as MechanicsData,
      existingConcept.lore as LoreData,
      refined.mechanics,
      refined.lore
    );

    // 5. Create new concept version
    const newConcept = await this.prisma.concept.create({
      data: {
        projectId: existingConcept.projectId,
        version: existingConcept.version + 1,
        title: existingConcept.title,
        mechanics: refined.mechanics as any,
        lore: refined.lore as any,
        metadata: {
          ...existingConcept.metadata,
          aiModel: aiResponse.modelUsed,
          userEdited: false,
          refinedFrom: request.conceptId,
          refinementFocus: request.focus,
        } as any,
      },
    });

    // 6. Log AI generation
    await this.prisma.aiGeneration.create({
      data: {
        conceptId: newConcept.id,
        taskType: 'refinement',
        modelUsed: aiResponse.modelUsed,
        prompt: refinementPrompt,
        response: aiResponse.content,
        tokensUsed: aiResponse.tokensUsed,
        costUsd: aiResponse.cost,
        durationMs: aiResponse.duration,
      },
    });

    return {
      newConceptId: newConcept.id,
      newVersion: newConcept.version,
      previousVersion: existingConcept.version,
      mechanics: refined.mechanics,
      lore: refined.lore,
      changesApplied: changes,
    };
  }

  /**
   * Get version history for a project
   */
  async getVersionHistory(projectId: string) {
    const concepts = await this.prisma.concept.findMany({
      where: { projectId },
      orderBy: { version: 'asc' },
    });

    return concepts.map(c => ({
      id: c.id,
      version: c.version,
      createdAt: c.createdAt,
      refinedFrom: (c.metadata as any)?.refinedFrom,
      refinementFocus: (c.metadata as any)?.refinementFocus,
      aiModel: (c.metadata as any)?.aiModel,
    }));
  }

  /**
   * Compare two concept versions
   */
  async compareVersions(conceptId1: string, conceptId2: string) {
    const [concept1, concept2] = await Promise.all([
      this.prisma.concept.findUnique({ where: { id: conceptId1 } }),
      this.prisma.concept.findUnique({ where: { id: conceptId2 } }),
    ]);

    if (!concept1 || !concept2) {
      throw new Error('One or both concepts not found');
    }

    const changes = this.detectChanges(
      concept1.mechanics as MechanicsData,
      concept1.lore as LoreData,
      concept2.mechanics as MechanicsData,
      concept2.lore as LoreData
    );

    return {
      version1: concept1.version,
      version2: concept2.version,
      changes,
      summary: this.generateChangeSummary(changes),
    };
  }

  /**
   * Rollback to a previous version
   */
  async rollbackToVersion(projectId: string, targetVersion: number) {
    // Find the target version
    const targetConcept = await this.prisma.concept.findFirst({
      where: {
        projectId,
        version: targetVersion,
      },
    });

    if (!targetConcept) {
      throw new Error(`Version ${targetVersion} not found for project ${projectId}`);
    }

    // Get highest current version
    const latestConcept = await this.prisma.concept.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' },
    });

    const newVersion = (latestConcept?.version || 0) + 1;

    // Create new version with old content
    const rolledBackConcept = await this.prisma.concept.create({
      data: {
        projectId,
        version: newVersion,
        title: targetConcept.title,
        mechanics: targetConcept.mechanics,
        lore: targetConcept.lore,
        metadata: {
          ...targetConcept.metadata,
          rolledBackFrom: latestConcept?.id,
          rolledBackToVersion: targetVersion,
          userEdited: false,
        } as any,
      },
    });

    return {
      newVersion,
      rolledBackFrom: latestConcept?.version,
      rolledBackTo: targetVersion,
      conceptId: rolledBackConcept.id,
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
        focusInstruction = 'Improve alignment between mechanics and lore. Ensure all gameplay elements have narrative justification.';
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
    prompt += `Provide refined versions of both mechanics and lore as JSON:\n`;
    prompt += `{\n  "mechanics": {...},\n  "lore": {...}\n}`;

    return prompt;
  }

  /**
   * Get system message for refinement AI
   */
  private getRefinementSystemMessage(focus: RefinementFocus): string {
    return `You are an expert game designer specializing in ${focus.replace(/-/g, ' ')}. Your refinements should be thoughtful, preserve what works, and improve what doesn't. Always maintain internal consistency.`;
  }

  /**
   * Parse AI refinement response
   */
  private parseRefinementResponse(content: string): { mechanics: MechanicsData; lore: LoreData } {
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        mechanics: parsed.mechanics,
        lore: parsed.lore,
      };
    } catch (error) {
      console.error('[RefinementService] Failed to parse AI response:', error);
      throw new Error('Failed to parse refinement response');
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
