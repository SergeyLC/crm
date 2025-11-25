#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# For scripts in project root, PROJECT_DIR is the same as SCRIPT_DIR
PROJECT_DIR="$SCRIPT_DIR"

# Change to project directory (already there, but just in case)
cd "$PROJECT_DIR"

echo "🚀 Starting LoyaCareCRM in Docker (Development Mode)"
echo "📍 Project directory: $PROJECT_DIR"
echo "📍 Frontend: http://localhost:3003"
echo "📍 Backend API: http://localhost:4003"
echo "📍 Database: localhost:5435"
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.dev.yml" ]; then
    echo "❌ Error: docker-compose.dev.yml not found in $PROJECT_DIR"
    echo "Please run this script from the project root directory or check if the file exists."
    exit 1
fi

# Check if .env.dev exists
if [ ! -f ".env.dev" ]; then
    echo "⚠️  .env.dev not found. Creating from template..."
    cp .env.docker.example .env.dev
    echo "✅ Created .env.dev - please edit with your local settings"
    echo ""
fi

# Run database migrations first
echo "🗄️  Running database migrations..."
docker compose -f docker-compose.dev.yml run --rm backend pnpm run db:migrate:deploy
docker compose -f docker-compose.dev.yml run --rm backend pnpm run db:generate

echo ""
echo "🐳 Starting Docker services..."
docker compose -f docker-compose.dev.yml up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "✅ Services started!"
echo "📊 Check status: docker compose -f docker-compose.dev.yml ps"
echo "📝 View logs: docker compose -f docker-compose.dev.yml logs -f"
echo "🛑 Stop: docker compose -f docker-compose.dev.yml down"