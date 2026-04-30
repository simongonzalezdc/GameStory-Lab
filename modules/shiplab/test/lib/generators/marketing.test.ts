import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the getLLMRouter to avoid actual AI calls in tests
vi.mock('@/lib/ai/router', () => ({
  getLLMRouter: vi.fn(() => ({
    chat: vi.fn().mockResolvedValue({
      content: `# Headline
Ship Faster with TestProject

## Subheadline
Modern toolkit for developers

## Hero
TestProject helps developers build better software faster.

## Features
### Fast Setup
Get started in minutes with zero configuration.

### Developer Friendly
Built by developers, for developers with modern tools.

### Powerful Features
Everything you need to ship production-ready apps.

## CTA
Get Started Free`,
    }),
  })),
}));

vi.mock('fs', async () => {
  return {
    default: {
      readFileSync: vi.fn(() => JSON.stringify({
        name: 'test-project',
        description: 'A test project',
        dependencies: {
          react: '^19.0.0',
          next: '^16.0.0',
        },
      })),
      existsSync: vi.fn(() => true),
    },
    readFileSync: vi.fn(() => JSON.stringify({
      name: 'test-project',
      description: 'A test project',
      dependencies: {
        react: '^19.0.0',
        next: '^16.0.0',
      },
    })),
    existsSync: vi.fn(() => true),
  };
});

vi.mock('fast-glob', () => ({
  default: vi.fn(() => Promise.resolve(['src/index.ts', 'src/api/route.ts'])),
}));

describe('Marketing Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateMarketingContent', () => {
    it('should have correct structure', async () => {
      // Dynamic import to apply mocks
      const { generateMarketingContent } = await import('@/lib/generators/marketing');

      const result = await generateMarketingContent('/test/path', 'TestProject', 'A test project');

      expect(result).toHaveProperty('landingPage');
      expect(result).toHaveProperty('socialMedia');
      expect(result.landingPage).toHaveProperty('headline');
      expect(result.landingPage).toHaveProperty('subheadline');
      expect(result.landingPage).toHaveProperty('heroSection');
      expect(result.landingPage).toHaveProperty('features');
      expect(result.landingPage).toHaveProperty('cta');
      expect(Array.isArray(result.landingPage.features)).toBe(true);
    });

    it('should generate fallback content when parsing fails', async () => {
      const { generateMarketingContent } = await import('@/lib/generators/marketing');

      const result = await generateMarketingContent('/test/path', 'MyProject');

      expect(result.landingPage.headline).toBeTruthy();
      expect(result.landingPage.cta).toBeTruthy();
      expect(result.socialMedia.twitter).toBeDefined();
      expect(Array.isArray(result.socialMedia.twitter)).toBe(true);
    });
  });

  describe('Landing page structure', () => {
    it('should have required landing page fields', async () => {
      const { generateMarketingContent } = await import('@/lib/generators/marketing');
      const result = await generateMarketingContent('/test/path', 'TestProject');

      expect(typeof result.landingPage.headline).toBe('string');
      expect(typeof result.landingPage.subheadline).toBe('string');
      expect(typeof result.landingPage.heroSection).toBe('string');
      expect(Array.isArray(result.landingPage.features)).toBe(true);
      expect(typeof result.landingPage.cta).toBe('string');
    });

    it('should have features with title and description', async () => {
      const { generateMarketingContent } = await import('@/lib/generators/marketing');
      const result = await generateMarketingContent('/test/path', 'TestProject');

      result.landingPage.features.forEach((feature) => {
        expect(feature).toHaveProperty('title');
        expect(feature).toHaveProperty('description');
        expect(typeof feature.title).toBe('string');
        expect(typeof feature.description).toBe('string');
      });
    });
  });

  describe('Social media structure', () => {
    it('should have all social media platforms', async () => {
      const { generateMarketingContent } = await import('@/lib/generators/marketing');
      const result = await generateMarketingContent('/test/path', 'TestProject');

      expect(result.socialMedia).toHaveProperty('twitter');
      expect(result.socialMedia).toHaveProperty('linkedin');
      expect(result.socialMedia).toHaveProperty('productHunt');
    });

    it('should have Product Hunt content structure', async () => {
      const { generateMarketingContent } = await import('@/lib/generators/marketing');
      const result = await generateMarketingContent('/test/path', 'TestProject');

      expect(result.socialMedia.productHunt).toHaveProperty('tagline');
      expect(result.socialMedia.productHunt).toHaveProperty('description');
      expect(result.socialMedia.productHunt).toHaveProperty('features');
      expect(Array.isArray(result.socialMedia.productHunt.features)).toBe(true);
    });
  });
});
