/**
 * Structured interview questions for AI Project Architect
 * Based on token-optimized approach: 10-25 questions total
 */

import { InterviewQuestion } from './types.js';

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  // ===== PHASE 1: QUICK DISCOVERY (5 Questions) =====
  {
    id: 'q1-project-name',
    phase: 'quick-discovery',
    category: 'basics',
    question: 'What is the name of your game project?',
    helpText: 'This will be used throughout the documentation',
    required: true,
  },
  {
    id: 'q1-project-description',
    phase: 'quick-discovery',
    category: 'basics',
    question: 'Describe your game in one sentence',
    helpText: 'What is the core experience? (e.g., "A roguelike dungeon crawler with deck-building mechanics")',
    required: true,
  },
  {
    id: 'q1-problem-solved',
    phase: 'quick-discovery',
    category: 'basics',
    question: 'What problem does your game solve for players?',
    helpText: 'What gap in the market or player need does it address?',
    required: true,
  },
  {
    id: 'q1-project-type',
    phase: 'quick-discovery',
    category: 'basics',
    question: 'What type of project is this?',
    options: [
      'Desktop game',
      'Mobile game',
      'Web-based game',
      'Console game',
      'Multi-platform',
    ],
    required: true,
  },
  {
    id: 'q1-tech-stack',
    phase: 'quick-discovery',
    category: 'technical',
    question: 'What is your preferred technology stack?',
    helpText: 'Game engine, programming language, frameworks, etc. Say "need recommendations" if unsure',
    required: true,
  },
  {
    id: 'q1-key-features',
    phase: 'quick-discovery',
    category: 'features',
    question: 'What are the top 3-5 must-have MVP features?',
    helpText: 'List the core features that define your game (comma-separated)',
    required: true,
  },
  {
    id: 'q1-constraints',
    phase: 'quick-discovery',
    category: 'planning',
    question: 'What are your key constraints?',
    helpText: 'Timeline, budget, team size, existing code, or other limitations',
    required: false,
  },

  // ===== PHASE 2: DEEP DIVE (Core Functionality - Always Asked) =====
  {
    id: 'q2-primary-workflow',
    phase: 'deep-dive',
    category: 'core-functionality',
    question: 'Describe the primary player workflow step-by-step',
    helpText: 'What does the player do from start to finish in a typical play session?',
    required: true,
  },
  {
    id: 'q2-data-model',
    phase: 'deep-dive',
    category: 'core-functionality',
    question: 'What data needs to be stored and tracked?',
    helpText: 'Player stats, game state, inventory, progress, etc.',
    required: true,
  },
  {
    id: 'q2-authentication',
    phase: 'deep-dive',
    category: 'core-functionality',
    question: 'What are your authentication/user account requirements?',
    options: [
      'No user accounts (single player)',
      'Local save files only',
      'Cloud saves (no login)',
      'User accounts with email/password',
      'Social login (Google, Steam, etc.)',
      'Not sure',
    ],
    required: true,
  },
  {
    id: 'q2-integrations',
    phase: 'deep-dive',
    category: 'core-functionality',
    question: 'What third-party services will you integrate?',
    helpText: 'Payment processing, analytics, leaderboards, social features, etc. (comma-separated or "none")',
    required: false,
  },

  // Deep Dive: Technical Preferences
  {
    id: 'q2-architecture',
    phase: 'deep-dive',
    category: 'technical-preferences',
    question: 'What is your preferred architecture approach?',
    options: [
      'Monolithic (all in one)',
      'Client-server (traditional multiplayer)',
      'Peer-to-peer networking',
      'Serverless (cloud functions)',
      'Not sure',
    ],
    required: true,
  },
  {
    id: 'q2-database',
    phase: 'deep-dive',
    category: 'technical-preferences',
    question: 'What database approach do you prefer?',
    helpText: 'Type, scale, real-time needs',
    options: [
      'No database (local files)',
      'SQLite (embedded)',
      'PostgreSQL/MySQL (relational)',
      'MongoDB (document)',
      'Firebase (real-time)',
      'Not sure',
    ],
    required: true,
  },
  {
    id: 'q2-deployment',
    phase: 'deep-dive',
    category: 'technical-preferences',
    question: 'Where will you deploy and how often?',
    helpText: 'Platform preference, deployment frequency, environments needed',
    required: true,
  },
  {
    id: 'q2-ai-agent',
    phase: 'deep-dive',
    category: 'technical-preferences',
    question: 'Which AI coding agent will you use for development?',
    options: [
      'Claude Code',
      'Cursor',
      'GitHub Copilot',
      'Other',
      'No AI agent',
    ],
    required: true,
  },

  // Deep Dive: Quality & Operations
  {
    id: 'q2-testing-strategy',
    phase: 'deep-dive',
    category: 'quality',
    question: 'What is your testing approach?',
    helpText: 'Unit tests, integration tests, playtesting, coverage goals',
    required: true,
  },
  {
    id: 'q2-security',
    phase: 'deep-dive',
    category: 'quality',
    question: 'What are your security requirements?',
    helpText: 'Compliance, encryption, anti-cheat, data protection',
    required: false,
  },
  {
    id: 'q2-performance',
    phase: 'deep-dive',
    category: 'quality',
    question: 'What are your performance expectations?',
    helpText: 'Target FPS, player count, load times, memory usage',
    required: true,
  },
  {
    id: 'q2-monitoring',
    phase: 'deep-dive',
    category: 'quality',
    question: 'What monitoring and analytics do you need?',
    helpText: 'Error tracking, player analytics, crash reporting, etc.',
    required: false,
  },

  // Deep Dive: Project-Specific (Desktop/Mobile/Web)
  {
    id: 'q2-target-platforms',
    phase: 'deep-dive',
    category: 'platform-specific',
    question: 'What specific platforms will you target?',
    helpText: 'Windows, macOS, Linux, iOS, Android, Web browsers, Consoles',
    required: true,
  },
  {
    id: 'q2-distribution',
    phase: 'deep-dive',
    category: 'platform-specific',
    question: 'How will you distribute your game?',
    options: [
      'Steam',
      'Epic Games Store',
      'itch.io',
      'Google Play',
      'Apple App Store',
      'Own website',
      'Other',
      'Not decided',
    ],
    required: false,
  },

  // ===== PHASE 3: OPEN SOURCE (Conditional) =====
  {
    id: 'q3-open-source',
    phase: 'open-source',
    category: 'strategy',
    question: 'Do you plan to open source this project?',
    options: ['Yes', 'No', 'Maybe / Not decided'],
    required: true,
  },
  {
    id: 'q3-license',
    phase: 'open-source',
    category: 'strategy',
    question: 'What license will you use?',
    options: [
      'MIT (permissive)',
      'Apache 2.0 (permissive with patents)',
      'GPL v3 (copyleft)',
      'Creative Commons',
      'Proprietary',
      'Dual license (open + commercial)',
      'Not decided',
    ],
    required: true,
    conditionalOn: {
      questionId: 'q3-open-source',
      answer: 'Yes',
    },
  },
  {
    id: 'q3-monetization-model',
    phase: 'open-source',
    category: 'strategy',
    question: 'What monetization model are you considering?',
    options: [
      'Completely free (no monetization)',
      'Freemium (free core + paid features)',
      'Open core (free game + paid expansions)',
      'Donations / Sponsorships',
      'Support & Consulting',
      'In-app purchases',
      'Premium version',
      'Not decided',
    ],
    required: false,
    conditionalOn: {
      questionId: 'q3-open-source',
      answer: ['Yes', 'Maybe / Not decided'],
    },
  },
  {
    id: 'q3-community-strategy',
    phase: 'open-source',
    category: 'strategy',
    question: 'What is your community and contribution strategy?',
    helpText: 'How will you handle issues, PRs, feature requests? What governance model?',
    required: false,
    conditionalOn: {
      questionId: 'q3-open-source',
      answer: 'Yes',
    },
  },
];

