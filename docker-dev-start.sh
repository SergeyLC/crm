#!/bin/bash
cd "$(dirname "$0")/.."

echo "🚀 Starting LoyaCareCRM in Docker (Development Mode)"
echo "📍 Frontend: http://localhost:3003"
echo "📍 Backend API: http://localhost:4003"
echo "📍 Database: localhost:5435"
echo ""

# Check if .env.dev exists
if [ ! -f ".env.dev" ]; then
    echo "⚠️  .env.dev not found. Creating from template..."
    cp .env.docker.example .env.dev
    echo "✅ Created .env.dev - please edit with your local settings"
    echo ""
fi

# Run database migrations first
echo "🗄️  Running database migrations..."
docker-compose -f docker-compose.dev.yml run --rm backend pnpm run db:migrate:deploy
docker-compose -f docker-compose.dev.yml run --rm backend pnpm run db:generate

echo ""
echo "🐳 Starting Docker services..."
docker-compose -f docker-compose.dev.yml up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "✅ Services started!"
echo "📊 Check status: docker-compose -f docker-compose.dev.yml ps"
echo "📝 View logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "🛑 Stop: docker-compose -f docker-compose.dev.yml down"