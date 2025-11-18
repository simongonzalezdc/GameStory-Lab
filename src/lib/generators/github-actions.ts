import type { Project } from '@/lib/db/schema';

export interface GitHubWorkflow {
  name: string;
  fileName: string;
  content: string;
  description: string;
}

/**
 * Generate GitHub Actions CI workflow
 */
function generateCIWorkflow(project: Project): GitHubWorkflow {
  const isNode = project.language === 'JavaScript' || project.language === 'TypeScript';
  const isPython = project.language === 'Python';
  const framework = project.framework?.toLowerCase() || '';

  let workflow = `name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

`;

  if (isNode) {
    workflow += `    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linter
      run: npm run lint

    - name: Run tests
      run: npm test

    - name: Build
      run: npm run build
`;
  } else if (isPython) {
    workflow += `    - name: Setup Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.11'

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt

    - name: Run linter
      run: |
        pip install flake8
        flake8 .

    - name: Run tests
      run: pytest
`;
  } else {
    workflow += `    - name: Run tests
      run: echo "Add your test commands here"
`;
  }

  return {
    name: 'CI Workflow',
    fileName: 'ci.yml',
    content: workflow,
    description: 'Continuous Integration workflow for running tests and linting on every push and pull request',
  };
}

/**
 * Generate GitHub Actions CD workflow for deployment
 */
function generateCDWorkflow(project: Project): GitHubWorkflow {
  const framework = project.framework?.toLowerCase() || '';
  const isNextJS = framework.includes('next');
  const isReact = framework.includes('react');

  let workflow = `name: CD

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build
      run: npm run build
      env:
        NODE_ENV: production
`;

  if (isNextJS) {
    workflow += `
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: \${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'
`;
  } else if (isReact) {
    workflow += `
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: \${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
`;
  } else {
    workflow += `
    # Add your deployment steps here
    # Examples:
    # - Deploy to AWS, Azure, GCP
    # - Deploy to VPS via SSH
    # - Deploy to Docker registry
`;
  }

  return {
    name: 'CD Workflow',
    fileName: 'cd.yml',
    content: workflow,
    description: 'Continuous Deployment workflow for automatically deploying to production on main branch',
  };
}

/**
 * Generate GitHub Actions workflow for code quality checks
 */
function generateCodeQualityWorkflow(project: Project): GitHubWorkflow {
  const isNode = project.language === 'JavaScript' || project.language === 'TypeScript';

  let workflow = `name: Code Quality

on:
  pull_request:
    branches: [ main, develop ]

jobs:
  quality:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

`;

  if (isNode) {
    workflow += `    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run ESLint
      run: npm run lint

    - name: Run type check
      run: npx tsc --noEmit
      continue-on-error: true

    - name: Run security audit
      run: npm audit --audit-level=moderate
      continue-on-error: true

    - name: Check for outdated dependencies
      run: npm outdated
      continue-on-error: true
`;
  } else {
    workflow += `    - name: Run code quality checks
      run: echo "Add your code quality checks here"
`;
  }

  return {
    name: 'Code Quality Workflow',
    fileName: 'code-quality.yml',
    content: workflow,
    description: 'Automated code quality checks on pull requests including linting, type checking, and security audits',
  };
}

/**
 * Generate GitHub Actions workflow for dependency updates
 */
function generateDependabotConfig(): GitHubWorkflow {
  const config = `version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "maintainers"
    commit-message:
      prefix: "chore"
      prefix-development: "chore"
      include: "scope"
`;

  return {
    name: 'Dependabot Configuration',
    fileName: '../dependabot.yml',
    content: config,
    description: 'Automated dependency updates with Dependabot',
  };
}

/**
 * Generate all GitHub Actions workflows for a project
 */
export function generateGitHubActionsWorkflows(project: Project): {
  workflows: GitHubWorkflow[];
  setupInstructions: string;
} {
  const workflows: GitHubWorkflow[] = [
    generateCIWorkflow(project),
    generateCDWorkflow(project),
    generateCodeQualityWorkflow(project),
    generateDependabotConfig(),
  ];

  const setupInstructions = `# GitHub Actions Setup

## Workflows Generated

${workflows.map((w, i) => `${i + 1}. **${w.name}** (\`.github/workflows/${w.fileName}\`)
   ${w.description}`).join('\n\n')}

## Setup Instructions

1. **Create GitHub Actions directory:**
   \`\`\`bash
   mkdir -p .github/workflows
   \`\`\`

2. **Copy workflow files:**
   Save each workflow file to \`.github/workflows/\` directory with the specified filename.

3. **Configure secrets (if needed):**
   Go to your repository **Settings → Secrets and variables → Actions** and add:

   ${project.framework?.toLowerCase().includes('next') ? `
   For Vercel deployment:
   - \`VERCEL_TOKEN\`: Your Vercel API token
   - \`VERCEL_ORG_ID\`: Your Vercel organization ID
   - \`VERCEL_PROJECT_ID\`: Your Vercel project ID
   ` : ''}

4. **Enable GitHub Actions:**
   - Go to repository **Settings → Actions → General**
   - Select "Allow all actions and reusable workflows"
   - Save changes

5. **Test the workflows:**
   - Create a new branch
   - Make a small change and push
   - Open a pull request to trigger the workflows
   - Check the "Actions" tab to see workflow runs

## Customization

Each workflow can be customized based on your needs:

- **CI Workflow**: Add more test commands, code coverage, or additional quality checks
- **CD Workflow**: Update deployment targets and environment variables
- **Code Quality**: Add custom linting rules or additional security scans
- **Dependabot**: Adjust update frequency and package ecosystems

## Workflow Triggers

- **CI**: Runs on every push to main/develop and on all pull requests
- **CD**: Runs only on pushes to main branch (production deployments)
- **Code Quality**: Runs on pull requests to ensure code quality before merging
- **Dependabot**: Runs weekly to check for dependency updates

## Best Practices

1. Always test workflows in a feature branch first
2. Use branch protection rules to require CI checks before merging
3. Keep workflows fast (< 5 minutes) for better developer experience
4. Cache dependencies to speed up workflow runs
5. Use \`continue-on-error\` for non-critical checks
6. Set up notifications for workflow failures

## Troubleshooting

If workflows fail:
1. Check the Actions tab for detailed error logs
2. Verify all required secrets are configured
3. Ensure your package.json has the necessary scripts (lint, test, build)
4. Check that your test suite passes locally first
5. Review workflow syntax using the GitHub Actions validator

## Next Steps

After setting up GitHub Actions:
- [ ] Configure branch protection rules
- [ ] Set up status checks for pull requests
- [ ] Add workflow status badges to README
- [ ] Configure email notifications for failures
- [ ] Set up deployment environments (staging, production)
`;

  return { workflows, setupInstructions };
}
