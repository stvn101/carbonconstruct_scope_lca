# Docker Setup Guide for CarbonConstruct

## Overview

This guide explains how to containerize and run CarbonConstruct using Docker. The project includes multiple Docker configurations for different use cases.

## Files Included

- `Dockerfile` - Production-ready container with Nginx
- `Dockerfile.dev` - Development container with Node.js dev server
- `docker-compose.yml` - Orchestration for multiple services
- `nginx.conf` - Custom Nginx configuration with security headers
- `.dockerignore` - Files to exclude from Docker builds

## Quick Start

### Option 1: Production Container (Recommended)

```bash
# Build the production image
docker build -t carbonconstruct .

# Run the container
docker run -p 3000:80 carbonconstruct
```

Your app will be available at `http://localhost:3000`

### Option 2: Development Container

```bash
# Build development image
docker build -f Dockerfile.dev -t carbonconstruct-dev .

# Run with live reload
docker run -p 3000:3000 -v $(pwd):/app carbonconstruct-dev
```

### Option 3: Docker Compose (Full Stack)

```bash
# Start all services
docker-compose up

# Run in background
docker-compose up -d

# Stop services
docker-compose down
```

## Configuration

### Environment Variables

Create a `.env` file (copy from `.env.example`):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://hkgryypdqiyigoztvran.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# EC3 API Configuration
NEXT_PUBLIC_EC3_API_KEY=your-ec3-key-here
```

### Security Headers

The Nginx configuration includes security headers matching your Vercel setup:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- Content Security Policy for Supabase and external APIs

### SSL/HTTPS

For production deployment with SSL:

1. **Using a reverse proxy** (recommended):

   ```bash
   # Use nginx-proxy or traefik in front of the container
   docker run -d -p 80:80 -p 443:443 nginxproxy/nginx-proxy
   ```

2. **Using Docker secrets**:

   ```bash
   docker run -p 443:443 \
     -v /path/to/ssl:/etc/ssl/certs \
     carbonconstruct
   ```

## Production Deployment

### Building for Production

```bash
# Build optimized image
docker build -t carbonconstruct:latest .

# Tag for registry
docker tag carbonconstruct:latest your-registry/carbonconstruct:v1.0.0

# Push to registry
docker push your-registry/carbonconstruct:v1.0.0
```

### Deployment Platforms

#### 1. Digital Ocean App Platform

```bash
# Deploy directly from Docker image
doctl apps create --spec app-spec.yaml
```

#### 2. AWS ECS

```bash
# Push to ECR and deploy
aws ecr get-login-password | docker login --username AWS --password-stdin
docker push your-account.dkr.ecr.region.amazonaws.com/carbonconstruct:latest
```

#### 3. Google Cloud Run

```bash
# Deploy to Cloud Run
gcloud run deploy carbonconstruct \
  --image gcr.io/your-project/carbonconstruct \
  --port 80
```

#### 4. Azure Container Instances

```bash
# Deploy to Azure
az container create \
  --resource-group myResourceGroup \
  --name carbonconstruct \
  --image your-registry/carbonconstruct:latest
```

## Health Checks

The Docker Compose includes health checks:

```bash
# Check container health
docker-compose ps

# View logs
docker-compose logs carbonconstruct

# Check specific service
docker-compose exec carbonconstruct nginx -t
```

## Troubleshooting

### Common Issues

1. **Port already in use**:

   ```bash
   # Change port mapping
   docker run -p 8080:80 carbonconstruct
   ```

2. **Permission denied**:

   ```bash
   # Fix file permissions
   sudo chown -R $(whoami) .
   ```

3. **Container won't start**:

   ```bash
   # Check logs
   docker logs container-name

   # Debug interactively
   docker run -it carbonconstruct sh
   ```

### Performance Optimization

1. **Multi-stage builds** (already implemented):
   - Reduces final image size
   - Excludes development dependencies

2. **Nginx caching**:
   - Static assets cached for 1 year
   - Gzip compression enabled

3. **Resource limits**:

   ```yaml
   # In docker-compose.yml
   deploy:
     resources:
       limits:
         memory: 512M
         cpus: '0.5'
   ```

## Monitoring

### Basic monitoring with Docker

```bash
# Resource usage
docker stats

# Container logs
docker logs -f carbonconstruct

# System events
docker events
```

### Production monitoring

Consider adding:

- Prometheus metrics
- Grafana dashboards
- Log aggregation (ELK stack)
- APM tools (New Relic, DataDog)

## Scaling

### Horizontal scaling

```bash
# Scale with docker-compose
docker-compose up --scale carbonconstruct=3

# Use with load balancer
docker-compose up --scale carbonconstruct=3 nginx-proxy
```

### Container orchestration

For production, consider:

- Kubernetes
- Docker Swarm
- AWS ECS/Fargate
- Google GKE
- Azure AKS

## Backup and Data

Since this is a static site, backups mainly involve:

1. **Container images**:

   ```bash
   docker save carbonconstruct > carbonconstruct-backup.tar
   ```

2. **Application data** (if any persistent data is added):

   ```bash
   docker run --rm -v carbonconstruct_data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup.tar.gz /data
   ```

## Next Steps

1. **Test locally**: Run `docker-compose up` and verify everything works
2. **Configure environment**: Set up your `.env` file with real API keys
3. **Choose deployment**: Select a deployment platform and deploy
4. **Set up monitoring**: Add logging and monitoring for production
5. **Configure CI/CD**: Automate builds and deployments

## Security Best Practices

- Never include API keys in Docker images
- Use multi-stage builds to reduce attack surface
- Regularly update base images
- Scan images for vulnerabilities
- Use non-root users in containers (can be added if needed)
- Implement proper secrets management
