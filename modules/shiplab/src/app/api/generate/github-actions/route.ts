import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateGitHubActionsWorkflows } from '@/lib/generators/github-actions';
import { getProject } from '@/lib/db/queries';

const generateGitHubActionsSchema = z.object({
  projectId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = generateGitHubActionsSchema.parse(body);

    // Get project
    const project = await getProject(validated.projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Generate GitHub Actions workflows
    const result = generateGitHubActionsWorkflows(project);

    return NextResponse.json({
      success: true,
      workflows: result.workflows,
      setupInstructions: result.setupInstructions,
    });
  } catch (error) {
    console.error('GitHub Actions generation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
