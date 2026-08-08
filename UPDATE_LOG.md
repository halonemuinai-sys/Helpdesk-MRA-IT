# Helpdesk MRA — Update Log
**Periode:** Juli 2026  
**Branch:** `main`  
**Repo:** https://github.com/halonemuinai-sys/Helpdesk-MRA-IT

---

## Ringkasan Perubahan

Update session ini mencakup **11 fitur/perbaikan** di seluruh ekosistem Helpdesk MRA, dari backend Express/Prisma hingga frontend React. Fokus utama: UX improvement, actionable notifications, KPI transparency, dan akses publik untuk karyawan.

---

## 1. Fix: Asset Update Lambat
**File:** `backend/routes/assets.js`, `frontend/src/hooks/useAssets.js`  
**Commit:** `1d5683b`

**Masalah:** Update data karyawan pengguna asset sangat lambat karena `syncAssetToGA` (sinkronisasi ke Google Sheets) berjalan blocking sebelum response dikembalikan.

**Solusi:**
- Backend: `syncAssetToGA` dipindah jadi **fire-and-forget** setelah `res.json()` — GA sync tidak lagi memblokir HTTP response
- Frontend: Tambah opsi `{ silent: true }` pada `fetchAssets` sehingga setelah save tidak muncul spinner penuh di tabel

```js
// backend — setelah res.json()
res.json(updatedAsset);
syncAssetToGA(updatedAsset.id, current.assetTag); // non-blocking
```

---

## 2. Improvement: Dropdown Perusahaan Asset Lebih Menarik
**File:** `frontend/src/components/assets/AssetFilterBar.jsx`  
**Commit:** `1d5683b`

Tiga `<select>` native diganti dengan komponen `CustomSelect` custom menggunakan `createPortal` agar tidak ter-clip oleh parent container.

**Fitur:**
- Dropdown company bisa di-search (searchable, min-width 300px)
- Animasi slide-down
- Aksen warna rose, Check icon untuk item terpilih
- Posisi dihitung via `getBoundingClientRect()` + `window.scrollY`

---

## 3. Fix: Tombol Delete di Asset Table Tidak Terlihat
**File:** `frontend/src/components/assets/AssetTable.jsx`

**Masalah:** Kolom Aksi di tabel wide terpotong saat scroll horizontal.

**Solusi:** Kolom Aksi dibuat `sticky right-0` sehingga selalu terlihat di kanan viewport saat horizontal scroll.

```jsx
<td className="sticky right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-10 ...">
```

Pattern: `sticky right-0` pada `<th>` dan `<td>`, `group` pada `<tr>`, `group-hover:` untuk highlight.

---

## 4. Fitur: Filter Bulan di Tab Active Tickets
**File:** `frontend/src/components/tickets-summary/TicketsSummaryFilterBar.jsx`, `frontend/src/hooks/useTicketsSummary.js`  
**Commit:** `1d5683b`

Sebelumnya filter bulan hanya tersedia di tab History. Sekarang tersedia di **kedua tab** (Active dan History).

---

## 5. Fitur: Filter SLA Breached di Tickets Summary
**File:** `frontend/src/components/tickets-summary/TicketsSummaryFilterBar.jsx`, `frontend/src/hooks/useTicketsSummary.js`  
**Commit:** `12ef713`

Toggle button baru "SLA Breached" untuk memfilter tiket yang sudah melewati batas waktu SLA.

**Logika filter (client-side):**
- Cek `auditLogs` apakah ada `SLA_OVERRIDDEN` → skip (tidak dihitung breach)
- Tiket RESOLVED/CLOSED: cek field `isSlaBreached`
- Tiket aktif (OPEN/IN_PROGRESS): hitung live dengan `totalPausedMs` + `lastPausedAt`
- Filter reset otomatis saat pindah tab

---

## 6. Fitur: Professional Manager Report — Agent Performance
**File:** `backend/routes/performance.js`, `backend/api/email.js`, `frontend/src/pages/AgentPerformance.jsx`  
**Commit:** `a94fd3d`

Button **"Send Report"** di header halaman Agent Performance mengirim laporan performa ke `Aris@mraretail.co.id`.

**Isi laporan HTML email:**
- Header gradient dark dengan label periode
- Executive Summary: Total Agents, Avg SLA Compliance, Top Performer, Avg Resolution
- Top 3 Podium dengan medal 🥇🥈🥉 dan metrics per agent
- Full leaderboard table: rank, nama, tickets, SLA met/breached, compliance%, avg response, avg resolution, KPI score
- Footer IT MRA branding

