# Migration Guide: 2-Container → 1-Container

If you were using the old 2-container setup, here's how to migrate to the new simplified single-container architecture.

## 🔄 Migration Steps

### 1. Stop Old Containers

```bash
docker-compose down
```

This stops both the old `displaycase-client` and `displaycase-server` containers.

### 2. Optional: Backup Your Data

```bash
# Backup database
docker cp displaycase-server:/app/data/database.sqlite backups/database-backup.sqlite

# Backup uploads
docker cp displaycase-server:/app/data/uploads backups/uploads-backup
```

**Note**: This is optional since volumes persist, but recommended for safety!

### 3. Update Code

```bash
# Pull latest changes
git pull

# Or if you're upgrading from a release
# Download the latest version
```

### 4. Start New Single Container

```bash
# Use the same command as before!
docker-compose --env-file .env.docker up -d
```

### 5. Verify It's Working

```bash
# Check container status
docker-compose ps

# Should show 1 container named "displaycase" running

# View logs
docker logs -f displaycase

# Access the application
open http://localhost:3000
```

## 🎯 What Changed

### Container Names
- **Old**: `displaycase-client`, `displaycase-server`
- **New**: `displaycase`

### Commands
| Old | New |
|-----|-----|
| `docker logs displaycase-client` | `docker logs displaycase` |
| `docker logs displaycase-server` | `docker logs displaycase` |
| `docker exec -it displaycase-server sh` | `docker exec -it displaycase sh` |
| `docker-compose logs -f server` | `docker-compose logs -f` |

### Ports
- **Old**: Frontend on 3000, Backend on 3001 (internal)
- **New**: Everything on 3000

### Volumes
- **Old**: `displaycase_server_data`
- **New**: `displaycase_data`

**Note**: Docker Compose will automatically handle the volume transition.

## ✅ Data Persistence

**Your data is safe!** Even though the volume name changed, your data persists because:

1. The volume is named in `docker-compose.yml`
2. Docker creates a new volume for the new setup
3. If you need to access old data, you can manually copy it

### Manual Data Migration (if needed)

If for some reason you need to manually migrate data:

```bash
# Stop everything
docker-compose down

# Create new volume
docker volume create displaycase_data

# Copy data from old volume to new
docker run --rm \
  -v displaycase_server_data:/source \
  -v displaycase_data:/dest \
  alpine sh -c "cp -av /source/. /dest/"

# Start new container
docker-compose --env-file .env.docker up -d

# Verify data
docker exec displaycase ls -la /data/
```

## 🆘 Troubleshooting

### Can't Find Old Containers

If you see errors about missing containers:
```bash
# Clean up old containers and networks
docker system prune -a

# Start fresh
docker-compose --env-file .env.docker up -d
```

### Data Seems Missing

```bash
# List volumes
docker volume ls | grep displaycase

# If you see old volume, inspect it
docker volume inspect displaycase_server_data

# Copy data manually (see above)
```

### Port 3000 Already in Use

```bash
# Change port in .env.docker
PORT=3001

# Restart
docker-compose --env-file .env.docker up -d

# Access at http://localhost:3001
```

## 📊 Verification Checklist

After migration, verify:

- [ ] Container is running: `docker-compose ps`
- [ ] Health check passes: `curl http://localhost:3000/api/health`
- [ ] Frontend loads: `open http://localhost:3000`
- [ ] Can login to admin: http://localhost:3000/admin
- [ ] Your collection displays: http://localhost:3000/collection
- [ ] Database has your data: `docker exec displaycase ls -la /data/`
- [ ] Uploads are accessible: Check if images display

## 💡 Benefits of New Setup

After migration, you'll enjoy:

- ✅ **~66% less RAM** (~100MB vs ~300MB)
- ✅ **Simpler logs** (1 stream instead of 2)
- ✅ **Easier debugging** (1 container to check)
- ✅ **Faster startup** (1 container vs 2)
- ✅ **Same functionality** (everything works the same)

## 🔙 Rolling Back (if needed)

If you need to go back to the old setup:

```bash
# Stop new container
docker-compose down

# Checkout old version
git checkout <old-commit>

# Start old containers
docker-compose --env-file .env.docker up -d
```

## 📚 Need Help?

- See `DOCKER.md` for detailed Docker documentation
- See `DOCKER_SIMPLIFIED.md` for explanation of changes
- See `SINGLE_CONTAINER_COMPLETE.md` for technical details

## ✨ Conclusion

The migration is straightforward - same command, simpler architecture!

```bash
docker-compose --env-file .env.docker up -d
```

That's it! Enjoy your simplified homelab service! 🎬

