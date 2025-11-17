/**
 * Validation API Routes
 * Consistency checking for game concepts
 */

import express from 'express';
import { prisma } from '../server.js';
import { ValidationRequestSchema } from '@gameforge/shared';
import type { MechanicsData, LoreData } from '@gameforge/shared';
import { ValidationEngine } from '../services/validation/engine.js';

const router = express.Router();
const validationEngine = new ValidationEngine();

/**
 * POST /api/validate
 * Run consistency validation on a concept
 */
router.post('/', async (req, res, next) => {
  try {
    const validation = ValidationRequestSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: validation.error.errors,
        },
      });
    }

    const { conceptId, mechanics, lore } = validation.data;

    // Verify concept exists and get project genre
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

    // Run validation engine
    const result = await validationEngine.validate(
      mechanics as MechanicsData,
      lore as LoreData,
      concept.project.genre || undefined
    );

    // Store validation results in database
    const validationId = crypto.randomUUID();

    // Delete previous validation results for this concept
    await prisma.validationResult.deleteMany({
      where: { conceptId },
    });

    // Store new validation results
    if (result.issues.length > 0) {
      await prisma.validationResult.createMany({
        data: result.issues.map((issue) => ({
          conceptId,
          ruleName: issue.rule,
          severity: issue.severity,
          confidence: issue.confidence,
          message: issue.message,
          suggestion: issue.suggestion || null,
          dismissed: false,
        })),
      });
    }

    // Update concept metadata with consistency score
    await prisma.concept.update({
      where: { id: conceptId },
      data: {
        metadata: {
          ...(concept.metadata as object),
          consistencyScore: result.overallScore,
          lastValidated: new Date().toISOString(),
        },
      },
    });

    res.json({
      validationId,
      issues: result.issues,
      overallScore: result.overallScore,
    });
  } catch (error) {
    console.error('[Validate] Error:', error);
    next(error);
  }
});

/**
 * GET /api/validate/rules
 * Get all available validation rules
 */
router.get('/rules', (req, res) => {
  const rules = validationEngine.getRules();
  res.json({
    rules: rules.map((r) => ({
      name: r.name,
      category: r.category,
      weight: r.weight,
    })),
  });
});

/**
 * PATCH /api/validate/:conceptId/dismiss/:ruleId
 * Dismiss a validation issue
 */
router.patch('/:conceptId/dismiss/:ruleId', async (req, res, next) => {
  try {
    const { conceptId, ruleId } = req.params;

    await prisma.validationResult.updateMany({
      where: {
        conceptId,
        id: ruleId,
      },
      data: {
        dismissed: true,
      },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
