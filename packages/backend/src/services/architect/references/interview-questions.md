# AI Project Architect - Interview Questions
**Token-optimized reference for gathering project requirements**

## Phase 1: Quick Discovery (5 Questions)
Ask these first to determine scope:

1. **Project basics**: Name, one-sentence description, problem it solves
2. **Project type**: Web app, API, CLI, desktop, mobile, or combination?
3. **Tech stack**: Preferred languages/frameworks, or need recommendations?
4. **Key features**: Top 3-5 must-have MVP features
5. **Constraints**: Timeline, budget, integrations, existing code

## Phase 2: Targeted Deep Dive
Based on Phase 1 answers, ask only relevant sections below (3-5 questions per category):

### For ALL Projects
**Core Functionality**
- Primary user workflow (step-by-step)
- Data model: What's stored, relationships, volume
- Authentication/authorization requirements
- Integrations: APIs, services, third-party tools

**Technical Preferences**
- Architecture: Monolith vs microservices, client-server vs serverless
- Database: Type, scale, real-time needs
- Deployment: Platform, frequency, environments (dev/staging/prod)
- AI agent: Claude Code/Cursor/Kilocode, file structure preferences

**Quality & Operations**
- Testing: Strategy (unit/integration/e2e), coverage goals
- Security: Compliance (GDPR/HIPAA/SOC2), encryption, audits
- Performance: Expected load, response times, scaling approach
- Monitoring: Logging, error tracking, analytics

### Web App Specifics (if applicable)
- Frontend: Framework (React/Vue/Svelte), responsive needs, PWA features
- Backend: Framework (Node/Python/Go), serverless options
- Hosting: Platform preference (Vercel/Netlify/AWS)

### API Specifics (if applicable)
- Protocol: REST, GraphQL, or gRPC
- Versioning, rate limiting, documentation format (OpenAPI)

### CLI Specifics (if applicable)
- Platform: Cross-platform or specific OS
- Distribution: npm/pip/homebrew/binary
- Interface: Interactive vs flags-only

### Desktop App Specifics (if applicable)
- Framework: Electron/Tauri/native
- Target OS, auto-updates, system integration

### Mobile App Specifics (if applicable)
- Platform: iOS/Android/both
- Native vs cross-platform (React Native/Flutter)
- Device features: Camera, GPS, notifications, offline mode

## Interview Tips
- **Ask 3-5 questions at a time** (ADHD-friendly)
- **Offer smart defaults** when user is uncertain
- **Clarify immediately** when answers are vague
- **Summarize decisions** every 5-7 questions
- **Skip irrelevant sections** based on project type
