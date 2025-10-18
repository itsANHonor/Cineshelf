# Display Case - Docker Deployment Guide

## 🐳 Quick Start

Deploy Display Case with Docker in 3 simple steps:

```bash
# 1. Copy and configure environment variables
cp env.docker.example .env.docker
# Edit .env.docker with your TMDb API key and admin password

# 2. Build and start the container
docker-compose --env-file .env.docker up -d

# 3. Access the application
# Open http://localhost:3000 in your browser
```

That's it! The application is now running as a **single lightweight container** with persistent data storage.

## 🏠 Why Single Container?

Display Case uses a simplified **single-container architecture** perfect for homelab use:

- ✅ **Simple**: One container to manage instead of two
- ✅ **Lightweight**: ~100MB RAM usage, ~150MB disk space
- ✅ **Easy**: Simplified logs, debugging, and maintenance
- ✅ **Perfect for homelab**: Handles thousands of items effortlessly

The Express backend serves both the API and the built React frontend - no need for a separate nginx container!

## 📋 Prerequisites

- Docker 20.10 or higher
- Docker Compose 2.0 or higher
- TMDb API key (free at https://www.themoviedb.org/settings/api)

Check your versions:
```bash
docker --version
docker-compose --version
```

## 🚀 Detailed Setup

### 1. Configure Environment Variables

Create your environment file:
```bash
cp env.docker.example .env.docker
```

Edit `.env.docker` and set:
```env
TMDB_API_KEY=your_actual_tmdb_api_key
ADMIN_PASSWORD=your_secure_password
CLIENT_PORT=3000  # Optional: change if port 3000 is in use
```

**Important**: Never commit `.env.docker` to version control!

### 2. Build the Image

Build the unified container image:
```bash
docker-compose build
```

This will:
- Build the React frontend with Vite
- Build the Node.js backend with TypeScript
- Create a single optimized production image (~150MB)

### 3. Start the Container

Start in detached mode (background):
```bash
docker-compose --env-file .env.docker up -d
```

Or start with logs visible:
```bash
docker-compose --env-file .env.docker up
```

### 4. Verify Deployment

Check if container is running:
```bash
docker-compose ps
```

You should see `displaycase` running and healthy.

View logs:
```bash
docker-compose logs -f
```

Or using Docker directly:
```bash
docker logs -f displaycase
```

### 5. Access the Application

Everything runs on a single port (3000):

- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **Collection**: http://localhost:3000/collection
- **API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/api/health

## 🔧 Common Operations

### Stop the Application

```bash
docker-compose down
```

### Stop and Remove All Data

⚠️ **Warning**: This will delete your database and uploads!

```bash
docker-compose down -v
```

### Restart Services

```bash
docker-compose restart
```

### Rebuild After Code Changes

```bash
docker-compose build
docker-compose up -d
```

### View Real-time Logs

```bash
docker-compose logs -f
```

### Execute Commands in Container

```bash
# Access container shell
docker-compose exec displaycase sh

# Or using Docker directly
docker exec -it displaycase sh

# Run database migrations manually
docker-compose exec displaycase npm run migrate:latest
```

## 💾 Data Persistence

### Understanding Volumes

Display Case uses a named Docker volume to persist data:

- **Volume Name**: `displaycase_data`
- **Mounted at**: `/data` inside the container
- **Contains**: 
  - SQLite database (`database.sqlite`)
  - Uploaded images (`uploads/`)

Your data persists even when the container is stopped or removed (unless you use `-v` flag).

### Backup Database

Create a backup:
```bash
# Create backup directory
mkdir -p backups

# Copy database from container
docker cp displaycase:/data/database.sqlite backups/database-$(date +%Y%m%d-%H%M%S).sqlite
```

### Restore Database

Restore from backup:
```bash
# Stop the application
docker-compose down

# Remove existing volume
docker volume rm displaycase_data

# Start the application
docker-compose --env-file .env.docker up -d

# Wait for container to be ready, then restore
docker cp backups/your-backup.sqlite displaycase:/data/database.sqlite

# Restart container
docker-compose restart
```

### Backup Uploaded Images

```bash
# Create backup of uploads directory
docker cp displaycase:/data/uploads backups/uploads-$(date +%Y%m%d-%H%M%S)
```

### Export All Data

```bash
# Export entire data volume
docker run --rm \
  -v displaycase_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/data-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
```

### Import All Data

```bash
# Import data volume backup
docker run --rm \
  -v displaycase_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/your-backup.tar.gz -C /data
```

## 🔍 Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker-compose logs
# Or
docker logs displaycase
```

**Common issues:**

1. **Port already in use:**
   ```bash
   # Change PORT in .env.docker
   PORT=3001
   ```

2. **Missing environment variables:**
   ```bash
   # Verify .env.docker exists and has correct values
   cat .env.docker
   ```

3. **Permission issues:**
   ```bash
   # Reset permissions
   docker-compose down
   docker volume rm displaycase_data
   docker-compose --env-file .env.docker up -d
   ```

### Database Migration Errors

```bash
# Check if database file exists
docker exec displaycase ls -la /data/

# Run migrations manually
docker exec displaycase npm run migrate:latest

# Check migration status
docker exec displaycase npx knex migrate:currentVersion
```

### TMDb API Not Working

1. Verify API key in `.env.docker`
2. Check logs for API errors:
   ```bash
   docker logs displaycase | grep -i tmdb
   ```
3. Test API key manually:
   ```bash
   curl "https://api.themoviedb.org/3/search/movie?api_key=YOUR_KEY&query=matrix"
   ```

### Cannot Login to Admin

1. Verify `ADMIN_PASSWORD` in `.env.docker`
2. Restart server after changing password:
   ```bash
   docker-compose restart server
   ```

### Images Not Displaying

1. Check if uploads directory exists:
   ```bash
   docker exec displaycase ls -la /data/uploads/
   ```

2. Verify Express is serving uploads:
   ```bash
   curl -I http://localhost:3000/uploads/
   ```

3. Check permissions:
   ```bash
   docker exec displaycase ls -la /data/
   ```

### Container Health Check Failing

```bash
# Check health status
docker-compose ps

# Test health endpoint manually
curl http://localhost:3000/api/health
```

## 🏭 Production Deployment

### Security Considerations

1. **Use secrets management** (not plain text `.env.docker`):
   - Docker Swarm secrets
   - Kubernetes secrets
   - HashiCorp Vault

2. **Enable HTTPS**:
   - Use reverse proxy (Traefik, nginx, Caddy)
   - Obtain SSL certificates (Let's Encrypt)

3. **Secure admin password**:
   - Use strong, random password
   - Consider implementing JWT tokens

4. **Network security**:
   - Don't expose port 3001 directly
   - Use docker network isolation
   - Implement rate limiting

### Performance Tuning

1. **Resource limits** in `docker-compose.yml`:
   ```yaml
   services:
     server:
       deploy:
         resources:
           limits:
             cpus: '0.5'
             memory: 512M
   ```

2. **Nginx caching**:
   - Already configured in `client/nginx.conf`
   - Adjust cache times as needed

3. **Database optimization**:
   - Regular VACUUM operations
   - Consider PostgreSQL for large collections

### Monitoring

1. **Container logs**:
   ```bash
   docker-compose logs --tail=100 -f
   ```

2. **Container stats**:
   ```bash
   docker stats displaycase-server displaycase-client
   ```

3. **Health checks**:
   - Built-in Docker health checks configured
   - Monitor `/api/health` endpoint

### Scaling

For high-traffic deployments:

1. **Use external database** (PostgreSQL)
2. **Use object storage** (S3, MinIO) for uploads
3. **Load balancer** for multiple frontend instances
4. **CDN** for static assets
5. **Container orchestration** (Kubernetes, Docker Swarm)

## 🔄 Updates and Maintenance

### Update to Latest Version

```bash
# Pull latest code
git pull

# Rebuild images
docker-compose build

# Restart with new images (data persists)
docker-compose down
docker-compose --env-file .env.docker up -d
```

### Database Migrations

Migrations run automatically on container startup. To run manually:

```bash
docker-compose exec server npm run migrate:latest
```

### Rollback

```bash
# If something goes wrong, rollback to previous image
docker-compose down
git checkout previous-version
docker-compose build
docker-compose --env-file .env.docker up -d
```

## 📊 Useful Commands Reference

```bash
# View all containers
docker ps -a

# View volumes
docker volume ls

# Inspect volume
docker volume inspect displaycase_server_data

# View networks
docker network ls

# Clean up unused resources
docker system prune -a

# View image sizes
docker images

# Remove specific image
docker rmi displaycase-server
docker rmi displaycase-client

# Follow logs for specific service
docker-compose logs -f server

# Restart specific service
docker-compose restart server

# Scale services (if configured)
docker-compose up -d --scale server=2
```

## 🆘 Getting Help

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify environment: `cat .env.docker`
3. Check volumes: `docker volume inspect displaycase_server_data`
4. Review documentation: `README.md`, `SETUP.md`
5. Test health: `curl http://localhost:3000/api/health`

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [TMDb API Documentation](https://developers.themoviedb.org/3)
- [Display Case GitHub Repository](https://github.com/yourusername/displaycase)

---

**Need more help?** See the main `README.md` and `SETUP.md` files for detailed application documentation.

