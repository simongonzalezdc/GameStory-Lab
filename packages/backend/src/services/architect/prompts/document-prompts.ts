/**
 * Document Generation Prompts for AI Architect
 * Structured prompts with dependency-aware generation
 */

export enum DOCUMENT_TYPES {
  EXECUTIVE_SUMMARY = 'executive-summary',
  TECHNICAL_SPECIFICATION = 'technical-specification',
  PRODUCT_REQUIREMENTS = 'product-requirements',
  ROADMAP = 'roadmap',
  MONETIZATION_AUDIT = 'monetization-audit',
  LAUNCH_CHECKLIST = 'launch-checklist',
}

/**
 * Base system prompt shared across all document generation
 */
export const DOCUMENT_GENERATOR_SYSTEM_PROMPT = `
You are the Lead Solutions Architect for a serious game studio.
Your goal is to write production-ready documentation.

RULES:
1. NO placeholders. If data is missing, infer reasonable defaults based on the genre/scope.
2. PROFESSIONAL TONE. Concise, active voice. No fluff.
3. STRICT FORMATTING. Use Markdown.
4. CONSISTENCY. Adhere strictly to the provided Project Context.

OUTPUT FORMAT:
You must wrap your content in XML tags like this:
<document_content>
# Document Title
... content ...
</document_content>
`;

/**
 * Executive Summary Prompt - Foundation document
 */
export const EXECUTIVE_SUMMARY_PROMPT = (context: string) => `
${DOCUMENT_GENERATOR_SYSTEM_PROMPT}

CONTEXT:
${context}

TASK:
Write the Executive Summary.
Focus on:
- Project overview (2-3 sentences)
- Key technical decisions (architecture, tech stack)
- Business viability (timeline, constraints)
- Success metrics

CRITICAL REASONING:
Before writing, analyze the entire context to understand the project's scope and complexity.
If it's a complex multiplayer game, emphasize scalability and networking.
If it's a simple mobile game, focus on user acquisition and retention.
`;

/**
 * Technical Specification Prompt - Depends on nothing, creates foundation
 */
export const TECH_SPEC_PROMPT = (context: string) => `
${DOCUMENT_GENERATOR_SYSTEM_PROMPT}

CONTEXT:
${context}

TASK:
Write the Technical Specification.
Focus on:
- Scalable Architecture (Monorepo, Microservices vs Monolith)
- Database Schema (Entities for the specific game mechanics mentioned)
- API Strategy (REST vs GraphQL)
- Infrastructure (Cloud providers, deployment strategy)

CRITICAL REASONING:
Before writing, analyze the 'Technical Requirements' section in the context.
If the game is Multiplayer, you MUST include WebSocket architecture.
If the game is Single Player, focus on local state persistence.
For database schema, create entities based on the 'Data Model' description.
`;

/**
 * Product Requirements Prompt - Depends on Technical Spec
 */
export const PRODUCT_REQUIREMENTS_PROMPT = (context: string, techSpecSummary: string) => `
${DOCUMENT_GENERATOR_SYSTEM_PROMPT}

CONTEXT:
${context}

TECHNICAL CONSTRAINTS:
${techSpecSummary}

TASK:
Write the Product Requirements Document.
Focus on:
- Detailed feature specifications with acceptance criteria
- User stories for each key feature
- Non-functional requirements (performance, security)
- Integration requirements

CRITICAL REASONING:
Use the Technical Constraints to ensure all requirements are implementable.
Each feature should have clear acceptance criteria that can be tested.
If the technical spec mentions specific technologies, ensure requirements align.
`;

/**
 * Development Roadmap Prompt - Depends on Tech Spec and Product Requirements
 */
export const ROADMAP_PROMPT = (context: string, techSpecSummary: string, productReqSummary: string) => `
${DOCUMENT_GENERATOR_SYSTEM_PROMPT}

CONTEXT:
${context}

TECHNICAL CONSTRAINTS:
${techSpecSummary}

PRODUCT REQUIREMENTS:
${productReqSummary}

TASK:
Create a Phased Development Roadmap.
Focus on:
- Phase 1: Core Loop Implementation (must be playable MVP)
- Phase 2: Meta-Game and Advanced Features
- Phase 3: Polish, Testing, and Launch Preparation
- Timeline estimates based on complexity
- Dependencies between features

CRITICAL REASONING:
Phase 1 must implement the "Core Loop" defined in the context.
Phase 2 must implement the "Meta-Game" features.
Ensure the timeline accounts for the complexity of the stack defined in Technical Constraints.
Each phase should be 4-8 weeks maximum for maintainable development.
`;

