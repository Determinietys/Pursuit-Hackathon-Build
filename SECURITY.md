# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

Please report security vulnerabilities to: security@snowclear.example.com

Do not open public GitHub issues for security vulnerabilities.

## Security Tools

This project uses the following security tools:

### SAST (Static Application Security Testing)
- **Semgrep**: Code pattern analysis
- **ESLint**: Code quality and security linting
- **npm audit**: Dependency vulnerability scanning

### DAST (Dynamic Application Security Testing)
- **OWASP ZAP**: Automated security testing (in CI/CD)

### Dependency Scanning
- **Snyk**: Continuous dependency vulnerability monitoring
- **npm audit**: Built-in npm vulnerability scanning

### RASP (Runtime Application Self-Protection)
- **Recommended**: Consider implementing RASP solution for production
  - Options: Sqreen, Contrast Security, or Imperva
  - Provides runtime protection against attacks

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Keep dependencies updated** - Run `npm audit` regularly
3. **Use HTTPS** - Always in production
4. **Validate all inputs** - Use Zod or similar
5. **Rate limiting** - Implement on API routes
6. **CSRF protection** - Enabled via NextAuth
7. **SQL injection** - Protected by Prisma ORM
8. **XSS protection** - React escapes by default

## Vulnerability Disclosure Process

1. Report vulnerability via email
2. We will acknowledge within 48 hours
3. We will provide a timeline for fix
4. We will notify when fix is available
5. Public disclosure after fix is deployed

