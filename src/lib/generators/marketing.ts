import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { getLLMRouter } from '../ai/router';
import fg from 'fast-glob';

export interface MarketingContent {
  landingPage: {
    headline: string;
    subheadline: string;
    heroSection: string;
    features: Array<{
      title: string;
      description: string;
    }>;
    cta: string;
    fullMarkdown: string;
  };
  socialMedia: {
    twitter: string[];
    linkedin: string;
    productHunt: {
      tagline: string;
      description: string;
      features: string[];
    };
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
    ogTitle: string;
    ogDescription: string;
    ogImage?: string;
    twitterCard: string;
    twitterTitle: string;
    twitterDescription: string;
    metaTags: string;
  };
  emailCampaign?: {
    subject: string;
    preview: string;
    body: string;
  };
}

export interface ProjectAnalysis {
  name: string;
  description?: string;
  language: string;
  framework?: string;
  dependencies: string[];
  features: string[];
  uniqueValue: string;
  targetAudience: string;
}

/**
 * Analyze project to extract marketing-relevant information
 */
async function analyzeProjectForMarketing(
  projectPath: string,
  projectName: string,
  projectDescription?: string
): Promise<ProjectAnalysis> {
  const analysis: ProjectAnalysis = {
    name: projectName,
    description: projectDescription,
    language: 'JavaScript',
    dependencies: [],
    features: [],
    uniqueValue: '',
    targetAudience: 'developers',
  };

  try {
    // Read package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      analysis.description = analysis.description || packageJson.description;
      analysis.dependencies = Object.keys(packageJson.dependencies || {});

      // Detect framework
      if (analysis.dependencies.includes('next')) {
        analysis.framework = 'Next.js';
      } else if (analysis.dependencies.includes('react')) {
        analysis.framework = 'React';
      } else if (analysis.dependencies.includes('vue')) {
        analysis.framework = 'Vue';
      } else if (analysis.dependencies.includes('express')) {
        analysis.framework = 'Express';
      }

      // Detect language
      if (existsSync(path.join(projectPath, 'tsconfig.json'))) {
        analysis.language = 'TypeScript';
      }
    }

    // Scan for feature indicators
    const files = await fg(['**/*.{ts,tsx,js,jsx,md}'], {
      cwd: projectPath,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
      deep: 3,
    });

    const featureKeywords = {
      'Authentication': ['auth', 'login', 'signup', 'jwt', 'passport'],
      'Database': ['database', 'db', 'prisma', 'drizzle', 'mongoose'],
      'API': ['api', 'rest', 'graphql', 'endpoint'],
      'Real-time': ['socket', 'websocket', 'realtime', 'sse'],
      'AI/ML': ['ai', 'openai', 'llm', 'machine-learning', 'tensorflow'],
      'Payment': ['stripe', 'payment', 'checkout', 'billing'],
      'Email': ['email', 'sendgrid', 'mailgun', 'resend'],
      'Search': ['search', 'elasticsearch', 'algolia'],
      'Analytics': ['analytics', 'tracking', 'metrics'],
      'Testing': ['test', 'jest', 'vitest', 'cypress'],
    };

    const detectedFeatures = new Set<string>();
    for (const file of files.slice(0, 100)) {
      const fileName = file.toLowerCase();
      for (const [feature, keywords] of Object.entries(featureKeywords)) {
        if (keywords.some((keyword) => fileName.includes(keyword))) {
          detectedFeatures.add(feature);
        }
      }
    }

    analysis.features = Array.from(detectedFeatures);

    return analysis;
  } catch (error) {
    console.error('Marketing analysis error:', error);
    return analysis;
  }
}

/**
 * Generate comprehensive marketing content using AI
 */
