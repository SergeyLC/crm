#!/bin/bash

# Stage Docker Stop Script
# Usage: ./docker-stage-stop.sh

echo "🛑 Stopping LoyaCare CRM Stage Environment..."

docker-compose -f docker-compose.stage.yml down

echo "✅ Stage environment stopped successfully!"