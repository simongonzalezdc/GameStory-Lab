/**
 * Types for AI Project Architect Service
 */

export interface InterviewQuestion {
  id: string;
  phase: 'quick-discovery' | 'deep-dive' | 'open-source';
  category: string;
  question: string;
  helpText?: string;
  options?: string[];
  required: boolean;
  conditionalOn?: {
    questionId: string;
    answer: string | string[];
  };
}

export interface InterviewAnswer {
  questionId: string;
  answer: string | string[];
  timestamp: Date;
}

export interface InterviewSession {
  id: string;
  projectId: string;
  currentPhase: 'quick-discovery' | 'deep-dive' | 'open-source' | 'complete';
  answers: InterviewAnswer[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface ProjectContext {
  // From quick discovery
  projectName?: string;
  projectDescription?: string;
  problemSolved?: string;
  projectType?: string;
  techStack?: {
    frontend?: string;
    backend?: string;
    database?: string;
    hosting?: string;
  };
  keyFeatures?: string[];
  constraints?: {
    timeline?: string;
    budget?: string;
    integrations?: string[];
  };

  // From deep dive
  coreWorkflow?: string;
  dataModel?: string;
  authentication?: string;
  integrations?: string[];
  architecture?: string;
  deployment?: string;
  testing?: string;
  security?: string;
  performance?: string;

  // From open source
  isOpenSource?: boolean;
  license?: string;
  monetizationModel?: string;
}

export interface DocumentTemplate {
  name: string;
  filename: string;
  description: string;
  required: boolean;
}

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    name: 'Executive Summary',
    filename: 'executive-summary.md',
    description: 'Quick reference for humans (1-2 pages)',
    required: true,
  },
  {
    name: 'Technical Specification',
    filename: 'technical-specification.md',
    description: 'Complete technical guide for AI agents',
    required: true,
  },
  {
    name: 'Product Requirements',
    filename: 'product-requirements.md',
    description: 'What to build - features and acceptance criteria',
    required: true,
  },
  {
    name: 'Roadmap',
    filename: 'roadmap.md',
    description: 'Development timeline and phases',
    required: true,
  },
  {
    name: 'Monetization Audit',
    filename: 'monetization-audit.md',
    description: 'Revenue strategy (for open source projects)',
    required: false,
  },
  {
    name: 'Launch Checklist',
    filename: 'launch-checklist.md',
    description: 'Go-to-market plan (for open source projects)',
    required: false,
  },
];

export interface GeneratedDocument {
  templateName: string;
  content: string;
  generatedAt: Date;
}

export interface DocumentationPackage {
  projectId: string;
  sessionId: string;
  documents: GeneratedDocument[];
  context: ProjectContext;
  generatedAt: Date;
}
