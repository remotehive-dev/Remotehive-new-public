#!/bin/bash
# Fail on any error
set -e

echo "=== STARTING CUSTOM REMOTEHIVE PUBLIC BUILD ==="

# 1. Clean Vite cache to prevent EBUSY errors
if [ -d "node_modules/.cache" ]; then
    echo "🧹 Cleaning node_modules/.cache to avoid file locking issues..."
    rm -rf node_modules/.cache
fi

# 2. Ensure dependencies are installed (redundant but safe)
if [ ! -d "node_modules" ]; then
    echo "📦 node_modules missing, running npm install..."
    npm install --no-audit --no-fund
fi

# 3. Run the actual build
echo "🚀 Running Vite build..."
npm run build

echo "=== BUILD COMPLETE ==="
