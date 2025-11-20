/**
 * LLM-Enhanced Genre Blending Service
 * Uses AI to intelligently blend genre templates while resolving conflicts and ambiguities
 */

import type { Genre } from '@gameforge/shared';
import { TemplateService } from '../templates/template-service.js';
import { getAIService } from './ai-service.js';
import { logger } from '../../utils/logger.js';

interface GenreConfig {
  genre: Genre;
  weight: number;
}

interface LLMBlendAnalysis {
  conflicts: Array<{
    type: 'mechanics' | 'lore' | 'setting' | 'conflict' | 'themes';
    description: string;
    severity: 'low' | 'medium' | 'high';
    resolution: string;
  }>;
  coherence_score: number;
  improvements: string[];
}

interface LLMEnhancedBlend {
  template: {
    name: string;
    description: string;
    mechanics: any;
    lore: any;
    tags: string[];
    difficulty: string;
    targetAudience: string;
  };
  analysis: LLMBlendAnalysis;
  blend_strategy: string;
  reasoning: string;
}

export class LLMBlendService {
  private templateService: TemplateService;
  private aiService: any; // AI service instance

  constructor() {
    this.templateService = new TemplateService();
    this.aiService = getAIService();
  }

  /**
   * Intelligently blend genres using LLM analysis
   */
  async blendGenresIntelligently(
    genreConfigs: GenreConfig[],
    designOptions: any
  ): Promise<LLMEnhancedBlend | null> {
    try {
      // Step 1: Get base templates and perform mechanical blend
      const templates = this.getTemplatesWithWeights(genreConfigs);
      if (templates.length === 0) {
        logger.warn('No valid templates found for intelligent blending');
        return null;
      }

      // Step 2: Analyze conflicts and coherence
      const analysis = await this.analyzeBlendConflicts(templates, genreConfigs);

      // Step 3: Generate intelligent blend strategy
      const strategy = await this.generateBlendStrategy(templates, analysis, designOptions);

      // Step 4: Create the enhanced template
      const enhancedTemplate = await this.createEnhancedTemplate(
        templates,
        strategy,
        analysis,
        designOptions
      );

      return {
        template: enhancedTemplate,
        analysis,
        blend_strategy: strategy.strategy,
        reasoning: strategy.reasoning,
      };
    } catch (error) {
      logger.error('Failed to perform LLM-enhanced blending', { error, genreConfigs });
      return null;
    }
  }

  /**
   * Analyze potential conflicts in the genre blend
   */
  private async analyzeBlendConflicts(
    templates: Array<{ template: any; weight: number; genreName: string }>,
    genreConfigs: GenreConfig[]
  ): Promise<LLMBlendAnalysis> {
    const prompt = this.buildConflictAnalysisPrompt(templates, genreConfigs);

    try {
      const response = await this.aiService.generateCompletion({
        prompt,
        systemMessage: 'You are a game design expert analyzing genre compatibility. Provide detailed analysis of conflicts and coherence.',
        temperature: 0.3,
        maxTokens: 1000,
      });

      // Parse the AI response (assuming it returns structured JSON)
      const analysis = this.parseAIAnalysisResponse(response.content);
      
      return {
        conflicts: analysis.conflicts || [],
        coherence_score: analysis.coherence_score || 50,
        improvements: analysis.improvements || [],
      };
    } catch (error) {
      logger.error('Failed to analyze blend conflicts', { error });
      return {
        conflicts: [],
        coherence_score: 50,
        improvements: ['AI analysis unavailable - using standard blending'],
      };
    }
  }

  /**
   * Generate intelligent blend strategy
   */
  private async generateBlendStrategy(
    templates: Array<{ template: any; weight: number; genreName: string }>,
    analysis: LLMBlendAnalysis,
    designOptions: any
  ): Promise<{ strategy: string; reasoning: string }> {
    const prompt = this.buildStrategyPrompt(templates, analysis, designOptions);

    try {
      const response = await this.aiService.generateCompletion({
        prompt,
        systemMessage: 'You are a creative game designer creating a coherent genre hybrid. Focus on resolving conflicts and creating synergy.',
        temperature: 0.7,
        maxTokens: 800,
      });

      return {
        strategy: response.content,
        reasoning: this.extractStrategyReasoning(response.content),
      };
    } catch (error) {
      logger.error('Failed to generate blend strategy', { error });
      return {
        strategy: 'Standard mechanical blending applied due to AI service unavailable',
        reasoning: 'Fallback to traditional blending approach',
      };
    }
  }

