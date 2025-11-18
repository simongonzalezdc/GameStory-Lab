import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { getLLMRouter } from '../ai/router';

export interface DeploymentConfig {
  platform: 'vercel' | 'docker' | 'railway' | 'netlify' | 'render';
  filename: string;
  content: string;
  instructions: string;
  environmentVariables?: Array<{
    key: string;
    description: string;
    required: boolean;
    defaultValue?: string;
  }>;
}

export interface ProjectDeploymentInfo {
  name: string;
  language: string;
  framework?: string;
  packageManager: 'npm' | 'yarn' | 'pnpm';
  buildCommand?: string;
  startCommand?: string;
  outputDirectory?: string;
  nodeVersion?: string;
  hasDatabase: boolean;
  environmentVars: string[];
}

/**
 * Analyze project for deployment configuration
 */
async function analyzeProjectForDeployment(projectPath: string, projectName: string): Promise<ProjectDeploymentInfo> {
  const info: ProjectDeploymentInfo = {
    name: projectName,
    language: 'JavaScript',
    packageManager: 'npm',
    hasDatabase: false,
    environmentVars: [],
  };

  try {
    // Read package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      // Detect framework
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      if (dependencies['next']) {
        info.framework = 'Next.js';
        info.buildCommand = 'next build';
        info.startCommand = 'next start';
        info.outputDirectory = '.next';
      } else if (dependencies['vite']) {
        info.framework = 'Vite';
        info.buildCommand = 'vite build';
        info.outputDirectory = 'dist';
      } else if (dependencies['react-scripts']) {
        info.framework = 'Create React App';
        info.buildCommand = 'react-scripts build';
        info.outputDirectory = 'build';
      } else if (dependencies['vue']) {
        info.framework = 'Vue';
        info.buildCommand = 'vue-cli-service build';
        info.outputDirectory = 'dist';
      } else if (dependencies['express']) {
        info.framework = 'Express';
        info.startCommand = 'node index.js';
      }

      // Override with package.json scripts if available
      if (packageJson.scripts) {
        if (packageJson.scripts.build) {
          info.buildCommand = packageJson.scripts.build;
        }
        if (packageJson.scripts.start) {
          info.startCommand = packageJson.scripts.start;
        }
      }

      // Detect package manager
      if (existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) {
        info.packageManager = 'pnpm';
      } else if (existsSync(path.join(projectPath, 'yarn.lock'))) {
        info.packageManager = 'yarn';
      }

      // Detect TypeScript
      if (existsSync(path.join(projectPath, 'tsconfig.json'))) {
        info.language = 'TypeScript';
      }

      // Detect database
      info.hasDatabase = !!(
        dependencies['prisma'] ||
        dependencies['drizzle-orm'] ||
        dependencies['mongoose'] ||
        dependencies['pg'] ||
        dependencies['mysql2'] ||
        dependencies['better-sqlite3']
      );

      // Detect Node version
      if (packageJson.engines?.node) {
        info.nodeVersion = packageJson.engines.node;
      }
    }

    // Scan for environment variables
    const envExamplePath = path.join(projectPath, '.env.example');
    const envPath = path.join(projectPath, '.env');

    if (existsSync(envExamplePath)) {
      const envContent = readFileSync(envExamplePath, 'utf-8');
      const envVars = envContent
        .split('\n')
        .filter((line) => line.trim() && !line.startsWith('#'))
        .map((line) => line.split('=')[0].trim())
        .filter(Boolean);
      info.environmentVars = envVars;
    } else if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, 'utf-8');
      const envVars = envContent
        .split('\n')
        .filter((line) => line.trim() && !line.startsWith('#'))
        .map((line) => line.split('=')[0].trim())
        .filter(Boolean);
      info.environmentVars = envVars;
    }

    return info;
  } catch (error) {
    console.error('Deployment analysis error:', error);
    return info;
  }
}

/**
 * Generate Vercel deployment configuration
 */
export async function generateVercelConfig(
  projectPath: string,
  projectName: string
): Promise<DeploymentConfig> {
  const info = await analyzeProjectForDeployment(projectPath, projectName);

  const config = {
    version: 2,
    name: info.name,
    ...(info.buildCommand && { buildCommand: info.buildCommand }),
    ...(info.outputDirectory && { outputDirectory: info.outputDirectory }),
    ...(info.framework && {
      framework: info.framework.toLowerCase().replace(/\./g, ''),
    }),
  };

  const envVars = info.environmentVars.map((key) => ({
    key,
    description: `Environment variable: ${key}`,
    required: true,
  }));

  const instructions = `# Deploying to Vercel

## Quick Deploy

1. Install Vercel CLI:
   \`\`\`bash
   ${info.packageManager} install -g vercel
   \`\`\`

2. Login to Vercel:
   \`\`\`bash
   vercel login
   \`\`\`

3. Deploy:
   \`\`\`bash
   vercel
   \`\`\`

## Environment Variables

Set these environment variables in your Vercel project settings:

${envVars.map((v) => `- \`${v.key}\`: ${v.description}`).join('\n')}

