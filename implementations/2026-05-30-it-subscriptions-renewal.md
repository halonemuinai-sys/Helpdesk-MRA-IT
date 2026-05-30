# Dokumen Spesifikasi Implementasi: IT Subscriptions & Renewal Management

* **Tanggal Dokumentasi**: 30 Mei 2026
* **Status**: Menunggu Persetujuan Code-Change
* **Fitur**: Modul Manajemen Perpanjangan Layanan & Subskripsi IT (Subscription, Hosting, Domain, VPN, ISP, dll.)

---

## 1. Latar Belakang & Kebutuhan Fitur
Departemen IT MRA Group membutuhkan sebuah modul khusus untuk memantau siklus hidup (*lifecycle*) seluruh kontrak layanan IT. Layanan ini mencakup:
* **Hosting Kontrak**: Ex. Niagahoster, AWS, Vercel
* **Domain Kontrak**: Ex. mragroup.co.id, example.com
* **VPN & ISP (Internet Service Provider)**: Ex. Biznet, Telkom, Lintasarta
* **Software Subscriptions**: Ex. Google Workspace, Microsoft 365, Adobe CC

Modul ini memfasilitasi pencatatan biaya, siklus penagihan yang bervariasi, masa aktif (tanggal mulai & kedaluwarsa), tautan bukti fisik/kontrak (*evidence link*), catatan teknis, serta pencatatan historis perpanjangan (*renewal journey*).

---

## 2. Struktur Basis Data (Prisma Schema)

Dua model baru akan ditambahkan ke skema database PostgreSQL Supabase:

### A. Model `ITSubscription` (Data Utama Layanan)
Mencatat informasi terkini dari layanan IT yang aktif/tidak aktif.
```prisma
model ITSubscription {
  id             String           @id @default(uuid())
  category       String           // e.g. "Hosting", "Domain", "VPN", "ISP", "Subscription", "Others"
  vendor         String           // Penyedia jasa (e.g. Google, Niagahoster)
  name           String           // Nama layanan / Domain (e.g. "Google Workspace", "mra.co.id")
  billingCycle   String           // Siklus penagihan: "1 Bulan", "3 Bulan", "6 Bulan", "1 Tahun", "2 Tahun", "3 Tahun"
  cost           Float            // Biaya layanan dalam Rupiah (e.g. 150000)
  startDate      DateTime         // Tanggal mulai aktif kontrak
  expiryDate     DateTime         // Tanggal akhir aktif kontrak (kedaluwarsa)
  status         String           @default("ACTIVE") // Status: "ACTIVE" (Aktif), "EXPIRED" (Kedaluwarsa), "INACTIVE" (Tidak Aktif)
  evidenceLink   String?          // URL Link bukti pembayaran/kontrak (Google Drive, dll.)
  notes          String?          // Catatan tambahan (IP, Akun Admin, dll.)
  journey        String?          @default("") // Akumulasi log catatan pembaruan teks
  renewals       RenewalHistory[] // Relasi historis perpanjangan
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  @@index([category])
  @@index([status])
  @@index([expiryDate])
}
```

### B. Model `RenewalHistory` (Log Historis Perpanjangan)
Merekam jejak setiap kali layanan diperpanjang oleh tim IT beserta rincian biaya pada saat itu.
```prisma
model RenewalHistory {
  id             String         @id @default(uuid())
  subscriptionId String
  subscription   ITSubscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  renewedAt      DateTime       @default(now())
  cost           Float          // Biaya perpanjangan saat tindakan dilakukan
  period         String         // Durasi perpanjangan (e.g., "1 Tahun")
  notes          String?        // Catatan perpanjangan (e.g., "Diperpanjang 2 tahun per 6 bulan (Rp 300rb)")
}
```

---

## 3. Spesifikasi REST API Backend (Express.js)

Endpoint diletakkan pada berkas `/backend/routes/subscriptions.js` dan dilindungi oleh autentikasi JWT (`verifyToken`):

