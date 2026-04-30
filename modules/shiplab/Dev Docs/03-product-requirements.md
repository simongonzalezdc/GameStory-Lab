# ShipLab - Product Requirements

**Purpose:** Defines WHAT to build  
**Generated:** November 18, 2025

---

## Project Overview

### Vision
To become the essential "last mile" tool that every solo developer uses to transform finished code into shipped, marketed, and maintained products.

### Problem Statement
Solo developers excel at building features but struggle with the post-production phase: ensuring code quality, writing comprehensive documentation, choosing appropriate licenses, creating marketing materials, and deploying to production.

**Current state:** Developers finish coding and then face an overwhelming checklist of non-coding tasks that are time-consuming, unfamiliar, and easy to get wrong. Many projects remain unshipped or poorly documented because the "boring stuff" feels insurmountable.

**Desired state:** Developers complete their code and use ShipLab to systematically address every post-production need with AI-powered guidance and generation, taking a project from "code complete" to "fully shipped" in hours instead of weeks.

### Target Users

**Primary:** Solo developers and indie hackers building side projects, SaaS products, or open source tools

**Secondary:** Small dev teams (2-5 people), bootcamp graduates launching first projects, freelancers managing multiple client projects

### Success Metrics
- **Adoption:** 1,000 active users within 3 months of launch
- **Completion Rate:** 70% of projects reach "fully analyzed" status
- **Time Savings:** Users report 50%+ time savings on post-production tasks
- **Quality Improvement:** 30% reduction in code quality issues after using analysis tools
- **Documentation:** 80% of users generate at least one document type
- **NPS:** Net Promoter Score > 50

---

## Core Features (MVP)

### Feature 1: Project Onboarding & Chat Interface

**Priority:** CRITICAL

**User Story:**
> As a solo developer, I want to upload my finished codebase and chat with an AI assistant about what I need to do next, so that I get personalized guidance without reading documentation.

**Description:** The entry point to ShipLab is a conversational interface where users upload their codebase (local folder or Git URL) and immediately start chatting with an AI assistant. The assistant analyzes the project structure, identifies the language/framework, and begins guiding the user through the post-production checklist.

**Acceptance Criteria:**
- [ ] User can upload a project folder via drag-and-drop or folder picker
- [ ] User can connect a GitHub repository via URL
- [ ] System detects primary language, framework, and package manager within 5 seconds
- [ ] Chat interface loads with a personalized greeting mentioning detected tech stack
- [ ] AI assistant suggests the first logical step (e.g., "Let's start with code quality analysis")
- [ ] User can switch between local Ollama and OpenRouter models via settings
- [ ] Chat history persists across sessions

**User Flow:**
1. User lands on homepage → clicks "Start New Project"
2. Upload modal appears → user drags project folder or pastes Git URL
3. System analyzes project → shows loading indicator with detected info
4. Chat interface appears → AI says "I analyzed your Next.js project. Let's improve it. Want to start with code quality?"
5. User continues conversing

**Business Rules:**
- Projects must contain a valid package.json (JavaScript) or requirements.txt (Python) or go.mod (Go) to be analyzed
- Maximum project size: 500MB (to prevent abuse)
- Git repositories are cloned to temporary storage and deleted after 24 hours

**Data Needed:**
- Project metadata (name, path, language, framework)
- File tree structure
- Main configuration files (package.json, tsconfig.json, etc.)
- README.md content (if exists)

**Edge Cases:**
- Monorepo with multiple packages → Ask user which package to analyze
- No recognizable structure → Show error with instructions to add package.json
- Git authentication required → Show instructions for generating personal access token

---

### Feature 2: Code Quality Analysis

**Priority:** CRITICAL

**User Story:**
> As a developer finishing a project, I want automated code quality checks with explanations, so that I can fix issues before shipping.

**Description:** Integrates ESLint (JavaScript/TypeScript), Semgrep (multi-language security), and optional SonarQube-style metrics to scan the codebase. Results are presented with severity levels, explanations, and AI-generated fix suggestions. Users can filter by severity, file, or rule type.

**Acceptance Criteria:**
- [ ] System runs ESLint on JavaScript/TypeScript projects with sensible default config
- [ ] System runs Semgrep security rules on all supported languages
- [ ] Results display in under 30 seconds for projects with <10,000 lines
- [ ] Each issue shows: file, line number, severity, rule name, description
- [ ] User can click "Explain this" to get AI explanation in plain English
- [ ] User can click "Auto-fix" for fixable issues (ESLint --fix)
- [ ] Results summary shows total issues and severity breakdown
- [ ] User can export results as JSON or Markdown

