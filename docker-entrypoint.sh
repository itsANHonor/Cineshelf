#!/bin/sh
set -e

echo "🎬 Cineshelf - Starting..."
echo "==========================="

# Ensure data directories exist
echo "📁 Creating data directories..."
mkdir -p /data/uploads
echo "✅ Data directories ready"

# Check for required environment variables
if [ -z "$TMDB_API_KEY" ]; then
    echo "⚠️  WARNING: TMDB_API_KEY is not set!"
    echo "   Movie search will not work without a TMDb API key."
fi

if [ -z "$ADMIN_PASSWORD" ]; then
    echo "⚠️  WARNING: ADMIN_PASSWORD is not set!"
    echo "   Admin panel will not be accessible."
fi

# Run database migrations
echo ""
echo "🗄️  Running database migrations..."
if npx knex migrate:latest; then
    echo "✅ Database migrations completed successfully"
else
    echo "❌ Database migrations failed!"
    exit 1
fi

# Check database
if [ -f "$DATABASE_PATH" ]; then
    DB_SIZE=$(du -h "$DATABASE_PATH" | cut -f1)
    echo "✅ Database found: $DATABASE_PATH ($DB_SIZE)"
else
    echo "📝 Database will be created at: $DATABASE_PATH"
fi

echo ""
echo "🚀 Starting Cineshelf server..."
echo "================================"
echo "📡 Frontend: http://localhost:$PORT"
echo "📡 API: http://localhost:$PORT/api"
echo "📡 Admin: http://localhost:$PORT/admin"
echo "=================================="
echo ""

# Execute the main command
exec "$@"

