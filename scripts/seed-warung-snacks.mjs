#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { skuFromPlu } from "../src/features/products/sku.ts";

// 1. Read env
const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || "";
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[match[1]] = val;
  }
}

const supabaseUrl = env.SUPABASE_URL;
const anonKey = env.SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const email = env.STOCKOS_EMAILS;
const password = env.STOCKOS_PASSWORD;

assert.ok(supabaseUrl && anonKey && serviceKey, "Supabase env keys required");
assert.ok(email && password, "Owner credentials required in .env.local");

console.log("Connecting to Supabase at", supabaseUrl);

// 2. Load generated photo manifest
const manifestPath = path.join(process.env.CLAUDE_JOB_DIR || ".", "tmp", "snack_photos", "manifest.json");
assert.ok(fs.existsSync(manifestPath), "Manifest not found: " + manifestPath);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

// 3. Upload photos to Supabase Storage via Service Role client
const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log("Uploading photo variants to Supabase Storage bucket 'product-photos'...");
for (const [productKey, variants] of Object.entries(manifest)) {
  for (const variant of ["display", "thumb"]) {
    const item = variants[variant];
    const objectPath = `products/${variant}/${item.hash}`;
    const fileBytes = fs.readFileSync(item.path);

    const { error } = await adminClient.storage
      .from("product-photos")
      .upload(objectPath, fileBytes, {
        contentType: "image/webp",
        upsert: true,
      });

    if (error && !error.message?.includes("already exists")) {
      console.error(`Failed to upload ${objectPath}:`, error.message);
      throw error;
    }
    console.log(`Uploaded ${objectPath} (${item.bytes} bytes)`);
  }
}

// 4. Authenticate owner to call stockos_create_product
const ownerClient = createClient(supabaseUrl, anonKey);
const { data: authData, error: authError } = await ownerClient.auth.signInWithPassword({
  email,
  password,
});
if (authError) {
  console.error("Owner login failed:", authError.message);
  process.exit(1);
}
console.log("Owner authenticated successfully:", authData.user.email);

// 5. Product definitions
const PRODUCTS_DATA = [
  {
    key: "beng-beng",
    name: "Beng Beng Wafer Cokelat 20g",
    category: "Makanan Ringan",
    unit: "Bungkus",
    sellingPrice: "2500",
    openingQuantity: 60,
    purchaseTotal: "120000", // Rp2.000 / pcs
    minStock: 12,
    supplier: "PT Mayora Indah",
    shelfLocation: "Rak Snack A1",
    barcode: "8996001304123",
    description: "Wafer renyah berbalut karamel, krispi beras, dan cokelat lezat 4 kelezatan sekali gigit.",
  },
  {
    key: "better",
    name: "Better Sandwich Biskuit 22g",
    category: "Makanan Ringan",
    unit: "Bungkus",
    sellingPrice: "2500",
    openingQuantity: 50,
    purchaseTotal: "100000", // Rp2.000 / pcs
    minStock: 10,
    supplier: "PT Mayora Indah",
    shelfLocation: "Rak Snack A1",
    barcode: "8996001351110",
    description: "Biskuit sandwich renyah berbalut cokelat tebal dengan isian krim vanila lembut.",
  },
  {
    key: "okky-jelly",
    name: "Okky Jelly Drink Jambu 150ml",
    category: "Minuman",
    unit: "Cup",
    sellingPrice: "1500",
    openingQuantity: 48,
    purchaseTotal: "48000", // Rp1.000 / cup
    minStock: 12,
    supplier: "PT Suntory Garuda Beverage",
    shelfLocation: "Chiller Minuman B1",
    barcode: "8991001402019",
    description: "Minuman jeli sari buah jambu segar penghilang dahaga penunda lapar yang asyik disedot.",
  },
  {
    key: "teh-gelas",
    name: "Teh Gelas Cup Besar 300ml",
    category: "Minuman",
    unit: "Cup",
    sellingPrice: "2000",
    openingQuantity: 48,
    purchaseTotal: "62400", // Rp1.300 / cup
    minStock: 12,
    supplier: "Orang Tua Group",
    shelfLocation: "Chiller Minuman B1",
    barcode: "8991002103403",
    description: "Teh seduh alami dari daun teh pilihan dengan gula asli dalam kemasan cup besar 300ml.",
  },
  {
    key: "teh-pucuk",
    name: "Teh Pucuk Harum Melati 350ml",
    category: "Minuman",
    unit: "Botol",
    sellingPrice: "4000",
    openingQuantity: 48,
    purchaseTotal: "144000", // Rp3.000 / botol
    minStock: 12,
    supplier: "PT Mayora Indah",
    shelfLocation: "Kulkas Minuman B2",
    barcode: "8996001414013",
    description: "Minuman teh beraroma melati segar yang diekstrak dari pucuk daun teh berkualitas.",
  },
];

// 6. Create products via stockos_create_product RPC
console.log("\nCreating products in database...");
const createdProducts = [];

for (const p of PRODUCTS_DATA) {
  const photoMeta = manifest[p.key];
  const photo = {
    display: {
      hash: photoMeta.display.hash,
      bytes: photoMeta.display.bytes,
      width: photoMeta.display.width,
      height: photoMeta.display.height,
    },
    thumb: {
      hash: photoMeta.thumb.hash,
      bytes: photoMeta.thumb.bytes,
      width: photoMeta.thumb.width,
      height: photoMeta.thumb.height,
    },
  };

  const sku = skuFromPlu(p.category, p.name);
  const payload = {
    requestId: randomUUID(),
    sku,
    name: p.name,
    category: p.category,
    unit: p.unit,
    sellingPrice: p.sellingPrice,
    minStock: p.minStock,
    openingQuantity: p.openingQuantity,
    purchaseTotal: p.purchaseTotal,
    supplier: p.supplier,
    shelfLocation: p.shelfLocation,
    barcode: p.barcode,
    description: p.description,
    photo,
  };

  const { data, error } = await ownerClient.rpc("stockos_create_product", {
    p_input: payload,
  });

  if (error || !data?.ok) {
    console.error(`Failed to create product ${sku} (${p.name}):`, error || data);
    process.exit(1);
  }

  const created = data.data.product;
  createdProducts.push(created);
  console.log(`Created: [${created.sku}] ${created.name} - Rp${created.sellingPrice} (Stock: ${created.currentStock} ${created.unit})`);
}

console.log(`\nSuccessfully created ${createdProducts.length} mock products with photos for POS!`);
