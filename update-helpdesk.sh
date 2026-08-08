#!/bin/bash
# Script untuk memperbarui Helpdesk MRA di server Proxmox VM
# Jalankan dengan: ./update-helpdesk.sh

# Arahkan ke folder proyek
APP_DIR="/var/www/helpdesk-mra/Helpdesk-MRA-IT"

if [ ! -d "$APP_DIR" ]; then
  echo "❌ Error: Direktori proyek $APP_DIR tidak ditemukan!"
  exit 1
fi

cd "$APP_DIR" || exit

echo "=================================================="
echo " 🔄 MEMULAI PEMBARUAN APLIKASI HELPDESK MRA IT"
echo "=================================================="
echo ""

# 1. Ambil Update dari Git
echo "[1/4] Menarik kode terbaru dari GitHub..."
git pull origin main
echo "✓ Git pull selesai."
echo ""

# 2. Build Frontend
echo "[2/4] Mengompilasi Ulang Frontend (React)..."
cd "$APP_DIR/frontend"
npm install --prefer-offline
VITE_API_URL=/api npm run build
echo "✓ Frontend berhasil dikompilasi."
echo ""

# 3. Update Backend & Prisma Client
echo "[3/4] Menyiapkan Dependensi Backend & Prisma..."
cd "$APP_DIR/backend"
npm install --prefer-offline
npx prisma generate
npx prisma migrate deploy
echo "✓ Dependensi backend & Prisma Client siap."
echo ""

# 4. Restart Service API dengan PM2
echo "[4/4] Merestart Service API (PM2)..."
pm2 restart helpdesk-api || pm2 start api/index.js --name helpdesk-api
pm2 save
echo ""

echo "=================================================="
echo " 🎉 PEMBARUAN SELESAI & BERHASIL DITERAPKAN!"
echo "=================================================="
echo " • Frontend : https://helpdesk2.mra.co.id"
echo " • API URL  : https://helpdesk2.mra.co.id/api"
echo "=================================================="
