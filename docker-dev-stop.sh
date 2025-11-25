#!/bin/bash
cd "$(dirname "$0")/.."

echo "🛑 Stopping LoyaCareCRM Docker development services..."
docker-compose -f docker-compose.dev.yml down

echo "✅ Development services stopped"