export async function generateMarketingContent(
  projectPath: string,
  projectName: string,
  projectDescription?: string,
  model: string = 'smollm2:1.7b'
): Promise<MarketingContent> {
  const analysis = await analyzeProjectForMarketing(projectPath, projectName, projectDescription);
  const llmRouter = getLLMRouter();

  const context = `
Project: ${analysis.name}
Description: ${analysis.description || 'A modern web application'}
Tech Stack: ${analysis.language}${analysis.framework ? ` with ${analysis.framework}` : ''}
Key Features: ${analysis.features.length > 0 ? analysis.features.join(', ') : 'Modern web application features'}
Main Dependencies: ${analysis.dependencies.slice(0, 10).join(', ')}
`.trim();

  // Generate landing page content
  const landingPagePrompt = `You are a marketing copywriter creating a landing page for a software project.

${context}

Create compelling landing page content with:

1. **Headline**: A catchy, benefit-focused headline (max 10 words)
2. **Subheadline**: Supporting text that explains the value proposition (max 20 words)
3. **Hero Section**: A brief paragraph for the hero section (2-3 sentences)
4. **Features**: List 4-6 key features with titles and descriptions
5. **Call-to-Action**: A compelling CTA button text

Format your response in this structure:
# Headline
[headline text]

## Subheadline
[subheadline text]

## Hero
[hero paragraph]

## Features
### [Feature 1 Title]
[Feature 1 description]

### [Feature 2 Title]
[Feature 2 description]

[continue for all features...]

## CTA
[CTA button text]

Be concise, benefit-focused, and use active voice. Highlight what makes this project unique.`;

  const landingPageResponse = await llmRouter.chat(
    [
      { role: 'system', content: 'You are an expert marketing copywriter specializing in developer tools and SaaS products.' },
      { role: 'user', content: landingPagePrompt },
    ],
    model,
    { temperature: 0.8 }
  );

  // Parse landing page response
  const landingPage = parseLandingPageContent(landingPageResponse.content, analysis.name);

  // Generate social media content
  const socialMediaPrompt = `Create social media content for: ${analysis.name}

${context}

Generate:

1. **Twitter/X Posts**: 3 different tweet variations (max 280 characters each)
2. **LinkedIn Post**: A professional post (max 300 words)
3. **Product Hunt**:
   - Tagline (max 60 characters)
   - Description (max 260 characters)
   - Features list (5-7 bullet points)

Format:
## Twitter
[Tweet 1]

[Tweet 2]

[Tweet 3]

## LinkedIn
[LinkedIn post]

## Product Hunt
**Tagline:** [tagline]

**Description:** [description]

**Features:**
- [Feature 1]
- [Feature 2]
[continue...]

Make it engaging, use relevant hashtags, and focus on benefits over features.`;

  const socialMediaResponse = await llmRouter.chat(
    [
      { role: 'system', content: 'You are a social media marketing expert.' },
      { role: 'user', content: socialMediaPrompt },
    ],
    model,
    { temperature: 0.9 }
  );

  const socialMedia = parseSocialMediaContent(socialMediaResponse.content);

  // Generate SEO meta tags
  const seo = generateSEOMetaTags(landingPage, analysis.name, analysis.description);

  return {
    landingPage,
    socialMedia,
    seo,
  };
}

/**
 * Parse landing page content from AI response
 */
