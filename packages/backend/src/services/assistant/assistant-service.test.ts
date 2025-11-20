/**
 * Assistant Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssistantService } from './assistant-service.js';
import type { PrismaClient } from '@prisma/client';
import type { AIOrchestrator } from '../ai/orchestrator.js';

// Mock Prisma Client
const mockPrisma = {
  chatSession: {
    findFirst: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  chatMessage: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  assistantProposal: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
  },
  project: {
    findUnique: vi.fn(),
  },
  version: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
  },
  aiGeneration: {
    create: vi.fn(),
  },
} as unknown as PrismaClient;

// Mock AI Orchestrator
const mockAIOrchestrator = {
  generate: vi.fn().mockResolvedValue({
    content: JSON.stringify({
      reply: 'Test assistant response',
      proposal: {
        mechanics: { coreLoop: 'test' },
        lore: { setting: { era: 'test' } },
      },
    }),
    model: 'qwen3:4b',
    tokensUsed: { prompt: 100, completion: 50, total: 150 },
    finishReason: 'stop' as const,
  }),
} as unknown as AIOrchestrator;

describe('AssistantService', () => {
  let service: AssistantService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AssistantService(mockPrisma, mockAIOrchestrator);
  });

  describe('Session Management', () => {
    it('should get or create a session', async () => {
      mockPrisma.chatSession.findFirst = vi.fn().mockResolvedValue(null);
      mockPrisma.chatSession.create = vi.fn().mockResolvedValue({
        id: 'session-123',
        projectId: 'project-123',
        type: 'concept',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const session = await service.getOrCreateSession('project-123', 'concept');

      expect(session).toHaveProperty('id');
      expect(session.projectId).toBe('project-123');
      expect(mockPrisma.chatSession.create).toHaveBeenCalled();
    });

    it('should return existing session if found', async () => {
      const existingSession = {
        id: 'session-123',
        projectId: 'project-123',
        type: 'concept',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.chatSession.findFirst = vi.fn().mockResolvedValue(existingSession);

      const session = await service.getOrCreateSession('project-123', 'concept');

      expect(session.id).toBe('session-123');
      expect(mockPrisma.chatSession.create).not.toHaveBeenCalled();
    });
  });

  describe('Message Handling', () => {
    it('should send a message and get response', async () => {
      const session = {
        id: 'session-123',
        projectId: 'project-123',
        type: 'concept',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.chatSession.findUnique = vi.fn().mockResolvedValue(session);
      mockPrisma.chatMessage.create = vi.fn()
        .mockResolvedValueOnce({
          id: 'msg-123',
          sessionId: 'session-123',
          role: 'user',
          content: 'Test message',
          createdAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: 'msg-124',
          sessionId: 'session-123',
          role: 'assistant',
          content: 'Test assistant response',
          createdAt: new Date(),
        });
      mockPrisma.chatMessage.findMany = vi.fn().mockResolvedValue([]);
      mockPrisma.project.findUnique = vi.fn().mockResolvedValue({
        id: 'project-123',
        name: 'Test Project',
        genre: 'rpg',
      });
      mockPrisma.version.findFirst = vi.fn().mockResolvedValue(null);

      const response = await service.sendMessage('session-123', 'Test message');

      expect(response).toHaveProperty('message');
      expect(response.message.content).toBe('Test assistant response');
      expect(mockAIOrchestrator.generate).toHaveBeenCalled();
    });

    it('should get messages for a session', async () => {
      const messages = [
        {
          id: 'msg-1',
          sessionId: 'session-123',
          role: 'user',
          content: 'Hello',
          createdAt: new Date(),
        },
        {
          id: 'msg-2',
          sessionId: 'session-123',
          role: 'assistant',
          content: 'Hi there!',
          createdAt: new Date(),
        },
      ];

      mockPrisma.chatMessage.findMany = vi.fn().mockResolvedValue(messages);

      const result = await service.getMessages('session-123');

      expect(result).toHaveLength(2);
      expect(mockPrisma.chatMessage.findMany).toHaveBeenCalledWith({
        where: { sessionId: 'session-123' },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('Proposal Management', () => {
    it('should list pending proposals', async () => {
      const proposals = [
        {
          id: 'proposal-1',
          sessionId: 'session-123',
          projectId: 'project-123',
          proposalType: 'concept-update',
          status: 'pending',
          payload: { mechanics: {}, lore: {} },
          createdAt: new Date(),
        },
      ];

      mockPrisma.assistantProposal.findMany = vi.fn().mockResolvedValue(proposals);

      const result = await service.listPendingProposals('session-123');

      expect(result).toHaveLength(1);
      expect(mockPrisma.assistantProposal.findMany).toHaveBeenCalledWith({
        where: {
          sessionId: 'session-123',
          status: 'pending',
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should apply a proposal', async () => {
      const proposal = {
        id: 'proposal-123',
        sessionId: 'session-123',
        projectId: 'project-123',
        conceptId: 'concept-123',
        proposalType: 'concept-update',
        status: 'pending',
        payload: {
          mechanics: { coreLoop: 'test' },
          lore: { setting: { era: 'test' } },
        },
        createdAt: new Date(),
      };

      mockPrisma.assistantProposal.findUnique = vi.fn().mockResolvedValue(proposal);
      mockPrisma.version.findFirst = vi.fn().mockResolvedValue({
        id: 'concept-123',
        projectId: 'project-123',
        version: 1,
        mechanics: {},
        lore: {},
        metadata: {},
      });
      mockPrisma.version.findUnique = vi.fn().mockResolvedValue({
        id: 'concept-123',
        projectId: 'project-123',
        version: 1,
        mechanics: {},
        lore: {},
        metadata: {},
      });
      mockPrisma.version.create = vi.fn().mockResolvedValue({
        id: 'concept-124',
        projectId: 'project-123',
        version: 2,
        mechanics: { coreLoop: 'test' },
        lore: { setting: { era: 'test' } },
        metadata: {},
      });
      mockPrisma.assistantProposal.update = vi.fn().mockResolvedValue({
        ...proposal,
        status: 'accepted',
        resolvedAt: new Date(),
      });

      const result = await service.applyProposal('proposal-123');

      expect(result).toHaveProperty('newVersion');
      expect(result.newVersion).toHaveProperty('version');
      expect(mockPrisma.assistantProposal.update).toHaveBeenCalledWith({
        where: { id: 'proposal-123' },
        data: {
          status: 'accepted',
          resolvedAt: expect.any(Date),
        },
      });
    });

    it('should reject a proposal', async () => {
      const proposal = {
        id: 'proposal-123',
        sessionId: 'session-123',
        projectId: 'project-123',
        proposalType: 'concept-update',
        status: 'pending',
        createdAt: new Date(),
      };

      mockPrisma.assistantProposal.findUnique = vi.fn().mockResolvedValue(proposal);
      mockPrisma.assistantProposal.update = vi.fn().mockResolvedValue({
        ...proposal,
        status: 'rejected',
        resolvedAt: new Date(),
      });

      await service.rejectProposal('proposal-123');

      expect(mockPrisma.assistantProposal.update).toHaveBeenCalledWith({
        where: { id: 'proposal-123' },
        data: {
          status: 'rejected',
          resolvedAt: expect.any(Date),
        },
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error if session not found when sending message', async () => {
      mockPrisma.chatSession.findUnique = vi.fn().mockResolvedValue(null);

      await expect(
        service.sendMessage('invalid-session', 'Test message')
      ).rejects.toThrow('Session not found');
    });

    it('should handle AI generation errors gracefully', async () => {
      const session = {
        id: 'session-123',
        projectId: 'project-123',
        type: 'concept',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.chatSession.findUnique = vi.fn().mockResolvedValue(session);
      mockPrisma.chatMessage.create = vi.fn().mockResolvedValue({
        id: 'msg-123',
        sessionId: 'session-123',
        role: 'user',
        content: 'Test message',
        createdAt: new Date(),
      });
      mockPrisma.chatMessage.findMany = vi.fn().mockResolvedValue([]);
      mockPrisma.project.findUnique = vi.fn().mockResolvedValue({
        id: 'project-123',
        name: 'Test Project',
      });
      mockPrisma.version.findFirst = vi.fn().mockResolvedValue(null);
      mockAIOrchestrator.generate = vi.fn().mockRejectedValue(new Error('AI error'));

      await expect(
        service.sendMessage('session-123', 'Test message')
      ).rejects.toThrow();
    });
  });

  describe('Enhanced JSON Parsing', () => {
    // Access the private parseAssistantResponse method for testing
    const getParseMethod = (service: AssistantService) => {
      return (service as any).parseAssistantResponse.bind(service);
    };

    it('should handle responses with explanatory text before JSON', () => {
      const service = new AssistantService(mockPrisma, mockAIOrchestrator);
      const parseMethod = getParseMethod(service);
      
      const response = `Based on your request, I'll analyze the game concept and provide suggestions.

Here's my analysis:

{"reply": "I've reviewed your game concept and have some suggestions for improvement.", "proposal": {"explanation": "The core mechanics need better balance with the lore elements.", "mechanics": {"coreLoop": "Enhanced combat system with strategic elements"}, "lore": {"setting": {"era": "Medieval fantasy with unique magic system"}}}}`;

      const result = parseMethod(response);
      
      expect(result).toHaveProperty('reply');
      expect(result).toHaveProperty('proposal');
      expect(result.reply).toContain('reviewed your game concept');
      expect(result.proposal).toHaveProperty('explanation');
      expect(result.proposal).toHaveProperty('mechanics');
      expect(result.proposal).toHaveProperty('lore');
    });

    it('should handle responses with markdown code blocks', () => {
      const service = new AssistantService(mockPrisma, mockAIOrchestrator);
      const parseMethod = getParseMethod(service);
      
      const response = `I'll provide you with a structured response:

\`\`\`json
{
  "reply": "Here's my analysis of your game concept.",
  "proposal": {
    "explanation": "Improving the progression system will enhance player engagement.",
    "mechanics": {
      "progression": {
        "leveling": "Experience-based with skill trees",
        "rewards": "Tiered loot system"
      }
    },
    "lore": {
      "worldbuilding": {
        "factions": "Three competing kingdoms with complex relationships"
      }
    }
  }
}
\`\`\`

This should help improve your game design.`;

      const result = parseMethod(response);
      
      expect(result).toHaveProperty('reply');
      expect(result).toHaveProperty('proposal');
      expect(result.reply).toContain('analysis of your game concept');
      expect(result.proposal.mechanics).toHaveProperty('progression');
      expect(result.proposal.lore).toHaveProperty('worldbuilding');
    });

    it('should handle responses with reasoning blocks', () => {
      const service = new AssistantService(mockPrisma, mockAIOrchestrator);
      const parseMethod = getParseMethod(service);
      
      const response = `<think>
Let me analyze this game concept step by step:
1. The mechanics seem solid but need refinement
2. The lore could be more integrated with gameplay
3. Overall concept is promising
</think>

Based on my analysis, here are my suggestions:

{"reply": "I've analyzed your game concept and have recommendations.", "proposal": {"explanation": "Better integration between mechanics and lore will create a more cohesive experience.", "mechanics": {"combat": {"system": "Turn-based with tactical elements"}}, "lore": {"history": {"timeline": "Detailed historical events that influence current gameplay"}}}}`;

      const result = parseMethod(response);
      
      expect(result).toHaveProperty('reply');
      expect(result).toHaveProperty('proposal');
      expect(result.reply).toContain('analyzed your game concept');
      expect(result.proposal).toHaveProperty('mechanics');
      expect(result.proposal).toHaveProperty('lore');
    });

    it('should handle malformed JSON that needs fixing', () => {
      const service = new AssistantService(mockPrisma, mockAIOrchestrator);
      const parseMethod = getParseMethod(service);
      
      const response = `Here's my response with some JSON formatting issues:

{
  'reply': 'I have suggestions for your game concept.',
  'proposal': {
    'explanation': 'The mechanics need refinement for better balance.',
    'mechanics': {
      'coreLoop': 'Improved resource management',
    },
    'lore': {
      'setting': {
        'era': 'Cyberpunk future',
      },
    },
  },
}`;

      const result = parseMethod(response);
      
      expect(result).toHaveProperty('reply');
      expect(result).toHaveProperty('proposal');
      expect(result.reply).toContain('suggestions for your game concept');
      expect(result.proposal.explanation).toContain('mechanics need refinement');
    });

    it('should handle completely invalid responses with fallback handling', () => {
      const service = new AssistantService(mockPrisma, mockAIOrchestrator);
      const parseMethod = getParseMethod(service);
      
      const response = `This is not a valid JSON response at all. The AI model seems to have failed to generate the proper format. There's no JSON structure here, just plain text explaining that something went wrong with the response generation.`;

      const result = parseMethod(response);
      
      expect(result).toHaveProperty('reply');
      expect(result.reply).toContain('AI model seems to have failed');
      expect(result.proposal).toBeUndefined();
    });

    it('should handle responses with [REASONING] blocks', () => {
      const service = new AssistantService(mockPrisma, mockAIOrchestrator);
      const parseMethod = getParseMethod(service);
      
      const response = `[REASONING]
I need to analyze the game concept carefully:
- Check the mechanics for balance
- Ensure lore consistency
- Provide actionable suggestions
[/REASONING]

{"reply": "I've completed my analysis of your game concept.", "proposal": {"explanation": "Balancing the mechanics will improve gameplay flow.", "mechanics": {"difficulty": {"scaling": "Adaptive difficulty based on player progress"}}, "lore": {"characters": {"development": "Deeper character backstories"}}}}`;

      const result = parseMethod(response);
      
      expect(result).toHaveProperty('reply');
      expect(result).toHaveProperty('proposal');
      expect(result.reply).toContain('completed my analysis');
      expect(result.proposal.mechanics).toHaveProperty('difficulty');
      expect(result.proposal.lore).toHaveProperty('characters');
    });

    it('should handle responses with "Let me think" prefixes', () => {
      const service = new AssistantService(mockPrisma, mockAIOrchestrator);
      const parseMethod = getParseMethod(service);
      
      const response = `Let me think about your game concept and provide some valuable feedback...

First, let me analyze the core mechanics and how they align with your lore.

{"reply": "After careful consideration, here are my thoughts on your game concept.", "proposal": {"explanation": "Strengthening the connection between mechanics and narrative will enhance player immersion.", "mechanics": {"narrative": {"integration": "Story elements that directly influence gameplay mechanics"}}, "lore": {"themes": {"consistency": "Ensure all lore elements support the core gameplay themes"}}}}`;

      const result = parseMethod(response);
      
      expect(result).toHaveProperty('reply');
      expect(result).toHaveProperty('proposal');
      expect(result.reply).toContain('After careful consideration');
      expect(result.proposal.mechanics).toHaveProperty('narrative');
      expect(result.proposal.lore).toHaveProperty('themes');
    });

    it('should handle responses with only reply field (no proposal)', () => {
      const service = new AssistantService(mockPrisma, mockAIOrchestrator);
      const parseMethod = getParseMethod(service);
      
      const response = `{"reply": "I understand your request but don't have specific changes to propose at this time. Your current game concept looks solid."}`;

      const result = parseMethod(response);
      
      expect(result).toHaveProperty('reply');
      expect(result.reply).toContain("don't have specific changes to propose");
      expect(result.proposal).toBeUndefined();
    });

    it('should handle responses with trailing commas in JSON', () => {
      const service = new AssistantService(mockPrisma, mockAIOrchestrator);
      const parseMethod = getParseMethod(service);
      
      const response = `{
  "reply": "I have some suggestions for your game concept.",
  "proposal": {
    "explanation": "The following changes will improve your game:",
    "mechanics": {
      "combat": "Enhanced combat system",
    },
    "lore": {
      "setting": "More detailed worldbuilding",
    },
  },
}`;

      const result = parseMethod(response);
      
      expect(result).toHaveProperty('reply');
      expect(result).toHaveProperty('proposal');
      expect(result.reply).toContain('suggestions for your game concept');
      expect(result.proposal.explanation).toContain('changes will improve');
    });

    it('should handle responses with nested JSON structures', () => {
      const service = new AssistantService(mockPrisma, mockAIOrchestrator);
      const parseMethod = getParseMethod(service);
      
      const response = `Here's my comprehensive analysis:

\`\`\`json
{
  "reply": "I've analyzed your complex game concept and have detailed suggestions.",
  "proposal": {
    "explanation": "Deep integration between all game systems will create a cohesive experience.",
    "mechanics": {
      "coreLoop": {
        "primary": "Resource gathering and crafting",
        "secondary": {
          "combat": {
            "system": "Real-time with pause",
            "mechanics": ["positioning", "timing", "strategy"]
          },
          "social": {
            "npcs": "Relationship building system",
            "factions": "Dynamic reputation system"
          }
        }
      }
    },
    "lore": {
      "worldbuilding": {
        "cosmology": {
          "deities": ["god1", "god2", "god3"],
          "planes": ["mortal", "divine", "elemental"]
        },
        "history": {
          "ancient": "Lost civilization with advanced technology",
          "recent": "Current political conflicts and alliances"
        }
      }
    }
  }
}
\`\`\``;

      const result = parseMethod(response);
      
      expect(result).toHaveProperty('reply');
      expect(result).toHaveProperty('proposal');
      expect(result.reply).toContain('analyzed your complex game concept');
      expect(result.proposal.mechanics.coreLoop).toHaveProperty('secondary');
      expect(result.proposal.lore.worldbuilding).toHaveProperty('cosmology');
    });

    it('should handle responses with mixed quote styles and escaped characters', () => {
      const service = new AssistantService(mockPrisma, mockAIOrchestrator);
      const parseMethod = getParseMethod(service);
      
      const response = `Here's my analysis with various quote styles:

{
  "reply": "I've analyzed your game and have suggestions with quotes and apostrophes.",
  "proposal": {
    "explanation": "The game needs better handling of special characters and mixed quote styles.",
    "mechanics": {
      "dialogue": {
        "system": "Support for both double quotes and single quotes in dialogue"
      }
    },
    "lore": {
      "story": {
        "theme": "A tale about heroes and their journeys",
        "description": "Characters often say things like it is a beautiful day"
      }
    }
  }
}`;

      const result = parseMethod(response);
      
      expect(result).toHaveProperty('reply');
      expect(result).toHaveProperty('proposal');
      expect(result.reply).toContain('analyzed your game');
      expect(result.proposal.mechanics).toHaveProperty('dialogue');
      expect(result.proposal.lore).toHaveProperty('story');
    });

    it('should handle responses with deeply nested objects and arrays', () => {
      const service = new AssistantService(mockPrisma, mockAIOrchestrator);
      const parseMethod = getParseMethod(service);
      
      const response = `Complex game concept analysis:

\`\`\`json
{
  "reply": "I've analyzed your complex game concept with nested structures.",
  "proposal": {
    "explanation": "Deep nesting requires careful structure management.",
    "mechanics": {
      "gameplay": {
        "systems": [
          {
            "name": "combat",
            "subsystems": {
              "melee": {
                "weapons": ["sword", "axe", "mace"],
                "damage": {
                  "base": 10,
                  "multipliers": {
                    "strength": 1.5,
                    "skill": 1.2
                  }
                }
              },
              "ranged": {
                "weapons": ["bow", "crossbow"],
                "properties": {
                  "range": 50,
                  "accuracy": 0.8
                }
              }
            }
          },
          {
            "name": "magic",
            "schools": [
              {
                "name": "fire",
                "spells": [
                  {"name": "fireball", "damage": 25},
                  {"name": "inferno", "damage": 50}
                ]
              }
            ]
          }
        ]
      }
    },
    "lore": {
      "world": {
        "continents": [
          {
            "name": "Northern Realm",
            "regions": [
              {
                "name": "Frozen Wastes",
                "inhabitants": ["ice giants", "frost wolves"],
                "resources": {
                  "rare": ["ice crystals", "frost ore"],
                  "common": ["snow", "ice"]
                }
              }
            ]
          }
        ]
      }
    }
  }
}
\`\`\``;

      const result = parseMethod(response);
      
      expect(result).toHaveProperty('reply');
      expect(result).toHaveProperty('proposal');
      expect(result.reply).toContain('analyzed your complex game concept');
      expect(result.proposal.mechanics.gameplay.systems).toBeInstanceOf(Array);
      expect(result.proposal.mechanics.gameplay.systems[0].subsystems.melee.weapons).toContain('sword');
      expect(result.proposal.lore.world.continents[0].regions[0].inhabitants).toContain('ice giants');
    });

    it('should handle responses with Unicode and special characters', () => {
      const service = new AssistantService(mockPrisma, mockAIOrchestrator);
      const parseMethod = getParseMethod(service);
      
      const response = `Analysis with Unicode characters:

{
  "reply": "I've reviewed your game concept with various Unicode characters: ñ, ü, é, 中文, 🎮",
  "proposal": {
    "explanation": "The game should properly handle international characters and emojis.",
    "mechanics": {
      "localization": {
        "supported_languages": ["en", "es", "fr", "de", "zh", "ja"],
        "character_sets": ["Latin", "Cyrillic", "CJK", "Emoji"],
        "special_symbols": ["🎮", "⚔️", "🛡️", "🏰"]
      }
    },
    "lore": {
      "setting": {
        "name": "El Reino de los Héroes",
        "description": "A magical world with diverse cultures and characters like: Li Ming, François, Müller",
        "symbols": ["✨", "🌟", "💫"]
      }
    }
  }
}`;

      const result = parseMethod(response);
      
      expect(result).toHaveProperty('reply');
      expect(result).toHaveProperty('proposal');
      expect(result.reply).toContain('ñ');
      expect(result.reply).toContain('🎮');
      expect(result.proposal.mechanics.localization.supported_languages).toContain('zh');
      expect(result.proposal.lore.setting.name).toBe('El Reino de los Héroes');
    });

    it('should handle responses with malformed structure but valid content', () => {
      const service = new AssistantService(mockPrisma, mockAIOrchestrator);
      const parseMethod = getParseMethod(service);
      
      const response = `Here's my response with some structural issues:

{
  "reply": "I have suggestions despite the formatting issues.",
  "proposal": {
    "explanation": "Even with malformed JSON, content should be extractable.",
    "mechanics": {
      "coreLoop": "Improved gameplay flow"
    },
    "lore": {
      "setting": "Enhanced worldbuilding"
    }
  },
  "extra": "This should be ignored"
}

Some additional text after the JSON.`;

      const result = parseMethod(response);
      
      expect(result).toHaveProperty('reply');
      expect(result).toHaveProperty('proposal');
      expect(result.reply).toContain('suggestions despite the formatting');
      expect(result.proposal.explanation).toContain('malformed JSON');
      expect(result.proposal.mechanics).toHaveProperty('coreLoop');
      expect(result.proposal.lore).toHaveProperty('setting');
    });

    it('should demonstrate the fix resolves original formatting issue', () => {
      const service = new AssistantService(mockPrisma, mockAIOrchestrator);
      const parseMethod = getParseMethod(service);
      
      // Test the exact type of response that would have failed before the fix
      const problematicResponse = `Here's my analysis:

Based on your request, I'll provide some suggestions.

{"reply": "I've reviewed your game concept and have recommendations for improvement.", "proposal": {"explanation": "The core mechanics need better balance with the lore elements.", "mechanics": {"coreLoop": "Enhanced combat system with strategic elements"}, "lore": {"setting": {"era": "Medieval fantasy with unique magic system"}}}}

This should help with your game development.`;

      const result = parseMethod(problematicResponse);
      
      // Before the fix, this would have failed or returned malformed data
      // After the fix, it should properly extract the JSON
      expect(result).toHaveProperty('reply');
      expect(result).toHaveProperty('proposal');
      expect(result.reply).toContain('reviewed your game concept');
      expect(result.proposal.explanation).toContain('better balance');
      expect(result.proposal.mechanics).toHaveProperty('coreLoop');
      expect(result.proposal.lore).toHaveProperty('setting');
    });
  });
});

