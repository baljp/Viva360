#!/bin/bash
echo "--- NEW RUN ---"
git add .
git status
git commit -m "chore: force update for vercel-supabase production"
git push origin main --force 2>&1
