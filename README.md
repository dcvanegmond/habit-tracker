# Habit Tracker

A tiny habit-tracking web app, used to test an AI development flow on GitHub
with Claude Code.

## The flow

| Step | You | Claude / GitHub |
|---|---|---|
| 1. Refine | Write an issue, add the `refine` label | Claude rewrites it with goal, acceptance criteria and a plan → `awaiting-approval` (or asks questions → `needs-info`) |
| 2. Approve | Read the plan. Edit it if needed, then swap the label to `approved` | Claude creates a branch, implements it, adds tests, runs them, opens a PR → `in-review` |
| 3. Test | – | CI runs `npm test` and `npm run build` on the PR |
| 4. AI review | – | Claude reviews the PR with inline comments and a summary |
| 5. Your review | Review the PR. Comment `@claude please fix …` for changes | Claude pushes fixes to the same PR |
| 6. Staging | Merge the PR | Tests, build and rsync to your VPS. The issue closes and the PR gets a "Deployed" comment |

If Claude asked questions (`needs-info`), answer them in a comment and add `refine` again.

## One-time setup

### 1. On your VPS

Create a deploy user and folder, and serve the folder with your web server:

```bash
sudo adduser --disabled-password deploy
sudo mkdir -p /var/www/habit-tracker-staging
sudo chown deploy:deploy /var/www/habit-tracker-staging
```

Example nginx site:

```nginx
server {
    listen 80;
    server_name staging.example.com;
    root /var/www/habit-tracker-staging;
    index index.html;
}
```

### 2. On your Mac: a dedicated deploy key

Use a separate key just for deploys, never your personal SSH key:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/habit-tracker-deploy -N "" -C "github-actions habit-tracker"
ssh-copy-id -i ~/.ssh/habit-tracker-deploy.pub deploy@staging.example.com
```

### 3. Configure the repo

From a clone of this repo on your Mac:

```bash
brew install gh          # if needed
gh auth login            # if needed
./scripts/setup-github.sh
```

The script creates the private repo if it doesn't exist yet, the labels, the
`CLAUDE_CODE_OAUTH_TOKEN` secret (from `claude setup-token`), the staging secrets and
variables, and tries to protect `main`. It's safe to run again.

### 4. Install the Claude GitHub App

Install it on this repo only: https://github.com/apps/claude

This matters: PRs and commits made with the app trigger CI and the review workflow.
Ones made with the default `GITHUB_TOKEN` would not.

## Local development

```bash
npm ci
npm run dev     # http://localhost:5173
npm test
npm run build
```

## Troubleshooting

- **Nothing happens when I add a label:** check the Actions tab. Workflows only run
  once they're on `main`.
- **CI or review doesn't run on Claude's PR:** the Claude GitHub App probably isn't
  installed on the repo, so the workflows fell back to `GITHUB_TOKEN`.
- **Deploy fails on SSH:** check the four `STAGING_*` variables and two secrets under
  Settings → Secrets and variables → Actions, and that the deploy key is in
  `~deploy/.ssh/authorized_keys` on the server.
- **Claude runs out of turns:** raise `--max-turns` in the workflow, or split the ticket.

## Starter tickets

Good first tickets to try the flow with:

- Delete a habit (with a confirmation)
- Show the last 7 days for each habit as small dots
- Dark mode that follows the system setting
- Rename a habit
