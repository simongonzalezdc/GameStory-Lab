/**
 * Generation API Routes
 * AI-powered content generation for mechanics, lore, titles, and refinement
 */

import express from 'express';
import { GenerationRequestSchema } from '@gameforge/shared';
import type { MechanicsData, LoreData, Genre } from '@gameforge/shared';
import { getMechanicsPrompt } from '../services/ai/prompts/mechanics.js';
import { getLorePrompt } from '../services/ai/prompts/lore.js';
import { getTitlePrompt } from '../services/ai/prompts/title.js';
import { getRefinementPrompt } from '../services/ai/prompts/refinement.js';
import { extractJSON } from '../services/ai/utils/json-validation.js';
import { logger } from '../utils/logger.js';
import type { PrismaClient } from '@prisma/client';
import type { AIOrchestrator } from '../services/ai/orchestrator.js';

const router = express.Router();

// Lazy initialization to avoid circular dependencies
let prisma: PrismaClient | null = null;
let aiOrchestrator: AIOrchestrator | null = null;

async function getDependencies() {
  if (!prisma || !aiOrchestrator) {
    const serverModule = await import('../server.js');
    prisma = serverModule.prisma;
    aiOrchestrator = serverModule.aiOrchestrator;
  }
  return { prisma, aiOrchestrator };
}

/**
 * POST /api/generate
 * Generate game content using AI
 */
