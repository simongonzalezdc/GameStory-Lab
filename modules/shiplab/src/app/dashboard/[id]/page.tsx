'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { QualityResults } from '@/components/analysis/QualityResults';
import { MarketingContent } from '@/components/marketing/MarketingContent';
import { DeploymentConfigs } from '@/components/deployment/DeploymentConfigs';
import { LicenseSelector } from '@/components/licensing/LicenseSelector';
import { GitHubActionsWorkflows } from '@/components/github/GitHubActionsWorkflows';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, FolderOpen, GitBranch, Calendar, FileSearch, FileText, Sparkles, Loader2, Megaphone, Rocket, Scale, Workflow } from 'lucide-react';
import type { Project } from '@/lib/db/schema';
import type { QualityAnalysisResult } from '@/lib/analysis/quality';
import type { MarketingContent as MarketingContentType } from '@/lib/generators/marketing';
import type { DeploymentConfig } from '@/lib/generators/deployment';
import type { GitHubWorkflow } from '@/lib/generators/github-actions';

type ActiveTab = 'chat' | 'quality' | 'docs' | 'marketing' | 'deployment' | 'licensing' | 'github-actions';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isEditingDocs, setIsEditingDocs] = useState(false);
  const [editedDocsContent, setEditedDocsContent] = useState('');
  const [isSavingToGit, setIsSavingToGit] = useState(false);
  const [qualityResults, setQualityResults] = useState<QualityAnalysisResult | null>(null);
  const [generatedDocs, setGeneratedDocs] = useState<{ type: string; content: string } | null>(null);
  const [marketingContent, setMarketingContent] = useState<MarketingContentType | null>(null);
  const [deploymentConfigs, setDeploymentConfigs] = useState<{
    configs: DeploymentConfig[];
    guide: string;
    envTemplate: string;
    dockerIgnore?: string;
  } | null>(null);
  const [githubActionsWorkflows, setGithubActionsWorkflows] = useState<{
    workflows: GitHubWorkflow[];
    setupInstructions: string;
  } | null>(null);

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
      toast({
        title: "Analysis Complete",
        description: `Found ${data.result.issues.length} issues in your code.`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Failed to run quality analysis. Make sure the project path is valid.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyAutoFixes = async () => {
    setIsFixing(true);
    try {
      const response = await fetch('/api/analyze/quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id, autoFix: true }),
      });

      if (!response.ok) {
        throw new Error('Auto-fix failed');
      }

      const data = await response.json();
      setQualityResults(data.result);
      toast({
        title: "Auto-fix Complete",
        description: "Fixable issues have been automatically resolved. Re-run analysis to see updated results.",
      });
    } catch (error) {
      console.error('Auto-fix error:', error);
      toast({
        variant: "destructive",
        title: "Auto-fix Failed",
        description: "Failed to apply automatic fixes. Please try again.",
      });
    } finally {
      setIsFixing(false);
    }
  };

  const startEditingDocs = () => {
    if (generatedDocs) {
      setEditedDocsContent(generatedDocs.content);
      setIsEditingDocs(true);
    }
  };

  const saveEditedDocs = () => {
    if (generatedDocs) {
      setGeneratedDocs({ ...generatedDocs, content: editedDocsContent });
      setIsEditingDocs(false);
      toast({
        title: "Changes Saved",
        description: "Your documentation has been updated.",
      });
    }
  };

  const cancelEditingDocs = () => {
    setIsEditingDocs(false);
    setEditedDocsContent('');
  };

  const saveDocsToGit = async () => {
    if (!generatedDocs) return;

    setIsSavingToGit(true);
    try {
      const fileName = generatedDocs.type === 'README' ? 'README.md' : 'API_DOCS.md';
      const commitMessage = generatedDocs.type === 'README'
        ? 'docs: Update README.md with ShipLab'
        : 'docs: Update API documentation with ShipLab';

      const response = await fetch('/api/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: id,
          filePath: fileName,
          content: generatedDocs.content,
          commitMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save to git');
      }

      toast({
        title: data.warning ? "File Saved" : "Committed to Git",
        description: data.warning || `${fileName} has been committed to your repository.`,
        variant: data.warning ? "default" : "default",
      });
    } catch (error) {
      console.error('Save to git error:', error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save file to git.",
      });
    } finally {
      setIsSavingToGit(false);
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
      toast({
        title: "README Generated",
        description: "Your README documentation has been created successfully.",
      });
    } catch (error) {
      console.error('README generation error:', error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Failed to generate README. The AI service may be unavailable.",
      });
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
      toast({
        title: "API Docs Generated",
        description: "Your API documentation has been created successfully.",
      });
    } catch (error) {
      console.error('API docs generation error:', error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Failed to generate API docs. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMarketing = async () => {
    setIsGenerating(true);
    setActiveTab('marketing');
    try {
      const response = await fetch('/api/generate/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id, assetType: 'full' }),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const data = await response.json();
      setMarketingContent(data.content);
      toast({
        title: "Marketing Content Generated",
        description: "Your marketing materials are ready for landing pages, social media, and Product Hunt.",
      });
    } catch (error) {
      console.error('Marketing generation error:', error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Failed to generate marketing content. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateDeployment = async () => {
    setIsGenerating(true);
    setActiveTab('deployment');
    try {
      const response = await fetch('/api/generate/deployment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id, platforms: ['vercel', 'docker', 'railway'] }),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const data = await response.json();
      setDeploymentConfigs(data.guide);
      toast({
        title: "Deployment Configs Generated",
        description: "Deployment configurations for Vercel, Docker, and Railway are ready.",
      });
    } catch (error) {
      console.error('Deployment config generation error:', error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Failed to generate deployment configs. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateGitHubActions = async () => {
    setIsGenerating(true);
    setActiveTab('github-actions');
    try {
      const response = await fetch('/api/generate/github-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id }),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const data = await response.json();
      setGithubActionsWorkflows({
        workflows: data.workflows,
        setupInstructions: data.setupInstructions,
      });
      toast({
        title: "GitHub Actions Generated",
        description: "CI/CD workflow files have been created.",
      });
    } catch (error) {
      console.error('GitHub Actions generation error:', error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Failed to generate GitHub Actions workflows. Please try again.",
      });
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

              <div className="border-t my-3 pt-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Marketing & Deployment</p>
              </div>

              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                onClick={generateMarketing}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Megaphone className="mr-2 h-4 w-4" />
                )}
                Generate Marketing
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                onClick={generateDeployment}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Rocket className="mr-2 h-4 w-4" />
                )}
                Generate Deployment
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                onClick={generateGitHubActions}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Workflow className="mr-2 h-4 w-4" />
                )}
                GitHub Actions
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                onClick={() => setActiveTab('licensing')}
              >
                <Scale className="mr-2 h-4 w-4" />
                Choose License
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Area */}
        <div className="flex-1 flex flex-col">
          {/* Tab Navigation */}
          <div className="border-b px-4 py-2 flex gap-2 overflow-x-auto">
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
              Quality
            </Button>
            <Button
              variant={activeTab === 'docs' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('docs')}
              disabled={!generatedDocs}
            >
              Docs
            </Button>
            <Button
              variant={activeTab === 'marketing' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('marketing')}
              disabled={!marketingContent}
            >
              Marketing
            </Button>
            <Button
              variant={activeTab === 'deployment' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('deployment')}
              disabled={!deploymentConfigs}
            >
              Deployment
            </Button>
            <Button
              variant={activeTab === 'github-actions' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('github-actions')}
              disabled={!githubActionsWorkflows}
            >
              CI/CD
            </Button>
            <Button
              variant={activeTab === 'licensing' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('licensing')}
            >
              Licensing
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <ErrorBoundary>
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
                    onAutoFix={applyAutoFixes}
                    isFixing={isFixing}
                  />
                </div>
              )}

              {activeTab === 'docs' && generatedDocs && (
                <div className="p-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{generatedDocs.type} Documentation</CardTitle>
                          <CardDescription>Generated documentation for your project</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {isEditingDocs ? (
                            <>
                              <Button onClick={saveEditedDocs} variant="default" size="sm">
                                Save Changes
                              </Button>
                              <Button onClick={cancelEditingDocs} variant="outline" size="sm">
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button onClick={saveDocsToGit} variant="default" size="sm" disabled={isSavingToGit}>
                                {isSavingToGit ? 'Saving...' : 'Save to Git'}
                              </Button>
                              <Button onClick={startEditingDocs} variant="outline" size="sm">
                                Edit
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isEditingDocs ? (
                        <textarea
                          className="w-full min-h-[500px] p-4 font-mono text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          value={editedDocsContent}
                          onChange={(e) => setEditedDocsContent(e.target.value)}
                        />
                      ) : (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
                            {generatedDocs.content}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'marketing' && marketingContent && (
                <div className="p-4">
                  <MarketingContent content={marketingContent} />
                </div>
              )}

              {activeTab === 'deployment' && deploymentConfigs && (
                <div className="p-4">
                  <DeploymentConfigs
                    configs={deploymentConfigs.configs}
                    guide={deploymentConfigs.guide}
                    envTemplate={deploymentConfigs.envTemplate}
                    dockerIgnore={deploymentConfigs.dockerIgnore}
                  />
                </div>
              )}

              {activeTab === 'github-actions' && githubActionsWorkflows && (
                <div className="p-4">
                  <GitHubActionsWorkflows
                    workflows={githubActionsWorkflows.workflows}
                    setupInstructions={githubActionsWorkflows.setupInstructions}
                  />
                </div>
              )}

              {activeTab === 'licensing' && (
                <div className="p-4">
                  <LicenseSelector projectId={project.id} />
                </div>
              )}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
