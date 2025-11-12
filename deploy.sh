#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Parse command line arguments
ADDITIONAL_MESSAGE=""
INCLUDE_COMMITS=true  # Enabled by default
VERSION=""  # Version for release tag
AUTO_INCREMENT=false  # Auto-increment patch version

while getopts "m:v:t-:" opt; do
  case $opt in
    m)
      ADDITIONAL_MESSAGE="$OPTARG"
      ;;
    v)
      VERSION="$OPTARG"
      ;;
    t)
      # -t flag triggers auto-increment
      AUTO_INCREMENT=true
      ;;
    -)
      case "${OPTARG}" in
        clear)
          INCLUDE_COMMITS=false
          ;;
        *)
          echo "Invalid option: --${OPTARG}" >&2
          echo "Usage: $0 [-m \"commit message\"] [-v VERSION | -t] [--clear]"
          echo "  -m: Add custom message to commit"
          echo "  -v: Create release tag with specified version (e.g., 1.4.2)"
          echo "  -t: Create release tag with auto-incremented patch version"
          echo "  --clear: Don't include list of commits (by default commits are included)"
          exit 1
          ;;
      esac
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      echo "Usage: $0 [-m \"commit message\"] [-v VERSION | -t] [--clear]"
      echo "  -m: Add custom message to commit"
      echo "  -v: Create release tag with specified version (e.g., 1.4.2)"
      echo "  -t: Create release tag with auto-incremented patch version"
      echo "  --clear: Don't include list of commits (by default commits are included)"
      exit 1
      ;;
  esac
done

echo -e "\n${BLUE}📝 Staging changes...${NC}"
git add -A

# Sync with remote after committing local changes
echo -e "${BLUE}🔄 Syncing with remote repository...${NC}"
git pull --rebase

# Path to frontend/package.json
PACKAGE_JSON="frontend/package.json"

# Read current stable version from package.json FIRST (before committing)
CURRENT_VERSION=$(node -p "require('./$PACKAGE_JSON').version")
echo -e "${BLUE}📦 Current version in package.json: $CURRENT_VERSION${NC}"

# Auto-increment patch version if -t flag used without version
if [ "$AUTO_INCREMENT" = true ] && [ -z "$VERSION" ]; then
  # Parse version components
  if [[ "$CURRENT_VERSION" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
    MAJOR="${BASH_REMATCH[1]}"
    MINOR="${BASH_REMATCH[2]}"
    PATCH="${BASH_REMATCH[3]}"
    
    # Increment patch
    NEW_PATCH=$((PATCH + 1))
    VERSION="$MAJOR.$MINOR.$NEW_PATCH"
    
    echo -e "${GREEN}🔄 Auto-incrementing patch version: $CURRENT_VERSION → $VERSION${NC}"
  else
    echo -e "${RED}❌ Cannot parse current version: $CURRENT_VERSION${NC}"
    exit 1
  fi
fi

# Determine if we're creating a release
CREATING_RELEASE=false
if [ -n "$VERSION" ]; then
  CREATING_RELEASE=true
fi

# Build commit message BEFORE committing
if [ "$CREATING_RELEASE" = true ]; then
  # Release message
  if [ -n "$ADDITIONAL_MESSAGE" ]; then
    COMMIT_MESSAGE="Release $VERSION - $ADDITIONAL_MESSAGE"
  else
    COMMIT_MESSAGE="Release $VERSION"
  fi
  
  echo -e "${BLUE}🏷️  Preparing release: $VERSION${NC}"
  echo -e "${BLUE}📝 Commit and tag message: \"$COMMIT_MESSAGE\"${NC}"
else
  # Regular commit message
  if [ -n "$ADDITIONAL_MESSAGE" ]; then
    COMMIT_MESSAGE="$ADDITIONAL_MESSAGE"
  else
    COMMIT_MESSAGE="Update code"
  fi
fi

# Add commit history for regular commits (not for releases)
if [ "$INCLUDE_COMMITS" = true ] && [ "$CREATING_RELEASE" = false ]; then
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
  if [ "$CREATING_RELEASE" = true ]; then
    echo -e "${YELLOW}ℹ️  Release commit: using clean message without commit history${NC}"
  else
    echo -e "${YELLOW}ℹ️  Skipping commit history (--clear flag used)${NC}"
  fi
fi

# Only commit if there are changes
if git diff --staged --quiet; then
  echo -e "${YELLOW}ℹ️  No changes to commit${NC}"
else
  echo -e "${BLUE}📝 Committing: \"$COMMIT_MESSAGE\"...${NC}"
  git commit -m "$COMMIT_MESSAGE"
fi


echo -e "${BLUE}🚀 Pushing to remote...${NC}"
git push

# Create and push release tag if version is specified
if [ -n "$VERSION" ]; then
  # Validate version format (should be X.Y.Z)
  if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}❌ Invalid version format: $VERSION${NC}"
    echo -e "${YELLOW}Version should be in format X.Y.Z (e.g., 1.4.2)${NC}"
    exit 1
  fi
  
  TAG_NAME="v$VERSION"
  
  # Check if tag already exists
  if git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
    echo -e "${RED}❌ Tag $TAG_NAME already exists${NC}"
    exit 1
  fi
  
  # Use the same message for tag as for commit
  TAG_MESSAGE="$COMMIT_MESSAGE"
  
  echo -e "${BLUE}🏷️  Creating release tag: $TAG_NAME${NC}"
  git tag -a "$TAG_NAME" -m "$TAG_MESSAGE"
  
  echo -e "${BLUE}🚀 Pushing tag: $TAG_NAME...${NC}"
  git push origin "$TAG_NAME"
  
  echo -e "\n${GREEN}✅ Release tag created successfully!${NC}"
  echo -e "${GREEN}🏷️  Tag: $TAG_NAME${NC}"
  echo -e "${GREEN}📦 Version: $VERSION${NC}"
  echo -e "\n${YELLOW}🚀 GitHub Actions will now:${NC}"
  echo -e "${YELLOW}   1. Update package.json to version $VERSION${NC}"
  echo -e "${YELLOW}   2. Create GitHub Release${NC}"
  echo -e "${YELLOW}   3. Deploy to production server${NC}"
  echo -e "\n${BLUE}📝 Important:${NC}"
  echo -e "${YELLOW}After GitHub Actions completes, run:${NC}"
  echo -e "${GREEN}   git pull --rebase${NC}"
  echo -e "${YELLOW}to sync the updated package.json to your local repository${NC}"
else
  echo -e "\n${GREEN}✅ Changes pushed to main successfully!${NC}"
  echo -e "${YELLOW}ℹ️  No release tag created${NC}"
  echo -e "${YELLOW}ℹ️  To create a release tag, use: $0 -v VERSION${NC}"
  echo -e "${YELLOW}ℹ️  GitHub Actions will build and deploy to staging with build metadata${NC}"
fi
