/**
 * Title Generation API Routes
 * Advanced game title generation endpoints
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import type { Genre } from '@gameforge/shared';
// Will be initialized lazily to avoid circular dependency
import { TitleService } from '../services/title/title-service.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Initialize title service
// Lazy initialization to avoid circular dependency
let titleService: TitleService | null = null;

async function getTitleService() {
  if (!titleService) {
    // Lazy import to avoid circular dependency - use the singleton instance
    const serverModule = await import('../server.js');
    titleService = new TitleService(serverModule.aiOrchestrator);
  }
  return titleService;
}

/**
 * POST /api/titles/generate
 * Generate title suggestions
 *
 * Body:
 * {
 *   "mechanics": { ... },
 *   "lore": { ... },
 *   "genre": "rpg",
 *   "style": "mysterious",  // optional
 *   "count": 10,            // optional
 *   "excludeWords": [],     // optional
 *   "mustIncludeWords": []  // optional
 * }
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { mechanics, lore, genre, style, count, excludeWords, mustIncludeWords } = req.body;

    const service = await getTitleService();
    const titles = await service.generateTitles({
      mechanics,
      lore,
      genre: genre as Genre,
      style,
      count,
      excludeWords,
      mustIncludeWords,
    });

    res.json({
      titles,
      count: titles.length,
      topPick: titles[0], // Highest scoring title
    });
  } catch (error) {
    logger.error('Title generation failed', { error, projectId: req.body.projectId });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate titles',
    });
  }
});

/**
 * POST /api/titles/variations
 * Generate variations of an existing title
 *
 * Body:
 * {
 *   "baseTitle": "The Legend of Zelda",
 *   "count": 5
 * }
 */
router.post('/variations', async (req: Request, res: Response) => {
  try {
    const { baseTitle, count } = req.body;

    if (!baseTitle) {
      return res.status(400).json({ error: 'baseTitle is required' });
    }

    const service = await getTitleService();
    const variations = await service.generateVariations(baseTitle, count || 5);

    res.json({
      baseTitle,
      variations,
      count: variations.length,
    });
  } catch (error) {
    logger.error('Title variation generation failed', { error, conceptId: req.params.conceptId });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate variations',
    });
  }
});

/**
 * POST /api/titles/analyze
 * Analyze a title's SEO and market potential
 *
 * Body:
 * {
 *   "title": "Dark Souls",
 *   "genre": "rpg"  // optional
 * }
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { title, genre } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    const service = await getTitleService();
    const seoAnalysis = service.analyzeSEO(title, genre as Genre);
    const availability = await service.checkAvailability(title);

    res.json({
      title,
      seo: seoAnalysis,
      availability,
      recommendations: seoAnalysis.suggestions,
    });
  } catch (error) {
    logger.error('Title analysis failed', { error, title: req.body.title });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to analyze title',
    });
  }
});

/**
 * GET /api/titles/styles
 * Get available title styles
 */
router.get('/styles', (_req: Request, res: Response) => {
  const styles = [
    {
      id: 'descriptive',
      name: 'Descriptive',
      description: 'Clear titles that immediately communicate the game concept',
      examples: ['City Builder', 'Space Invaders', 'Farming Simulator'],
    },
    {
      id: 'mysterious',
      name: 'Mysterious',
      description: 'Intriguing titles that make players curious',
      examples: ['The Witness', 'Inside', 'Journey'],
    },
    {
      id: 'action-oriented',
      name: 'Action-Oriented',
      description: 'Bold titles with strong verbs and energy',
      examples: ['DOOM', 'Fortnite', 'Call of Duty'],
    },
    {
      id: 'evocative',
      name: 'Evocative',
      description: 'Poetic titles that capture emotions and atmosphere',
      examples: ['Shadow of the Colossus', 'Hollow Knight', 'Celeste'],
    },
    {
      id: 'numeric',
      name: 'Numeric/Franchise',
      description: 'Series titles with numbers and subtitles',
      examples: ['Final Fantasy VII', 'Civilization VI', 'Mass Effect 2'],
    },
    {
      id: 'mixed',
      name: 'Mixed',
      description: 'Variety of different styles',
      examples: ['Generated titles will vary in approach'],
    },
  ];

  res.json({
    styles,
    count: styles.length,
  });
});

export default router;
