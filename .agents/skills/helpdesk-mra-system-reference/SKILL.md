---
name: mra-it-budgeting-system
description: Standard Operating Procedure (SOP), arsitektur teknis, kategori standar, benchmark industri, dan panduan penganggaran (Budgeting & Project Innovation) Departemen IT MRA Retail (4 PT: Permata Landmarq Abadi, Mogems Putri International, Jemma Putri International, Amanda Arumdhani Aishwarya), sinkronisasi Helpdesk MRA (IT Cost Overview: Rental, Renewal, Peripherals, ISP, Projects), analisis unbudgeted items, serta tata cara eliminasi intercompany dan pembentukan 5 file Excel Budget 2027.
---

# Master SOP & System Penganggaran IT MRA Retail (Budgeting, Project & Innovation)

Dokumen ini berisi panduan standar, arsitektur data, metode sinkronisasi data riil, kategori standar, **benchmark industri IT**, aturan pengisian Excel, serta penanganan *intercompany transaction* dan **Budgeting Project & Innovation** Departemen IT di lingkungan **MRA Retail**.

---

## 1. Lingkup Entitas Perusahaan (MRA Retail Group)

Departemen IT mengelola infrastruktur, operasional, dan proyek inovasi teknologi untuk 4 entitas anak perusahaan MRA Retail:

1. **PT Permata Landmarq Abadi** (Holding / Purchasing & Asset Management)
2. **PT Mogems Putri International** (Luxury Retail - Butik Bvlgari Plaza Indonesia & Bali)
3. **PT Jemma Putri International** (Retail Stores & Omnichannel)
4. **PT Amanda Arumdhani Aishwarya** (Retail Expansion Stores)

---

## 2. Kategori Standar Anggaran IT & Benchmark Industri

Untuk menjaga performa dan efisiensi pengeluaran IT MRA Retail, penganggaran dibagi ke dalam **7 Kategori Proyek & Inovasi Standar** serta **3 Pilar Operasional Routine**.

### A. Kategori Standar IT Budgeting & Innovation
```prisma
enum ProjectCategory {
  INFRASTRUCTURE          // Server, Data Center, SD-WAN, Network, UPS, Cloud Infra
  SOFTWARE_DEVELOPMENT    // Custom Web Apps, Mobile Apps, Helpdesk Apps, ERP/POS Dev
  CYBERSECURITY           // Endpoint EDR/SOC, Penetration Testing, Firewall, Zero Trust
  DIGITAL_TRANSFORMATION  // Omnichannel, CRM, VIP Loyalty, Digital Signage, e-Commerce
  AI_INNOVATION           // AI Chatbot Support, Automated Inventory Audit, Customer Insights
  HARDWARE_REFRESH        // Replacement Laptop, POS Terminal Refresh, CCTV NVR Refresh
  OTHERS                  // Audit IT, Legal Compliance, Training & Sertifikasi IT
}
```

### B. Benchmark Alokasi Anggaran IT Industri Ritel (Standard Industry Allocation)

| Pos Pengeluaran IT | Benchmark Alokasi Industri | Alokasi MRA Retail (2027 Proyeksi) | Keterangan & Target |
| :--- | :---: | :---: | :--- |
| **OPEX Rutin (Sewa Device, ISP, Subskripsi)** | **60% – 70%** | **68,5%** *(Rp 316,5 Jt)* | Menjaga kelancaran kasir POS, laptop sales, & internet toko. |
| **CAPEX / Inovasi & Transformasi Digital** | **25% – 35%** | **26,2%** *(Rp 121,0 Jt)* | Modernisasi POS, AI People Counter Megacount, & Omnichannel. |
| **Cybersecurity, Training & Audit** | **5% – 10%** | **5,3%** *(Rp 24,8 Jt)* | EDR Antivirus, Sertifikasi IT, & Audit Keamanan Toko. |
| **TOTAL IT ALLOCATION** | **100%** | **100%** *(Rp 462,3 Jt Bruto)* | **Performa Alokasi Sehat & Sesuai Benchmark Industri.** |

### C. Indikator Kesehatan Anggaran (Budget Health Benchmarks)
- **UNDER_BUDGET / ON_TRACK:** Realisasi Pengeluaran $\le 90\%$ dari Pagu Anggaran.
- **NEAR_LIMIT (Warning Yellow):** Realisasi Pengeluaran $91\% - 100\%$ dari Pagu Anggaran.
- **OVER_BUDGET (Alert Red):** Realisasi Pengeluaran $> 100\%$ dari Pagu Anggaran (`actualCost > allocatedBudget`).

