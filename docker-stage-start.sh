#!/bin/bash

# Stage Docker Management Script
# Usage: ./docker-stage-start.sh

set -e

echo "🐳 Starting CRM Stage Environment..."

# Check if .env files exist
if [ ! -f ".env.backend.stage" ]; then
    echo "❌ .env.backend.stage not found. Please create it first."
    exit 1
fi

if [ ! -f ".env.frontend.stage" ]; then
    echo "❌ .env.frontend.stage not found. Please create it first."
    exit 1
fi

# Build and start services
docker compose -f docker-compose.stage.yml up --build -d

echo "✅ Stage environment started successfully!"
echo "🌐 Application: http://localhost:3004"
echo "🔧 API: http://localhost:3004/api"
echo "🗄️  Database: localhost:5436"
echo ""
echo "📊 Check status: docker compose -f docker-compose.stage.yml ps"
echo "📝 View logs: docker compose -f docker-compose.stage.yml logs -f"
echo "🛑 Stop: docker compose -f docker-compose.stage.yml down"