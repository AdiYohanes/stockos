import { randomUUID } from "node:crypto";

/**
 * Auto-SKU rule check for PLU retail standards (PLU-XXXX).
 * Rule lives in src/features/products/sku.ts (single source).
 */

const { skuFromPlu, skuFromName, getCategoryPluPrefix } = await import("../src/features/products/sku.ts");

// 1. Prefix mapping assertions
const prefixes = [
  ["Bahan Pokok", 1],
  ["Mi Instan", 2],
  ["Mie Instan", 2],
  ["Minuman", 3],
  ["Makanan Ringan", 4],
  ["Bumbu & Dapur", 5],
  ["Perawatan Diri", 6],
  ["Kebersihan Rumah", 7],
  ["Obat & P3K", 8],
  ["Kantong Belanja", 9],
  ["", 9],
  [null, 9],
];
for (const [cat, expected] of prefixes) {
  const got = getCategoryPluPrefix(cat);
  if (got !== expected) throw new Error(`getCategoryPluPrefix(${JSON.stringify(cat)}) = ${got}, expected ${expected}`);
}

// 2. Deterministic PLU generation samples: [category, name, expected]
const samples = [
  ["Bahan Pokok", "Beras Ramos 5kg", "PLU-1095"],
  ["Mi Instan", "Indomie Goreng", "PLU-2236"],
  ["Minuman", "Teh Botol Sosro", "PLU-3239"],
  ["Makanan Ringan", "Chitato Salsa 68g", "PLU-4115"],
  ["Bumbu & Dapur", "Garam Dapur", "PLU-5802"],
  ["Perawatan Diri", "Sabun Lifebuoy", "PLU-6211"],
  ["Kebersihan Rumah", "Sunlight Jeruk Nipis", "PLU-7177"],
  ["Obat & P3K", "Bodrex Sakit Kepala", "PLU-8467"],
  ["Lainnya", "Kantong Plastik Sedang", "PLU-9046"],
  ["", "", "PLU-9760"],
];
for (const [cat, name, expected] of samples) {
  const got = skuFromPlu(cat, name);
  if (got !== expected) throw new Error(`skuFromPlu(${JSON.stringify(cat)}, ${JSON.stringify(name)}) = ${got}, expected ${expected}`);
  if (!/^PLU-[1-9][0-9]{3}$/.test(got)) throw new Error(`Invalid PLU format: ${got}`);
}

// 3. Collision retry increments item code while preserving 4 digits
const base = skuFromPlu("Minuman", "Teh Botol Sosro", 0);
const retry1 = skuFromPlu("Minuman", "Teh Botol Sosro", 1);
if (base !== "PLU-3239" || retry1 !== "PLU-3240") {
  throw new Error(`Collision increment mismatch: base=${base}, retry1=${retry1}`);
}

// 4. Backward compatibility alias
const alias = skuFromName("Teh Botol Sosro");
if (alias !== "PLU-9239") throw new Error(`skuFromName alias mismatch: ${alias}`);

// 5. Schema validation: all generated PLUs must pass CreateProductInputSchema
const { CreateProductInputSchema } = await import("../src/features/products/schemas/product-rpc.schema.ts");
for (const [cat, name] of samples) {
  for (const attempt of [0, 1]) {
    const sku = skuFromPlu(cat, name, attempt);
    const parse = CreateProductInputSchema.safeParse({
      requestId: randomUUID(),
      sku,
      name: name || "Produk Kosong",
      category: cat || "Umum",
      unit: "Pcs",
      minStock: 1,
      sellingPrice: "1000",
      openingQuantity: 0,
      purchaseTotal: "0",
    });
    if (!parse.success) {
      throw new Error(`PLU SKU ${sku} failed schema: ${parse.error.issues.map((i) => i.path.join(".")).join()}`);
    }
  }
}

console.log("skuFromPlu checks PASS.");