router.post('/', async (req, res, next) => {
  try {
    const { prisma: prismaClient, aiOrchestrator: orchestrator } = await getDependencies();
    
    const validation = GenerationRequestSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: validation.error.errors,
        },
      });
    }

    const { projectId, taskType, context, modelPreference } = validation.data;

    // Verify project exists
    const project = await prismaClient.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Project ${projectId} not found`,
        },
      });
    }

    // Generate content based on task type
    let prompt: string;
    let systemMessage: string;

    switch (taskType) {
      case 'mechanics': {
        systemMessage = 'You are an expert game designer. Respond directly with only the requested JSON output, no explanations or reasoning.';
        prompt = getMechanicsPrompt(
          context.genre as Genre,
          context.existingContent?.lore as LoreData,
          context.userPrompt
        );
        break;
      }

      case 'lore': {
        systemMessage = 'You are an expert narrative designer and worldbuilder. Respond directly with only the requested JSON output, no explanations or reasoning.';
        prompt = getLorePrompt(
          context.genre as Genre,
          context.existingContent?.mechanics as MechanicsData,
          context.userPrompt
        );
        break;
      }

      case 'title': {
        systemMessage = 'You are an expert at creating memorable game titles. Respond directly with only the requested JSON output, no explanations or reasoning.';
        prompt = getTitlePrompt(
          context.existingContent?.mechanics as MechanicsData,
          context.existingContent?.lore as LoreData,
          context.genre as Genre
        );
        break;
      }

      case 'refinement': {
        systemMessage = 'You are an expert game designer who excels at refining concepts. Respond directly with only the requested JSON output, no explanations or reasoning.';
        prompt = getRefinementPrompt(
          context.existingContent?.mechanics as MechanicsData,
          context.existingContent?.lore as LoreData,
          context.userPrompt || ''
        );
        break;
      }

      default: {
        return res.status(400).json({
          error: {
            code: 'INVALID_TASK_TYPE',
            message: `Task type ${taskType} not supported`,
          },
        });
      }
    }

    // Generate using AI Orchestrator
    const startTime = Date.now();
    const response = await orchestrator.generate(
      taskType,
      [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt },
      ],
      modelPreference || 'auto'
    );

    // Parse AI response with improved error handling using extractJSON utility
    let generatedContent: any;
    try {
      // Use the extractJSON utility which handles markdown, thinking blocks, and common JSON issues
      const jsonResult = extractJSON(response.content);
      
      if (!jsonResult.isValid || !jsonResult.parsed) {
        throw new Error(jsonResult.error || 'Failed to extract valid JSON from AI response');
      }
      
      generatedContent = jsonResult.parsed;
      
      // Validate that we got meaningful content
      if (!generatedContent || (typeof generatedContent === 'object' && Object.keys(generatedContent).length === 0)) {
        throw new Error('Empty or invalid content in AI response');
      }
    } catch (error) {
      logger.error('Failed to parse AI response', {
        error: error instanceof Error ? error.message : String(error),
        taskType,
        model: response.model,
        responseLength: response.content.length,
        responsePreview: response.content.substring(0, 500),
        hasThinking: response.metadata?.thinking ? 'yes' : 'no',
      });
      
      return res.status(500).json({
        error: {
          code: 'PARSE_ERROR',
          message: 'Failed to parse AI response as JSON. The AI model may have returned invalid or incomplete data.',
          details: {
            taskType,
            model: response.model,
            responsePreview: response.content.substring(0, 500),
            errorMessage: error instanceof Error ? error.message : String(error),
            suggestion: 'Try regenerating or using a different AI model',
          },
        },
      });
    }

    // Determine next version number based on existing versions
    const existingVersions = await prismaClient.version.findMany({
      where: { projectId },
      select: { version: true },
      orderBy: { version: 'desc' },
      take: 1,
    });

    const nextVersion = existingVersions.length > 0 ? existingVersions[0].version + 1 : 1;

    // Create or update version in database
    // If we're generating lore and there's a recent mechanics-only version, update it instead of creating new
    let version;
    if (taskType === 'lore') {
      // Check if there's a recent version with mechanics but no lore (or empty lore)
      // Look for versions created in the last 30 seconds to catch "generate both" scenarios
      const thirtySecondsAgo = new Date(Date.now() - 30000);
      const recentVersion = await prismaClient.version.findFirst({
        where: { 
          projectId,
          createdAt: {
            gte: thirtySecondsAgo,
          },
        },
        orderBy: { version: 'desc' },
        take: 1,
      });
      
      // Also check the most recent version regardless of time (fallback)
      const mostRecentVersion = recentVersion || await prismaClient.version.findFirst({
        where: { 
          projectId,
        },
        orderBy: { version: 'desc' },
        take: 1,
      });
      
      // If recent version exists and has mechanics but empty/missing lore, update it
      const hasMechanics = mostRecentVersion?.mechanics && 
        typeof mostRecentVersion.mechanics === 'object' &&
        Object.keys(mostRecentVersion.mechanics as object).length > 0;
      const hasNoLore = !mostRecentVersion?.lore || 
        (typeof mostRecentVersion.lore === 'object' && Object.keys(mostRecentVersion.lore as object).length === 0);
      
      if (mostRecentVersion && hasMechanics && hasNoLore) {
        logger.info('Updating existing version with lore', { 
          versionId: mostRecentVersion.id,
          versionNumber: mostRecentVersion.version,
          hasMechanics,
          hasNoLore,
        });
        version = await prismaClient.version.update({
          where: { id: mostRecentVersion.id },
          data: {
            lore: generatedContent,
            metadata: {
              ...(mostRecentVersion.metadata as object || {}),
              aiModel: response.model,
              promptTokens: response.tokensUsed.prompt,
              completionTokens: response.tokensUsed.completion,
              generationTime: Date.now() - startTime,
              startedWith: 'both', // Mark as started with both since we're updating
            },
          },
        });
        logger.info('Version updated successfully', { 
          versionId: version.id, 
          hasLore: !!version.lore && Object.keys(version.lore as object).length > 0 
        });
      } else {
        // Create new version with mechanics from context or from most recent version
        const mechanicsFromContext = context.existingContent?.mechanics;
        const mechanicsFromRecent = mostRecentVersion?.mechanics && 
          typeof mostRecentVersion.mechanics === 'object' &&
          Object.keys(mostRecentVersion.mechanics as object).length > 0
          ? mostRecentVersion.mechanics
          : null;
        const mechanicsData = (mechanicsFromContext || mechanicsFromRecent || {}) as any;
        
        logger.info('Creating new version with lore', { 
          hasMechanicsFromContext: !!mechanicsFromContext,
          hasMechanicsFromRecent: !!mechanicsFromRecent,
          recentVersionId: mostRecentVersion?.id,
        });
        
        const loreData = generatedContent as any;
        const titleValue = ('title' in generatedContent && (generatedContent as { title?: string }).title) ? (generatedContent as { title?: string }).title : null;
        version = await prismaClient.version.create({
          data: {
            projectId,
            version: nextVersion,
            title: titleValue,
            mechanics: mechanicsData,
            lore: loreData,
            metadata: {
              aiModel: response.model,
              promptTokens: response.tokensUsed.prompt,
              completionTokens: response.tokensUsed.completion,
              generationTime: Date.now() - startTime,
              userEdited: false,
              startedWith: mechanicsData && Object.keys(mechanicsData).length > 0 ? 'both' : 'lore',
            },
          },
        });
      }
    } else {
      // Create new version (for mechanics, title, or refinement)
      const mechanicsData = taskType === 'mechanics' 
        ? (generatedContent as any)
        : ((context.existingContent?.mechanics || {}) as any);
      const loreData = (context.existingContent?.lore || {}) as any;
      const titleValue = (taskType === 'title' && 'title' in generatedContent) 
        ? (generatedContent as { title?: string }).title 
        : null;
      const startedWithValue = taskType === 'mechanics' ? 'mechanics' : undefined;
      version = await prismaClient.version.create({
        data: {
          projectId,
          version: nextVersion,
          title: titleValue,
          mechanics: mechanicsData,
          lore: loreData,
          metadata: {
            aiModel: response.model,
            promptTokens: response.tokensUsed.prompt,
            completionTokens: response.tokensUsed.completion,
            generationTime: Date.now() - startTime,
            userEdited: false,
            startedWith: startedWithValue,
          },
        },
      });
    }

    // Log generation to database
    await prismaClient.aiGeneration.create({
      data: {
        conceptId: version.id,
        taskType,
        modelUsed: response.model,
        prompt,
        response: response.content,
        tokensUsed: response.tokensUsed.total,
        costUsd: response.metadata?.costUsd,
        durationMs: response.metadata?.durationMs,
      },
    });

    res.json({
      versionId: version.id,
      content: {
        mechanics: version.mechanics as MechanicsData,
        lore: version.lore as LoreData,
        title: version.title,
      },
      metadata: {
        model: response.model,
        tokensUsed: response.tokensUsed.total,
        durationMs: response.metadata?.durationMs,
        costUsd: response.metadata?.costUsd,
      },
    });
  } catch (error) {
    logger.error('Generation request failed', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      projectId: req.body.projectId,
      taskType: req.body.taskType,
    });
    next(error);
  }
});


export default router;
