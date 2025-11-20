/**
 * Assistant Service
 * Handles project-level chat sessions, proposals, and application of AI suggestions
 */

import type { Prisma, PrismaClient } from '@prisma/client';
import type { MechanicsData, LoreData } from '@gameforge/shared';
import { AIOrchestrator } from '../ai/orchestrator.js';
import { architectService } from '../architect/architect-service.js';
import { INTERVIEW_QUESTIONS, getNextQuestion } from '../architect/interview-questions.js';
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
    interviewProgress?: {
      completionPercentage: number;
      currentPhase: string;
      currentQuestion: {
        id: string;
        question: string;
        helpText?: string;
        options?: string[];
      } | null;
      answeredCount: number;
      totalQuestions: number;
    };
  };
}

interface AssistantModelResponse {
  reply: string;
  proposal?: {
    explanation?: string;
    targetVersionId?: string;
    mechanics?: MechanicsData;
    lore?: LoreData;
    architectDocuments?: Array<{ name: string; content: string }>;
  };
}

export class AssistantService {
  // Track interview sessions per assistant session
  private interviewSessions: Map<string, string> = new Map(); // assistantSessionId -> interviewSessionId

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
    try {
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

      // For architect sessions, handle interview flow
      // Note: We'll handle this after getting the AI response so we can extract answers better

      const context = await this.buildContext({ ...session, id: sessionId });
    const previousMessages = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 15,
    });

    const aiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system' as const,
        content: this.buildSystemPrompt(session.type as SessionType, context),
      },
      ...previousMessages.map((msg) => ({
        role: (msg.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: JSON.stringify({
          userMessage: content,
          context,
          instructions: [
            'Respond using the required JSON schema: { "reply": "string", "proposal": { "explanation": "string", "mechanics": {}, "lore": {}, "architectDocuments": [] } }',
            '',
            'CRITICAL PROPOSAL REQUIREMENT:',
            'If the user asks for a plan, implementation, "do it", "go ahead", "create", "make changes", "please make", "generate", or anything they can approve, you MUST include a proposal object with actual data.',
            '',
            'The proposal object MUST contain:',
            '- "explanation": A string describing what the proposal does',
            '- "mechanics": A complete mechanics object (if proposing mechanics changes)',
            '- "lore": A complete lore object (if proposing lore changes)',
            '',
            'DO NOT:',
            '- Return {proposal: null} or {proposal: {}}',
            '- Just say "I will create..." without actually including the proposal',
            '- Include only an explanation without mechanics/lore objects',
            '',
            'DO:',
            '- Include the full, complete mechanics and/or lore objects in the proposal',
            '- Make sure proposal.mechanics and proposal.lore contain actual JSON data, not empty objects',
            '- If proposing both mechanics and lore, include both objects',
          ].join('\n'),
        }),
      },
    ];

      logger.debug('Sending message to AI orchestrator', {
        sessionId,
        messageLength: content.length,
        contextHasVersion: !!context.latestVersion,
        messageCount: aiMessages.length,
      });

    const aiResponse = await this.aiOrchestrator.generate(
      'assistant',
      aiMessages,
      'auto', // Will use GLM 4.6 if available, otherwise falls back to Ollama
      { maxTokens: 3000 }
    );

      logger.debug('AI response received', {
        sessionId,
        model: aiResponse.model,
        contentLength: aiResponse.content.length,
      });

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

      // For architect sessions, handle interview flow after getting response
      if (session.type === 'architect') {
        await this.handleArchitectInterview(sessionId, session.projectId, content);
      }

    let createdProposal: Awaited<ReturnType<typeof this.prisma.assistantProposal.create>> | null = null;
    
    // Check if user is requesting a proposal/action
    const userWantsProposal = /(do it|go ahead|create|make changes|generate|implement|apply|proposal|approve|please make)/i.test(content);
    
    // Log what we got from parsing
    logger.info('Parsed assistant response', {
      sessionId,
      hasProposal: !!parsed.proposal,
      proposalType: typeof parsed.proposal,
      proposalKeys: parsed.proposal && typeof parsed.proposal === 'object' ? Object.keys(parsed.proposal) : [],
      hasMechanics: !!(parsed.proposal && typeof parsed.proposal === 'object' && parsed.proposal.mechanics),
      hasLore: !!(parsed.proposal && typeof parsed.proposal === 'object' && parsed.proposal.lore),
      hasArchitectDocuments: !!(parsed.proposal && typeof parsed.proposal === 'object' && parsed.proposal.architectDocuments),
      userWantsProposal,
      aiResponsePreview: aiResponse.content.substring(0, 1000),
    });
    
    if (parsed.proposal && typeof parsed.proposal === 'object' && (parsed.proposal.mechanics || parsed.proposal.lore || parsed.proposal.architectDocuments)) {
      logger.info('Creating proposal from AI response', {
        sessionId,
        hasMechanics: !!parsed.proposal.mechanics,
        hasLore: !!parsed.proposal.lore,
        hasArchitectDocuments: !!parsed.proposal.architectDocuments,
      });
      createdProposal = await this.createProposal(session, parsed.proposal);
    } else if (userWantsProposal) {
      // User asked for action but no proposal was generated
      logger.warn('User requested proposal but AI did not generate one', {
        sessionId,
        userMessage: content,
        hasProposal: !!parsed.proposal,
        proposalType: typeof parsed.proposal,
        proposalKeys: parsed.proposal && typeof parsed.proposal === 'object' ? Object.keys(parsed.proposal) : [],
        aiResponsePreview: aiResponse.content.substring(0, 1000),
        parsedReplyPreview: parsed.reply?.substring(0, 500),
      });
    }

    return {
      message: assistantMessage,
      proposal: createdProposal,
    };
    } catch (error) {
      logger.error('Error in sendMessage', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        sessionId,
      });
      throw error;
    }
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

      // Use proposal mechanics/lore if provided, otherwise merge with existing
      // The proposal should contain complete objects, but we'll merge to be safe
      const baseMechanics = (latestVersion.mechanics || {}) as MechanicsData;
      const baseLore = (latestVersion.lore || {}) as LoreData;
      
      const newMechanics = payload.mechanics && Object.keys(payload.mechanics).length > 0
        ? (payload.mechanics as MechanicsData)
        : baseMechanics;
      const newLore = payload.lore && Object.keys(payload.lore).length > 0
        ? (payload.lore as LoreData)
        : baseLore;

      // Validate that we actually have changes
      if (!payload.mechanics && !payload.lore) {
        logger.warn('Proposal accepted but contains no mechanics or lore changes', {
          proposalId: proposal.id,
          hasMechanics: !!payload.mechanics,
          hasLore: !!payload.lore,
        });
        throw new Error('Proposal contains no mechanics or lore changes to apply');
      }

      logger.info('Applying proposal to create new version', {
        proposalId: proposal.id,
        projectId: proposal.projectId,
        currentVersion: latestVersion.version,
        newVersionNumber: latestVersion.version + 1,
        hasMechanics: !!newMechanics && Object.keys(newMechanics).length > 0,
        hasLore: !!newLore && Object.keys(newLore).length > 0,
      });

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

      logger.info('New version created from proposal', {
        newVersionId: newVersion.id,
        newVersionNumber: newVersion.version,
        proposalId: proposal.id,
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

  private async buildContext(session: { id: string; projectId: string; type: string }): Promise<AssistantContext> {
    try {
    const project = await this.prisma.project.findUnique({
      where: { id: session.projectId },
    });
      
      if (!project) {
        logger.warn('Project not found when building context', { projectId: session.projectId });
      }

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
        try {
      const documentation = architectService.getDocumentation(session.projectId);
          const interviewSessionId = this.interviewSessions.get(session.id);
          let interviewProgress = null;
          let currentQuestion = null;
          
          if (interviewSessionId) {
            try {
              interviewProgress = architectService.getSessionProgress(interviewSessionId);
              const answersMap = new Map<string, string | string[]>();
              interviewProgress.session.answers.forEach((a) => answersMap.set(a.questionId, a.answer));
              currentQuestion = getNextQuestion(answersMap);
            } catch (err) {
              logger.warn('Error getting interview progress', {
                error: err instanceof Error ? err.message : String(err),
                interviewSessionId,
              });
            }
          }

      architectData = {
        interviewComplete: !!documentation,
        documents: documentation
          ? documentation.documents.map((doc) => ({
                  name: doc.templateName || 'Untitled Document',
                  snippet: doc.content ? doc.content.substring(0, 400) : '',
            }))
          : undefined,
            interviewProgress: interviewProgress ? {
              completionPercentage: interviewProgress.completionPercentage,
              currentPhase: interviewProgress.currentPhase,
              currentQuestion: currentQuestion ? {
                id: currentQuestion.id,
                question: currentQuestion.question,
                helpText: currentQuestion.helpText,
                options: currentQuestion.options,
              } : null,
              answeredCount: interviewProgress.session.answers.length,
              totalQuestions: INTERVIEW_QUESTIONS.length,
            } : undefined,
          };
        } catch (err) {
          logger.warn('Error getting architect documentation', {
            error: err instanceof Error ? err.message : String(err),
            projectId: session.projectId,
          });
        }
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
              mechanics: (latestVersion.mechanics || {}) as MechanicsData,
              lore: (latestVersion.lore || {}) as LoreData,
          }
        : undefined,
      validationIssues: validationIssues.map((issue) => ({
        rule: issue.ruleName,
        severity: issue.severity,
        message: issue.message,
      })),
      architect: architectData,
    };
    } catch (error) {
      logger.error('Error building context', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId: session.projectId,
        sessionType: session.type,
      });
      throw error;
    }
  }

  private buildSystemPrompt(type: SessionType, context: AssistantContext) {
    const baseInstructions = [
      'You are the GameForge Studio project assistant.',
      'All replies must be JSON with the schema:',
      '{ "reply": "string", "proposal": { "explanation": "string", "targetVersionId": "optional", "mechanics": {}, "lore": {}, "architectDocuments": [{ "name": "", "content": "" }] } }',
      'If you suggest mechanics or lore changes, include the full updated objects.',
      'Do not modify game data directly—only propose changes.',
      'Always include a clear explanation in the proposal.explanation field describing what improvements will be made and why they benefit the game.',
    ];

    if (type === 'architect') {
      const interviewInfo = context.architect?.interviewProgress;
      if (interviewInfo && !context.architect?.interviewComplete) {
        // Interview in progress - guide user through questions
      baseInstructions.push(
          'You are guiding the user through a structured interview to collect all necessary information for generating comprehensive project documentation.',
          '',
          `Interview Progress: ${interviewInfo.completionPercentage}% complete (${interviewInfo.answeredCount}/${interviewInfo.totalQuestions} questions answered)`,
          `Current Phase: ${interviewInfo.currentPhase}`,
          '',
          'YOUR PRIMARY ROLE: Guide the user through the interview questions conversationally.',
          '',
          interviewInfo.currentQuestion
            ? `CURRENT QUESTION TO ASK: "${interviewInfo.currentQuestion.question}"${interviewInfo.currentQuestion.helpText ? `\nHelp text: ${interviewInfo.currentQuestion.helpText}` : ''}${interviewInfo.currentQuestion.options ? `\nOptions: ${interviewInfo.currentQuestion.options.join(', ')}` : ''}`
            : 'No more questions - interview is complete!',
          '',
          'CRITICAL INSTRUCTIONS FOR INTERVIEW FLOW:',
          '1. ALWAYS ask the current question in your reply - do not wait for the user to ask',
          '2. If this is the first message in the conversation, IMMEDIATELY ask the first question - do not just greet them',
          '3. When the user provides an answer, acknowledge it briefly (e.g., "Got it!" or "Perfect!")',
          '4. Then IMMEDIATELY ask the next question - do not wait, do not ask if they\'re ready',
          '5. Ask questions conversationally and naturally - make it feel like a friendly chat, not a form',
          '6. If the user asks questions, answer them briefly, then return to asking the current interview question',
          '7. Keep the conversation flowing - always end your message with the next question',
          '8. Extract answers from user messages automatically - they may phrase things conversationally',
          '9. Never say "let me know when you\'re ready" - just ask the question',
          '',
          'WHEN INTERVIEW IS COMPLETE:',
          '1. Congratulate the user on completing the interview',
          '2. Offer to generate all documentation documents',
          '3. Create a proposal with architectDocuments containing all required documents',
          '',
          'REQUIRED DOCUMENTS TO GENERATE (when interview complete):',
          '1. Executive Summary (executive-summary.md)',
          '2. Technical Specification (technical-specification.md)',
          '3. Product Requirements (product-requirements.md)',
          '4. Roadmap (roadmap.md)',
          '5. Monetization Audit (monetization-audit.md) - if open source',
          '6. Launch Checklist (launch-checklist.md) - if open source',
          '',
          'Keep the conversation natural and friendly. Guide them through all questions to ensure complete documentation can be generated.'
        );
      } else if (context.architect?.interviewComplete) {
        // Interview complete - can help with documents
        baseInstructions.push(
          'The interview is complete and documentation has been generated.',
          'You can help the user:',
          '- Review and update existing documents',
          '- Answer questions about the documentation',
          '- Generate additional documents if needed',
          '',
          'When creating document proposals, include the full content in architectDocuments array.',
        'You may propose document edits by including architectDocuments array.',
        'Explain how document changes improve project clarity and development readiness.'
      );
      } else {
        // No interview started yet - but we may have pre-filled some answers
        const hasPrefilled = (context.architect?.interviewProgress?.answeredCount ?? 0) > 0;
        
        if (hasPrefilled) {
          const answeredCount = context.architect?.interviewProgress?.answeredCount ?? 0;
          baseInstructions.push(
            'I\'ve automatically filled in some answers from your existing project data (mechanics, lore, etc.).',
            `You've already answered ${answeredCount} questions automatically.`,
            'Now I\'ll guide you through the remaining questions to complete the interview.',
            '',
            'Ask the next unanswered question conversationally.',
            'Be friendly and acknowledge that some information was already gathered from their project.',
            '',
            'You may propose document edits by including architectDocuments array.',
            'Explain how document changes improve project clarity and development readiness.'
          );
        } else {
          baseInstructions.push(
            'Welcome the user and explain that you will guide them through a structured interview.',
            'The interview will collect all necessary information to generate comprehensive project documentation.',
            'I\'ll try to extract answers from existing project data first, then ask only the remaining questions.',
            'Start by asking the first unanswered question.',
            '',
            'Be friendly and conversational. Guide them through all questions systematically.',
            '',
            'You may propose document edits by including architectDocuments array.',
            'Explain how document changes improve project clarity and development readiness.'
          );
        }
      }
    } else {
      baseInstructions.push(
        'Focus on improving mechanics and lore alignment.',
        'Reference validation issues if available.',
        'Explain how proposed changes enhance gameplay consistency, player experience, or narrative coherence.',
        '',
        'CRITICAL PROPOSAL GENERATION RULES:',
        '1. When users say "do it", "go ahead", "create", "make changes", "generate", "implement", "apply", "ok", "yes", "please make", or similar approval language, you MUST include a proposal.',
        '2. When users ask for "a proposal", "plan", "implementation", or anything they can approve, you MUST include a proposal.',
        '3. The proposal MUST contain complete mechanics and/or lore JSON objects - not just descriptions or explanations.',
        '4. Do not just say "I will create..." or "I\'ve created..." - you MUST actually include the proposal object in your JSON response.',
        '5. If you mention creating changes, you MUST include those changes in the proposal field with actual JSON data.',
        '6. The proposal.explanation field should describe what you are proposing, but proposal.mechanics and proposal.lore must contain the actual complete JSON objects.',
        '7. NEVER return {reply: "...", proposal: null} or {reply: "...", proposal: {}} - if the user asks for a proposal, you MUST include mechanics and/or lore objects.',
        '',
        'REQUIRED JSON FORMAT WHEN USER ASKS FOR PROPOSAL:',
        '{',
        '  "reply": "I\'ve created a comprehensive proposal that addresses all validation issues...",',
        '  "proposal": {',
        '    "explanation": "This proposal strengthens the primary conflict, explains technology, etc.",',
        '    "mechanics": { "coreLoop": "...", "playerActions": [...], ... },',
        '    "lore": { "setting": {...}, "conflict": {...}, ... }',
        '  }',
        '}',
        '',
        'IMPORTANT: The "proposal" field is REQUIRED and must contain actual data, not be empty or null.',
        '',
        'When users ask for suggestions or improvements, provide comprehensive analysis across all dimensions:',
        '1. Mechanics depth opportunities (edge cases, balancing, advanced systems)',
        '2. Lore enrichment possibilities (character depth, worldbuilding, themes)',
        '3. Consistency issues and fixes (mechanics-lore alignment, validation problems)',
        '4. Genre fit improvements (convention alignment, genre-specific elements)',
        'Help users explore all potential improvements conversationally before they commit to a specific refinement.',
        '',
        'When creating proposals:',
        '- Include the COMPLETE updated mechanics object (not just changes, the full object)',
        '- Include the COMPLETE updated lore object (not just changes, the full object)',
        '- Provide a clear explanation of what improvements were made and why',
        '- Address validation issues explicitly in your explanation',
        '- Ensure all changes maintain consistency between mechanics and lore'
      );
    }

    baseInstructions.push(`Project name: ${context.project.name}`);
    if (context.latestVersion) {
      baseInstructions.push(
        `Latest mechanics JSON: ${JSON.stringify(context.latestVersion.mechanics)}`,
        `Latest lore JSON: ${JSON.stringify(context.latestVersion.lore)}`
      );
    }

    if (context.validationIssues.length > 0) {
      baseInstructions.push(
        `Current validation issues: ${JSON.stringify(context.validationIssues)}`,
        'Address these issues in your proposals and explain how your changes resolve them.'
      );
    }

    return baseInstructions.join('\n');
  }

  /**
   * Pre-fill interview answers from existing project data
   */
  private async prefillInterviewFromProjectData(projectId: string, interviewSessionId: string) {
    try {
      // Get project data
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });
      const latestVersion = await this.getLatestVersion(projectId);
      
      if (!project && !latestVersion) {
        return; // No data to extract
      }

      const mechanics = latestVersion?.mechanics as MechanicsData | undefined;
      const lore = latestVersion?.lore as LoreData | undefined;
      const prefillAnswers: Array<{ questionId: string; answer: string | string[] }> = [];

      // q1-project-name: From project name
      if (project?.name) {
        prefillAnswers.push({ questionId: 'q1-project-name', answer: project.name });
      }

      // q1-project-description: Synthesize from mechanics and lore
      if (mechanics?.coreLoop || lore?.setting) {
        const descriptionParts: string[] = [];
        if (lore?.setting?.worldType) {
          descriptionParts.push(lore.setting.worldType);
        }
        if (lore?.setting?.location) {
          descriptionParts.push(`set in ${lore.setting.location}`);
        }
        if (mechanics?.coreLoop) {
          descriptionParts.push(`featuring ${mechanics.coreLoop.toLowerCase()}`);
        }
        if (descriptionParts.length > 0) {
          prefillAnswers.push({
            questionId: 'q1-project-description',
            answer: descriptionParts.join(', '),
          });
        }
      }

      // q1-problem-solved: From conflict or themes
      if (lore?.conflict?.primary) {
        prefillAnswers.push({
          questionId: 'q1-problem-solved',
          answer: `Players experience ${lore.conflict.primary.toLowerCase()}`,
        });
      } else if (lore?.themes && lore.themes.length > 0) {
        prefillAnswers.push({
          questionId: 'q1-problem-solved',
          answer: `Explores themes of ${lore.themes.join(', ')}`,
        });
      }

      // q1-key-features: From player actions and protagonist abilities
      const features: string[] = [];
      if (mechanics?.playerActions && mechanics.playerActions.length > 0) {
        features.push(...mechanics.playerActions.slice(0, 5).map(action => {
          // Extract action name (before colon if present)
          return action.split(':')[0].trim();
        }));
      }
      if (lore?.protagonist?.abilities && lore.protagonist.abilities.length > 0 && features.length < 5) {
        const abilityFeatures = lore.protagonist.abilities
          .slice(0, 5 - features.length)
          .map(ability => ability.split(':')[0].trim());
        features.push(...abilityFeatures);
      }
      if (features.length > 0) {
        prefillAnswers.push({
          questionId: 'q1-key-features',
          answer: features.join(', '),
        });
      }

      // q2-primary-workflow: From coreLoop
      if (mechanics?.coreLoop) {
        prefillAnswers.push({
          questionId: 'q2-primary-workflow',
          answer: mechanics.coreLoop,
        });
      }

      // q2-data-model: From resource systems and progression
      const dataModelParts: string[] = [];
      if (mechanics?.resourceSystems && mechanics.resourceSystems.length > 0) {
        const resources = mechanics.resourceSystems.map(r => r.name || 'Unknown resource').join(', ');
        dataModelParts.push(`Resource tracking: ${resources}`);
      }
      if (mechanics?.progressionSystems) {
        const prog = mechanics.progressionSystems;
        if (prog && typeof prog === 'object' && 'mechanics' in prog && Array.isArray(prog.mechanics)) {
          dataModelParts.push(`Progression data: ${prog.mechanics.join(', ')}`);
        }
      }
      if (dataModelParts.length > 0) {
        prefillAnswers.push({
          questionId: 'q2-data-model',
          answer: dataModelParts.join('; '),
        });
      }

      // Submit all pre-filled answers
      for (const { questionId, answer } of prefillAnswers) {
        try {
          architectService.submitAnswer(interviewSessionId, questionId, answer);
          logger.debug('Pre-filled interview answer', { questionId, projectId });
        } catch (err) {
          logger.warn('Failed to pre-fill answer', {
            questionId,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      if (prefillAnswers.length > 0) {
        logger.info('Pre-filled interview from project data', {
          projectId,
          interviewSessionId,
          answersCount: prefillAnswers.length,
          questions: prefillAnswers.map(a => a.questionId),
        });
      }
    } catch (err) {
      logger.error('Error pre-filling interview', {
        error: err instanceof Error ? err.message : String(err),
        projectId,
        interviewSessionId,
      });
    }
  }

  /**
   * Handle architect interview flow - extract answers and track progress
   */
  private async handleArchitectInterview(assistantSessionId: string, projectId: string, userMessage: string) {
    try {
      // Get or create interview session
      let interviewSessionId = this.interviewSessions.get(assistantSessionId);
      if (!interviewSessionId) {
        const interviewSession = architectService.startInterview(projectId);
        interviewSessionId = interviewSession.sessionId;
        this.interviewSessions.set(assistantSessionId, interviewSessionId);
        
        // Pre-fill answers from existing project data
        await this.prefillInterviewFromProjectData(projectId, interviewSessionId);
        
        logger.info('Created new interview session for architect assistant', {
          assistantSessionId,
          interviewSessionId,
          projectId,
        });
      }

      // Get current interview progress
      const progress = architectService.getSessionProgress(interviewSessionId);
      const answersMap = new Map<string, string | string[]>();
      progress.session.answers.forEach((a) => answersMap.set(a.questionId, a.answer));
      const currentQuestion = getNextQuestion(answersMap);

      if (!currentQuestion) {
        // Interview complete - try to generate documentation
        if (!architectService.getDocumentation(projectId)) {
          try {
            await architectService.generateDocumentation(projectId, interviewSessionId);
            logger.info('Generated documentation after interview completion', { projectId, interviewSessionId });
          } catch (err) {
            logger.error('Failed to generate documentation', {
              error: err instanceof Error ? err.message : String(err),
              projectId,
              interviewSessionId,
            });
          }
        }
        return;
      }

      // Try to extract answer from user message
      // Look for patterns that might indicate an answer to the current question
      const answerPatterns = this.extractAnswerFromMessage(userMessage, currentQuestion);
      if (answerPatterns) {
        try {
          const result = architectService.submitAnswer(interviewSessionId, currentQuestion.id, answerPatterns);
          logger.info('Submitted interview answer', {
            questionId: currentQuestion.id,
            interviewSessionId,
            hasNextQuestion: !!result.nextQuestion,
            completionPercentage: result.completionPercentage,
          });

          // If interview is complete, generate documentation
          if (result.interviewComplete) {
            try {
              await architectService.generateDocumentation(projectId, interviewSessionId);
              logger.info('Generated documentation after interview completion', { projectId, interviewSessionId });
            } catch (err) {
              logger.error('Failed to generate documentation', {
                error: err instanceof Error ? err.message : String(err),
                projectId,
                interviewSessionId,
              });
            }
          }
        } catch (err) {
          logger.warn('Failed to submit interview answer', {
            error: err instanceof Error ? err.message : String(err),
            questionId: currentQuestion.id,
            interviewSessionId,
          });
        }
      }
    } catch (err) {
      logger.error('Error handling architect interview', {
        error: err instanceof Error ? err.message : String(err),
        assistantSessionId,
        projectId,
      });
    }
  }

  /**
   * Extract answer from user message for the current question
   */
  private extractAnswerFromMessage(message: string, question: { id: string; question: string; options?: string[] }): string | string[] | null {
    const lowerMessage = message.toLowerCase().trim();
    
    // If question has options, try to match them
    if (question.options && question.options.length > 0) {
      for (const option of question.options) {
        if (lowerMessage.includes(option.toLowerCase()) || 
            lowerMessage === option.toLowerCase() ||
            lowerMessage.startsWith(option.toLowerCase().substring(0, 3))) {
          return option;
        }
      }
    }

    // For questions asking for lists (comma-separated)
    if (question.id.includes('features') || question.id.includes('integrations')) {
      // Return as-is, will be parsed later
      return message.trim();
    }

    // For yes/no questions
    if (lowerMessage === 'yes' || lowerMessage === 'y' || lowerMessage.startsWith('yes')) {
      return 'Yes';
    }
    if (lowerMessage === 'no' || lowerMessage === 'n' || lowerMessage.startsWith('no')) {
      return 'No';
    }

    // For most questions, return the message as the answer
    // The AI will have asked the question, so the user's response is likely the answer
    if (message.length > 2 && message.length < 500) {
      return message.trim();
    }

    return null; // Couldn't extract a clear answer
  }

  private parseAssistantResponse(content: string): AssistantModelResponse {
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
                hasReply: extractedJson.includes('"reply"'),
                hasProposal: extractedJson.includes('"proposal"')
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
        
        // Look for JSON object that contains both "reply" and "proposal" keys
        // This handles cases where the model returns markdown with JSON embedded
        const replyProposalJson = cleanedContent.match(/\{[^{]*"reply"[\s\S]*"proposal"[\s\S]*\}/);
        if (replyProposalJson) {
          cleanedContent = replyProposalJson[0];
          logger.info('Extracted JSON object containing reply and proposal from markdown');
        } else {
          // Remove common explanatory prefixes that models sometimes add
          // Look for patterns like "Based on your request..." or "Here is..." before JSON
          cleanedContent = cleanedContent.replace(/^[^{]*?(?=\{[^{]*"reply"|"proposal")/i, '');
        }
      }
      
      // Try multiple strategies to find the correct JSON object
      // Strategy 1: Look for the top-level object containing both "reply" and "proposal"
      let jsonStart = -1;
      let jsonEnd = -1;
      
      // First, try to find an object that contains both "reply" and "proposal" keys
      const replyIndex = cleanedContent.indexOf('"reply"');
      const proposalIndex = cleanedContent.indexOf('"proposal"');
      
      if (replyIndex !== -1 && proposalIndex !== -1) {
        // Find the opening brace before the first of these keys
        const firstKeyIndex = Math.min(replyIndex, proposalIndex);
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
        logger.error('No JSON found in assistant response', { content: content.substring(0, 500) });
        // Return fallback response with cleaned content as reply
        return {
          reply: this.extractTextFromResponse(content),
        };
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
        logger.error('Incomplete JSON object in assistant response', { content: content.substring(0, 500) });
        // Return fallback response with cleaned content as reply
        return {
          reply: this.extractTextFromResponse(content),
        };
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
      // This is more comprehensive and handles various cases
      cleanedContent = cleanedContent
        // Replace single quotes around property names (more robust pattern)
        .replace(/([{,]\s*)'([^':\s]+)'(\s*:)/g, '$1"$2"$3')
        // Replace single quotes around string values (but be careful with apostrophes)
        .replace(/:\s*'([^']*?)'/g, ': "$1"')
        // Handle escaped single quotes in strings
        .replace(/\\'/g, "'");
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
              const fixed = candidateJson
                // Replace single quotes around property names (more robust pattern)
                .replace(/([{,]\s*)'([^':\s]+)'(\s*:)/g, '$1"$2"$3')
                // Replace single quotes around string values (but be careful with apostrophes)
                .replace(/:\s*'([^']*?)'/g, ': "$1"')
                // Handle escaped single quotes in strings
                .replace(/\\'/g, "'")
                // Fix trailing commas
                .replace(/,(\s*[}\]])/g, '$1');
              const testParsed = JSON.parse(fixed);
              if (testParsed.reply && (testParsed.proposal !== undefined || testParsed.proposal !== null)) {
                bestJson = fixed;
                parsed = testParsed;
                logger.info('Found valid JSON with both reply and proposal using brace tracking');
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
        
        if (!parsed) {
          // Log the problematic content for debugging
          logger.error('Failed to parse JSON after all attempts', {
            originalError: parseError instanceof Error ? parseError.message : String(parseError),
            contentLength: cleanedContent.length,
            contentPreview: cleanedContent.substring(0, 1000),
            firstBrace: cleanedContent.indexOf('{'),
            lastBrace: cleanedContent.lastIndexOf('}')
          });
          // Return fallback response with cleaned content as reply
          return {
            reply: this.extractTextFromResponse(content),
          };
        }
      }
      
      // Validate that we got meaningful content
      if (!parsed || (typeof parsed === 'object' && Object.keys(parsed).length === 0)) {
        logger.error('Empty or invalid content in assistant response', {
          parsed,
          contentPreview: cleanedContent.substring(0, 500)
        });
        // Return fallback response with cleaned content as reply
        return {
          reply: this.extractTextFromResponse(content),
        };
      }
      
      // Log what we actually got for debugging
      logger.debug('Parsed assistant response', {
        keys: Object.keys(parsed),
        hasReply: !!parsed.reply,
        hasProposal: !!parsed.proposal,
        replyType: typeof parsed.reply,
        proposalType: typeof parsed.proposal,
        proposalValue: parsed.proposal,
      });
      
      // Handle case where model returns only reply field without proposal
      // Sometimes models return {reply: "..."} instead of {reply: "...", proposal: {...}}
      if (parsed.proposal === undefined || parsed.proposal === null) {
        logger.warn('Model response missing proposal field', {
          keys: Object.keys(parsed),
          hasReply: !!parsed.reply,
          replyPreview: typeof parsed.reply === 'string' ? parsed.reply.substring(0, 200) : String(parsed.reply),
          fullParsed: JSON.stringify(parsed).substring(0, 500),
        });
        
        // Return just the reply without proposal
        return {
          reply: parsed.reply || this.extractTextFromResponse(content),
          proposal: undefined,
        };
      }
      
      // Ensure reply is a string - if it's not, try to extract it from the parsed object or fallback
      let reply: string;
      if (typeof parsed.reply === 'string' && parsed.reply.length > 0) {
        reply = parsed.reply;
      } else if (parsed.reply && typeof parsed.reply === 'object') {
        // Sometimes reply might be an object, try to stringify it nicely
        reply = JSON.stringify(parsed.reply, null, 2);
      } else {
        // Fallback: extract text from the original content
        reply = this.extractTextFromResponse(content);
        // If we still have raw JSON, try to extract just the reply field value
        if (reply.includes('"reply"') && reply.includes('{')) {
          const replyValueMatch = reply.match(/"reply"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
          if (replyValueMatch && replyValueMatch[1]) {
            reply = replyValueMatch[1]
              .replace(/\\"/g, '"')
              .replace(/\\n/g, '\n')
              .replace(/\\t/g, '\t')
              .replace(/\\\\/g, '\\');
          }
        }
      }
      
      // Ensure proposal is an object (even if empty)
      const proposal = typeof parsed.proposal === 'object' && parsed.proposal !== null
        ? parsed.proposal
        : {};
      
      return {
        reply: reply,
        proposal: proposal,
      };
    } catch (error) {
      logger.error('Failed to parse AI response in assistant service', {
        error: error instanceof Error ? error.message : String(error),
        contentPreview: content.substring(0, 1000)
      });
      
      // Return fallback response with extracted text as reply
      return {
        reply: this.extractTextFromResponse(content),
      };
    }
  }

  /**
   * Extract readable text from response when JSON parsing fails
   * This method attempts to extract meaningful text content from various response formats
   */
  private extractTextFromResponse(content: string): string {
    let cleaned = content.trim();
    
    // Remove markdown code blocks
    cleaned = cleaned.replace(/```json\n?/gi, '').replace(/```\n?/g, '');
    
    // Remove thinking/reasoning blocks
    cleaned = cleaned
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/\[REASONING\][\s\S]*?\[\/REASONING\]/gi, '')
      .replace(/Let me think[\s\S]*?(?=\{)/gi, '')
      .replace(/First, let me[\s\S]*?(?=\{)/gi, '');
    
    // Try to extract the "reply" field value from JSON even if malformed
    const replyMatch = cleaned.match(/"reply"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
    if (replyMatch && replyMatch[1]) {
      // Unescape the string
      const reply = replyMatch[1]
        .replace(/\\"/g, '"')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\');
      if (reply.length > 0) {
        return reply;
      }
    }
    
    // Try to extract text from JSON if present
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.reply && typeof parsed.reply === 'string') {
          return parsed.reply;
        }
        // If no reply field, try to extract meaningful text from the object
        const textParts = [];
        for (const [key, value] of Object.entries(parsed)) {
          if (typeof value === 'string' && value.length > 10 && key !== 'proposal') {
            textParts.push(value);
          }
        }
        if (textParts.length > 0) {
          return textParts.join(' ');
        }
      } catch {
        // JSON parsing failed, continue with text extraction
      }
    }
    
    // Remove any remaining JSON-like structures
    cleaned = cleaned.replace(/\{[^}]*\}/g, '');
    
    // Remove common explanatory phrases
    cleaned = cleaned
      .replace(/^(Here is|Here's|Based on|I have|I've) [\w\s]*:(.*)$/i, '$2')
      .replace(/^(The|This) [\w\s]* (is|contains|includes): (.*)$/i, '$3')
      .replace(/^[\w\s]* (response|answer|suggestion): (.*)$/i, '$2');
    
    // Clean up whitespace and line breaks
    cleaned = cleaned.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
    
    // If the cleaned content is too short, return a default message
    if (cleaned.length < 10) {
      return 'I have processed your request. Please let me know if you need any clarification or would like me to make specific suggestions for your game concept.';
    }
    
    return cleaned;
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
      explanation: proposal?.explanation || 'Improves game design with enhanced mechanics and lore.',
    } as any; // Cast to any for Prisma Json type compatibility

    const proposalType = proposal?.architectDocuments ? 'architect-document' : 'concept-update';

    return this.prisma.assistantProposal.create({
      data: {
        sessionId: session.id,
        projectId: session.projectId,
        conceptId: latestVersion?.id,
        proposalType,
        payload,
        changeLog: changeLog as any,
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
