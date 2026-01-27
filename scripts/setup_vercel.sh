#!/bin/bash

# Viva360 - Automated Vercel Setup Script
# This script injects Supabase environment variables into Vercel

echo "🌱 Starting Viva360 Auto-Integration..."

# Check if Vercel CLI is available
if ! command -v npx vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it first."
    exit 1
fi

# Load variables from .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo "✅ Local .env loaded."
else
    echo "⚠️ .env file not found. Using defaults."
fi

# Function to add env var safely
add_env() {
    local name=$1
    local value=$2
    if [ -n "$value" ]; then
        echo "Pushing $name to Vercel..."
        echo "$value" | npx vercel env add "$name" production --force
        echo "$value" | npx vercel env add "$name" preview --force
        echo "$value" | npx vercel env add "$name" development --force
    fi
}

echo "⛓️ Connecting to Supabase..."
add_env "VITE_SUPABASE_URL" "$VITE_SUPABASE_URL"
add_env "VITE_SUPABASE_ANON_KEY" "$VITE_SUPABASE_ANON_KEY"

# Optional: Add Prisma URLs if needed for edge functions
if [ -n "$DATABASE_URL" ]; then
    add_env "DATABASE_URL" "$DATABASE_URL"
fi

echo "🚀 Integration prepared! Run 'npx vercel' to deploy."
