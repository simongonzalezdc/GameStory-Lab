'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Download, Check } from 'lucide-react';
import { useState } from 'react';
import type { MarketingContent as MarketingContentType } from '@/lib/generators/marketing';

interface MarketingContentProps {
  content: MarketingContentType;
  onCopy?: (text: string, type: string) => void;
  onDownload?: (content: string, filename: string) => void;
}

export function MarketingContent({ content, onCopy, onDownload }: MarketingContentProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(type);
    setTimeout(() => setCopiedItem(null), 2000);
    onCopy?.(text, type);
  };

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    onDownload?.(text, filename);
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="landing" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="landing">Landing Page</TabsTrigger>
          <TabsTrigger value="twitter">Twitter</TabsTrigger>
          <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
          <TabsTrigger value="producthunt">Product Hunt</TabsTrigger>
        </TabsList>

        {/* Landing Page Tab */}
        <TabsContent value="landing" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Landing Page Content</CardTitle>
                <CardDescription>Hero section and key features</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(content.landingPage.fullMarkdown, 'landing')}
                >
                  {copiedItem === 'landing' ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {copiedItem === 'landing' ? 'Copied!' : 'Copy All'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(content.landingPage.fullMarkdown, 'landing-page.md')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Headline */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Headline</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(content.landingPage.headline, 'headline')}
                  >
                    {copiedItem === 'headline' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <p className="text-2xl font-bold">{content.landingPage.headline}</p>
              </div>

              {/* Subheadline */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Subheadline</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(content.landingPage.subheadline, 'subheadline')}
                  >
                    {copiedItem === 'subheadline' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <p className="text-lg text-muted-foreground">{content.landingPage.subheadline}</p>
              </div>

              {/* Hero Text */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Hero Text</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(content.landingPage.heroSection, 'hero')}
                  >
                    {copiedItem === 'hero' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <p className="text-sm">{content.landingPage.heroSection}</p>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-sm font-medium mb-2">Features</h3>
                <div className="grid gap-3">
                  {content.landingPage.features.map((feature, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base">{feature.title}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleCopy(`${feature.title}\n${feature.description}`, `feature-${index}`)
                            }
                          >
                            {copiedItem === `feature-${index}` ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <CardDescription className="text-sm">{feature.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Call to Action</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(content.landingPage.cta, 'cta')}
                  >
                    {copiedItem === 'cta' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <Button>{content.landingPage.cta}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Twitter Tab */}
        <TabsContent value="twitter" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Twitter/X Posts</CardTitle>
              <CardDescription>Ready-to-post tweets for your announcement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {content.socialMedia.twitter.map((tweet, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm flex-1 whitespace-pre-wrap">{tweet}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(tweet, `tweet-${index}`)}
                      >
                        {copiedItem === `tweet-${index}` ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{tweet.length} characters</p>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LinkedIn Tab */}
        <TabsContent value="linkedin" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>LinkedIn Post</CardTitle>
                <CardDescription>Professional announcement for LinkedIn</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(content.socialMedia.linkedin, 'linkedin')}
              >
                {copiedItem === 'linkedin' ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copiedItem === 'linkedin' ? 'Copied!' : 'Copy'}
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{content.socialMedia.linkedin}</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Hunt Tab */}
        <TabsContent value="producthunt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Hunt Launch</CardTitle>
              <CardDescription>Content for your Product Hunt submission</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tagline */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Tagline</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(content.socialMedia.productHunt.tagline, 'ph-tagline')}
                  >
                    {copiedItem === 'ph-tagline' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <p className="text-base font-medium">{content.socialMedia.productHunt.tagline}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {content.socialMedia.productHunt.tagline.length}/60 characters
                </p>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Description</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(content.socialMedia.productHunt.description, 'ph-desc')}
                  >
                    {copiedItem === 'ph-desc' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <p className="text-sm">{content.socialMedia.productHunt.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {content.socialMedia.productHunt.description.length}/260 characters
                </p>
              </div>

              {/* Features */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Key Features</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleCopy(content.socialMedia.productHunt.features.join('\n'), 'ph-features')
                    }
                  >
                    {copiedItem === 'ph-features' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <ul className="space-y-1">
                  {content.socialMedia.productHunt.features.map((feature, index) => (
                    <li key={index} className="text-sm flex items-start">
                      <span className="mr-2">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
