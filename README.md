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

### 1. Staging on the VPS

Staging runs like the other sites on the VPS: an `nginx:alpine` container named
`habit-tracker-staging` on the `webproxy` network, behind nginx-proxy and acme-companion,
at https://habit-tracker-staging.dcvanegmond.nl (covered by the `*.dcvanegmond.nl` wildcard).

On every merge to `main`, GitHub Actions tests and builds the app, rsyncs `Dockerfile`,
`deploy/nginx.conf` and `dist/` to `~/habit-tracker-staging-build/` on the host, runs
`docker build` there and restarts the container with `VIRTUAL_HOST`/`LETSENCRYPT_HOST`
set. There's no registry. Nothing needs to be installed on the server first.

### 2. A dedicated deploy key

GitHub Actions logs in with its own key, never your personal one:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/habit-tracker-deploy -N "" -C "github-actions habit-tracker"
cat ~/.ssh/habit-tracker-deploy.pub | ssh cloud 'cat >> ~/.ssh/authorized_keys'
ssh -i ~/.ssh/habit-tracker-deploy dvanegmond@149.210.201.94 docker ps --format '{{.Names}}' | head -3
```

Then add the secrets and variables (or run the setup script below):

```bash
R=dcvanegmond/habit-tracker
gh secret set STAGING_SSH_KEY -R $R < ~/.ssh/habit-tracker-deploy
ssh-keyscan 149.210.201.94 2>/dev/null | gh secret set STAGING_KNOWN_HOSTS -R $R
gh variable set STAGING_HOST   -R $R --body 149.210.201.94
gh variable set STAGING_USER   -R $R --body dvanegmond
gh variable set STAGING_DOMAIN -R $R --body habit-tracker-staging.dcvanegmond.nl
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
- **Deploy fails on SSH:** check the `STAGING_*` secrets and variables under
  Settings → Secrets and variables → Actions, and that the deploy key's public half is in
  `~/.ssh/authorized_keys` of `dvanegmond` on the VPS.
- **Smoke test gets 503:** the container isn't on `webproxy`, or nginx-proxy is still
  reloading. Check with `ssh cloud docker logs habit-tracker-staging --tail 20`.
- **Claude runs out of turns:** raise `--max-turns` in the workflow, or split the ticket.

## Starter tickets

Good first tickets to try the flow with:

- Delete a habit (with a confirmation)
- Show the last 7 days for each habit as small dots
- Dark mode that follows the system setting
- Rename a habit
