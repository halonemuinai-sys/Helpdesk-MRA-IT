---
name: helpdesk-mra-system-reference
description: Referensi arsitektur teknis terpadu, struktur database Prisma, fitur IT Subscriptions & ISP, IT Cost Overview, dan roadmap pengembangan menu baru "Budgeting Project & Innovation" untuk Helpdesk MRA IT.
---

# Helpdesk MRA IT System Reference & Project Roadmap

Dokumen ini berisi referensi lengkap mengenai arsitektur sistem, struktur database PostgreSQL (Prisma ORM), fitur-fitur terkini (IT Subscriptions, ISP, IT Cost Overview), serta panduan analisa untuk pengembangan menu baru **Budgeting Project & Innovation**.

---

## 1. Arsitektur Teknis & Tech Stack

- **Frontend:** React (Vite, Tailwind CSS v3/v4, Lucide React Icons, ApexCharts, Framer Motion)
- **Backend:** Node.js, Express.js REST API, Prisma ORM
- **Database:** PostgreSQL (Supabase / Proxmox VM)
- **Deployment:** Ubuntu Proxmox VM (`/var/www/helpdesk-mra/Helpdesk-MRA-IT`)
  - Server Update script: `update-helpdesk.sh` (`git pull origin main && VITE_API_URL=/api npm run build && pm2 restart helpdesk-api`)
  - Database schema sync: `npx prisma db push`

---

## 2. Struktur Data & Fitur Terkini

### A. Entitas Perusahaan
- `CompanyMaster`: Entitas Legal / Holding PT (misal: `PT Mogems Indonesia`, `PT MRA Media`, `PT Mugi Rekso Abadi`, `PT Media Mugi Rekso`, `PT Hourlogy Indah Perkasa`, dll).
- `Company`: Cabang / Gedung / Unit Operasional.

### B. Subskripsi IT & ISP (`ITSubscription`)
- **Category:** `ISP`, `Hosting`, `Domain`, `VPN`, `Subscription`, `Security`, `Sewa Printer`, `Others`.
- **Company Master & Entitas Terotorisasi:**
  - `companyMasterId`: PT Pemilik Kontrak / Holding.
  - `authorizedCompanyMasterId`: PT / Entitas MRA yang diotorisasi (opsional).
- **Brand System (Dual Brand):**
  - **Brand MRA (`MRA_BRANDS`):** List merek usaha bersih MRA (`Bvlgari`, `Wiggle Wiggle`, `Cosmopolitan`, `Harper's Bazaar`, `Her World`, `Hard Rock FM`, `Trax FM`, `iRadio`, `Brava Radio`, `Häagen-Dazs`, `Hard Rock Cafe`, `Parentalk`, `MRA Head Office / HQ`).
  - **Brand Layanan / Vendor (`brand`):** Text bebas produk vendor (`Google Workspace`, `Biznet Metronet`, `Adobe CC`, dll).
- **Detail Khusus ISP:**
  - `contractNumber`: Nomor Kontrak Billing / Circuit ID / Customer ID ISP.
  - `bandwidth`: Kapasitas Bandwidth (misal: `100 Mbps Dedicated 1:1`, `50 Mbps Broadband`, `1 Gbps`).
- **Siklus & Biaya:** `billingCycle` (`1 Bulan`, `3 Bulan`, `6 Bulan`, `1 Tahun`, `2 Tahun`, `3 Tahun`), `cost` (Nominal Rp), `startDate`, `expiryDate`, `status` (`ACTIVE`, `EXPIRED`, `INACTIVE`).

### C. Ringkasan Biaya IT (`IT Cost Overview`)
- Menyatukan 4 Komponen Pengeluaran:
  1. `Peripherals`: Pembelian Perangkat/Invoice IT
  2. `Sewa Aset`: Rental Laptop & Device
  3. `Subscription`: Software, Hosting, Cloud, Lisensi
  4. `Internet ISP`: Koneksi Internet & CID Billing
- **Logika Alokasi Biaya:**
  - `1 Bulan` (Bulanan): Nominal biaya terhitung pada setiap bulan aktif selama masa kontrak.
  - `1 Tahun` / Multi-bulan: Nominal biaya terhitung pada bulan awal (`startDate`), bulan ulang tahun penagihan, dan bulan perpanjangan (`renewals`).
  - Subskripsi berstatus `INACTIVE` yang memiliki riwayat biaya/pernah aktif pada tahun berjalan tetap dihitung untuk akurasi laporan historis.
- **KPI Cards Dinamis:**
  - Tanpa Filter Tahun: Menampilkan biaya bulan terakhir (`currentMonthSummary`) berlabel bulan presisi (misal: `Ags 26`).
  - Dengan Filter Tahun (misal `2025`): Otomatis beralih menampilkan **Total Akumulasi Biaya 1 Tahun Penuh** (`grandTotal`) untuk tahun tersebut (misal: `Internet ISP (2025)`).

