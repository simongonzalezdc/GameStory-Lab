/**
 * Generation API Routes
 * AI-powered content generation for mechanics, lore, titles, and refinement
 */

import express from 'express';
import { prisma, aiOrchestrator } from '../server.js';
import { GenerationRequestSchema } from '@gameforge/shared';
import type { MechanicsData, LoreData, Genre } from '@gameforge/shared';
import { getMechanicsPrompt } from '../services/ai/prompts/mechanics.js';
import { getLorePrompt } from '../services/ai/prompts/lore.js';
import { getTitlePrompt } from '../services/ai/prompts/title.js';
import { getRefinementPrompt } from '../services/ai/prompts/refinement.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/generate
 * Generate game content using AI
 */
router.post('/', async (req, res, next) => {
  try {
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
    const project = await prisma.project.findUnique({
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
    const response = await aiOrchestrator.generate(
      taskType,
      [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt },
      ],
      modelPreference || 'auto'
    );

    // Parse AI response with improved error handling
    let generatedContent: any;
    try {
      // Clean the response (remove markdown code blocks if present)
      let cleanedContent = response.content.trim();
      
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
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedContent = jsonMatch[0];
      }
      
      // Parse JSON
      generatedContent = JSON.parse(cleanedContent);
      
      // Validate that we got meaningful content
      if (!generatedContent || (typeof generatedContent === 'object' && Object.keys(generatedContent).length === 0)) {
        throw new Error('Empty or invalid content in AI response');
      }
    } catch (error) {
      logger.error('Failed to parse AI response', {
        error,
        taskType,
        model: response.model,
        responseLength: response.content.length,
        responsePreview: response.content.substring(0, 200),
      });
      
      return res.status(500).json({
        error: {
          code: 'PARSE_ERROR',
          message: 'Failed to parse AI response as JSON. The AI model may have returned invalid or incomplete data.',
          details: {
            taskType,
            model: response.model,
            responsePreview: response.content.substring(0, 500),
            suggestion: 'Try regenerating or using a different AI model',
          },
        },
      });
    }

    // Determine next version number based on existing versions
    const existingVersions = await prisma.version.findMany({
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
      const recentVersion = await prisma.version.findFirst({
        where: { 
          projectId,
        },
        orderBy: { version: 'desc' },
        take: 1,
      });
      
      // If recent version exists and has mechanics but empty/missing lore, update it
      if (recentVersion && 
          recentVersion.mechanics && 
          Object.keys(recentVersion.mechanics as object).length > 0 &&
          (!recentVersion.lore || Object.keys(recentVersion.lore as object).length === 0)) {
        logger.info('Updating existing version with lore', { versionId: recentVersion.id });
        version = await prisma.version.update({
          where: { id: recentVersion.id },
          data: {
            lore: generatedContent,
            metadata: {
              ...(recentVersion.metadata as object || {}),
              aiModel: response.model,
              promptTokens: response.tokensUsed.prompt,
              completionTokens: response.tokensUsed.completion,
              generationTime: Date.now() - startTime,
            },
          },
        });
        logger.info('Version updated successfully', { 
          versionId: version.id, 
          hasLore: !!version.lore && Object.keys(version.lore as object).length > 0 
        });
      } else {
        // Create new version with mechanics from context or empty
        logger.info('Creating new version with lore', { hasMechanics: !!context.existingContent?.mechanics });
        version = await prisma.version.create({
          data: {
            projectId,
            version: nextVersion,
            title: taskType === 'title' ? generatedContent.title : null,
            mechanics: context.existingContent?.mechanics || {},
            lore: generatedContent,
            metadata: {
              aiModel: response.model,
              promptTokens: response.tokensUsed.prompt,
              completionTokens: response.tokensUsed.completion,
              generationTime: Date.now() - startTime,
              userEdited: false,
              startedWith: context.existingContent?.mechanics ? 'both' : 'lore',
            },
          },
        });
      }
    } else {
      // Create new version
      version = await prisma.version.create({
        data: {
          projectId,
          version: nextVersion,
          title: taskType === 'title' ? generatedContent.title : null,
          mechanics: taskType === 'mechanics' ? generatedContent : (context.existingContent?.mechanics || {}),
          lore: taskType === 'lore' ? generatedContent : (context.existingContent?.lore || {}),
          metadata: {
            aiModel: response.model,
            promptTokens: response.tokensUsed.prompt,
            completionTokens: response.tokensUsed.completion,
            generationTime: Date.now() - startTime,
            userEdited: false,
            startedWith: taskType === 'mechanics' ? 'mechanics' : taskType === 'lore' ? 'lore' : undefined,
          },
        },
      });
    }

    // Log generation to database
    await prisma.aiGeneration.create({
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
    logger.error('Generation request failed', { error, projectId: req.body.projectId });
    next(error);
  }
});


export default router;
