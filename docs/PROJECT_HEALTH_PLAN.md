# Audit Kesehatan StockOS dan Rencana Lanjut

Tanggal: **2026-10-14**  
Status: **Draf untuk review — bukan persetujuan eksekusi**  
Cakupan: backend, frontend, keamanan, testing, operasi, dokumentasi, dan kesiapan release lokal.

## 1. Kesimpulan

**Fondasi backend lokal sehat pada skenario yang diuji. Frontend masih memiliki cacat tampilan uang, aksesibilitas, lokalisasi, dan kontrol tanpa fungsi. Tooling backup/restore perlu diperbaiki sebelum dijadikan bukti kesiapan operasi terkini. Project belum siap digunakan sebagai produksi warung.**

Bukti terbaru: sembilan suite Auth/PostgreSQL/browser **PASS_LOCAL_ONLY**, coverage **full**, cleanup **PASS**. TypeScript, ESLint tanpa warning, build produksi, regresi offline, dan keamanan seeder juga lulus.

Lulus suite berarti skenario suite lulus, bukan seluruh requirement sudah tercakup. Browser proof menggunakan `next dev --webpack`, bukan `next start`. Backup/restore lengkap tidak dijalankan ulang pada sesi ini. SMTP eksternal, hosted runtime, backup off-device, dan penggunaan data warung nyata belum dibuktikan.

**Rekomendasi:** selesaikan perbaikan lokal kecil dan gap proof dahulu. Jangan menambah fitur domain, dependency, ORM, REST API, atau layanan cloud untuk menyelesaikan temuan ini.

## 2. Baseline dan Batas Audit

- Branch aktual: `refactor/warung-scope`.
- Fixed point pilihan pengguna: `main`, SHA `e7e9ee1ff897e5be9bc9c02ad754eb6ba7ef4cb6`.
- HEAD: `a501af16abe645b083853ea8ef5be07f049811bb`.
- Review committed changes: `git diff main...HEAD`, 18 commit, 179 path berubah.
- Runtime audit mencakup working tree saat proof dimulai, termasuk source untracked; bukan HEAD saja.
- Hash diff proof: `2f178ca7877711acf27491126dc02ec2b3aca15701dfb129cda6ce209aca0f12`.
- Existing modified/untracked files dipertahankan. Dokumen plan ini ditulis setelah proof, sehingga tidak termasuk hash di atas.
- Testing memakai resource lokal sintetis baru, bukan reset/mutasi database lokal retained atau data warung nyata.
- Tidak dilakukan perbaikan source, migrasi baru, perubahan dependency, commit/push, deployment, atau pengiriman email eksternal.

Sumber: `AGENTS.md`, `PRD.md`, `ARCHITECTURE.md`, `PROGRESS.md`, `design.md`, `GLOSSARY.md`, `docs/BACKEND_PLAN.md`, `docs/DATABASE.md`, `docs/API_CONTRACT.md`, `docs/FULLSTACK_SPEC.md`, `docs/OPERATIONS.md`, `docs/DEPLOY_PLAN.md`, serta kode dan proof scripts aktual.

## 3. Bukti Testing Terbaru

| Pemeriksaan | Hasil sesi ini | Makna / batas |
| --- | --- | --- |
| `npm run typecheck` | PASS | TypeScript tanpa error |
| `npm run lint -- --max-warnings 0` | PASS | ESLint nol warning/error |
| `npm run build` | PASS | Next.js 16.3.8 production build berhasil; bukan hosted/browser production proof |
| `npm run check` | PASS | Store/schema, dashboard exact money, katalog, SMTP self-test, reports/CSV/chart, guard fixture, Settings state |
| `node scripts/check-seeder-safety.mjs` | PASS | Local-origin guard, redirect rejection, dry run, nonzero exit untuk partial/total failure; tidak melakukan seeding ke resource retained |
| `node scripts/check-operations.mjs --self-test` | PASS | Target guard; tidak menguji dump/restore atau rollback probe |
| `python -I scripts/launch-hardening-proof.py --run` | PASS_LOCAL_ONLY | Seluruh 9 suite; cleanup PASS |
| Python syntax compile, 13 scripts | PASS | Tidak menulis bytecode baru |
| `git diff --check` | PASS | Tidak ada whitespace error |
| `npm audit --offline --omit=dev --json` | 0 advisory dari cache | Bukan audit advisory online terkini; freshness cache tidak diketahui |
| Pemeriksaan arithmetic valuasi Inventory | Mismatch terbukti | Rata-rata dibulatkan tidak boleh dipakai menghitung ulang total authoritative |
| Operations probe/evidence review | Dua cacat terkonfirmasi statis/offline | Bukan hasil live `--run` pada sesi ini |

