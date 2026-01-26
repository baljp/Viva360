#!/bin/bash
export GIT_TERMINAL_PROMPT=0
git config user.email "antigravity@google.com"
git config user.name "Antigravity AI"
echo "--- STAGING ---"
git add .
echo "--- COMMITTING ---"
git commit -m "feat: stable production version for Vercel/Supabase" || echo "Nothing to commit"
echo "--- PUSHING ---"
git push https://github.com/baljp/Viva360.git main --force
echo "--- DONE ---"
