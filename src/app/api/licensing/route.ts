import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  getLicenseRecommendation,
  generateLicenseText,
  getAllLicenses,
  compareLicenses,
  checkDependencyLicenseCompatibility,
  POPULAR_LICENSES,
} from '@/lib/generators/licensing';
import { getProject, createDocument } from '@/lib/db/queries';

// GET endpoint - list all licenses or get recommendation
const getSchema = z.object({
  projectId: z.string().optional(),
  action: z.enum(['list', 'recommend', 'compare', 'check-compatibility']).optional().default('list'),
  projectType: z.enum(['library', 'application', 'saas', 'utility']).optional(),
  allowCommercial: z.string().optional().transform((val) => val === 'true'),
  requireOpenSource: z.string().optional().transform((val) => val === 'true'),
  allowPatentUse: z.string().optional().transform((val) => val === 'true'),
  simplicityPreferred: z.string().optional().transform((val) => val === 'true'),
  compareIds: z.string().optional(),
  licenseId: z.string().optional(),
  model: z.string().optional().default('smollm2:1.7b'),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams.entries());
    const validated = getSchema.parse(params);

    if (validated.action === 'list') {
      // Return all available licenses
      const licenses = getAllLicenses();
      return NextResponse.json({
        success: true,
        licenses,
      });
    }

    if (validated.action === 'compare') {
      // Compare licenses
      if (!validated.compareIds) {
        return NextResponse.json(
          { error: 'compareIds parameter required for comparison' },
          { status: 400 }
        );
      }

      const ids = validated.compareIds.split(',');
      const comparison = compareLicenses(ids);

      return NextResponse.json({
        success: true,
        comparison,
      });
    }

    if (validated.action === 'recommend') {
      // Get recommendation
      if (!validated.projectType) {
        return NextResponse.json(
          { error: 'projectType required for recommendations' },
          { status: 400 }
        );
      }

      const recommendation = await getLicenseRecommendation(
        validated.projectType,
        {
          allowCommercial: validated.allowCommercial,
          requireOpenSource: validated.requireOpenSource,
          allowPatentUse: validated.allowPatentUse,
          simplicityPreferred: validated.simplicityPreferred,
        },
        validated.model
      );

      return NextResponse.json({
        success: true,
        recommendation,
      });
    }

    if (validated.action === 'check-compatibility') {
      // Check dependency license compatibility
      if (!validated.projectId || !validated.licenseId) {
        return NextResponse.json(
          { error: 'projectId and licenseId required for compatibility check' },
          { status: 400 }
        );
      }

      const project = await getProject(validated.projectId);
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      const licenseName = POPULAR_LICENSES[validated.licenseId]?.name || validated.licenseId;
      const compatibility = await checkDependencyLicenseCompatibility(project.path, licenseName);

      return NextResponse.json({
        success: true,
        compatibility,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('License query error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Query failed' },
      { status: 500 }
    );
  }
}

// POST endpoint - generate license file
const postSchema = z.object({
  projectId: z.string(),
  licenseId: z.string(),
  copyrightHolder: z.string(),
  year: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = postSchema.parse(body);

    // Validate license ID
    if (!POPULAR_LICENSES[validated.licenseId]) {
      return NextResponse.json(
        { error: 'Invalid license ID', availableLicenses: Object.keys(POPULAR_LICENSES) },
        { status: 400 }
      );
    }

    // Get project
    const project = await getProject(validated.projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Generate license text
    const licenseText = generateLicenseText(
      validated.licenseId,
      project.name,
      validated.copyrightHolder,
      validated.year
    );

    // Save to database
    const document = await createDocument({
      projectId: validated.projectId,
      type: 'LICENSE',
      filename: 'LICENSE',
      content: licenseText,
      metadata: {
        licenseId: validated.licenseId,
        licenseName: POPULAR_LICENSES[validated.licenseId].name,
        copyrightHolder: validated.copyrightHolder,
        year: validated.year || new Date().getFullYear(),
        spdxId: POPULAR_LICENSES[validated.licenseId].spdxId,
      },
    });

    // Update package.json if it exists
    let packageJsonUpdated = false;
    try {
      const packageJsonPath = join(project.path, 'package.json');
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        packageJson.license = POPULAR_LICENSES[validated.licenseId].spdxId;
        writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');
        packageJsonUpdated = true;
      }
    } catch (error) {
      console.error('Failed to update package.json:', error);
      // Don't fail the request if package.json update fails
    }

    return NextResponse.json({
      success: true,
      license: {
        id: document.id,
        licenseId: validated.licenseId,
        name: POPULAR_LICENSES[validated.licenseId].name,
        content: licenseText,
      },
      packageJsonUpdated,
    });
  } catch (error) {
    console.error('License generation error:', error);

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