### Sembilan suite yang benar-benar selesai

`auth`, `stock`, `recovery`, `reports-contract`, `products`, `defaults`, `inventory`, `reports`, `settings`.

Runner juga melaporkan PASS untuk seeded forward upgrade, durable/no-op replay, clean CLI migration replay, dan native grants. Evidence akhir tidak memiliki failed/not-run suite atau failed cleanup step.

Evidence sanitasi:

```text
%TEMP%/stockos-hardening-v8wwmz7b/evidence.json
status: PASS_LOCAL_ONLY
coverage: full
cleanup.status: PASS
cloud: NOT_AUTHORIZED
smtp: NOT_SENT
realShopData: NOT_USED
```

**Jangan membagikan direktori proof mentah.** Log/provider status dapat berisi credential sintetis dan informasi sensitif. Evidence sanitasi cukup untuk review; dump/log tetap lokal terlindungi.

Screenshot proof koreksi jumlah mobile 390px dan koreksi modal desktop 1440px telah diperiksa. Ini tidak menggantikan audit visual/accessibility semua layar. Suite terkait juga menguji bounds desktop/mobile.

Catatan nonfatal: Node `MODULE_TYPELESS_PACKAGE_JSON` dan Git LF/CRLF notices masih muncul. ESLint tetap nol warning. Jangan menambahkan `"type": "module"` tanpa mengecek script CommonJS existing.

## 4. Backend: Bagian yang Sehat dan Batas Keyakinan

### Auth dan authorization

Owner binding, konfirmasi provider, purpose-bound invitation/recovery, live-session authorization, serta recovery dengan pencabutan sesi lama memiliki bukti lokal. Authorization berada di server/RPC; redirect layout/proxy bukan satu-satunya kontrol keamanan.

Business schema privat, restricted grants, `SECURITY DEFINER` dengan search path terkunci, dan owner checks menjaga jalur akses. Proof terbaru mencakup native grants. Tidak ditemukan bypass baru yang terkonfirmasi dalam cakupan ini; bukan sertifikasi keamanan menyeluruh.

### Stock, transaksi, dan uang

Row locks, version checks, durable UUID/payload replay, append-only evidence, dan rollback diuji terhadap PostgreSQL nyata. Exact costing tetap di DB; final sold unit menghabiskan quantity dan cost tanpa residual. Stock Out terpisah dari opname; found stock membutuhkan cost eksplisit.

Perbaikan dashboard zero-stock valuation ada sebagai forward migration untracked `20261013000000_dashboard_zero_stock_value.sql` dan ikut proof terbaru. Grant helper Settings telah diperbaiki forward migration `20261010050000_settings_private_grants.sql`. Keduanya bukan bug runtime aktif setelah seluruh migrasi direplay.

### Reports dan Settings

Shop-timezone dates, exact totals, pemisahan sold/opname, pagination/bounds, dan CSV formula defense memiliki regresi lokal. Settings defaults, lost-response retry, konflik, dan reset tanpa mengubah saved profile/timezone tercakup.

UI linked quantity correction sudah ada dalam working tree dan ikut suite Inventory terbaru. `docs/CHECKPOINT.md` yang menyebut fitur belum dimulai tidak cocok dengan source saat audit. Asal persetujuan implementasi sebelumnya tidak ditentukan oleh audit ini; jangan menghapus kode atau menganggap dokumen lama sebagai status runtime.

