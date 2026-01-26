#!/bin/bash
LOGFILE="retry_push.log"
exec > >(tee -a "$LOGFILE") 2>&1

echo "--- STARTING RETRY PUSH ---"
date

# Ensure correct user config
git config user.email "antigravity@google.com"
git config user.name "Antigravity AI"

# Set remote just in case
git remote set-url origin https://github.com/baljp/Viva360.git

echo "--- STATUS ---"
git status

echo "--- ADDING ---"
git add .

echo "--- COMMITTING ---"
git commit -m "chore: retry force update for vercel deployment" || echo "Nothing to commit"

echo "--- PUSHING ---"
# Using -v for verbose
git push origin main --force -v

echo "--- FINISHED ---"
date
