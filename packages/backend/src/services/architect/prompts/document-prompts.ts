import { buildUnifiedPrompt } from '../../ai/prompts/unified-template.js';

export enum DOCUMENT_TYPES {
  EXECUTIVE_SUMMARY = 'executive-summary',
  TECHNICAL_SPECIFICATION = 'technical-specification',
  PRODUCT_REQUIREMENTS = 'product-requirements',
  ROADMAP = 'roadmap',
  LAUNCH_CHECKLIST = 'launch-checklist',
}

type Dependencies = {
  techSpecSummary?: string;
  productReqSummary?: string;
  roadmapSummary?: string;
};

const OUTPUT_GUIDELINES = `
OUTPUT GUIDELINES:
- Output Markdown only. Start with "# [Document Title]" using the document type name.
- Use clear section headers (##) and combine bullet lists, tables, or callouts with concrete values.
- Each section should include at least one measurable metric, timeline, or explicit decision.
- Call out risks, dependencies, and assumptions where relevant.
- Never output placeholders like "TBD"—infer reasonable defaults from the context.
- Maintain a professional tone while delivering high-signal information.
`;

const DOCUMENT_CONFIG: Record<
  DOCUMENT_TYPES,
  {
    role: string;
    description: string;
    sections: Array<{ heading: string; guidance: string }>;
    additional?: string;
  }
> = {
  [DOCUMENT_TYPES.EXECUTIVE_SUMMARY]: {
    role: 'You are a senior product strategist and solutions architect.',
    description:
      'Write a stakeholder-ready Executive Summary that captures the project vision, differentiation, and plan for success.',
    sections: [
      { heading: 'Overview', guidance: 'Summarize the concept, genre blend, and player impact.' },
      {
        heading: 'Value & Metrics',
        guidance: 'Highlight success metrics, timeline to MVP, and strategic priorities.',
      },
      {
        heading: 'Technical Confidence',
        guidance: 'Describe architecture decisions, tech stack, and mitigation for prime risks.',
      },
      {
        heading: 'Next Steps',
        guidance: 'List the first three actions required to get the team coding.',
      },
    ],
  },
  [DOCUMENT_TYPES.TECHNICAL_SPECIFICATION]: {
    role: 'You are a lead solutions architect writing the implementation blueprint.',
    description:
      'Document the technical foundation so the engineering team can build without ambiguity.',
    sections: [
      {
        heading: 'Architecture & Infrastructure',
        guidance: 'Explain the runtime architecture, deployment topology, and scaling approach.',
      },
      {
        heading: 'Tech Stack & Data',
        guidance: 'List frameworks, runtimes, database schema highlights, and data flow.',
      },
      {
        heading: 'API & Integration Strategy',
        guidance: 'Define core APIs, integration contracts, and third-party dependencies.',
      },
      {
        heading: 'Operational Concerns',
        guidance: 'Cover monitoring, CI/CD, security, and performance guardrails.',
      },
    ],
  },
  [DOCUMENT_TYPES.PRODUCT_REQUIREMENTS]: {
    role: 'You are a senior product manager crafting actionable specs.',
    description:
      'Transform the concept into concrete feature requirements, stories, and acceptance criteria.',
    sections: [
      {
        heading: 'Feature Specifications',
        guidance: 'Describe the top 4-6 features, behavior, and dependencies.',
      },
      {
        heading: 'Player Journeys & Stories',
        guidance: 'Capture key player workflows and narrative beats tied to each feature.',
      },
      {
        heading: 'Acceptance Criteria',
        guidance: 'Define testable success criteria for each feature.',
      },
      {
        heading: 'Non-functional Requirements',
        guidance: 'Include performance, reliability, security, and cross-platform expectations.',
      },
    ],
    additional: 'Ensure every feature respects the technical constraints distilled from the architecture summary.',
  },
  [DOCUMENT_TYPES.ROADMAP]: {
    role: 'You are a program manager building the delivery timeline.',
    description:
      'Craft a phased roadmap that balances scope, dependencies, and team capacity.',
    sections: [
      {
        heading: 'Phase 1 – Core Loop MVP',
        guidance: 'List deliverables required to make the core gameplay playable.',
      },
      {
        heading: 'Phase 2 – Expansion & Meta Systems',
        guidance: 'Describe features and meta systems that follow the core experience.',
      },
      {
        heading: 'Phase 3 – Validation & Launch Prep',
        guidance: 'Capture testing, polish, and release readiness tasks with estimated weeks.',
      },
    ],
    additional: 'Tie each phase to dependencies in the tech spec and product requirements, with 4-8 week windows.',
  },
  [DOCUMENT_TYPES.LAUNCH_CHECKLIST]: {
    role: 'You are a launch director ensuring readiness and coordination.',
    description:
      'Produce a launch checklist covering technical validation, go-to-market, and post-launch readiness.',
    sections: [
      {
        heading: 'Technical Validation',
        guidance: 'Outline verification steps, success criteria, and responsible owners.',
      },
      {
        heading: 'Community & Marketing',
        guidance: 'Detail outreach, announcement, and community preparation milestones.',
      },
      {
        heading: 'Legal & Compliance',
        guidance: 'List IP, licensing, and contractual tasks when applicable.',
      },
      {
        heading: 'Launch Day Operations',
        guidance: 'Include KPIs, monitoring, rollback plans, and post-launch actions.',
      },
    ],
    additional:
      'Align launch activities with roadmap milestones and highlight outstanding technical constraints.',
  },
};

