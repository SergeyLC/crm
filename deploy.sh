#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse command line arguments
ADDITIONAL_MESSAGE=""
INCLUDE_COMMITS=true  # Enabled by default
CREATE_TAG=false  # Create release tag
while getopts "m:ft-:" opt; do
  case $opt in
    m)
      ADDITIONAL_MESSAGE="$OPTARG"
      ;;
    f)
      INCLUDE_COMMITS=true
      ;;
    t)
      CREATE_TAG=true
      ;;
    -)
      case "${OPTARG}" in
        clear)
          INCLUDE_COMMITS=false
          ;;
        *)
          echo "Invalid option: --${OPTARG}" >&2
          echo "Usage: $0 [-m \"additional commit message\"] [-t] [--clear]"
          echo "  -m: Add custom message to commit"
          echo "  -t: Create and push release tag"
          echo "  --clear: Don't include list of commits (by default commits are included)"
          exit 1
          ;;
      esac
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      echo "Usage: $0 [-m \"additional commit message\"] [-t] [--clear]"
      echo "  -m: Add custom message to commit"
      echo "  -t: Create and push release tag"
      echo "  --clear: Don't include list of commits (by default commits are included)"
      exit 1
      ;;
  esac
done

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

# Build commit message
if [ -n "$ADDITIONAL_MESSAGE" ]; then
  COMMIT_MESSAGE="Provide Release $NEW_VERSION - $ADDITIONAL_MESSAGE"
else
  COMMIT_MESSAGE="Provide Release $NEW_VERSION"
fi

# Add commit history by default (unless --clear is specified)
if [ "$INCLUDE_COMMITS" = true ]; then
  # Get commits that haven't been pushed yet
  UNPUSHED_COMMITS=$(git log origin/main..HEAD --pretty=format:"* %s" 2>/dev/null || echo "")
  
  if [ -n "$UNPUSHED_COMMITS" ]; then
    COMMIT_MESSAGE="$COMMIT_MESSAGE

$UNPUSHED_COMMITS"
    echo -e "${BLUE}📋 Including unpushed commits in message:${NC}"
    echo "$UNPUSHED_COMMITS"
  else
    echo -e "${YELLOW}ℹ️  No unpushed commits found${NC}"
  fi
else
  echo -e "${YELLOW}ℹ️  Skipping commit history (--clear flag used)${NC}"
fi

echo -e "\n${BLUE}📝 Staging changes...${NC}"
git add -A

echo -e "${BLUE}📝 Committing: \"$COMMIT_MESSAGE\"...${NC}"
git commit -m "$COMMIT_MESSAGE"

echo -e "${BLUE}🚀 Pushing to remote...${NC}"
git push

# Create and push release tag if -t flag is set
if [ "$CREATE_TAG" = true ]; then
  TAG_NAME="v$NEW_VERSION"
  
  # Build tag message
  if [ -n "$ADDITIONAL_MESSAGE" ]; then
    TAG_MESSAGE="Provide Release Tag $NEW_VERSION - $ADDITIONAL_MESSAGE"
  else
    TAG_MESSAGE="Provide Release Tag $NEW_VERSION"
  fi
  
  echo -e "${BLUE}🏷️  Creating tag: $TAG_NAME... with message: $TAG_MESSAGE${NC}"
  git tag -a "$TAG_NAME" -m "$TAG_MESSAGE"
  
  echo -e "${BLUE}🚀 Pushing tag: $TAG_NAME...${NC}"
  git push origin "$TAG_NAME"
  
  echo -e "\n${GREEN}✅ Deployment successful!${NC}"
  echo -e "${GREEN}📦 Version: $NEW_VERSION${NC}"
  echo -e "${GREEN}🏷️  Tag: $TAG_NAME${NC}"
  echo -e "\n${YELLOW}🚀 GitHub Actions will now deploy to production server...${NC}"
else
  echo -e "\n${GREEN}✅ Changes pushed successfully!${NC}"
  echo -e "${GREEN}📦 Version: $NEW_VERSION${NC}"
  echo -e "${YELLOW}ℹ️  No release tag created (use -t flag to create tag)${NC}"
fi
