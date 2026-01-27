#!/bin/bash

# Viva360 - Automated Prisma Database Sync
# target: Supabase

echo "🔄 Initializing Database Sync..."

# Load local .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Ensure DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in .env."
    exit 1
fi

echo "🚀 Syncing schema to Supabase..."
npx prisma db push --schema=./backend/prisma/schema.prisma

# Verify success
if [ $? -eq 0 ]; then
    echo "✅ Database synchronized successfully!"
else
    echo "❌ Synchronization failed. Check your connection string and password."
    exit 1
fi
