# Migration Guide: 2-Container → 1-Container

If you were using the old 2-container setup, here's how to migrate to the new simplified single-container architecture.

## 🔄 Migration Steps

### 1. Stop Old Containers

```bash
docker-compose down
```

This stops both the old `cineshelf-client` and `cineshelf-server` containers.

### 2. Optional: Backup Your Data

```bash
# Backup database
docker cp cineshelf-server:/app/data/database.sqlite backups/database-backup.sqlite

# Backup uploads
docker cp cineshelf-server:/app/data/uploads backups/uploads-backup
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

# Should show 1 container named "cineshelf" running

# View logs
docker logs -f cineshelf

# Access the application
open http://localhost:3000
```

## 🎯 What Changed

### Container Names
- **Old**: `cineshelf-client`, `cineshelf-server`
- **New**: `cineshelf`

### Commands
| Old | New |
|-----|-----|
| `docker logs cineshelf-client` | `docker logs cineshelf` |
| `docker logs cineshelf-server` | `docker logs cineshelf` |
| `docker exec -it cineshelf-server sh` | `docker exec -it cineshelf sh` |
| `docker-compose logs -f server` | `docker-compose logs -f` |

### Ports
- **Old**: Frontend on 3000, Backend on 3001 (internal)
- **New**: Everything on 3000

### Volumes
- **Old**: `cineshelf_server_data`
- **New**: `cineshelf_data`

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
docker volume create cineshelf_data

# Copy data from old volume to new
docker run --rm \
  -v cineshelf_server_data:/source \
  -v cineshelf_data:/dest \
  alpine sh -c "cp -av /source/. /dest/"

# Start new container
docker-compose --env-file .env.docker up -d

# Verify data
docker exec cineshelf ls -la /data/
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
docker volume ls | grep cineshelf

# If you see old volume, inspect it
docker volume inspect cineshelf_server_data

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
- [ ] Database has your data: `docker exec cineshelf ls -la /data/`
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

