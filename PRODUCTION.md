# ShipLab Production Deployment Guide

Complete guide for deploying ShipLab to production.

## Prerequisites

- Node.js 20+ installed
- Git configured
- Access to deployment platform (Vercel, Docker, or VPS)
- Environment variables configured

## Environment Variables

Create a `.env.production` file:

```env
# Database
DATABASE_URL=./production.db

# AI Services
OLLAMA_BASE_URL=http://localhost:11434
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=

# Optional: Error Tracking
SENTRY_DSN=

# Node Environment
NODE_ENV=production
```

### Required Variables

1. **DATABASE_URL**: Path to SQLite database or connection string
2. **OLLAMA_BASE_URL**: Ollama server URL (for local LLM)
3. **OPENROUTER_API_KEY**: API key for OpenRouter (for cloud LLM)

### Optional Variables

- **NEXT_PUBLIC_ANALYTICS_ID**: Analytics tracking ID
- **SENTRY_DSN**: Sentry error tracking DSN

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Login to Vercel

```bash
vercel login
```

#### 3. Deploy

```bash
# First deployment
vercel

# Production deployment
vercel --prod
```

####4. Configure Environment Variables

In Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add all required environment variables
3. Redeploy

#### Vercel Configuration

Create `vercel.json`:

```json
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Option 2: Docker

#### 1. Build Docker Image

```bash
docker build -t shiplab:latest .
```

#### 2. Run Container

```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=./production.db \
  -e OLLAMA_BASE_URL=http://host.docker.internal:11434 \
  -e OPENROUTER_API_KEY=your_key \
  --name shiplab \
  shiplab:latest
```

#### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  shiplab:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=./production.db
      - OLLAMA_BASE_URL=http://ollama:11434
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama
    restart: unless-stopped

volumes:
  ollama-data:
```

Run with:

```bash
docker-compose up -d
```

### Option 3: Railway

#### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

#### 2. Login and Initialize

```bash
railway login
railway init
```

#### 3. Configure Environment

```bash
railway variables set DATABASE_URL=./production.db
railway variables set OLLAMA_BASE_URL=your_ollama_url
railway variables set OPENROUTER_API_KEY=your_key
```

#### 4. Deploy

```bash
railway up
```

### Option 4: VPS/Self-Hosted

#### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2
```

#### 2. Clone and Build

```bash
git clone https://github.com/yourusername/shiplab.git
cd shiplab
npm install
npm run build
```

#### 3. Configure PM2

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'shiplab',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/shiplab',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: './production.db',
      OLLAMA_BASE_URL: 'http://localhost:11434',
      OPENROUTER_API_KEY: 'your_key'
    }
  }]
};
```

#### 4. Start with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 5. Configure Nginx (Optional)

Create `/etc/nginx/sites-available/shiplab`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/shiplab /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Database Setup

### SQLite (Default)

SQLite is the default database. It's stored as a file and doesn't require a separate server.

#### Production Considerations

- **Backups**: Regularly backup the database file
- **Volume Mounting**: When using Docker, mount the database directory
- **Permissions**: Ensure proper file permissions

```bash
# Backup SQLite database
cp production.db production.db.backup.$(date +%Y%m%d)

# Schedule daily backups with cron
0 2 * * * cp /path/to/production.db /path/to/backups/production.db.$(date +\%Y\%m\%d)
```

### Drizzle Migrations

Run migrations in production:

```bash
npm run db:push
```

Or use migration files:

```bash
npm run db:generate
npm run db:migrate
```

## AI Services Setup

### Ollama (Local LLM)

#### Install Ollama

