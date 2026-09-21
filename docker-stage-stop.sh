#!/bin/bash

#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# For scripts in project root, PROJECT_DIR is the same as SCRIPT_DIR
PROJECT_DIR="$SCRIPT_DIR"

# Change to project directory (already there, but just in case)
cd "$PROJECT_DIR"

echo "🛑 Stopping CRM Docker stage services..."

# Check if we're in the right directory
if [ ! -f "docker-compose.stage.yml" ]; then
    echo "❌ Error: docker-compose.stage.yml not found in $PROJECT_DIR"
    echo "Please run this script from the project root directory or check if the file exists."
    exit 1
fi

docker compose -f docker-compose.stage.yml down

echo "✅ Stage services stopped"