#!/usr/bin/env bash
# ─── Onyx Desktop — GitHub Repository Setup ──────────────────────────────────
# Run this once from the artifacts/onyx-desktop/ directory:
#   chmod +x scripts/setup-github.sh && ./scripts/setup-github.sh
#
# Pre-requisites:
#   • GitHub CLI logged in (gh auth login) OR git credential helper configured
#   • Access to github.com/onyxaegis organisation
# ─────────────────────────────────────────────────────────────────────────────

set -e

REPO="onyxaegis/onyx-desktop"
DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "→ Initialising git repo in $DIR"
cd "$DIR"

git init
git checkout -b main

# Standard .gitignore for Electron + Node
cat > .gitignore << 'GITIGNORE'
node_modules/
dist/
dist/installers/
.DS_Store
*.log
*.env
AuthKey_*.p8
GITIGNORE

git add -A
git commit -m "chore: initial Onyx Desktop release"

echo "→ Creating GitHub repository $REPO (private)"
gh repo create "$REPO" --private --source=. --remote=origin --push \
  || { echo "gh not available — pushing to existing remote"; git remote add origin "https://github.com/$REPO.git"; git push -u origin main; }

echo "✓ Pushed to https://github.com/$REPO"
echo ""
echo "Next steps:"
echo "  1. Go to https://github.com/$REPO/settings → Actions → Allow all"
echo "  2. Add APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID"
echo "     secrets for notarisation (Settings → Secrets and variables → Actions)"
echo "  3. Run 'pnpm run electron:build:mac' on a Mac (or via GitHub Actions)"
