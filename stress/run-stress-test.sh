#!/bin/bash
# =============================================================
# VIVA360 STRESS TEST — QUICK RUN SCRIPT
# =============================================================

set -e

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
OUTPUT_DIR="./results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

mkdir -p "$OUTPUT_DIR"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

check_k6() {
  if ! command -v k6 &> /dev/null; then
    log_error "k6 is not installed"
    exit 1
  fi
}

health_check() {
  log_info "Checking API health at $BASE_URL/api/health..."
  if curl -s -f "$BASE_URL/api/health" > /dev/null 2>&1; then
    log_success "API is healthy"
    return 0
  else
    log_error "API is not reachable at $BASE_URL"
    exit 1
  fi
}

# Quick test (100 VUs, 1 minute)
run_quick() {
  check_k6
  health_check
  log_info "Running quick test: 100 VUs for 1 minute"
  k6 run --vus 100 --duration 1m --out json="$OUTPUT_DIR/quick_${TIMESTAMP}.json" --env BASE_URL="$BASE_URL" viva360-stress-test.js
  log_success "Results: $OUTPUT_DIR/quick_${TIMESTAMP}.json"
}

# Smoke test (50 VUs, 5 minutes)
run_smoke() {
  check_k6
  health_check
  log_info "Running smoke test: 50 VUs for 5 minutes"
  k6 run --vus 50 --duration 5m --out json="$OUTPUT_DIR/smoke_${TIMESTAMP}.json" --env BASE_URL="$BASE_URL" viva360-stress-test.js
  log_success "Results: $OUTPUT_DIR/smoke_${TIMESTAMP}.json"
}

# Stress test (Full Scenario)
run_stress() {
  check_k6
  health_check
  log_info "Running Full Scenario Stress Test (20k Plan)"
  k6 run --out json="$OUTPUT_DIR/stress_${TIMESTAMP}.json" --env BASE_URL="$BASE_URL" viva360-stress-test.js
  log_success "Results: $OUTPUT_DIR/stress_${TIMESTAMP}.json"
}

case "${1:-help}" in
  quick) run_quick ;;
  smoke) run_smoke ;;
  stress) run_stress ;;
  *)
    echo "Usage: $0 {quick|smoke|stress}"
    ;;
esac
