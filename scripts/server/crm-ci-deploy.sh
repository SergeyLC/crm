#!/bin/bash
# Runs on the server as user `deploy` (invoked only via crm-ci-ssh-gateway).
# Expects TEMP_DIR=/tmp/crm-deploy-<runId> containing compose/nginx files + ci.env
# (same directory as this script when executed from the scp bundle).
set -euo pipefail

TEMP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CI_ENV="${TEMP_DIR}/ci.env"

if [[ ! -f "$CI_ENV" ]]; then
  echo "crm-ci-deploy: missing ${CI_ENV}" >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
# Values are KEY=value lines written by Actions (no shell interpolation).
# strip CR that Windows/GitHub UI sometimes leave behind
# shellcheck disable=SC2046
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%$'\r'}"
  [[ -z "$line" || "$line" =~ ^# ]] && continue
  key="${line%%=*}"
  val="${line#*=}"
  case "$key" in
    DEPLOY_ENVIRONMENT|DEPLOY_IMAGE_TAG|DEPLOY_VERSION|DEPLOY_SERVER_HOST|DEPLOY_POSTGRES_DB|DEPLOY_POSTGRES_USER|DEPLOY_POSTGRES_PASSWORD|DEPLOY_JWT_SECRET|DEPLOY_GITHUB_TOKEN|DEPLOY_GITHUB_ACTOR|DEPLOY_GITHUB_REPOSITORY|DEPLOY_RUN_ID|DEPLOY_RUN_SEED)
      printf -v "$key" '%s' "$val"
      export "$key"
      ;;
    *)
      echo "crm-ci-deploy: ignoring unexpected key $key" >&2
      ;;
  esac
done <"$CI_ENV"
set +a

strip_ws() { printf '%s' "$1" | tr -d '\r\n'; }

DEPLOY_VERSION=$(strip_ws "${DEPLOY_VERSION:-}")
DEPLOY_SERVER_HOST=$(strip_ws "${DEPLOY_SERVER_HOST:-}")
DEPLOY_POSTGRES_DB=$(strip_ws "${DEPLOY_POSTGRES_DB:-}")
DEPLOY_POSTGRES_USER=$(strip_ws "${DEPLOY_POSTGRES_USER:-}")
DEPLOY_POSTGRES_PASSWORD=$(strip_ws "${DEPLOY_POSTGRES_PASSWORD:-}")
DEPLOY_JWT_SECRET=$(strip_ws "${DEPLOY_JWT_SECRET:-}")
DEPLOY_IMAGE_TAG=$(strip_ws "${DEPLOY_IMAGE_TAG:-}")
DEPLOY_ENVIRONMENT=$(strip_ws "${DEPLOY_ENVIRONMENT:-}")
DEPLOY_RUN_ID=$(strip_ws "${DEPLOY_RUN_ID:-}")
DEPLOY_RUN_SEED=$(strip_ws "${DEPLOY_RUN_SEED:-false}")
DEPLOY_GITHUB_TOKEN=$(strip_ws "${DEPLOY_GITHUB_TOKEN:-}")
DEPLOY_GITHUB_ACTOR=$(strip_ws "${DEPLOY_GITHUB_ACTOR:-}")
DEPLOY_GITHUB_REPOSITORY=$(strip_ws "${DEPLOY_GITHUB_REPOSITORY:-}")

echo "Docker Deployment to ${DEPLOY_ENVIRONMENT}"
echo "Image tag: ${DEPLOY_IMAGE_TAG}"

env_set() {
  local key="$1"
  local val="$2"
  val="${val//\\/\\\\}"
  val="${val//\"/\\\"}"
  printf '%s="%s"\n' "$key" "$val" >>"$ENV_FILE"
}

if [[ "${DEPLOY_ENVIRONMENT}" == "production" ]]; then
  DEPLOY_DIR="/var/www/crm-production"
  COMPOSE_FILE="docker-compose.production.yml"
  NGINX_CONF="nginx.prod.conf"
  ENV_FILE=".env.production"
  CONTAINER_PREFIX="crm-production"
elif [[ "${DEPLOY_ENVIRONMENT}" == "stage-develop" ]]; then
  DEPLOY_DIR="/var/www/crm-stage-develop"
  COMPOSE_FILE="docker-compose.stage-develop.yml"
  NGINX_CONF="nginx.stage-develop.conf"
  ENV_FILE=".env.stage-develop"
  CONTAINER_PREFIX="crm-stage-develop"
elif [[ "${DEPLOY_ENVIRONMENT}" == "stage-main" ]]; then
  DEPLOY_DIR="/var/www/crm-stage-main"
  COMPOSE_FILE="docker-compose.stage-main.yml"
  NGINX_CONF="nginx.stage-main.conf"
  ENV_FILE=".env.stage-main"
  CONTAINER_PREFIX="crm-stage-main"
else
  # Legacy fallback name "staging"
  DEPLOY_DIR="/var/www/crm-staging"
  COMPOSE_FILE="docker-compose.stage.yml"
  NGINX_CONF="nginx.stage.conf"
  ENV_FILE=".env.stage"
  CONTAINER_PREFIX="crm-staging"
