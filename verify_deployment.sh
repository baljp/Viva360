#!/bin/bash

echo "🚀 Starting Silent Verification (E2E & QA)..."

# 1. Check if server is running (simple check)
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Server detected on port 3000"
else
    echo "⚠️  Server not running on port 3000. Starting in background..."
    # Start server with MOCK_MODE=false to test real logic, or true if requested
    # Assuming production-like test
    export APP_MODE=PROD
    
    # Use potential varying commands
    if [ -f "backend/src/server.ts" ]; then
        npx ts-node backend/src/server.ts &
        SERVER_PID=$!
        echo "   (Server PID: $SERVER_PID)"
        sleep 10 # Wait for boot
    else
        npm run start &
        SERVER_PID=$!
        sleep 10
    fi
fi

# 2. Run Backend E2E Flow
echo "\n🧪 Running Backend E2E Flow..."
if [ -f "backend/e2e_flow.ts" ]; then
    # Try running with ts-node
    if npx ts-node backend/e2e_flow.ts; then
        echo "✅ Backend E2E Passed"
    else
        echo "❌ Backend E2E Failed"
        # Don't exit yet, run QA
    fi
else
    echo "⚠️  backend/e2e_flow.ts not found"
fi

# 3. Run Silent Playwright (QA)
# Only if configured
if [ -f "playwright.config.ts" ]; then
    echo "\n🎭 Running Playwright (Silent)..."
    # Run only critical tests or a smoke test to be fast
    if npx playwright test --reporter=list; then
        echo "✅ QA/Playwright Passed"
    else
        echo "❌ QA/Playwright Failed"
    fi
else
    echo "ℹ️  No Playwright config found, skipping QA."
fi

# Cleanup
if [ ! -z "$SERVER_PID" ]; then
    echo "\nStopping temporary server ($SERVER_PID)..."
    kill $SERVER_PID
fi

echo "\n🏁 Verification Complete."
