import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import { resolve, normalize } from 'path';
import { getProject } from '@/lib/db/queries';

const execAsync = (command: string, args: string[], options: { cwd: string }): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolveExec, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      shell: false
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolveExec({ stdout, stderr });
      } else {
        reject(new Error(stderr || `Command failed with exit code ${code}`));
      }
    });

    child.on('error', reject);
  });
};

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

    // Write file to disk with path traversal protection
    const fullPath = resolve(project.path, validated.filePath);
    const normalizedPath = normalize(fullPath);
    const projectPathResolved = resolve(project.path);

    if (!normalizedPath.startsWith(projectPathResolved)) {
      return NextResponse.json({ error: 'Invalid file path: path traversal detected' }, { status: 400 });
    }

    writeFileSync(normalizedPath, validated.content, 'utf-8');

    // Check if git repository exists
    try {
      await execAsync('git', ['rev-parse', '--git-dir'], { cwd: project.path });
    } catch {
      return NextResponse.json(
        { error: 'Not a git repository. Initialize git first with: git init' },
        { status: 400 }
      );
    }

    // Git add and commit with safe argument passing
    try {
      await execAsync('git', ['add', validated.filePath], { cwd: project.path });
      await execAsync('git', ['commit', '-m', validated.commitMessage], {
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
