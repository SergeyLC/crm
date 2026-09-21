#!/bin/bash
cd /var/www/crm

echo "Pulling latest changes..."
git pull origin main

echo "Rebuilding Docker images..."
docker compose build --no-cache

echo "Restarting services..."
docker compose up -d

echo "Update completed!"