---

## 3. Arsitektur Data Modul IT Cost Overview & Project Budgeting (Helpdesk MRA)

Data anggaran disinkronkan secara langsung dari database **Helpdesk MRA** (`D:\Private Project\Helpdesk MRA`) melalui 2 model utama:

```
+-----------------------------------------------------------------------------------+
|                        5 PILAR PENGELUARAN IT COST OVERVIEW                       |
+-----------------------------------------------------------------------------------+
| 1. Peripherals       : Pembelian hardware eceran/stock (PeripheralInvoice)       |
| 2. Sewa Aset         : Biaya bulanan laptop/mobile (Asset rentalCost)            |
| 3. Subscriptions     : Perpanjangan software, hosting, domain, cloud (ITSub)      |
| 4. Internet (ISP)    : Biaya jaringan internet & leased line toko/kantor (ISP)   |
| 5. Project & Innovation: Pagu anggaran & realisasi proyek IT (ITProjectBudget)   |
+-----------------------------------------------------------------------------------+
```

### Model Data Prisma (`ITProjectBudget` & `ITProjectExpense`):
```prisma
model ITProjectBudget {
  id                      String           @id @default(uuid())
  projectCode             String           @unique // e.g. "PRJ-2027-001"
  projectName             String
  category                ProjectCategory  @default(DIGITAL_TRANSFORMATION)
  companyMasterId         Int
  companyMaster           CompanyMaster    @relation(fields: [companyMasterId], references: [id])
  brand                   String?          // e.g. "Bvlgari", "Wiggle Wiggle"
  fiscalYear              Int              // 2027
  allocatedBudget         Float            // Pagu Anggaran
  actualCost              Float            @default(0) // Realisasi Pengeluaran
  remainingBudget         Float            @default(0)
  budgetType              String           @default("CAPEX") // CAPEX vs OPEX
  priority                BudgetPriority   @default(MEDIUM)
  status                  ProjectStatus    @default(PROPOSED)
  expenses                ITProjectExpense[]
}
```

---

## 4. Rekapitulasi Rencana 2026 vs Realisasi 2026 vs Proyeksi 2027

*(dalam Juta Rupiah)*

| Entitas Perusahaan | Plan 2026 (`Budget 2026.xlsx`) | Realisasi Murni 2026 (`Helpdesk MRA`) | Proyeksi Adjusted 2027 (Bruto) | Proyeksi Netto 2027 (Kas Keluar) | Status Performance & Benchmark |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **PT Mogems Putri Int.** | 367.87 | 353.49 | 332.98 | **138.58** | On Track (Sewa 15 iPhone 15 & Megacount 3D). |
| **PT Permata Landmarq A.** | 53.49 | 82.09 | 79.16 | **79.16** | Holding/Purchasing & Lessor Terpusat. |
| **PT Jemma Putri Int.** | 78.27 | 50.06 | 45.28 | **45.28** | On Track (Efisiensi 4 spare laptop). |
| **PT Amanda Arumdhani A.** | 150.36 | 42.68 | 41.32 | **41.32** | On Track (Penundaan Retailsoft ERP). |
| **TOTAL BRUTO GROUP** | **649.99** | **492.44** | **462.31** | **462.31** | **Bruto Ritel 2026 Hemat 24,2% (Rp 157.55M)** |
| *(Intercompany Elimination)* | *(194.40)* | *(194.40)* | *(194.40)* | **(194.40)** | Eliminasi sewa iPhone 15 internal. |
| **TOTAL NETTO GROUP** | **455.59** | **298.04** | **267.91** | **267.91** | **Beban kas keluar riil IT Group (Hemat 15.8%).** |

---

## 5. Breakdown Kategori Khusus PT Mogems Putri International

- **IT Rental (24 Unit Device):** **Rp 24,20 Juta/bulan** (**Rp 290,38 Juta/tahun**)
  - *15 Unit iPhone 15 Sales Advisor:* Rp 20,25 Juta/bulan (12 unit disewa dari PT Permata @ Rp 1,35M/bln = Rp 194,40M/thn intercompany).
  - *8 Unit Laptop Operasional:* Rp 3,35 Juta/bulan (Rp 40,18 Juta/tahun).
  - *1 Unit Tablet VIP (Samsung Tab S9 FE 5G):* Rp 600 Ribu/bulan (Rp 7,20 Juta/tahun - Expired June 2027).
