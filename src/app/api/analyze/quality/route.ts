import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeCodeQuality, applyAutoFixes } from '@/lib/analysis/quality';
import { getProject } from '@/lib/db/queries';
import { createAnalysisResult } from '@/lib/db/queries';

const analyzeQualitySchema = z.object({
  projectId: z.string(),
  tools: z.array(z.enum(['eslint', 'semgrep'])).optional(),
  autoFix: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = analyzeQualitySchema.parse(body);

    // Get project
    const project = await getProject(validated.projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Apply auto-fixes if requested
    if (validated.autoFix) {
      const fixResult = await applyAutoFixes(project.path);
      if (fixResult.error) {
        return NextResponse.json(
          { error: `Auto-fix failed: ${fixResult.error}` },
          { status: 500 }
        );
      }
    }

    // Run analysis
    const result = await analyzeCodeQuality(project.path, {
      tools: validated.tools,
    });

    // Save results to database
    await createAnalysisResult({
      projectId: validated.projectId,
      module: 'quality',
      results: result as unknown as Record<string, unknown>,
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Quality analysis error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }

    // Save error to database
    if ('projectId' in (error as Record<string, unknown>)) {
      await createAnalysisResult({
        projectId: (error as { projectId: string }).projectId,
        module: 'quality',
        results: {},
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