// Helper function to get questions for a specific phase
export function getQuestionsByPhase(
  phase: 'quick-discovery' | 'deep-dive' | 'open-source'
): InterviewQuestion[] {
  return INTERVIEW_QUESTIONS.filter((q) => q.phase === phase);
}

// Helper function to get next question based on current answers
export function getNextQuestion(
  answers: Map<string, string | string[]>
): InterviewQuestion | null {
  for (const question of INTERVIEW_QUESTIONS) {
    // Skip if already answered
    if (answers.has(question.id)) {
      continue;
    }

    // Check if conditional requirements are met
    if (question.conditionalOn) {
      const { questionId, answer: requiredAnswer } = question.conditionalOn;
      const userAnswer = answers.get(questionId);

      if (!userAnswer) {
        continue; // Prerequisite not answered yet
      }

      // Check if answer matches
      const matches = Array.isArray(requiredAnswer)
        ? requiredAnswer.includes(userAnswer as string)
        : userAnswer === requiredAnswer;

      if (!matches) {
        continue; // Condition not met
      }
    }

    return question;
  }

  return null; // No more questions
}

// Get completion percentage
export function getCompletionPercentage(answers: Map<string, string | string[]>): number {
  const totalRequired = INTERVIEW_QUESTIONS.filter((q) => q.required).length;
  const answeredRequired = INTERVIEW_QUESTIONS.filter(
    (q) => q.required && answers.has(q.id)
  ).length;

  return Math.round((answeredRequired / totalRequired) * 100);
}