function buildDependencyNotes(documentType: DOCUMENT_TYPES, dependencies: Dependencies): string {
  switch (documentType) {
    case DOCUMENT_TYPES.PRODUCT_REQUIREMENTS:
      return `TECHNICAL CONSTRAINTS:\n${dependencies.techSpecSummary || 'Derived directly from the technical specification.'}`;
    case DOCUMENT_TYPES.ROADMAP:
      return [
        `TECHNICAL CONSTRAINTS:\n${dependencies.techSpecSummary || 'Derived from recent architecture decisions.'}`,
        `PRODUCT REQUIREMENTS:\n${dependencies.productReqSummary || 'Product requirements summary pending.'}`,
      ].join('\n\n');
    case DOCUMENT_TYPES.LAUNCH_CHECKLIST:
      return [
        `TECHNICAL SPEC SUMMARY:\n${dependencies.techSpecSummary || 'Technical decisions still being solidified.'}`,
        `PRODUCT REQS SUMMARY:\n${dependencies.productReqSummary || 'Product requirements summary.'}`,
        `ROADMAP SUMMARY:\n${dependencies.roadmapSummary || 'Roadmap phases summary.'}`,
      ].join('\n\n');
    default:
      return '';
  }
}

export function getDocumentPrompt(
  documentType: DOCUMENT_TYPES,
  context: string,
  dependencies: Dependencies = {}
): string {
  const config = DOCUMENT_CONFIG[documentType];
  if (!config) {
    throw new Error(`Unknown document type: ${documentType}`);
  }

  const sectionsText = config.sections
    .map(section => `## ${section.heading}\n${section.guidance}`)
    .join('\n\n');

  const dependencyNotes = buildDependencyNotes(documentType, dependencies);
  const additionalPieces = [dependencyNotes, sectionsText, config.additional]
    .filter(Boolean)
    .join('\n\n');

  return buildUnifiedPrompt({
    taskType: 'assistant',
    roleDescription: config.role,
    taskDescription: config.description,
    context,
    additionalInstructions: `${OUTPUT_GUIDELINES}\n\n${additionalPieces}`,
  });
}

export const DOCUMENT_GENERATION_ORDER: DOCUMENT_TYPES[] = [
  DOCUMENT_TYPES.EXECUTIVE_SUMMARY,
  DOCUMENT_TYPES.TECHNICAL_SPECIFICATION,
  DOCUMENT_TYPES.PRODUCT_REQUIREMENTS,
  DOCUMENT_TYPES.ROADMAP,
  DOCUMENT_TYPES.LAUNCH_CHECKLIST,
];

