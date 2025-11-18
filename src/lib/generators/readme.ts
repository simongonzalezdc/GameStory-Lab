import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import path from 'path';
import { getLLMRouter } from '../ai/router';
import fg from 'fast-glob';

export interface ReadmeGeneratorOptions {
  projectName: string;
  projectPath: string;
  language: string;
  framework?: string;
  description?: string;
  model?: string;
}

export interface GeneratedReadme {
  content: string;
  sections: {
    title: string;
    description: string;
    installation: string;
    usage: string;
    features: string[];
    contributing?: string;
    license?: string;
  };
}

/**
 * Analyze project structure to extract information
 */
async function analyzeProject(projectPath: string): Promise<{
  files: string[];
  hasPackageJson: boolean;
  hasTsConfig: boolean;
  dependencies: string[];
  devDependencies: string[];
  scripts: Record<string, string>;
  mainFile?: string;
}> {
  const analysis = {
    files: [] as string[],
    hasPackageJson: false,
    hasTsConfig: false,
    dependencies: [] as string[],
    devDependencies: [] as string[],
    scripts: {} as Record<string, string>,
    mainFile: undefined as string | undefined,
  };

  try {
    // Get all files (limited depth)
    const files = await fg(['**/*'], {
      cwd: projectPath,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'],
      onlyFiles: true,
      deep: 3,
    });
    analysis.files = files.slice(0, 50); // Limit to 50 files

    // Check for package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (existsSync(packageJsonPath)) {
      analysis.hasPackageJson = true;
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      analysis.dependencies = Object.keys(packageJson.dependencies || {});
      analysis.devDependencies = Object.keys(packageJson.devDependencies || {});
      analysis.scripts = packageJson.scripts || {};
      analysis.mainFile = packageJson.main;
    }

    // Check for tsconfig.json
    analysis.hasTsConfig = existsSync(path.join(projectPath, 'tsconfig.json'));

    return analysis;
  } catch (error) {
    console.error('Project analysis error:', error);
    return analysis;
  }
}

/**
 * Generate README using AI
 */
export async function generateReadme(
  options: ReadmeGeneratorOptions
): Promise<GeneratedReadme> {
  const { projectName, projectPath, language, framework, description, model = 'smollm2:1.7b' } =
    options;

  // Analyze project
  const analysis = await analyzeProject(projectPath);

  // Build context for AI
  const context = `
Project Name: ${projectName}
Language: ${language}
${framework ? `Framework: ${framework}` : ''}
${description ? `Description: ${description}` : ''}

Project Structure:
- Has package.json: ${analysis.hasPackageJson}
- Has TypeScript: ${analysis.hasTsConfig}
- Main dependencies: ${analysis.dependencies.slice(0, 10).join(', ')}
- Available scripts: ${Object.keys(analysis.scripts).join(', ')}
- File count: ${analysis.files.length}

Sample files:
${analysis.files.slice(0, 15).join('\n')}
`.trim();

  const prompt = `You are a technical writer creating a README.md for a ${language}${framework ? ` ${framework}` : ''} project.

${context}

Create a comprehensive, professional README.md with these sections:

1. **Title and Description**: Clear project title and 1-2 sentence description
2. **Features**: List 4-6 key features based on the project structure
3. **Installation**: Step-by-step installation instructions
4. **Usage**: Basic usage examples with code snippets
5. **Scripts**: Document available npm/yarn scripts
6. **Tech Stack**: List main technologies and dependencies
7. **Contributing**: Brief contribution guidelines
8. **License**: Placeholder for license information

Format in markdown. Be concise but informative. Use emojis for section headers.`;

  const llmRouter = getLLMRouter();

  const response = await llmRouter.chat(
    [
      { role: 'system', content: 'You are an expert technical writer.' },
      { role: 'user', content: prompt },
    ],
    model,
    { temperature: 0.7 }
  );

  // Parse the generated README to extract sections
  const content = response.content;

  // Extract sections (simple parsing)
  const sections = {
    title: projectName,
    description: description || 'A modern web application',
    installation: extractSection(content, 'Installation', 'Usage') || '```bash\nnpm install\n```',
    usage: extractSection(content, 'Usage', 'Scripts') || '```bash\nnpm start\n```',
    features: extractFeatures(content),
    contributing:
      extractSection(content, 'Contributing', 'License') || 'Contributions are welcome!',
    license: extractSection(content, 'License') || 'MIT',
  };

  return {
    content,
    sections,
  };
}

/**
 * Extract a section from markdown content
 */
function extractSection(content: string, sectionName: string, nextSection?: string): string | null {
  const sectionRegex = new RegExp(
    `#{1,3}\\s*${sectionName}[\\s\\S]*?\\n([\\s\\S]*?)(?=#{1,3}\\s*${nextSection || '$'})`,
    'i'
  );
  const match = content.match(sectionRegex);
  return match ? match[1].trim() : null;
}

/**
 * Extract features from markdown content
 */
function extractFeatures(content: string): string[] {
  const featuresSection = extractSection(content, 'Features', 'Installation');
  if (!featuresSection) return [];

  // Extract bullet points
  const bulletRegex = /^[\-\*]\s+(.+)$/gm;
  const features: string[] = [];
  let match;

  while ((match = bulletRegex.exec(featuresSection)) !== null) {
    features.push(match[1].trim());
  }

  return features.slice(0, 10); // Limit to 10 features
}

/**
 * Generate README with custom template
 */
export function generateReadmeFromTemplate(options: {
  projectName: string;
  description: string;
  features: string[];
  installation: string;
  usage: string;
  license?: string;
}): string {
  const { projectName, description, features, installation, usage, license = 'MIT' } = options;

  return `# ${projectName}

${description}

## ✨ Features

${features.map((f) => `- ${f}`).join('\n')}

## 📦 Installation

${installation}

## 🚀 Usage

${usage}

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📄 License

This project is licensed under the ${license} License.
`;
}
