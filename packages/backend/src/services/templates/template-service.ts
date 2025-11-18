/**
 * Genre Template Service
 * Loads and manages pre-built genre templates
 */

import type { MechanicsData, LoreData, Genre } from '@gameforge/shared';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { logger } from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface GenreTemplate {
  id: Genre;
  name: string;
  description: string;
  mechanics: MechanicsData;
  lore: LoreData;
  tags: string[];
  difficulty: string;
  targetAudience: string;
}

export class TemplateService {
  private templates: Map<Genre, GenreTemplate> = new Map();
  private readonly genresDir = path.join(__dirname, 'genres');

  constructor() {
    this.loadTemplates();
  }

  /**
   * Load all genre templates from JSON files
   */
  private loadTemplates(): void {
    const genres: Genre[] = ['rpg', 'fps', 'strategy', 'puzzle', 'survival'];

    for (const genre of genres) {
      try {
        const filePath = path.join(this.genresDir, `${genre}.json`);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const template = JSON.parse(fileContent) as GenreTemplate;

        this.templates.set(genre, template);
        logger.debug('Loaded template', { genre });
      } catch (error) {
        logger.error('Failed to load template', { genre, error });
      }
    }

    logger.info('Template service initialized', { loadedTemplates: this.templates.size });
  }

  /**
   * Get a specific genre template
   */
  getTemplate(genre: Genre): GenreTemplate | null {
    if (genre === 'blank') {
      return this.getBlankTemplate();
    }

    const template = this.templates.get(genre);
    if (!template) {
      logger.warn('Template not found', { genre });
      return null;
    }

    // Return a deep copy to prevent mutation
    return JSON.parse(JSON.stringify(template));
  }

  /**
   * Get all available genre templates
   */
  getAllTemplates(): GenreTemplate[] {
    return Array.from(this.templates.values()).map(template =>
      JSON.parse(JSON.stringify(template))
    );
  }

  /**
   * Get list of available genres
   */
  getAvailableGenres(): Array<{ id: Genre; name: string; description: string }> {
    const genres = Array.from(this.templates.values()).map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
    }));

    // Add blank option
    genres.push({
      id: 'blank',
      name: 'Blank Canvas',
      description: 'Start from scratch with no preset mechanics or lore',
    });

    return genres;
  }

  /**
   * Customize a template with user modifications
   */
  customizeTemplate(
    genre: Genre,
    mechanicsOverrides?: Partial<MechanicsData>,
    loreOverrides?: Partial<LoreData>
  ): { mechanics: MechanicsData; lore: LoreData } | null {
    const template = this.getTemplate(genre);
    if (!template) {
      return null;
    }

    // Deep merge mechanics
    const mechanics: MechanicsData = {
      ...template.mechanics,
      ...mechanicsOverrides,
      // Handle nested objects
      progressionSystems: mechanicsOverrides?.progressionSystems || template.mechanics.progressionSystems,
      resourceSystems: mechanicsOverrides?.resourceSystems || template.mechanics.resourceSystems,
      playerActions: mechanicsOverrides?.playerActions || template.mechanics.playerActions,
      winConditions: mechanicsOverrides?.winConditions || template.mechanics.winConditions,
      failConditions: mechanicsOverrides?.failConditions || template.mechanics.failConditions,
    };

    // Deep merge lore
    const lore: LoreData = {
      ...template.lore,
      ...loreOverrides,
      // Handle nested objects
      setting: {
        ...template.lore.setting,
        ...loreOverrides?.setting,
      },
      protagonist: {
        ...template.lore.protagonist,
        ...loreOverrides?.protagonist,
      },
      conflict: {
        ...template.lore.conflict,
        ...loreOverrides?.conflict,
      },
      worldRules: {
        ...template.lore.worldRules,
        ...loreOverrides?.worldRules,
      },
      themes: loreOverrides?.themes || template.lore.themes,
    };

    return { mechanics, lore };
  }

  /**
   * Generate a blank template for starting from scratch
   */
  private getBlankTemplate(): GenreTemplate {
    return {
      id: 'blank',
      name: 'Blank Canvas',
      description: 'Start from scratch with no preset mechanics or lore',
      mechanics: {
        coreLoop: '',
        playerActions: [],
        progressionSystems: undefined,
        winConditions: [],
        failConditions: [],
        resourceSystems: [],
      },
      lore: {
        setting: {
          era: '',
          location: '',
          worldType: '',
        },
        protagonist: {
          background: '',
          motivation: '',
          abilities: [],
        },
        conflict: {
          primary: '',
          secondary: [],
        },
        worldRules: {
          physics: '',
          magic: '',
          technology: '',
        },
        themes: [],
      },
      tags: [],
      difficulty: 'Flexible',
      targetAudience: 'All creators',
    };
  }

  /**
   * Validate template structure
   */
  validateTemplate(template: GenreTemplate): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!template.id) {
      errors.push('Template missing id');
    }
    if (!template.name) {
      errors.push('Template missing name');
    }
    if (!template.mechanics) {
      errors.push('Template missing mechanics');
    }
    if (!template.lore) {
      errors.push('Template missing lore');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get template statistics
   */
  getTemplateStats(genre: Genre): {
    mechanicsCount: number;
    playerActionsCount: number;
    resourceCount: number;
    themesCount: number;
  } | null {
    const template = this.getTemplate(genre);
    if (!template) {
      return null;
    }

    return {
      mechanicsCount: template.mechanics.playerActions?.length || 0,
      playerActionsCount: template.mechanics.playerActions?.length || 0,
      resourceCount: template.mechanics.resourceSystems?.length || 0,
      themesCount: template.lore.themes?.length || 0,
    };
  }
}

// Singleton instance
let templateServiceInstance: TemplateService | null = null;

export function getTemplateService(): TemplateService {
  if (!templateServiceInstance) {
    templateServiceInstance = new TemplateService();
  }
  return templateServiceInstance;
}
