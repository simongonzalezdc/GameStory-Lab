/**
 * AI Project Architect Service
 * Main orchestrator for interview and documentation generation
 */

import { InterviewManager } from './interview-manager.js';
import { DocumentGenerator } from './document-generator.js';
import { AIDocumentGenerator } from './ai-document-generator.js';
import { ContextBuilder } from './context-builder.js';
import {
  DocumentationPackage,
  GeneratedDocument,
  DOCUMENT_TEMPLATES,
} from './types.js';
import { INTERVIEW_QUESTIONS } from './interview-questions.js';

export class ArchitectService {
  private interviewManager: InterviewManager;
  private documentGenerator: DocumentGenerator;
  private aiDocumentGenerator: AIDocumentGenerator;

  // Store documentation packages in memory (in production, use database)
  private documentationPackages: Map<string, DocumentationPackage> = new Map();

  constructor() {
    this.interviewManager = new InterviewManager();
    this.documentGenerator = new DocumentGenerator();
    // Create ContextBuilder with InterviewManager and inject into AIDocumentGenerator
    const contextBuilder = new ContextBuilder(this.interviewManager);
    this.aiDocumentGenerator = new AIDocumentGenerator(undefined, contextBuilder);
  }

  /**
   * Start a new interview session for a project
   */
  startInterview(projectId: string) {
    const session = this.interviewManager.createSession(projectId);

    // Get first question
    const firstQuestion = INTERVIEW_QUESTIONS[0];

    return {
      sessionId: session.id,
      currentPhase: session.currentPhase,
      firstQuestion,
      totalQuestions: INTERVIEW_QUESTIONS.length,
    };
  }

  /**
   * Submit an answer and get the next question
   */
  submitAnswer(sessionId: string, questionId: string, answer: string | string[]) {
    const result = this.interviewManager.submitAnswer(sessionId, questionId, answer);

    return {
      ...result,
      sessionId,
    };
  }

  /**
   * Get the current session progress
   */
  getSessionProgress(sessionId: string) {
    return this.interviewManager.getSessionProgress(sessionId);
  }

  /**
   * Get all available questions (for UI to display)
   */
  getAllQuestions() {
    return INTERVIEW_QUESTIONS;
  }

  /**
   * Start async AI-powered documentation generation
   * Returns immediately with 202 status, processes in background
   */
  async generateDocumentation(
    projectId: string,
    sessionId: string
  ): Promise<{ status: 'accepted'; message: string }> {
    // Check if generation is already in progress
    const existingPackage = this.documentationPackages.get(projectId);
    if (existingPackage?.generationStatus === 'generating') {
      return {
        status: 'accepted',
        message: 'Documentation generation already in progress'
      };
    }

    // Build context from interview answers
    const context = this.interviewManager.buildProjectContext(sessionId);

    // Initialize documentation package with generating status
    const initialDocuments = this.createInitialDocuments();
    const documentationPackage: DocumentationPackage = {
      projectId,
      sessionId,
      documents: initialDocuments,
      context,
      generatedAt: new Date(),
      generationStatus: 'generating',
      generationStartedAt: new Date(),
    };

    // Store initial package
    this.documentationPackages.set(projectId, documentationPackage);

    // Start background generation
    this.performAsyncGeneration(projectId, sessionId, context)
      .catch(error => {
        console.error('[ArchitectService] Background generation failed:', error);
        this.updatePackageStatus(projectId, 'failed');
      });

    return {
      status: 'accepted',
      message: 'Documentation generation started. This may take 30-60 seconds.'
    };
  }

  /**
   * Generate documentation synchronously (fallback method)
   */
  async generateDocumentationSync(
    projectId: string,
    sessionId: string
  ): Promise<DocumentationPackage> {
    // Build context from interview answers
    const context = this.interviewManager.buildProjectContext(sessionId);

    // Generate all documents
    const documentationPackage = await this.documentGenerator.generateDocumentation(
      projectId,
      sessionId,
      context
    );

    // Store the package (in production, save to database)
    this.documentationPackages.set(projectId, documentationPackage);

    return documentationPackage;
  }

  /**
   * Get generated documentation for a project
   */
  getDocumentation(projectId: string): DocumentationPackage | null {
    return this.documentationPackages.get(projectId) || null;
  }

  /**
   * Get a specific document from a documentation package
   */
  getDocument(projectId: string, documentName: string): GeneratedDocument | null {
    const pkg = this.documentationPackages.get(projectId);
    if (!pkg) return null;

    return pkg.documents.find((d) => d.templateName === documentName) || null;
  }

  /**
   * Apply updates suggested by assistants to existing documentation
   * If no documentation exists, creates a new package with the provided documents
   */
  applyAssistantUpdates(
    projectId: string,
    updates: Array<{ name: string; content: string }>
  ): DocumentationPackage | null {
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      console.warn('[ArchitectService] applyAssistantUpdates called with empty updates', { projectId });
      return null;
    }

    console.log('[ArchitectService] applyAssistantUpdates called', {
      projectId,
      updateCount: updates.length,
      updateNames: updates.map(u => u.name),
      updateSizes: updates.map(u => u.content?.length || 0),
    });