## 5. Standards

Sumbu ini menilai aturan repo, bukan kelengkapan product requirement.

1. **Uang authoritative hilang di adapter.** `src/features/inventory/adapters.ts:17` mengubah decimal string menjadi float; `inventory-detail-sheet.tsx:86` menghitung total dari rounded average. Ini bertentangan dengan exact DTO/data-flow di `ARCHITECTURE.md` dan `docs/FULLSTACK_SPEC.md:59–60`. Total harus memakai `inventoryCostValue` langsung.
2. **Aksesibilitas drawer Inventory belum setara shared pattern.** `inventory-detail-sheet.tsx:97–125` memakai overlay/custom `div`, tanpa dialog semantics, focus containment/return, dan accessible name pada tombol X. Bertentangan dengan aturan keyboard/label `AGENTS.md`. Products sudah memakai shared `Sheet`; pakai pola kompatibel existing.
3. **Lokalisasi tidak konsisten.** `overview-cards.tsx:24–50` tidak menangani potential metric IDs; labels/supporting text fallback dari server berbahasa Indonesia. Reports dan Inventory juga menyimpan hardcoded copy. Perbaikan harus memakai dictionaries existing, bukan pola i18n baru.
4. **Token desain bocor pada elemen reachable.** `user-menu.tsx:27,33` memakai rounded/soft border; `valuation-report-view.tsx:95–96` memakai rounded bars. `design.md:23,65–66` mewajibkan zero radius dan melarang soft borders.

**Heuristik, bukan pelanggaran keras:** possible Speculative Generality pada tombol List/Grid tanpa handlers di `inventory-toolbar.tsx:24–32`; hapus kontrol yang belum dibutuhkan. Duplicate currency formatting sebaiknya diatasi melalui helper existing saat memperbaiki valuasi, bukan refactor global.

Guarded adjustment state milik komponen sendiri di Settings bukan otomatis pelanggaran React. Tidak ada failing scenario terkonfirmasi; jangan menggantinya dengan prop-copy `useEffect` yang bertentangan dengan aturan repo.

**Ringkasan Standards: 4 kelompok temuan terkonfirmasi; dampak tertinggi dalam sumbu ini adalah ketidakakuratan tampilan valuasi Inventory.**

## 6. Spec

Sumbu ini menilai perilaku dan bukti penerimaan, terpisah dari Standards.

1. **Browser acceptance belum mencakup archive/reactivation.** `docs/FULLSTACK_SPEC.md:77` meminta browser smoke keduanya. Pencarian seluruh `scripts/test-*.py` tidak menemukan langkah archive/reactivate. SQL lifecycle/race proof tidak menggantikan pengujian kontrol browser, reload, dan cross-route state.
2. **Lookup restock memotong daftar tanpa penjelasan.** `product-add-modal.tsx:72,104` meminta page 1/25 dan tidak memakai total/pagination. Requirement penerimaan barang existing (`docs/BACKEND_PLAN.md:25,52–54`) tetap sebagian tersampaikan: produk di luar 25 match tidak ada pada dropdown sampai query dipersempit. Exact SKU search merupakan workaround; tidak berarti produk sama sekali tidak dapat direstock.
3. **Capacity ditampilkan seolah data bisnis.** `adapters.ts:15` membuat `maxStock` dari heuristic, tetapi `inventory-detail-sheet.tsx:168,238–239` melabelinya sebagai maksimum/kapasitas. Requirement batas stock hanya threshold; tidak ada field kapasitas authoritative. Jangan menambah DB field untuk membenarkan label; hilangkan klaim kapasitas atau jelaskan sebagai skala visual.

Tidak dihitung sebagai gap: optional `correctionOfEventId` yang tidak dikirim pada present-value cost correction; normal opname tanpa link; prefix suggestions case-sensitive yang tidak dipakai untuk pencarian current UI; jitter auth yang bisa merupakan hardening. Historical SQL defects yang sudah dioverride dicatat sebagai perbaikan, bukan temuan aktif.

