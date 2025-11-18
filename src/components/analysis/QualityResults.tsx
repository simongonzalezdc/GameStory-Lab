'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, Info, CheckCircle, FileCode } from 'lucide-react';
import type { QualityAnalysisResult, QualityIssue } from '@/lib/analysis/quality';

interface QualityResultsProps {
  result: QualityAnalysisResult;
  onRunAnalysis?: () => void;
  isAnalyzing?: boolean;
}

export function QualityResults({ result, onRunAnalysis, isAnalyzing }: QualityResultsProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedTool, setSelectedTool] = useState<string>('all');

  const filteredIssues = result.issues.filter((issue) => {
    if (selectedSeverity !== 'all' && issue.severity !== selectedSeverity) return false;
    if (selectedTool !== 'all' && issue.tool !== selectedTool) return false;
    return true;
  });

  const getSeverityIcon = (severity: QualityIssue['severity']) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: QualityIssue['severity']) => {
    switch (severity) {
      case 'error':
        return 'text-destructive';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-500';
      case 'info':
        return 'text-blue-600 dark:text-blue-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Code Quality Analysis</CardTitle>
              <CardDescription>
                Found {result.summary.totalIssues} issue{result.summary.totalIssues !== 1 ? 's' : ''}
                {result.summary.fixableIssues > 0 &&
                  ` (${result.summary.fixableIssues} fixable)`}
              </CardDescription>
            </div>
            {onRunAnalysis && (
              <Button onClick={onRunAnalysis} disabled={isAnalyzing}>
                {isAnalyzing ? 'Analyzing...' : 'Re-run Analysis'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Errors</p>
              <p className="text-2xl font-bold text-destructive">{result.summary.errors}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Warnings</p>
              <p className="text-2xl font-bold text-yellow-600">{result.summary.warnings}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Info</p>
              <p className="text-2xl font-bold text-blue-600">{result.summary.info}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Fixable</p>
              <p className="text-2xl font-bold">{result.summary.fixableIssues}</p>
            </div>
          </div>

          {/* Tool Status */}
          <div className="mt-4 space-y-2 text-sm">
            {result.tools.eslint && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>
                  ESLint: {result.tools.eslint.filesAnalyzed} files analyzed
                  {result.tools.eslint.error && (
                    <span className="text-yellow-600"> - {result.tools.eslint.error}</span>
                  )}
                </span>
              </div>
            )}
            {result.tools.semgrep && (
              <div className="flex items-center gap-2">
                {result.tools.semgrep.error ? (
                  <Info className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                <span className={result.tools.semgrep.error ? 'text-muted-foreground' : ''}>
                  Semgrep: {result.tools.semgrep.filesAnalyzed} files analyzed
                  {result.tools.semgrep.error && ` - ${result.tools.semgrep.error}`}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      {result.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Severity</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
              >
                <option value="all">All Severities</option>
                <option value="error">Errors Only</option>
                <option value="warning">Warnings Only</option>
                <option value="info">Info Only</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tool</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={selectedTool}
                onChange={(e) => setSelectedTool(e.target.value)}
              >
                <option value="all">All Tools</option>
                <option value="eslint">ESLint</option>
                <option value="semgrep">Semgrep</option>
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
            <p className="text-lg font-semibold">
              {result.issues.length === 0 ? 'No issues found!' : 'No issues match the filters'}
            </p>
            <p className="text-muted-foreground">
              {result.issues.length === 0
                ? 'Your code looks great!'
                : 'Try adjusting the filters above'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredIssues.map((issue, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {getSeverityIcon(issue.severity)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${getSeverityColor(issue.severity)}`}>
                        {issue.severity.toUpperCase()}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <code className="text-sm bg-muted px-1.5 py-0.5 rounded">{issue.rule}</code>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground capitalize">{issue.tool}</span>
                      {issue.fixable && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-green-600">Fixable</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm">{issue.message}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileCode className="h-3 w-3" />
                      <span>
                        {issue.file}:{issue.line}
                        {issue.column && `:${issue.column}`}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