fi

echo "Deployment directory: $DEPLOY_DIR"
echo "Compose file: $COMPOSE_FILE"

mkdir -p "$DEPLOY_DIR"

echo "Copying deployment files..."
cp -f "$TEMP_DIR/$COMPOSE_FILE" "$DEPLOY_DIR/"
cp -f "$TEMP_DIR/$NGINX_CONF" "$DEPLOY_DIR/$NGINX_CONF"
cp -f "$TEMP_DIR/$NGINX_CONF" "$DEPLOY_DIR/nginx.conf"
cp -f "$TEMP_DIR/nginx.conf" "$DEPLOY_DIR/" 2>/dev/null || true

# Drop the scp bundle (includes ci.env secrets) after copying compose/nginx into place.
rm -rf "$TEMP_DIR"

cd "$DEPLOY_DIR"

if [[ "${DEPLOY_ENVIRONMENT}" == "production" ]]; then
  PORT="80"
  BACKEND_URL="http://${DEPLOY_SERVER_HOST}/api"
  CORS_ORIGIN="http://${DEPLOY_SERVER_HOST}"
elif [[ "${DEPLOY_ENVIRONMENT}" == "stage-develop" ]]; then
  PORT="8081"
  BACKEND_URL="http://${DEPLOY_SERVER_HOST}:8081/api"
  CORS_ORIGIN="http://${DEPLOY_SERVER_HOST}:8081"
else
  PORT="8080"
  BACKEND_URL="http://${DEPLOY_SERVER_HOST}:8080/api"
  CORS_ORIGIN="http://${DEPLOY_SERVER_HOST}:8080"
fi

echo "Configuring environment file..."
rm -f "$ENV_FILE"
( umask 077 && touch "$ENV_FILE" )

REPO_LOWER=$(echo "${DEPLOY_GITHUB_REPOSITORY}" | tr '[:upper:]' '[:lower:]')

env_set FRONTEND_IMAGE "ghcr.io/${REPO_LOWER}/frontend:${DEPLOY_IMAGE_TAG}"
env_set BACKEND_IMAGE "ghcr.io/${REPO_LOWER}/backend:${DEPLOY_IMAGE_TAG}"
env_set NGINX_PORT "${PORT}"
env_set DOMAIN "${DEPLOY_SERVER_HOST}"
env_set FRONTEND_PORT "3000"
env_set NEXT_PUBLIC_API_URL "/api"
env_set NEXT_PUBLIC_BACKEND_API_URL "${BACKEND_URL}"
env_set NEXT_PUBLIC_APP_VERSION "${DEPLOY_VERSION}"
env_set BACKEND_PORT "4000"
env_set NODE_ENV "production"
env_set LOG_LEVEL "info"
env_set CORS_ORIGIN "${CORS_ORIGIN}"
env_set POSTGRES_DB "${DEPLOY_POSTGRES_DB}"
env_set POSTGRES_USER "${DEPLOY_POSTGRES_USER}"
env_set POSTGRES_PASSWORD "${DEPLOY_POSTGRES_PASSWORD}"
env_set DATABASE_URL "postgresql://${DEPLOY_POSTGRES_USER}:${DEPLOY_POSTGRES_PASSWORD}@${CONTAINER_PREFIX}-postgres:5432/${DEPLOY_POSTGRES_DB}"
env_set JWT_SECRET "${DEPLOY_JWT_SECRET}"

echo "Environment configured (port=${PORT}, env=${DEPLOY_ENVIRONMENT}, lines=$(wc -l <"$ENV_FILE"))"

echo "Logging in to GitHub Container Registry..."
echo "${DEPLOY_GITHUB_TOKEN}" | docker login ghcr.io -u "${DEPLOY_GITHUB_ACTOR}" --password-stdin

echo "Pulling Docker images..."
docker pull "ghcr.io/${REPO_LOWER}/backend:${DEPLOY_IMAGE_TAG}"
docker pull "ghcr.io/${REPO_LOWER}/frontend:${DEPLOY_IMAGE_TAG}"

echo "Ensuring full stack is up..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans

echo "Recreating app containers..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --force-recreate --no-deps backend frontend

echo "Recreating nginx..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --force-recreate --no-deps nginx

echo "Waiting for services..."
sleep 15

echo "Running database migrations..."
docker exec "${CONTAINER_PREFIX}-backend" sh -c 'cd /app/db && pnpm run migrate:deploy' || echo "Migration failed or already up to date"

if [[ "${DEPLOY_RUN_SEED}" == "true" ]]; then
  echo "Seeding database (seed:runtime)..."
  docker exec "${CONTAINER_PREFIX}-backend" sh -c 'cd /app/db && pnpm run seed:runtime'
  echo "Seed completed"
else
  echo "Seed skipped (run_seed=false)"
fi

echo "Service status:"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

echo "Pruning old images..."
docker image prune -f

echo "Docker deployment to ${DEPLOY_ENVIRONMENT} completed!"
docker ps --filter "name=${CONTAINER_PREFIX}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
