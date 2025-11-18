'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { QualityResults } from '@/components/analysis/QualityResults';
import { ArrowLeft, FolderOpen, GitBranch, Calendar, FileSearch, FileText, Sparkles, Loader2 } from 'lucide-react';
import type { Project } from '@/lib/db/schema';
import type { QualityAnalysisResult } from '@/lib/analysis/quality';

type ActiveTab = 'chat' | 'quality' | 'docs';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qualityResults, setQualityResults] = useState<QualityAnalysisResult | null>(null);
  const [generatedDocs, setGeneratedDocs] = useState<{ type: string; content: string } | null>(null);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) {
        throw new Error('Project not found');
      }
      const data = await response.json();
      setProject(data.project);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runQualityAnalysis = async () => {
    setIsAnalyzing(true);
    setActiveTab('quality');
    try {
      const response = await fetch('/api/analyze/quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setQualityResults(data.result);
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to run quality analysis. Make sure the project path is valid.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateReadme = async () => {
    setIsGenerating(true);
    setActiveTab('docs');
    try {
      const response = await fetch('/api/generate/readme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id }),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const data = await response.json();
      setGeneratedDocs({ type: 'README', content: data.document.content });
    } catch (error) {
      console.error('README generation error:', error);
      alert('Failed to generate README. The AI service may be unavailable.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAPIDocs = async () => {
    setIsGenerating(true);
    setActiveTab('docs');
    try {
      const response = await fetch('/api/generate/api-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id }),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const data = await response.json();
      setGeneratedDocs({ type: 'API', content: data.document.content });
    } catch (error) {
      console.error('API docs generation error:', error);
      alert('Failed to generate API docs.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-8">
        <Card className="text-center py-12">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-2">Project not found</h3>
            <p className="text-muted-foreground mb-4">
              The project you're looking for doesn't exist.
            </p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Projects
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">{project.name}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FolderOpen className="h-3 w-3" />
                    {project.language}
                    {project.framework && ` • ${project.framework}`}
                  </span>
                  {project.gitUrl && (
                    <a
                      href={project.gitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      <GitBranch className="h-3 w-3" />
                      Repository
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Project Info */}
        <div className="w-80 border-r bg-muted/10 p-4 overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium mb-1">Path</p>
                <p className="text-muted-foreground break-all">{project.path}</p>
              </div>
              {project.description && (
                <div>
                  <p className="font-medium mb-1">Description</p>
                  <p className="text-muted-foreground">{project.description}</p>
                </div>
              )}
              <div>
                <p className="font-medium mb-1">Created</p>
                <p className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                onClick={() => setActiveTab('chat')}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                AI Chat
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                onClick={runQualityAnalysis}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileSearch className="mr-2 h-4 w-4" />
                )}
                Run Quality Analysis
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                onClick={generateReadme}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                Generate README
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                onClick={generateAPIDocs}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                Generate API Docs
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Area */}
        <div className="flex-1 flex flex-col">
          {/* Tab Navigation */}
          <div className="border-b px-4 py-2 flex gap-2">
            <Button
              variant={activeTab === 'chat' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('chat')}
            >
              Chat
            </Button>
            <Button
              variant={activeTab === 'quality' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('quality')}
              disabled={!qualityResults}
            >
              Quality Analysis
            </Button>
            <Button
              variant={activeTab === 'docs' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('docs')}
              disabled={!generatedDocs}
            >
              Documentation
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'chat' && (
              <ChatInterface
                projectId={project.id}
                projectName={project.name}
                projectLanguage={project.language}
                projectFramework={project.framework || undefined}
              />
            )}

            {activeTab === 'quality' && qualityResults && (
              <div className="p-4">
                <QualityResults
                  result={qualityResults}
                  onRunAnalysis={runQualityAnalysis}
                  isAnalyzing={isAnalyzing}
                />
              </div>
            )}

            {activeTab === 'docs' && generatedDocs && (
              <div className="p-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{generatedDocs.type} Documentation</CardTitle>
                    <CardDescription>Generated documentation for your project</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
                        {generatedDocs.content}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
