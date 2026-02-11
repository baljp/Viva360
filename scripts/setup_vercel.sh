#!/bin/bash

# Viva360 - Automated Vercel Setup Script
# This script injects ALL environment variables from .env.local into Vercel

ENV_FILE=".env.local"

echo "🌱 Starting Viva360 Auto-Integration..."

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ $ENV_FILE not found. Please ensure it exists."
    exit 1
fi

# Check if Vercel CLI is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js/npm."
    exit 1
fi

echo "🔄 Syncing variables from $ENV_FILE to Vercel..."

# Read .env.local and push each variable
while read -r line || [ -n "$line" ]; do
    # Skip comments and empty lines
    [[ "$line" =~ ^#.*$ ]] && continue
    [[ -z "$line" ]] && continue
    
    # Extract key and value
    key=$(echo "$line" | cut -d'=' -f1)
    # Extract value and strip quotes
    value=$(echo "$line" | cut -d'=' -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    if [ -n "$key" ] && [ -n "$value" ]; then
        echo "Pushing $key..."
        # Push to all 3 environments
        echo "$value" | npx vercel env add "$key" production --force &> /dev/null
        echo "$value" | npx vercel env add "$key" preview --force &> /dev/null
        echo "$value" | npx vercel env add "$key" development --force &> /dev/null
        
        if [ $? -eq 0 ]; then
            echo "  ✅ $key synced."
        else
            echo "  ❌ Failed to sync $key."
        fi
    fi
done < "$ENV_FILE"

echo "🚀 All variables synced! Triggering a fresh production deploy..."
npx vercel --prod --yes --force
