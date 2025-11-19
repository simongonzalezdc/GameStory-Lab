/**
 * Validation API Routes
 * Consistency checking for game concepts
 */

import express from 'express';
import { prisma } from '../server.js';
import { ValidationRequestSchema } from '@gameforge/shared';
import type { MechanicsData, LoreData } from '@gameforge/shared';
import { ValidationEngine } from '../services/validation/engine.js';
import { logger } from '../utils/logger.js';

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

    // Verify version exists and get project genre
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

    // Run validation engine
    console.log('[VALIDATION DEBUG] Starting validation for concept:', {
      conceptId,
      version: version.version,
      hasMechanics: !!mechanics && Object.keys(mechanics).length > 0,
      hasLore: !!lore && Object.keys(lore).length > 0,
      mechanicsKeys: mechanics ? Object.keys(mechanics) : [],
      loreKeys: lore ? Object.keys(lore) : [],
      genre: version.project.genre
    });
    
    const result = await validationEngine.validate(
      mechanics as MechanicsData,
      lore as LoreData,
      version.project.genre || undefined
    );
    
    console.log('[VALIDATION DEBUG] Validation engine result:', {
      issuesCount: result.issues.length,
      overallScore: result.overallScore,
      issues: result.issues.map(i => ({
        rule: i.rule,
        severity: i.severity,
        confidence: i.confidence,
        message: i.message
      }))
    });

    // Delete previous validation results for this version
    await prisma.validationResult.deleteMany({
      where: { conceptId },
    });

    console.log('[VALIDATION DEBUG] Storing validation results:', {
      conceptId,
      issuesCount: result.issues.length,
      overallScore: result.overallScore
    });

    // Store new validation results and get the first ID as validationId
    let validationId: string | null = null;
    if (result.issues.length > 0) {
      const createdResults = await prisma.validationResult.createMany({
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
      
      console.log('[VALIDATION DEBUG] Created validation results:', {
        count: createdResults.count,
        conceptId
      });
      
      // Get the first validation result ID for the response
      const firstResult = await prisma.validationResult.findFirst({
        where: { conceptId },
        select: { id: true },
        orderBy: { createdAt: 'desc' },
      });
      validationId = firstResult?.id || null;
      
      console.log('[VALIDATION DEBUG] Retrieved validation result ID:', {
        validationId,
        hasId: !!validationId
      });
    } else {
      // Generate a UUID for the response even if no issues
      validationId = crypto.randomUUID();
      console.log('[VALIDATION DEBUG] No issues to store, generated UUID:', validationId);
    }

    // Update version metadata with consistency score
    await prisma.version.update({
      where: { id: conceptId },
      data: {
        metadata: {
          ...(version.metadata as object),
          consistencyScore: result.overallScore,
          lastValidated: new Date().toISOString(),
        },
      },
    });

    const responseScore = result.overallScore;
    console.log('[VALIDATION DEBUG] Sending response:', {
      validationId,
      issuesCount: result.issues.length,
      overallScore: responseScore,
      overallScorePercent: Math.round(responseScore * 100)
    });

    res.json({
      validationId,
      issues: result.issues,
      overallScore: responseScore,
      consistencyScore: responseScore, // Add this field for frontend compatibility
    });
  } catch (error) {
    logger.error('Validation request failed', { error, conceptId: req.body.conceptId });
    next(error);
  }
});

/**
 * GET /api/validate/rules
 * Get all available validation rules
 */
router.get('/rules', (_req, res) => {
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
