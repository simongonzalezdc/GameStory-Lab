/**
 * Export API Routes
 * Export concepts to markdown documentation
 */

import express from 'express';
import { prisma } from '../server.js';
import { logger } from '../utils/logger.js';
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

    // Get version with project details
    const version = await prisma.version.findUnique({
      where: { id: conceptId },
      include: {
        project: true,
      },
    });

    if (!version) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Version ${conceptId} not found`,
        },
      });
    }

    // Generate markdown based on template
    let markdown: string;
    let filename: string;

    const projectName = version.project.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    switch (template) {
      case 'gdd': {
        markdown = generateGDD(
          version.project.name,
          version.title || 'Untitled',
          version.mechanics as MechanicsData,
          version.lore as LoreData,
          version.project.genre || undefined,
          (version.metadata as any)?.consistencyScore
        );
        filename = `${projectName}-gdd.md`;
        break;
      }

      case 'pitch': {
        markdown = generatePitch(
          version.project.name,
          version.title || 'Untitled',
          version.mechanics as MechanicsData,
          version.lore as LoreData,
          version.project.genre || undefined
        );
        filename = `${projectName}-pitch.md`;
        break;
      }

      case 'technical': {
        markdown = generateTechnical(
          version.project.name,
          version.title || 'Untitled',
          version.mechanics as MechanicsData,
          version.lore as LoreData,
          version.project.genre || undefined
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
    logger.error('Export request failed', { error, conceptId: req.body.conceptId });
    next(error);
  }
});

export default router;
