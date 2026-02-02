#!/bin/bash

echo "🚀 [E2E] Starting Robust Lifecycle Management..."

# 1. Kill any existing server on port 3000
echo "🧹 Cleaning port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# 2. Start the server in the background
echo "📡 Starting Backend Server (MOCK_MODE)..."
npx tsx backend/src/server.ts > server.log 2>&1 &
SERVER_PID=$!

# 3. Wait for health check (max 60s)
echo "⏳ Waiting for Health Check..."
MAX_RETRIES=60
RETRY_COUNT=0
while true; do
  if curl -s http://127.0.0.1:3000/api/health > /dev/null; then
    echo "✅ Server is HEALTHY!"
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT+1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❌ Server failed to start in time. Check server.log"
    kill $SERVER_PID
    exit 1
  fi
  sleep 1
done

# 4. Run the Stress Test
echo "🔥 Running Golden Stress Test..."
npx ts-node backend/golden_stress_test.ts

# 5. Cleanup
echo "🛑 Shutting down server..."
kill $SERVER_PID
echo "✨ E2E lifecycle complete."
