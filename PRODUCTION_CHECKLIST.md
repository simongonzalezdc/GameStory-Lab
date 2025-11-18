# Production Readiness Checklist

Use this checklist to ensure ShipLab is ready for production deployment.

## Pre-Deployment

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] Build succeeds without errors (`npm run build`)
- [ ] No TypeScript errors
- [ ] Code linted and formatted (`npm run lint` && `npm run format`)
- [ ] No console.log statements in production code
- [ ] Error boundaries implemented
- [ ] Loading states on all async operations

### Configuration
- [ ] Environment variables documented
- [ ] .env.example file up to date
- [ ] .gitignore includes sensitive files
- [ ] Production environment variables set
- [ ] Database URL configured for production
- [ ] API keys secured (not in code)

### Database
- [ ] Database migrations tested
- [ ] Backup strategy in place
- [ ] Database indexes optimized
- [ ] Connection pooling configured (if applicable)
- [ ] Data validation implemented

### Security
- [ ] API rate limiting implemented (if needed)
- [ ] CORS configured properly
- [ ] Environment variables not exposed to client
- [ ] SQL injection prevention (using ORM)
- [ ] XSS protection enabled
- [ ] HTTPS enforced (in production)
- [ ] Security headers configured
- [ ] Dependencies audited (`npm audit`)

### Performance
- [ ] Code splitting implemented
- [ ] Images optimized
- [ ] Lazy loading where appropriate
- [ ] Database queries optimized
- [ ] Caching strategy implemented
- [ ] Bundle size analyzed

### AI Services
- [ ] Ollama installed/configured (for local LLM)
- [ ] OpenRouter API key set (for cloud LLM)
- [ ] LLM models downloaded (`ollama pull smollm2:1.7b`)
- [ ] Fallback handling for AI failures
- [ ] Timeout configured for AI requests

### Monitoring & Logging
- [ ] Error logging configured (console/file/Sentry)
- [ ] Health check endpoint exists
- [ ] Monitoring dashboard set up (optional)
- [ ] Log rotation configured
- [ ] Performance monitoring enabled (optional)

## Deployment

### Platform Setup
- [ ] Hosting platform chosen (Vercel/Docker/Railway/VPS)
- [ ] Domain name configured (if applicable)
- [ ] SSL certificate installed
- [ ] DNS records updated
- [ ] CDN configured (if needed)

### Deployment Process
- [ ] Deployment script tested
- [ ] Environment variables set on platform
- [ ] Database accessible from application
- [ ] Build command configured correctly
- [ ] Start command configured correctly
- [ ] Port configuration correct

### Vercel Specific
- [ ] Project connected to Git repository
- [ ] Environment variables added to Vercel dashboard
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`
- [ ] Framework preset: Next.js
- [ ] Node.js version: 20.x

### Docker Specific
- [ ] Dockerfile tested locally
- [ ] Docker image builds successfully
- [ ] Container runs correctly
- [ ] Volume mounts configured
- [ ] Port mappings correct
- [ ] Environment variables passed to container
- [ ] Health checks configured

### Railway Specific
- [ ] railway.json configured
- [ ] Environment variables set via CLI or dashboard
- [ ] Build and start commands configured
- [ ] Resources allocated appropriately

### VPS Specific
- [ ] Node.js 20+ installed
- [ ] PM2 installed for process management
- [ ] Nginx configured as reverse proxy
- [ ] Firewall rules configured
- [ ] Auto-restart on failure configured
- [ ] System updates applied

## Post-Deployment

### Verification
- [ ] Application accessible at production URL
- [ ] All pages load correctly
- [ ] API endpoints responding
- [ ] Database connections working
- [ ] AI chat functional
- [ ] File uploads working (if applicable)
- [ ] Forms submitting correctly
- [ ] Authentication working (if applicable)

### Testing in Production
- [ ] Create a test project
- [ ] Run quality analysis
- [ ] Generate README
- [ ] Generate API docs
- [ ] Generate marketing content
- [ ] Generate deployment configs
- [ ] Use license assistant
- [ ] Test AI chat

### Monitoring
- [ ] Health check endpoint accessible
- [ ] Logs being generated
- [ ] Error tracking working
- [ ] Performance metrics available
- [ ] Alerts configured (if applicable)

### Documentation
- [ ] Production URL documented
- [ ] Access credentials documented (securely)
- [ ] Deployment process documented
- [ ] Rollback procedure documented
- [ ] Emergency contacts listed

## Maintenance Plan

### Daily
- [ ] Check error logs
- [ ] Monitor application health
- [ ] Review performance metrics

### Weekly
- [ ] Database backup verified
- [ ] Disk space checked
- [ ] Security logs reviewed
- [ ] Dependencies vulnerability scan

### Monthly
- [ ] Update dependencies
- [ ] Review and rotate logs
- [ ] Performance optimization review
- [ ] Security audit

### Quarterly
- [ ] Full security audit
- [ ] Disaster recovery test
- [ ] Capacity planning review
- [ ] Cost optimization review

## Emergency Procedures

### Application Down
1. Check health check endpoint
2. Review error logs
3. Check server resources (CPU, memory, disk)
4. Restart application
5. Check database connectivity
6. Review recent changes
7. Rollback if necessary

### Database Issues
1. Check database connectivity
2. Review database logs
3. Check disk space
4. Verify backup integrity
5. Restore from backup if needed

### Performance Degradation
1. Check server resources
2. Review slow queries
3. Check external service health (Ollama, OpenRouter)
4. Clear caches if applicable
5. Scale resources if needed

## Rollback Plan

### Quick Rollback
1. Identify last working version
2. Checkout previous commit/tag
3. Rebuild application
4. Redeploy
5. Verify functionality

### Database Rollback
1. Stop application
2. Restore database from backup
3. Run reverse migrations if needed
4. Restart application
5. Verify data integrity

## Support Contacts

- **Technical Issues**: [Your support email]
- **Infrastructure**: [Your ops team]
- **On-Call**: [Emergency contact]
- **Documentation**: README.md, PRODUCTION.md

## Sign-Off

- [ ] Development lead approved
- [ ] DevOps/Infrastructure approved
- [ ] Security review completed
- [ ] Stakeholder approval received

**Deployment Date**: _________________

**Deployed By**: _________________

**Version**: 1.0.0

**Notes**: _________________

---

## Additional Resources

- [README.md](README.md) - Project overview
- [PRODUCTION.md](PRODUCTION.md) - Detailed deployment guide
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [README_TESTING.md](README_TESTING.md) - Testing guide

## Version History

- **1.0.0** (2025-11-18) - Initial production release checklist
