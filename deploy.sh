#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Parse command line arguments
ADDITIONAL_MESSAGE=""
INCLUDE_COMMITS=true  # Enabled by default
VERSION=""  # Version for release tag
AUTO_INCREMENT=false  # Auto-increment patch version
UNSTAGED_CHANGES_COMMITTED=false

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

# Determine if we're creating a release
CREATING_RELEASE=false
if [ -n "$VERSION" ] || [ "$AUTO_INCREMENT" = true ]; then
  CREATING_RELEASE=true
fi

# Check if there are unstaged changes
if ! git diff --quiet || ! git diff --cached --quiet; then
  # Check if commit message is provided
  if [ -z "$ADDITIONAL_MESSAGE" ]; then
    echo -e "\n${RED}❌ Error: Commit message is required${NC}"
    echo -e "${YELLOW}Usage: $0 -m \"your commit message\" [-v VERSION | -t] [--clear]${NC}"
    echo -e "${YELLOW}Example: $0 -m \"fix: update deployment script\"${NC}"
    exit 1
  fi
  
  echo -e "\n${CYAN}📝 Staging changes...${NC}"
  git add -A
  git commit -m "${ADDITIONAL_MESSAGE}"
  UNSTAGED_CHANGES_COMMITTED=true
else
  echo -e "\n${YELLOW}ℹ️  No unstaged changes to commit${NC}"
fi

# Sync with remote after committing local changes
echo -e "${CYAN}🔄 Syncing with remote repository...${NC}"
git pull --rebase

if [ "$CREATING_RELEASE" = true ]; then
  # Path to frontend/package.json
  PACKAGE_JSON="frontend/package.json"

  # Read current version from package.json
  PACKAGE_VERSION=$(node -p "require('./$PACKAGE_JSON').version")
  echo -e "${CYAN}📦 Version in package.json: $PACKAGE_VERSION${NC}"

  # Get latest tag version from git
  LATEST_TAG=$(git tag -l "v*" | sort -V | tail -n 1)
  if [ -n "$LATEST_TAG" ]; then
    TAG_VERSION="${LATEST_TAG#v}" # Remove 'v' prefix
    echo -e "${CYAN}🏷️  Latest git tag: $LATEST_TAG ($TAG_VERSION)${NC}"
  else
    TAG_VERSION="0.0.0"
    echo -e "${YELLOW}ℹ️  No git tags found, using 0.0.0${NC}"
  fi

  # Function to compare versions (returns 0 if v1 >= v2, 1 otherwise)
  version_gte() {
    [ "$1" = "$(echo -e "$1\n$2" | sort -V | tail -n 1)" ]
  }

  # Determine the maximum version
  if version_gte "$PACKAGE_VERSION" "$TAG_VERSION"; then
    CURRENT_VERSION="$PACKAGE_VERSION"
    echo -e "${GREEN}📌 Using package.json version: $CURRENT_VERSION${NC}"
  else
    CURRENT_VERSION="$TAG_VERSION"
    echo -e "${GREEN}📌 Using git tag version: $CURRENT_VERSION${NC}"
  fi

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

  # Build commit message BEFORE committing
  # Release message
  if [ -n "$ADDITIONAL_MESSAGE" ]; then
    COMMIT_MESSAGE="Release v$VERSION : $ADDITIONAL_MESSAGE"
  else
    COMMIT_MESSAGE="Release v$VERSION"
  fi
  
  echo -e "${CYAN}🏷️  Preparing release: $VERSION${NC}"
  echo -e "${CYAN}📝 Commit and tag message: \"$COMMIT_MESSAGE\"${NC}"
else
  # Regular commit message
  if [ -n "$ADDITIONAL_MESSAGE" ]; then
    COMMIT_MESSAGE="$ADDITIONAL_MESSAGE"
  else
    COMMIT_MESSAGE="Update code"
  fi
fi

# Add commit history for regular commits (not for releases)
if [ "$INCLUDE_COMMITS" = true ] ; then
  # Get commits that haven't been pushed yet
  UNPUSHED_COMMITS=$(git log origin/main..HEAD --pretty=format:"* %s" 2>/dev/null || echo "")
  
  if [ -n "$UNPUSHED_COMMITS" ]; then
    COMMIT_MESSAGE="$COMMIT_MESSAGE

$UNPUSHED_COMMITS"
    echo -e "${CYAN}📋 Including unpushed commits in message:${NC}"
    echo "$UNPUSHED_COMMITS"
  else
    echo -e "${YELLOW}ℹ️  No unpushed commits found${NC}"
  fi
else
  # if [ "$CREATING_RELEASE" = true ]; then
  #   echo -e "${YELLOW}ℹ️  Release commit: using clean message without commit history${NC}"
  # else
    echo -e "${YELLOW}ℹ️  Skipping commit history (--clear flag used)${NC}"
  # fi
fi

# Only commit if there are changes
if [ "$UNSTAGED_CHANGES_COMMITTED" = true ]; then
  echo -e "${CYAN}📝 Committing: \"$COMMIT_MESSAGE\"...${NC}"
  git commit --amend -m "$COMMIT_MESSAGE"
fi


echo -e "${CYAN}🚀 Pushing to remote...${NC}"
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
  echo -e "${CYAN}🏷️  TAG_MESSAGE: $TAG_MESSAGE${NC}"
  echo -e "${CYAN}🏷️  Creating release tag: $TAG_NAME${NC}"
  git tag -a "$TAG_NAME" -m "$TAG_MESSAGE"
  
  echo -e "${CYAN}🚀 Pushing tag: $TAG_NAME...${NC}"
  git push origin "$TAG_NAME"
  
  echo -e "\n${GREEN}✅ Release tag created successfully!${NC}"
  echo -e "${GREEN}🏷️  Tag: $TAG_NAME${NC}"
  echo -e "${GREEN}📦 Version: $VERSION${NC}"
  echo -e "\n${YELLOW}🚀 GitHub Actions will now:${NC}"
  echo -e "${YELLOW}   1. Update package.json to version $VERSION${NC}"
  echo -e "${YELLOW}   2. Create GitHub Release${NC}"
  echo -e "${YELLOW}   3. Deploy to production server${NC}"
  echo -e "\n${RED}📝 IMPORTANT - Don't forget:${NC}"
  echo -e "${YELLOW}After GitHub Actions completes (~5-10 min), run:${NC}"
  echo -e "${GREEN}   git pull --rebase${NC}"
  echo -e "${YELLOW}to sync the updated package.json to your local repository!${NC}"
else
  echo -e "\n${GREEN}✅ Changes pushed to main successfully!${NC}"
  echo -e "${YELLOW}ℹ️  No release tag created${NC}"
  echo -e "${YELLOW}ℹ️  To create a release tag, use: $0 -t or $0 -v VERSION${NC}"
  echo -e "${YELLOW}ℹ️  GitHub Actions will build and deploy to staging with build metadata${NC}"
fi
