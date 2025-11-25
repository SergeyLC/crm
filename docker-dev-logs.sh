#!/bin/bash
cd "$(dirname "$0")/.."

echo "📝 Showing LoyaCareCRM Docker development logs..."
docker-compose -f docker-compose.dev.yml logs -f