**User Flow:**
1. User asks "Can you check my code quality?"
2. AI responds "Running ESLint and Semgrep..." → shows progress
3. Analysis completes → AI says "Found 42 issues: 5 errors, 30 warnings, 7 info"
4. Results panel appears with filterable list
5. User clicks issue → sees details and can request explanation or fix

**Business Rules:**
- Only run analysis if project has changed since last analysis (compare git hash)
- Cache results for 1 hour to avoid redundant scans
- Auto-fix can only be applied if user explicitly approves

**Data Needed:**
- Codebase contents
- ESLint configuration (if exists) or use defaults
- Semgrep rules (built-in security ruleset)

**Edge Cases:**
- No issues found → Congratulate user and suggest next step
- Analysis times out (>2 minutes) → Offer to run on smaller subset of files
- Custom ESLint config conflicts with ShipLab defaults → Respect user config, note any disabled rules

---

### Feature 3: Documentation Generator

**Priority:** HIGH

**User Story:**
> As a developer with finished code, I want AI to generate professional documentation, so that users can understand and use my project without me writing everything from scratch.

**Description:** Generates multiple documentation types: README.md (installation, usage, features), API documentation (OpenAPI/Swagger for REST APIs), and technical guides. Uses AI to extract information from code comments, function signatures, and project structure.

**Acceptance Criteria:**
- [ ] Can generate README.md with: project title, description, installation steps, usage examples, features list, contributing guidelines
- [ ] Can generate API documentation from Next.js API routes or Express routes
- [ ] Can generate JSDoc/TSDoc reference documentation
- [ ] User can preview generated docs before saving
- [ ] User can edit generated docs in Markdown editor
- [ ] User can export docs as files or commit to Git
- [ ] Generated docs include badges (build status, license, version) if applicable

**User Flow:**
1. User says "Generate a README for my project"
2. AI asks follow-up questions: "What's your project about? Who is it for?"
3. User provides context → AI generates README
4. Preview appears → User can edit, regenerate, or save
5. User clicks "Save" → File written to project directory

