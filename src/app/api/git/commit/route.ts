import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { getProject } from '@/lib/db/queries';

const execAsync = promisify(exec);

const commitSchema = z.object({
  projectId: z.string(),
  filePath: z.string(),
  content: z.string(),
  commitMessage: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = commitSchema.parse(body);

    // Get project
    const project = await getProject(validated.projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Write file to disk
    const fullPath = join(project.path, validated.filePath);
    writeFileSync(fullPath, validated.content, 'utf-8');

    // Check if git repository exists
    try {
      await execAsync('git rev-parse --git-dir', { cwd: project.path });
    } catch {
      return NextResponse.json(
        { error: 'Not a git repository. Initialize git first with: git init' },
        { status: 400 }
      );
    }

    // Git add and commit
    try {
      await execAsync(`git add "${validated.filePath}"`, { cwd: project.path });
      await execAsync(`git commit -m "${validated.commitMessage.replace(/"/g, '\\"')}"`, {
        cwd: project.path,
      });

      return NextResponse.json({
        success: true,
        message: 'File committed to git successfully',
      });
    } catch (error) {
      // If commit fails, the file is still written
      return NextResponse.json({
        success: true,
        message: 'File saved, but git commit failed. You may need to commit manually.',
        warning: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  } catch (error) {
    console.error('Git commit error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to commit file' },
      { status: 500 }
    );
  }
}
