# Checkpoint — Lanjut P2

Diperbarui: 2026-10-14. Target lanjut: P2 #5 setelah rencana dan approval terpisah.
Branch: `refactor/warung-scope`. HEAD saat verifikasi: `a501af16abe645b083853ea8ef5be07f049811bb`.

## Status

**4/5 temuan P2 asli selesai dan terverifikasi lokal:**

1. Seeder katalog exit nonzero saat partial/all failure. Perubahan sudah ada dalam working tree sebelum sesi; `node scripts/check-seeder-safety.mjs` PASS.
2. Dashboard nilai jual stok habis sekarang nol. Forward migration `supabase/migrations/20261013000000_dashboard_zero_stock_value.sql`; regresi signed RPC di `scripts/check-reports-contract.mjs`. RED `1100n` vs `0n`, GREEN PASS.
3. Reset Settings hanya mengembalikan defaults produk `Pcs`/`15`. Profil/timezone tersimpan tidak berubah; draft profil belum disimpan tetap lokal. Regresi browser/Server Action RED → GREEN.

4. UI koreksi modal selesai: aksi terpisah dari baris stok dan detail valuasi; read terkini setiap pembukaan, validasi exact whole-IDR/alasan, frozen replay, konflik/review, dan retry baca setelah commit terverifikasi. Action/RPC/schema existing unchanged; tidak mengirim `correctionOfEventId` dalam #4.

**4/5 temuan P2 asli selesai dan terverifikasi lokal. P2 #5 (tautan koreksi jumlah ke transaksi asal) juga kini terimplementasi dalam working tree:**

5. Tautan koreksi jumlah selesai: UI opname mengirim `correctionOfEventId` ke `recordOpnameAction`/`stockos_record_opname` (`stock-adjustment-modal.tsx` mengirim `correction.id` saat correction aktif; validasi `note` wajib untuk koreksi tertaut di `RecordOpnameInputSchema`). Suite browser `scripts/test-inventory.py` menguji unlinked opname normal, koreksi tertaut, koreksi atas koreksi, zero-stock found-goods tertaut, dan replay identik. Status 2026-10-14 audit yang menyebut "belum dikerjakan" sudah terlampaui.

## Verifikasi terakhir

- Inventory koreksi modal (2026-10-14): `python -I scripts/launch-hardening-proof.py --run --only inventory` — **PASS_LOCAL_ONLY**, coverage **partial**, cleanup **PASS**. Evidence `%TEMP%/stockos-hardening-vdtibtk9/evidence.json`; diff SHA-256 `49b289f898a45a1dc6cc09668bc1dc7772592875ca20d32c376f776b9e54c026`, termasuk untracked source.
- Inventory proof mencakup koreksi present-value tanpa mengubah jumlah/metadata/riwayat lama, kedua entrypoint, input invalid tanpa mutation, zero-stock/zero-cost, nominal panjang tidak dipotong, double-click/close guards, replay payload/UUID identik tanpa evidence tambahan, state live lebih baru dari receipt replay, konflik dua sesi/retry baca/review eksplisit, known-commit retry baca saja, initial-read failure/retry, keyboard focus, reload, bounds 1440/390px dan screenshot inspected. RED missing entrypoint dan oversized input terkonfirmasi; initial-read injection satu request diperketat karena read sukses lain bisa merender form. Main hardening context tanpa page errors; routes drained sebelum teardown.
- Dashboard: `python -I scripts/launch-hardening-proof.py --run --only reports-contract` — `PASS_LOCAL_ONLY`, coverage partial, cleanup PASS. Evidence `%TEMP%/stockos-hardening-ej7hrg0n/evidence.json`.
- Settings: `python -I scripts/launch-hardening-proof.py --run --only settings` — `PASS_LOCAL_ONLY`, coverage partial, cleanup PASS. Evidence `%TEMP%/stockos-hardening-v5mr53ma/evidence.json`.
- Seeded forward upgrade, durable/no-op replay, clean migration replay, native grants PASS.
- Settings proof mencakup saved profile/non-Jakarta timezone, dirty profile/timezone, reset defaults, frozen lost-response retry tanpa kenaikan versi replay, persisted reload, konflik/refresh, desktop 1440px dan mobile 390px tanpa overflow.
- Proof self-test, seeder safety, `npm run check`, `npm run typecheck`, `npm run lint -- --max-warnings 0`, `npm run build`, Python syntax, `git diff --check` PASS sesudah UI koreksi modal.
- Node `MODULE_TYPELESS_PACKAGE_JSON` dan Git LF/CRLF notices tetap ada; ESLint nol warnings.
- Full sembilan-suite tidak diulang untuk perubahan P2 ini. Jangan menyamakan subset proof dengan full proof atau kesiapan produksi.

## Working tree yang harus dipertahankan

Perubahan P2 yang dipertahankan:
- `scripts/test-inventory.py`
- `src/features/inventory/components/cost-adjustment-modal.tsx` (untracked)
- `src/features/inventory/components/inventory-container.tsx`
- `src/features/inventory/components/inventory-stock-table.tsx`
- `src/features/inventory/components/inventory-detail-sheet.tsx`
- `src/lib/i18n/types.ts`
- `PROGRESS.md`
- `scripts/check-reports-contract.mjs`
- `supabase/migrations/20261013000000_dashboard_zero_stock_value.sql` (untracked)
- `scripts/test-settings.py`
- `src/features/settings/components/settings-container.tsx`
- `src/lib/i18n/translations/id.ts`
- `src/lib/i18n/translations/en.ts`

Perubahan sudah ada sebelum sesi, jangan dibuang/ditimpa:
- `scripts/seed-products-json.mjs`
- `scripts/seed-warung-catalog.mjs`
- `scripts/check-seeder-safety.mjs` (untracked)
- `skills-lock.json`

Semua belum di-commit/push. `CHECKPOINT.md` ini catatan tambahan, bukan runtime change.

## Langkah lanjut

1. Ikuti bootstrap `AGENTS.md` untuk sesi baru; baca checkpoint ini dan cek `git status`/diff aktual. Jangan anggap snapshot working tree masih sama.
2. P2 #1–#5 selesai dalam working tree (lihat Status). Langkah berikutnya adalah Slice B/C dari `docs/PROJECT_HEALTH_PLAN.md` (aksesibilitas drawer, lokalisasi, proof gaps) sesuai approval.
3. Pertahankan frozen request UUID/payload/intent, version conflict/review, uncertain-result retry, dan read-only refresh setelah confirmed commit. Jangan menimpa draft saat conflict/uncertainty.
4. Pakai fixture sintetis disposable melalui launcher existing; jangan reset/mutasi resource retained atau melonggarkan guard cleanup. Verifikasi hasil dan cleanup sebelum menyatakan selesai; update `PROGRESS.md` setelah verified.
5. Commit/push memerlukan permintaan eksplisit. Pastikan untracked migration/component/test penting tidak tertinggal saat staging.

## Batas izin

Checkpoint bukan approval implementasi berikutnya. Tidak ada izin cloud, deployment, external SMTP, paid resources, production use, atau real-shop data/import. Jika migration diperlukan dan disetujui, gunakan forward migration baru saja. Commit/push memerlukan permintaan eksplisit. Jangan menampilkan token/password/provider secrets dari protected logs.

Plan UI koreksi modal yang sudah selesai: `C:/Users/USER/.claude/plans/calm-coalescing-noodle.md`.
Plan Settings yang sudah selesai: `C:/Users/USER/.claude/plans/joyful-wobbling-sky.md`.
