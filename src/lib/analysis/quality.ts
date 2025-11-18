import { ESLint } from 'eslint';
import { exec } from 'child_process';
import { promisify } from 'util';
import fg from 'fast-glob';
import path from 'path';

const execAsync = promisify(exec);

export interface QualityIssue {
  tool: 'eslint' | 'semgrep';
  file: string;
  line: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  rule: string;
  fixable?: boolean;
}

export interface QualityAnalysisResult {
  issues: QualityIssue[];
  summary: {
    totalIssues: number;
    errors: number;
    warnings: number;
    info: number;
    fixableIssues: number;
  };
  tools: {
    eslint?: {
      ran: boolean;
      filesAnalyzed: number;
      error?: string;
    };
    semgrep?: {
      ran: boolean;
      filesAnalyzed: number;
      error?: string;
    };
  };
}

/**
 * Run ESLint on a project directory
 */
async function runESLint(projectPath: string): Promise<{
  issues: QualityIssue[];
  filesAnalyzed: number;
  error?: string;
}> {
  try {
    const eslint = new ESLint({
      cwd: projectPath,
      overrideConfigFile: true,
      baseConfig: {
        languageOptions: {
          ecmaVersion: 2024,
          sourceType: 'module',
          parserOptions: {
            ecmaFeatures: {
              jsx: true,
            },
          },
        },
        rules: {
          'no-console': 'warn',
          'no-unused-vars': 'error',
          'no-undef': 'error',
          'no-const-assign': 'error',
          'no-dupe-keys': 'error',
          'no-duplicate-case': 'error',
          'no-empty': 'warn',
          'no-unreachable': 'warn',
          'valid-typeof': 'error',
          'eqeqeq': ['warn', 'always'],
          'curly': ['warn', 'all'],
          'no-var': 'warn',
          'prefer-const': 'warn',
        },
      },
    });

    // Find all JS/TS files
    const patterns = ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'];
    const files = await fg(patterns, {
      cwd: projectPath,
      absolute: true,
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
        '**/coverage/**',
      ],
    });

    if (files.length === 0) {
      return { issues: [], filesAnalyzed: 0 };
    }

    const results = await eslint.lintFiles(files);
    const issues: QualityIssue[] = [];

    for (const result of results) {
      for (const message of result.messages) {
        issues.push({
          tool: 'eslint',
          file: path.relative(projectPath, result.filePath),
          line: message.line,
          column: message.column,
          severity: message.severity === 2 ? 'error' : message.severity === 1 ? 'warning' : 'info',
          message: message.message,
          rule: message.ruleId || 'unknown',
          fixable: message.fix !== undefined,
        });
      }
    }

    return {
      issues,
      filesAnalyzed: files.length,
    };
  } catch (error) {
    console.error('ESLint error:', error);
    return {
      issues: [],
      filesAnalyzed: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Run Semgrep security scanning
 */
async function runSemgrep(projectPath: string): Promise<{
  issues: QualityIssue[];
  filesAnalyzed: number;
  error?: string;
}> {
  try {
    // Check if semgrep is installed
    try {
      await execAsync('semgrep --version');
    } catch {
      return {
        issues: [],
        filesAnalyzed: 0,
        error: 'Semgrep not installed. Install with: pip install semgrep',
      };
    }

    // Run semgrep with auto config (community rules)
    const { stdout } = await execAsync(
      `semgrep --config auto --json --quiet "${projectPath}"`,
      {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        timeout: 60000, // 60 second timeout
      }
    );

    const result = JSON.parse(stdout);
    const issues: QualityIssue[] = [];

    if (result.results) {
      for (const finding of result.results) {
        issues.push({
          tool: 'semgrep',
          file: path.relative(projectPath, finding.path),
          line: finding.start.line,
          column: finding.start.col,
          severity: finding.extra.severity === 'ERROR' ? 'error' : 'warning',
          message: finding.extra.message,
          rule: finding.check_id,
          fixable: false,
        });
      }
    }

    return {
      issues,
      filesAnalyzed: result.results?.length || 0,
    };
  } catch (error) {
    // Semgrep not available is not a critical error
    if (error instanceof Error && error.message.includes('not found')) {
      return {
        issues: [],
        filesAnalyzed: 0,
        error: 'Semgrep not installed (optional)',
      };
    }

    console.error('Semgrep error:', error);
    return {
      issues: [],
      filesAnalyzed: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Run comprehensive code quality analysis
 */
export async function analyzeCodeQuality(
  projectPath: string,
  options: {
    tools?: ('eslint' | 'semgrep')[];
  } = {}
): Promise<QualityAnalysisResult> {
  const enabledTools = options.tools || ['eslint', 'semgrep'];
  const allIssues: QualityIssue[] = [];

  const tools: QualityAnalysisResult['tools'] = {};

  // Run ESLint
  if (enabledTools.includes('eslint')) {
    const eslintResult = await runESLint(projectPath);
    tools.eslint = {
      ran: true,
      filesAnalyzed: eslintResult.filesAnalyzed,
      error: eslintResult.error,
    };
    allIssues.push(...eslintResult.issues);
  }

  // Run Semgrep
  if (enabledTools.includes('semgrep')) {
    const semgrepResult = await runSemgrep(projectPath);
    tools.semgrep = {
      ran: true,
      filesAnalyzed: semgrepResult.filesAnalyzed,
      error: semgrepResult.error,
    };
    allIssues.push(...semgrepResult.issues);
  }

  // Calculate summary
  const summary = {
    totalIssues: allIssues.length,
    errors: allIssues.filter((i) => i.severity === 'error').length,
    warnings: allIssues.filter((i) => i.severity === 'warning').length,
    info: allIssues.filter((i) => i.severity === 'info').length,
    fixableIssues: allIssues.filter((i) => i.fixable).length,
  };

  return {
    issues: allIssues,
    summary,
    tools,
  };
}

/**
 * Apply automatic fixes for fixable issues
 */
export async function applyAutoFixes(projectPath: string): Promise<{
  fixed: number;
  error?: string;
}> {
  try {
    const eslint = new ESLint({
      cwd: projectPath,
      fix: true,
      overrideConfigFile: true,
      baseConfig: {
        languageOptions: {
          ecmaVersion: 2024,
          sourceType: 'module',
        },
        rules: {
          'no-var': 'warn',
          'prefer-const': 'warn',
        },
      },
    });

    const patterns = ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'];
    const files = await fg(patterns, {
      cwd: projectPath,
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'],
    });

    const results = await eslint.lintFiles(files);
    await ESLint.outputFixes(results);

    const fixed = results.reduce((count, result) => count + (result.output ? 1 : 0), 0);

    return { fixed };
  } catch (error) {
    return {
      fixed: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
