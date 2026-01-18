#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Detect current branch
CURRENT_BRANCH=$(git branch --show-current)

# Function to display usage information
show_help() {
  if [ "$CURRENT_BRANCH" = "develop" ]; then
    # Help for develop branch - restricted options
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                LoyaCare CRM Deployment Script (develop)                    ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo -e ""
    echo -e "${YELLOW}⚠️  You are on the 'develop' branch${NC}"
    echo -e "${YELLOW}⚠️  Only push without deployment is allowed${NC}"
    echo -e ""
    echo -e "${GREEN}USAGE:${NC}"
    echo -e "  $0 -m MESSAGE -s"
    echo -e ""
    echo -e "${GREEN}OPTIONS:${NC}"
    echo -e "  ${YELLOW}-m MESSAGE${NC}    Commit message (required)"
    echo -e "  ${YELLOW}-s${NC}            Push without triggering deployment (required on develop)"
    echo -e "  ${YELLOW}-h, --help${NC}    Show this help message"
    echo -e ""
    echo -e "${GREEN}EXAMPLES:${NC}"
    echo -e "  ${CYAN}# Push changes to develop staging (port 8081)${NC}"
    echo -e "  $0 -m \"feat: add new feature\" -s"
    echo -e ""
    echo -e "${RED}RESTRICTIONS:${NC}"
    echo -e "  • Cannot create release tags (-t or -v) on develop branch"
    echo -e "  • Must use -s flag to push to develop staging"
    echo -e "  • Deployment happens automatically via GitHub Actions when pushing to develop"
    echo -e ""
    echo -e "${GREEN}WORKFLOW:${NC}"
    echo -e "  ${YELLOW}Push to develop:${NC}  Changes deployed to develop staging (port 8081)"
    echo -e ""
  else
    # Help for main branch - full options
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                     LoyaCare CRM Deployment Script                         ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo -e ""
    echo -e "${GREEN}USAGE:${NC}"
    echo -e "  $0 [OPTIONS]"
    echo -e ""
    echo -e "${GREEN}OPTIONS:${NC}"
    echo -e "  ${YELLOW}-m MESSAGE${NC}    Add custom commit message"
    echo -e "  ${YELLOW}-v VERSION${NC}    Create release tag with specified version (e.g., 1.4.2)"
    echo -e "  ${YELLOW}-t${NC}            Create release tag with auto-incremented patch version"
    echo -e "  ${YELLOW}-s${NC}            Skip deployment (push to main without triggering CI/CD)"
    echo -e "  ${YELLOW}-h, --help${NC}    Show this help message"
    echo -e ""
    echo -e "${GREEN}EXAMPLES:${NC}"
    echo -e "  ${CYAN}# Regular commit and deploy to staging${NC}"
    echo -e "  $0 -m \"fix: update user validation\""
    echo -e ""
    echo -e "  ${CYAN}# Create release with specific version${NC}"
    echo -e "  $0 -m \"feat: add new dashboard\" -v 1.4.2"
    echo -e ""
    echo -e "  ${CYAN}# Create release with auto-incremented version${NC}"
    echo -e "  $0 -m \"fix: resolve database connection issue\" -t"
    echo -e ""
    echo -e "  ${CYAN}# Push documentation changes without deployment${NC}"
    echo -e "  $0 -m \"docs: update API documentation\" -s"
    echo -e ""
    echo -e "${GREEN}WORKFLOW:${NC}"
    echo -e "  ${YELLOW}Without -v or -t:${NC}  Push to main → Deploy to staging (port 8080)"
    echo -e "  ${YELLOW}With -v or -t:${NC}    Create release tag → Deploy to production (port 80)"
    echo -e "  ${YELLOW}With -s:${NC}          Push to main without triggering deployment"
    echo -e ""
    echo -e "${GREEN}NOTES:${NC}"
    echo -e "  • Version format: X.Y.Z (e.g., 1.4.2)"
    echo -e "  • Release tags trigger production deployment via GitHub Actions"
    echo -e "  • Use -s flag for documentation-only changes"
    echo -e "  • Auto-increment uses current version from package.json or latest git tag"
    echo -e ""
  fi
}

# Parse command line arguments
ADDITIONAL_MESSAGE=""
COMMIT_MESSAGE_PREFIX=""
VERSION=""  # Version for release tag
AUTO_INCREMENT=false  # Auto-increment patch version
SKIP_DEPLOY=false  # Skip deployment (for docs-only changes)
UNSTAGED_CHANGES_COMMITTED=false

