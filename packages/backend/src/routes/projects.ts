/**
 * Projects API Routes
 * CRUD operations for game projects
 */

import express from 'express';
import { prisma } from '../server.js';
import { CreateProjectSchema, UpdateProjectSchema } from '@gameforge/shared';

const router = express.Router();

/**
 * GET /api/projects
 * List all projects
 */
router.get('/', async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        concepts: {
          orderBy: { version: 'desc' },
          take: 1, // Only latest version
        },
      },
    });

    res.json({
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        genre: p.genre,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        latestConcept: p.concepts[0] || null,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/projects
 * Create a new project
 */
router.post('/', async (req, res, next) => {
  try {
    const validation = CreateProjectSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: validation.error.errors,
        },
      });
    }

    const { name, genre } = validation.data;

    const project = await prisma.project.create({
      data: {
        name,
        genre: genre || null,
      },
    });

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/projects/:id
 * Get a specific project with all concepts
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        concepts: {
          orderBy: { version: 'desc' },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Project ${id} not found`,
        },
      });
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/projects/:id
 * Update a project
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const validation = UpdateProjectSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: validation.error.errors,
        },
      });
    }

    const project = await prisma.project.update({
      where: { id },
      data: validation.data,
    });

    res.json(project);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Project ${req.params.id} not found`,
        },
      });
    }
    next(error);
  }
});

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.project.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Project ${req.params.id} not found`,
        },
      });
    }
    next(error);
  }
});

export default router;
