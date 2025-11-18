/**
 * Template API Routes
 * Endpoints for genre template management
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import type { Genre, MechanicsData, LoreData } from '@gameforge/shared';
import { getTemplateService } from '../services/templates/template-service.js';
import { logger } from '../utils/logger.js';

const router = Router();
const templateService = getTemplateService();

/**
 * GET /api/templates
 * List all available genre templates
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const genres = templateService.getAvailableGenres();
    res.json({
      genres,
      count: genres.length,
    });
  } catch (error) {
    logger.error('Failed to list templates', { error });
    res.status(500).json({ error: 'Failed to list templates' });
  }
});

/**
 * GET /api/templates/:genre
 * Get a specific genre template
 */
router.get('/:genre', (req: Request, res: Response) => {
  try {
    const genre = req.params.genre as Genre;

    const template = templateService.getTemplate(genre);
    if (!template) {
      return res.status(404).json({ error: `Template not found for genre: ${genre}` });
    }

    res.json(template);
  } catch (error) {
    logger.error('Failed to get template', { error, genre: req.params.genre });
    res.status(500).json({ error: 'Failed to get template' });
  }
});

/**
 * GET /api/templates/:genre/stats
 * Get statistics about a template
 */
router.get('/:genre/stats', (req: Request, res: Response) => {
  try {
    const genre = req.params.genre as Genre;

    const stats = templateService.getTemplateStats(genre);
    if (!stats) {
      return res.status(404).json({ error: `Template not found for genre: ${genre}` });
    }

    res.json(stats);
  } catch (error) {
    logger.error('Failed to get template stats', { error, genre: req.params.genre });
    res.status(500).json({ error: 'Failed to get template stats' });
  }
});

/**
 * POST /api/templates/:genre/customize
 * Customize a template with user modifications
 *
 * Body:
 * {
 *   "mechanicsOverrides": { ... },
 *   "loreOverrides": { ... }
 * }
 */
router.post('/:genre/customize', (req: Request, res: Response) => {
  try {
    const genre = req.params.genre as Genre;
    const { mechanicsOverrides, loreOverrides } = req.body;

    const customized = templateService.customizeTemplate(
      genre,
      mechanicsOverrides as Partial<MechanicsData>,
      loreOverrides as Partial<LoreData>
    );

    if (!customized) {
      return res.status(404).json({ error: `Template not found for genre: ${genre}` });
    }

    res.json({
      genre,
      mechanics: customized.mechanics,
      lore: customized.lore,
      customized: true,
    });
  } catch (error) {
    logger.error('Failed to customize template', { error, genre: req.params.genre });
    res.status(500).json({ error: 'Failed to customize template' });
  }
});

/**
 * POST /api/templates/blend
 * Blend multiple genres into a hybrid template
 *
 * Body:
 * {
 *   "genres": [
 *     { "genre": "rpg", "weight": 0.7 },
 *     { "genre": "fps", "weight": 0.3 }
 *   ]
 * }
 *
 * Examples:
 * - RPG (70%) + FPS (30%) = Action RPG
 * - Platformer (50%) + Adventure (50%) = Metroidvania
 * - Survival (60%) + Horror (40%) = Survival Horror
 * - Roguelike (40%) + Action-Adventure (40%) + RPG (20%) = Roguelite Action RPG
 */
router.post('/blend', (req: Request, res: Response) => {
  try {
    const { genres } = req.body;

    if (!genres || !Array.isArray(genres) || genres.length === 0) {
      return res.status(400).json({
        error: 'genres array is required with at least one genre',
        example: {
          genres: [
            { genre: 'rpg', weight: 0.7 },
            { genre: 'fps', weight: 0.3 },
          ],
        },
      });
    }

    // Validate each genre config
    for (const config of genres) {
      if (!config.genre || typeof config.weight !== 'number') {
        return res.status(400).json({
          error: 'Each genre config must have "genre" (string) and "weight" (number)',
          example: { genre: 'rpg', weight: 0.5 },
        });
      }
    }

    const blendedTemplate = templateService.blendGenres(genres);

    if (!blendedTemplate) {
      return res.status(400).json({ error: 'Failed to blend genres. Check that all genres are valid.' });
    }

    res.json({
      blended: true,
      template: blendedTemplate,
      sourceGenres: genres,
    });
  } catch (error) {
    logger.error('Failed to blend genres', { error, genres: req.body.genres });
    res.status(500).json({ error: 'Failed to blend genres' });
  }
});

