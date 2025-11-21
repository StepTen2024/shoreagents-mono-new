#!/bin/bash

# 🚀 ROCK SOLID DEV STARTUP SCRIPT
# This ensures clean builds EVERY TIME to prevent 404 errors

echo "🧹 Cleaning old builds..."
rm -rf .next node_modules/.cache

echo "🔨 Building Next.js (ensures static assets exist)..."
npx next build

echo "🚀 Starting development server..."
cross-env NODE_ENV=development node server.js

