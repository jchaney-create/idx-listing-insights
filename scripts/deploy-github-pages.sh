#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required."
  echo "Install: https://cli.github.com/"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Log in to GitHub first:"
  echo "  gh auth login"
  exit 1
fi

OWNER="${1:-}"
REPO_NAME="${2:-idx-listing-insights}"
VISIBILITY="${3:-public}"

if [[ -z "$OWNER" ]]; then
  OWNER="$(gh api user -q .login)"
fi

echo "Building assets..."
npm run build

if gh repo view "$OWNER/$REPO_NAME" >/dev/null 2>&1; then
  echo "Repo $OWNER/$REPO_NAME already exists — pushing latest commit..."
  git remote remove origin 2>/dev/null || true
  git remote add origin "https://github.com/$OWNER/$REPO_NAME.git"
  git push -u origin main
else
  echo "Creating repo $OWNER/$REPO_NAME..."
  gh repo create "$REPO_NAME" --"${VISIBILITY}" --source=. --remote=origin --push
fi

echo "Enabling GitHub Pages via Actions..."
gh api "repos/$OWNER/$REPO_NAME/pages" -X POST -f build_type=workflow >/dev/null 2>&1 || true

echo "Waiting for Pages deployment..."
sleep 5
RUN_ID="$(gh run list --repo "$OWNER/$REPO_NAME" --workflow deploy-pages.yml --limit 1 --json databaseId -q '.[0].databaseId' 2>/dev/null || true)"

if [[ -n "$RUN_ID" && "$RUN_ID" != "null" ]]; then
  gh run watch "$RUN_ID" --repo "$OWNER/$REPO_NAME" --exit-status || true
fi

BASE="https://$OWNER.github.io/$REPO_NAME"
echo ""
echo "Done. Use these URLs in your IDX subheader:"
echo "  $BASE/idx-listing-insights.css"
echo "  $BASE/idx-listing-insights.iife.js"
echo ""
echo "Embed snippet:"
cat <<EOF

<div id="idx-listing-insights"></div>
<link rel="stylesheet" href="$BASE/idx-listing-insights.css" />
<script
  src="$BASE/idx-listing-insights.iife.js"
  data-container-id="idx-listing-insights"
  data-demo-mode="true"
  data-only-details-pages="true"
></script>

EOF
