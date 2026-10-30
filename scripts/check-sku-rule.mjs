import { randomUUID } from "node:crypto";

/**
 * Auto-SKU rule check. Rule lives in src/features/products/sku.ts (single source).
 */

const { skuFromName } = await import("../src/features/products/sku.ts");

// Self-check samples: name → expected generated SKU.
const samples = [
  ["aqua", "AQUA"],
  ["beng beng", "BENG-BENG"],
  ["mie instan goreng", "MIE-INST"],
  ["Aa", "AAX"],
  ["", "XXX"],
  ["susu ultra milk", "SUSU-ULTR"],
  ["chitato salsa 68g", "CHIT-SALS"],
];
for (const [name, expected] of samples) {
  const got = skuFromName(name);
  if (got !== expected) throw new Error(`skuFromName(${JSON.stringify(name)}) = ${got}, expected ${expected}`);
}

const dup = skuFromName("aqua", 1);
if (dup !== "AQUA-2") throw new Error(`skuFromName("aqua", 1) = ${dup}, expected AQUA-2`);

// Each suffixed variant must pass the catalog schema pattern.
const { CreateProductInputSchema } = await import("../src/features/products/schemas/product-rpc.schema.ts");
for (const [name] of samples) {
  const attempt = 1;
  const sku = skuFromName(name, attempt);
  const parse = CreateProductInputSchema.safeParse({
    requestId: randomUUID(), sku, name: name || "Produk Kosong", category: "Umum", unit: "Pcs",
    minStock: 1, sellingPrice: "1000", openingQuantity: 0, purchaseTotal: "0",
  });
  if (!parse.success) throw new Error(`SKU ${sku} failed schema: ${parse.error.issues.map((i) => i.path.join(".")).join()}`);
}
console.log("skuFromName checks PASS.");
