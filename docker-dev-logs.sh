#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Change to project directory
cd "$PROJECT_DIR"

echo "📝 Showing LoyaCareCRM Docker development logs..."

# Check if we're in the right directory
if [ ! -f "docker-compose.dev.yml" ]; then
    echo "❌ Error: docker-compose.dev.yml not found in $PROJECT_DIR"
    echo "Please run this script from the project root directory or check if the file exists."
    exit 1
fi

docker-compose -f docker-compose.dev.yml logs -f