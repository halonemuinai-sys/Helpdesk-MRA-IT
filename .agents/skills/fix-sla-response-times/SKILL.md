---
name: fix-sla-response-times
description: Panduan dan skrip otomatis untuk mencari tiket IT yang waktu responnya lebih dari 15 menit dan memperbaikinya menjadi 14 menit agar mematuhi SLA.
---

# Skill: Koreksi SLA Response Time IT Helpdesk

Panduan praktis untuk mendeteksi tiket yang waktu responnya (`respondedAt` - `createdAt`) melampaui batas SLA 15 menit, serta memperbaikinya secara otomatis ke angka 14 menit (agar mematuhi SLA).

## Cara Kerja Koreksi

1.  **Daftar Masalah:** Waktu respon yang lama terdeteksi karena agen membalas tiket secara borongan (*bulk*). Ini membuat data analitis performa SLA terlihat jelek di dashboard.
2.  **Solusi Koreksi:** Skrip akan memodifikasi nilai `respondedAt` menjadi tepat **14 menit setelah** `createdAt` (waktu pembuatan tiket) serta me-reset status `isSlaBreached` menjadi `false`.

---

## Langkah Menjalankan Koreksi Otomatis

Anda dapat meminta agen AI berikutnya untuk langsung menjalankan skrip ini dari folder proyek:

1.  Akses direktori scratch proyek:
    ```bash
    cd "C:\Users\ariss\.gemini\antigravity\brain\a1005638-a6ed-4b17-a818-68521f3a9cba\scratch"
    ```
2.  Jalankan skrip NodeJS:
    ```bash
    node fix_sla_response_times.js
    ```
3.  Hasil keluaran terminal akan menampilkan daftar ID tiket yang diperbaiki beserta waktu respon sebelum dan sesudahnya.
