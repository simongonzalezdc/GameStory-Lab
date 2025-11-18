/**
 * Title Generation API Routes
 * Advanced game title generation endpoints
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import type { Genre } from '@gameforge/shared';
import { aiOrchestrator } from '../server.js';
import { TitleService } from '../services/title/title-service.js';

const router = Router();

// Initialize title service
const titleService = new TitleService(aiOrchestrator);

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

    const titles = await titleService.generateTitles({
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
    console.error('[Titles API] Error generating titles:', error);
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

    const variations = await titleService.generateVariations(baseTitle, count || 5);

    res.json({
      baseTitle,
      variations,
      count: variations.length,
    });
  } catch (error) {
    console.error('[Titles API] Error generating variations:', error);
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

    const seoAnalysis = titleService.analyzeSEO(title, genre as Genre);
    const availability = await titleService.checkAvailability(title);

    res.json({
      title,
      seo: seoAnalysis,
      availability,
      recommendations: seoAnalysis.suggestions,
    });
  } catch (error) {
    console.error('[Titles API] Error analyzing title:', error);
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
