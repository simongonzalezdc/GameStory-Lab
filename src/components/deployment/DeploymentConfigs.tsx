'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import type { DeploymentConfig } from '@/lib/generators/deployment';

interface DeploymentConfigsProps {
  configs: DeploymentConfig[];
  guide: string;
  envTemplate: string;
  dockerIgnore?: string;
  onCopy?: (text: string, type: string) => void;
  onDownload?: (content: string, filename: string) => void;
}

export function DeploymentConfigs({
  configs,
  guide,
  envTemplate,
  dockerIgnore,
  onCopy,
  onDownload,
}: DeploymentConfigsProps) {
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

  const platformIcons: Record<string, string> = {
    vercel: '▲',
    docker: '🐳',
    railway: '🚂',
  };

  const platformUrls: Record<string, string> = {
    vercel: 'https://vercel.com',
    docker: 'https://www.docker.com',
    railway: 'https://railway.app',
  };

  return (
    <div className="space-y-4">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment Guide</CardTitle>
          <CardDescription>
            Generated deployment configurations for {configs.length} platform{configs.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {configs.map((config) => (
              <Badge key={config.platform} variant="secondary">
                {platformIcons[config.platform]} {config.platform.toUpperCase()}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="guide" className="w-full">
        <TabsList className="grid w-full grid-cols-auto">
          <TabsTrigger value="guide">Guide</TabsTrigger>
          {configs.map((config) => (
            <TabsTrigger key={config.platform} value={config.platform}>
              {platformIcons[config.platform]} {config.platform}
            </TabsTrigger>
          ))}
          <TabsTrigger value="env">Environment</TabsTrigger>
        </TabsList>

        {/* Deployment Guide Tab */}
        <TabsContent value="guide" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Comprehensive Deployment Guide</CardTitle>
                <CardDescription>Step-by-step instructions for deploying your project</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(guide, 'deployment-guide.md')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm">{guide}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform-specific tabs */}
        {configs.map((config) => (
          <TabsContent key={config.platform} value={config.platform} className="space-y-4">
            {/* Config File */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span>{platformIcons[config.platform]}</span>
                    <span>{config.filename}</span>
                  </CardTitle>
                  <CardDescription>Configuration file for {config.platform}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(config.content, config.platform)}
                  >
                    {copiedItem === config.platform ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {copiedItem === config.platform ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(config.content, config.filename)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                  <code>{config.content}</code>
                </pre>
              </CardContent>
            </Card>

            {/* Environment Variables */}
            {config.environmentVariables && config.environmentVariables.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Environment Variables</CardTitle>
                  <CardDescription>Required environment variables for {config.platform}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {config.environmentVariables.map((envVar) => (
                      <div
                        key={envVar.key}
                        className="flex items-start justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono">{envVar.key}</code>
                            {envVar.required && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{envVar.description}</p>
                          {envVar.defaultValue && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Default: <code>{envVar.defaultValue}</code>
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(envVar.key, `env-${envVar.key}`)}
                        >
                          {copiedItem === `env-${envVar.key}` ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Deployment Instructions</CardTitle>
                  <CardDescription>How to deploy to {config.platform}</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(platformUrls[config.platform], '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit {config.platform}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm">
                    {config.instructions}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Docker Compose (if Docker) */}
            {config.platform === 'docker' && dockerIgnore && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">.dockerignore</CardTitle>
                    <CardDescription>Files to exclude from Docker build</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(dockerIgnore, 'dockerignore')}
                    >
                      {copiedItem === 'dockerignore' ? (
                        <Check className="h-4 w-4 mr-2" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      {copiedItem === 'dockerignore' ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(dockerIgnore, '.dockerignore')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    <code>{dockerIgnore}</code>
                  </pre>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}

        {/* Environment Template Tab */}
        <TabsContent value="env" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>.env.example</CardTitle>
                <CardDescription>Environment variables template for your project</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(envTemplate, 'env')}
                >
                  {copiedItem === 'env' ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {copiedItem === 'env' ? 'Copied!' : 'Copy'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(envTemplate, '.env.example')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                <code>{envTemplate}</code>
              </pre>
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  <strong>Note:</strong> Create a <code>.env</code> file in your project root and fill in these
                  values before deploying.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
