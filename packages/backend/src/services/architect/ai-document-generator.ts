/**
 * AI Document Generator
 * Orchestrates AI-powered document generation with MiniMax
 */

import { AIService } from '../ai/ai-service.js';
import { ContextBuilder } from './context-builder.js';
import { DOCUMENT_TYPES, getDocumentPrompt } from './prompts/document-prompts.js';
import { ProjectContext } from './types.js';
import { logger } from '../../utils/logger.js';

export interface DocumentGenerationResult {
  documentType: DOCUMENT_TYPES;
  content: string;
  tokensUsed: number;
  generationTimeMs: number;
  success: boolean;
  error?: string;
}

export interface CascadeGenerationResult {
  documents: DocumentGenerationResult[];
  totalTokensUsed: number;
  totalTimeMs: number;
  success: boolean;
  failedDocuments: DOCUMENT_TYPES[];
}

export class AIDocumentGenerator {
  private aiService: AIService;
  private contextBuilder: ContextBuilder;

  constructor(aiService?: AIService, contextBuilder?: ContextBuilder) {
    this.aiService = aiService || new AIService();
    if (!contextBuilder) {
      throw new Error('ContextBuilder with InterviewManager must be provided to AIDocumentGenerator');
    }
    this.contextBuilder = contextBuilder;
  }