### 1. `GET /api/subscriptions`
Mengambil seluruh daftar layanan IT dengan filter dinamis.
* **Query Parameters**:
  * `category` (opsional): Saring berdasarkan kategori (`VPN`, `ISP`, dll.)
  * `status` (opsional): Saring berdasarkan status (`ACTIVE`, `EXPIRED`)
  * `search` (opsional): Melacak kata kunci pada `name` atau `vendor`.
* **Response**: Array of `ITSubscription` beserta relasi `renewals`.

### 2. `POST /api/subscriptions`
Mendaftarkan layanan baru pertama kali.
* **Request Body**:
  * `category` (Wajib)
  * `vendor` (Wajib)
  * `name` (Wajib)
  * `billingCycle` (Wajib)
  * `cost` (Wajib)
  * `startDate` (Wajib)
  * `expiryDate` (Wajib)
  * `status` (Wajib)
  * `evidenceLink` (Opsional)
  * `notes` (Opsional)
* **Response**: Objek data `ITSubscription` yang berhasil disimpan.

### 3. `PUT /api/subscriptions/:id`
Memperbarui metadata layanan atau melakukan perpanjangan (*renewal*).
* **Request Body**:
  * Seluruh field di atas.
  * `updateJourney` (Opsional): Jika diisi teks (misal: *"Diperpanjang 1 tahun (Rp 150rb)"*), backend akan otomatis:
    1. Menyisipkan entitas baru di tabel `RenewalHistory`.
    2. Menambahkan teks tersebut ke field `journey` pada tabel `ITSubscription` beserta stempel tanggal.
    3. Menggeser `expiryDate` maju sesuai masa perpanjangannya.

### 4. `DELETE /api/subscriptions/:id`
Menghapus layanan dari database (sekaligus menghapus riwayat perpanjangannya karena relasi CASCADE).

---

## 4. Rencana Desain Antarmuka Frontend (UI/UX)

Halaman diletakkan pada berkas `/frontend/src/pages/Subscriptions.jsx` dengan tata letak premium:

### A. Kartu Ringkasan KPI Layanan (Summary Cards HUD)
* **Active Subscriptions**: Menampilkan jumlah total kontrak berstatus `ACTIVE`.
* **Upcoming Expiry**: Jumlah layanan yang masa aktifnya habis dalam waktu **< 30 hari** (berwarna kuning/oranye).
* **Expired Services**: Layanan yang tanggal kedaluwarsanya sudah terlewati (berwarna merah).
* **Estimated Budget**: Estimasi pengeluaran per bulan / per tahun (dihitung proporsional dari biaya & siklus penagihan).

### B. Formulir Input "Tambah Layanan Baru" / "Edit Layanan"
Menyesuaikan struktur form persis seperti visual gambar mockup:
1. **Kategori**: Dropdown pilihan (`Hosting`, `Domain`, `VPN`, `ISP`, `Subscription`, `Security`, `Others`).
2. **Vendor/Provider**: Input teks (ex. Google, Niagahoster).
3. **Nama Layanan / Domain**: Input teks (ex. Google Workspace, example.com).
4. **Siklus Penagihan**: Dropdown pilihan (`1 Bulan`, `3 Bulan`, `6 Bulan`, `1 Tahun`, `2 Tahun`, `3 Tahun`).
5. **Biaya (RP)**: Input angka rupiah terformat (ex. 150.000).
6. **Tanggal Mulai**: Kalender picker (`DatePicker` / `Input Type Date`).
7. **Tanggal Kedaluwarsa**: Kalender picker (`DatePicker` / `Input Type Date`).
8. **Status**: Dropdown pilihan (`Aktif`, `Kedaluwarsa`, `Tidak Aktif`).
9. **Evidence / Attachment Link**: Input URL link bukti.
10. **Catatan Tambahan**: Textarea untuk konfigurasi IP, akun email, dll.
11. **Update Journey / Perpanjangan**: Textarea khusus untuk menulis log perpanjangan baru.

### C. Visual Riwayat Perjalanan (*Renewal Journey List*)
Ketika baris tabel layanan diklik, tabel akan meluas kebawah (*accordion expand*) untuk memaparkan log berurutan tanggal mengenai kapan saja layanan tersebut diperpanjang, oleh siapa, dan berapa biayanya pada tanggal tersebut.
