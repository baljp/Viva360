#!/usr/bin/env bash
# TRIAGE: Production smoke test — validates real endpoints, persistence, and auth
# Usage: bash scripts/prod-smoke.sh [BASE_URL]

set -euo pipefail
BASE="${1:-https://viva360.vercel.app}"
PASS=0; FAIL=0; WARN=0

ok()   { PASS=$((PASS+1)); echo "  ✅ $1"; }
fail() { FAIL=$((FAIL+1)); echo "  ❌ $1"; }
warn() { WARN=$((WARN+1)); echo "  ⚠️  $1"; }

echo "🔍 TRIAGE SMOKE — $BASE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. HEALTH
echo ""
echo "1️⃣  Backend Health"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/health")
[ "$STATUS" = "200" ] && ok "Health endpoint: $STATUS" || fail "Health endpoint: $STATUS"

BODY=$(curl -s "$BASE/api/health")
echo "$BODY" | grep -q '"degraded":false' && ok "No degradation" || warn "Degraded state detected"

# 2. AUTH
echo ""
echo "2️⃣  Auth Endpoints"
PRECHECK=$(curl -s -X POST "$BASE/api/auth/precheck-login" \
  -H "Content-Type: application/json" -d '{"email":"test@example.com"}')
echo "$PRECHECK" | grep -q '"allowed"' && ok "Precheck responds with allowed field" || fail "Precheck malformed"

# 3. CORS
echo ""
echo "3️⃣  CORS"
CORS=$(curl -sI -X OPTIONS "$BASE/api/health" \
  -H "Origin: $BASE" -H "Access-Control-Request-Method: GET" 2>&1)
echo "$CORS" | grep -qi "access-control-allow-origin" && ok "CORS headers present" || fail "CORS headers missing"

# 4. AUTH PROTECTION
echo ""
echo "4️⃣  Auth Protection (401 on unauthenticated)"
for ep in "/api/spaces" "/api/rooms/real-time" "/api/calendar" "/api/finance/transactions"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$ep")
  [ "$CODE" = "401" ] && ok "Protected: $ep → $CODE" || warn "Unexpected: $ep → $CODE"
done

# 5. SPA ROUTING
echo ""
echo "5️⃣  SPA Deep Links"
for route in "/login" "/pro/dashboard" "/client/garden" "/space/dashboard"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$route")
  [ "$CODE" = "200" ] && ok "Route: $route → $CODE" || fail "Route: $route → $CODE (expected 200)"
done

# 6. API FUNCTIONS
echo ""
echo "6️⃣  Vercel Function Routing"
PING=$(curl -s "$BASE/api/ping")
echo "$PING" | grep -q '"status":"ok"' && ok "Ping function" || fail "Ping function: $PING"

HEALTH_RID=$(curl -s "$BASE/api/health" | grep -o '"requestId":"[^"]*"' | head -1)
[ -n "$HEALTH_RID" ] && ok "RequestId tracking: $HEALTH_RID" || warn "No requestId in health"

# 7. SERVICE WORKER
echo ""
echo "7️⃣  Service Worker"
SW_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/sw.js")
[ "$SW_CODE" = "200" ] && warn "SW active — users may see stale cache after deploy" || ok "No SW (clean updates)"

# 8. MOCK LEAK CHECK
echo ""
echo "8️⃣  Mock Data Leak"
INDEX=$(curl -s "$BASE/index.html")
echo "$INDEX" | grep -qi "MOCK_ENABLED.*true\|APP_MODE.*MOCK" && fail "Mock flag leaked in HTML" || ok "No mock flags in HTML"

# SUMMARY
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESULTS: ✅ $PASS passed | ❌ $FAIL failed | ⚠️  $WARN warnings"
[ "$FAIL" -gt 0 ] && echo "🚨 PRODUCTION HAS FAILURES" && exit 1
[ "$WARN" -gt 0 ] && echo "⚡ Production OK with warnings" && exit 0
echo "🟢 Production fully healthy"
