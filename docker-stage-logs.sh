#!/bin/bash

# Stage Docker Logs Script
# Usage: ./docker-stage-logs.sh [service-name]

SERVICE=""
if [ "$1" ]; then
    SERVICE="$1"
    echo "📝 Showing logs for stage service: $SERVICE"
else
    echo "📝 Showing logs for all stage services"
fi

if [ "$SERVICE" ]; then
    docker compose -f docker-compose.stage.yml logs -f "$SERVICE"
else
    docker compose -f docker-compose.stage.yml logs -f
fi