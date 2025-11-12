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

while getopts "m:v:t:-:" opt; do
  case $opt in
    m)
      ADDITIONAL_MESSAGE="$OPTARG"
      ;;
    v)
      VERSION="$OPTARG"
      ;;
    t)
      # -t flag with optional argument
      if [ -n "$OPTARG" ] && [[ ! "$OPTARG" =~ ^- ]]; then
        VERSION="$OPTARG"
      else
        AUTO_INCREMENT=true
        # If OPTARG starts with -, it's the next option, put it back
        if [[ "$OPTARG" =~ ^- ]]; then
          OPTIND=$((OPTIND-1))
        fi
      fi
      ;;
    -)
      case "${OPTARG}" in
        clear)
          INCLUDE_COMMITS=false
          ;;
        *)
          echo "Invalid option: --${OPTARG}" >&2
          echo "Usage: $0 [-m \"commit message\"] [-v VERSION | -t [VERSION]] [--clear]"
          echo "  -m: Add custom message to commit"
          echo "  -v: Create release tag with specified version (e.g., 1.4.2)"
          echo "  -t: Create release tag (auto-increment patch if no version specified)"
          echo "  --clear: Don't include list of commits (by default commits are included)"
          exit 1
          ;;
      esac
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      echo "Usage: $0 [-m \"commit message\"] [-v VERSION | -t [VERSION]] [--clear]"
      echo "  -m: Add custom message to commit"
      echo "  -v: Create release tag with specified version (e.g., 1.4.2)"
      echo "  -t: Create release tag (auto-increment patch if no version specified)"
      echo "  --clear: Don't include list of commits (by default commits are included)"
      exit 1
      ;;
  esac
done

# Path to frontend/package.json
PACKAGE_JSON="frontend/package.json"

# Read current stable version
CURRENT_VERSION=$(node -p "require('./$PACKAGE_JSON').version")
echo -e "${BLUE}📦 Current stable version in package.json: $CURRENT_VERSION${NC}"

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

# Build commit message
if [ -n "$ADDITIONAL_MESSAGE" ]; then
  COMMIT_MESSAGE="$ADDITIONAL_MESSAGE"
else
  COMMIT_MESSAGE="Update code"
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
  
  # Build tag message
  if [ -n "$ADDITIONAL_MESSAGE" ]; then
    TAG_MESSAGE="Release $VERSION - $ADDITIONAL_MESSAGE"
  else
    TAG_MESSAGE="Release $VERSION"
  fi
  
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
  echo -e "\n${BLUE}⏳ Waiting for GitHub Actions to update package.json...${NC}"
  echo -e "${YELLOW}ℹ️  This usually takes 10-30 seconds${NC}"
  
  # Wait a bit for GitHub Actions to process and commit
  sleep 15
  
  echo -e "${BLUE}🔄 Pulling updated package.json from remote...${NC}"
  git pull --rebase
  
  echo -e "${GREEN}✅ Local repository is now in sync with remote${NC}"
else
  echo -e "\n${GREEN}✅ Changes pushed to main successfully!${NC}"
  echo -e "${YELLOW}ℹ️  No release tag created${NC}"
  echo -e "${YELLOW}ℹ️  To create a release tag, use: $0 -v VERSION${NC}"
  echo -e "${YELLOW}ℹ️  GitHub Actions will build and deploy to staging with build metadata${NC}"
fi
