## Problem Statement

Saat ini, kategori produk dan pemasok (supplier) di StockOS hanya disimpan sebagai teks bebas pada tabel produk. Pilihan dropdown kategori di modal tambah/edit produk hanya mengandalkan daftar bawaan 8 kategori warung dan saran teks dari produk yang sudah pernah diinput. Hal ini menimbulkan beberapa kendala:
1. Pemilik warung kesulitan memilih kategori karena tidak ada daftar master yang terstruktur dan mudah dikelola.
2. Pemilik warung tidak memiliki menu atau tempat untuk mendokumentasikan daftar pemasok (distributor/toko grosir) beserta kontak telepon/WhatsApp dan catatan ringkasnya.
3. Inkonsistensi penulisan nama kategori atau pemasok menyebabkan filter dan pengelompokan produk menjadi terpecah.
4. Pemilik tidak dapat menambah kategori atau pemasok baru secara cepat saat sedang menginput produk baru tanpa merusak keseragaman data.

## Solution

Menyediakan fitur manajemen master data kategori produk dan pemasok yang sederhana dan praktis:
1. **Manajemen di Pengaturan (`/settings`)**: Menambahkan tab/seksi di halaman Pengaturan untuk mengelola master Kategori Produk dan Daftar Pemasok (tambah, edit nama/kontak, hapus dengan proteksi).
2. **Quick-Add di Modal Produk**:
   - Kategori: Combobox *creatable* yang memungkinkan pemilik mengetik kategori baru dan langsung menambahkannya dalam satu klik saat input produk.
   - Pemasok: Tombol mini `+` di samping kolom pemasok untuk membuka dialog cepat (nama, no. telepon/WA, catatan).
3. **Penyimpanan Snapshot Teks (ADR 0002)**: Tabel master menyimpan entitas referensi, sedangkan produk dan riwayat stok tetap menyimpan teks snapshot. Rename di master secara otomatis memperbarui data produk aktif, namun bukti audit historis (bukti stok masuk/nota) tetap abadi dan tidak rusak.
4. **Proteksi Integritas**: Kategori dan pemasok yang masih digunakan oleh produk aktif tidak dapat dihapus (*restrict delete*).
5. **Dukungan SKU PLU**: Kategori kustom baru otomatis menggunakan digit prefix PLU `9` (Lainnya/Umum) untuk penomoran SKU otomatis.

## User Stories

1. As a Pemilik warung, I want to view a dedicated list of product categories in the Settings page, so that I can see all active categories available in my shop.
2. As a Pemilik warung, I want to add a new custom category from the Settings page, so that I can classify goods specific to my shop inventory.
3. As a Pemilik warung, I want to edit an existing category name in Settings, so that typos or naming adjustments can be corrected centrally.
4. As a Pemilik warung, I want category renames to automatically update active products using that category, so that my product filters and groupings stay consistent without manual updates.
5. As a Pemilik warung, I want the system to prevent deleting a category if it is currently assigned to active products, so that my product catalog never gets orphaned or corrupted.
6. As a Pemilik warung, I want to delete an unused category from Settings, so that my category dropdown stays clean and relevant.
7. As a Pemilik warung, I want the 8 canonical warung categories to be pre-seeded in my shop, so that I have a practical baseline catalog out of the box.
8. As a Pemilik warung, I want to view a dedicated list of suppliers in the Settings page, so that I have an organized directory of my distributors and wholesale shops.
9. As a Pemilik warung, I want to add a new supplier with their name, phone/WhatsApp number, and brief notes in Settings, so that I can easily find contact information when reordering goods.
10. As a Pemilik warung, I want to edit a supplier's name, phone number, and notes in Settings, so that supplier contact details remain up to date.
11. As a Pemilik warung, I want supplier renames to automatically update active products associated with that supplier, so that filtering by supplier remains accurate.
12. As a Pemilik warung, I want the system to prevent deleting a supplier if any active product is still linked to them, so that product sourcing data is preserved.
13. As a Pemilik warung, I want to delete an unused supplier from Settings, so that obsolete or inactive vendors do not clutter my list.
14. As a Pemilik warung, I want a structured dropdown/combobox for category selection inside the Add Product modal, so that I can select a category quickly without typing from scratch.
15. As a Pemilik warung, I want to create a new category directly inside the Add Product modal combobox, so that I do not have to leave the product creation flow when introducing a new category.
16. As a Pemilik warung, I want products created with a new custom category to automatically receive a PLU SKU prefixed with digit 9, so that automatic retail SKU standards remain consistent.
17. As a Pemilik warung, I want a structured dropdown for selecting a supplier in the Add Product modal, so that I can select existing suppliers consistently.
18. As a Pemilik warung, I want a quick-add button next to the supplier field in the Add Product modal, so that I can add a new supplier with contact details on the fly.
19. As a Pemilik warung, I want the same category combobox and supplier quick-add available in the Edit Product modal, so that updating existing products is equally effortless.
20. As a Pemilik warung, I want existing categories and suppliers from currently stored products to be automatically populated into the master tables during migration, so that no existing data is lost.
21. As a Pemilik warung, I want historical stock receipts, opname events, and audit logs to retain their original category and supplier snapshots, so that past operational records remain immutable even if masters are edited or removed.
22. As a Pemilik warung, I want quick click-to-copy or click-to-WhatsApp on supplier phone numbers in the Settings supplier list, so that I can contact distributors with a single click from my device.

