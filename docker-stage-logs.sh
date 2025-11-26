#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# For scripts in project root, PROJECT_DIR is the same as SCRIPT_DIR
PROJECT_DIR="$SCRIPT_DIR"

# Change to project directory (already there, but just in case)
cd "$PROJECT_DIR"

SERVICE=""
if [ "$1" ]; then
    SERVICE="$1"
    echo "📝 Showing logs for stage service: $SERVICE"
else
    echo "📝 Showing logs for all stage services"
fi

# Check if we're in the right directory
if [ ! -f "docker-compose.stage.yml" ]; then
    echo "❌ Error: docker-compose.stage.yml not found in $PROJECT_DIR"
    echo "Please run this script from the project root directory or check if the file exists."
    exit 1
fi

if [ "$SERVICE" ]; then
    docker compose -f docker-compose.stage.yml logs -f "$SERVICE"
else
    docker compose -f docker-compose.stage.yml logs -f
fi