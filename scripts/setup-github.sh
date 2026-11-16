#!/usr/bin/env bash
# One-time setup: creates the private GitHub repo, labels, secrets and variables.
# Run from the project folder on your Mac:  ./scripts/setup-github.sh
# Needs: git, GitHub CLI (`brew install gh`, then `gh auth login`), Claude Code CLI.
set -euo pipefail

REPO_NAME="${REPO_NAME:-habit-tracker}"

command -v gh >/dev/null || { echo "Install the GitHub CLI first: brew install gh"; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "Log in first: gh auth login"; exit 1; }

echo "==> 1/6 Git repository"
if [ ! -d .git ]; then
  git init -b main
  git add .
  git commit -m "Initial habit tracker with AI development workflows"
fi

echo "==> 2/6 Private GitHub repository"
if ! git remote get-url origin >/dev/null 2>&1; then
  gh repo create "$REPO_NAME" --private --source . --remote origin --push
else
  git push -u origin main
fi
REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
echo "    $REPO"

echo "==> 3/6 Workflow labels"
create_label() { gh label create "$1" --color "$2" --description "$3" --force >/dev/null; echo "    $1"; }
create_label refine            "1d76db" "Ready for Claude to refine into a plan"
create_label needs-info        "d93f0b" "Claude needs answers before continuing"
create_label awaiting-approval "fbca04" "Plan ready: review it, then add 'approved'"
create_label approved          "0e8a16" "Plan approved: Claude implements it"
create_label in-review         "5319e7" "PR open: waiting for your review"

echo "==> 4/6 Claude token"
echo "    Run 'claude setup-token' in another terminal, then paste the token here."
gh secret set CLAUDE_CODE_OAUTH_TOKEN

echo "==> 5/6 Staging on the VPS (press Enter to accept the defaults)"
read -r -p "    Server host [149.210.201.94]: " HOST; HOST=${HOST:-149.210.201.94}
read -r -p "    SSH user [dvanegmond]: " DUSER; DUSER=${DUSER:-dvanegmond}
read -r -p "    SSH port [22]: " PORT; PORT=${PORT:-22}
read -r -p "    Staging domain [habit-tracker-staging.dcvanegmond.nl]: " DOMAIN
DOMAIN=${DOMAIN:-habit-tracker-staging.dcvanegmond.nl}
read -r -p "    Deploy PRIVATE key [~/.ssh/habit-tracker-deploy]: " KEY
KEY=${KEY:-~/.ssh/habit-tracker-deploy}; KEY=${KEY/#\~/$HOME}
if [ ! -f "$KEY" ]; then
  ssh-keygen -t ed25519 -f "$KEY" -N "" -C "github-actions $REPO_NAME"
  echo "    Created $KEY. Adding it to $DUSER@$HOST (you may be asked for your normal SSH login)..."
  ssh -p "$PORT" "$DUSER@$HOST" 'cat >> ~/.ssh/authorized_keys' < "$KEY.pub"
fi
gh variable set STAGING_HOST --body "$HOST"
gh variable set STAGING_USER --body "$DUSER"
gh variable set STAGING_PORT --body "$PORT"
gh variable set STAGING_DOMAIN --body "$DOMAIN"
gh secret set STAGING_SSH_KEY < "$KEY"
ssh-keyscan -p "$PORT" "$HOST" 2>/dev/null | gh secret set STAGING_KNOWN_HOSTS
echo "    Staging configured."
gh api -X PUT "repos/$REPO/environments/staging" >/dev/null && echo "    'staging' environment created"

echo "==> 6/6 Protect main (needs GitHub Pro/Team for private repos)"
if gh api -X PUT "repos/$REPO/branches/main/protection" --input - >/dev/null 2>&1 <<JSON
{
  "required_status_checks": { "strict": true, "contexts": ["test"] },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 1 },
  "restrictions": null
}
JSON
then
  echo "    main now requires a passing 'test' check and one approval."
else
  echo "    Skipped: branch protection isn't available for private repos on the free plan."
  echo "    The flow still works; just never merge a PR you haven't reviewed."
fi

cat <<DONE

All set. One manual step left:
  Install the Claude GitHub App on this repo: https://github.com/apps/claude
  (choose "Only select repositories" -> $REPO)

Then try it:
  gh issue create --title "Delete a habit" --body "I want to be able to remove a habit I no longer track." --label refine
DONE
