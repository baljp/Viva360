#!/bin/bash
echo "Starting Wrapper at $(pwd)"
touch wrapper_started.txt
npx ts-node e2e_full.ts > results.log 2>&1
EXIT_CODE=$?
echo "Wrapper Finished with exit code $EXIT_CODE"
