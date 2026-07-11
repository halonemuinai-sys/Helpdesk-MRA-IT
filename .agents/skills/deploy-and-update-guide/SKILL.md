---
name: deploy-and-update-guide
description: Panduan langkah-demi-langkah untuk melakukan deployment, penarikan pembaruan (git pull), kompilasi ulang frontend (build), dan restart service backend dengan PM2 pada server Ubuntu Proxmox.
---

# Deploy and Update Guide (Helpdesk MRA Server)

Panduan ini digunakan oleh Agen AI untuk mengetahui cara melakukan deploy dan menerapkan perubahan kode terbaru ke server produksi Ubuntu Proxmox.

## 1. Lokasi Direktori Proyek di Server
- **Path Proyek Utama:** `/var/www/helpdesk-mra/Helpdesk-MRA-IT`
- **Frontend Path:** `/var/www/helpdesk-mra/Helpdesk-MRA-IT/frontend`
- **Backend Path:** `/var/www/helpdesk-mra/Helpdesk-MRA-IT/backend`

## 2. Alur Penerapan Perubahan (Update Workflow)

Setiap kali ada perubahan kode di repositori lokal dan ingin dideploy ke server produksi, ikuti instruksi berikut:

### Langkah A: Tarik Kode Terbaru di Server
Gunakan PuTTY/Terminal SSH untuk masuk ke direktori kerja utama dan jalankan perintah penarikan Git:
```bash
cd /var/www/helpdesk-mra/Helpdesk-MRA-IT
git pull origin main
```

### Langkah B: Jika Ada Perubahan Frontend
Jika perubahan terjadi pada area visual, komponen React, atau halaman frontend:
1. Pindah ke direktori frontend:
   ```bash
   cd /var/www/helpdesk-mra/Helpdesk-MRA-IT/frontend
   ```
2. Jalankan build dengan menyuntikkan environment variable `VITE_API_URL` secara inline (wajib menggunakan `/api` sebagai proxy relatif Nginx):
   ```bash
   VITE_API_URL=/api npm run build
   ```
3. Nginx akan mendeteksi perubahan file di folder `dist/` secara otomatis tanpa perlu restart service Nginx.

### Langkah C: Jika Ada Perubahan Backend / Database Schema
Jika perubahan terjadi pada file rute Express.js, skema Prisma, atau logika server API:
1. Pindah ke direktori backend:
   ```bash
   cd /var/www/helpdesk-mra/Helpdesk-MRA-IT/backend
   ```
2. Jalankan instalasi dependensi jika ada penambahan package baru di `package.json`:
   ```bash
   npm install
   ```
3. Jika skema Prisma (`schema.prisma`) mengalami perubahan, regenerasi Prisma Client:
   ```bash
   npx prisma generate
   ```
4. Restart proses API backend menggunakan Process Manager (PM2):
   ```bash
   pm2 restart helpdesk-api
   ```

## 3. Perintah Diagnostik & Monitoring Server
Untuk memantau aktivitas server backend di produksi, gunakan perintah-perintah berikut:
- **Melihat logs real-time:** `pm2 logs helpdesk-api --lines 50`
- **Melihat status aplikasi:** `pm2 status`
- **Melihat logs Nginx:** `sudo tail -f /var/log/nginx/error.log`