# Check for help flags first
for arg in "$@"; do
  if [ "$arg" = "-h" ] || [ "$arg" = "--help" ]; then
    show_help
    exit 0
  fi
done

while getopts "m:v:tsh" opt; do
  case $opt in
    m)
      ADDITIONAL_MESSAGE="$OPTARG"
      ;;
    v)
      # Restrict -v flag on develop branch
      if [ "$CURRENT_BRANCH" = "develop" ]; then
        echo -e "${RED}❌ Error: Cannot create release tags on develop branch${NC}"
        echo -e "${YELLOW}Release tags can only be created on main branch${NC}"
        echo -e "${YELLOW}Use: $0 -m \"message\" -s${NC}"
        exit 1
      fi
      VERSION="$OPTARG"
      ;;
    t)
      # Restrict -t flag on develop branch
      if [ "$CURRENT_BRANCH" = "develop" ]; then
        echo -e "${RED}❌ Error: Cannot create release tags on develop branch${NC}"
        echo -e "${YELLOW}Release tags can only be created on main branch${NC}"
        echo -e "${YELLOW}Use: $0 -m \"message\" -s${NC}"
        exit 1
      fi
      # -t flag triggers auto-increment
      AUTO_INCREMENT=true
      ;;
    s)
      # -s flag skips deployment
      SKIP_DEPLOY=true
      ;;
    h)
      show_help
      exit 0
      ;;
    \?)
      echo -e "${RED}Invalid option: -$OPTARG${NC}" >&2
      echo -e "${YELLOW}Use -h or --help for usage information${NC}"
      exit 1
      ;;
  esac
done

# Determine if we're creating a release
CREATING_RELEASE=false
if [ -n "$VERSION" ] || [ "$AUTO_INCREMENT" = true ]; then
  CREATING_RELEASE=true
fi

# Additional validation for develop branch
if [ "$CURRENT_BRANCH" = "develop" ]; then
  # On develop branch, -s flag is mandatory
  if [ "$SKIP_DEPLOY" = false ]; then
    echo -e "${RED}❌ Error: On develop branch, you must use -s flag${NC}"
    echo -e "${YELLOW}Usage: $0 -m \"message\" -s${NC}"
    echo -e "${YELLOW}Deployment will happen automatically via GitHub Actions when pushing to develop${NC}"
    exit 1
  fi
fi

# Check if there are unstaged changes
if ! git diff --quiet || ! git diff --cached --quiet; then
  # Check if commit message is provided
  if [ -z "$ADDITIONAL_MESSAGE" ]; then
    echo -e "\n${RED}❌ Error: Commit message is required${NC}"
    echo -e "${YELLOW}Usage: $0 -m \"your commit message\" [-v VERSION | -t]${NC}"
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
  # Release message - add [skip ci] to avoid staging deployment
  if [ -n "$ADDITIONAL_MESSAGE" ]; then
    COMMIT_MESSAGE="[skip ci] chore(release): v$VERSION - $ADDITIONAL_MESSAGE"
  else
    COMMIT_MESSAGE="[skip ci] chore(release): v$VERSION"
  fi
  
  echo -e "${CYAN}🏷️  Preparing release: $VERSION${NC}"
  echo -e "${CYAN}📝 Commit and tag message: \"$COMMIT_MESSAGE\"${NC}"
  echo -e "${YELLOW}ℹ️  Staging deployment will be skipped (release commits only trigger production)${NC}"
else
  # Regular commit message
  if [ -n "$ADDITIONAL_MESSAGE" ]; then
    COMMIT_MESSAGE="$ADDITIONAL_MESSAGE"
  else
    COMMIT_MESSAGE="Update code"
  fi
  
  # Add [skip ci] prefix if deployment should be skipped
  if [ "$SKIP_DEPLOY" = true ]; then
    COMMIT_MESSAGE_PREFIX="[skip ci] "
    COMMIT_MESSAGE="${COMMIT_MESSAGE_PREFIX}$COMMIT_MESSAGE"
    echo -e "${YELLOW}⏭️  Deployment will be skipped (skip ci flag added)${NC}"
  fi
fi

# Add commit history (always include unpushed commits)
UNPUSHED_COMMITS=$(git log origin/main..HEAD --pretty=format:"* %s" 2>/dev/null || echo "")
UNPUSHED_COUNT=$(git log origin/main..HEAD --oneline 2>/dev/null | wc -l | tr -d ' ')

