/**
 * AI Project Architect Service
 * Main orchestrator for interview and documentation generation
 */

import { InterviewManager } from './interview-manager.js';
import { DocumentGenerator } from './document-generator.js';
import {
  InterviewSession,
  ProjectContext,
  DocumentationPackage,
  GeneratedDocument,
} from './types.js';
import { INTERVIEW_QUESTIONS, getNextQuestion } from './interview-questions.js';

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

// Import template list
import { DOCUMENT_TEMPLATES } from './types.js';

// Export singleton instance
export const architectService = new ArchitectService();
