# Panduan Penggunaan & Panduan Developer: IT Helpdesk MRA Group

Aplikasi **IT Helpdesk Perusahaan** modular ini terbagi menjadi **Frontend (Vite + React)** dan **Backend (Express.js + Prisma ORM)**. Proyek ini terintegrasi dengan database **Supabase (PostgreSQL)**, manajemen SLA, sistem notifikasi email otomatis via **Turbify Yahoo SMTP**, dan sistem kategori dinamis.

---

## 1. Struktur Proyek

*   **[backend/](file:///D:/Private%20Project/Helpdesk%20MRA/backend)**: Server REST API Express.js.
    *   `prisma/schema.prisma`: Skema database (relasi perusahaan, karyawan, kategori metadata, prioritas tiket, audit log, dan detail SLA).
    *   `prisma/seed.js`: Skrip seeding data perusahaan, karyawan, dan metadata kategori ke database.
    *   `routes/`: Rute modular API (otentikasi, tiket, perusahaan, laporan, dll.).
    *   `api/email.js`: Modul pengirim email otomatis (Nodemailer).
*   **[frontend/](file:///D:/Private%20Project/Helpdesk%20MRA/frontend)**: Aplikasi dashboard React.js + Tailwind CSS.
    *   `src/pages/`: Halaman modular (Login, Dashboard, Input Ticket, Tickets List, Analysis Reports, Agent KPI, User Management, Category Settings, Guideline).
    *   `src/components/`: Komponen UI reusable (Sidebar, SearchableSelect, ReactLoader, Modal detail).

---

## 2. Langkah Instalasi & Hubungkan Database (Supabase)

### Langkah A: Konfigurasi Variabel Lingkungan (`.env` di backend)
1. Buka folder **backend/**.
2. Buat file `.env` dan isi dengan konfigurasi berikut:
   ```env
   # Database connection strings (Supabase)
   DATABASE_URL="postgresql://postgres.dfughwonwxowjjgfvhxu:Kmzway87aa%21%21@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=helpdesk"
   DIRECT_URL="postgresql://postgres.dfughwonwxowjjgfvhxu:Kmzway87aa%21%21@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?schema=helpdesk"

   # JWT Secret Key
   JWT_SECRET="helpdesk-mra-super-secret-key-123"

   # Port configuration
   PORT=5000

   # Turbify Yahoo SMTP Settings (Notifikasi Email)
   SMTP_HOST="smtp.bizmail.yahoo.com"
   SMTP_PORT=465
   SMTP_USER="helpdesk@mraretail.co.id"
   SMTP_PASS="epsxvvjlalpjazav"
   SMTP_FROM="helpdesk@mraretail.co.id"
   ```

### Langkah B: Instalasi Dependensi Backend & Migrasi Database
Buka terminal pada folder `backend/` dan jalankan secara berurutan:
```bash
# 1. Install dependencies
npm install

# 2. Kirim skema tabel ke Supabase
npx prisma db push

# 3. Generate Prisma Client
npx prisma generate

# 4. Jalankan Seed Data (Impor 693 data karyawan & 30 data kategori/sub-kategori bawaan)
npm run prisma:seed
```

---

## 3. Cara Menjalankan Aplikasi Secara Lokal

### Menjalankan Backend:
Buka terminal pada folder `/backend` dan jalankan:
```bash
npm run dev
```
*Server API aktif di `http://localhost:5000`.*

### Menjalankan Frontend:
Buka terminal baru pada folder `/frontend` dan jalankan:
```bash
npm run dev
```
*Aplikasi Dashboard aktif di `http://localhost:5173`.*

---

## 4. Kredensial Tes & Fitur Utama

### Akun Uji Coba:
*   **Kata Sandi (Semua Akun):** `Password123!`
*   **Akun Administrator (Akses Penuh):** `admin@mragroup.co.id`
*   **Akun IT Agent Support (KPI & Tiket):** `agent@mragroup.co.id`

---

## 5. Panduan Fitur & Alur Kerja Utama

### A. Alur Pembuatan Tiket & SLA
1. Buka halaman **Input Ticket** (akses untuk Agent/Admin).
2. Cari nama karyawan pelapor menggunakan pencarian pintar.
3. Pilih **Category** (Hardware, Software, Network, Access).
4. Klik **Sub-Category / Detailing**. Pilihan dropdown otomatis tersaring berdasarkan kategori utama.
   * **Fitur Tambah Instan**: Jika sub-kategori tidak ada di database, ketik nama sub-kategori baru lalu klik opsi `+ Add "[nama]" as new detailing`. Sistem akan mendaftarkannya secara otomatis ke database ketika tiket dikirim.
5. Pilih prioritas (SLA Target akan dihitung otomatis):
   * **HIGH**: Tanggapan pertama (30 menit) & resolusi pengerjaan (2 jam).
   * **MEDIUM**: Tanggapan pertama (2 jam) & resolusi pengerjaan (6 hours).
   * **LOW**: Tanggapan pertama (4 jam) & resolusi pengerjaan (24 hours).
6. **Incident Backdating (Retroaktif)**: Agent dapat menginput waktu kejadian masa lalu secara kustom, dan SLA akan otomatis dihitung mundur dari waktu tersebut.

### B. Notifikasi Email Otomatis (Turbify Yahoo SMTP)
Sistem otomatis mengirimkan email konfirmasi ke pelapor dan penugasan ke agen:
* **Tiket Terdaftar**: Pelapor menerima email tanda terima berisi ID Tiket (`MRA-xxxxx`) dan detail SLA.
* **Tiket Ditugaskan**: IT Agent menerima notifikasi email penugasan tugas baru beserta deskripsi lengkap kendala.
* **Pembaruan Status & Catatan**: Setiap agen mengubah status tiket (menjadi `IN_PROGRESS`, `PENDING`, atau `RESOLVED`), sistem mengirim email ke pelapor berisi catatan tindakan mandatori yang ditulis oleh agen IT.

### C. Menu Master "Category Settings"
* Terbuka bagi **Agent** dan **Admin** di Sidebar (`/categories`).
* Digunakan untuk mengelola (melihat, mencari, menambah, dan menghapus) sub-kategori masalah per kategori utama secara langsung.

### D. Fitur Pendukung Lainnya
* **Collapsible Sidebar**: Sidebar navigasi yang dapat diciutkan secara responsif dengan transisi animasi micro-interaction dan floating tooltips.
* **Advanced User Management**: Manajemen 690+ data karyawan dengan pemilah parameter multi-kolom sisi server (*server-side lazy loading*).
* **Forgot Password**: Alur lupa sandi menggunakan token JWT yang didelegasikan ke email (logs backend untuk mode pengembangan lokal).
* **Analysis Reports & KPI Dashboard**: Metrik visual kepatuhan SLA tim IT, Spotlight Agent, dan rata-rata waktu respons dengan filter saringan Bulan/Tahun berjalan.
