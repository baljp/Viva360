#!/bin/bash
LOGFILE="/Users/joaobatistaramalhodelima/.gemini/antigravity/brain/7e589fd0-1ff7-4584-ac23-20673b0e0392/git_debug.log"
rm -f "$LOGFILE"
echo "--- STATUS ---" >> "$LOGFILE"
git status >> "$LOGFILE" 2>&1
echo "--- REMOTE ---" >> "$LOGFILE"
git remote -v >> "$LOGFILE" 2>&1
echo "--- BRANCH ---" >> "$LOGFILE"
git branch >> "$LOGFILE" 2>&1
echo "--- FORCE PUSH ---" >> "$LOGFILE"
git add . >> "$LOGFILE" 2>&1
git commit --allow-empty -m "chore: robust force sync" >> "$LOGFILE" 2>&1
git push origin HEAD --force >> "$LOGFILE" 2>&1
