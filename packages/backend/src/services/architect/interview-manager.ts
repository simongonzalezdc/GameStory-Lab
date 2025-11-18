/**
 * Interview Manager for AI Project Architect
 * Handles interview flow, state management, and answer processing
 */

import { randomUUID } from 'crypto';
import {
  InterviewSession,
  InterviewAnswer,
  ProjectContext,
} from './types.js';
import {
  INTERVIEW_QUESTIONS,
  getNextQuestion,
  getCompletionPercentage,
  getQuestionsByPhase,
} from './interview-questions.js';

export class InterviewManager {
  private sessions: Map<string, InterviewSession> = new Map();

  /**
   * Start a new interview session for a project
   */
  createSession(projectId: string): InterviewSession {
    const session: InterviewSession = {
      id: randomUUID(),
      projectId,
      currentPhase: 'quick-discovery',
      answers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Get an existing session
   */
  getSession(sessionId: string): InterviewSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Submit an answer to the current question
   */
  submitAnswer(
    sessionId: string,
    questionId: string,
    answer: string | string[]
  ): {
    success: boolean;
    nextQuestion: any | null;
    phaseComplete: boolean;
    interviewComplete: boolean;
    completionPercentage: number;
  } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Validate question exists
    const question = INTERVIEW_QUESTIONS.find((q) => q.id === questionId);
    if (!question) {
      throw new Error(`Question ${questionId} not found`);
    }

    // Store the answer
    const answerObj: InterviewAnswer = {
      questionId,
      answer,
      timestamp: new Date(),
    };

    // Remove previous answer if exists (allow re-answering)
    session.answers = session.answers.filter((a) => a.questionId !== questionId);
    session.answers.push(answerObj);
    session.updatedAt = new Date();

    // Get answers map for helper functions
    const answersMap = new Map<string, string | string[]>();
    session.answers.forEach((a) => answersMap.set(a.questionId, a.answer));

    // Determine next question
    const nextQuestion = getNextQuestion(answersMap);
    const completionPercentage = getCompletionPercentage(answersMap);

    // Check if current phase is complete
    const currentPhaseQuestions = getQuestionsByPhase(session.currentPhase);
    const currentPhaseAnswered = currentPhaseQuestions.every(
      (q) => answersMap.has(q.id) || !q.required
    );

    let phaseComplete = false;
    let interviewComplete = false;

    // Advance phase if current is complete
    if (currentPhaseAnswered) {
      phaseComplete = true;

      if (session.currentPhase === 'quick-discovery') {
        session.currentPhase = 'deep-dive';
      } else if (session.currentPhase === 'deep-dive') {
        // Check if user wants to do open source phase
        const openSourceAnswer = answersMap.get('q3-open-source');
        if (openSourceAnswer === 'Yes') {
          session.currentPhase = 'open-source';
        } else {
          session.currentPhase = 'complete';
          session.completedAt = new Date();
          interviewComplete = true;
        }
      } else if (session.currentPhase === 'open-source') {
        session.currentPhase = 'complete';
        session.completedAt = new Date();
        interviewComplete = true;
      }
    }

    return {
      success: true,
      nextQuestion,
      phaseComplete,
      interviewComplete,
      completionPercentage,
    };
  }

  /**
   * Build project context from interview answers
   */
  buildProjectContext(sessionId: string): ProjectContext {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const answersMap = new Map<string, string | string[]>();
    session.answers.forEach((a) => answersMap.set(a.questionId, a.answer));

    // Extract context from answers
    const context: ProjectContext = {
      projectName: answersMap.get('q1-project-name') as string,
      projectDescription: answersMap.get('q1-project-description') as string,
      problemSolved: answersMap.get('q1-problem-solved') as string,
      projectType: answersMap.get('q1-project-type') as string,
      keyFeatures: this.parseCommaSeparated(answersMap.get('q1-key-features')),
      coreWorkflow: answersMap.get('q2-primary-workflow') as string,
      dataModel: answersMap.get('q2-data-model') as string,
      authentication: answersMap.get('q2-authentication') as string,
      integrations: this.parseCommaSeparated(answersMap.get('q2-integrations')),
      architecture: answersMap.get('q2-architecture') as string,
      deployment: answersMap.get('q2-deployment') as string,
      testing: answersMap.get('q2-testing-strategy') as string,
      security: answersMap.get('q2-security') as string,
      performance: answersMap.get('q2-performance') as string,
      isOpenSource: answersMap.get('q3-open-source') === 'Yes',
      license: answersMap.get('q3-license') as string,
      monetizationModel: answersMap.get('q3-monetization-model') as string,
    };

    // Parse tech stack from q1-tech-stack
    const techStackAnswer = answersMap.get('q1-tech-stack') as string;
    if (techStackAnswer && techStackAnswer !== 'need recommendations') {
      // Try to extract tech stack info (simplified parsing)
      context.techStack = {
        frontend: techStackAnswer.match(/frontend[:\s]*([^,\n]+)/i)?.[1]?.trim(),
        backend: techStackAnswer.match(/backend[:\s]*([^,\n]+)/i)?.[1]?.trim(),
        database: answersMap.get('q2-database') as string,
        hosting: techStackAnswer.match(/hosting[:\s]*([^,\n]+)/i)?.[1]?.trim(),
      };
    }

    // Parse constraints from q1-constraints
    const constraintsAnswer = answersMap.get('q1-constraints') as string;
    if (constraintsAnswer) {
      context.constraints = {
        timeline: constraintsAnswer.match(/timeline[:\s]*([^,\n]+)/i)?.[1]?.trim(),
        budget: constraintsAnswer.match(/budget[:\s]*([^,\n]+)/i)?.[1]?.trim(),
        integrations: this.parseCommaSeparated(
          constraintsAnswer.match(/integrations?[:\s]*([^,\n]+)/i)?.[1]
        ),
      };
    }

    return context;
  }

  /**
   * Get all questions with their answers for a session
   */
  getSessionProgress(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const answersMap = new Map<string, string | string[]>();
    session.answers.forEach((a) => answersMap.set(a.questionId, a.answer));

    const questions = INTERVIEW_QUESTIONS.map((q) => ({
      ...q,
      answer: answersMap.get(q.id),
      answered: answersMap.has(q.id),
    }));

    return {
      session,
      questions,
      completionPercentage: getCompletionPercentage(answersMap),
      currentPhase: session.currentPhase,
    };
  }

  /**
   * Helper: Parse comma-separated string into array
   */
  private parseCommaSeparated(value: any): string[] | undefined {
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string') return undefined;

    return value
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }
}
