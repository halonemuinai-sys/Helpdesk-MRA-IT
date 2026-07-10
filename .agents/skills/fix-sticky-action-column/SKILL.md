---
name: fix-sticky-action-column
description: Panduan untuk memperbaiki layout kolom aksi tabel yang terpotong di layar kecil menggunakan teknik CSS Sticky Column dengan Tailwind CSS.
---

# Fix Sticky Action Column in Responsive Tables

Panduan ini menjelaskan cara mengatasi masalah tombol aksi (seperti Edit, Hapus, Detail) yang hilang atau terpotong di sisi kanan tabel lebar pada layar kecil/menengah dengan menerapkan kolom aksi yang menempel (*sticky right*).

## 1. Identifikasi Masalah
Pada tabel dengan banyak kolom detail, lebar tabel sering melebihi lebar layar. Kontainer tabel dengan kelas `overflow-x-auto` akan mengizinkan scroll horizontal, namun tombol aksi paling kanan sering kali terpotong atau tidak terlihat oleh pengguna karena tersembunyi di luar area viewport default.

## 2. Cara Implementasi Sticky Column di Tailwind CSS

Untuk membuat kolom aksi tetap terlihat di sisi kanan tabel saat di-scroll, ikuti langkah-langkah berikut:

### Langkah A: Ubah Header Tabel (thead th)
Pada elemen `th` kolom Aksi, tambahkan kelas-kelas berikut untuk membuatnya menempel di kanan:
- `sticky right-0`: Menempelkan kolom di sisi kanan kontainer scroll.
- `bg-white/95 dark:bg-slate-900/95`: Memberikan warna latar belakang buram agar teks kolom lain yang tergeser ke bawah tidak menembus/terlihat di belakangnya.
- `backdrop-blur-sm` (opsional): Efek blur modern.
- `z-10`: Mengatur tumpukan agar berada di atas isi tabel yang tergeser.
- `shadow-[-10px_0_15px_-10px_rgba(0,0,0,0.1)]` (opsional): Menambahkan bayangan tipis di sisi kiri kolom sticky untuk memberikan batas kedalaman visual saat tabel di-scroll.

### Langkah B: Ubah Baris Tabel (tbody tr)
Tambahkan kelas `group` pada elemen `tr` agar perubahan latar belakang saat baris di-hover dapat dideteksi oleh elemen anak (kolom sticky):
```html
<tr class="group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
```

### Langkah C: Ubah Sel Aksi (tbody td)
Pada elemen `td` kolom Aksi, terapkan properti yang sama seperti pada header, ditambah dengan sinkronisasi hover state:
- `sticky right-0`
- `bg-white/95 dark:bg-slate-900/95`
- `z-10`
- `shadow-[-10px_0_15px_-10px_rgba(0,0,0,0.1)]`
- `group-hover:bg-slate-50 dark:group-hover:bg-slate-900` (atau sesuaikan dengan warna hover row Anda): Ini memastikan bahwa saat baris di-hover, latar belakang sel sticky yang buram juga ikut berubah warna secara sinkron dengan sisa baris lainnya.
- `transition-colors duration-150`

## 3. Langkah Verifikasi
1. Jalankan proses build untuk memastikan tidak ada kesalahan kompilasi CSS:
   ```bash
   npm run build
   ```
2. Uji responsivitas dengan mengecilkan lebar jendela browser atau menggunakan Device Mode di Developer Tools (Chrome/Edge/Firefox).
3. Pastikan kolom "Aksi" tetap kokoh menempel di kanan dan teks kolom lain bergulir dengan mulus di belakangnya.