**Endpoint baru:** `POST /api/performance/send-report`  
Menerima `{ leaderboard, periodLabel }` dari frontend, generate HTML, kirim via nodemailer.

---

## 7. Fitur: KPI Card "Avg Team Resolution" — Popup Rules
**File:** `frontend/src/components/dashboard/DashboardPerformancePanel.jsx`  
**Commit:** `0edfa95`, `58913c3`

Klik card **Avg Team Resolution** → popup modal muncul di tengah layar berisi:

| Section | Isi |
|---|---|
| Formula | `avg( resolvedAt − createdAt − pausedMs )` |
| Target Benchmark | ≤4j Excellent, 4–8j Good, 8–24j Needs Improvement, >24j Critical |
| SLA Limit per Prioritas | CRITICAL 4j / HIGH 1 hari / MEDIUM 3 hari / LOW 5 hari |
| Bobot KPI | Resolution SLA = **35%** dari total KPI Score |

Implementasi: `createPortal` ke `document.body`, backdrop blur, close dengan klik luar atau tombol ✕.

---

## 8. Fitur: KPI Card "Avg Team Response" — Popup Rules
**File:** `frontend/src/components/dashboard/DashboardPerformancePanel.jsx`  
**Commit:** `47f82a3`

Sama dengan Avg Team Resolution, kini card **Avg Team Response** juga clickable:

| Section | Isi |
|---|---|
| Formula | `avg( respondedAt − createdAt )` |
| Target Benchmark | ≤15 mnt Excellent, 15–60 mnt Good, 1–4j Needs Improvement, >4j Critical |
| SLA Limit per Prioritas | CRITICAL 15 mnt / HIGH 1j / MEDIUM 4j / LOW 8j |
| Bobot KPI | Response SLA = **25%** dari total KPI Score |

Warna aksen cyan (berbeda dengan indigo milik Resolution).

---

## 9. Fix: Notifikasi Dashboard Bisa Di-klik & Actionable
**File:** `frontend/src/components/dashboard/DashboardTopBar.jsx`, `frontend/src/hooks/useTicketsSummary.js`  
**Commit:** `cbe10bc`

| Notifikasi | Sebelum | Setelah |
|---|---|---|
| Tiket Overdue | Div biasa (tidak bisa klik) | Link → `/tickets?sla=breached` |
| Urgent Tickets | Link ke `/tickets/:id` (route tidak ada) | Link → `/tickets?open=TKT-xxx` |
| Asset/Subscription expiring | Sudah benar | Tidak berubah |

`useTicketsSummary` membaca URL params saat mount:
- `?sla=breached` → aktifkan SLA filter otomatis
- `?open=TKT-xxx` → buka modal detail tiket langsung

Params dibersihkan dari URL setelah dikonsumsi (`replace: true`).

---

## 10. Fix: Notifikasi Asset Expiry Langsung Buka Asset
**File:** `backend/routes/assets.js`, `frontend/src/components/dashboard/DashboardTopBar.jsx`, `frontend/src/hooks/useAssets.js`  
**Commit:** `ce006a9`

**Masalah:** Klik notifikasi asset expiry hanya navigasi ke `/assets` tanpa membuka asset spesifik.

**Solusi:**
- Backend: Tambah endpoint `GET /api/assets/:id` (fetch single asset)
- Notifikasi link berubah ke `/assets?open=ASSET_ID`
- `useAssets` baca `?open=` saat mount → fetch asset via endpoint baru → buka view drawer langsung **tanpa perlu load full list dulu** (kompatibel dengan manual-load pattern)

---

## 11. Fitur: Public Self-Service Ticket Portal
**File:** `frontend/src/pages/PublicTicketForm.jsx`, `frontend/src/App.jsx`  
**Commit:** `3ff971f`

**URL:** `your-domain.com/request`  
**Tanpa login** — siapapun bisa akses dari HP atau browser.

**Flow 2-step:**

**Step 1 — Identitas**
- Nama lengkap
- Email kantor
- Perusahaan / unit kerja

**Step 2 — Masalah**
- Grid kategori 2 kolom dengan icon: Hardware, Software/Aplikasi, Network/Internet, Akses & Password, Printer/Scanner, HP/Telepon, Lainnya
- Input judul masalah
- Textarea detail masalah (panduan teks)

**Step 3 — Sukses**
- Nomor tiket ditampilkan besar (font mono)
- 3 langkah selanjutnya
- Tombol "Kirim Laporan Lain"

