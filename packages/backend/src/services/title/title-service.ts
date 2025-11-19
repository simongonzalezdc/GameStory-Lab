/**
 * Title Generation Service
 * Advanced game title generation with market analysis and A/B testing
 */

import type { MechanicsData, LoreData, Genre } from '@gameforge/shared';
import { AIOrchestrator } from '../ai/orchestrator.js';
import { logger } from '../../utils/logger.js';

export interface TitleSuggestion {
  title: string;
  rationale: string;
  style: 'descriptive' | 'mysterious' | 'action-oriented' | 'evocative' | 'numeric';
  marketFit: number; // 0-1 score
  seoScore: number; // 0-1 score
  memorability: number; // 0-1 score
  overallScore: number; // weighted average
}

export interface TitleGenerationRequest {
  mechanics?: MechanicsData;
  lore?: LoreData;
  genre?: Genre;
  style?: 'descriptive' | 'mysterious' | 'action-oriented' | 'evocative' | 'numeric' | 'mixed';
  count?: number; // Number of suggestions to generate (default: 10)
  excludeWords?: string[]; // Words to avoid in titles
  mustIncludeWords?: string[]; // Words that should appear in at least some titles
}

export class TitleService {
  constructor(private _aiOrchestrator: AIOrchestrator) {}

  /**
   * Generate title suggestions with advanced analysis
   */
  async generateTitles(request: TitleGenerationRequest): Promise<TitleSuggestion[]> {
    const count = request.count || 10;
    const style = request.style || 'mixed';

    // Build comprehensive prompt
    const prompt = this.buildTitlePrompt(request, count);

    // Call AI
    const response = await this.aiOrchestrator.generate(
      'title',
      [
        { role: 'system', content: this.getSystemMessage(style) },
        { role: 'user', content: prompt },
      ],
      'auto'
    );

    // Parse response
    const rawTitles = this.parseAIResponse(response.content);

    // Analyze and score titles
    const scoredTitles = rawTitles.map(title => this.analyzeTitleQuality(title, request));

    // Sort by overall score
    scoredTitles.sort((a, b) => b.overallScore - a.overallScore);

    return scoredTitles;
  }

  /**
   * Generate title variations for A/B testing
   */
  async generateVariations(baseTitle: string, count: number = 5): Promise<string[]> {
    const prompt = `Generate ${count} variations of the game title "${baseTitle}".

Each variation should:
- Maintain the core concept and feel
- Explore different word choices or structures
- Be equally memorable and marketable

Return as JSON array:
{
  "variations": ["Title 1", "Title 2", ...]
}`;

    const response = await this.aiOrchestrator.generate(
      'title',
      [
        { role: 'system', content: 'You are an expert at creating memorable game title variations.' },
        { role: 'user', content: prompt },
      ],
      'auto'
    );

    const parsed = this.parseAIResponse(response.content);
    return parsed.map((t: any) => t.title);
  }

  /**
   * Check if a title is available (not used by existing games)
   * This is a placeholder - in production would check Steam API, trademark databases, etc.
   */
  async checkAvailability(_title: string): Promise<{ available: boolean; conflicts: string[] }> {
    // Placeholder implementation
    // In production, this would:
    // 1. Check Steam store API
    // 2. Check trademark databases
    // 3. Check Google search results
    // 4. Check domain name availability

    return {
      available: true,
      conflicts: [],
    };
  }

