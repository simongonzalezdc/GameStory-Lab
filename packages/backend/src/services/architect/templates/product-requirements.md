# {{PROJECT_NAME}} - Product Requirements

**Purpose:** Defines WHAT to build  
**Generated:** {{DATE}}

---

## Project Overview

### Vision
{{PROJECT_VISION}}

### Problem Statement
{{PROBLEM_DESCRIPTION}}

**Current state:** {{CURRENT_STATE}}

**Desired state:** {{DESIRED_STATE}}

### Target Users
**Primary:** {{PRIMARY_USERS}}

**Secondary:** {{SECONDARY_USERS}}

### Success Metrics
{{SUCCESS_METRICS}}

---

## Core Features (MVP)

### Feature 1: {{FEATURE_NAME}}

**Priority:** {{CRITICAL|HIGH|MEDIUM}}

**User Story:**
> As a {{USER_TYPE}}, I want to {{ACTION}}, so that {{BENEFIT}}.

**Description:** {{DETAILED_DESCRIPTION}}

**Acceptance Criteria:**
- [ ] {{CRITERION}}
- [ ] {{CRITERION}}
- [ ] {{CRITERION}}

**User Flow:**
1. {{STEP}}
2. {{STEP}}
3. {{STEP}}

**Business Rules:**
- {{RULE}}

**Data Needed:**
- {{DATA}}

**Edge Cases:**
- {{CASE}} → {{BEHAVIOR}}

---

### Feature 2: {{FEATURE_NAME}}

{{REPEAT_FOR_ALL_MVP_FEATURES}}

---

## User Workflows

### Workflow 1: {{WORKFLOW_NAME}}

**Trigger:** {{WHAT_STARTS_THIS}}

**Steps:**
1. User: {{ACTION}} → System: {{RESPONSE}}
2. User: {{ACTION}} → System: {{RESPONSE}}
3. Success: {{OUTCOME}}

**Error Paths:**
- If {{ERROR}}, then {{BEHAVIOR}}

---

### Workflow 2: {{WORKFLOW_NAME}}

{{REPEAT_FOR_EACH_WORKFLOW}}

---

## Non-Functional Requirements

**Performance:**
- {{METRIC}}: < {{TARGET}}

**Security:**
- {{REQUIREMENT}}

**Scalability:**
- {{REQUIREMENT}}

**Accessibility:**
- {{STANDARD_COMPLIANCE}}

---

## Business Rules

### {{RULE_NAME}}
**When:** {{CONDITION}}  
**Then:** {{BEHAVIOR}}  
**Why:** {{RATIONALE}}

---

## Integrations

{{#IF_HAS_INTEGRATIONS}}
### {{SERVICE_NAME}}
**Purpose:** {{WHY}}  
**Type:** {{API|WEBHOOK|SDK}}  
**Data:** {{WHAT_DATA}}
{{/IF_HAS_INTEGRATIONS}}

{{#IF_NO_INTEGRATIONS}}
*No external integrations*
{{/IF_NO_INTEGRATIONS}}

---

## Scope

**In Scope (MVP):**
- {{FEATURE}}

**Future Phases:**
- {{FEATURE}} - {{WHEN}}

**Out of Scope:**
- {{FEATURE}} - {{WHY}}

---

## Open Questions

{{#IF_HAS_QUESTIONS}}
1. **{{QUESTION}}** - Decision by {{DATE}}
{{/IF_HAS_QUESTIONS}}

{{#IF_NO_QUESTIONS}}
*All requirements defined*
{{/IF_NO_QUESTIONS}}

---

**Last Updated:** {{DATE}}
