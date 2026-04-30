import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateReadme } from '@/lib/generators/readme';
import { getProject, createDocument } from '@/lib/db/queries';

const generateReadmeSchema = z.object({
  projectId: z.string(),
  model: z.string().optional().default('smollm2:1.7b'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = generateReadmeSchema.parse(body);

    // Get project
    const project = await getProject(validated.projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Generate README
    const readme = await generateReadme({
      projectName: project.name,
      projectPath: project.path,
      language: project.language,
      framework: project.framework || undefined,
      description: project.description || undefined,
      model: validated.model,
    });

    // Save to database
    const document = await createDocument({
      projectId: validated.projectId,
      type: 'README',
      filename: 'README.md',
      content: readme.content,
      metadata: { sections: readme.sections },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        content: readme.content,
        sections: readme.sections,
      },
    });
  } catch (error) {
    console.error('README generation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
