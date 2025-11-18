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
        systemMessage = 'You are an expert game designer.';
        prompt = getMechanicsPrompt(
          context.genre as Genre,
          context.existingContent?.lore as LoreData,
          context.userPrompt
        );
        break;
      }

      case 'lore': {
        systemMessage = 'You are an expert narrative designer and worldbuilder.';
        prompt = getLorePrompt(
          context.genre as Genre,
          context.existingContent?.mechanics as MechanicsData,
          context.userPrompt
        );
        break;
      }

      case 'title': {
        systemMessage = 'You are an expert at creating memorable game titles.';
        prompt = getTitlePrompt(
          context.existingContent?.mechanics as MechanicsData,
          context.existingContent?.lore as LoreData,
          context.genre as Genre
        );
        break;
      }

      case 'refinement': {
        systemMessage = 'You are an expert game designer who excels at refining concepts.';
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

    // Parse AI response
    let generatedContent: any;
    try {
      // Clean the response (remove markdown code blocks if present)
      let cleanedContent = response.content.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/```\n?/g, '');
      }
      generatedContent = JSON.parse(cleanedContent);
    } catch (error) {
      return res.status(500).json({
        error: {
          code: 'PARSE_ERROR',
          message: 'Failed to parse AI response as JSON',
          details: { rawResponse: response.content },
        },
      });
    }

    // Create concept in database
    const concept = await prisma.concept.create({
      data: {
        projectId,
        version: 1, // Will be incremented for refinements
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

    // Log generation to database
    await prisma.aiGeneration.create({
      data: {
        conceptId: concept.id,
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
      conceptId: concept.id,
      content: {
        mechanics: concept.mechanics as MechanicsData,
        lore: concept.lore as LoreData,
        title: concept.title,
      },
      metadata: {
        model: response.model,
        tokensUsed: response.tokensUsed.total,
        durationMs: response.metadata?.durationMs,
        costUsd: response.metadata?.costUsd,
      },
    });
  } catch (error) {
    console.error('[Generate] Error:', error);
    next(error);
  }
});

/**
 * Generate title prompt
 */
function getTitlePrompt(mechanics?: MechanicsData, lore?: LoreData, genre?: Genre): string {
  return `Generate 10 compelling game title suggestions based on the following concept.

${genre ? `Genre: ${genre}` : ''}

${lore ? `Lore summary: ${JSON.stringify(lore, null, 2)}` : ''}

${mechanics ? `Mechanics summary: ${JSON.stringify(mechanics, null, 2)}` : ''}

Return as JSON array:
{
  "titles": [
    {
      "title": "Game Title",
      "rationale": "Brief explanation of why this title fits"
    }
  ]
}

Titles should be:
- Memorable and unique
- Genre-appropriate
- 1-5 words
- Evocative of the game's themes
- Easy to pronounce

Output ONLY valid JSON.`;
}

/**
 * Generate refinement prompt
 */
function getRefinementPrompt(mechanics?: MechanicsData, lore?: LoreData, focus?: string): string {
  return `Refine and improve the following game concept with focus on: ${focus}

Current Mechanics:
${JSON.stringify(mechanics, null, 2)}

Current Lore:
${JSON.stringify(lore, null, 2)}

Provide refined versions of BOTH mechanics and lore, ensuring they are more coherent and polished.

Return as JSON:
{
  "mechanics": { ...improved mechanics... },
  "lore": { ...improved lore... },
  "improvements": ["list of specific improvements made"]
}

Output ONLY valid JSON.`;
}

export default router;