/**
 * Monetization Audit Prompt - For open source projects
 */
export const MONETIZATION_AUDIT_PROMPT = (context: string) => `
${DOCUMENT_GENERATOR_SYSTEM_PROMPT}

CONTEXT:
${context}

TASK:
Write the Monetization Audit for this open source project.
Focus on:
- Revenue model analysis (subscriptions, donations, sponsorships)
- Market positioning for monetization
- Community building strategies
- Funding sources (grants, crowdfunding, corporate sponsorship)
- Sustainability metrics

CRITICAL REASONING:
Since this is an open source project, focus on community-driven monetization.
Analyze the project's value proposition for potential sponsors.
Consider the project's scale and target audience for revenue potential.
`;

/**
 * Launch Checklist Prompt - Depends on all previous documents
 */
export const LAUNCH_CHECKLIST_PROMPT = (
  context: string,
  techSpecSummary: string,
  productReqSummary: string,
  roadmapSummary: string
) => `
${DOCUMENT_GENERATOR_SYSTEM_PROMPT}

CONTEXT:
${context}

TECHNICAL SPECIFICATION:
${techSpecSummary}

PRODUCT REQUIREMENTS:
${productReqSummary}

DEVELOPMENT ROADMAP:
${roadmapSummary}

TASK:
Create a comprehensive Launch Checklist.
Focus on:
- Pre-launch technical validation
- Marketing and community preparation
- Legal and compliance requirements
- Go-to-market strategy
- Success metrics and KPIs

CRITICAL REASONING:
Ensure all checklist items are actionable and testable.
Consider the technical complexity from the specification.
Include timeline-based milestones from the roadmap.
For open source projects, emphasize community engagement and documentation.
`;

/**
 * Get prompt for document type with dependencies
 */
export function getDocumentPrompt(
  documentType: DOCUMENT_TYPES,
  context: string,
  dependencies: {
    techSpecSummary?: string;
    productReqSummary?: string;
    roadmapSummary?: string;
  } = {}
): string {
  switch (documentType) {
    case DOCUMENT_TYPES.EXECUTIVE_SUMMARY:
      return EXECUTIVE_SUMMARY_PROMPT(context);

    case DOCUMENT_TYPES.TECHNICAL_SPECIFICATION:
      return TECH_SPEC_PROMPT(context);

    case DOCUMENT_TYPES.PRODUCT_REQUIREMENTS:
      return PRODUCT_REQUIREMENTS_PROMPT(context, dependencies.techSpecSummary || '');

    case DOCUMENT_TYPES.ROADMAP:
      return ROADMAP_PROMPT(
        context,
        dependencies.techSpecSummary || '',
        dependencies.productReqSummary || ''
      );

    case DOCUMENT_TYPES.MONETIZATION_AUDIT:
      return MONETIZATION_AUDIT_PROMPT(context);

    case DOCUMENT_TYPES.LAUNCH_CHECKLIST:
      return LAUNCH_CHECKLIST_PROMPT(
        context,
        dependencies.techSpecSummary || '',
        dependencies.productReqSummary || '',
        dependencies.roadmapSummary || ''
      );

    default:
      throw new Error(`Unknown document type: ${documentType}`);
  }
}

/**
 * Document generation order with dependencies
 */
export const DOCUMENT_GENERATION_ORDER: DOCUMENT_TYPES[] = [
  DOCUMENT_TYPES.EXECUTIVE_SUMMARY,
  DOCUMENT_TYPES.TECHNICAL_SPECIFICATION,
  DOCUMENT_TYPES.PRODUCT_REQUIREMENTS,
  DOCUMENT_TYPES.ROADMAP,
  DOCUMENT_TYPES.MONETIZATION_AUDIT,
  DOCUMENT_TYPES.LAUNCH_CHECKLIST,
];

/**
 * Check if document type requires open source context
 */
export function requiresOpenSource(documentType: DOCUMENT_TYPES): boolean {
  return documentType === DOCUMENT_TYPES.MONETIZATION_AUDIT ||
         documentType === DOCUMENT_TYPES.LAUNCH_CHECKLIST;
}