  /**
   * Create the enhanced template using AI guidance
   */
  private async createEnhancedTemplate(
    templates: Array<{ template: any; weight: number; genreName: string }>,
    strategy: { strategy: string; reasoning: string },
    analysis: LLMBlendAnalysis,
    designOptions: any
  ): Promise<any> {
    // Create base mechanical blend first
    const baseBlend = this.createMechanicalBlend(templates);

    // Enhance with AI insights
    const prompt = this.buildEnhancementPrompt(baseBlend, templates, strategy, analysis, designOptions);

    try {
      const response = await this.aiService.generateCompletion({
        prompt,
        systemMessage: 'You are enhancing a game template. Create a coherent, well-balanced hybrid that resolves conflicts and maximizes synergy.',
        temperature: 0.6,
        maxTokens: 1500,
      });

      const enhancedTemplate = this.parseAIEnhancementResponse(response.content, baseBlend);
      
      return {
        ...baseBlend,
        ...enhancedTemplate,
        tags: [...baseBlend.tags, 'ai-enhanced', 'conflict-resolved'],
      };
    } catch (error) {
      logger.error('Failed to enhance template with AI', { error });
      return baseBlend; // Return base blend as fallback
    }
  }

  // Helper methods
  private getTemplatesWithWeights(genreConfigs: GenreConfig[]) {
    return genreConfigs
      .map(config => ({
        template: this.templateService.getTemplate(config.genre),
        weight: config.weight,
        genreName: this.templateService.getTemplate(config.genre)?.name || config.genre,
      }))
      .filter(item => item.template !== null) as Array<{
        template: any;
        weight: number;
        genreName: string;
      }>;
  }

  private buildConflictAnalysisPrompt(
    templates: Array<{ template: any; weight: number; genreName: string }>,
    genreConfigs: GenreConfig[]
  ): string {
    const templateSummaries = templates.map(t => ({
      name: t.genreName,
      weight: Math.round(t.weight * 100),
      mechanics: t.template.mechanics.coreLoop,
      setting: t.template.lore.setting?.location || 'Unknown',
      conflict: t.template.lore.conflict?.primary || 'Unknown',
    }));

    return `
Analyze the following genre blend for conflicts and coherence issues:

GENRES TO BLEND:
${templateSummaries.map(t => `- ${t.name} (${t.weight}%): ${t.mechanics}`).join('\n')}

SETTINGS:
${templateSummaries.map(t => `- ${t.name}: ${t.setting}`).join('\n')}

CONFLICTS:
${templateSummaries.map(t => `- ${t.name}: ${t.conflict}`).join('\n')}

Please analyze and return a JSON response with:
{
  "conflicts": [
    {
      "type": "mechanics|lore|setting|conflict|themes",
      "description": "Specific conflict detail",
      "severity": "low|medium|high",
      "resolution": "How to resolve this conflict"
    }
  ],
  "coherence_score": 1-100,
  "improvements": ["List of specific improvements needed"]
}

Focus on identifying gameplay conflicts, narrative coherence issues, and thematic inconsistencies.
`;
  }

  private buildStrategyPrompt(
    templates: Array<{ template: any; weight: number; genreName: string }>,
    analysis: LLMBlendAnalysis,
    designOptions: any
  ): string {
    return `
Create an intelligent blending strategy for these genres:

PRIMARY GENRES: ${templates.map(t => `${t.genreName} (${Math.round(t.weight * 100)}%)`).join(', ')}

CONFLICTS TO RESOLVE:
${analysis.conflicts.map(c => `- ${c.type}: ${c.description} (${c.severity})`).join('\n')}

TARGET EXPERIENCE:
- Tone: ${designOptions.tone}
- Complexity: ${designOptions.complexity} 
- Session Length: ${designOptions.sessionLength}
- Camera Style: ${designOptions.camera}
- Platform: ${designOptions.platform}
- Multiplayer: ${designOptions.multiplayer}
- Art Direction: ${designOptions.artDirection}
- Monetization: ${designOptions.monetization}
- Accessibility: ${designOptions.accessibility}

Create a cohesive strategy that:
1. Resolves identified conflicts
2. Maximizes genre synergy  
3. Matches the target experience across all dimensions
4. Creates a unique but coherent gameplay identity
5. Considers platform, art style, and accessibility requirements

Provide your strategy in a clear, actionable format.
`;
  }

