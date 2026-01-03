#!/bin/bash

# RemoteHive Deployment Script
# Deploys all services to Railway using the CLI

echo "🚀 Starting RemoteHive Deployment..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Check for Railway CLI
if ! command_exists railway; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli || { echo "Failed to install Railway CLI"; exit 1; }
fi

echo "✅ Railway CLI is ready."

# 2. Deploy Backend API (FastAPI)
echo "-----------------------------------"
echo "📦 Deploying Backend API (FastAPI)..."
cd app
if [ -f "../Procfile" ]; then
    # We are in app/, but Procfile is in root usually for monorepo if deploying root
    # But here we want to deploy just this service.
    # Assuming the user has linked this directory or we use the service ID from deploy.yml
    railway up --service 75010098-894c-45ba-9c3d-3cf5d2706ef4 --detach
else
    echo "⚠️  Could not find app configuration. Skipping..."
fi
cd ..

# 3. Deploy Django Admin
echo "-----------------------------------"
echo "📦 Deploying Django Admin..."
cd backend_django
# User needs to link this service first or provide ID
# railway up --service <DJANGO_SERVICE_ID> --detach
railway up --detach
cd ..

# 4. Deploy Admin Panel (Next.js)
echo "-----------------------------------"
echo "📦 Deploying Admin Panel..."
cd remotehive-admin
railway up --detach
cd ..

# 5. Deploy Public Website
echo "-----------------------------------"
echo "📦 Deploying Public Website..."
cd remotehive-public
railway up --detach
cd ..

echo "-----------------------------------"
echo "🎉 Deployment triggers sent! Check Railway dashboard for progress."
echo "🔗 Dashboard: https://railway.app/dashboard"