- **Network & ISP Toko:** **Rp 3,26 Juta/bulan** (**Rp 39,15 Juta/tahun**)
  - Padi Dedicated FO 54Mbps HO (Rp 15,15M/thn) + Biznet 100Mbps Store PI (Rp 12M/thn) + Biznet 100Mbps Store Bali (Rp 12M/thn).
- **Periferal Hardware Toko:** **Rp 20,21 Juta**
  - Megacount 3D People Counter + Bracket (Rp 12,95M), WD Purple 4TB HDD (Rp 3,40M), NVR Hikvision 16CH (Rp 2,55M), UPS APC 1000VA (Rp 1,31M).
- **Lisensi & OMEGA Cloud:** **Rp 3,75 Juta/tahun**
  - OMEGA Cloud Services 3 Counter Store (@ Rp 1,25M/thn). *(Hemat Rp 36M dari maintenance Bvlgari App internal)*.

---

## 6. Audit Unbudgeted Items 2026 (Temuan Kunci)

1. **Item Unbudgeted Murni Ritel 2026 (~Rp 20,21 Juta Periferal + Rp 7,20 Juta Tablet):**
   - Megacount 3D People Counter (Rp 12.95M) atas permintaan *store traffic analytics*.
   - Replacement NVR Hikvision CCTV (Rp 2.55M) & UPS APC (Rp 1.31M) akibat *hardware failure*.
   - Samsung Tab S9 FE 5G (`LP13590`) untuk display VIP Sales Bvlgari.
2. **Mengapa Realisasi 2026 Tetap Lebih Hemat (Rp 492,44M vs Plan Rp 649,99M)?**
   - Di-offset oleh penghematan proyek software/ERP besar yang batal/ditunda: **Retailsoft ERP PT Amanda (Rp 60M)**, **Bvlgari App Maint (Rp 36M)**, dan **Shopify Grow (Rp 9.5M)**.

---

## 7. Logika Khusus Perhitungan IT Rental (Expired & Unit Replacement)

$$\text{Total Anggaran Slot 2027} = \sum_{\text{Jan}}^{M_{\text{expired}}} \text{Cost(Unit A)} + \sum_{M_{\text{expired}}+1}^{\text{Des}} \text{Cost(Unit B)}$$

*Contoh Perangkat Fall-due 2027:*
- `LP13590` (Samsung Tab S9 FE 5G - PT Mogems - VIP Sales Bvlgari) -> Expired 16 Juni 2027.
- `LP14143` (HP ProBook 430 - PT Amanda - Store Operations) -> Expired 03 Oktober 2027.
- `LP12403` (Dell Latitude 5310 - PT Jemma - Finance & Accounting) -> Expired 09 November 2027.

---

## 7.1. Breakdown Biaya Sewa Perangkat per Departemen (Departmental Rental Breakdown)

Setiap aset rental (Laptop, Mobile/iPhone 15 Sales Advisor, Tablet VIP, POS Terminal) dihubungkan dengan pengguna/divisi departemen pengguna:
- **Hierarki Penentuan Departemen:**
  - **Primary (Utama):** `User.department` di database Helpdesk MRA (e.g., `Finance & Accounting`, `Sales & Boutique`, `Store Operations`, `IT Department`, `GA`).
  - **Secondary / Sub-Level:** `User.jobPosition` (Job Title) untuk rincian spesifik peran (e.g., `VIP Sales Advisor`, `Store Manager`).
  - **Shared Store Devices:** Perangkat bersama (POS Kasir, Display Tablet, CCTV NVR) otomatis di-assign ke departemen **`Store Operations`** atau **`IT Infrastructure`**.
- **Modul Budget 360:** Menyediakan filter dan grafik pie/tabel breakdown alokasi biaya sewa perangkat per departemen per entitas PT MRA Retail.

---

## 8. Standar Penulisan 5 File Excel Budget 2027

- **Satuan Angka:** Juta Rupiah (Rp 150.000.000 ditulis **150** | Rp 22.923.550 ditulis **22.92**).
- **Daftar File Output di `d:\Ares Project\Budget MRA`:**
  1. `Request Data for Budget 2027 - PT Permata Landmarq Abadi.xlsx`
  2. `Request Data for Budget 2027 - PT Mogems Putri International.xlsx`
  3. `Request Data for Budget 2027 - PT Jemma Putri International.xlsx`
  4. `Request Data for Budget 2027 - PT Amanda Arumdhani Aishwarya.xlsx`
  5. `Request Data for Budget 2027 - KONSOLIDASI IT GROUP.xlsx`
