# Security Policy

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these steps:

### 1. **Do NOT** create a public GitHub issue

Security vulnerabilities should be reported privately to prevent exploitation.

### 2. Email the security team

Send an email to **security@gameforge-studio.com** with:

- **Subject**: `[SECURITY] Brief description of the vulnerability`
- **Description**: Detailed explanation of the vulnerability
- **Steps to reproduce**: Clear steps to reproduce the issue
- **Impact**: Potential impact of the vulnerability
- **Suggested fix**: If you have ideas for a fix (optional)

### 3. Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 7 days
- **Fix timeline**: Depends on severity (see below)

### 4. Disclosure Policy

We follow a **90-day disclosure policy**:

- Vulnerabilities will be disclosed 90 days after initial report
- If a fix is in progress, disclosure may be delayed with mutual agreement
- We will credit you in the security advisory (unless you prefer to remain anonymous)

### 5. Severity Levels

| Severity | Response Time | Fix Timeline |
|----------|---------------|--------------|
| **Critical** | 24 hours | 7 days |
| **High** | 48 hours | 14 days |
| **Medium** | 7 days | 30 days |
| **Low** | 14 days | 90 days |

### 6. What to Report

Please report:

- SQL injection vulnerabilities
- Cross-site scripting (XSS)
- Authentication/authorization bypasses
- Remote code execution
- Sensitive data exposure
- API security issues
- Dependency vulnerabilities with known exploits

### 7. What NOT to Report

Please do NOT report:

- Issues requiring physical access to the server
- Issues requiring social engineering
- Denial of service (DoS) attacks
- Missing security headers (unless exploitable)
- Self-XSS
- Issues in dependencies without known exploits (report to dependency maintainers)

### 8. Safe Harbor

We will not pursue legal action against security researchers who:

- Act in good faith
- Do not access or modify data beyond what is necessary
- Do not disrupt our services
- Report vulnerabilities promptly
- Do not publicly disclose before we've addressed the issue

### 9. Recognition

Security researchers who report valid vulnerabilities will be:

- Credited in our security advisories (if desired)
- Added to our security hall of fame
- Eligible for swag/recognition (for significant findings)

Thank you for helping keep GameForge Studio secure! 🔒

