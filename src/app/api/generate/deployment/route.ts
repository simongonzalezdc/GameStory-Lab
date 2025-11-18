import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  generateDeploymentGuide,
  generateVercelConfig,
  generateDockerConfig,
  generateRailwayConfig,
} from '@/lib/generators/deployment';
import { getProject, createDocument } from '@/lib/db/queries';

const generateDeploymentSchema = z.object({
  projectId: z.string(),
  platforms: z.array(z.enum(['vercel', 'docker', 'railway'])).optional().default(['vercel', 'docker', 'railway']),
  model: z.string().optional().default('smollm2:1.7b'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = generateDeploymentSchema.parse(body);

    // Get project
    const project = await getProject(validated.projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Generate comprehensive deployment guide
    const deploymentGuide = await generateDeploymentGuide(
      project.path,
      project.name,
      validated.platforms,
      validated.model
    );

    // Save configs to database
    const savedDocuments = [];

    // Save deployment guide
    const guideDoc = await createDocument({
      projectId: validated.projectId,
      type: 'DEPLOYMENT',
      filename: 'deployment-guide.md',
      content: deploymentGuide.guide,
      metadata: {
        platforms: validated.platforms,
      },
    });
    savedDocuments.push({ id: guideDoc.id, type: 'guide' });

    // Save platform-specific configs
    for (const config of deploymentGuide.configs) {
      const configDoc = await createDocument({
        projectId: validated.projectId,
        type: 'DEPLOYMENT',
        filename: config.filename,
        content: config.content,
        metadata: {
          platform: config.platform,
          instructions: config.instructions,
          environmentVariables: config.environmentVariables,
        },
      });
      savedDocuments.push({ id: configDoc.id, type: config.platform, filename: config.filename });
    }

    // Save environment template
    const envDoc = await createDocument({
      projectId: validated.projectId,
      type: 'DEPLOYMENT',
      filename: '.env.example',
      content: deploymentGuide.envTemplate,
      metadata: {
        type: 'environment',
      },
    });
    savedDocuments.push({ id: envDoc.id, type: 'env', filename: '.env.example' });

    // Save .dockerignore if Docker is included
    if (deploymentGuide.dockerIgnore) {
      const dockerignoreDoc = await createDocument({
        projectId: validated.projectId,
        type: 'DEPLOYMENT',
        filename: '.dockerignore',
        content: deploymentGuide.dockerIgnore,
        metadata: {
          type: 'docker',
        },
      });
      savedDocuments.push({ id: dockerignoreDoc.id, type: 'docker', filename: '.dockerignore' });
    }

    return NextResponse.json({
      success: true,
      guide: deploymentGuide,
      documents: savedDocuments,
    });
  } catch (error) {
    console.error('Deployment config generation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}

// GET endpoint for specific platform config
const getPlatformSchema = z.object({
  projectId: z.string(),
  platform: z.enum(['vercel', 'docker', 'railway']),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const platform = searchParams.get('platform');

    const validated = getPlatformSchema.parse({ projectId, platform });

    // Get project
    const project = await getProject(validated.projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Generate config for specific platform
    let config;
    switch (validated.platform) {
      case 'vercel':
        config = await generateVercelConfig(project.path, project.name);
        break;
      case 'docker':
        config = await generateDockerConfig(project.path, project.name);
        break;
      case 'railway':
        config = await generateRailwayConfig(project.path, project.name);
        break;
    }

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('Platform config generation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