**Ringkasan Spec: 3 kelompok gap terkonfirmasi; dampak tertinggi dalam sumbu ini adalah acceptance browser lifecycle yang belum lengkap.**

## 7. Temuan Operasional dan Skenario Konkret

Prioritas berikut untuk sequencing perbaikan, bukan reranking dua sumbu review di atas. P1 = correctness/proof reliability; P2 = UX/coverage/reproducibility; P3 = kosmetik. Tidak ada P0 baru terkonfirmasi.

### H1 — P1: Total modal Inventory dapat salah

Lokasi: `src/features/inventory/adapters.ts:17`, `src/features/inventory/components/inventory-detail-sheet.tsx:86,262`.

DB DTO mengirim `averagePurchaseCost` hasil pembagian dibulatkan enam desimal (`20261009010000_stock_foundation.sql:164`). Adapter membuang authoritative total. Skenario valid: stock `1_000_000_000`, total modal `"1.000000"`, average `"0.000000"`. Sheet menghitung `1_000_000_000 * 0 = 0`, padahal total benar Rp 1. Pemeriksaan assert arithmetic dijalankan dan lulus sebagai reproduksi mismatch. Ini bukan corruption ledger; tampilan yang salah.

Fix minimum: pertahankan exact decimal DTO di `InventoryItem`, tampilkan total langsung melalui formatter uang existing; jangan menjadikan rounded average sumber total.

### H2 — P1: Rollback probe operations bertabrakan dengan migrasi existing

Lokasi: `scripts/check-operations.mjs:142–146`.

Drill telah menerapkan seluruh current migrations sebelum menambah `20261011000000_operations_failure.sql`. Versi `20261011000000` sudah dipakai `20261011000000_report_accuracy.sql`. Probe dapat ditolak CLI karena duplicate/order sebelum SQL fault berjalan; assertion history count `0` juga bertentangan dengan versi yang sudah tercatat. Maka self-test PASS tidak membuktikan current rollback/restore drill dapat selesai.

Verifikasi: inspect source + offline assertion terhadap nama migrasi. **Live operations `--run` tidak dijalankan sesi ini**, sehingga error terminal tertentu tidak diklaim.

Fix minimum: pilih synthetic probe version unik yang lebih besar dari latest fixture migration; buktikan belum tercatat, SQL fault benar-benar tercapai, DDL/domain rollback, history unchanged. Jangan mengubah migration produksi lama.

### H3 — P1: Evidence operations bisa PASS meski cleanup gagal

Lokasi: `scripts/check-operations.mjs:225–241`.

`evidence.json` dan console PASS ditulis sebelum `finally` cleanup. Jika inspect/stop gagal, exit code menjadi 1 tetapi evidence tetap `PASS_LOCAL_ONLY`. Consumer evidence dapat salah membaca fixture retained sebagai proof selesai.

Verifikasi statis/control-flow; failure injection cleanup belum dilakukan. Fix minimum: kumpulkan outcome testing dan cleanup, lalu tulis final status yang mencerminkan keduanya, termasuk kegagalan. Hardening runner sudah memiliki pola final evidence yang benar; tidak perlu framework baru.

### H4 — P2: Drawer Inventory belum aman untuk keyboard/screen reader

Lokasi: `inventory-detail-sheet.tsx:97–125`.

Saat overlay terbuka, custom markup tidak mengisolasi focus/background, tidak memberikan dialog semantics, dan X tidak memiliki accessible text. Escape handler ada, tetapi tidak menggantikan focus trap/return. Reuse shared `Sheet` tanpa mengubah operasi, retry, atau history behavior.

### H5 — P2: UI locale dan kontrol memberikan janji yang tidak konsisten

Lokasi: `overview-cards.tsx:24–50`; `stock-movement-modal.tsx:87,92`; `stock-adjustment-modal.tsx:267`; `valuation-report-view.tsx:112,123–126`; `movement-velocity-view.tsx:129–134`; `inventory-toolbar.tsx:24–32`.

