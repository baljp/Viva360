#!/usr/bin/env bash
# smart_deploy.sh
# Uso: export GITHUB_TOKEN=seu_token_aqui
#       ./smart_deploy.sh
set -euo pipefail

REPO="baljp/Viva360"
REMOTE="origin"
BRANCH="main"
COMMIT_MSG="feat: atualização final para produção vercel"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_BRANCH="backup/origin-main-${TIMESTAMP}"
GITHUB_API="https://api.github.com"
GH_TOKEN="${GITHUB_TOKEN:-}"

# Requirements: git, curl, jq
for cmd in git curl jq; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERROR: required command not found: $cmd" >&2
    exit 10
  fi
done

echo "==> Repo: ${REPO}  Branch: ${BRANCH}"
if [ -z "$GH_TOKEN" ]; then
  echo "ERROR: GITHUB_TOKEN not set. Export GITHUB_TOKEN with repo scope." >&2
  exit 2
fi

echo "==> Status (porcelain):"
git status --porcelain
echo

# Configure author if provided via env
if [ -n "${GIT_AUTHOR_NAME:-}" ]; then git config user.name "${GIT_AUTHOR_NAME}"; fi
if [ -n "${GIT_AUTHOR_EMAIL:-}" ]; then git config user.email "${GIT_AUTHOR_EMAIL}"; fi

# Stage & commit (only if changes present)
echo "==> Staging and committing (if any changes)..."
git add .
if git diff --cached --quiet; then
  echo "No staged changes to commit."
else
  git commit -m "${COMMIT_MSG}"
  echo "Committed changes."
fi
echo

# Fetch remote state
echo "==> Fetching remote ${REMOTE}..."
git fetch "${REMOTE}" --prune

echo "==> Local -> Remote commits (to be pushed):"
git log --oneline --graph --decorate "${REMOTE}/${BRANCH}..${BRANCH}" || true
echo
echo "==> Remote -> Local commits (you don't have):"
git log --oneline --graph --decorate "${BRANCH}..${REMOTE}/${BRANCH}" || true
echo

# Create remote backup branch
echo "==> Creating remote backup branch: ${BACKUP_BRANCH}"
git branch --force "${BACKUP_BRANCH}" "${REMOTE}/${BRANCH}" || true
git push "${REMOTE}" "${BACKUP_BRANCH}:${BACKUP_BRANCH}" --force
echo "Backup pushed: ${REMOTE}/${BACKUP_BRANCH}"
echo

# Check branch protection
ENC_REPO="$(echo "${REPO}" | sed 's/\//%2F/g')"
PROT_URL="${GITHUB_API}/repos/${REPO}/branches/${BRANCH}/protection"
echo "==> Checking branch protection via API..."
PROT_RESP="$(curl -sS -H "Authorization: token ${GH_TOKEN}" -H "Accept: application/vnd.github+json" "${PROT_URL}" || true)"
# Attempt safe parsing; if unreadable, just print
if echo "${PROT_RESP}" | jq . >/dev/null 2>&1; then
  echo "${PROT_RESP}" | jq '{allow_force_pushes: .allow_force_pushes, required_status_checks: .required_status_checks}'
else
  echo "Branch protection response (raw):"
  echo "${PROT_RESP}"
fi
ALLOW_FORCE_PUSHES="$(echo "${PROT_RESP}" | jq -r '.allow_force_pushes // "null"')"

if [ "${ALLOW_FORCE_PUSHES}" = "true" ]; then
  echo "Note: branch protection allows force pushes."
else
  echo "Note: branch protection does not allow force pushes (or unknown). Will try --force-with-lease first."
fi
echo

# Attempt safe force push
echo "==> Attempting: git push --force-with-lease ${REMOTE} ${BRANCH}"
set +e
git push --force-with-lease "${REMOTE}" "${BRANCH}"
PUSH_EXIT=$?
set -e

if [ $PUSH_EXIT -eq 0 ]; then
  echo "SUCCESS: pushed ${BRANCH} to ${REMOTE} with --force-with-lease."
  exit 0
fi

echo "WARNING: push --force-with-lease failed (exit ${PUSH_EXIT}). Capturing server message..."
set +e
git push "${REMOTE}" "${BRANCH}" 2>&1 | sed 's/^/git-push: /g' || true
set -e
echo

# Fallback: create branch and open PR
FALLBACK_BRANCH="feat/auto-deploy-vercel-${TIMESTAMP}"
echo "==> Creating fallback branch ${FALLBACK_BRANCH} from local ${BRANCH}"
git checkout -b "${FALLBACK_BRANCH}" "${BRANCH}"
echo "==> Pushing fallback branch ${FALLBACK_BRANCH} to ${REMOTE}"
git push "${REMOTE}" "${FALLBACK_BRANCH}:${FALLBACK_BRANCH}"

PR_TITLE="[auto] deploy: atualização final para produção vercel"
PR_BODY="Automated PR created because direct push to ${BRANCH} was blocked.\n\nBackup branch: ${BACKUP_BRANCH}\n\nCommit message: ${COMMIT_MSG}"
PR_PAYLOAD=$(jq -n --arg t "$PR_TITLE" --arg h "$FALLBACK_BRANCH" --arg b "$BRANCH" --arg body "$PR_BODY" '{title:$t, head:$h, base:$b, body:$body, maintainer_can_modify:true}')

echo "==> Creating Pull Request (${FALLBACK_BRANCH} -> ${BRANCH})"
PR_RESP=$(curl -sS -X POST -H "Authorization: token ${GH_TOKEN}" -H "Accept: application/vnd.github+json" \
  "${GITHUB_API}/repos/${REPO}/pulls" -d "${PR_PAYLOAD}" || true)

if echo "${PR_RESP}" | jq . >/dev/null 2>&1; then
  PR_URL="$(echo "${PR_RESP}" | jq -r '.html_url // empty')"
  if [ -n "${PR_URL}" ]; then
    echo "PR created: ${PR_URL}"
    echo "SUCCESS: Fallback PR criado."
    exit 0
  else
    echo "ERROR: Falha ao criar PR. Resposta:"
    echo "${PR_RESP}" | jq . || echo "${PR_RESP}"
    exit 3
  fi
else
  echo "ERROR: Resposta inesperada ao criar PR:"
  echo "${PR_RESP}"
  exit 3
fi
