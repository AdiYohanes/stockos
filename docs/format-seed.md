# Format Seed Data Produk StockOS

Dokumen spesifikasi format data awal (seed) produk untuk StockOS. Seluruh data wajib mematuhi aturan validasi `CreateProductInputSchema` dan domain single-shop warung.

---

## 1. Aturan Validasi Field

| Field | Tipe | Wajib? | Aturan & Keterangan |
|---|---|---|---|
| `sku` | String | Ya | 3–64 karakter, uppercase regex `^[A-Z0-9_./-]{3,64}$`. Contoh: `SEM-BRS-001`. |
| `name` | String | Ya | 1–120 karakter. Nama spesifik barang beserta varian/ukuran. |
| `category` | String | Ya | 1–120 karakter. Wajib salah satu dari 8 Kategori Warung. |
| `unit` | String | Ya | 1–30 karakter. Satuan dasar inventaris. Wajib salah satu dari 12 Satuan Warung. |
| `minStock` | Integer | Ya | Bilangan bulat >= 0. Batas peringatan stok menipis (*menipis* / *low_stock*). |
| `sellingPrice` | String | Ya | String angka bulat Rupiah (regex `^[0-9]{1,13}$`). Contoh: `"72000"`. Bukan float/koma. |
| `openingQuantity` | Integer | Opsional | Bilangan bulat >= 0 (default: 0). Jumlah stok fisik awal saat produk didaftarkan. |
| `purchaseTotal` | String | Kondisional | String angka bulat Rupiah. Total modal pembelian awal (`openingQuantity * modal_per_unit`). <br>- Jika `openingQuantity > 0`: **Wajib diisi**.<br>- Jika `openingQuantity = 0`: **Wajib `"0"`**. |
| `cartonCount` | Integer | Opsional | Jumlah dus/karton penerimaan awal. Jika diisi, wajib disertai `unitsPerCarton`. |
| `unitsPerCarton` | Integer | Opsional | Isi satuan per dus. Syarat mutlak: `cartonCount * unitsPerCarton === openingQuantity`. |
| `supplier` | String | Opsional | Maksimal 120 karakter. Nama agen, grosir, atau pemasok barang. |
| `shelfLocation` | String | Opsional | Maksimal 80 karakter. Lokasi rak fisik warung. Contoh: `"Rak Tengah A-1"`. |
| `barcode` | String | Opsional | Maksimal 64 karakter. Nomor barcode produk pabrik (EAN-13, dsb). |
| `description` | String | Opsional | Maksimal 2000 karakter. Catatan deskripsi tambahan produk. |

---

## 2. Nilai Kanonikal (Kategori & Satuan Warung)

### Kategori Resmi (`WARUNG_CATEGORIES`)
1. `Bahan Pokok`
2. `Mi Instan`
3. `Minuman`
4. `Makanan Ringan`
5. `Bumbu & Dapur`
6. `Perawatan Diri`
7. `Kebersihan Rumah`
8. `Obat & P3K`

### Satuan Stok Resmi (`WARUNG_UNITS`)
- `Pcs`
- `Bungkus`
- `Botol`
- `Sachet`
- `Renceng`
- `Kaleng`
- `Karung`
- `Kg`
- `Butir`
- `Pouch`
- `Dus`
- `Kotak`

---

## 3. Contoh Format JSON

```json
[
  {
    "sku": "SEM-BRS-001",
    "name": "Beras Ramos Setra Ramos 5kg",
    "category": "Bahan Pokok",
    "unit": "Karung",
    "minStock": 5,
    "sellingPrice": "72000",
    "openingQuantity": 15,
    "purchaseTotal": "975000",
    "supplier": "Toko Grosir Beras Subur",
    "shelfLocation": "Rak Belakang B-1",
    "barcode": "899123456701",
    "description": "Beras pulen kemasan 5 kilogram."
  },
  {
    "sku": "MIE-IND-001",
    "name": "Indomie Mi Goreng Spesial 85g",
    "category": "Mi Instan",
    "unit": "Bungkus",
    "minStock": 20,
    "sellingPrice": "3500",
    "openingQuantity": 80,
    "purchaseTotal": "232000",
    "cartonCount": 2,
    "unitsPerCarton": 40,
    "supplier": "Distributor Indofood",
    "shelfLocation": "Rak Depan C-1",
    "barcode": "899886620022",
    "description": "Mi instan goreng 2 dus @ 40 bungkus."
  },
  {
    "sku": "MIN-KOP-001",
    "name": "Kopi Kapal Api Spesial Mix Renceng (10 Sachet)",
    "category": "Minuman",
    "unit": "Renceng",
    "minStock": 10,
    "sellingPrice": "14000",
    "openingQuantity": 15,
    "purchaseTotal": "180000",
    "supplier": "Agen Sembako Makmur",
    "shelfLocation": "Gantungan Minuman A",
    "barcode": "899100210543"
  },
  {
    "sku": "DTR-RNS-001",
    "name": "Deterjen Bubuk Rinso Anti Noda 770g",
    "category": "Kebersihan Rumah",
    "unit": "Bungkus",
    "minStock": 5,
    "sellingPrice": "22000",
    "openingQuantity": 0,
    "purchaseTotal": "0",
    "supplier": "Grosir Sabun Lestari",
    "shelfLocation": "Rak Bawah D-2",
    "barcode": "899999900123",
    "description": "Contoh produk baru belum ada stok fisik."
  }
]
```

---

## 4. Dataset Bawaan

Dataset 18 produk authentic warung sudah tersedia di kode program:
- Path: `src/features/products/sample-warung-catalog.ts`
- Konstanta: `SAMPLE_WARUNG_PRODUCTS`