  private buildEnhancementPrompt(
    baseBlend: any,
    templates: Array<{ template: any; weight: number; genreName: string }>,
    strategy: { strategy: string; reasoning: string },
    analysis: LLMBlendAnalysis,
    designOptions: any
  ): string {
    return `
Enhance this basic genre blend into a coherent, conflict-free template:

BASE BLEND:
Name: ${baseBlend.name}
Description: ${baseBlend.description}
Core Loop: ${baseBlend.mechanics.coreLoop}

GENRE SOURCES: ${templates.map(t => `${t.genreName} (${Math.round(t.weight * 100)}%)`).join(', ')}

CONFLICTS RESOLVED: ${analysis.conflicts.map(c => c.resolution).join('; ')}

STRATEGY TO APPLY: ${strategy.strategy}

TARGET DESIGN SPECIFICATIONS:
- Tone/Mood: ${designOptions.tone}
- Complexity Level: ${designOptions.complexity}
- Session Length: ${designOptions.sessionLength}
- Camera Style: ${designOptions.camera}
- Target Platform: ${designOptions.platform}
- Multiplayer Mode: ${designOptions.multiplayer}
- Art Direction: ${designOptions.artDirection}
- Monetization: ${designOptions.monetization}
- Accessibility: ${designOptions.accessibility}

Create an enhanced template that:
- Resolves all identified conflicts
- Matches ALL target design specifications
- Creates smooth gameplay flow aligned with tone and complexity
- Has coherent narrative elements matching the tone
- Maximizes genre synergy within platform constraints
- Considers art style and accessibility requirements
- Aligns monetization approach with gameplay mechanics

Return the enhanced template with improved mechanics, lore, and description that fully matches the design target.
`;
  }

  private parseAIAnalysisResponse(response: string): any {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.error('Failed to parse AI analysis response', { error, response });
    }
    return { conflicts: [], coherence_score: 50, improvements: [] };
  }

  private parseAIEnhancementResponse(response: string, baseTemplate: any): any {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const enhanced = JSON.parse(jsonMatch[0]);
        return {
          name: enhanced.name || baseTemplate.name,
          description: enhanced.description || baseTemplate.description,
          mechanics: enhanced.mechanics || baseTemplate.mechanics,
          lore: enhanced.lore || baseTemplate.lore,
        };
      }
    } catch (error) {
      logger.error('Failed to parse AI enhancement response', { error, response });
    }
    return {};
  }

  private extractStrategyReasoning(response: string): string {
    // Simple extraction - in a real implementation, this would be more sophisticated
    const reasoningMatch = response.match(/reasoning[:\s]+(.+)/i);
    return reasoningMatch ? reasoningMatch[1] : 'Strategy generated by AI analysis';
  }

  private createMechanicalBlend(templates: Array<{ template: any; weight: number; genreName: string }>): any {
    // This uses the existing template service blending logic
    const genreConfigs = templates.map(t => ({ genre: t.template.id, weight: t.weight }));
    const baseBlend = this.templateService.blendGenres(genreConfigs);
    
    if (!baseBlend) {
      // Fallback if template service blending fails
      const genreNames = templates.map(t => t.genreName).join(' + ');
      return {
        id: 'blank',
        name: genreNames,
        description: `Hybrid genre combining ${genreNames}`,
        mechanics: {
          coreLoop: templates.map(t => t.template.mechanics.coreLoop).join(' → '),
          playerActions: templates.flatMap(t => t.template.mechanics.playerActions || []).slice(0, 8),
        },
        lore: {
          setting: {
            location: templates.map(t => t.template.lore.setting?.location || 'Mixed').join(' / '),
          },
          conflict: {
            primary: templates.map(t => t.template.lore.conflict?.primary || 'Adventure').join(' and '),
          },
        },
        tags: templates.flatMap(t => t.template.tags || []),
        difficulty: 'Variable',
        targetAudience: 'Mixed',
      };
    }
    
    return baseBlend;
  }
}

// Export singleton instance
let llmBlendServiceInstance: LLMBlendService | null = null;

export function getLLMBlendService(): LLMBlendService {
  if (!llmBlendServiceInstance) {
    llmBlendServiceInstance = new LLMBlendService();
  }
  return llmBlendServiceInstance;
}
