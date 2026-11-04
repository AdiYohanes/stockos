# StockOS — Features & Flows

Dokumen ini menjelaskan semua fitur yang ada di StockOS beserta alur (flow) penggunanya. StockOS adalah aplikasi manajemen stok ringan untuk satu warung, satu pemilik (owner), tanpa gudang/multi-lokasi/purchase order.

> Status: fase Backend Foundation lokal (Supabase Cloud project `ohltpkxtucchqezkgfok`, Next.js berjalan lokal). Deployment produksi belum dilakukan.

---

## Peta Aplikasi

| Rute | Fitur | Akses |
|---|---|---|
| `/login` | Login owner | Publik |
| `/signup` | Setup owner pertama (rahasia server) | Publik, sekali pakai |
| `/reset` | Ajukan reset password | Publik |
| `/newpassword` | Set password baru (undangan/reset) | Publik, berbasis token |
| `/` | Dashboard | Owner terautentikasi |
| `/products` | Manajemen produk | Owner terautentikasi |
| `/inventory` | Kontrol stok & riwayat gerakan | Owner terautentikasi |
| `/reports` | Laporan valuasi, pergerakan, reorder | Owner terautentikasi |
| `/settings` | Profil toko & aturan stok | Owner terautentikasi |

Semua rute dashboard menerima filter via URL (`q`, `category`, `status`, `tab`, `sort`, `order`, `page`, `pageSize`) sehingga tampilan bisa dibagikan/di-refresh tanpa kehilangan state.

---

## 1. Autentikasi & Akun Owner

### Deskripsi
Satu akun owner saja. Public signup dinonaktifkan; pendaftaran owner pertama dilindungi rahasia server (`STOCKOS_SETUP_SECRET`) dan slot owner ditutup setelah terikat. Email wajib terverifikasi. Password dikelola penuh oleh Supabase Auth (HttpOnly cookie), bukan di browser.

### Flow
1. **Setup owner pertama** — buka `/signup` dengan rahasia setup → isi email → terima email undangan → klik link verifikasi → tiba di `/newpassword` → buat password → login fresh.
2. **Login** — `/login` → email + password → verifikasi AMR password + cek sesi live di PostgreSQL → masuk dashboard. Sesi kadaluarsa/invalid → redirect ke `/login`.
3. **Lupa password** — `/reset` → isi email → acknowledgement generik (tidak membocorkan keberadaan akun) → email recovery → `/newpassword` → password baru → semua sesi lama dicabut global → wajib login fresh.
4. **Logout** — Server Action mencabut sesi di server; JWT lama langsung ditolak RPC.

### Aturan penting
- Sesi undangan/OTP tidak bisa mengakses RPC bisnis; harus login password fresh.
- Password minimal 12 karakter.
- Kegagalan network saat simpan → draft form tetap tersimpan, retry dengan request ID sama tidak menggandakan perubahan.

---

## 2. Dashboard (`/`)

### Deskripsi
Ringkasan actionable harian, bukan analitik dekoratif. Semua angka berasal dari PostgreSQL (`stockos_get_dashboard`), bukan mock.

### Kartu ringkasan
- **Total Produk** — jumlah produk aktif.
- **Potensi Pendapatan** — nilai jual seluruh stok tersedia × harga jual saat ini (bukan revenue nyata).
- **Potensi Laba Kotor** — Potensi Pendapatan dikurangi nilai modal rata-rata tertimbang. Bisa negatif dan tetap ditampilkan.
- **Out of Stock** — jumlah produk stok habis.

### Isi halaman
- **Inventory Health** — distribusi produk: stok aman / stok rendah / stok habis (dengan nilai jual per kelompok).
- **Perlu Perhatian** — tabel terbatas produk aktif dengan `stok ≤ min stok`.
- **Grafik Pergerakan Stok** — volume masuk/keluar 7 hari dan 30 hari (zona waktu toko) dengan net flow.
- **Aktivitas terkini** — daftar event stok terbaru.
- **Quick actions** — tombol Tambah Produk dan Catat Stok langsung membuka modal; commit memicu refresh optimistik.

