/**
 * Assistant Service
 * Handles project-level chat sessions, proposals, and application of AI suggestions
 */

import type { Prisma, PrismaClient } from '@prisma/client';
import type { MechanicsData, LoreData } from '@gameforge/shared';
import { AIOrchestrator } from '../ai/orchestrator.js';
import { architectService } from '../architect/architect-service.js';
import { logger } from '../../utils/logger.js';

type SessionType = 'concept' | 'architect';

interface AssistantContext {
  project: {
    id: string;
    name: string;
    genre?: string | null;
  };
  latestVersion?: {
    id: string;
    version: number;
    mechanics: MechanicsData;
    lore: LoreData;
  };
  validationIssues: Array<{
    rule: string;
    severity: string;
    message: string;
  }>;
  architect?: {
    interviewComplete?: boolean;
    documents?: Array<{ name: string; snippet: string }>;
  };
}

interface AssistantModelResponse {
  reply: string;
  proposal?: {
    targetVersionId?: string;
    mechanics?: MechanicsData;
    lore?: LoreData;
    architectDocuments?: Array<{ name: string; content: string }>;
  };
}

export class AssistantService {
  constructor(
    private prisma: PrismaClient,
    private aiOrchestrator: AIOrchestrator
  ) {}

  async getOrCreateSession(projectId: string, type: SessionType = 'concept') {
    const existing = await this.prisma.chatSession.findFirst({
      where: { projectId, type },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) {
      return existing;
    }
    return this.prisma.chatSession.create({
      data: {
        projectId,
        type,
        metadata: {},
      },
    });
  }

  async getSession(sessionId: string) {
    return this.prisma.chatSession.findUnique({ where: { id: sessionId } });
  }

  async getMessages(sessionId: string) {
    return this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async listPendingProposals(sessionId: string) {
    return this.prisma.assistantProposal.findMany({
      where: { sessionId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async sendMessage(sessionId: string, content: string) {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content,
      },
    });

    const context = await this.buildContext(session);
    const previousMessages = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 15,
    });

    const aiMessages = [
      {
        role: 'system' as const,
        content: this.buildSystemPrompt(session.type as SessionType, context),
      },
      ...previousMessages.map((msg) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: JSON.stringify({
          userMessage: content,
          context,
          instructions: 'Respond using the required JSON schema.',
        }),
      },
    ];

    const aiResponse = await this.aiOrchestrator.generate(
      'assistant',
      aiMessages,
      'ollama',
      { maxTokens: 3000 }
    );

    const parsed = this.parseAssistantResponse(aiResponse.content);
    const assistantMessage = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: parsed.reply,
        metadata: {
          model: aiResponse.model,
        },
      },
    });

    let createdProposal: Awaited<ReturnType<typeof this.prisma.assistantProposal.create>> | null = null;
    if (parsed.proposal && (parsed.proposal.mechanics || parsed.proposal.lore || parsed.proposal.architectDocuments)) {
      createdProposal = await this.createProposal(session, parsed.proposal);
    }

    return {
      message: assistantMessage,
      proposal: createdProposal,
    };
  }

  async applyProposal(proposalId: string) {
    const proposal = await this.prisma.assistantProposal.findUnique({
      where: { id: proposalId },
    });
    if (!proposal) {
      throw new Error('Proposal not found');
    }
    if (proposal.status !== 'pending') {
      throw new Error('Proposal already processed');
    }

    const payload = proposal.payload as any;
    let result: any = null;

    if (proposal.proposalType === 'concept-update') {
      const latestVersion = await this.getLatestVersion(proposal.projectId);
      if (!latestVersion) {
        throw new Error('No concept version available for this project');
      }

      const newMechanics = payload.mechanics || (latestVersion.mechanics as MechanicsData);
      const newLore = payload.lore || (latestVersion.lore as LoreData);

      const newVersion = await this.prisma.version.create({
        data: {
          projectId: latestVersion.projectId,
          version: latestVersion.version + 1,
          title: latestVersion.title,
          mechanics: newMechanics as Prisma.JsonObject,
          lore: newLore as Prisma.JsonObject,
          metadata: {
            ...((latestVersion.metadata as Prisma.JsonObject) || {}),
            assistantProposalId: proposal.id,
            refinedFrom: latestVersion.id,
            refinementFocus: 'assistant',
          },
        },
      });

      await this.prisma.aiGeneration.create({
        data: {
          conceptId: newVersion.id,
          taskType: 'assistant',
          modelUsed: 'ollama-qwen3',
          prompt: 'assistant-proposal',
          response: JSON.stringify(payload),
          tokensUsed: null,
        },
      });

      result = { newVersion };
    }

    if (proposal.proposalType === 'architect-document' && payload.architectDocuments) {
      const updated = architectService.applyAssistantUpdates(
        proposal.projectId,
        payload.architectDocuments
      );
      result = { documentation: updated };
    }

    await this.prisma.assistantProposal.update({
      where: { id: proposal.id },
      data: {
        status: 'accepted',
        resolvedAt: new Date(),
      },
    });

    return result;
  }

  async rejectProposal(proposalId: string) {
    await this.prisma.assistantProposal.update({
      where: { id: proposalId },
      data: {
        status: 'rejected',
        resolvedAt: new Date(),
      },
    });
  }

  private async buildContext(session: { projectId: string; type: string }): Promise<AssistantContext> {
    const project = await this.prisma.project.findUnique({
      where: { id: session.projectId },
    });
    const latestVersion = await this.getLatestVersion(session.projectId);
    const validationIssues = latestVersion
      ? await this.prisma.validationResult.findMany({
          where: { conceptId: latestVersion.id, dismissed: false },
          orderBy: [
            { severity: 'asc' },
            { createdAt: 'desc' },
          ],
          take: 10,
        })
      : [];

    let architectData: AssistantContext['architect'] = undefined;
    if (session.type === 'architect') {
      const documentation = architectService.getDocumentation(session.projectId);
      architectData = {
        interviewComplete: !!documentation,
        documents: documentation
          ? documentation.documents.map((doc) => ({
              name: doc.templateName,
              snippet: doc.content.substring(0, 400),
            }))
          : undefined,
      };
    }

    return {
      project: {
        id: project?.id || session.projectId,
        name: project?.name || 'Untitled Project',
        genre: project?.genre,
      },
      latestVersion: latestVersion
        ? {
            id: latestVersion.id,
            version: latestVersion.version,
            mechanics: latestVersion.mechanics as MechanicsData,
            lore: latestVersion.lore as LoreData,
          }
        : undefined,
      validationIssues: validationIssues.map((issue) => ({
        rule: issue.ruleName,
        severity: issue.severity,
        message: issue.message,
      })),
      architect: architectData,
    };
  }

  private buildSystemPrompt(type: SessionType, context: AssistantContext) {
    const baseInstructions = [
      'You are the GameForge Studio project assistant.',
      'All replies must be JSON with the schema:',
      '{ "reply": "string", "proposal": { "targetVersionId": "optional", "mechanics": {}, "lore": {}, "architectDocuments": [{ "name": "", "content": "" }] } }',
      'If you suggest mechanics or lore changes, include the full updated objects.',
      'Do not modify game data directly—only propose changes.',
    ];

    if (type === 'architect') {
      baseInstructions.push(
        'You are currently assisting with the Project Architect phase.',
        'You may propose document edits by including architectDocuments array.'
      );
    } else {
      baseInstructions.push(
        'Focus on improving mechanics and lore alignment.',
        'Reference validation issues if available.'
      );
    }

    baseInstructions.push(`Project name: ${context.project.name}`);
    if (context.latestVersion) {
      baseInstructions.push(
        `Latest mechanics JSON: ${JSON.stringify(context.latestVersion.mechanics)}`,
        `Latest lore JSON: ${JSON.stringify(context.latestVersion.lore)}`
      );
    }

    return baseInstructions.join('\n');
  }

  private parseAssistantResponse(content: string): AssistantModelResponse {
    let cleaned = content.trim();
    cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '');
    const match = cleaned.match(/\{[\s\S]*\}/);
    const jsonSegment = match ? match[0] : cleaned;

    try {
      const parsed = JSON.parse(jsonSegment);
      return {
        reply: parsed.reply || 'I have processed your request.',
        proposal: parsed.proposal,
      };
    } catch (error) {
      logger.error('Failed to parse assistant response', {
        contentPreview: cleaned.substring(0, 200),
        error,
      });
      return {
        reply: cleaned,
      };
    }
  }

  private async createProposal(
    session: { id: string; projectId: string },
    proposal: AssistantModelResponse['proposal']
  ) {
    const latestVersion = await this.getLatestVersion(session.projectId);
    const baseMechanics = (latestVersion?.mechanics || {}) as MechanicsData;
    const baseLore = (latestVersion?.lore || {}) as LoreData;
    const newMechanics = proposal?.mechanics || baseMechanics;
    const newLore = proposal?.lore || baseLore;

    const changeLog = [
      ...this.detectChanges(baseMechanics, newMechanics, 'mechanics'),
      ...this.detectChanges(baseLore, newLore, 'lore'),
    ];

    const payload = {
      mechanics: proposal?.mechanics,
      lore: proposal?.lore,
      architectDocuments: proposal?.architectDocuments,
    };

    const proposalType = proposal?.architectDocuments ? 'architect-document' : 'concept-update';

    return this.prisma.assistantProposal.create({
      data: {
        sessionId: session.id,
        projectId: session.projectId,
        conceptId: latestVersion?.id,
        proposalType,
        payload,
        changeLog,
      },
    });
  }

  private detectChanges(oldData: any, newData: any, prefix: string) {
    const changes: Array<{
      field: string;
      changeType: 'added' | 'modified' | 'removed';
      before?: any;
      after?: any;
    }> = [];

    const oldKeys = new Set(Object.keys(oldData || {}));
    const newKeys = new Set(Object.keys(newData || {}));
    for (const key of newKeys) {
      if (!oldKeys.has(key)) {
        changes.push({
          field: `${prefix}.${key}`,
          changeType: 'added',
          after: newData[key],
        });
      } else if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        changes.push({
          field: `${prefix}.${key}`,
          changeType: 'modified',
          before: oldData[key],
          after: newData[key],
        });
      }
    }

    for (const key of oldKeys) {
      if (!newKeys.has(key)) {
        changes.push({
          field: `${prefix}.${key}`,
          changeType: 'removed',
          before: oldData[key],
        });
      }
    }

    return changes;
  }

  private async getLatestVersion(projectId: string) {
    return this.prisma.version.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' },
    });
  }
}

export function getAssistantService(prisma: PrismaClient, orchestrator: AIOrchestrator) {
  return new AssistantService(prisma, orchestrator);
}
