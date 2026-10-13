# StockOS — Rencana Implementasi Paralel ke Ready-to-Use

Dibuat: 2026-10-13. Basis status: PROGRESS.md 2026-10-13, docs/OPERATIONS.md gate table, docs/BACKEND_PLAN.md §4–§6.

Kunci paralel: pisah tiga jenis kerja — **keputusan (tanpa repo)**, **kerja repo lokal**, **infra cloud** — karena konflik hanya mungkin di repo dan di config Supabase.

---

## Fase 0 — Sekali, sebelum paralel apa pun

- [x] Commit hardening di `refactor/warung-scope`: `0047656` (2026-10-13, 74 path termasuk helper/migrasi baru). TypeScript, ESLint zero-warning, checks lokal dan build PASS. Styling Select bersama dan tiga file seed tidak terkait tetap di working tree, tidak masuk commit. Jangan masukkan diff tersebut ke tugas paralel tanpa scope terpisah.

---

## Track A — Keputusan (owner, tanpa sentuh repo) — mulai sekarang

| # | Keputusan | Membuka |
|---|---|---|
| A1 | Kepemilikan akun Supabase + Vercel, penanggung jawab recovery, operator | C |
| A2 | Budget sign-off (floor ~$45/bln + SMTP + backup storage) | C |
| A3 | Region: Supabase Singapura + Vercel `sin1` (terdekat warung) | C |
| A4 | Provider SMTP + domain + verifikasi SPF/DKIM/DMARC + alamat penerima uji | D |
| A5 | Storage backup off-device, kunci enkripsi, retensi | Launch |

Nol konflik — tidak menyentuh kode.

- [ ] A1
- [ ] A2
- [ ] A3
- [ ] A4
- [ ] A5

---

## Track B — Repo lokal (satu sesi/agen saja) — mulai sekarang

- [x] B1: commit diff hardening (`0047656`; Fase 0)
- [x] B2: `.env.example` hosted dengan lima nama env server dan nilai kosong + inventory secret di `docs/OPERATIONS.md`. Keputusan: vault password manager terenkripsi yang sudah tersedia, milik owner; produk/akun/custodian dan verifikasi recovery masih menunggu A1/A5 sebelum cloud.
- [x] B3: draft prosedur deploy cloud di `docs/OPERATIONS.md`, termasuk callback/template Auth aktual, deployment privat, proof/recovery dan failure gates. Draft bukan bukti atau izin provisioning.

Aturan anti-konflik: satu sesi per repo. Kalau perlu dua agen, branch/worktree terpisah per tugas. Jangan jalankan dua proof suite lokal bersamaan (port tetap 55740–55744, 55840–55844).

---

## Track C — Provisioning cloud (setelah A1–A3 + izin provisioning/deploy eksplisit) — serial internal

- [ ] C1: Buat project Supabase (region A3), catat ref/keys ke secret store — jangan chat/tiket
- [ ] C2: Apply migrasi forward urut dari repo (bukan reset), verifikasi history+grants
- [ ] C3: Buat project Vercel privat, set **5** env var server di scope Preview terpisah, origin HTTPS stabil, Site URL dan allowlist exact `/auth/confirm` + template invite/recovery hosted, deploy preview
- [ ] C4: Smoke staging setelah D: setup owner terverifikasi, login baru, satu mutasi, satu baca — data uji saja

## Track D — SMTP delivery proof (C1 + A4/izin kirim; proof penuh perlu C3 reachable) — serial internal

- [ ] D1: Kirim invite nyata via provider ke test inbox
- [ ] D2: Verifikasi pengirim/link/token/purpose/expiry
- [ ] D3: Selesaikan password setup + recovery end-to-end → tolak JWT lama

Gagal = gate tetap blocked, tanpa fallback (lihat docs/OPERATIONS.md §SMTP).

C dan D sama-sama menyentuh config Auth Supabase; perubahan config harus serial. Persiapan SMTP boleh bersamaan build Vercel, tetapi D3 menunggu origin C3 reachable dan template/callback cocok. Recovery D3 mencabut semua sesi owner; jedakan smoke/load terautentikasi C4/E1, lalu login baru. Jangan menyatakan beda platform berarti semua proof aman paralel.

---

## Track E — Runtime & backup proof (setelah C3; E2 juga perlu A5/izin restore)

Observasi kapasitas independen boleh paralel D. Smoke terautentikasi owner yang sama tidak berjalan saat D3 recovery/global revocation.

- [ ] E1: Batas koneksi/durasi fungsi/spend alert dicek dengan beban uji ringan di staging
- [ ] E2: Backup pertama ke storage A5 + restore drill ke target terkarantina (templat: drill lokal ticket 12 yang PASS)

---

## Gate launch (serial, semua track hijau)

- [ ] Keputusan go/no-go
- [ ] Import data warung sungguhan
- [ ] Go-live

Jangan sampai sini kalau A5 atau D belum hijau.

---

## Diagram urutan

1. Fase 0 dan B selesai lokal; A1–A5 tetap menunggu owner.
2. Setelah A1–A3 dan izin provisioning/deploy: C1, C2, lalu C3.
3. Setelah A4/izin kirim dan C3 reachable: D1–D3, lalu login baru untuk C4.
4. E1 setelah C3; jedakan aktivitas owner terautentikasi selama D3. E2 setelah A5/izin backup-restore.
5. Semua proof hijau dan go/no-go eksplisit sebelum import nyata atau launch.

## Status ringkas saat rencana dibuat

- Implementasi lokal lengkap: semua kode lulus (nine-suite PASS_LOCAL_ONLY 2026-10-13, tsc/ESLint/build hijau).
- Yang memblokir bukan kode: keputusan A1–A5 dan proof di infrastruktur yang belum dibuat (C–E).
- Perkiraan awal 60 file belum di-commit diganti hasil aktual Fase 0: 74 path hardening dalam `0047656`. Diff Select dan tiga file seed bukan scope commit ini.

## Hasil Track B — 2026-10-13

- Fase 0/B1, template/inventory/keputusan secret store B2 dan draft deployment B3 selesai lokal.
- Runtime memakai lima env server, bukan enam; SMTP tetap konfigurasi Supabase Auth.
- A1–A5 belum diputuskan lengkap. C–E dan launch tidak dijalankan. Tidak ada resource cloud, biaya, email nyata, deployment atau data warung nyata.
- Hasil proof ulang dan review dicatat di `PROGRESS.md`; tidak mengubah gate hosted menjadi PASS.
