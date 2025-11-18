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
router.get('/', async (_req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: {
            versions: true,
          },
        },
      },
    });

    res.json({
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        genre: p.genre,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        _count: {
          versions: p._count.versions,
        },
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

    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/projects/:id
 * Get a specific project with all versions
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        versions: {
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

    // Format response to match frontend expectations
    const { versions, ...projectData } = project;
    res.json({
      project: {
        id: projectData.id,
        name: projectData.name,
        genre: projectData.genre,
        createdAt: projectData.createdAt.toISOString(),
        updatedAt: projectData.updatedAt.toISOString(),
      },
      versions: versions.map((v) => ({
        id: v.id,
        version: v.version,
        title: v.title,
        mechanics: v.mechanics,
        lore: v.lore,
        metadata: v.metadata,
        createdAt: v.createdAt.toISOString(),
      })),
    });
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

/**
 * POST /api/projects/:id/merge
 * Merge all versions of a project into a new version
 */
router.post('/:id/merge', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get project with all versions (optimized: only select needed fields)
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        versions: {
          select: {
            id: true,
            version: true,
            title: true,
            mechanics: true,
            lore: true,
          },
          orderBy: { version: 'asc' }, // Oldest first for merge order
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

    if (project.versions.length < 2) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Need at least 2 versions to merge',
        },
      });
    }

    // Merge mechanics and lore from all versions
    const mergedMechanics = mergeMechanics(project.versions.map(v => v.mechanics as any));
    const mergedLore = mergeLore(project.versions.map(v => v.lore as any));

    // Get next version number
    const latestVersion = project.versions[project.versions.length - 1];
    const nextVersion = latestVersion.version + 1;

    // Create merged version
    const mergedVersion = await prisma.version.create({
      data: {
        projectId: id,
        version: nextVersion,
        title: latestVersion.title, // Use latest title
        mechanics: mergedMechanics,
        lore: mergedLore,
        metadata: {
          mergedFrom: project.versions.map(v => ({ id: v.id, version: v.version })),
          mergedAt: new Date().toISOString(),
          userEdited: false,
        } as any,
      },
    });

    res.status(201).json({
      version: {
        id: mergedVersion.id,
        version: mergedVersion.version,
        mechanics: mergedVersion.mechanics,
        lore: mergedVersion.lore,
        createdAt: mergedVersion.createdAt.toISOString(),
      },
      mergedCount: project.versions.length,
      message: `Successfully merged ${project.versions.length} versions into version ${nextVersion}`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Merge mechanics from multiple versions
 * Strategy: Combine arrays (union), prefer latest for conflicts, deep merge objects
 */
function mergeMechanics(mechanicsArray: any[]): any {
  if (mechanicsArray.length === 0) return {};
  if (mechanicsArray.length === 1) return mechanicsArray[0];

  const merged: any = {};

  // Process each version's mechanics (oldest to newest)
  for (const mechanics of mechanicsArray) {
    if (!mechanics || typeof mechanics !== 'object') continue;

    for (const [key, value] of Object.entries(mechanics)) {
      if (value === null || value === undefined) continue;

      if (Array.isArray(value)) {
        // Merge arrays: combine unique values, prefer later versions
        if (!merged[key] || !Array.isArray(merged[key])) {
          merged[key] = [];
        }
        // Add new items that aren't already in merged array
        const existing = new Set(merged[key].map((item: any) => JSON.stringify(item)));
        for (const item of value) {
          const itemStr = JSON.stringify(item);
          if (!existing.has(itemStr)) {
            merged[key].push(item);
            existing.add(itemStr);
          }
        }
      } else if (typeof value === 'object') {
        // Deep merge objects
        if (!merged[key] || typeof merged[key] !== 'object' || Array.isArray(merged[key])) {
          merged[key] = {};
        }
        merged[key] = { ...merged[key], ...value };
      } else {
        // Primitive values: prefer latest (will be overwritten by later versions)
        merged[key] = value;
      }
    }
  }

  return merged;
}

/**
 * Merge lore from multiple versions
 * Strategy: Similar to mechanics, but be careful with narrative coherence
 */
function mergeLore(loreArray: any[]): any {
  if (loreArray.length === 0) return {};
  if (loreArray.length === 1) return loreArray[0];

  const merged: any = {};

  // Process each version's lore (oldest to newest)
  for (const lore of loreArray) {
    if (!lore || typeof lore !== 'object') continue;

    for (const [key, value] of Object.entries(lore)) {
      if (value === null || value === undefined) continue;

      if (key === 'setting' || key === 'protagonist' || key === 'conflict' || key === 'worldRules') {
        // Deep merge nested objects
        if (!merged[key] || typeof merged[key] !== 'object' || Array.isArray(merged[key])) {
          merged[key] = {};
        }
        merged[key] = { ...merged[key], ...value };
      } else if (Array.isArray(value)) {
        // Merge arrays (themes, secondary conflicts, abilities, etc.)
        if (!merged[key] || !Array.isArray(merged[key])) {
          merged[key] = [];
        }
        const existing = new Set(merged[key].map((item: any) => String(item).toLowerCase()));
        for (const item of value) {
          const itemStr = String(item).toLowerCase();
          if (!existing.has(itemStr)) {
            merged[key].push(item);
            existing.add(itemStr);
          }
        }
      } else if (typeof value === 'object') {
        // Deep merge other objects
        if (!merged[key] || typeof merged[key] !== 'object' || Array.isArray(merged[key])) {
          merged[key] = {};
        }
        merged[key] = { ...merged[key], ...value };
      } else {
        // Primitive values: prefer latest
        merged[key] = value;
      }
    }
  }

  return merged;
}

export default router;
