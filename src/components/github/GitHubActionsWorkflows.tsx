'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileCode, Copy, CheckCircle } from 'lucide-react';
import type { GitHubWorkflow } from '@/lib/generators/github-actions';

interface GitHubActionsWorkflowsProps {
  workflows: GitHubWorkflow[];
  setupInstructions: string;
}

export function GitHubActionsWorkflows({ workflows, setupInstructions }: GitHubActionsWorkflowsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedInstructions, setCopiedInstructions] = useState(false);

  const copyToClipboard = async (text: string, index?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      if (index !== undefined) {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      } else {
        setCopiedInstructions(true);
        setTimeout(() => setCopiedInstructions(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>GitHub Actions Workflows</CardTitle>
          <CardDescription>
            CI/CD workflows for automated testing, code quality, and deployment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="workflows">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="workflows">Workflow Files</TabsTrigger>
              <TabsTrigger value="instructions">Setup Instructions</TabsTrigger>
            </TabsList>

            <TabsContent value="workflows" className="space-y-4 mt-4">
              {workflows.map((workflow, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileCode className="h-4 w-4" />
                          {workflow.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            .github/workflows/{workflow.fileName}
                          </code>
                        </CardDescription>
                        <p className="text-sm text-muted-foreground mt-2">
                          {workflow.description}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(workflow.content, index)}
                      >
                        {copiedIndex === index ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                      <code>{workflow.content}</code>
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="instructions" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Setup Instructions</CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(setupInstructions)}
                    >
                      {copiedInstructions ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-xs">
                      {setupInstructions}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
