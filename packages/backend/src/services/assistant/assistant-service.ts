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
    explanation?: string;
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
          instructions: 'Respond using the required JSON schema. If the user asks for a plan, implementation, or anything to approve, you MUST include a proposal with complete mechanics and lore objects.',
        }),
      },
    ];

    const aiResponse = await this.aiOrchestrator.generate(
      'assistant',
      aiMessages,
      'auto', // Will use GLM 4.6 if available, otherwise falls back to Ollama
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
      '{ "reply": "string", "proposal": { "explanation": "string", "targetVersionId": "optional", "mechanics": {}, "lore": {}, "architectDocuments": [{ "name": "", "content": "" }] } }',
      'If you suggest mechanics or lore changes, include the full updated objects.',
      'Do not modify game data directly—only propose changes.',
      'Always include a clear explanation in the proposal.explanation field describing what improvements will be made and why they benefit the game.',
    ];

    if (type === 'architect') {
      baseInstructions.push(
        'You are currently assisting with the Project Architect phase.',
        'You may propose document edits by including architectDocuments array.',
        'Explain how document changes improve project clarity and development readiness.'
      );
    } else {
      baseInstructions.push(
        'Focus on improving mechanics and lore alignment.',
        'Reference validation issues if available.',
        'Explain how proposed changes enhance gameplay consistency, player experience, or narrative coherence.',
        '',
        'CRITICAL: When users ask for implementation plans, actionable improvements, or anything they can "approve", you MUST create a proposal with actual mechanics and lore changes.',
        'Do not just describe what should be done - include the full updated mechanics and lore objects in the proposal.',
        'Keywords that require proposals: "plan", "implement", "approve", "apply", "make changes", "create a version", "do it", "go ahead".',
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
      });
      
      // Handle case where model returns only reply field without proposal
      // Sometimes models return {reply: "..."} instead of {reply: "...", proposal: {...}}
      if (parsed.proposal === undefined || parsed.proposal === null) {
        logger.warn('Model response missing proposal field', {
          keys: Object.keys(parsed),
          hasReply: !!parsed.reply
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
