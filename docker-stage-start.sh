#!/bin/bash

# Stage Docker Management Script
# Usage: ./docker-stage-start.sh

set -e

echo "🐳 Starting LoyaCare CRM Stage Environment..."

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
docker-compose -f docker-compose.stage.yml build --no-cache
docker-compose -f docker-compose.stage.yml up -d

echo "✅ Stage environment started successfully!"
echo "🌐 Frontend: http://localhost:3004"
echo "🔧 Backend: http://localhost:4004"
echo ""
echo "📊 Check status: docker-compose -f docker-compose.stage.yml ps"
echo "📝 View logs: docker-compose -f docker-compose.stage.yml logs -f"