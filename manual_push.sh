#!/bin/bash
echo "--- VIVA360 MANUAL PUSH ---"
echo "Remote: $(git remote get-url origin)"
echo "Branch: $(git branch --show-current)"
echo "---------------------------"
echo "Pushing..."
git push -u origin HEAD:main
echo "---------------------------"
echo "If prompted, please enter your GitHub username and Personal Access Token."
