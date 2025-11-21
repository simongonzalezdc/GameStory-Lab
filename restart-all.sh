#!/bin/bash

echo "🛑 Killing all dev processes..."
pkill -f "vite" 2>/dev/null
pkill -f "tsx watch" 2>/dev/null
pkill -f "concurrently" 2>/dev/null
sleep 1

echo "🐳 Restarting Docker services..."
docker-compose restart

echo "⏳ Waiting for services to be ready..."
sleep 3

echo "🚀 Starting all dev servers..."
npm run dev