**Integrasi Backend:** Menggunakan endpoint `POST /api/tickets/public` yang sudah ada. Auto-create user jika email belum terdaftar. Konfirmasi email otomatis dikirim ke requester.

---

## 12. Fitur: Tab Baru "IT Cost Overview" di IT Budget 360
**File:** `frontend/src/pages/ITBudget360.jsx`  
**Commit:** `Latest`

**Fungsi:**
Tab dedicated **"IT Cost Overview"** sebagai tampilan default eksekutif untuk memantau beban biaya IT secara komprehensif.

**Fitur Utama:**
1. **Executive Cost KPI Highlight Cards:**
   - **Total Realisasi Cost:** Rupiah terpakai vs total pagu + progress bar % terpakai.
   - **Biaya Operasional (OPEX):** Total & persentase alokasi OPEX.
   - **Investasi Aset (CAPEX):** Total & persentase alokasi CAPEX.
   - **Sisa Pagu Anggaran:** Status kesehatan anggaran (*Healthy*, *Menipis <10%*, *Over Budget*).
2. **Cost Distribution Panels:**
   - **Breakdown per Kategori Akun:** Distribusi biaya ke Hardware, Software, Cloud/ISP, Maintenance, dll.
   - **Alokasi per Perusahaan Group:** Persentase alokasi biaya per unit (PT Mogems, PLA, Jemma, Amanda, GA Shared).
3. **Top 5 Major IT Cost Drivers Table:**
   - Tabel 5 pengeluaran biaya IT terbesar beserta status varian (Terserap / Over Budget) dan tombol quick-action ke Tagging Modal.
4. **Budget Variance Alert Banner:**
   - Banner peringatan otomatis untuk item-item yang penyerapan anggarannya telah menyerap ≥85% pagu.

---

## Ringkasan File yang Berubah

| File | Tipe | Perubahan |
|---|---|---|
| `frontend/src/pages/ITBudget360.jsx` | Frontend | **Tab baru** — IT Cost Overview + default tab |
| `backend/routes/assets.js` | Backend | +GET /:id endpoint, fix GA sync fire-and-forget |
| `backend/routes/performance.js` | Backend | +POST /send-report + HTML email generator |
| `backend/api/email.js` | Backend | Export `sendMail` sebagai named export |
| `frontend/src/pages/AgentPerformance.jsx` | Frontend | +Send Report button + handleSendReport |
| `frontend/src/pages/PublicTicketForm.jsx` | Frontend | **File baru** — public ticket portal |
| `frontend/src/App.jsx` | Frontend | +Route `/request` public |
| `frontend/src/hooks/useAssets.js` | Frontend | +URL param `?open=` handler |
| `frontend/src/hooks/useTicketsSummary.js` | Frontend | +URL params `?open=` & `?sla=breached` |
| `frontend/src/components/assets/AssetFilterBar.jsx` | Frontend | Custom portal dropdown |
| `frontend/src/components/assets/AssetTable.jsx` | Frontend | Sticky action column |
| `frontend/src/components/dashboard/DashboardTopBar.jsx` | Frontend | Actionable notification links |
| `frontend/src/components/dashboard/DashboardPerformancePanel.jsx` | Frontend | KPI card popup rules (Response + Resolution) |
| `frontend/src/components/tickets-summary/TicketsSummaryFilterBar.jsx` | Frontend | Month filter both tabs + SLA Breached toggle |
| `deploy.sh` | DevOps | Script deploy ke server (PM2 + Nginx) |

---

## Arsitektur Singkat

```
Frontend (React 19 + Vite + Tailwind)
  └── /request          → PublicTicketForm (no auth)
  └── /dashboard        → Dashboard + DashboardTopBar (notif) + DashboardPerformancePanel (KPI popup)
  └── /tickets          → TicketsSummary (SLA filter, month filter, URL param open)
  └── /assets           → Assets (URL param open drawer)
  └── /performance      → AgentPerformance (Send Report button)
  └── /budget-360       → ITBudget360 (IT Cost Overview tab, Executive Summary, 5 Pilar)

Backend (Express + Prisma + PostgreSQL)
  └── POST /api/tickets/public        → public ticket creation (no auth)
  └── GET  /api/assets/:id            → fetch single asset (new)
  └── POST /api/performance/send-report → generate & email HTML report
  └── SMTP via nodemailer (Yahoo Bizmail)
```

---

*Updated: 9 Agustus 2026*