## Implementation Decisions

### Data & Architecture
- **Dedicated Master Tables**: Create `categories` and `suppliers` in the private database schema.
  - `categories`: `id` (UUID), `name` (unique nonblank text, max 120), `created_at`, `updated_at`.
  - `suppliers`: `id` (UUID), `name` (unique nonblank text, max 120), `phone` (optional text, max 40), `notes` (optional text, max 500), `created_at`, `updated_at`.
- **Text Snapshot Storage (ADR 0002)**: The `products` table continues to store `category` (required text) and `supplier` (nullable text). Past `inventory_events` snapshots continue to hold the original text captured at the time of the event.
- **Controlled Rename Propagation**: When a category or supplier is renamed in the master table, a server RPC updates the corresponding string values in all active `products` rows within the same transaction. Past inventory events are never modified.
- **Deletion Safeguard**: An RPC enforces that a category or supplier can only be deleted if `COUNT(*) FROM products WHERE category = ...` (or `supplier = ...`) is zero. Otherwise, a validation conflict is returned.
- **Migration & Seeding**: A forward database migration automatically seeds the 8 standard warung categories and extracts distinct existing `category` and `supplier` text from `products` into the respective master tables.

### Server Contracts & RPCs
- Private RPCs with verified owner context:
  - `stockos_list_categories` & `stockos_create_category` & `stockos_update_category` & `stockos_delete_category`
  - `stockos_list_suppliers` & `stockos_create_supplier` & `stockos_update_supplier` & `stockos_delete_supplier`
- Server Actions wrapped with authentication verification, schema validation (Zod), and cache revalidation.

### User Interface & Interaction
- **Settings Page**: Add two tabs or organized card sections under `/settings`:
  - "Kategori Produk": Data table listing categories, product count per category, action buttons for edit and delete, and a "+ Tambah Kategori" button triggering a simple modal.
  - "Pemasok / Distributor": Data table listing supplier name, phone/WA, notes, product count, and actions for edit/delete, plus quick-action link to WA/dial.
- **Product Modals (Add & Edit)**:
  - Category input transformed into a creatable combobox displaying existing master categories with instant search filtering and a "+ Tambah '[Input]'" option at the bottom.
  - Supplier input transformed into a select dropdown accompanied by a small `+` icon button that opens a mini dialog for quick supplier creation without losing form draft state.
- **PLU SKU Rule**: The `getCategoryPluPrefix` helper defaults any category not matching the 8 standard categories to digit `9`.

## Testing Decisions

- **Testing Philosophy**: Test observable external behavior and workflows rather than internal implementation details.
- **Browser E2E Seam (Playwright / UI verification script)**:
  - Verify navigating to `/settings`, creating a category and supplier, editing their names, and seeing the change reflected on existing products.
  - Verify that attempting to delete a category or supplier currently used by a product displays an error and leaves data intact.
  - Verify deleting an unused category or supplier succeeds.
  - Verify opening the Add Product modal, using inline category creation, and verifying automatic PLU SKU generation with prefix `9`.
  - Verify using inline supplier creation from the modal and confirming the newly created supplier is selected.
- **Contract & Mutation Assertions**:
  - Assert that RPC renames atomically update `products.category` and `products.supplier`.
  - Assert that `inventory_events` snapshots retain historic names after master renames.
  - Assert that delete restrictions fail closed when active products are attached.
- **Prior Art**: Follows existing verification suite patterns in `scripts/check-settings-state.mjs` and `scripts/launch-warung-proof.py`.

## Out of Scope

- Purchase Orders (PO), goods receipt notes across multi-product purchase orders, and supplier invoicing.
- Supplier debt/credit tracking (hutang dagang / accounts payable) and payment terms.
- Multi-location supplier assignments or warehouse fulfillment logic.
- Complex hierarchical category trees (sub-categories / department nesting).
- Staff access controls or permission tiers for category/supplier management.

## Further Notes

- Aligns directly with `GLOSSARY.md` definitions of *Warung*, *Pemilik*, *Kategori*, and *Pemasok*.
- Conforms to `ADR 0002` regarding text snapshots for audit durability.
- All database mutations must use forward-only PostgreSQL migrations under Supabase with owner security definer contexts.
