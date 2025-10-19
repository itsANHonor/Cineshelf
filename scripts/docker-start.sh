#!/bin/bash

# Cineshelf - Docker Start Script
# Starts the application with docker-compose

set -e

echo "🎬 Cineshelf - Starting Application"
echo "====================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: docker-compose is not installed"
    exit 1
fi

# Change to project root directory
cd "$(dirname "$0")/.."

# Check if .env.docker exists
if [ ! -f .env.docker ]; then
    echo "⚠️  Warning: .env.docker not found"
    echo ""
    if [ -f env.docker.example ]; then
        echo "Creating .env.docker from example..."
        cp env.docker.example .env.docker
        echo "✅ Created .env.docker"
        echo ""
        echo "⚠️  IMPORTANT: Edit .env.docker and add your:"
        echo "   - TMDB_API_KEY"
        echo "   - ADMIN_PASSWORD"
        echo ""
        read -p "Press Enter after updating .env.docker, or Ctrl+C to cancel..."
    else
        echo "❌ Error: env.docker.example not found"
        exit 1
    fi
fi

# Check if images exist
if ! docker images | grep -q "cineshelf"; then
    echo "📦 Images not found. Building..."
    docker-compose build
fi

echo ""
echo "🚀 Starting services..."
docker-compose --env-file .env.docker up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check status
echo ""
docker-compose ps

echo ""
echo "✅ Cineshelf is running!"
echo ""
echo "📱 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3000/api"
echo "   Health:   http://localhost:3000/api/health"
echo ""
echo "📋 Useful commands:"
echo "   View logs:    docker-compose logs -f"
echo "   Stop app:     docker-compose down"
echo "   Restart:      docker-compose restart"
echo ""
echo "📖 For more information, see DOCKER.md"

