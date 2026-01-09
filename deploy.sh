#!/bin/bash

# Kumbh Sarthi - Vercel Deployment Script
# This script will guide you through deploying to Vercel

echo "🙏 Kumbh Sarthi - Vercel Deployment"
echo "===================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo "📝 Please edit .env and add your VITE_GEMINI_API_KEY before deploying"
    echo ""
fi

# Read Gemini API key from .env
GEMINI_KEY=$(grep VITE_GEMINI_API_KEY .env | cut -d '=' -f2)

if [ -z "$GEMINI_KEY" ] || [ "$GEMINI_KEY" = "your_gemini_api_key_here" ]; then
    echo "❌ Error: VITE_GEMINI_API_KEY not set in .env file"
    echo "Please get your API key from: https://aistudio.google.com/apikey"
    echo "And update the .env file"
    exit 1
fi

echo "✅ Environment variables configured"
echo ""

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
echo ""
echo "You will need to:"
echo "1. Login to Vercel (if not already logged in)"
echo "2. Link to your project (or create a new one)"
echo "3. Confirm deployment settings"
echo ""
echo "Important: Make sure to set VITE_GEMINI_API_KEY in Vercel environment variables!"
echo ""

# Run Vercel deployment
npx vercel

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "📱 Access your apps:"
echo "   - Pilgrim App: https://your-domain.vercel.app/"
echo "   - Control Dashboard: https://your-domain.vercel.app/?mode=admin"
echo ""
echo "🔧 Don't forget to:"
echo "   1. Set VITE_GEMINI_API_KEY in Vercel project settings"
echo "   2. (Optional) Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
echo ""
echo "🙏 Deployment complete!"
