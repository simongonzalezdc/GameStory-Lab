# Contributing to GameForge Studio

Thank you for your interest in contributing to GameForge Studio! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [GitHub Issues](https://github.com/yourusername/gameforge-studio/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, Docker version)
   - Screenshots/logs if applicable

### Suggesting Features

1. Check existing feature requests in [GitHub Issues](https://github.com/yourusername/gameforge-studio/issues)
2. Create a new issue with:
   - Clear description of the feature
   - Use case and motivation
   - Proposed implementation (if you have ideas)
   - Priority level (nice-to-have vs critical)

### Contributing Code

#### Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/gameforge-studio.git`
3. Install dependencies: `npm install`
4. Set up environment: `cp .env.example .env` (fill in your API keys)
5. Start services: `docker-compose up -d`
6. Run migrations: `cd packages/backend && npx prisma migrate dev`
7. Start dev servers: `npm run dev` (from root)

#### Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Write/update tests
4. Run tests: `npm test`
5. Run linter: `npm run lint`
6. Format code: `npm run format`
7. Commit with clear messages: `git commit -m "feat: add new validation rule"`
8. Push to your fork: `git push origin feature/your-feature-name`
9. Open a Pull Request

#### Code Style

- **TypeScript**: Use strict mode, avoid `any` types
- **Formatting**: Prettier is configured - run `npm run format` before committing
- **Linting**: ESLint is configured - fix all linting errors
- **Naming**: Use descriptive names, follow TypeScript conventions
- **Comments**: Add JSDoc comments for public APIs

#### Testing

- Write tests for new features
- Update tests when modifying existing features
- Aim for 80%+ code coverage
- Run tests before submitting PR: `npm test`

#### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding/updating tests
- `chore:` Maintenance tasks

Examples:
- `feat(validation): add new mechanics-lore alignment rule`
- `fix(generate): handle malformed AI responses gracefully`
- `docs(readme): update installation instructions`

### Contributing Validation Rules

Validation rules are a great way to contribute! See `packages/backend/src/services/validation/rules/` for examples.

1. Create a new rule file: `packages/backend/src/services/validation/rules/your-rule-name.ts`
2. Export a function: `export async function validateYourRule(mechanics, lore, genre?)`
3. Return `ValidationIssue | null`
4. Register in `packages/backend/src/services/validation/engine.ts`
5. Add tests in `packages/backend/src/services/validation/rules/your-rule-name.test.ts`

### Pull Request Process

1. Ensure all tests pass
2. Ensure linting passes
3. Update documentation if needed
4. Add changelog entry if applicable
5. Request review from maintainers
6. Address review feedback
7. Once approved, maintainers will merge

### Questions?

- Open a [GitHub Discussion](https://github.com/yourusername/gameforge-studio/discussions)
- Join our [Discord server](https://discord.gg/your-invite-link)
- Check existing documentation in `Dev Docs/`

Thank you for contributing! 🎮✨

<!-- EMPOWER_ORCHESTRATOR:START -->
## Agent-law contribution rule

This repository follows the Empower Orchestrator law in `docs/agent-law/empower-orchestrator.md`.

If a change exposes a repeated task or repeated agent failure, contributors and agents should either ship the smallest durable prevention artifact or explain why this PR is intentionally one-off.

Automation and durable system changes require the scale/severity/reversibility/predictability blast-radius check before dispatch.
<!-- EMPOWER_ORCHESTRATOR:END -->
