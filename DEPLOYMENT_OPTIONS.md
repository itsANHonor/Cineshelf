# Cineshelf - Deployment Options

Cineshelf can be deployed in two ways. Choose the method that best fits your needs.

## 🐳 Option 1: Docker Deployment (Recommended)

### Pros
✅ **No Node.js installation required**  
✅ **One-command deployment**  
✅ **Automatic database migrations**  
✅ **Data persistence with volumes**  
✅ **Production-ready configuration**  
✅ **Platform-independent**  
✅ **Easy updates and rollbacks**  
✅ **Isolated environment**  

### Cons
❌ Requires Docker and docker-compose  
❌ Slightly more disk space for images  

### Quick Start

```bash
# 1. Configure
cp env.docker.example .env.docker
# Edit .env.docker with your API key and password

# 2. Deploy
docker-compose --env-file .env.docker up -d

# 3. Access
# http://localhost:3000
```

### Requirements
- Docker 20.10+
- Docker Compose 2.0+
- TMDb API key

### Documentation
📖 See [DOCKER.md](DOCKER.md) for complete Docker guide

---

## 💻 Option 2: Manual Installation

### Pros
✅ **Direct access to code**  
✅ **No Docker required**  
✅ **Easier for development**  
✅ **More control over environment**  

### Cons
❌ Requires Node.js installation  
❌ Platform-specific setup  
❌ Multiple commands to start  
❌ Manual migration management  

### Quick Start

```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install

# 2. Configure
cd server
cp env.example .env
# Edit .env with your API key and password

# 3. Initialize database
npm run migrate:latest

# 4. Start services (2 terminals)
# Terminal 1:
cd server && npm run dev

# Terminal 2:
cd client && npm run dev

# 5. Access
# http://localhost:3000
```

### Requirements
- Node.js 18+
- NPM or Yarn
- TMDb API key

### Documentation
📖 See [SETUP.md](SETUP.md) for manual installation guide

---

## 📊 Comparison Table

| Feature | Docker | Manual |
|---------|--------|--------|
| **Setup Time** | ~5 minutes | ~10-15 minutes |
| **Prerequisites** | Docker + docker-compose | Node.js + NPM |
| **Installation Complexity** | Low | Medium |
| **Deployment** | Single command | Multiple commands |
| **Updates** | `docker-compose up -d` | `git pull && npm install` |
| **Data Backup** | Volume-based | File-based |
| **Environment Isolation** | Full | Partial |
| **Resource Usage** | ~300MB RAM | ~200MB RAM |
| **Production Ready** | Yes | Requires additional setup |
| **Platform Independence** | High | Medium |
| **Development Workflow** | Good | Better |

---

## 🎯 Recommendations

### Use Docker If:
- You want the simplest deployment
- You're deploying to production
- You want automatic migrations
- You need environment isolation
- You're deploying to multiple servers
- You want easy backup/restore
- You prefer containerized applications

### Use Manual Installation If:
- You're actively developing the app
- You want direct code access
- Docker is not available
- You're very familiar with Node.js
- You need to customize the build process
- You're running on resource-constrained devices

---

## 🚀 Getting Started

### For Most Users (Recommended)
Start with Docker deployment:
1. Install Docker and docker-compose
2. Follow [DOCKER.md](DOCKER.md) guide
3. Deploy with one command

### For Developers
Use manual installation:
1. Install Node.js 18+
2. Follow [SETUP.md](SETUP.md) guide
3. Start development servers

---

## 🔄 Switching Between Methods

### From Manual to Docker
```bash
# Stop manual servers (Ctrl+C in terminals)
# Start Docker
docker-compose --env-file .env.docker up -d
```

Your existing database and uploads can be copied to Docker volume if needed.

### From Docker to Manual
```bash
# Stop Docker
docker-compose down

# Copy data from volume (optional)
docker cp cineshelf-server:/app/data/database.sqlite server/
docker cp cineshelf-server:/app/data/uploads server/

# Start manual servers
cd server && npm run dev
# (in another terminal)
cd client && npm run dev
```

---

## 📚 Documentation Quick Links

- **Docker Deployment**: [DOCKER.md](DOCKER.md)
- **Manual Installation**: [SETUP.md](SETUP.md)
- **Quick Start**: [QUICK_START.md](QUICK_START.md)
- **Main README**: [README.md](README.md)
- **Docker Implementation**: [DOCKER_IMPLEMENTATION.md](DOCKER_IMPLEMENTATION.md)

---

## 💡 Tips

1. **Try Docker first**: Even if you plan to develop, Docker helps you see the full app working
2. **Use helper scripts**: `scripts/docker-start.sh` makes Docker even easier
3. **Keep backups**: Both methods should have regular database backups
4. **Check logs**: 
   - Docker: `docker-compose logs -f`
   - Manual: Check terminal output
5. **Update regularly**: Pull latest code and rebuild/restart

---

## 🆘 Need Help?

- **Docker issues**: See [DOCKER.md](DOCKER.md) troubleshooting section
- **Manual issues**: See [SETUP.md](SETUP.md) troubleshooting section
- **General help**: Check [README.md](README.md)

---

**Bottom line**: Both methods work great! Docker is simpler for deployment, manual is better for active development. Choose what works for you! 🎬

