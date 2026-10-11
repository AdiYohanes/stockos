/**
 * Sample Warung Catalog & Wording Validation
 *
 * Representative real-world product catalog for a single Indonesian small shop (warung).
 * Contains authentic Indonesian consumer packaged goods (FMCG), sembako staples,
 * realistic IDR pricing, base units, and inventory health distributions.
 */

export const WARUNG_CATEGORIES = [
  "Bahan Pokok",
  "Mi Instan",
  "Minuman",
  "Makanan Ringan",
  "Bumbu & Dapur",
  "Perawatan Diri",
  "Kebersihan Rumah",
  "Obat & P3K",
] as const;

export type WarungCategory = (typeof WARUNG_CATEGORIES)[number];

export const WARUNG_UNITS = [
  "Pcs",
  "Bungkus",
  "Botol",
  "Sachet",
  "Renceng",
  "Kaleng",
  "Karung",
  "Kg",
  "Butir",
  "Pouch",
  "Dus",
  "Kotak",
] as const;

export type WarungUnit = (typeof WARUNG_UNITS)[number];

export interface SampleWarungProduct {
  sku: string;
  name: string;
  category: WarungCategory;
  unit: WarungUnit;
  minStock: number;
  sellingPrice: string; // whole IDR decimal string
  unitPurchasePrice: string; // whole IDR modal per base unit
  openingQuantity: number;
  purchaseTotal: string; // openingQuantity * unitPurchasePrice
  currentStock: number;
  supplier: string;
  shelfLocation: string;
  barcode: string;
  description: string;
  cartonCount?: number;
  unitsPerCarton?: number;
}

