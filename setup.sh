#!/bin/bash

# ==============================================================================
# SCRIPT SETUP OTOMATIS: IT HELPDESK & ASSET MANAGEMENT MRA
# OS Target: Ubuntu 22.04 LTS / Ubuntu 24.04 LTS (Proxmox LXC/VM)
# ==============================================================================

# Hentikan eksekusi jika ada error
set -e

echo "=== 1. UPDATE & UPGRADE SYSTEM ==="
sudo apt update && sudo apt upgrade -y

echo "=== 2. INSTALL PREREQUISITES ==="
sudo apt install -y curl git nginx build-essential

echo "=== 3. INSTALL NODE.JS 20 (LTS) ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo "=== 4. VERIFIKASI INSTALASI ==="
node -v
npm -v

echo "=== 5. INSTALL PM2 (PROCESS MANAGER) ==="
sudo npm install -g pm2

echo "=== 6. MENYIAPKAN FOLDER APLIKASI ==="
sudo mkdir -p /var/www/helpdesk-mra
sudo chown -R $USER:$USER /var/www/helpdesk-mra
cd /var/www/helpdesk-mra

echo "=== 7. CLONE REPOSITORI ==="
# Catatan: Ganti URL repositori jika menggunakan repositori privat/berbeda
if [ ! -d "Helpdesk-MRA-IT" ]; then
  git clone https://github.com/halonemuinai-sys/Helpdesk-MRA-IT.git Helpdesk-MRA-IT
fi
cd Helpdesk-MRA-IT

echo "=== 8. INSTALL DEPENDENSI & BUILD FRONTEND ==="
cd frontend
npm install
npm run build
cd ..

echo "=== 9. INSTALL DEPENDENSI BACKEND ==="
cd backend
npm install
# Catatan: Pastikan file .env diisi dengan variabel lingkungan database Anda sebelum menjalankan migrasi prisma
echo "Pengingat: Konfigurasikan file /var/www/helpdesk-mra/Helpdesk-MRA-IT/backend/.env dengan database URL Anda sebelum menjalankan backend."
cd ..

echo "=== 10. KONFIGURASI PM2 STARTUP ==="
# Membuat PM2 menyala otomatis saat server boot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME || true

echo "=== 11. KONFIGURASI NGINX TEMPLATE ==="
# Template konfigurasi Nginx dasar untuk reverse proxy
cat << 'EOF' > /tmp/helpdesk-nginx.conf
server {
    listen 80;
    server_name helpdesk.mra.local; # Ganti dengan domain lokal Anda

    # Frontend Static Files
    location / {
        root /var/www/helpdesk-mra/Helpdesk-MRA-IT/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo mv /tmp/helpdesk-nginx.conf /etc/nginx/sites-available/helpdesk
sudo ln -sf /etc/nginx/sites-available/helpdesk /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default || true

echo "=== SETUP SELESAI ==="
echo "Langkah selanjutnya:"
echo "1. Edit konfigurasi database di: /var/www/helpdesk-mra/Helpdesk-MRA-IT/backend/.env"
echo "2. Jalankan backend menggunakan PM2: cd /var/www/helpdesk-mra/Helpdesk-MRA-IT/backend && pm2 start server.js --name helpdesk-api"
echo "3. Simpan konfigurasi PM2: pm2 save"
echo "4. Uji dan restart Nginx: sudo nginx -t && sudo systemctl restart nginx"
