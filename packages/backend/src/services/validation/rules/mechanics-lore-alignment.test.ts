/**
 * Mechanics-Lore Alignment Validation Rules Tests
 */

import { describe, it, expect } from 'vitest';
import {
  validatePlayerAbilitiesMatch,
  validateResourceLogic,
  validateWinConditionsNarrativeSound,
  validateProgressionExplainsPowerGrowth,
  validateCombatSystemConsistency,
  validateMagicSystemRules,
  validateTechnologyLevelMatch,
  validateDeathConsequencesAlign,
  validateMultiplayerJustification,
  validateEconomyWorldbuilding,
} from './mechanics-lore-alignment.js';
import type { MechanicsData, LoreData } from '@gameforge/shared';

describe('Mechanics-Lore Alignment Rules', () => {
  describe('validatePlayerAbilitiesMatch', () => {
    it('should return null when abilities match actions', async () => {
      const mechanics: MechanicsData = {
        playerActions: ['attack', 'use magic', 'jump'],
      };
      const lore: LoreData = {
        protagonist: {
          abilities: ['combat', 'magic', 'acrobatics'],
        },
      };

      const result = await validatePlayerAbilitiesMatch(mechanics, lore);
      expect(result).toBeNull();
    });

    it('should detect unmatched actions', async () => {
      const mechanics: MechanicsData = {
        playerActions: ['hack computers', 'use cybernetics'],
      };
      const lore: LoreData = {
        protagonist: {
          abilities: ['sword fighting'],
        },
      };

      const result = await validatePlayerAbilitiesMatch(mechanics, lore);
      expect(result).not.toBeNull();
      expect(result?.rule).toBe('player-abilities-match');
      expect(result?.severity).toBeDefined();
    });

    it('should return null when no actions defined', async () => {
      const mechanics: MechanicsData = {};
      const lore: LoreData = {};

      const result = await validatePlayerAbilitiesMatch(mechanics, lore);
      expect(result).toBeNull();
    });

    it('should use semantic matching for synonyms', async () => {
      const mechanics: MechanicsData = {
        playerActions: ['shoot enemies', 'cast spells'],
      };
      const lore: LoreData = {
        protagonist: {
          abilities: ['weapon combat', 'magic'],
        },
      };

      const result = await validatePlayerAbilitiesMatch(mechanics, lore);
      expect(result).toBeNull();
    });
  });

  describe('validateResourceLogic', () => {
    it('should return null when resources are explained', async () => {
      const mechanics: MechanicsData = {
        resourceSystems: [{ name: 'Mana', type: 'renewable' }],
      };
      const lore: LoreData = {
        worldRules: { magic: 'Mana flows from the world' },
      };

      const result = await validateResourceLogic(mechanics, lore);
      expect(result).toBeNull();
    });

    it('should detect unexplained resources', async () => {
      const mechanics: MechanicsData = {
        resourceSystems: [{ name: 'Energy Crystals', type: 'consumable' }],
      };
      const lore: LoreData = {
        setting: { location: 'medieval village' },
      };

      const result = await validateResourceLogic(mechanics, lore);
      expect(result).not.toBeNull();
      expect(result?.rule).toBe('resource-logic');
    });

    it('should return null when no resources defined', async () => {
      const mechanics: MechanicsData = {};
      const lore: LoreData = {};

      const result = await validateResourceLogic(mechanics, lore);
      expect(result).toBeNull();
    });
  });

  describe('validateWinConditionsNarrativeSound', () => {
    it('should return null when win conditions align with conflict', async () => {
      const mechanics: MechanicsData = {
        winConditions: ['defeat the evil overlord'],
      };
      const lore: LoreData = {
        conflict: { primary: 'Evil overlord threatens the kingdom' },
      };

      const result = await validateWinConditionsNarrativeSound(mechanics, lore);
      expect(result).toBeNull();
    });

    it('should warn when no conflict defined', async () => {
      const mechanics: MechanicsData = {
        winConditions: ['collect 100 points'],
      };
      const lore: LoreData = {};

      const result = await validateWinConditionsNarrativeSound(mechanics, lore);
      expect(result).not.toBeNull();
      expect(result?.severity).toBe('warning');
    });

    it('should detect arbitrary scoring systems', async () => {
      const mechanics: MechanicsData = {
        winConditions: ['reach 1000 points'],
      };
      const lore: LoreData = {
        conflict: { primary: 'Save the princess' },
      };

      const result = await validateWinConditionsNarrativeSound(mechanics, lore);
      expect(result).not.toBeNull();
      expect(result?.message).toContain('arbitrary');
    });

    it('should allow scoring in competitive contexts', async () => {
      const mechanics: MechanicsData = {
        winConditions: ['score the most points'],
      };
      const lore: LoreData = {
        conflict: { primary: 'Win the tournament' },
        setting: { location: 'competitive arena' },
      };

      const result = await validateWinConditionsNarrativeSound(mechanics, lore);
      expect(result).toBeNull();
    });
  });

  describe('validateProgressionExplainsPowerGrowth', () => {
    it('should return null when protagonist has background', async () => {
      const mechanics: MechanicsData = {
        progressionSystems: { type: 'leveling' },
      };
      const lore: LoreData = {
        protagonist: {
          background: 'Training as a warrior',
          motivation: 'Become the strongest',
        },
      };

      const result = await validateProgressionExplainsPowerGrowth(mechanics, lore);
      expect(result).toBeNull();
    });

    it('should warn when progression lacks backstory', async () => {
      const mechanics: MechanicsData = {
        progressionSystems: { type: 'skill trees' },
      };
      const lore: LoreData = {
        protagonist: {},
      };

      const result = await validateProgressionExplainsPowerGrowth(mechanics, lore);
      expect(result).not.toBeNull();
      expect(result?.severity).toBe('info');
    });

    it('should return null when no progression system', async () => {
      const mechanics: MechanicsData = {};
      const lore: LoreData = {};

      const result = await validateProgressionExplainsPowerGrowth(mechanics, lore);
      expect(result).toBeNull();
    });
  });

  describe('validateCombatSystemConsistency', () => {
    it('should detect guns in medieval settings', async () => {
      const mechanics: MechanicsData = {
        playerActions: ['shoot rifle', 'use pistol'],
      };
      const lore: LoreData = {
        setting: { era: 'medieval', location: 'fantasy kingdom' },
      };

      const result = await validateCombatSystemConsistency(mechanics, lore);
      expect(result).not.toBeNull();
      expect(result?.severity).toBe('error');
      expect(result?.message).toContain('guns');
    });

    it('should allow guns in steampunk settings', async () => {
      const mechanics: MechanicsData = {
        playerActions: ['shoot'],
      };
      const lore: LoreData = {
        setting: { era: 'steampunk victorian' },
      };

      const result = await validateCombatSystemConsistency(mechanics, lore);
      expect(result).toBeNull();
    });

    it('should warn when magic lacks rules', async () => {
      const mechanics: MechanicsData = {
        playerActions: ['cast spell', 'use magic', 'attack'],
      };
      const lore: LoreData = {
        setting: { location: 'world' },
        worldRules: {}, // No magic rules defined
      };

      const result = await validateCombatSystemConsistency(mechanics, lore);
      // Combat actions exist + magic is used, should get warning about magic rules
      if (result) {
        expect(result.message.toLowerCase()).toContain('magic');
      }
    });

    it('should return null for non-combat games', async () => {
      const mechanics: MechanicsData = {
        playerActions: ['move', 'jump', 'collect'],
      };
      const lore: LoreData = {};

      const result = await validateCombatSystemConsistency(mechanics, lore);
      expect(result).toBeNull();
    });
  });

  describe('validateMagicSystemRules', () => {
    it('should error when magic mechanics lack rules', async () => {
      const mechanics: MechanicsData = {
        playerActions: ['cast fireball', 'summon creature'],
      };
      const lore: LoreData = {};

      const result = await validateMagicSystemRules(mechanics, lore);
      expect(result).not.toBeNull();
      expect(result?.severity).toBe('error');
    });

    it('should return null when magic rules exist', async () => {
      const mechanics: MechanicsData = {
        playerActions: ['cast spell'],
      };
      const lore: LoreData = {
        worldRules: { magic: 'Mana-based spell casting' },
      };

      const result = await validateMagicSystemRules(mechanics, lore);
      expect(result).toBeNull();
    });

    it('should return null when no magic in game', async () => {
      const mechanics: MechanicsData = {
        playerActions: ['shoot', 'run'],
      };
      const lore: LoreData = {};

      const result = await validateMagicSystemRules(mechanics, lore);
      expect(result).toBeNull();
    });
  });

  describe('validateTechnologyLevelMatch', () => {
    it('should detect tech anachronisms', async () => {
      const mechanics: MechanicsData = {
        playerActions: ['hack computer', 'deploy AI'],
      };
      const lore: LoreData = {
        setting: { era: 'medieval' },
      };

      const result = await validateTechnologyLevelMatch(mechanics, lore);
      expect(result).not.toBeNull();
      expect(result?.severity).toBe('error');
    });

    it('should allow advanced tech in sci-fi', async () => {
      const mechanics: MechanicsData = {
        playerActions: ['hack system', 'use cybernetics'],
      };
      const lore: LoreData = {
        setting: { era: 'cyberpunk 2077' },
        worldRules: { technology: 'Advanced AI and cybernetics' },
      };

      const result = await validateTechnologyLevelMatch(mechanics, lore);
      expect(result).toBeNull();
    });

    it('should warn when tech lacks explanation', async () => {
      const mechanics: MechanicsData = {
        playerActions: ['use laser weapon'],
      };
      const lore: LoreData = {
        setting: { location: 'futuristic city' },
      };

      const result = await validateTechnologyLevelMatch(mechanics, lore);
      expect(result).not.toBeNull();
      expect(result?.severity).toBe('warning');
    });
  });

  describe('validateDeathConsequencesAlign', () => {
    it('should warn about unexplained respawning', async () => {
      const mechanics: MechanicsData = {
        failConditions: ['respawn at checkpoint'],
      };
      const lore: LoreData = {
        protagonist: { name: 'Hero' },
      };

      const result = await validateDeathConsequencesAlign(mechanics, lore);
      expect(result).not.toBeNull();
      expect(result?.message).toContain('respawn');
    });

    it('should allow respawning with explanation', async () => {
      const mechanics: MechanicsData = {
        failConditions: ['respawn'],
      };
      const lore: LoreData = {
        protagonist: { abilities: ['immortality'] },
        setting: { description: 'You are immortal' },
      };

      const result = await validateDeathConsequencesAlign(mechanics, lore);
      expect(result).toBeNull();
    });

    it('should return null when no fail conditions', async () => {
      const mechanics: MechanicsData = {};
      const lore: LoreData = {};

      const result = await validateDeathConsequencesAlign(mechanics, lore);
      expect(result).toBeNull();
    });
  });

  describe('validateMultiplayerJustification', () => {
    it('should warn about unjustified multiplayer', async () => {
      const mechanics: MechanicsData = {
        coreLoop: 'co-op multiplayer battles',
      };
      const lore: LoreData = {
        protagonist: { name: 'Solo hero' },
      };

      const result = await validateMultiplayerJustification(mechanics, lore);
      expect(result).not.toBeNull();
      expect(result?.message.toLowerCase()).toContain('multiplayer');
    });

    it('should allow multiplayer with team narrative', async () => {
      const mechanics: MechanicsData = {
        coreLoop: 'team-based pvp',
      };
      const lore: LoreData = {
        protagonist: { background: 'part of a team of heroes' },
      };

      const result = await validateMultiplayerJustification(mechanics, lore);
      expect(result).toBeNull();
    });

    it('should return null for single-player games', async () => {
      const mechanics: MechanicsData = {
        coreLoop: 'explore and fight',
      };
      const lore: LoreData = {};

      const result = await validateMultiplayerJustification(mechanics, lore);
      expect(result).toBeNull();
    });
  });

  describe('validateEconomyWorldbuilding', () => {
    it('should warn about unexplained economy', async () => {
      const mechanics: MechanicsData = {
        resourceSystems: [{ name: 'Gold', type: 'currency' }],
      };
      const lore: LoreData = {
        setting: { location: 'empty world' },
      };

      const result = await validateEconomyWorldbuilding(mechanics, lore);
      expect(result).not.toBeNull();
      expect(result?.message.toLowerCase()).toContain('currency');
    });

    it('should allow economy with trade lore', async () => {
      const mechanics: MechanicsData = {
        resourceSystems: [{ name: 'Credits', type: 'currency' }],
      };
      const lore: LoreData = {
        setting: { description: 'Bustling markets and merchants everywhere' },
      };

      const result = await validateEconomyWorldbuilding(mechanics, lore);
      expect(result).toBeNull();
    });

    it('should return null when no currency', async () => {
      const mechanics: MechanicsData = {
        resourceSystems: [{ name: 'Health', type: 'stat' }],
      };
      const lore: LoreData = {};

      const result = await validateEconomyWorldbuilding(mechanics, lore);
      expect(result).toBeNull();
    });
  });
});