# Commit logic
if [ "$CREATING_RELEASE" = true ]; then
  # For releases, always create a commit (even if empty) to ensure proper workflow detection
  if [ -n "$UNPUSHED_COMMITS" ]; then
    COMMIT_MESSAGE="$COMMIT_MESSAGE

$UNPUSHED_COMMITS"
    echo -e "${CYAN}📋 Including unpushed commits in release message:${NC}"
    echo "$UNPUSHED_COMMITS"
  fi
  
  if [ "$UNSTAGED_CHANGES_COMMITTED" = true ]; then
    echo -e "${CYAN}📝 Amending commit with release message: \"$COMMIT_MESSAGE\"...${NC}"
    git commit --amend -m "$COMMIT_MESSAGE"
  else
    echo -e "${CYAN}📝 Creating empty release commit: \"$COMMIT_MESSAGE\"...${NC}"
    git commit --allow-empty -m "$COMMIT_MESSAGE"
  fi
else
  # For regular commits
  if [ "$UNSTAGED_CHANGES_COMMITTED" = true ]; then
    # Single commit with changes - amend with history
    if [ -n "$UNPUSHED_COMMITS" ]; then
      COMMIT_MESSAGE="${COMMIT_MESSAGE_PREFIX}$COMMIT_MESSAGE

$UNPUSHED_COMMITS"
      echo -e "${CYAN}📋 Including unpushed commits in message:${NC}"
      echo "$UNPUSHED_COMMITS"
    fi
    echo -e "${CYAN}📝 Amending commit with full message: \"$COMMIT_MESSAGE\"...${NC}"
    git commit --amend -m "$COMMIT_MESSAGE"
  elif [ "$UNPUSHED_COUNT" -gt 1 ]; then
    # Multiple unpushed commits - create staging deploy commit
    PACKAGE_JSON="frontend/package.json"
    CURRENT_VERSION=$(node -p "require('./$PACKAGE_JSON').version")
    COMMIT_MESSAGE_STARTER="chore(staging)"
    if [ -n "$COMMIT_MESSAGE_PREFIX" ]; then
      COMMIT_MESSAGE_STARTER="${COMMIT_MESSAGE_PREFIX} update"
    fi
    if [ -n "$ADDITIONAL_MESSAGE" ]; then
      STAGING_COMMIT_MESSAGE="${COMMIT_MESSAGE_STARTER}: v$CURRENT_VERSION - $ADDITIONAL_MESSAGE

$UNPUSHED_COMMITS"
    else
      STAGING_COMMIT_MESSAGE="${COMMIT_MESSAGE_STARTER}: v$CURRENT_VERSION
$UNPUSHED_COMMITS"
    fi
    
    echo -e "${CYAN}📋 Including $UNPUSHED_COUNT unpushed commits:${NC}"
    echo "$UNPUSHED_COMMITS"
    echo -e "${CYAN}📝 Creating commit: \"$STAGING_COMMIT_MESSAGE\"${NC}"
    git commit --allow-empty -m "$STAGING_COMMIT_MESSAGE"
  fi
fi


echo -e "${CYAN}🚀 Pushing to remote...${NC}"
if [ "$CURRENT_BRANCH" = "develop" ]; then
  git push origin develop
else
  git push
fi

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
  echo -e "\n${GREEN}✅ Changes pushed to $CURRENT_BRANCH successfully!${NC}"
  if [ "$SKIP_DEPLOY" = true ]; then
    if [ "$CURRENT_BRANCH" = "develop" ]; then
      echo -e "${GREEN}🚀 GitHub Actions will deploy to develop staging (port 8081)${NC}"
    else
      echo -e "${YELLOW}⏭️  Deployment skipped (skip ci flag used)${NC}"
      echo -e "${YELLOW}ℹ️  Changes are in main branch but no deployment triggered${NC}"
    fi
  else
    echo -e "${YELLOW}ℹ️  No release tag created${NC}"
    echo -e "${YELLOW}ℹ️  To create a release tag, use: $0 -t or $0 -v VERSION${NC}"
    echo -e "${YELLOW}ℹ️  GitHub Actions will build and deploy to staging with build metadata${NC}"
  fi
  if [ "$CURRENT_BRANCH" = "main" ]; then
    echo -e "${YELLOW}ℹ️  To push without deployment, use: $0 -m \"message\" -s${NC}"
  fi
fi