/**
 * POST /api/templates/blend-and-create
 * Blend multiple genres and create a project from the result
 *
 * Body:
 * {
 *   "projectName": "My Hybrid Game",
 *   "genres": [
 *     { "genre": "rpg", "weight": 0.7 },
 *     { "genre": "fps", "weight": 0.3 }
 *   ]
 * }
 *
 * Examples:
 * - 70% RPG + 30% FPS = Action RPG project
 * - 50% Platformer + 50% Adventure = Metroidvania project
 * - 60% Survival + 40% Horror = Survival Horror project
 */
router.post('/blend-and-create', async (req: Request, res: Response) => {
  try {
    const { projectName, genres } = req.body;

    if (!projectName) {
      return res.status(400).json({ error: 'projectName is required' });
    }

    if (!genres || !Array.isArray(genres) || genres.length === 0) {
      return res.status(400).json({
        error: 'genres array is required with at least one genre',
        example: {
          projectName: 'My Hybrid Game',
          genres: [
            { genre: 'rpg', weight: 0.7 },
            { genre: 'fps', weight: 0.3 },
          ],
        },
      });
    }

    // Validate each genre config
    for (const config of genres) {
      if (!config.genre || typeof config.weight !== 'number') {
        return res.status(400).json({
          error: 'Each genre config must have "genre" (string) and "weight" (number)',
          example: { genre: 'rpg', weight: 0.5 },
        });
      }
    }

    // Blend the genres
    const blendedTemplate = templateService.blendGenres(genres);

    if (!blendedTemplate) {
      return res.status(400).json({ error: 'Failed to blend genres. Check that all genres are valid.' });
    }

    // Import dynamically to avoid circular dependencies
    const { prisma } = await import('../lib/prisma.js');

    // Determine primary genre (highest weight) for database storage
    const sortedGenres = [...genres].sort((a, b) => b.weight - a.weight);
    const primaryGenre = sortedGenres[0].genre as Genre;

    // Create project and initial version
    const project = await prisma.project.create({
      data: {
        name: projectName,
        genre: primaryGenre,
      },
    });

    const version = await prisma.version.create({
      data: {
        projectId: project.id,
        version: 1,
        mechanics: blendedTemplate.mechanics as any,
        lore: blendedTemplate.lore as any,
        metadata: {
          startedWith: 'mechanics',
          userEdited: false,
          generatedFrom: `blended:${genres.map(g => `${g.genre}(${Math.round(g.weight * 100)}%)`).join('+')}`,
          blendedGenres: genres,
          blendedTemplateName: blendedTemplate.name,
        } as any,
      },
    });

    res.status(201).json({
      project,
      version,
      blendedTemplate: blendedTemplate.name,
      sourceGenres: genres,
      message: `Project created from blended template: ${blendedTemplate.name}`,
    });
  } catch (error) {
    logger.error('Failed to create project from blended template', { error, genres: req.body.genres });
    res.status(500).json({ error: 'Failed to create project from blended template' });
  }
});

/**
 * POST /api/templates/:genre/create-project
 * Create a new project from a template
 *
 * Body:
 * {
 *   "projectName": "My Game",
 *   "mechanicsOverrides": { ... },  // optional
 *   "loreOverrides": { ... }         // optional
 * }
 */
router.post('/:genre/create-project', async (req: Request, res: Response) => {
  try {
    const genre = req.params.genre as Genre;
    const { projectName, mechanicsOverrides, loreOverrides } = req.body;

    if (!projectName) {
      return res.status(400).json({ error: 'projectName is required' });
    }

    // Get customized template
    const customized = templateService.customizeTemplate(
      genre,
      mechanicsOverrides as Partial<MechanicsData>,
      loreOverrides as Partial<LoreData>
    );

    if (!customized) {
      return res.status(404).json({ error: `Template not found for genre: ${genre}` });
    }

    // Import dynamically to avoid circular dependencies
    const { prisma } = await import('../lib/prisma.js');

    // Create project and initial version
    const project = await prisma.project.create({
      data: {
        name: projectName,
        genre,
      },
    });

    const version = await prisma.version.create({
      data: {
        projectId: project.id,
        version: 1,
        mechanics: customized.mechanics as any,
        lore: customized.lore as any,
        metadata: {
          startedWith: 'mechanics',
          userEdited: false,
          generatedFrom: `template:${genre}`,
        } as any,
      },
    });

    res.status(201).json({
      project,
      version,
      message: `Project created from ${genre} template`,
    });
  } catch (error) {
    logger.error('Failed to create project from template', { error, genre: req.params.genre });
    res.status(500).json({ error: 'Failed to create project from template' });
  }
});

export default router;