  /**
   * Analyze SEO potential of a title
   */
  analyzeSEO(title: string, genre?: Genre): {
    score: number;
    suggestions: string[];
  } {
    const suggestions: string[] = [];
    let score = 0.5; // baseline

    // Check length (optimal: 2-4 words)
    const wordCount = title.split(' ').length;
    if (wordCount >= 2 && wordCount <= 4) {
      score += 0.2;
    } else if (wordCount === 1) {
      suggestions.push('Consider adding a descriptive word to improve SEO');
    } else if (wordCount > 5) {
      suggestions.push('Title may be too long for effective SEO');
      score -= 0.1;
    }

    // Check for numbers (can be good or bad)
    if (/\d/.test(title)) {
      if (genre === 'strategy' || genre === 'fps') {
        score += 0.1; // Numbers work well for these genres
      } else {
        suggestions.push('Consider removing numbers unless this is a sequel');
      }
    }

    // Check for special characters (generally bad for SEO)
    if (/[^a-zA-Z0-9\s]/.test(title)) {
      score -= 0.1;
      suggestions.push('Special characters may hurt search visibility');
    }

    // Check for common game-related keywords
    const gameKeywords = ['quest', 'legend', 'chronicles', 'saga', 'adventure', 'war', 'battle'];
    const hasKeyword = gameKeywords.some(kw => title.toLowerCase().includes(kw));
    if (hasKeyword) {
      score += 0.1;
    } else {
      suggestions.push('Consider adding a genre-relevant keyword');
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      suggestions,
    };
  }

  /**
   * Build comprehensive title generation prompt
   */
  private buildTitlePrompt(request: TitleGenerationRequest, count: number): string {
    let prompt = `Generate ${count} compelling game title suggestions.\n\n`;

    if (request.genre) {
      prompt += `Genre: ${request.genre}\n`;
      prompt += this.getGenreGuidance(request.genre) + '\n\n';
    }

    if (request.lore) {
      prompt += `Lore/Setting:\n`;
      prompt += `- Era: ${request.lore.setting?.era || 'not specified'}\n`;
      prompt += `- World: ${request.lore.setting?.worldType || 'not specified'}\n`;
      prompt += `- Conflict: ${request.lore.conflict?.primary || 'not specified'}\n`;
      prompt += `- Themes: ${request.lore.themes?.join(', ') || 'not specified'}\n\n`;
    }

    if (request.mechanics) {
      prompt += `Core Gameplay: ${request.mechanics.coreLoop || 'not specified'}\n\n`;
    }

    if (request.style && request.style !== 'mixed') {
      prompt += `Style: Focus on ${request.style} titles\n\n`;
    }

    if (request.excludeWords && request.excludeWords.length > 0) {
      prompt += `AVOID these words: ${request.excludeWords.join(', ')}\n\n`;
    }

    if (request.mustIncludeWords && request.mustIncludeWords.length > 0) {
      prompt += `TRY TO INCLUDE these words in some titles: ${request.mustIncludeWords.join(', ')}\n\n`;
    }

    prompt += `Return as JSON array:\n`;
    prompt += `{\n`;
    prompt += `  "titles": [\n`;
    prompt += `    {\n`;
    prompt += `      "title": "Game Title",\n`;
    prompt += `      "rationale": "Brief explanation of why this title fits",\n`;
    prompt += `      "style": "descriptive|mysterious|action-oriented|evocative|numeric"\n`;
    prompt += `    }\n`;
    prompt += `  ]\n`;
    prompt += `}\n\n`;

    prompt += `Requirements:\n`;
    prompt += `- Each title should be 1-5 words\n`;
    prompt += `- Memorable and unique\n`;
    prompt += `- Genre-appropriate\n`;
    prompt += `- Easy to pronounce and spell\n`;
    prompt += `- Evocative of the game's core experience\n`;
    prompt += `- Searchable and SEO-friendly\n`;
    prompt += `- Mix different styles unless specific style requested\n`;

    return prompt;
  }

  /**
   * Get genre-specific guidance for title generation
   */
  private getGenreGuidance(genre: Genre): string {
    const guidance: Partial<Record<Genre, string>> = {
      rpg: 'RPG titles often use: epic fantasy words, "Chronicles/Legend/Quest/Saga", character/location names',
      fps: 'FPS titles often use: military terms, action words, numbers (series), "Warfare/Combat/Strike/Ops"',
      strategy: 'Strategy titles often use: civilization/empire names, numbers, "War/Conquest/Empire/Total"',
      puzzle: 'Puzzle titles often use: clever wordplay, simple objects, colors, abstract concepts',
      survival: 'Survival titles often use: location/environment, danger words, "The [Noun]", post-apocalyptic terms',
      blank: 'No genre-specific guidance',
    };

    return guidance[genre] || '';
  }

