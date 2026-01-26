#!/bin/bash
echo "--- REMOTE CONFIG ---"
git remote -v
echo "--- CURRENT BRANCH ---"
git branch --show-current
echo "--- LOCAL COMMITS VS REMOTE ---"
git log -n 3 --oneline
echo "--- ATTEMPTING FORCE PUSH ---"
git add .
git commit -m "feat: final vercel and supabase production sync" || echo "Nothing to commit"
git push https://github.com/baljp/Viva360.git main --force 2>&1
