# Release Deployment Strategy

## Problem

Previously, when creating a production release using `./deploy.sh -t`, the following occurred:

1. **Commit pushed to main** → Triggers staging deployment ⚠️
2. **Tag pushed** → Triggers production deployment ✅

This resulted in **double staging deployments** for release commits, wasting CI/CD resources and time.

## Solution

Release commits now automatically include `[skip ci]` prefix, which tells GitHub Actions to skip the workflow for that commit push. The workflow is only triggered by the tag push for production deployment.

### New Behavior

When running `./deploy.sh -t`:

1. **Commit with `[skip ci]` pushed to main** → **No staging deployment** ✅
2. **Tag pushed** → Triggers production deployment ✅

### Example Commit Message

Before:
```
chore(release): v0.1.46 - fix: correct version display
```

After:
```
[skip ci] chore(release): v0.1.46 - fix: correct version display
```

## Impact

- ✅ **Reduced CI/CD runs**: No redundant staging deployments for release commits
- ✅ **Faster releases**: Only production deployment runs
- ✅ **Cost savings**: Fewer workflow minutes consumed
- ✅ **Cleaner logs**: Less noise in Actions tab

## When Staging Deploys

Staging will still deploy for:
- ✅ Regular commits to `main` (non-release)
- ✅ Commits to `develop` branch
- ✅ Manual workflow_dispatch triggers

Staging will **NOT** deploy for:
- ❌ Release commits (created by `./deploy.sh -t` or `./deploy.sh -v X.Y.Z`)
- ❌ Documentation-only commits (created by `./deploy.sh -s`)

## Testing the Change

### Before this change:
```bash
# Create release
./deploy.sh -m "feat: new feature" -t

# Results in:
# 1. Workflow run for main push (staging) ⚠️
# 2. Workflow run for tag push (production) ✅
# Total: 2 workflows
```

### After this change:
```bash
# Create release
./deploy.sh -m "feat: new feature" -t

# Results in:
# 1. Tag push workflow only (production) ✅
# Total: 1 workflow ✅
```

## Implementation Date

**January 18, 2026** - Added `[skip ci]` to release commits to prevent redundant staging deployments.

## Related Changes

- Modified: `deploy.sh` - Added `[skip ci]` prefix to release commit messages
- Updated: `.github/CI_CD_SETUP.md` - Documented the behavior change
