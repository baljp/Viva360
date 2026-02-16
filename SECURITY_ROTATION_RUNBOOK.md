# Viva360 Security Rotation Runbook (P0)

This project previously had `.env` / `.env.production` committed in git history.
Even after removal, treat any credentials that were present as **compromised**.

## Goals (Done Criteria)

1. Rotate all secrets that may have been exposed.
2. Verify production still works (`https://viva360.vercel.app`).
3. Ensure CI blocks any future reintroduction of env files or secrets.

## Immediate Actions

### 1) GitHub

1. Revoke any GitHub Personal Access Token (PAT) that was ever shared or stored in env files.
2. Prefer GitHub CLI auth (`gh auth login`) for local workflows instead of PAT in files.

### 2) Supabase Project

Rotate:

1. `SUPABASE_SERVICE_ROLE_KEY` (service role key)
2. `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY` (anon/public key)
3. Supabase database password / connection string credentials behind:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `SUPABASE_POOLER_URL` (if used)

After rotation:

1. Update Vercel env vars (Production + Preview).
2. Confirm Supabase Auth redirects remain correct:
   - Site URL: `https://viva360.vercel.app`
   - Redirect URLs: `https://viva360.vercel.app/login` and `https://viva360.vercel.app/*`

### 3) Viva360 Backend JWT

Rotate:

1. `JWT_SECRET`
2. (Optional, recommended) `INVITE_JWT_SECRET`

After rotation:

1. Existing sessions will be invalidated (expected). Users must re-login.

### 4) Vercel Environment Variables

Update (Production + Preview) with the rotated values, at minimum:

- `JWT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `DIRECT_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_AUTH_REDIRECT_URL`
- `VITE_OAUTH_ALLOWED_ORIGINS`

Then redeploy.

## Verification Checklist

Run:

- `npm run qa:regression-checklist`
- `npm run qa:audit-tracked-secrets -- --strict`

Production smoke (manual):

1. Email login works
2. Google login redirect starts
3. `/api/health` returns JSON (no crash loop)

## Notes

- Do not commit any `.env*` files (only `.env.example` is acceptable).
- Store secrets only in Vercel env vars or a secret manager.

