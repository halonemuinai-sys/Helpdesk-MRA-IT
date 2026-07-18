#!/bin/bash
# Deploy script — jalankan di server: bash deploy.sh
set -e

APP_DIR="/var/www/helpdesk-mra/Helpdesk-MRA-IT"

echo "=== [1/4] Pull latest code ==="
cd "$APP_DIR"
git pull origin main

echo "=== [2/4] Build frontend ==="
cd "$APP_DIR/frontend"
npm install --prefer-offline
VITE_API_URL=/api npm run build

echo "=== [3/4] Install backend dependencies ==="
cd "$APP_DIR/backend"
npm install --prefer-offline

echo "=== [4/4] Restart backend via PM2 ==="
pm2 restart helpdesk-api || pm2 start api/index.js --name helpdesk-api
pm2 save

echo ""
echo "✓ Deploy selesai!"
echo "  Frontend build: $APP_DIR/frontend/dist"
echo "  Backend PM2:    helpdesk-api (port 5000)"
