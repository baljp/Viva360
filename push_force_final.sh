#!/bin/bash
LOGFILE="push_log.txt"
rm -f "$LOGFILE"
echo "--- FETCH ---" >> "$LOGFILE"
git fetch origin >> "$LOGFILE" 2>&1
echo "--- ADD ---" >> "$LOGFILE"
git add . >> "$LOGFILE" 2>&1
echo "--- COMMIT ---" >> "$LOGFILE"
git commit --allow-empty -m "chore: force update final" >> "$LOGFILE" 2>&1
echo "--- PUSH ---" >> "$LOGFILE"
git push origin HEAD --force >> "$LOGFILE" 2>&1
echo "--- DONE ---" >> "$LOGFILE"
