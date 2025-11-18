/**
 * Refinement API Routes
 * Endpoints for iterative concept improvement with version tracking
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import type { RefinementFocus } from '@gameforge/shared';
import { RefinementService } from '../services/refinement/refinement-service.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Lazy initialization to avoid circular dependencies
let refinementService: RefinementService | null = null;

async function getRefinementService() {
  if (!refinementService) {
    // Lazy import to avoid circular dependency - use the singleton instances
    const serverModule = await import('../server.js');
    refinementService = new RefinementService(serverModule.prisma, serverModule.aiOrchestrator);
  }
  return refinementService;
}

/**
 * POST /api/refinement
 * Refine an existing concept and create a new version
 *
 * Body:
 * {
 *   "conceptId": "uuid",
 *   "focus": "deepen-mechanics" | "enrich-lore" | "improve-consistency" | "enhance-genre-fit",
 *   "specificInstructions": "optional specific guidance",
 *   "preserveFields": ["optional", "array", "of", "fields", "to", "preserve"]
 * }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { conceptId, focus, specificInstructions, preserveFields } = req.body;

    if (!conceptId) {
      return res.status(400).json({ error: 'conceptId is required' });
    }

    if (!focus) {
      return res.status(400).json({ error: 'focus is required' });
    }

    const validFocuses: RefinementFocus[] = [
      'deepen-mechanics',
      'enrich-lore',
      'improve-consistency',
      'enhance-genre-fit',
    ];

    if (!validFocuses.includes(focus)) {
      return res.status(400).json({
        error: `Invalid focus. Must be one of: ${validFocuses.join(', ')}`,
      });
    }

    const service = await getRefinementService();
    const result = await service.refineConcept({
      conceptId,
      focus,
      specificInstructions,
      preserveFields,
    });

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Refinement request failed', { error, conceptId: req.body.conceptId });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to refine concept',
    });
  }
});

/**
 * GET /api/refinement/history/:projectId
 * Get version history for a project
 */
router.get('/history/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const service = await getRefinementService();
    const history = await service.getVersionHistory(projectId);

    res.json({
      projectId,
      versions: history,
      count: history.length,
    });
  } catch (error) {
    logger.error('Failed to get version history', { error, conceptId: req.params.conceptId });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get version history',
    });
  }
});

/**
 * POST /api/refinement/compare
 * Compare two concept versions
 *
 * Body:
 * {
 *   "conceptId1": "uuid",
 *   "conceptId2": "uuid"
 * }
 */
router.post('/compare', async (req: Request, res: Response) => {
  try {
    const { conceptId1, conceptId2 } = req.body;

    if (!conceptId1 || !conceptId2) {
      return res.status(400).json({ error: 'Both conceptId1 and conceptId2 are required' });
    }

    const service = await getRefinementService();
    const comparison = await service.compareVersions(conceptId1, conceptId2);

    res.json(comparison);
  } catch (error) {
    logger.error('Failed to compare versions', { error, conceptId: req.params.conceptId });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to compare versions',
    });
  }
});

/**
 * POST /api/refinement/rollback
 * Rollback to a previous version
 *
 * Body:
 * {
 *   "projectId": "uuid",
 *   "targetVersion": 2
 * }
 */
router.post('/rollback', async (req: Request, res: Response) => {
  try {
    const { projectId, targetVersion } = req.body;

    if (!projectId || targetVersion === undefined) {
      return res.status(400).json({ error: 'projectId and targetVersion are required' });
    }

    const service = await getRefinementService();
    const result = await service.rollbackToVersion(projectId, targetVersion);

    res.status(201).json({
      success: true,
      ...result,
      message: `Rolled back to version ${targetVersion}`,
    });
  } catch (error) {
    logger.error('Failed to rollback concept', { error, conceptId: req.params.conceptId });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to rollback',
    });
  }
});

/**
 * GET /api/refinement/focuses
 * Get available refinement focus options
 */
router.get('/focuses', (_req: Request, res: Response) => {
  const focuses = [
    {
      id: 'deepen-mechanics',
      name: 'Deepen Mechanics',
      description: 'Add more depth and complexity to gameplay mechanics',
    },
    {
      id: 'enrich-lore',
      name: 'Enrich Lore',
      description: 'Expand narrative, characters, and worldbuilding',
    },
    {
      id: 'improve-consistency',
      name: 'Improve Consistency',
      description: 'Better align mechanics with lore',
    },
    {
      id: 'enhance-genre-fit',
      name: 'Enhance Genre Fit',
      description: 'Refine to match genre conventions',
    },
  ];

  res.json({
    focuses,
    count: focuses.length,
  });
});

export default router;