## Automatic Deployments

Connect your GitHub repository to Vercel for automatic deployments on push:

1. Go to https://vercel.com/new
2. Import your repository
3. Configure environment variables
4. Deploy!

${info.hasDatabase ? '\n⚠️ **Database Note**: Make sure to configure your database connection for production.' : ''}
`;

  return {
    platform: 'vercel',
    filename: 'vercel.json',
    content: JSON.stringify(config, null, 2),
    instructions,
    environmentVariables: envVars,
  };
}

/**
 * Generate Docker configuration
 */
export async function generateDockerConfig(
  projectPath: string,
  projectName: string
): Promise<DeploymentConfig> {
  const info = await analyzeProjectForDeployment(projectPath, projectName);

  const nodeVersion = info.nodeVersion || '20';
  const baseVersion = nodeVersion.match(/\d+/)?.[0] || '20';

  let dockerfile = `# syntax=docker/dockerfile:1

# Base stage
FROM node:${baseVersion}-alpine AS base
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/main#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package*.json ./
${info.packageManager === 'yarn' ? 'COPY yarn.lock ./' : ''}
${info.packageManager === 'pnpm' ? 'COPY pnpm-lock.yaml ./' : ''}

# Install dependencies
${info.packageManager === 'pnpm' ? 'RUN corepack enable pnpm && pnpm install --frozen-lockfile' : ''}
${info.packageManager === 'yarn' ? 'RUN yarn install --frozen-lockfile' : ''}
${info.packageManager === 'npm' ? 'RUN npm ci' : ''}

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application
${info.buildCommand ? `RUN ${info.packageManager} run build` : '# No build command specified'}

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# Copy built application
${info.outputDirectory ? `COPY --from=builder --chown=appuser:nodejs /app/${info.outputDirectory} ./${info.outputDirectory}` : ''}
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/package*.json ./

USER appuser

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

${info.startCommand ? `CMD ["${info.packageManager}", "run", "start"]` : 'CMD ["node", "index.js"]'}
`;

  const dockerCompose = `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
${info.environmentVars.map((key) => `      - ${key}=\${${key}}`).join('\n')}
    restart: unless-stopped
${
  info.hasDatabase
    ? `
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${info.name}
      POSTGRES_USER: \${DB_USER:-postgres}
      POSTGRES_PASSWORD: \${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - db-data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  db-data:
`
    : ''
}`;

  const instructions = `# Docker Deployment

## Prerequisites

- Docker installed (https://docs.docker.com/get-docker/)
- Docker Compose installed (usually included with Docker Desktop)

## Build and Run

### Option 1: Docker only

\`\`\`bash
# Build image
docker build -t ${info.name} .

# Run container
docker run -p 3000:3000 ${info.name}
\`\`\`

### Option 2: Docker Compose (recommended)

\`\`\`bash
# Create .env file with required variables
${info.environmentVars.map((key) => `${key}=your_value_here`).join('\n')}

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
\`\`\`

## Environment Variables

Create a \`.env\` file in the project root:

\`\`\`env
${info.environmentVars.map((key) => `${key}=`).join('\n')}
\`\`\`

## Production Tips

- Use multi-stage builds (already configured) to keep image size small
- Use \`.dockerignore\` to exclude unnecessary files
- Set proper resource limits in production
- Use container orchestration (Kubernetes, Docker Swarm) for scaling

${info.hasDatabase ? '⚠️ **Database**: A PostgreSQL container is included. Adjust as needed for your database.' : ''}
`;

  return {
    platform: 'docker',
    filename: 'Dockerfile',
    content: dockerfile,
    instructions,
    environmentVariables: info.environmentVars.map((key) => ({
      key,
      description: `Environment variable: ${key}`,
      required: true,
    })),
  };
}

/**
 * Generate Railway deployment configuration
 */
export async function generateRailwayConfig(
  projectPath: string,
  projectName: string
): Promise<DeploymentConfig> {
  const info = await analyzeProjectForDeployment(projectPath, projectName);

  const config = {
    $schema: 'https://railway.app/railway.schema.json',
    build: {
      builder: 'NIXPACKS',
      ...(info.buildCommand && { buildCommand: info.buildCommand }),
    },
    deploy: {
      ...(info.startCommand && { startCommand: info.startCommand }),
      restartPolicyType: 'ON_FAILURE',
      restartPolicyMaxRetries: 10,
    },
  };

  const instructions = `# Deploying to Railway

## Quick Deploy

1. Install Railway CLI:
   \`\`\`bash
   npm install -g @railway/cli
   \`\`\`

2. Login to Railway:
   \`\`\`bash
   railway login
   \`\`\`

3. Initialize project:
   \`\`\`bash
   railway init
   \`\`\`

4. Deploy:
   \`\`\`bash
   railway up
   \`\`\`

## Or Deploy via Dashboard

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Configure environment variables
6. Deploy!

## Environment Variables

Add these variables in Railway dashboard or CLI:

${info.environmentVars.map((key) => `\`\`\`\nrailway variables set ${key}=your_value\n\`\`\``).join('\n')}

