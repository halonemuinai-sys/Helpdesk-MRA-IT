# 1. Gunakan base image Node.js versi 20 Debian slim yang andal untuk Prisma
FROM node:20-slim

# Install OpenSSL yang dibutuhkan oleh Prisma binary engine
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 2. Set direktori kerja di dalam kontainer ke /app
WORKDIR /app

# 3. Salin berkas package.json dan package-lock.json terlebih dahulu
COPY package*.json ./

# 4. Salin folder prisma untuk generator client
COPY prisma ./prisma

# 5. Install seluruh dependencies (hanya production agar ukuran image kecil)
RUN npm install --production

# 6. Generate Prisma client untuk koneksi database
RUN npx prisma generate

# 7. Salin seluruh sisa kode program backend dari komputer ke dalam kontainer
COPY . .

# 8. Buka port 5000 (port default backend Anda) agar bisa diakses dari luar kontainer
EXPOSE 5000

# 9. Perintah untuk menjalankan aplikasi backend Anda saat kontainer dinyalakan
CMD ["node", "api/index.js"]
