# {{PROJECT_NAME}} - Technical Specification

**FOR AI CODING AGENT:** This is your primary implementation guide.  
**Generated:** {{DATE}}  
**Version:** {{VERSION}}

---

## System Architecture

### High-Level Overview
{{ARCHITECTURE_DESCRIPTION}}

### Component Diagram
```
{{COMPONENT_DIAGRAM_ASCII}}
```

### Data Flow
{{DATA_FLOW_DESCRIPTION}}

---

## Tech Stack

### Frontend
- **Framework:** {{FRAMEWORK}}
- **Version:** {{VERSION}}
- **Key Libraries:** {{LIST_LIBRARIES}}
- **Styling:** {{CSS_APPROACH}}
- **State Management:** {{STATE_MGMT}}

### Backend
- **Framework:** {{FRAMEWORK}}
- **Version:** {{VERSION}}
- **Language:** {{LANGUAGE}}
- **Runtime:** {{RUNTIME}}
- **Key Libraries:** {{LIST_LIBRARIES}}

### Database
{{#IF_HAS_DATABASE}}
- **Type:** {{DATABASE_TYPE}}
- **Version:** {{VERSION}}
- **ORM/Query Builder:** {{ORM}}
- **Migration Tool:** {{MIGRATION_TOOL}}
{{/IF_HAS_DATABASE}}

{{#IF_NO_DATABASE}}
- **No database required** - Using {{STORAGE_METHOD}}
{{/IF_NO_DATABASE}}

### Infrastructure
- **Hosting:** {{HOSTING_PLATFORM}}
- **CI/CD:** {{CI_CD_TOOL}}
- **Package Manager:** {{PKG_MANAGER}}
- **Build Tool:** {{BUILD_TOOL}}

---

## Project Structure

```
{{PROJECT_NAME}}/
├── {{DIRECTORY_STRUCTURE}}
```

### File Organization Principles
{{FILE_ORG_RULES}}

---

## Database Schema

{{#IF_HAS_DATABASE}}

### Tables & Relationships

#### {{TABLE_NAME_1}}
```sql
CREATE TABLE {{TABLE_NAME}} (
  {{FIELD_DEFINITIONS}}
);
```

**Purpose:** {{TABLE_PURPOSE}}

**Relationships:**
- {{RELATIONSHIP_DESCRIPTION}}

**Indexes:**
```sql
{{INDEX_DEFINITIONS}}
```

#### {{TABLE_NAME_2}}
{{REPEAT_PATTERN}}

### Data Models

```{{LANGUAGE}}
{{DATA_MODEL_DEFINITION}}
```

### Migration Strategy
{{MIGRATION_APPROACH}}

{{/IF_HAS_DATABASE}}

{{#IF_NO_DATABASE}}
*No database schema - using {{STORAGE_METHOD}}*
{{/IF_NO_DATABASE}}

---

## API Specification

{{#IF_HAS_API}}

### Authentication
**Method:** {{AUTH_METHOD}}

**Headers Required:**
```
{{AUTH_HEADERS}}
```

### Endpoints

#### {{ENDPOINT_NAME_1}}
**Method:** {{HTTP_METHOD}}  
**Path:** `{{API_PATH}}`

**Purpose:** {{ENDPOINT_PURPOSE}}

**Request:**
```json
{{REQUEST_SCHEMA}}
```

**Response:**
```json
{{RESPONSE_SCHEMA}}
```

**Validation Rules:**
{{VALIDATION_RULES}}

**Error Handling:**
{{ERROR_HANDLING}}

#### {{ENDPOINT_NAME_2}}
{{REPEAT_PATTERN}}

### Rate Limiting
{{RATE_LIMIT_STRATEGY}}

### Versioning
{{API_VERSION_STRATEGY}}

{{/IF_HAS_API}}

{{#IF_NO_API}}
*No API endpoints - {{PROJECT_TYPE}} does not require REST API*
{{/IF_NO_API}}

---

## Testing Strategy

### Test Coverage Goals
- **Unit tests:** {{COVERAGE_TARGET}}%
- **Integration tests:** {{COVERAGE_TARGET}}%
- **E2E tests:** {{COVERAGE_TARGET}}%

### Testing Frameworks
- **Unit:** {{UNIT_TEST_FRAMEWORK}}
- **Integration:** {{INTEGRATION_TEST_FRAMEWORK}}
- **E2E:** {{E2E_TEST_FRAMEWORK}}

### Required Tests

**For every feature:**
1. Happy path test
2. Error handling test  
3. Edge case tests
4. {{ADDITIONAL_TEST_TYPES}}

**Test file naming:** `{{NAMING_CONVENTION}}`

**Example test structure:**
```{{LANGUAGE}}
{{TEST_EXAMPLE}}
```

### Running Tests
```bash
# Run all tests
{{TEST_COMMAND}}

# Run with coverage
{{COVERAGE_COMMAND}}

# Run specific test
{{SPECIFIC_TEST_COMMAND}}
```

---

## Code Style & Standards

### Formatting
- **Tool:** {{FORMATTER}}
- **Config:** {{CONFIG_FILE}}
- **Run:** `{{FORMAT_COMMAND}}`

### Linting
- **Tool:** {{LINTER}}
- **Config:** {{CONFIG_FILE}}
- **Run:** `{{LINT_COMMAND}}`

### Naming Conventions
- **Variables:** {{NAMING_STYLE}}
- **Functions:** {{NAMING_STYLE}}
- **Classes:** {{NAMING_STYLE}}
- **Files:** {{NAMING_STYLE}}
- **Directories:** {{NAMING_STYLE}}

### Code Patterns

**Preferred:**
```{{LANGUAGE}}
{{GOOD_PATTERN_EXAMPLE}}
```

**Avoid:**
```{{LANGUAGE}}
{{BAD_PATTERN_EXAMPLE}}
```

### Comments & Documentation
{{COMMENT_REQUIREMENTS}}

---

## Implementation Order

### Phase 1: Foundation
**Priority:** CRITICAL  
**Duration:** {{DURATION}}

1. **{{TASK}}** - {{DESCRIPTION}}
   - Files to create: {{FILES}}
   - Dependencies: {{DEPS}}
   - Tests required: {{TESTS}}

2. **{{TASK}}** - {{DESCRIPTION}}
   - Files to create: {{FILES}}
   - Dependencies: {{DEPS}}
   - Tests required: {{TESTS}}

### Phase 2: Core Features
**Priority:** HIGH  
**Duration:** {{DURATION}}

{{REPEAT_PATTERN}}

### Phase 3: Enhancement
**Priority:** MEDIUM  
**Duration:** {{DURATION}}

{{REPEAT_PATTERN}}

---

## AI Agent Instructions

### Setup Commands
```bash
# Initial setup
{{SETUP_COMMAND_1}}
{{SETUP_COMMAND_2}}

# Install dependencies
{{INSTALL_COMMAND}}

# Run dev server
{{DEV_COMMAND}}
```

### Development Workflow

**For each new feature:**
1. Create feature branch: `git checkout -b feature/{{FEATURE_NAME}}`
2. Implement in this order:
   - Data models (if needed)
   - Business logic
   - API endpoints (if needed)
   - Frontend components (if needed)
   - Tests (REQUIRED)
3. Run tests: `{{TEST_COMMAND}}`
4. Format code: `{{FORMAT_COMMAND}}`
5. Lint: `{{LINT_COMMAND}}`
6. Commit: `git commit -m "{{COMMIT_FORMAT}}"`

### File Creation Rules

**ALWAYS:**
- Create tests alongside implementation
- Follow project structure exactly
- Use established patterns
- Add proper error handling
- Include validation

**NEVER:**
- Skip tests
- Hardcode secrets/credentials
- Create files outside project structure
- Use deprecated dependencies
- Ignore linting errors

### Critical Files (Do NOT modify without asking)
{{PROTECTED_FILES}}

### Security Requirements
{{SECURITY_REQUIREMENTS}}

### Performance Requirements
{{PERFORMANCE_REQUIREMENTS}}

### Error Handling Pattern
```{{LANGUAGE}}
{{ERROR_HANDLING_EXAMPLE}}
```

---

## Environment Configuration

### Required Environment Variables
```bash
{{ENV_VAR_LIST}}
```

### Local Development Setup
```bash
# Copy template
cp .env.example .env

# Fill in values:
{{ENV_VAR_INSTRUCTIONS}}
```

### Environment-Specific Settings
{{ENV_SPECIFIC_SETTINGS}}

---

## Deployment

### Build Process
```bash
{{BUILD_COMMAND}}
```

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] No linting errors
- [ ] Environment variables configured
- [ ] {{ADDITIONAL_CHECKS}}

### Deployment Command
```bash
{{DEPLOY_COMMAND}}
```

### Rollback Procedure
{{ROLLBACK_INSTRUCTIONS}}

---

## Troubleshooting

### Common Issues

**Issue:** {{PROBLEM}}  
**Solution:** {{SOLUTION}}

**Issue:** {{PROBLEM}}  
**Solution:** {{SOLUTION}}

### Debugging Commands
```bash
{{DEBUG_COMMAND_1}}
{{DEBUG_COMMAND_2}}
```

---

## Dependencies

### Production Dependencies
```json
{{PROD_DEPENDENCIES}}
```

### Development Dependencies
```json
{{DEV_DEPENDENCIES}}
```

### Dependency Update Policy
{{UPDATE_POLICY}}

---

## Additional Resources

**Documentation:**
- {{LINK_TO_DOCS}}

**Tutorials:**
- {{LINK_TO_TUTORIALS}}

**Community:**
- {{LINK_TO_COMMUNITY}}

---

**This document is the single source of truth for implementation.**  
**All technical decisions, patterns, and requirements are defined here.**

**Last Updated:** {{DATE}}