---

## 3. Rencana Pengembangan Menu Baru: Budgeting Project & Innovation

Menu ini ditujukan untuk perencanaan, penganggaran, pengajuan, approval, dan pemantauan realisasi proyek IT serta inovasi teknologi di seluruh unit bisnis MRA Group.

### A. Usulan Entitas & Model Data Baru (`schema.prisma`)

```prisma
enum ProjectCategory {
  INFRASTRUCTURE
  SOFTWARE_DEVELOPMENT
  CYBERSECURITY
  DIGITAL_TRANSFORMATION
  AI_INNOVATION
  HARDWARE_REFRESH
  OTHERS
}

enum ProjectStatus {
  DRAFT
  PROPOSED
  APPROVED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  ON_HOLD
}

enum BudgetPriority {
  CRITICAL
  HIGH
  MEDIUM
  LOW
}

model ITProjectBudget {
  id                      String           @id @default(uuid())
  projectCode             String           @unique // e.g. "PRJ-2026-001"
  projectName             String
  category                ProjectCategory  @default(DIGITAL_TRANSFORMATION)
  description             String?
  
  // Entitas Pemilik & Sponsor Proyek
  companyMasterId         Int
  companyMaster           CompanyMaster    @relation(fields: [companyMasterId], references: [id])
  brand                   String?          // e.g. "Bvlgari", "Cosmopolitan", "Wiggle Wiggle"
  
  // Anggaran & Realisasi
  fiscalYear              Int              // e.g. 2026
  allocatedBudget         Float            // Pagu Anggaran (CAPEX/OPEX)
  actualCost              Float            @default(0) // Realisasi Pengeluaran Saat Ini
  remainingBudget         Float            @default(0) // Sisa Anggaran
  budgetType              String           @default("CAPEX") // CAPEX vs OPEX
  
  priority                BudgetPriority   @default(MEDIUM)
  status                  ProjectStatus    @default(PROPOSED)
  
  // Timeline
  startDate               DateTime?
  targetCompletionDate    DateTime?
  actualCompletionDate    DateTime?
  
  // Penanggung Jawab & Tim
  projectManager          String?
  vendor                  String?          // Vendor Pelaksana (jika outsourcing)
  notes                   String?
  
  // Timestamps & Audit
  createdAt               DateTime         @default(now())
  updatedAt               DateTime         @updatedAt
  
  // Relasi ke Subskripsi atau Invoice yang Dihasilkan
  expenses                ITProjectExpense[]
}

model ITProjectExpense {
  id                      String           @id @default(uuid())
  projectId               String
  project                 ITProjectBudget  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  description             String
  amount                  Float
  expenseDate             DateTime         @default(now())
  invoiceNumber           String?
  vendor                  String?
  receiptLink             String?
  status                  String           @default("PAID") // PAID, PENDING, REJECTED
  
  createdAt               DateTime         @default(now())
}
```

### B. Usulan Fitur Utama Halaman "Budgeting Project & Innovation"

1. **Dashboard KPI & Summary Analytics:**
   - **Total Pagu Anggaran Proyek (CAPEX & OPEX)** per Tahun Fiskal.
   - **Realisasi Biaya vs Sisa Anggaran** (Visual Gauge / Progress Bar per Proyek & per Entitas).
   - **Inovasi & Proyek Berjalan (In-Progress vs Planned vs Completed)**.

2. **Management & Tracking Table:**
   - Pencarian & Filter berdasarkan Tahun Fiskal, Entitas MRA, Brand MRA, Kategori Proyek, dan Status.
   - Indikator Status Kesehatan Anggaran (Overbudget Alert jika `actualCost > allocatedBudget`).
   - Detail Drawer / Modal untuk penginputan pengeluaran proyek (`ITProjectExpense`) dan pembaruan timeline.

3. **Integrasi ke IT Cost Overview:**
   - Menghubungkan realisasi proyek IT (CAPEX/OPEX) ke laporan IT Cost Overview sehingga pengeluaran proyek inovasi dapat disandingkan dengan biaya ops rutin (Subscription, ISP, Sewa Aset, Peripherals).

---

## 4. Panduan Transisi ke Claude AI

Saat melanjutkan percakapan dengan Claude:
1. Referensikan file `SKILL.md` ini di repositori atau minta Claude membaca file [helpdesk-mra-system-reference/SKILL.md](file:///d:/Private%20Project/Helpdesk%20MRA/.agents/skills/helpdesk-mra-system-reference/SKILL.md).
2. Tinjau usulan skema database `ITProjectBudget` & `ITProjectExpense` di atas.
3. Lanjutkan analisa wireframe UI/UX, rute Express backend, dan alur penganggaran proyek IT MRA Group.
