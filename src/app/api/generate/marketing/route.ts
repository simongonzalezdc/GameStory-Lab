import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateMarketingContent, generateMarketingAsset } from '@/lib/generators/marketing';
import { getProject, createDocument } from '@/lib/db/queries';

const generateMarketingSchema = z.object({
  projectId: z.string(),
  assetType: z.enum(['full', 'landing', 'twitter', 'linkedin', 'producthunt']).optional().default('full'),
  model: z.string().optional().default('smollm2:1.7b'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = generateMarketingSchema.parse(body);

    // Get project
    const project = await getProject(validated.projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (validated.assetType === 'full') {
      // Generate comprehensive marketing content
      const marketingContent = await generateMarketingContent(
        project.path,
        project.name,
        project.description || undefined,
        validated.model
      );

      // Save landing page to database
      const landingPageDoc = await createDocument({
        projectId: validated.projectId,
        type: 'MARKETING',
        filename: 'landing-page.md',
        content: marketingContent.landingPage.fullMarkdown,
        metadata: {
          assetType: 'landing',
          headline: marketingContent.landingPage.headline,
          subheadline: marketingContent.landingPage.subheadline,
          features: marketingContent.landingPage.features,
        },
      });

      // Save social media content
      const socialMediaDoc = await createDocument({
        projectId: validated.projectId,
        type: 'MARKETING',
        filename: 'social-media.json',
        content: JSON.stringify(marketingContent.socialMedia, null, 2),
        metadata: {
          assetType: 'social',
          platforms: ['twitter', 'linkedin', 'producthunt'],
        },
      });

      return NextResponse.json({
        success: true,
        content: marketingContent,
        documents: [
          { id: landingPageDoc.id, type: 'landing' },
          { id: socialMediaDoc.id, type: 'social' },
        ],
      });
    } else {
      // Generate specific asset
      const content = await generateMarketingAsset(
        project.path,
        project.name,
        validated.assetType,
        project.description || undefined,
        validated.model
      );

      // Save to database
      const document = await createDocument({
        projectId: validated.projectId,
        type: 'MARKETING',
        filename: `${validated.assetType}.md`,
        content,
        metadata: {
          assetType: validated.assetType,
        },
      });

      return NextResponse.json({
        success: true,
        content,
        document: { id: document.id, type: validated.assetType },
      });
    }
  } catch (error) {
    console.error('Marketing generation error:', error);

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
