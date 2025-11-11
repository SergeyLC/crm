#!/bin/bash

# Script to run E2E tests with frontend (3001) and backend (4001) servers
# This ensures tests don't interfere with development servers on 3000/4000
# 
# Usage: ./run-e2e-tests.sh
# Or simply: cd frontend && pnpm run playwright

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}ℹ️  Running E2E tests on test ports (Frontend: 3001, Backend: 4001)${NC}"
echo -e "${BLUE}ℹ️  These ports are configured via NODE_ENV=test and .env.test.local${NC}"
echo ""

cd frontend
pnpm run playwright

echo ""
echo -e "${GREEN}✅ All E2E tests passed!${NC}"