---

## 3. Manajemen Produk (`/products`)

### Deskripsi
Katalog produk + operasi siklus hidup. Satu saldo stok otoritatif dibagi dengan Inventory.

### Field produk
Nama, SKU (otomatis dari nama, unik lintas arsip), kategori, harga jual, satuan dasar, min stok, status aktif/arsip, supplier (opsional), rak (opsional), foto (opsional, WebP, privat).

### Komponen halaman
- **Header** — judul + badge mono + deskripsi, tombol aksi di kanan.
- **Metric cards** — Total Produk, Nilai Modal Inventori, Potensi Pendapatan, Stok Habis; bisa klik untuk filter cepat.
- **Toolbar** — pencarian instan, pill status dengan hitungan, dropdown kategori, toggle sort, reset.
- **Tabel** — badge SKU Space Mono, foto, harga, nilai inventori eksak (desimal string, tanpa float), status pill, aksi per baris.
- **Detail sheet (slide-over)** — spesifikasi lengkap + riwayat inventori per produk (paginasi terpisah, tidak embed tak terbatas).

### Flow utama
1. **Tambah produk** — modal Add: SKU otomatis dari nama (read-only, aturan: kata pertama maks 4 huruf + kata kedua maks 4 huruf setelah tanda hubung, uppercase; "beng beng" → BENG-BENG). Satuan & min stok default dari Settings. Foto opsional diproses di browser jadi pasangan WebP display/thumbnail. Bisa menyertakan **stok awal** dengan total harga beli wajib untuk stok positif (Rp 0 = barang gratis). Jika SKU bentrok → di-generate ulang otomatis dengan akhiran `-2`. Setelah sucrees → animasi singkat.
2. **Restock produk lama** — pilih produk existing via ID/SKU (tidak pernah merge berdasarkan nama), via Stock In.
3. **Edit produk** — SKU & satuan dasar terkunci setelah ada riwayat inventori. Perubahan harga jual tidak mengubah valuasi inventori. Guard `expectedMetadataVersion` untuk OCC.
4. **Stok Masuk/Keluar langsung** — modal per baris (lihat §4).
5. **Arsip** — hanya jika stok nol; menyimpan identitas & riwayat; reaktivasi bisa memakai ulang SKU. Guard versi.
6. **Hapus permanen** — hanya produk aktif/arsip dengan stok nol **dan** tanpa event inventori apa pun (termasuk opname tanpa perubahan atau penyesuaian modal). Ada riwayat stok → tidak pernah bisa dihapus. Bukti administratif tetap tersimpan (FK produk dilepas, ID asli/snapshot dipertahankan). Hapus saja yang melepas SKU.
7. **Cari/filter/sort/paginasi** — semua via URL, server-authoritative.

### Flow barcode
`Ambil foto`/pindai barcode mengisi draft Add Product saja, dengan fallback manual, hasil ditinjau dulu. Barcode scanner memakai video rear-facing live + opsi foto native `capture="environment"`. Butuh HTTPS (secure context).

---

## 4. Stok Masuk, Stok Keluar & Opname (dipakai di Products & Inventory)

Tiga mutasi inti yang dipakai di kedua fitur, semuanya transaksi PostgreSQL atomik (`request-first` + `retry result`), tidak bisa oversellDuplicate, dan menulis bukti audit atomik.

### Stock In (barang masuk)
1. Pilih produk / mode karton (`jumlah karton × isi per karton`).
2. Isi jumlah, total pembelian (rupiah bulat, wajib untuk stok positif; Rp 0 = gratis), referensi/nota opsional.
3. Modal rata-rata tertimbang dihitung ulang atomik bersama kuantitas + bukti.

### Stock Out (terjual)
1. Isi kuantitas positif + referensi opsional.
2. Mengurangi stok; **hanya untuk penjualan tercatat manual** — bukan POS, tidak ada data pembayaran.
3. Kecilkan konflik: stok tidak bisa minus; dua stock out bersamaan tidak bisa oversell.

