#!/bin/bash
echo "--- START GIT DEBUG ---"
git remote -v
echo "--- PUSHING TO MAIN ---"
git push -v -f origin HEAD:main > git_debug.log 2>&1
EXIT_CODE=$?
echo "--- PUSH FINISHED (Exit: $EXIT_CODE) ---"
if [ $EXIT_CODE -ne 0 ]; then
  echo "--- TRYING MASTER ---"
  git push -v -f origin HEAD:master >> git_debug.log 2>&1
fi
echo "--- DONE ---"