export const SAMPLE_WARUNG_PRODUCTS: SampleWarungProduct[] = [
  // 1. Bahan Pokok (Sembako)
  {
    sku: "SEM-BRS-001",
    name: "Beras Ramos Setra Ramos 5kg",
    category: "Bahan Pokok",
    unit: "Karung",
    minStock: 5,
    sellingPrice: "72000",
    unitPurchasePrice: "65000",
    openingQuantity: 15,
    purchaseTotal: "975000",
    currentStock: 15,
    supplier: "Toko Grosir Beras Subur",
    shelfLocation: "Rak Belakang B-1",
    barcode: "899123456701",
    description: "Beras pulen kualitas super kemasan 5 kilogram.",
  },
  {
    sku: "SEM-MYK-001",
    name: "Minyak Goreng Bimoli 1 Liter",
    category: "Bahan Pokok",
    unit: "Pouch",
    minStock: 10,
    sellingPrice: "20000",
    unitPurchasePrice: "17500",
    openingQuantity: 24,
    purchaseTotal: "420000",
    currentStock: 24,
    supplier: "Agen Sembako Makmur",
    shelfLocation: "Rak Tengah A-2",
    barcode: "899123456702",
    description: "Minyak goreng kelapa sawit murni kemasan isi ulang 1L.",
    cartonCount: 2,
    unitsPerCarton: 12,
  },
  {
    sku: "SEM-MYK-002",
    name: "Minyak Goreng Tropical 2 Liter",
    category: "Bahan Pokok",
    unit: "Botol",
    minStock: 6,
    sellingPrice: "38000",
    unitPurchasePrice: "34000",
    openingQuantity: 12,
    purchaseTotal: "408000",
    currentStock: 12,
    supplier: "Agen Sembako Makmur",
    shelfLocation: "Rak Tengah A-2",
    barcode: "899123456703",
    description: "Minyak goreng 2 kali penyaringan kemasan botol 2 liter.",
    cartonCount: 2,
    unitsPerCarton: 6,
  },
  {
    sku: "SEM-GLA-001",
    name: "Gulaku Gula Pasir Tebu 1kg",
    category: "Bahan Pokok",
    unit: "Bungkus",
    minStock: 8,
    sellingPrice: "18000",
    unitPurchasePrice: "15500",
    openingQuantity: 20,
    purchaseTotal: "310000",
    currentStock: 20,
    supplier: "Agen Sembako Makmur",
    shelfLocation: "Rak Tengah A-1",
    barcode: "899123456704",
    description: "Gula pasir kristal putih premium kemasan 1 kg.",
  },
  {
    sku: "SEM-TLR-001",
    name: "Telur Ayam Negeri 1kg",
    category: "Bahan Pokok",
    unit: "Kg",
    minStock: 10,
    sellingPrice: "28000",
    unitPurchasePrice: "25000",
    openingQuantity: 30,
    purchaseTotal: "750000",
    currentStock: 30,
    supplier: "Peternakan Barokah",
    shelfLocation: "Peti Telur Depan",
    barcode: "899123456705",
    description: "Telur ayam ras segar grade A per kilogram.",
  },
  {
    sku: "SEM-TPG-001",
    name: "Tepung Terigu Segitiga Biru 1kg",
    category: "Bahan Pokok",
    unit: "Bungkus",
    minStock: 8,
    sellingPrice: "13000",
    unitPurchasePrice: "11000",
    openingQuantity: 18,
    purchaseTotal: "198000",
    currentStock: 18,
    supplier: "Agen Sembako Makmur",
    shelfLocation: "Rak Tengah A-1",
    barcode: "899123456706",
    description: "Tepung terigu serbaguna protein sedang kemasan 1 kg.",
  },

  // 2. Mi Instan
  {
    sku: "MIE-IND-001",
    name: "Indomie Mi Goreng Spesial 85g",
    category: "Mi Instan",
    unit: "Bungkus",
    minStock: 20,
    sellingPrice: "3500",
    unitPurchasePrice: "2900",
    openingQuantity: 80,
    purchaseTotal: "232000",
    currentStock: 80,
    supplier: "Distributor Indofood",
    shelfLocation: "Rak Depan C-1",
    barcode: "899886620022",
    description: "Mi instan goreng rasa original legendaris.",
    cartonCount: 2,
    unitsPerCarton: 40,
  },
  {
    sku: "MIE-IND-002",
    name: "Indomie Kuah Ayam Bawang 69g",
    category: "Mi Instan",
    unit: "Bungkus",
    minStock: 20,
    sellingPrice: "3500",
    unitPurchasePrice: "2900",
    openingQuantity: 60,
    purchaseTotal: "174000",
    currentStock: 60,
    supplier: "Distributor Indofood",
    shelfLocation: "Rak Depan C-1",
    barcode: "899886620023",
    description: "Mi instan kuah kaldu ayam dan minyak bawang gurih.",
  },
  {
    sku: "MIE-SDA-001",
    name: "Mie Sedaap Goreng 90g",
    category: "Mi Instan",
    unit: "Bungkus",
    minStock: 20,
    sellingPrice: "3500",
    unitPurchasePrice: "2850",
    openingQuantity: 45,
    purchaseTotal: "128250",
    currentStock: 45,
    supplier: "Distributor Wings",
    shelfLocation: "Rak Depan C-2",
    barcode: "899886620024",
    description: "Mi instan goreng dengan kriuk bawang renyah.",
  },

  // 3. Minuman & Kopi
  {
    sku: "MIN-KOP-001",
    name: "Kopi Kapal Api Spesial Mix Renceng (10 Sachet)",
    category: "Minuman",
    unit: "Renceng",
    minStock: 5,
    sellingPrice: "14000",
    unitPurchasePrice: "12000",
    openingQuantity: 15,
    purchaseTotal: "180000",
    currentStock: 15,
    supplier: "Agen Sembako Makmur",
    shelfLocation: "Gantungan Kasir G-1",
    barcode: "899123456710",
    description: "Kopi bubuk hitam dan gula dalam satu sachet renceng.",
  },
  {
    sku: "MIN-TEH-001",
    name: "Teh Botol Sosro Kotak 250ml",
    category: "Minuman",
    unit: "Kotak",
    minStock: 12,
    sellingPrice: "4000",
    unitPurchasePrice: "3200",
    openingQuantity: 24,
    purchaseTotal: "76800",
    currentStock: 24,
    supplier: "Distributor Minuman Segar",
    shelfLocation: "Showcase Minuman S-1",
    barcode: "899123456711",
    description: "Teh melati manis kemasan tetra pak 250ml.",
    cartonCount: 1,
    unitsPerCarton: 24,
  },
  {
    sku: "MIN-AQU-001",
    name: "Air Mineral Aqua 600ml",
    category: "Minuman",
    unit: "Botol",
    minStock: 24,
    sellingPrice: "4000",
    unitPurchasePrice: "3100",
    openingQuantity: 48,
    purchaseTotal: "148800",
    currentStock: 48,
    supplier: "Distributor Danone",
    shelfLocation: "Showcase Minuman S-2",
    barcode: "899123456712",
    description: "Air mineral pegunungan botol sedang 600ml.",
    cartonCount: 2,
    unitsPerCarton: 24,
  },
  {
    sku: "MIN-SKM-001",
    name: "Susu Kental Manis Frisian Flag Cokelat 370g",
    category: "Minuman",
    unit: "Kaleng",
    minStock: 6,
    sellingPrice: "13500",
    unitPurchasePrice: "11500",
    openingQuantity: 12,
    purchaseTotal: "138000",
    currentStock: 12,
    supplier: "Agen Sembako Makmur",
    shelfLocation: "Rak Tengah B-2",
    barcode: "899123456713",
    description: "Krimer kental manis rasa cokelat kemasan kaleng.",
  },

  // 4. Makanan Ringan
  {
    sku: "SNK-CHT-001",
    name: "Chitato Sapi Panggang 68g",
    category: "Makanan Ringan",
    unit: "Bungkus",
    minStock: 6,
    sellingPrice: "11000",
    unitPurchasePrice: "9200",
    openingQuantity: 14,
    purchaseTotal: "128800",
    currentStock: 14,
    supplier: "Distributor Indofood",
    shelfLocation: "Rak Snack D-1",
    barcode: "899123456714",
    description: "Keripik kentang bergelombang rasa beef barbeque.",
  },
  {
    sku: "SNK-RMA-001",
    name: "Biskuit Roma Kelapa 300g",
    category: "Makanan Ringan",
    unit: "Bungkus",
    minStock: 6,
    sellingPrice: "10500",
    unitPurchasePrice: "8800",
    openingQuantity: 16,
    purchaseTotal: "140800",
    currentStock: 16,
    supplier: "Distributor Mayora",
    shelfLocation: "Rak Snack D-2",
    barcode: "899123456715",
    description: "Biskuit kelapa renyah kaya vitamin dan kalsium.",
  },

  // 5. Perawatan Diri & Kebersihan (termasuk variasi status stok: low_stock dan out_of_stock)
  {
    sku: "SBN-LFB-001",
    name: "Sabun Mandi Lifebuoy Total 10 85g",
    category: "Perawatan Diri",
    unit: "Pcs",
    minStock: 8,
    sellingPrice: "4500",
    unitPurchasePrice: "3600",
    openingQuantity: 4,
    purchaseTotal: "14400",
    currentStock: 4, // low_stock: 4 <= minStock 8
    supplier: "Distributor Unilever",
    shelfLocation: "Rak Sabun E-1",
    barcode: "899123456716",
    description: "Sabun batang perlindungan antibakteri keluarga.",
  },
  {
    sku: "DTR-RNS-001",
    name: "Deterjen Bubuk Rinso Anti Noda 770g",
    category: "Kebersihan Rumah",
    unit: "Bungkus",
    minStock: 5,
    sellingPrice: "22000",
    unitPurchasePrice: "18500",
    openingQuantity: 0,
    purchaseTotal: "0",
    currentStock: 0, // out_of_stock: 0
    supplier: "Distributor Unilever",
    shelfLocation: "Rak Deterjen E-2",
    barcode: "899123456717",
    description: "Deterjen konsentrat penghilang noda membandel 1 kali kucek.",
  },

  // 6. Obat & P3K
  {
    sku: "OBT-TLK-001",
    name: "Tolak Angin Cair Herbal 15ml (Dus 12 Sachet)",
    category: "Obat & P3K",
    unit: "Dus",
    minStock: 4,
    sellingPrice: "45000",
    unitPurchasePrice: "38000",
    openingQuantity: 8,
    purchaseTotal: "304000",
    currentStock: 8,
    supplier: "Toko Obat Sehat",
    shelfLocation: "Rak Kasir F-1",
    barcode: "899123456718",
    description: "Obat herbal terstandar untuk masuk angin dan mual.",
  },
];

export interface SampleCatalogMetrics {
  totalProducts: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryCost: number;
  potentialSellingValue: number;
  potentialGrossProfit: number;
}

export function getSampleCatalogMetrics(
  products: SampleWarungProduct[] = SAMPLE_WARUNG_PRODUCTS
): SampleCatalogMetrics {
  let inStockCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let totalInventoryCost = 0;
  let potentialSellingValue = 0;

  for (const product of products) {
    if (product.currentStock <= 0) {
      outOfStockCount++;
    } else if (product.currentStock <= product.minStock) {
      lowStockCount++;
    } else {
      inStockCount++;
    }

    const unitCost = Number(product.unitPurchasePrice);
    const sellPrice = Number(product.sellingPrice);
    totalInventoryCost += unitCost * product.currentStock;
    potentialSellingValue += sellPrice * product.currentStock;
  }

  const potentialGrossProfit = potentialSellingValue - totalInventoryCost;

  return {
    totalProducts: products.length,
    inStockCount,
    lowStockCount,
    outOfStockCount,
    totalInventoryCost,
    potentialSellingValue,
    potentialGrossProfit,
  };
}
