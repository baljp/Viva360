#!/bin/bash
# CHAOS MONKEY SCRIPT for Docker Compose
# Randomly kills services to test docker-compose restart policies

SERVICES=("viva360-api-1" "viva360-db-1" "viva360-redis-1")

echo "🐒 Starting Chaos Monkey..."

while true; do
  # Wait random time (10-30s)
  SLEEP_TIME=$((10 + RANDOM % 20))
  echo "Waiting ${SLEEP_TIME}s..."
  sleep $SLEEP_TIME

  # Pick random service
  SERVICE=${SERVICES[$RANDOM % ${#SERVICES[@]}]}
  
  echo "💥 KA-POW! Killing $SERVICE"
  docker kill $SERVICE

  # Check if it restarts (assuming restart: always in compose)
  sleep 5
  STATUS=$(docker inspect -f '{{.State.Status}}' $SERVICE 2>/dev/null)
  
  if [ "$STATUS" == "running" ] || [ "$STATUS" == "restarting" ]; then
      echo "✅ $SERVICE recovered successfully."
  else
      echo "❌ $SERVICE failed to recover! Alert SRE!"
  fi
done