**Business Rules:**
- README generation requires project name, description, and main entry point
- API docs only generated if REST endpoints detected
- Generated docs should reference existing docs (don't overwrite without confirmation)

**Data Needed:**
- Project metadata
- Code structure (functions, classes, exports)
- Existing comments and JSDoc
- Package dependencies (for installation instructions)

**Edge Cases:**
- Project already has README → Ask if user wants to enhance existing or create new
- No API endpoints found → Skip API docs, focus on README
- Multi-language project → Generate language-specific docs or combined overview

---

### Feature 4: Licensing Assistant

**Priority:** HIGH

**User Story:**
> As an open source developer, I want help choosing and applying the right license, so that I protect my work appropriately without researching legal details.

**Description:** Interactive wizard that asks about intended use (commercial use allowed? derivative works? attribution required?) and recommends an SPDX-compliant license. Generates LICENSE file and updates package.json.

**Acceptance Criteria:**
- [ ] Wizard asks 5 key questions about project use and restrictions
- [ ] Recommends top 3 license choices with pros/cons
- [ ] Shows license comparison table (MIT vs Apache vs GPL)
- [ ] Generates LICENSE file with correct copyright holder and year
- [ ] Updates package.json with license field
- [ ] Warns if dependencies have incompatible licenses
- [ ] Provides link to learn more about chosen license

**User Flow:**
1. User says "Help me choose a license"
2. Wizard appears with questions: "Do you want to allow commercial use?"
3. User answers questions → sees recommendations
4. User selects MIT → sees full license text preview
5. User confirms → LICENSE file created, package.json updated

**Business Rules:**
- Copyright holder defaults to project author from Git config
- Year defaults to current year
- Dual licensing (e.g., MIT + Apache) supported for special cases

**Data Needed:**
- Project name
- Author name and email (from Git config or user input)
- Dependency licenses (from package.json)

**Edge Cases:**
- License already exists → Ask if user wants to review or change
- Proprietary project → Suggest custom license or "All Rights Reserved"
- GPL dependency in MIT project → Warn about license compatibility

---

### Feature 5: Marketing Content Generator

**Priority:** MEDIUM

**User Story:**
> As a developer launching a product, I want AI to write landing page copy and social media posts, so that I can market my work without hiring a copywriter.

**Description:** Generates marketing materials based on project analysis and user input. Includes: landing page hero/features section, Twitter/X announcement thread, Product Hunt description, README badges, and SEO meta tags.

**Acceptance Criteria:**
- [ ] Can generate landing page sections (hero, features, pricing, FAQ)
- [ ] Can generate social media posts (Twitter thread, LinkedIn post)
- [ ] Can generate Product Hunt description and tagline
- [ ] Can suggest README badges (build, coverage, license, downloads)
- [ ] Can generate SEO-optimized meta descriptions and Open Graph tags
- [ ] User can specify tone (professional, casual, technical, playful)
- [ ] Generated content is under 500 words per section (landing page) or character limits (social)

**User Flow:**
1. User says "Create marketing content for my app"
2. AI asks: "What problem does it solve? Who is it for? Any special features?"
3. User provides context → AI generates landing page copy
4. User reviews sections → can regenerate individual sections
5. User exports HTML or copies to clipboard

**Business Rules:**
- Marketing content should reference actual features from code analysis
- Tone should match project type (B2B tools = professional, indie games = playful)
- Social posts must respect platform character limits (Twitter 280 chars)

**Data Needed:**
- Project description
- Feature list (from code or user input)
- Target audience
- Unique value proposition

**Edge Cases:**
- Highly technical project → AI asks for simplified explanation
- No clear user-facing features → Focus on developer benefits
- Multiple marketing channels requested → Generate all at once or one-by-one

---

### Feature 6: Deployment Guide & Config Generator

**Priority:** MEDIUM

**User Story:**
> As a developer ready to deploy, I want step-by-step deployment instructions and generated config files, so that I can ship to production without infrastructure headaches.

**Description:** Wizard that detects project type and suggests appropriate deployment platforms (Vercel for Next.js, Railway for Node.js, Docker for self-hosting). Generates config files (vercel.json, Dockerfile, GitHub Actions workflow) and provides terminal commands.

**Acceptance Criteria:**
- [ ] Detects project type and suggests best deployment platform
- [ ] Generates Vercel config with correct build commands
- [ ] Generates Dockerfile with multi-stage build for Node.js projects
- [ ] Generates GitHub Actions CI/CD workflow (test → deploy)
- [ ] Generates Railway config (railway.json)
- [ ] Provides step-by-step CLI instructions
- [ ] Warns about missing environment variables
- [ ] Estimates monthly costs for each platform

**User Flow:**
1. User says "How do I deploy this?"
2. AI recommends Vercel → explains why (Next.js detected, free tier available)
3. Wizard shows steps: "Install Vercel CLI → Run vercel → Set env vars"
4. User clicks "Generate configs" → sees vercel.json preview
5. User confirms → files written to project

**Business Rules:**
- Dockerfile should follow Node.js best practices (non-root user, multi-stage build)
- CI/CD workflow should run tests before deploying
- Platform recommendations prioritize free tiers for side projects

**Data Needed:**
- Project framework (Next.js, Express, etc.)
- Dependencies (to determine runtime)
- Environment variables (from .env.example)

**Edge Cases:**
- Multiple deployment options viable → Present all with pros/cons
- Missing .env.example → Prompt user to specify env vars
- Monorepo → Ask which package to deploy

---

## User Workflows

### Workflow 1: First-Time User Journey (End-to-End)

**Trigger:** User lands on ShipLab homepage for the first time

**Steps:**
1. User: Clicks "Get Started" → System: Shows upload modal
2. User: Drags project folder → System: Analyzes and opens chat
3. User: Asks "What should I do first?" → System: Suggests code quality check
4. User: Agrees → System: Runs analysis, shows results with 42 issues
5. User: Clicks "Explain this error" → System: AI explains in plain terms
6. User: Applies auto-fix for 20 issues → System: Updates code
7. User: Asks "Can you write a README?" → System: Generates README
8. User: Reviews and saves README → System: Writes file
9. User: Asks "Help me choose a license" → System: Opens wizard
10. User: Selects MIT license → System: Creates LICENSE file
11. User: Asks "How do I deploy?" → System: Suggests Vercel, generates config
12. Success: User has improved code, documentation, license, and deployment instructions in one session

**Error Paths:**
- If project upload fails → Show error with supported file types
- If analysis finds no issues → Congratulate and move to next step
- If AI request fails → Fall back to cached response or show retry button

---

### Workflow 2: Returning User (Iterate on Existing Project)

**Trigger:** User selects an existing project from dashboard

**Steps:**
1. User: Opens project → System: Loads chat history and previous results
2. User: Asks "What changed since last time?" → System: Diffs code, reports changes
3. User: Says "Re-run code quality" → System: Runs incremental analysis
4. User: Reviews new issues → System: Highlights new issues vs. old ones
5. User: Updates documentation → System: Regenerates README with new info
6. Success: User keeps project documentation and analysis up-to-date

**Error Paths:**
- If project path no longer exists → Prompt to reconnect or remove
- If no changes detected → Inform user, offer manual refresh

---

### Workflow 3: Quick Export (No Chat)

**Trigger:** User wants to generate specific output without conversation

**Steps:**
1. User: Selects project → clicks "Quick Actions" dropdown
2. User: Clicks "Generate README" → System: Skips chat, generates immediately
3. User: Downloads README.md → System: Provides download link
4. Success: User gets output in one click without interactive flow

**Error Paths:**
- If insufficient context → Prompt for required info before generating

---

## Non-Functional Requirements

**Performance:**
- Initial project analysis: < 10 seconds for projects under 10,000 lines
- AI chat response time: < 3 seconds (streaming starts within 500ms)
- Code quality analysis: < 30 seconds for medium projects
- Document generation: < 15 seconds

**Security:**
- All uploaded projects stored locally or encrypted in cloud storage
- API keys never logged or exposed in responses
- Git credentials never stored (user provides read-only URLs or tokens)
- LLM prompts sanitized to prevent prompt injection

**Scalability:**
- Support projects up to 500MB in size
- Handle 100 concurrent users (cloud deployment)
- Local deployment should work on 8GB RAM machines

**Accessibility:**
- WCAG 2.1 AA compliance
- Keyboard navigation for all features
- Screen reader compatible
- High contrast mode available

---

## Business Rules

### Rule: Incremental Analysis
**When:** User runs analysis on previously analyzed project  
**Then:** Only re-analyze changed files (based on Git diff or file timestamps)  
**Why:** Saves time and LLM tokens, improves user experience

### Rule: LLM Cost Tracking
**When:** User makes LLM API call (OpenRouter)  
**Then:** Log token usage and estimated cost  
**Why:** Prevent bill shock, enforce usage limits on free tier

### Rule: Local-First Data
**When:** User works on local project  
**Then:** All data stays on user's machine, no cloud uploads unless explicitly requested  
**Why:** Privacy, speed, works offline

### Rule: Git Integration
**When:** User makes changes via ShipLab (auto-fix, generate docs)  
**Then:** Changes are written to disk but not automatically committed  
**Why:** User maintains control over Git history

---

## Integrations

### Ollama (Local LLM)
**Purpose:** Provide free, private AI inference  
**Type:** API (HTTP REST)  
**Data:** Project code, user messages, generated content

### OpenRouter (Cloud LLM)
**Purpose:** Access to cost-effective cloud models (GLM-4.6, MiniMax M2)  
**Type:** API (OpenAI-compatible)  
**Data:** Same as Ollama, but sent to cloud

### ESLint
**Purpose:** JavaScript/TypeScript linting  
**Type:** Node.js library (programmatic)  
**Data:** Code files, configuration

### Semgrep
**Purpose:** Multi-language security scanning  
**Type:** CLI (subprocess)  
**Data:** Code files, rule definitions

### tree-sitter
**Purpose:** Parse code structure for multiple languages  
**Type:** Node.js library (WASM)  
**Data:** Source code files

---

## Scope

**In Scope (MVP):**
- Code quality analysis (ESLint, Semgrep)
- Documentation generation (README, API docs)
- Licensing assistant (SPDX licenses)
- Marketing content generator (landing pages, social posts)
- Deployment guide (Vercel, Docker, Railway)
- Local and cloud LLM support
- Project dashboard (manage multiple projects)
- Chat interface with context-aware AI

**Future Phases:**
- Phase 2 (Month 2-3): Team collaboration features, Git integration for auto-commit, custom rule sets
- Phase 3 (Month 4-6): Visual deployment dashboards, cost analytics, automated release notes
- Phase 4 (Month 7+): Mobile app, browser extension, CI/CD plugin

**Out of Scope:**
- Code generation (ShipLab is for post-production, not writing code)
- Project management (Jira/Trello competitor)
- Hosting services (we guide deployment, not host)
- Team communication (Slack/Discord competitor)

---

## Open Questions

1. **Should we support monorepos in MVP?** - Decision by December 1, 2025
   - Impact: Adds complexity to analysis (which package to analyze?)
   - Alternative: Start with single projects, add monorepo support in Phase 2

2. **What's the free tier usage limit for OpenRouter calls?** - Decision by November 25, 2025
   - Impact: Affects cost per user and conversion to paid plans
   - Suggestion: 50 AI requests per month free, then prompt upgrade

3. **Should generated docs be auto-committed to Git?** - Decision by December 5, 2025
   - Impact: User control vs. convenience trade-off
   - Suggestion: Offer as opt-in feature, default to manual commit

---

**Last Updated:** November 18, 2025