```bash
# Linux/Mac
curl -fsSL https://ollama.ai/install.sh | sh

# Docker
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

#### Pull Required Models

```bash
ollama pull smollm2:1.7b
ollama pull llama3.2:3b
```

#### Verify Ollama

```bash
curl http://localhost:11434/api/version
```

### OpenRouter (Cloud LLM)

1. Sign up at https://openrouter.ai/
2. Get API key from dashboard
3. Add to environment variables

## Performance Optimization

### 1. Enable Caching

Next.js automatically caches static content. Ensure proper cache headers:

```typescript
// next.config.ts
export const config = {
  // ... other config
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/*'],
  },
};
```

### 2. Database Optimization

```sql
-- Enable WAL mode for better concurrency
PRAGMA journal_mode = WAL;

-- Optimize for production
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = -64000;  -- 64MB cache
PRAGMA temp_store = MEMORY;
```

### 3. Resource Limits

Set appropriate limits:

```bash
# PM2
pm2 start --max-memory-restart 1G

# Docker
docker run --memory="1g" --cpus="1.0" shiplab:latest
```

## Monitoring & Logging

### PM2 Monitoring

```bash
# View logs
pm2 logs shiplab

# Monitor resources
pm2 monit

# View process status
pm2 status
```

### Application Logs

Logs are written to:
- Console (stdout/stderr)
- PM2 logs: `~/.pm2/logs/`
- Docker logs: `docker logs shiplab`

### Health Checks

Create a health check endpoint:

```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

Test health:

```bash
curl https://your-domain.com/api/health
```

## Security Checklist

- [ ] Environment variables not committed to Git
- [ ] API keys stored securely
- [ ] HTTPS enabled (Let's Encrypt)
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Database backed up regularly
- [ ] Error logging configured
- [ ] Security headers configured
- [ ] Dependencies up to date
- [ ] Firewall rules configured

## Backup Strategy

### Automated Backups

Create backup script `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
cp production.db "$BACKUP_DIR/production.db.$DATE"

# Backup environment
cp .env.production "$BACKUP_DIR/.env.production.$DATE"

# Keep only last 30 backups
ls -t "$BACKUP_DIR"/production.db.* | tail -n +31 | xargs rm -f

echo "Backup completed: $DATE"
```

Schedule with cron:

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

## Rollback Procedure

### Quick Rollback

```bash
# Vercel
vercel rollback

# PM2
pm2 reload shiplab --update-env

# Docker
docker-compose down
docker-compose up -d --force-recreate
```

### Manual Rollback

```bash
# Checkout previous version
git checkout <previous-commit>

# Rebuild and restart
npm run build
pm2 restart shiplab
```

## Troubleshooting

### Application Won't Start

1. Check logs: `pm2 logs shiplab` or `docker logs shiplab`
2. Verify environment variables
3. Check port availability: `netstat -tulpn | grep 3000`
4. Verify Node.js version: `node --version`

### Database Errors

1. Check database file permissions
2. Verify DATABASE_URL is correct
3. Run migrations: `npm run db:push`
4. Check disk space: `df -h`

### Ollama Connection Issues

1. Verify Ollama is running: `curl http://localhost:11434/api/version`
2. Check firewall rules
3. Verify OLLAMA_BASE_URL in environment
4. Pull required models: `ollama pull smollm2:1.7b`

### Performance Issues

1. Check resource usage: `pm2 monit` or `docker stats`
2. Review application logs for errors
3. Check database query performance
4. Monitor API response times
5. Scale horizontally if needed

## Scaling

### Horizontal Scaling

#### Multiple Instances with PM2

```bash
pm2 start ecosystem.config.js -i max  # Use all CPU cores
```

#### Load Balancer (Nginx)

```nginx
upstream shiplab {
    least_conn;
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    location / {
        proxy_pass http://shiplab;
    }
}
```

### Vertical Scaling

Increase resources:
- More CPU cores
- Additional RAM
- Faster storage (SSD)

## Maintenance

### Regular Tasks

- [ ] Weekly: Check logs for errors
- [ ] Weekly: Review performance metrics
- [ ] Monthly: Update dependencies
- [ ] Monthly: Review and rotate logs
- [ ] Quarterly: Security audit
- [ ] Quarterly: Backup restoration test

### Updating ShipLab

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Run migrations
npm run db:push

# Rebuild
npm run build

# Restart
pm2 restart shiplab
```

## Support

For production support:
- Documentation: https://docs.shiplab.dev
- Issues: https://github.com/yourusername/shiplab/issues
- Community: https://discord.gg/shiplab

---

**Last Updated:** November 2025
**Version:** 1.0.0