  /**
   * Get system message based on style
   */
  private getSystemMessage(style: string): string {
    if (style === 'mysterious') {
      return 'You are an expert at creating mysterious, intriguing game titles that make players curious.';
    } else if (style === 'action-oriented') {
      return 'You are an expert at creating bold, action-packed game titles with strong verbs and energy.';
    } else if (style === 'descriptive') {
      return 'You are an expert at creating clear, descriptive game titles that immediately communicate the game\'s concept.';
    } else if (style === 'evocative') {
      return 'You are an expert at creating poetic, evocative game titles that capture emotions and atmosphere.';
    } else if (style === 'numeric') {
      return 'You are an expert at creating franchise-style game titles with numbers and subtitles.';
    } else {
      return 'You are an expert at creating memorable, marketable game titles across all styles.';
    }
  }

  /**
   * Parse AI response into title suggestions
   */
  private parseAIResponse(content: string): Array<{ title: string; rationale: string; style?: string }> {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.titles || [];
    } catch (error) {
      logger.error('Failed to parse AI response in title service', { error });
      return [];
    }
  }

  /**
   * Analyze and score a title
   */
  private analyzeTitleQuality(
    titleData: { title: string; rationale: string; style?: string },
    request: TitleGenerationRequest
  ): TitleSuggestion {
    const { title, rationale, style } = titleData;

    // Market fit score (genre appropriateness)
    const marketFit = this.calculateMarketFit(title, request.genre);

    // SEO score
    const seoAnalysis = this.analyzeSEO(title, request.genre);
    const seoScore = seoAnalysis.score;

    // Memorability score (length, uniqueness, pronounceability)
    const memorability = this.calculateMemorability(title);

    // Overall weighted score
    const overallScore = marketFit * 0.4 + seoScore * 0.3 + memorability * 0.3;

    return {
      title,
      rationale,
      style: (style as any) || 'evocative',
      marketFit,
      seoScore,
      memorability,
      overallScore,
    };
  }

  /**
   * Calculate market fit score
   */
  private calculateMarketFit(title: string, genre?: Genre): number {
    if (!genre || genre === 'blank') {
      return 0.7; // neutral score
    }

    let score = 0.5;
    const lower = title.toLowerCase();

    // Genre-specific keywords boost
    const genreKeywords: Partial<Record<Genre, string[]>> = {
      rpg: ['quest', 'legend', 'chronicles', 'saga', 'tales', 'story', 'fantasy'],
      fps: ['warfare', 'combat', 'strike', 'ops', 'force', 'duty', 'battle'],
      strategy: ['empire', 'civilization', 'total', 'war', 'conquest', 'command'],
      puzzle: ['block', 'match', 'zen', 'logic', 'brain', 'think'],
      survival: ['last', 'dead', 'survive', 'apocalypse', 'wilderness', 'stranded'],
      blank: [],
    };

    const keywords = genreKeywords[genre] || [];
    const hasKeyword = keywords.some(kw => lower.includes(kw));
    if (hasKeyword) {
      score += 0.3;
    }

    return Math.min(1, score);
  }

  /**
   * Calculate memorability score
   */
  private calculateMemorability(title: string): number {
    let score = 0.5;

    // Optimal length (2-3 words)
    const wordCount = title.split(' ').length;
    if (wordCount === 2 || wordCount === 3) {
      score += 0.2;
    } else if (wordCount === 1) {
      score += 0.1; // Single word can be great if unique
    } else if (wordCount > 4) {
      score -= 0.1; // Too long
    }

    // Alliteration bonus
    const words = title.split(' ');
    if (words.length >= 2) {
      const firstLetters = words.map(w => w[0].toLowerCase());
      if (new Set(firstLetters).size < firstLetters.length) {
        score += 0.1; // Some alliteration
      }
    }

    // Avoid overly complex words
    const avgWordLength = title.replace(/\s/g, '').length / wordCount;
    if (avgWordLength > 10) {
      score -= 0.1; // Words too long/complex
    }

    return Math.max(0, Math.min(1, score));
  }
}