${
  info.hasDatabase
    ? `
## Database

Railway offers managed databases:
- PostgreSQL
- MySQL
- Redis
- MongoDB

Add a database from the Railway dashboard and it will automatically inject connection variables.
`
    : ''
}

## Custom Domain

Add a custom domain in the Railway dashboard under your service settings.
`;

  return {
    platform: 'railway',
    filename: 'railway.json',
    content: JSON.stringify(config, null, 2),
    instructions,
    environmentVariables: info.environmentVars.map((key) => ({
      key,
      description: `Environment variable: ${key}`,
      required: true,
    })),
  };
}

/**
 * Generate .dockerignore file
 */
export function generateDockerIgnore(): string {
  return `# Dependencies
node_modules
npm-debug.log
yarn-error.log

# Testing
coverage
.nyc_output

# Build output
dist
build
.next
out

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode
.idea
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Git
.git
.gitignore

# Documentation
*.md
docs

# CI/CD
.github
.gitlab-ci.yml

# Misc
.prettierrc
.eslintrc
`;
}

/**
 * Generate .env.example template
 */
export async function generateEnvTemplate(
  projectPath: string,
  projectName: string,
  model: string = 'smollm2:1.7b'
): Promise<string> {
  const info = await analyzeProjectForDeployment(projectPath, projectName);

  if (info.environmentVars.length === 0) {
    // Use AI to suggest common environment variables
    const llmRouter = getLLMRouter();

    const prompt = `List common environment variables needed for a ${info.framework || info.language} application.

Framework: ${info.framework || 'None'}
Has Database: ${info.hasDatabase ? 'Yes' : 'No'}

Format:
VAR_NAME=default_value # Description

Include:
- Database connection strings (if applicable)
- API keys
- JWT secrets
- Port configuration
- Node environment

Keep it concise (5-10 variables).`;

    const response = await llmRouter.chat(
      [
        { role: 'system', content: 'You are a DevOps expert.' },
        { role: 'user', content: prompt },
      ],
      model,
      { temperature: 0.5 }
    );

    return response.content;
  }

  return info.environmentVars.map((key) => `${key}=`).join('\n');
}

/**
 * Generate comprehensive deployment guide
 */
export async function generateDeploymentGuide(
  projectPath: string,
  projectName: string,
  platforms: Array<'vercel' | 'docker' | 'railway'> = ['vercel', 'docker', 'railway'],
  model: string = 'smollm2:1.7b'
): Promise<{
  configs: DeploymentConfig[];
  guide: string;
  envTemplate: string;
  dockerIgnore?: string;
}> {
  const configs: DeploymentConfig[] = [];

  // Generate configs for requested platforms
  for (const platform of platforms) {
    switch (platform) {
      case 'vercel':
        configs.push(await generateVercelConfig(projectPath, projectName));
        break;
      case 'docker':
        configs.push(await generateDockerConfig(projectPath, projectName));
        break;
      case 'railway':
        configs.push(await generateRailwayConfig(projectPath, projectName));
        break;
    }
  }

  // Generate environment template
  const envTemplate = await generateEnvTemplate(projectPath, projectName, model);

  // Generate comprehensive guide using AI
  const info = await analyzeProjectForDeployment(projectPath, projectName);
  const llmRouter = getLLMRouter();

  const prompt = `Create a comprehensive deployment guide for ${projectName}.

Project Info:
- Framework: ${info.framework || info.language}
- Package Manager: ${info.packageManager}
- Has Database: ${info.hasDatabase}
- Platforms: ${platforms.join(', ')}

Create a markdown guide with:
1. Pre-deployment checklist
2. Platform-specific instructions
3. Common troubleshooting tips
4. Performance optimization suggestions
5. Security best practices

Be concise but thorough.`;

  const response = await llmRouter.chat(
    [
      { role: 'system', content: 'You are a deployment and DevOps expert.' },
      { role: 'user', content: prompt },
    ],
    model,
    { temperature: 0.6 }
  );

  return {
    configs,
    guide: response.content,
    envTemplate,
    ...(platforms.includes('docker') && { dockerIgnore: generateDockerIgnore() }),
  };
}
