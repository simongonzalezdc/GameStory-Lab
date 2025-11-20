/**
 * AI Project Architect Service
 * Main orchestrator for interview and documentation generation
 */

import { InterviewManager } from './interview-manager.js';
import { DocumentGenerator } from './document-generator.js';
import {
  DocumentationPackage,
  GeneratedDocument,
  DOCUMENT_TEMPLATES,
} from './types.js';
import { INTERVIEW_QUESTIONS } from './interview-questions.js';

export class ArchitectService {
  private interviewManager: InterviewManager;
  private documentGenerator: DocumentGenerator;

  // Store documentation packages in memory (in production, use database)
  private documentationPackages: Map<string, DocumentationPackage> = new Map();

  constructor() {
    this.interviewManager = new InterviewManager();
    this.documentGenerator = new DocumentGenerator();
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
   * Generate complete documentation package
   */
  async generateDocumentation(
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
    let pkg = this.documentationPackages.get(projectId);
    
    // If no package exists, create a new one with the assistant's documents
    if (!pkg) {
      const newDocuments: GeneratedDocument[] = updates.map((update) => ({
        templateName: update.name.endsWith('.md') ? update.name : `${update.name}.md`,
        content: update.content,
        generatedAt: new Date(),
      }));

      const newPackage: DocumentationPackage = {
        projectId,
        sessionId: `assistant-${Date.now()}`, // Generate a session ID for assistant-created docs
        documents: newDocuments,
        context: {} as any, // Empty context for assistant-created docs
        generatedAt: new Date(),
      };
      
      this.documentationPackages.set(projectId, newPackage);
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
}

// Export singleton instance
export const architectService = new ArchitectService();
