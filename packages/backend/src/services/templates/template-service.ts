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
    const genres: Genre[] = [
      'rpg',
      'fps',
      'strategy',
      'puzzle',
      'survival',
      'action-adventure',
      'adventure',
      'battle-royale',
      'sports',
      'fighting',
      'platformer',
      'horror',
      'roguelike',
      'simulation',
      'racing',
    ];

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

  /**
   * Blend multiple genres into a hybrid template
   * @param genreConfigs Array of {genre, weight} pairs. Weights should sum to 1.0
   * @returns Blended genre template combining elements from all sources
   *
   * Examples:
   * - [{genre: 'rpg', weight: 0.7}, {genre: 'fps', weight: 0.3}] = Action RPG
   * - [{genre: 'platformer', weight: 0.5}, {genre: 'adventure', weight: 0.5}] = Metroidvania
   * - [{genre: 'survival', weight: 0.6}, {genre: 'horror', weight: 0.4}] = Survival Horror
   */
  blendGenres(
    genreConfigs: Array<{ genre: Genre; weight: number }>
  ): GenreTemplate | null {
    // Validate inputs
    if (genreConfigs.length === 0) {
      logger.warn('No genres provided for blending');
      return null;
    }

    if (genreConfigs.length === 1) {
      return this.getTemplate(genreConfigs[0].genre);
    }

    // Normalize weights to sum to 1.0
    const totalWeight = genreConfigs.reduce((sum, config) => sum + config.weight, 0);
    const normalizedConfigs = genreConfigs.map(config => ({
      genre: config.genre,
      weight: config.weight / totalWeight,
    }));

    // Sort by weight (highest first) for naming
    const sortedConfigs = [...normalizedConfigs].sort((a, b) => b.weight - a.weight);

    // Get all templates
    const templates = normalizedConfigs
      .map(config => ({
        template: this.getTemplate(config.genre),
        weight: config.weight,
      }))
      .filter(item => item.template !== null) as Array<{
        template: GenreTemplate;
        weight: number;
      }>;

    if (templates.length === 0) {
      logger.warn('No valid templates found for blending');
      return null;
    }

    // Create blended template
    const genreNames = sortedConfigs.map(c => {
      const template = this.getTemplate(c.genre);
      return template?.name || c.genre;
    });

    // Generate hybrid name and description
    const blendedName = genreNames.join(' + ');
    const blendedDescription = `Hybrid genre combining ${genreNames.join(', ')}`;

    // Blend mechanics
    const blendedMechanics = this.blendMechanics(templates);

    // Blend lore
    const blendedLore = this.blendLore(templates);

    // Combine tags (union of all tags)
    const allTags = templates.flatMap(t => t.template.tags);
    const uniqueTags = Array.from(new Set(allTags));

    // Weighted average difficulty
    const difficulties = templates.map(t => t.template.difficulty);
    const blendedDifficulty = difficulties.length > 1
      ? `Varies (${difficulties.join(' + ')})`
      : difficulties[0];

    // Combine target audiences
    const audiences = templates.map(t => t.template.targetAudience);
    const blendedAudience = audiences.join(' and ');

    return {
      id: 'blank', // Blended templates are treated as custom
      name: blendedName,
      description: blendedDescription,
      mechanics: blendedMechanics,
      lore: blendedLore,
      tags: uniqueTags,
      difficulty: blendedDifficulty,
      targetAudience: blendedAudience,
    };
  }

  /**
   * Blend mechanics from multiple templates
   */
  private blendMechanics(
    templates: Array<{ template: GenreTemplate; weight: number }>
  ): MechanicsData {
    // Combine core loops into hybrid description
    const coreLoops = templates.map(t => t.template.mechanics.coreLoop).filter(Boolean);
    const blendedCoreLoop = coreLoops.join(' ⚡ ');

    // Combine player actions (weighted selection)
    const allPlayerActions: string[] = [];
    templates.forEach(({ template, weight }) => {
      const actions = template.mechanics.playerActions || [];
      const numActionsToTake = Math.ceil(actions.length * weight);
      allPlayerActions.push(...actions.slice(0, numActionsToTake));
    });

    // Blend progression systems (use primary with elements from others)
    const progressionTypes = templates.map(t => t.template.mechanics.progressionSystems?.type);
    const hasOpen = progressionTypes.includes('open');
    const hasBranching = progressionTypes.includes('branching');

    let progressionType: 'linear' | 'branching' | 'open' = 'linear';
    if (hasOpen) progressionType = 'open';
    else if (hasBranching) progressionType = 'branching';

    const allProgressionMechanics = templates.flatMap(
      t => t.template.mechanics.progressionSystems?.mechanics || []
    );

    // Combine win/fail conditions
    const allWinConditions = templates.flatMap(
      t => t.template.mechanics.winConditions || []
    );
    const allFailConditions = templates.flatMap(
      t => t.template.mechanics.failConditions || []
    );

    // Combine resource systems (union, avoid duplicates by name)
    const resourceMap = new Map<string, any>();
    templates.forEach(({ template }) => {
      template.mechanics.resourceSystems?.forEach(resource => {
        if (!resourceMap.has(resource.name)) {
          resourceMap.set(resource.name, resource);
        }
      });
    });

    return {
      coreLoop: blendedCoreLoop,
      playerActions: allPlayerActions,
      progressionSystems: {
        type: progressionType,
        mechanics: allProgressionMechanics,
      },
      winConditions: allWinConditions,
      failConditions: allFailConditions,
      resourceSystems: Array.from(resourceMap.values()),
    };
  }

  /**
   * Blend lore from multiple templates
   */
  private blendLore(
    templates: Array<{ template: GenreTemplate; weight: number }>
  ): LoreData {
    const primaryTemplate = templates[0].template;

    // Blend setting (combine elements)
    const eras = templates.map(t => t.template.lore.setting?.era).filter(Boolean);
    const locations = templates.map(t => t.template.lore.setting?.location).filter(Boolean);
    const worldTypes = templates.map(t => t.template.lore.setting?.worldType).filter(Boolean);

    const blendedSetting = {
      era: eras.length > 1 ? eras.join(' meets ') : eras[0] || '',
      location: locations.length > 1 ? locations.join(' transitioning to ') : locations[0] || '',
      worldType: worldTypes.length > 1 ? worldTypes.join(' with ') : worldTypes[0] || '',
    };

    // Blend protagonist (combine abilities, use primary for background/motivation)
    const allAbilities = templates.flatMap(
      t => t.template.lore.protagonist?.abilities || []
    );
    const uniqueAbilities = Array.from(new Set(allAbilities));

    const blendedProtagonist = {
      background: primaryTemplate.lore.protagonist?.background || '',
      motivation: primaryTemplate.lore.protagonist?.motivation || '',
      abilities: uniqueAbilities,
    };

    // Blend conflict (combine primary and secondary conflicts)
    const primaryConflicts = templates.map(t => t.template.lore.conflict?.primary).filter(Boolean);
    const allSecondaryConflicts = templates.flatMap(
      t => t.template.lore.conflict?.secondary || []
    );

    const blendedConflict = {
      primary: primaryConflicts.join(' while also '),
      secondary: allSecondaryConflicts,
    };

    // Blend world rules (combine or use most interesting)
    const physics = templates.map(t => t.template.lore.worldRules?.physics).filter(Boolean);
    const magic = templates.map(t => t.template.lore.worldRules?.magic).filter(Boolean);
    const technology = templates.map(t => t.template.lore.worldRules?.technology).filter(Boolean);

    const blendedWorldRules = {
      physics: physics.length > 1 ? physics.join(' combined with ') : physics[0] || '',
      magic: magic.length > 1 ? magic.join(' alongside ') : magic[0] || '',
      technology: technology.length > 1 ? technology.join(' and ') : technology[0] || '',
    };

    // Combine themes (union)
    const allThemes = templates.flatMap(t => t.template.lore.themes || []);
    const uniqueThemes = Array.from(new Set(allThemes));

    return {
      setting: blendedSetting,
      protagonist: blendedProtagonist,
      conflict: blendedConflict,
      worldRules: blendedWorldRules,
      themes: uniqueThemes,
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
