import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createProject, getAllProjects } from '@/lib/db/queries';

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  path: z.string().min(1),
  language: z.string().min(1),
  framework: z.string().optional(),
  gitUrl: z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
});

// GET /api/projects - List all projects
export async function GET() {
  try {
    const projects = await getAllProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createProjectSchema.parse(body);

    const project = await createProject(validated);

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