### Stock Opname (Stok Opname / penyesuaian fisik)
1. Isi hitungan fisik vs stok sistem; delta dihitung ditampilkan.
2. Hitungan tanpa selisih (delta 0) **tetap direkam** sebagai bukti opname.
3. Stok sebelumnya nol lalu ditemukan stok positif → total harga pembelian wajib diisi.
4. Hitungan versi lama (stok berubah sejak dibaca) → wajih review ulang dengan snapshot terbaru + hitungan fresh.

### Koreksi modal (cost adjustment)
Aksi terpisah di Inventory: mengganti total nilai inventori dengan wajib alasan; tidak menyentuh kuantitas. Koreksi kuantitas membuat event opname tertaut.

### Ketahanan mutasi
- UUID `requestId` dibuat klien, payload dibekukan.
- Respons hilang/unsure → retry dengan request ID sama, hasil lama di-replay, tidak duplikasi.
- Versi bentrok (`VERSION_CONFLICT`) → draft tetap, wajib review snapshot terbaru.
- Modal pending/unsure tidak bisa ditutup.

---

## 5. Inventory (`/inventory`)

### Deskripsi
Pemantauan stok satu toko: satu saldo otoritatif per produk, satuan dasar bulat, tanpa reservasi/barang timbangan.

### Tab
1. **Tingkat Stok** — tabel stok: kuantitas saat ini, bar ratio stok vs min stok, status (Aman/Rendah/Habis), harga, nilai. Filter: pencarian, kategori, status, sort, paginasi.
2. **Riwayat Pergerakan** — audit log semua event: jenis (stok awal/penerimaan/terjual/opname/koreksi modal), produk, sebelum/sesudah, sumber, waktu, aktor, referensi/note. Filter jenis + paginasi.

### Komponen
- Metric cards (bisa klik-filter), toolbar pencarian/pill/dropdown, tabel padat, detail sheet per item dengan riwayat event spesifik produk.
- Aksi per baris: Stock In, Stock Out, Stok Opname, Koreksi Modal.
- Client `StockProductPicker` untuk mencari produk (paginasi terbatas, tidak pernah fetch tak terbatas).

### Aturan stok
- Stok minus ditolak.
- Karton hanya konversi input penerimaan, bukan satuan stok.
- Harga beli pembelian wajib bulat IDR; Rp 0 berarti gratis.
- Modal rata-rata diperbarui atomik dengan kuantitas + bukti.

---

## 6. Reports (`/reports`)

### Deskripsi
Laporan live berbasis stok, semua sumber data disebut eksplisit — bukan nilai demo.

### Tab
1. **Valuasi** — nilai modal inventori + potensi pendapatan per produk, total agregat.
2. **Kecepatan Pergerakan (Movement Velocity)** — volume masuk/keluar per periode (7d/30d/90d/12m) zona waktu toko (`Asia/Jakarta`, `Asia/Makassar`, `Asia/Jayapura`).
3. **Risiko Reorder (Low Stock)** — produk di bawah min stok berdasarkan ambang.

### Fitur
- Metric cards ringkasan + per-tab.
- Pencarian & filter kategori diterapkan server-side; halaman detail aktif dimuat terbatas (bounded), tab non-aktif hanya summary.
- **Ekspor CSV** — RFC 4180, netralisasi injeksi formula (`=`/`+`/`-`/`@`), maks 10.000 baris / 5 MiB, sumber sama dengan layar, incremental UTF-8.
- Detail sheet slide-over per entitas.
- Zona waktu toko dipakai untuk batas tanggal (konflik zona → re-fetch otomatis).

Supplier scores, lead-time prediksi, velocity tiers tidak didukung (dihapus).

---

## 7. Settings (`/settings`)

### Deskripsi
Pengaturan toko tunggal disimpan di PostgreSQL (`stockos_get_shop_settings` / `stockos_update_shop_settings`) dengan OCC version monoton + audit.

