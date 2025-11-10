#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Path to frontend/package.json
PACKAGE_JSON="frontend/package.json"

# Read current version
CURRENT_VERSION=$(node -p "require('./$PACKAGE_JSON').version")
echo -e "${BLUE}📦 Current version: $CURRENT_VERSION${NC}"

# Increment patch version (0.1.11 -> 0.1.12)
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR="${VERSION_PARTS[0]}"
MINOR="${VERSION_PARTS[1]}"
PATCH="${VERSION_PARTS[2]}"
NEW_PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"

echo -e "${GREEN}✨ New version: $NEW_VERSION${NC}"

# Update version in db/package.json
node -e "
const fs = require('fs');
const pkg = require('./$PACKAGE_JSON');
pkg.version = '$NEW_VERSION';
fs.writeFileSync('$PACKAGE_JSON', JSON.stringify(pkg, null, 2) + '\n');
"
echo -e "${GREEN}✅ Updated $PACKAGE_JSON${NC}"

# Git operations
COMMIT_MESSAGE="Provide Release Tag $NEW_VERSION"
TAG_NAME="v$NEW_VERSION"

echo -e "\n${BLUE}📝 Staging changes...${NC}"
git add -A

echo -e "${BLUE}📝 Committing: \"$COMMIT_MESSAGE\"...${NC}"
git commit -m "$COMMIT_MESSAGE"

echo -e "${BLUE}🚀 Pushing to remote...${NC}"
git push

echo -e "${BLUE}🏷️  Creating tag: $TAG_NAME...${NC}"
git tag -a "$TAG_NAME" -m "$COMMIT_MESSAGE"

echo -e "${BLUE}🚀 Pushing tag: $TAG_NAME...${NC}"
git push origin "$TAG_NAME"

echo -e "\n${GREEN}✅ Deployment successful!${NC}"
echo -e "${GREEN}📦 Version: $NEW_VERSION${NC}"
echo -e "${GREEN}🏷️  Tag: $TAG_NAME${NC}"
echo -e "\n${YELLOW}🚀 GitHub Actions will now deploy to production server...${NC}"