    let pkg = this.documentationPackages.get(projectId);
    
    // If no package exists, create a new one with the assistant's documents
    if (!pkg) {
      console.log('[ArchitectService] Creating new documentation package', { projectId });
      const newDocuments: GeneratedDocument[] = updates.map((update) => ({
        templateName: update.name.endsWith('.md') ? update.name : `${update.name}.md`,
        content: update.content || '',
        generatedAt: new Date(),
        status: 'completed' as const,
      }));

      const newPackage: DocumentationPackage = {
        projectId,
        sessionId: `assistant-${Date.now()}`, // Generate a session ID for assistant-created docs
        documents: newDocuments,
        context: {} as any, // Empty context for assistant-created docs
        generatedAt: new Date(),
        generationStatus: 'completed' as const,
      };
      
      this.documentationPackages.set(projectId, newPackage);
      console.log('[ArchitectService] New documentation package created', {
        projectId,
        documentCount: newPackage.documents.length,
        documentNames: newPackage.documents.map(d => d.templateName),
      });
      return newPackage;
    }

    // Update existing documents
    const updatedDocuments = pkg.documents.map((doc) => {
      const update = updates.find((u) => u.name === doc.templateName || u.name === doc.templateName.replace('.md', ''));
      if (update) {
        return {
          ...doc,
          content: update.content,
          generatedAt: new Date(),
        };
      }
      return doc;
    });

    // Add any new documents that don't exist yet
    const existingNames = new Set(pkg.documents.map(d => d.templateName));
    updates.forEach((update) => {
      const docName = update.name.endsWith('.md') ? update.name : `${update.name}.md`;
      if (!existingNames.has(docName)) {
        updatedDocuments.push({
          templateName: docName,
          content: update.content,
          generatedAt: new Date(),
          status: 'completed' as const,
        });
      }
    });

    const updatedPackage: DocumentationPackage = {
      ...pkg,
      documents: updatedDocuments,
      generatedAt: new Date(),
    };
    this.documentationPackages.set(projectId, updatedPackage);
    return updatedPackage;
  }

  /**
   * Get all document templates info
   */
  getTemplateList() {
    return DOCUMENT_TEMPLATES;
  }

  /**
   * Delete a session and its associated data
   */
  deleteSession(sessionId: string): boolean {
    const session = this.interviewManager.getSession(sessionId);
    if (!session) return false;

    // Clean up documentation if exists
    this.documentationPackages.delete(session.projectId);

    return true;
  }

  /**
   * Create initial documents with generating status
   */
  private createInitialDocuments(): GeneratedDocument[] {
    return DOCUMENT_TEMPLATES.map(template => ({
      templateName: template.filename.replace('.md', ''),
      content: '',
      generatedAt: new Date(),
      status: 'generating' as const,
    }));
  }

  /**
   * Perform async AI document generation in background
   */
  private async performAsyncGeneration(
    projectId: string,
    sessionId: string,
    context: any
  ): Promise<void> {
    try {
      console.log('[ArchitectService] Starting AI document generation', { projectId, sessionId });

      // Generate all documents using AI
      const result = await this.aiDocumentGenerator.generateAllDocuments(sessionId, context);

      // Update package with results
      const package_ = this.documentationPackages.get(projectId);
      if (!package_) {
        throw new Error('Documentation package not found');
      }

        // Update documents with generated content
      const updatedDocuments = package_.documents.map(doc => {
        // Match AI result by comparing documentType enum value with templateName
        // Both should be the same format: 'technical-specification', 'product-requirements', etc.
        const aiResult = result.documents.find(d => {
          // Normalize both values for comparison (remove any .md suffix if present)
          const docType = d.documentType;
          const templateName = doc.templateName.replace('.md', '');
          return docType === templateName;
        });
        if (aiResult) {
          return {
            ...doc,
            content: aiResult.content,
            status: aiResult.success ? ('completed' as const) : ('failed' as const),
            error: aiResult.error,
            generatedAt: new Date(),
          };
        }
        return doc;
      });

      const updatedPackage: DocumentationPackage = {
        ...package_,
        documents: updatedDocuments,
        generationStatus: result.success ? 'completed' : 'failed',
        generationCompletedAt: new Date(),
      };

      this.documentationPackages.set(projectId, updatedPackage);

      console.log('[ArchitectService] AI document generation completed', {
        projectId,
        success: result.success,
        totalTokens: result.totalTokensUsed,
        totalTimeMs: result.totalTimeMs,
        failedDocuments: result.failedDocuments.length,
      });

    } catch (error) {
      console.error('[ArchitectService] AI document generation failed:', error);
      this.updatePackageStatus(projectId, 'failed');
      throw error;
    }
  }

  /**
   * Update package generation status
   */
  private updatePackageStatus(projectId: string, status: 'completed' | 'failed'): void {
    const package_ = this.documentationPackages.get(projectId);
    if (package_) {
      const updatedPackage: DocumentationPackage = {
        ...package_,
        generationStatus: status,
        generationCompletedAt: new Date(),
      };
      this.documentationPackages.set(projectId, updatedPackage);
    }
  }
}

// Export singleton instance
export const architectService = new ArchitectService();
