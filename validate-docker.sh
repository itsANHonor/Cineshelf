#!/bin/bash

# Cineshelf Docker Validation Script
# This script validates that the Docker setup is correct

set -e

echo "🎬 Cineshelf Docker Validation"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
echo "1. Checking Docker installation..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✓${NC} Docker found: $DOCKER_VERSION"
else
    echo -e "${RED}✗${NC} Docker not found. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is available
echo ""
echo "2. Checking Docker Compose..."
if docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version)
    echo -e "${GREEN}✓${NC} Docker Compose found: $COMPOSE_VERSION"
elif docker-compose --version &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    echo -e "${GREEN}✓${NC} Docker Compose found: $COMPOSE_VERSION"
    echo -e "${YELLOW}⚠${NC} Using legacy docker-compose command"
else
    echo -e "${RED}✗${NC} Docker Compose not found. Please install Docker Compose."
    exit 1
fi

# Check required files
echo ""
echo "3. Checking required files..."
FILES=(
    "Dockerfile"
    "docker-compose.yml"
    "docker-entrypoint.sh"
    "env.docker.example"
    "server/package.json"
    "client/package.json"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file not found"
        exit 1
    fi
done

# Check if new feature files exist
echo ""
echo "4. Checking new feature files..."
NEW_FILES=(
    "server/src/routes/import-export.routes.ts"
    "FEATURE_IMPLEMENTATION.md"
    "CSV_FORMAT_GUIDE.md"
    "example-import.csv"
    "DOCKER_QUICKSTART.md"
)

for file in "${NEW_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file not found"
        exit 1
    fi
done

# Check environment file
echo ""
echo "5. Checking environment configuration..."
if [ -f ".env.docker" ]; then
    echo -e "${GREEN}✓${NC} .env.docker exists"
    
    # Check if required vars are set
    if grep -q "TMDB_API_KEY=your_tmdb_api_key_here" .env.docker; then
        echo -e "${YELLOW}⚠${NC} TMDB_API_KEY not configured (still has default value)"
    elif grep -q "TMDB_API_KEY=" .env.docker; then
        echo -e "${GREEN}✓${NC} TMDB_API_KEY configured"
    else
        echo -e "${RED}✗${NC} TMDB_API_KEY not found in .env.docker"
    fi
    
    if grep -q "ADMIN_PASSWORD=your_secure_password_here" .env.docker; then
        echo -e "${YELLOW}⚠${NC} ADMIN_PASSWORD not configured (still has default value)"
    elif grep -q "ADMIN_PASSWORD=" .env.docker; then
        echo -e "${GREEN}✓${NC} ADMIN_PASSWORD configured"
    else
        echo -e "${RED}✗${NC} ADMIN_PASSWORD not found in .env.docker"
    fi
else
    echo -e "${YELLOW}⚠${NC} .env.docker not found (you can copy from env.docker.example)"
fi

# Test Docker build (optional - can be slow)
echo ""
echo "6. Docker build test (optional)..."
read -p "Do you want to test building the Docker image? This may take a few minutes. (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Building Docker image..."
    if docker build -t cineshelf:validation-test . > /tmp/cineshelf-build.log 2>&1; then
        echo -e "${GREEN}✓${NC} Docker build successful"
        
        # Check if import-export route exists in built image
        echo "Checking if new features are included..."
        if docker run --rm cineshelf:validation-test ls dist/routes/import-export.routes.js > /dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} import-export.routes.js found in image"
        else
            echo -e "${RED}✗${NC} import-export.routes.js not found in image"
        fi
        
        # Clean up
        docker rmi cineshelf:validation-test > /dev/null 2>&1
    else
        echo -e "${RED}✗${NC} Docker build failed. Check /tmp/cineshelf-build.log for details"
        exit 1
    fi
else
    echo "Skipping build test"
fi

# Summary
echo ""
echo "=============================="
echo -e "${GREEN}✓ Validation Complete!${NC}"
echo "=============================="
echo ""
echo "Your Cineshelf Docker setup is ready!"
echo ""
echo "Next steps:"
echo "  1. Configure .env.docker with your API keys"
echo "  2. Run: docker-compose --env-file .env.docker up -d"
echo "  3. Access: http://localhost:3000"
echo ""
echo "For detailed instructions, see:"
echo "  - DOCKER_QUICKSTART.md - Quick start guide"
echo "  - FEATURE_IMPLEMENTATION.md - Feature documentation"
echo "  - CSV_FORMAT_GUIDE.md - CSV import/export guide"
echo ""