English mode tetap memuat labels/supporting text potential Indonesia; Indonesian mode memuat validation/help dan report headers Inggris. List/Grid terlihat aktif tetapi tidak melakukan apa pun. Screenshot terbaru juga menunjukkan kontrol List/Grid Inggris pada UI Indonesia.

Fix minimum: keys dictionaries existing; hilangkan toggle inert jika grid bukan requirement. Jangan mengimplementasikan grid baru hanya untuk menghidupkan tombol.

### H6 — P2: Reproducibility, coverage, dan dokumentasi tertinggal

- `npm run check` belum memanggil seeder safety dan operations **self-test**. Jangan memasukkan mutating `--run` ke fast check.
- Belum ada deklarasi runtime Node/npm dan dependency Python/Playwright yang memadai untuk reproduksi; tidak ada CI workflow ditemukan.
- Browser archive/reactivation belum tercakup; current dev harness belum menguji production runtime.
- `README.md:7–25` masih mengklaim mock phase/team settings dan Getting Started belum menjelaskan backend lokal.
- `docs/CHECKPOINT.md:16–18` dan status terkait `PROGRESS.md` tertinggal dari linked quantity correction working tree.
- Bukti lokal bergantung pada file untracked. HEAD checkout saja tidak mereproduksi baseline audit; release/commit terpisah harus memastikan source yang disetujui tercakup.

## 8. Performance dan Keamanan: Belum Cukup untuk Klaim Produksi

**Positif:** bounded reads/export, indeks dan transaksi native, feature-oriented boundaries, exact formatting pada Products/Reports, serta tidak perlu layer backend kedua.

**Belum diuji:** Web Vitals, route-level initial-load JS, hosted latency/cold start, p95 query/action duration, query plans pada ukuran data representatif, capacity nyata layanan terpilih, audit advisory online terkini, audit contrast/screen reader lengkap.

Pengukuran build: 35 emitted JS assets, total sekitar 2.07 MB raw / 600 KB gzip **di seluruh route**. Ini bukan initial-load payload dan tidak cukup untuk menyebut frontend lambat. Jangan mengoptimalkan bundle atau menambah cache/index berdasarkan angka ini saja.

## 9. Rencana Eksekusi Setelah Review

Setiap slice harus mendapat persetujuan implementasi. TDD/regresi memakai launcher existing dan fixture sintetis disposable. Proof lokal berjalan serial; jangan melemahkan guard agar test hijau.

### Slice A — Correctness tampilan uang + reliability operations

1. Pertahankan exact total modal dalam adapter/type Inventory; tampilkan melalui formatter existing.
2. Tambahkan regresi edge case rounded-average versus total authoritative dan cross-view Products/Inventory/Reports.
3. Perbaiki synthetic rollback probe version dan final evidence setelah cleanup.
4. Tambahkan self-test collision selection dan cleanup failure; verifikasi evidence tidak pernah PASS saat cleanup gagal.
5. Jalankan operations dump/restore segar setelah perbaikan, secara serial dan hanya pada fixture run-owned baru.

**Acceptance:** total modal tidak dihitung ulang dari average; money boundary tetap strings; rollback fault terbukti, data/history tetap; fresh restore/login/replay/grants lulus; cleanup status benar. Tidak ada migrasi domain atau dependency baru diperlukan untuk scope ini.

### Slice B — Aksesibilitas dan UX operasional minimum

1. Reuse shared `Sheet` untuk Inventory detail, dengan title/description, accessible close, Escape, focus containment dan return.
2. Perbaiki potential labels/supporting text, validation/help, serta report headers melalui dictionaries existing.
3. Hapus List/Grid inert. Hilangkan klaim kapasitas fabricated; tetap tampilkan current stock dan min threshold authoritative.
4. Pada restock lookup, pertahankan hasil bounded: tampilkan batas/total dan kontrol paging sederhana, atau pesan jelas untuk mempersempit query jika itu pilihan UX yang direview. Jangan mengambil seluruh katalog tanpa batas.

