# Viva360 Security Runbook — Secret Rotation and Git History Cleanup

Date: 2026-02-24
Scope: operational remediation for exposed secrets in git history and oversized `.git` caused by tracked `node_modules`.

## Why this is not auto-executed in code changes
This requires coordinated operational work and a force-push rewrite of `main`. Running it silently would break every collaborator clone and can lock out deployments if secret rotation order is wrong.

## Preconditions
- Maintenance window approved
- One owner for Git history rewrite
- One owner for Vercel + Supabase secret rotation
- Confirm current production values (do not reuse historical values)
- Freeze merges to `main` during the window

## 1. Rotate secrets first (before rewriting history)
Rotate **all** secrets that may have been exposed in git history:
- `JWT_SECRET`
- `JWT_REFRESH_SECRET` (if still used)
- `DATABASE_URL`
- `DIRECT_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY` (recommended rotation if exposure is uncertain)
- `SUPABASE_URL` (URL itself is not secret, but verify endpoint/project correctness)
- Any OAuth client secrets (Google) if ever committed historically
- `RESEND_API_KEY`, `SENTRY_AUTH_TOKEN`, `LOGROCKET_APP_ID` secrets/tokens if applicable

### Rotation order (safe)
1. Generate/store new secrets in secret manager (1Password/Vault/Bitwarden enterprise)
2. Update Vercel project env vars (Production + Preview as needed)
3. Update Supabase/DB credentials
4. Redeploy and verify health (`/api/health`)
5. Invalidate old tokens/sessions if policy requires it
6. Only then proceed with git history cleanup

## 2. Rewrite git history to purge sensitive files
Choose **one** tool. Prefer `git filter-repo` (modern) or BFG.

### Option A (recommended): git-filter-repo
Install:
- macOS: `brew install git-filter-repo`

From a fresh mirror clone:
```bash
git clone --mirror git@github.com:baljp/Viva360.git Viva360.git-mirror
cd Viva360.git-mirror
```

Purge sensitive files and bulky folders from history:
```bash
git filter-repo \
  --path .env \
  --path backend/.env \
  --path backend/node_modules \
  --invert-paths
```

Optional: purge any accidental env-like files by pattern (review carefully first):
```bash
git filter-repo --path-glob '*.env' --invert-paths
```

Force-push rewritten history:
```bash
git push --force --all
git push --force --tags
```

### Option B: BFG Repo-Cleaner
Install Java + BFG, then run on a mirror clone:
```bash
java -jar bfg.jar --delete-files .env
java -jar bfg.jar --delete-files .env.example
java -jar bfg.jar --delete-folders backend/node_modules --no-blob-protection
```
Then:
```bash
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force --all
git push --force --tags
```

## 3. Post-cleanup verification (mandatory)
Run these checks on the rewritten repo:
```bash
# no tracked env files in HEAD
git ls-files | rg '(^|/)\.env($|\.)'

# secrets no longer present in history (sample patterns)
git log -p --all -- .env backend/.env

git rev-list --objects --all | rg 'backend/node_modules|(^|/)\.env$'
```

Project checks:
```bash
npm ci
npm run lint
npm run typecheck:frontend
npm run test:backend
npm run test:qa:core:critical
npm run vercel-build
```

## 4. Team coordination after force-push (mandatory)
All collaborators must re-clone or hard-reset after confirming no local work is pending.

Safer instruction to collaborators:
```bash
# preferred
mv Viva360 Viva360_old_backup

git clone git@github.com:baljp/Viva360.git
```

## 5. Extra hardening (recommended)
- Enable GitHub secret scanning and push protection
- Add CI check for tracked `.env` files (HEAD) if not already present
- Keep `scripts/audit_tracked_secrets.ts` in CI gate
- Document incident internally (date, scope, rotated secrets, verification owner)

## 6. Rollback strategy (if rewrite goes wrong)
- Keep the mirror clone backup before push
- Tag pre-rewrite tip locally (`pre-history-cleanup-backup`)
- If required, force-push backup refs immediately and re-open maintenance window

