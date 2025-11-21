/**
 * Context Builder for AI Document Generation
 * Transforms interview data into structured context for AI generation
 */

import { InterviewManager } from './interview-manager.js';
import { ProjectContext, InterviewSession } from './types.js';
import { INTERVIEW_QUESTIONS } from './interview-questions.js';

export class ContextBuilder {
  private interviewManager: InterviewManager;

  constructor(interviewManager?: InterviewManager) {
    this.interviewManager = interviewManager || new InterviewManager();
  }

  /**
   * Build comprehensive context string for AI document generation
   */
  buildPromptContext(sessionId: string): string {
    const session = this.interviewManager.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const context = this.interviewManager.buildProjectContext(sessionId);

    // Build the context sections
    const sections = [
      this.buildProjectOverview(context),
      this.buildInterviewNarrative(session),
      this.buildTechnicalRequirements(context),
      this.buildBusinessConstraints(context),
    ];

    return sections.filter(Boolean).join('\n\n---\n\n');
  }

  /**
   * Build project overview section
   */
  private buildProjectOverview(context: ProjectContext): string {
    const lines = [
      '## PROJECT OVERVIEW',
      '',
      `**Project Name:** ${context.projectName || 'Not specified'}`,
      `**Type:** ${context.projectType || 'Not specified'}`,
      `**Description:** ${context.projectDescription || 'Not specified'}`,
      `**Problem Solved:** ${context.problemSolved || 'Not specified'}`,
    ];

    if (context.keyFeatures && context.keyFeatures.length > 0) {
      lines.push('', '**Key Features:**');
      context.keyFeatures.forEach(feature => {
        lines.push(`- ${feature}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Build narrative from interview Q&A
   */
  private buildInterviewNarrative(session: InterviewSession): string {
    const lines = [
      '## INTERVIEW NARRATIVE',
      '',
      'The following is a chronological record of the interview answers:',
      '',
    ];

    // Group answers by phase
    const phases = ['quick-discovery', 'deep-dive', 'open-source'] as const;

    phases.forEach(phase => {
      const phaseAnswers = session.answers.filter(answer => {
        const question = INTERVIEW_QUESTIONS.find(q => q.id === answer.questionId);
        return question?.phase === phase;
      });

      if (phaseAnswers.length > 0) {
        lines.push(`### ${phase.replace('-', ' ').toUpperCase()} PHASE`);
        lines.push('');

        phaseAnswers.forEach(answer => {
          const question = INTERVIEW_QUESTIONS.find(q => q.id === answer.questionId);
          if (question) {
            lines.push(`**${question.question}**`);
            const answerText = Array.isArray(answer.answer)
              ? answer.answer.join(', ')
              : answer.answer;
            lines.push(`${answerText}`);
            lines.push('');
          }
        });
      }
    });

    return lines.join('\n');
  }

  /**
   * Build technical requirements section
   */
  private buildTechnicalRequirements(context: ProjectContext): string {
    const lines = [
      '## TECHNICAL REQUIREMENTS',
      '',
    ];

    if (context.coreWorkflow) {
      lines.push(`**Core Workflow:** ${context.coreWorkflow}`);
    }

    if (context.dataModel) {
      lines.push(`**Data Model:** ${context.dataModel}`);
    }

    if (context.techStack) {
      lines.push('', '**Technology Stack:**');
      if (context.techStack.frontend) lines.push(`- Frontend: ${context.techStack.frontend}`);
      if (context.techStack.backend) lines.push(`- Backend: ${context.techStack.backend}`);
      if (context.techStack.database) lines.push(`- Database: ${context.techStack.database}`);
      if (context.techStack.hosting) lines.push(`- Hosting: ${context.techStack.hosting}`);
    }

    if (context.architecture) {
      lines.push('', `**Architecture:** ${context.architecture}`);
    }

    if (context.deployment) {
      lines.push(`**Deployment:** ${context.deployment}`);
    }

    if (context.authentication) {
      lines.push(`**Authentication:** ${context.authentication}`);
    }

    if (context.integrations && context.integrations.length > 0) {
      lines.push('', '**Integrations:**');
      context.integrations.forEach(integration => {
        lines.push(`- ${integration}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Build business constraints section
   */
  private buildBusinessConstraints(context: ProjectContext): string {
    const lines = [
      '## BUSINESS CONSTRAINTS',
      '',
    ];

    if (context.constraints?.timeline) {
      lines.push(`**Timeline:** ${context.constraints.timeline}`);
    }

    if (context.constraints?.budget) {
      lines.push(`**Budget:** ${context.constraints.budget}`);
    }

    if (context.testing) {
      lines.push(`**Testing Strategy:** ${context.testing}`);
    }

    if (context.security) {
      lines.push(`**Security Requirements:** ${context.security}`);
    }

    if (context.performance) {
      lines.push(`**Performance Requirements:** ${context.performance}`);
    }

    if (context.isOpenSource !== undefined) {
      lines.push(`**Open Source:** ${context.isOpenSource ? 'Yes' : 'No'}`);
      if (context.isOpenSource) {
        if (context.license) lines.push(`**License:** ${context.license}`);
        if (context.monetizationModel) lines.push(`**Monetization Model:** ${context.monetizationModel}`);
      }
    }

    return lines.join('\n');
  }

}

// Export singleton instance
export const contextBuilder = new ContextBuilder(new InterviewManager());
