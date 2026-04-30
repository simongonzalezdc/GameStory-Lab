import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateAPIDocumentation } from '@/lib/generators/api-docs';
import { getProject, createDocument } from '@/lib/db/queries';

const generateAPIDocsSchema = z.object({
  projectId: z.string(),
  model: z.string().optional().default('smollm2:1.7b'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = generateAPIDocsSchema.parse(body);

    // Get project
    const project = await getProject(validated.projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Generate API documentation
    const apiDocs = await generateAPIDocumentation(
      project.path,
      project.name,
      validated.model
    );

    // Save to database
    const document = await createDocument({
      projectId: validated.projectId,
      type: 'API',
      filename: 'API.md',
      content: apiDocs.markdown,
      metadata: {
        title: apiDocs.title,
        baseUrl: apiDocs.baseUrl,
        endpoints: apiDocs.endpoints,
      },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        content: apiDocs.markdown,
        endpoints: apiDocs.endpoints,
      },
    });
  } catch (error) {
    console.error('API docs generation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
