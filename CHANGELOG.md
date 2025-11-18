# Changelog

All notable changes to ShipLab will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-18

### Added - Phase 1 MVP Complete! 🚀

#### Week 1: Foundation
- **Next.js 16.0.3** app with TypeScript and Tailwind CSS
- **SQLite database** with Drizzle ORM and lazy initialization
- **LLM Router** supporting Ollama (local) and OpenRouter (cloud)
- **AI Chat Interface** with real-time streaming responses
- **Project Dashboard** for managing multiple projects
- **API routes** for projects and chat functionality

#### Week 2-3: Core Analysis & Documentation
- **Code Quality Analysis**
  - ESLint 9 integration with programmatic API
  - Semgrep security scanning (optional, graceful fallback)
  - Severity filtering and tool-based filtering
  - Issue cards with file paths and line numbers
- **Documentation Generators**
  - AI-powered README generation
  - API documentation generator (Next.js + Express support)
  - Zod schema parameter extraction
  - Markdown formatting with code examples
- **Dashboard Integration**
  - Tabbed interface for Chat, Quality, and Docs
  - Quick action buttons in sidebar
  - Results display with copy functionality

#### Week 4: Marketing, Deployment & Licensing
- **Marketing Content Generator**
  - Landing page content (headline, hero, features, CTA)
  - Twitter/X post variations
  - LinkedIn professional announcements
  - Product Hunt launch kit (tagline, description, features)
  - Interactive UI with copy/download
- **Deployment Config Generator**
  - Vercel configuration (vercel.json)
  - Docker setup (Dockerfile, docker-compose.yml, .dockerignore)
  - Railway configuration (railway.json)
  - Environment variable templates (.env.example)
  - Platform-specific deployment instructions
  - AI-enhanced deployment guides
- **License Assistant**
  - 8 popular open source licenses (MIT, Apache 2.0, GPL-3.0, AGPL-3.0, BSD-3, LGPL-3.0, MPL-2.0, Unlicense)
  - AI-powered license recommendations
  - Interactive questionnaire for license selection
  - License comparison tool
  - Automatic LICENSE file generation with copyright
  - Detailed permissions, conditions, and limitations
- **UI Components**
  - Badge, Tabs, RadioGroup, Label, Input components
  - Marketing content tabbed interface
  - Deployment configs with platform switcher
  - License selector with assistant mode

#### Week 5: Testing, Error Handling & Polish
- **Testing Infrastructure**
  - Vitest setup with React Testing Library
  - Test coverage reporting with v8 provider
  - Global test configuration and cleanup
  - Comprehensive testing guide (README_TESTING.md)
- **Unit Tests**
  - 18 tests passing (100% pass rate)
  - Licensing generator tests (12 tests)
  - Marketing generator tests (6 tests)
  - AI mocking for predictable tests
- **Error Handling**
  - ErrorBoundary component with retry functionality
  - Graceful error fallback UI
  - Detailed error logging with stack traces
  - User-friendly error messages
- **Toast Notifications**
  - Toast system using Radix UI
  - useToast hook for global management
  - Success notifications for all operations
  - Error notifications replacing alert() dialogs
  - Non-blocking, dismissible notifications
- **UX Improvements**
  - Replaced all alert() calls with toasts
  - Better feedback for all generator operations
  - Proper error messages with context
  - Loading states throughout the app

#### Week 6: Beta Launch Preparation
- **Onboarding Flow**
  - Welcome screen with multi-step tutorial
  - Feature showcase with key capabilities
  - Getting started guide (3 simple steps)
  - Interactive step indicators
  - Skip and complete functionality
  - localStorage-based completion tracking
- **Production Deployment**
  - Comprehensive PRODUCTION.md guide
  - Vercel, Docker, Railway, and VPS instructions
  - Environment variable documentation
  - Database setup and migration guides
  - AI services configuration (Ollama + OpenRouter)
  - Performance optimization tips
  - Monitoring and logging setup
  - Security checklist
  - Backup and rollback procedures
  - Scaling strategies
  - Troubleshooting guide
- **Documentation**
  - CHANGELOG.md for version tracking
  - Production deployment guide
  - Testing documentation
  - API documentation
- **Dialog Component**
  - Radix UI dialog primitives
  - Responsive modal system
  - Portal-based rendering
  - Keyboard navigation support

### Dependencies

#### Production
- next@16.0.3
- react@19.2.0
- typescript@5.6.0
- tailwindcss@3.4.18
- drizzle-orm@0.38.0
- better-sqlite3@11.8.0
- ai@5.0.93
- ollama@0.5.12
- openai@6.9.1
- lucide-react@0.468.0
- @radix-ui/* (multiple packages)
- zod@3.24.1
- fast-glob@3.3.3
- eslint@9.16.0
- react-markdown@10.1.0

#### Development
- vitest@4.0.10
- @testing-library/react@16.3.0
- @testing-library/jest-dom@6.9.1
- @vitejs/plugin-react@5.1.1
- drizzle-kit@0.28.1
- prettier@3.4.2

### Technical Highlights

- **Modern Stack**: Next.js 16, React 19, TypeScript 5.6
- **Type Safety**: Full TypeScript coverage with strict mode
- **Database**: SQLite with Drizzle ORM and type-safe queries
- **AI Integration**: Dual LLM support (local + cloud)
- **Testing**: Comprehensive test suite with Vitest
- **Error Handling**: Error boundaries and graceful degradation
- **Performance**: Lazy loading, code splitting, optimized builds
- **UX**: Toast notifications, loading states, error messages
- **Accessibility**: Radix UI primitives with ARIA support

### Breaking Changes

None - this is the initial release.

### Fixed

- ESLint 9 API migration (removed deprecated `useEslintrc`)
- Ollama import fix (changed to named import)
- Next.js 16 config update (removed deprecated `eslint` option)
- Fast-glob import fix (default import instead of named)
- Database lazy initialization to prevent build-time errors
- Tailwind CSS v3 compatibility (downgraded from v4)
- Google Fonts build errors (switched to system fonts)
- Mock setup for fs module in tests
- Error boundaries for crash prevention

### Known Issues

- Semgrep requires manual installation (optional feature)
- SQLite not suitable for multi-user concurrent access (use PostgreSQL for production scaling)
- Ollama requires local installation or Docker container

### Migration Guide

Not applicable - this is the initial release.

## [Unreleased]

### Planned for Phase 2

- **User Authentication** - Multi-user support with auth
- **Team Collaboration** - Share projects with team members
- **Cloud Database** - PostgreSQL/MySQL support
- **Advanced AI Features** - More LLM integrations
- **CI/CD Integration** - GitHub Actions, GitLab CI
- **Plugin System** - Extensible architecture
- **Analytics Dashboard** - Usage metrics and insights
- **API Rate Limiting** - Production-ready API protection
- **Caching Layer** - Redis integration
- **Webhooks** - Event-driven integrations

---

## Version History

- **1.0.0** (2025-11-18) - Initial MVP Release
  - Phase 1 complete: Foundation, Analysis, Marketing, Deployment, Licensing, Testing, Launch Prep
  - 18 tests passing
  - Production-ready
  - Full documentation

## Release Notes Format

Each release includes:
- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be-removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security fixes

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Reporting bugs
- Suggesting features
- Submitting pull requests
- Development workflow

## Support

- **Documentation**: See README.md and docs/
- **Issues**: GitHub Issues
- **Questions**: GitHub Discussions

---

**Maintained by**: ShipLab Team
**License**: MIT
**Repository**: https://github.com/yourusername/shiplab
