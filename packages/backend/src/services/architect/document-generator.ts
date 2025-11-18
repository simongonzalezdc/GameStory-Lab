/**
 * Document Generator for AI Project Architect
 * Processes templates and generates final documentation
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  ProjectContext,
  GeneratedDocument,
  DocumentationPackage,
  DOCUMENT_TEMPLATES,
} from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class DocumentGenerator {
  private templatesDir: string;

  constructor() {
    this.templatesDir = join(__dirname, 'templates');
  }

  /**
   * Generate all documentation for a project
   */
  async generateDocumentation(
    projectId: string,
    sessionId: string,
    context: ProjectContext
  ): Promise<DocumentationPackage> {
    const documents: GeneratedDocument[] = [];

    // Always generate the 4 core documents
    const coreTemplates = DOCUMENT_TEMPLATES.filter((t) => t.required);

    for (const template of coreTemplates) {
      const document = await this.generateDocument(template.filename, context);
      documents.push(document);
    }

    // Generate optional open source documents if applicable
    if (context.isOpenSource) {
      const optionalTemplates = DOCUMENT_TEMPLATES.filter((t) => !t.required);

      for (const template of optionalTemplates) {
        const document = await this.generateDocument(template.filename, context);
        documents.push(document);
      }
    }

    return {
      projectId,
      sessionId,
      documents,
      context,
      generatedAt: new Date(),
    };
  }

  /**
   * Generate a single document from a template
   */
  private async generateDocument(
    templateFilename: string,
    context: ProjectContext
  ): Promise<GeneratedDocument> {
    // Load template
    const templatePath = join(this.templatesDir, templateFilename);
    let templateContent = await readFile(templatePath, 'utf-8');

    // Replace placeholders with context values
    templateContent = this.replacePlaceholders(templateContent, context);

    return {
      templateName: templateFilename.replace('.md', ''),
      content: templateContent,
      generatedAt: new Date(),
    };
  }

  /**
   * Replace all {{PLACEHOLDER}} variables with actual values
   */
  private replacePlaceholders(template: string, context: ProjectContext): string {
    let result = template;

    // Basic replacements
    const replacements: Record<string, string> = {
      PROJECT_NAME: context.projectName || 'TBD',
      DATE: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      VERSION: '1.0.0',
      ONE_SENTENCE_DESCRIPTION: context.projectDescription || 'TBD',
      PROBLEM_STATEMENT: context.problemSolved || 'TBD',
      TARGET_AUDIENCE: 'Players who enjoy ' + (context.projectType || 'this type of game'),
      PROJECT_TYPE: context.projectType || 'TBD',
      DURATION: this.estimateDuration(context),
      ARCHITECTURE_DESCRIPTION: this.generateArchitectureDescription(context),
      DATA_FLOW_DESCRIPTION: this.generateDataFlowDescription(context),
    };

    // Tech stack replacements
    if (context.techStack) {
      replacements['TECH'] = context.techStack.frontend || 'TBD';
      replacements['FRAMEWORK'] = context.techStack.frontend || 'TBD';
      replacements['DATABASE_TYPE'] = context.techStack.database || 'TBD';
      replacements['HOSTING_PLATFORM'] = context.techStack.hosting || 'TBD';
    }

    // Features
    if (context.keyFeatures && context.keyFeatures.length > 0) {
      context.keyFeatures.forEach((feature, index) => {
        replacements[`FEATURE_${index + 1}`] = feature;
        replacements[`FEATURE`] = feature; // For generic {{FEATURE}} tags
      });
    }

    // Workflow and data
    if (context.coreWorkflow) {
      replacements['PRIMARY_WORKFLOW'] = context.coreWorkflow;
    }

    if (context.dataModel) {
      replacements['DATA_MODEL'] = context.dataModel;
    }

    // Technical details
    replacements['AUTH_METHOD'] = context.authentication || 'TBD';
    replacements['ARCHITECTURE'] = context.architecture || 'TBD';
    replacements['DEPLOYMENT_PLATFORM'] = context.deployment || 'TBD';
    replacements['TEST_STRATEGY'] = context.testing || 'TBD';
    replacements['SECURITY_REQUIREMENTS'] = context.security || 'Standard security best practices';
    replacements['PERFORMANCE_REQUIREMENTS'] = context.performance || 'TBD';

    // Open source specific
    if (context.isOpenSource) {
      replacements['LICENSE'] = context.license || 'TBD';
      replacements['MONETIZATION_MODEL'] = context.monetizationModel || 'TBD';
      replacements['LICENSE_TYPE'] = context.license || 'MIT';
    }

    // Perform replacements
    for (const [key, value] of Object.entries(replacements)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    }

    // Handle conditional blocks
    result = this.handleConditionalBlocks(result, context);

    // Replace any remaining placeholders with TBD
    result = result.replace(/{{([^}]+)}}/g, 'TBD');

    return result;
  }

  /**
   * Handle conditional blocks like {{#IF_OPEN_SOURCE}}...{{/IF_OPEN_SOURCE}}
   */
  private handleConditionalBlocks(template: string, context: ProjectContext): string {
    let result = template;

    // {{#IF_OPEN_SOURCE}}...{{/IF_OPEN_SOURCE}}
    if (context.isOpenSource) {
      result = result.replace(/{{#IF_OPEN_SOURCE}}([\s\S]*?){{\/IF_OPEN_SOURCE}}/g, '$1');
      result = result.replace(/{{#IF_NOT_OPEN_SOURCE}}[\s\S]*?{{\/IF_NOT_OPEN_SOURCE}}/g, '');
    } else {
      result = result.replace(/{{#IF_OPEN_SOURCE}}[\s\S]*?{{\/IF_OPEN_SOURCE}}/g, '');
      result = result.replace(/{{#IF_NOT_OPEN_SOURCE}}([\s\S]*?){{\/IF_NOT_OPEN_SOURCE}}/g, '$1');
    }

    // {{#IF_HAS_DATABASE}}...{{/IF_HAS_DATABASE}}
    const hasDatabase =
      context.techStack?.database &&
      context.techStack.database !== 'No database (local files)' &&
      context.techStack.database !== 'Not sure';

    if (hasDatabase) {
      result = result.replace(/{{#IF_HAS_DATABASE}}([\s\S]*?){{\/IF_HAS_DATABASE}}/g, '$1');
      result = result.replace(/{{#IF_NO_DATABASE}}[\s\S]*?{{\/IF_NO_DATABASE}}/g, '');
    } else {
      result = result.replace(/{{#IF_HAS_DATABASE}}[\s\S]*?{{\/IF_HAS_DATABASE}}/g, '');
      result = result.replace(/{{#IF_NO_DATABASE}}([\s\S]*?){{\/IF_NO_DATABASE}}/g, '$1');
    }

    // {{#IF_HAS_API}}...{{/IF_HAS_API}}
    const hasAPI = context.architecture?.toLowerCase().includes('server') || false;

    if (hasAPI) {
      result = result.replace(/{{#IF_HAS_API}}([\s\S]*?){{\/IF_HAS_API}}/g, '$1');
      result = result.replace(/{{#IF_NO_API}}[\s\S]*?{{\/IF_NO_API}}/g, '');
    } else {
      result = result.replace(/{{#IF_HAS_API}}[\s\S]*?{{\/IF_HAS_API}}/g, '');
      result = result.replace(/{{#IF_NO_API}}([\s\S]*?){{\/IF_NO_API}}/g, '$1');
    }

    // {{#IF_HAS_INTEGRATIONS}}...{{/IF_HAS_INTEGRATIONS}}
    const hasIntegrations = context.integrations && context.integrations.length > 0;

    if (hasIntegrations) {
      result = result.replace(/{{#IF_HAS_INTEGRATIONS}}([\s\S]*?){{\/IF_HAS_INTEGRATIONS}}/g, '$1');
      result = result.replace(/{{#IF_NO_INTEGRATIONS}}[\s\S]*?{{\/IF_NO_INTEGRATIONS}}/g, '');
    } else {
      result = result.replace(/{{#IF_HAS_INTEGRATIONS}}[\s\S]*?{{\/IF_HAS_INTEGRATIONS}}/g, '');
      result = result.replace(
        /{{#IF_NO_INTEGRATIONS}}([\s\S]*?){{\/IF_NO_INTEGRATIONS}}/g,
        '$1'
      );
    }

    return result;
  }

  /**
   * Estimate project duration based on features and constraints
   */
  private estimateDuration(context: ProjectContext): string {
    const featureCount = context.keyFeatures?.length || 0;

    if (featureCount <= 3) return '4-6 weeks';
    if (featureCount <= 5) return '2-3 months';
    if (featureCount <= 8) return '3-6 months';
    return '6-12 months';
  }

  /**
   * Generate architecture description from context
   */
  private generateArchitectureDescription(context: ProjectContext): string {
    const projectType = context.projectType || 'game';
    const architecture = context.architecture || 'monolithic';

    const descriptions: Record<string, string> = {
      'Monolithic (all in one)': `The game uses a monolithic architecture where all components (game logic, rendering, UI, data persistence) are part of a single application. This simplifies development and deployment for a ${projectType}.`,
      'Client-server (traditional multiplayer)': `The game uses a client-server architecture with a authoritative game server handling game state and logic, while clients handle rendering and player input. This ensures fair multiplayer gameplay and prevents cheating.`,
      'Peer-to-peer networking': `The game uses peer-to-peer networking where players' devices communicate directly with each other. This reduces server costs but requires careful synchronization and security considerations.`,
      'Serverless (cloud functions)': `The game uses serverless architecture with cloud functions handling backend logic, authentication, and data persistence. This provides automatic scaling and reduces infrastructure management.`,
    };

    return (
      descriptions[architecture] ||
      `The game follows a ${architecture} architecture approach suitable for a ${projectType}.`
    );
  }

  /**
   * Generate data flow description from context
   */
  private generateDataFlowDescription(context: ProjectContext): string {
    const workflow = context.coreWorkflow;
    const dataModel = context.dataModel;

    if (workflow && dataModel) {
      return `Player actions flow through the game's input system, updating the game state (${dataModel}). The updated state is rendered to the screen each frame. ${
        context.authentication !== 'No user accounts (single player)'
          ? 'Cloud synchronization ensures progress is saved across devices.'
          : 'Game progress is saved locally to disk.'
      }`;
    }

    return 'Player input → Game logic → State update → Rendering → Display';
  }
}