function parseLandingPageContent(content: string, projectName: string): MarketingContent['landingPage'] {
  const headlineMatch = content.match(/# Headline\s*\n(.+)/i);
  const subheadlineMatch = content.match(/## Subheadline\s*\n(.+)/i);
  const heroMatch = content.match(/## Hero\s*\n([\s\S]+?)(?=##|$)/i);
  const ctaMatch = content.match(/## CTA\s*\n(.+)/i);

  // Extract features
  const featuresSection = content.match(/## Features\s*\n([\s\S]+?)(?=## CTA|$)/i);
  const features: Array<{ title: string; description: string }> = [];

  if (featuresSection) {
    const featureRegex = /### (.+)\n([\s\S]+?)(?=###|##|$)/g;
    let match;
    while ((match = featureRegex.exec(featuresSection[1])) !== null) {
      features.push({
        title: match[1].trim(),
        description: match[2].trim(),
      });
    }
  }

  // Fallback values
  const headline = headlineMatch?.[1]?.trim() || `${projectName} - Ship Faster, Build Better`;
  const subheadline = subheadlineMatch?.[1]?.trim() || 'The modern toolkit for developers';
  const heroSection = heroMatch?.[1]?.trim() || `${projectName} helps developers build and ship better software faster.`;
  const cta = ctaMatch?.[1]?.trim() || 'Get Started Free';

  return {
    headline,
    subheadline,
    heroSection,
    features: features.length > 0 ? features : [
      { title: 'Fast Setup', description: 'Get started in minutes' },
      { title: 'Developer Friendly', description: 'Built by developers, for developers' },
    ],
    cta,
    fullMarkdown: content,
  };
}

/**
 * Parse social media content from AI response
 */
function parseSocialMediaContent(content: string): MarketingContent['socialMedia'] {
  // Extract Twitter posts
  const twitterSection = content.match(/## Twitter\s*\n([\s\S]+?)(?=## LinkedIn|$)/i);
  const twitterPosts: string[] = [];
  if (twitterSection) {
    const tweets = twitterSection[1].split('\n\n').filter((t) => t.trim().length > 0);
    twitterPosts.push(...tweets.slice(0, 3));
  }

  // Extract LinkedIn post
  const linkedinMatch = content.match(/## LinkedIn\s*\n([\s\S]+?)(?=## Product Hunt|$)/i);
  const linkedin = linkedinMatch?.[1]?.trim() || '';

  // Extract Product Hunt content
  const taglineMatch = content.match(/\*\*Tagline:\*\*\s*(.+)/i);
  const descriptionMatch = content.match(/\*\*Description:\*\*\s*(.+)/i);
  const featuresSection = content.match(/\*\*Features:\*\*\s*\n([\s\S]+?)$/i);

  const phFeatures: string[] = [];
  if (featuresSection) {
    const featureRegex = /^[\-\*]\s*(.+)$/gm;
    let match;
    while ((match = featureRegex.exec(featuresSection[1])) !== null) {
      phFeatures.push(match[1].trim());
    }
  }

  return {
    twitter: twitterPosts.length > 0 ? twitterPosts : ['Check out our new project! 🚀'],
    linkedin: linkedin || 'Excited to share our new project!',
    productHunt: {
      tagline: taglineMatch?.[1]?.trim() || 'Build better software faster',
      description: descriptionMatch?.[1]?.trim() || 'A modern toolkit for developers',
      features: phFeatures.length > 0 ? phFeatures : ['Modern tech stack', 'Easy to use'],
    },
  };
}

/**
 * Generate SEO meta tags for the project
 */
function generateSEOMetaTags(
  landingPage: MarketingContent['landingPage'],
  projectName: string,
  projectDescription?: string
): MarketingContent['seo'] {
  // Extract keywords from features and description
  const keywords: string[] = [];

  // Add project type keywords
  keywords.push('developer tools', 'software development', 'web application');

  // Add feature-based keywords
  landingPage.features.forEach((feature) => {
    const words = feature.title.toLowerCase().split(' ');
    keywords.push(...words.filter((w) => w.length > 3));
  });

  // Create meta description
  const description = projectDescription || landingPage.subheadline || landingPage.heroSection.substring(0, 155);
  const truncatedDescription = description.length > 160 ? description.substring(0, 157) + '...' : description;

  // SEO title (optimal length: 50-60 characters)
  const seoTitle = `${projectName} - ${landingPage.headline.substring(0, 50)}`;

  // Open Graph and Twitter Card content
  const ogTitle = landingPage.headline;
  const ogDescription = landingPage.subheadline || truncatedDescription;
  const twitterTitle = landingPage.headline.substring(0, 70);
  const twitterDescription = landingPage.subheadline || truncatedDescription.substring(0, 200);

  // Generate HTML meta tags
  const metaTags = `<!-- Primary Meta Tags -->
<title>${seoTitle}</title>
<meta name="title" content="${seoTitle}">
<meta name="description" content="${truncatedDescription}">
<meta name="keywords" content="${keywords.slice(0, 10).join(', ')}">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://yoursite.com/">
<meta property="og:title" content="${ogTitle}">
<meta property="og:description" content="${ogDescription}">
<meta property="og:image" content="https://yoursite.com/og-image.png">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="https://yoursite.com/">
<meta property="twitter:title" content="${twitterTitle}">
<meta property="twitter:description" content="${twitterDescription}">
<meta property="twitter:image" content="https://yoursite.com/twitter-image.png">

<!-- Additional SEO -->
<meta name="robots" content="index, follow">
<meta name="language" content="English">
<meta name="author" content="${projectName} Team">
<link rel="canonical" href="https://yoursite.com/">`;

  return {
    title: seoTitle,
    description: truncatedDescription,
    keywords: keywords.slice(0, 15),
    ogTitle,
    ogDescription,
    ogImage: 'https://yoursite.com/og-image.png',
    twitterCard: 'summary_large_image',
    twitterTitle,
    twitterDescription,
    metaTags,
  };
}

/**
 * Generate single marketing asset (for targeted generation)
 */
export async function generateMarketingAsset(
  projectPath: string,
  projectName: string,
  assetType: 'landing' | 'twitter' | 'linkedin' | 'producthunt',
  projectDescription?: string,
  model: string = 'smollm2:1.7b'
): Promise<string> {
  const analysis = await analyzeProjectForMarketing(projectPath, projectName, projectDescription);
  const llmRouter = getLLMRouter();

  const context = `
Project: ${analysis.name}
Description: ${analysis.description || 'A modern web application'}
Tech Stack: ${analysis.language}${analysis.framework ? ` with ${analysis.framework}` : ''}
Key Features: ${analysis.features.length > 0 ? analysis.features.join(', ') : 'Modern features'}
`.trim();

  const prompts = {
    landing: `Create a landing page hero section for ${projectName}.\n\n${context}\n\nWrite a compelling headline, subheadline, and 2-3 sentence hero text. Focus on benefits and value proposition.`,
    twitter: `Write 3 engaging tweets to announce ${projectName}.\n\n${context}\n\nMake them catchy, use emojis, and keep under 280 characters. Include relevant hashtags.`,
    linkedin: `Write a LinkedIn announcement post for ${projectName}.\n\n${context}\n\nMake it professional yet engaging. 200-300 words. Focus on the problem it solves and the value it provides.`,
    producthunt: `Create a Product Hunt launch description for ${projectName}.\n\n${context}\n\nInclude:\n- A catchy tagline (max 60 chars)\n- Description (max 260 chars)\n- 5-7 key features\n\nBe concise and benefit-focused.`,
  };

  const response = await llmRouter.chat(
    [
      { role: 'system', content: 'You are a marketing expert.' },
      { role: 'user', content: prompts[assetType] },
    ],
    model,
    { temperature: 0.8 }
  );

  return response.content;
}