**Acceptance:** keyboard tidak masuk background saat drawer terbuka; focus kembali; Indonesian/English bersih pada affected copy; kontrol punya fungsi; produk di page berikutnya dapat ditemukan tanpa truncation tersembunyi; responsive 1440/390px tanpa page overflow.

### Slice C — Tutup gap proof dan reproducibility

1. Tambah browser archive/reactivate: zero-stock prerequisite, nonzero-stock rejection, identity/history retained, reload/cross-route, pending/error/retry.
2. Tambah mode production pada launcher existing untuk isolated `next build` + `next start`, tetap memakai env sintetis dan guard yang sama. Hindari membuat harness kedua.
3. Masukkan seeder safety dan operations self-test ke fast check.
4. Nyatakan versi runtime minimum/teruji dan dependency Python/Playwright; browser installation jelas. Versi teruji sesi ini: Node 22.20.0, npm 11.6.1, Python 3.14.6, Playwright 1.62.0, Docker server 29.4.1. Ini bukti satu environment, bukan otomatis versi minimum kompatibel.
5. Siapkan CI fast checks setelah approval. Remote CI/full proof bukan otomatis diizinkan oleh audit lokal; pilih environment dan izin terpisah sebelum menjalankannya.

**Acceptance:** clean setup dapat mereproduksi fast checks; dev proof full + production browser smoke lulus; cleanup/evidence benar; lifecycle browser tercakup. Online dependency audit hanya setelah izin akses jaringan/upload metadata bila diperlukan.

### Slice D — Dokumentasi dan hygiene release

1. Selaraskan README dengan satu owner/warung, persistence lokal, onboarding, safe proof commands, dan blocked gates.
2. Update PROGRESS/CHECKPOINT berdasarkan source dan evidence terbaru; jangan mengubah sejarah status lama menjadi seolah proof baru.
3. Rapikan hanya reachable token leaks setelah design review. Dead-code removal hanya jika tidak dipakai runtime/test; jangan hapus regression fixtures yang masih berguna.
4. Review perubahan existing sebelum staging. Commit per slice hanya jika diminta; pastikan untracked migration/component/test penting tidak tertinggal. Push/PR memerlukan permintaan terpisah.

**Acceptance:** checkout yang disetujui memuat seluruh source proof; dokumentasi tidak menjanjikan produksi atau fitur di luar scope; tidak ada credential/dump/log masuk Git.

### Gate eksternal — Tetap HOLD

Ikuti `docs/DEPLOY_PLAN.md`, tidak menggantinya dengan rencana baru:

- A1: ownership akun, operator dan penanggung jawab recovery.
- A2: budget/plan/cost sign-off.
- A3: region dan latency decision.
- A4: SMTP provider/domain/recipient, SPF/DKIM/DMARC, izin kirim.
- A5: backup off-device, encryption key custody, retention.

Setelah keputusan dan izin eksplisit: hosted provisioning/runtime proof, email delivery/recovery, capacity, off-host backup/restore, baru launch gate. RPO/RTO harus dibuktikan pada pilihan layanan, bukan disimpulkan dari local restore atau build. Data warung nyata/import tetap dilarang sampai izin terpisah.

## 10. Keputusan Review yang Disarankan

**Setujui Slice A dahulu**, lalu Slice B dan C; dokumentasi diselaraskan saat milestone relevan. Jangan membuka cloud/SMTP/deployment sebagai bagian implisit dari persetujuan perbaikan lokal.

Tidak perlu numeric health score: nilai tunggal akan menyamarkan perbedaan antara local correctness yang kuat, frontend gaps, dan operational gates yang belum terbukti. Ukur kemajuan melalui acceptance serta evidence per slice.

**Dokumen ini hanya hasil audit dan usulan urutan kerja. Tidak ada slice yang telah dieksekusi sebagai perbaikan.**