  /**
   * Generate all documents for a project using dependency-aware phases
   */
  async generateAllDocuments(
    sessionId: string,
    projectContext?: ProjectContext
  ): Promise<CascadeGenerationResult> {
    const startTime = Date.now();
    const results: DocumentGenerationResult[] = [];
    const failedDocuments: DOCUMENT_TYPES[] = [];
    let totalTokensUsed = 0;

    // Build base context once per session
    let baseContext: string;
    try {
      baseContext = this.contextBuilder.buildPromptContext(sessionId);
      logger.info('[AIDocumentGenerator] Built and cached context', {
        sessionId,
        baseContextLength: baseContext.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('[AIDocumentGenerator] Failed to build context', {
        sessionId,
        error: errorMessage,
      });
      throw new Error(`Failed to build prompt context: ${errorMessage}`);
    }

    const context = projectContext || ({} as ProjectContext);
    const summaries: Record<string, string> = {};

    logger.info('[AIDocumentGenerator] Starting document generation pipeline', {
      sessionId,
      baseContextLength: baseContext.length,
    });

    // Group 1: Executive Summary
    logger.info('[AIDocumentGenerator] Generating Executive Summary', { sessionId });
    const execSummaryResult = await this.generateDocumentWithRetry(
      DOCUMENT_TYPES.EXECUTIVE_SUMMARY,
      baseContext,
      summaries,
      sessionId,
      context
    );
    results.push(execSummaryResult);
    totalTokensUsed += execSummaryResult.tokensUsed;
    if (!execSummaryResult.success) {
      failedDocuments.push(DOCUMENT_TYPES.EXECUTIVE_SUMMARY);
    }

    // Group 2: Technical Specification
    logger.info('[AIDocumentGenerator] Generating Technical Specification', { sessionId });
    const techSpecResult = await this.generateDocumentWithRetry(
      DOCUMENT_TYPES.TECHNICAL_SPECIFICATION,
      baseContext,
      summaries,
      sessionId,
      context
    );
    results.push(techSpecResult);
    totalTokensUsed += techSpecResult.tokensUsed;
    if (!techSpecResult.success) {
      failedDocuments.push(DOCUMENT_TYPES.TECHNICAL_SPECIFICATION);
    } else {
      summaries.techSpecSummary = this.extractSummary(techSpecResult.content);
    }

    // Group 3: Product Requirements + Roadmap (parallel)
    logger.info('[AIDocumentGenerator] Generating Product Requirements and Roadmap', { sessionId });
    const group3Documents: DOCUMENT_TYPES[] = [
      DOCUMENT_TYPES.PRODUCT_REQUIREMENTS,
      DOCUMENT_TYPES.ROADMAP,
    ];

    const group3Promises = group3Documents.map(docType => 
      this.generateDocumentWithRetry(docType, baseContext, summaries, sessionId, context)
    );

    const group3Results = await Promise.allSettled(group3Promises);
    
    group3Results.forEach((settled, index) => {
      const docType = group3Documents[index];
      if (settled.status === 'fulfilled') {
        const result = settled.value;
        results.push(result);
        totalTokensUsed += result.tokensUsed;
        
        if (!result.success) {
          failedDocuments.push(docType);
        } else {
          const summaryKey = this.getSummaryKey(docType);
          if (summaryKey) {
            summaries[summaryKey] = this.extractSummary(result.content);
          }
        }
      } else {
        const errorMessage = settled.reason instanceof Error ? settled.reason.message : String(settled.reason);
        logger.error(`[AIDocumentGenerator] Promise rejected for ${docType}`, {
          sessionId,
          error: errorMessage,
        });
        results.push({
          documentType: docType,
          content: '',
          tokensUsed: 0,
          generationTimeMs: 0,
          success: false,
          error: errorMessage,
        });
        failedDocuments.push(docType);
      }
    });

    // Group 4: Launch Checklist (final document)
    logger.info('[AIDocumentGenerator] Generating Launch Checklist', { sessionId });
    if (!summaries.roadmapSummary) {
      logger.warn('[AIDocumentGenerator] Roadmap summary missing, launch checklist will still run', {
        sessionId,
      });
    }
      const launchChecklistResult = await this.generateDocumentWithRetry(
        DOCUMENT_TYPES.LAUNCH_CHECKLIST,
        baseContext,
        summaries,
        sessionId,
        context
      );
      results.push(launchChecklistResult);
      totalTokensUsed += launchChecklistResult.tokensUsed;
      if (!launchChecklistResult.success) {
        failedDocuments.push(DOCUMENT_TYPES.LAUNCH_CHECKLIST);
    }

    const totalTime = Date.now() - startTime;
    const success = failedDocuments.length === 0;

    logger.info('[AIDocumentGenerator] Document generation completed', {
      sessionId,
      totalDocuments: results.length,
      failedDocuments: failedDocuments.length,
      totalTokensUsed,
      totalTimeMs: totalTime,
      success,
    });

    return {
      documents: results,
      totalTokensUsed,
      totalTimeMs: totalTime,
      success,
      failedDocuments,
    };
  }

  /**
   * Generate a single document with retry logic and timing
   */
  private async generateDocumentWithRetry(
    documentType: DOCUMENT_TYPES,
    baseContext: string,
    summaries: Record<string, string>,
    sessionId: string,
    projectContext?: ProjectContext
  ): Promise<DocumentGenerationResult> {
    const docStartTime = Date.now();
    
    try {
      const prompt = getDocumentPrompt(documentType, baseContext, summaries);
      const result = await this.generateSingleDocument(documentType, prompt);

      const docTime = Date.now() - docStartTime;
      result.generationTimeMs = docTime;

      logger.info(`[AIDocumentGenerator] Generated ${documentType}`, {
        sessionId,
        tokensUsed: result.tokensUsed,
        timeMs: docTime,
        success: result.success,
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`[AIDocumentGenerator] Failed to generate ${documentType}`, {
        sessionId,
        error: errorMessage,
      });

      return {
        documentType,
        content: '',
        tokensUsed: 0,
        generationTimeMs: Date.now() - docStartTime,
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Generate a single document with retry logic
   */
  private async generateSingleDocument(
    documentType: DOCUMENT_TYPES,
    prompt: string,
    maxRetries: number = 3
  ): Promise<DocumentGenerationResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.aiService.generateCompletion({
          prompt,
          modelPreference: 'minimax',
          temperature: 0.1, // Low temperature for consistency
          maxTokens: 8000, // Large context for detailed docs
        });

        const content = this.parseDocumentContent(response.content);
        if (!content) {
          throw new Error(`Parsed content for ${documentType} was empty`);
        }

        return {
          documentType,
          content,
          tokensUsed: response.usage?.total_tokens || 0,
          generationTimeMs: 0, // Will be set by caller
          success: true,
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        logger.warn(`[AIDocumentGenerator] Attempt ${attempt} failed for ${documentType}`, {
          error: lastError.message,
          attempt,
          maxRetries,
        });

        // Exponential backoff: 1s, 2s, 4s
        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    // All retries failed
    throw lastError || new Error(`Failed to generate ${documentType} after ${maxRetries} attempts`);
  }

  /**
   * Parse document content from AI response with robust fallback logic
   */
  private parseDocumentContent(rawResponse: string): string {
    // 1. Try extracting XML block
    const xmlMatch = rawResponse.match(/<document_content>([\s\S]*?)<\/document_content>/);
    if (xmlMatch && xmlMatch[1]) {
      return xmlMatch[1].trim();
    }

    // 2. Fallback: Strip markdown code fences if the model wrapped it in ```markdown
    const codeBlockMatch = rawResponse.match(/```(?:markdown)?([\s\S]*?)```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      return codeBlockMatch[1].trim();
    }

    // 3. Look for markdown headers as a last resort (documents usually start with #)
    const headerMatch = rawResponse.match(/(^|\n)#+\s+.+(\n|$)/m);
    if (headerMatch) {
      // Extract from first header to end
      const headerIndex = rawResponse.indexOf(headerMatch[0]);
      return rawResponse.substring(headerIndex).trim();
    }

    // 4. Last resort: Return raw (cleaned)
    return rawResponse
      .replace(/^```[\s\S]*?```$/gm, '') // Remove any code blocks
      .replace(/<[^>]*>/g, '') // Remove any remaining XML tags
      .trim();
  }

  /**
   * Get the summary key name for a document type (for dependency injection)
   */
  private getSummaryKey(documentType: DOCUMENT_TYPES): string | null {
    const keyMap: Record<DOCUMENT_TYPES, string | null> = {
      [DOCUMENT_TYPES.EXECUTIVE_SUMMARY]: null,
      [DOCUMENT_TYPES.TECHNICAL_SPECIFICATION]: 'techSpecSummary',
      [DOCUMENT_TYPES.PRODUCT_REQUIREMENTS]: 'productReqSummary',
      [DOCUMENT_TYPES.ROADMAP]: 'roadmapSummary',
      [DOCUMENT_TYPES.LAUNCH_CHECKLIST]: null,
    };
    return keyMap[documentType] || null;
  }

  /**
   * Extract a brief summary from generated content for dependency injection
   */
  private extractSummary(content: string): string {
    // Extract first 500 characters or first paragraph, whichever is shorter
    const firstParagraph = content.split('\n\n')[0] || '';
    const summary = firstParagraph.length > 500
      ? firstParagraph.substring(0, 500) + '...'
      : firstParagraph;

    return summary;
  }

  /**
   * Set the interview manager for context building
   */
  setInterviewManager(interviewManager: any) {
    // This allows dependency injection for testing
    if (this.contextBuilder && typeof this.contextBuilder === 'object') {
      (this.contextBuilder as any).interviewManager = interviewManager;
    }
  }
}

// Note: AIDocumentGenerator requires ContextBuilder with InterviewManager
// Use ArchitectService which properly initializes this dependency