### Tab
1. **Profil Toko (Company Profile)** — nama toko, alamat, kontak, IANA timezone (salah satu dari tiga di atas). Timestamp ditampilkan di zona toko tersimpan (bukan browser), aman hidrasi.
2. **Aturan Stok (Inventory Rules)** — default satuan untuk produk baru, default min stok. System reset mengembalikan hanya default pembuatan (`Pcs`/`15`), tidak menyentuh profil/zona waktu/data operasional.

### Flow simpan (OCC)
1. Draft lokal terpisah dari baseline tersimpan.
2. Simpan → kirim `expectedVersion` + UUID request.
3. Versi bentrok → tampil peringatan dengan draft tetap utuh, wajih review snapshot terbaru.
4. Respons hilang → retry read-only hasil commit lama; versi tidak pernah turun.
5. Reset default → modal konfirmasi; tidak pernah hapus produk/riwayat/owner.
6. Display & bahasa (ID/EN) disimpan browser-lokal saja.

### Yang tidak ada (sesuai scope warung)
Tim/role, notifikasi, FIFO/LIFO, multi-kurrency, stok negatif, expiry tracking, wipe data operasional.

---

## 8. Foto Produk

### Deskripsi
Satu foto opsional per produk. Diproses di browser (canvas) menjadi pasangan WebP display/thumbnail terbatas ukuran/dimensi. Byte tersimpan di Supabase Storage privat (content-addressed SHA-256); tabel produk hanya menyimpan referensi hash/ukuran/dimensi.

### Flow
1. **Upload** — pilih file biasa atau `Ambil foto` kamera native (`capture="environment"`). Foto in-ukuran/tipe tak didukung ditolak sebelum upload; gagal upload → draft & preview tetap.
2. **Dedupe** — konten identik tidak menyimpan byte kedua.
3. **Penyajian** — route khusus owner-guarded, `cache-control: private`, mendukung 304. Anonim ditolak.
4. **Edit/Hapus** — penggantian/penghapusan foto lewat alur Edit Product yang sama; metadata perubahan tercatat di audit.

---

## 9. Pola UI yang Konsisten (semua fitur)

Semua halaman utama mengikuti pola sama (per `design.md` momok neo-brutalist):

1. **Page Header** — h1 + badge mono + deskripsi; tombol aksi responsif di kanan.
2. **Metric Summary Cards** — 3–4 kartu, bisa klik-filter.
3. **Unified Toolbar** — pencarian instan + pill status dengan live count + dropdown kategori + toggle sort + reset.
4. **High-Density Table** — badge SKU mono, ratio bar, format Rupiah, status pill, aksi kontekstual.
5. **Slide-Over Detail Sheet** — panel inspeksi spesifikasi + gauges + log riwayat tanpa keluar dari tabel.

### UI states yang selalu diperhitungkan
Loading (skeleton), Empty, Error, Success, Disabled, Validation — draft form tetap secara default pada kegagalan.

### Responsif
Desktop utama, tablet & mobile tetap usable; layout adaptif, tanpa overflow horizontal (dibuktikan di 1440px & 390px).

### Aksesibilitas
HTML semantik, keyboard-accessible, fokus terlihat, label bermakna, kontras cukup.

---

## 10. Alur Besar Pengguna Sehari-hari

Ringkasan alur operasional warung:

1. Pagi: buka **Dashboard** → cek Perlu Perhatian & Out of Stock.
2. Datang barang: **Stock In** per produk (nota di Products atau Inventory), isi total beli.
3. Sepanjang hari: catat terjual manual **Stock Out** (sesuai hitungan fisik / nota).
4. Periodik: **Stok Opname** hitung fisik → selisih otomatis tercatat; koreksi modal jika perlu.
5. Sebelum belanja lagi: **Reports → Risiko Reorder** untuk daftar produk rendah stok.
6. Ekspor CSV laporan untuk catatan.
7. Sampel warung (18 produk) tersedia via seeder untuk demo/regresi, bukan data aplikasi.
