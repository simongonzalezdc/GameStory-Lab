/**
 * Export API Routes
 * Export concepts to markdown documentation
 */

import express from 'express';
import { prisma } from '../server.js';
import { ExportRequestSchema } from '@gameforge/shared';
import type { MechanicsData, LoreData } from '@gameforge/shared';
import { generateGDD, generatePitch, generateTechnical } from '../services/export/templates.js';

const router = express.Router();

/**
 * POST /api/export
 * Export concept to markdown
 */
router.post('/', async (req, res, next) => {
  try {
    const validation = ExportRequestSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: validation.error.errors,
        },
      });
    }

    const { conceptId, template } = validation.data;

    // Get concept with project details
    const concept = await prisma.concept.findUnique({
      where: { id: conceptId },
      include: {
        project: true,
      },
    });

    if (!concept) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Concept ${conceptId} not found`,
        },
      });
    }

    // Generate markdown based on template
    let markdown: string;
    let filename: string;

    const projectName = concept.project.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    switch (template) {
      case 'gdd': {
        markdown = generateGDD(
          concept.project.name,
          concept.title || 'Untitled',
          concept.mechanics as MechanicsData,
          concept.lore as LoreData,
          concept.project.genre || undefined,
          (concept.metadata as any)?.consistencyScore
        );
        filename = `${projectName}-gdd.md`;
        break;
      }

      case 'pitch': {
        markdown = generatePitch(
          concept.project.name,
          concept.title || 'Untitled',
          concept.mechanics as MechanicsData,
          concept.lore as LoreData,
          concept.project.genre || undefined
        );
        filename = `${projectName}-pitch.md`;
        break;
      }

      case 'technical': {
        markdown = generateTechnical(
          concept.project.name,
          concept.title || 'Untitled',
          concept.mechanics as MechanicsData,
          concept.lore as LoreData,
          concept.project.genre || undefined
        );
        filename = `${projectName}-technical.md`;
        break;
      }

      default: {
        return res.status(400).json({
          error: {
            code: 'INVALID_TEMPLATE',
            message: `Template ${template} not supported`,
          },
        });
      }
    }

    res.json({
      markdown,
      filename,
    });
  } catch (error) {
    console.error('[Export] Error:', error);
    next(error);
  }
});

export default router;
