#!/usr/bin/env node
// One approved opening batch, not a general hosted seeder. Local seeders stay local-only.
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { PassThrough, Writable } from "node:stream";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseEnv } from "node:util";
import { createClient } from "@supabase/supabase-js";
import {
  CreateProductInputSchema, ProductMutationSuccessSchema, ProductRpcFailureSchema,
  ProductsPageSchema, ProductHistoryPageSchema, ProductMetricsSchema,
} from "../src/features/products/schemas/product-rpc.schema.ts";
import { OwnerLoginSchema, OwnerSchema } from "../src/features/auth/schemas.ts";

const PROJECT = "ohltpkxtucchqezkgfok";
const ORIGIN = `https://${PROJECT}.supabase.co`;
const SOURCE_HASH = "236628927b5364bdb2d92de4f1a426288fa9e879898a5159dc33dc9fb6b512fd";
const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SOURCE = path.join(ROOT, "stockos-products-seed.json");
const STATE = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), ".local", "state"), "StockOS", "opening-import", PROJECT);
const RPCS = new Set(["stockos_owner_session", "stockos_list_products", "stockos_list_inventory_events", "stockos_product_metrics", "stockos_create_product"]);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
class ImportError extends Error {}
function requireSafe(condition, message) {
  if (!condition) throw new ImportError(message);
}
function parse(schema, value, message) {
  const result = schema.safeParse(value);
  requireSafe(result.success, message);
  return result.data;
}
function decimal(value) {
  requireSafe(typeof value === "string" && /^-?\d+(?:\.\d{1,6})?$/.test(value), "Invalid exact decimal.");
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = value.replace(/^-/, "").split(".");
  return BigInt(`${whole}${fraction.padEnd(6, "0")}`) * (negative ? -1n : 1n);
}
function validateRows(rows) {
  requireSafe(Array.isArray(rows) && rows.length === 48, "Expected exactly 48 source rows.");
  const payloads = rows.map((row) => {
    requireSafe(row && typeof row === "object" && !Object.hasOwn(row, "requestId"), "Source must not supply request IDs.");
    return parse(CreateProductInputSchema, { ...row, requestId: "00000000-0000-4000-8000-000000000001" }, "Invalid source product.");
  });
  requireSafe(new Set(payloads.map((p) => p.sku)).size === 48, "Duplicate source SKU.");
  requireSafe(payloads.every((p) => p.openingQuantity > 0 && p.purchaseTotal !== undefined), "Every row needs positive opening stock and total cost.");
  const units = payloads.reduce((n, p) => n + BigInt(p.openingQuantity), 0n);
  const cost = payloads.reduce((n, p) => n + BigInt(p.purchaseTotal), 0n);
  const revenue = payloads.reduce((n, p) => n + BigInt(p.openingQuantity) * BigInt(p.sellingPrice), 0n);
  requireSafe(units === 2325n && cost === 4161975n && revenue === 6093500n && revenue - cost === 1931525n, "Approved opening totals do not match.");
  return payloads.map((payload) => {
    const row = { ...payload };
    delete row.requestId;
    return row;
  });
}
function source() {
  const text = fs.readFileSync(SOURCE, "utf8").replace(/^﻿/, "").replace(/\r\n/g, "\n");
  requireSafe(hash(text) === SOURCE_HASH, "Source changed. Stop; do not create a replacement batch.");
  return validateRows(JSON.parse(text));
}
function config(url, key) {
  requireSafe(url === ORIGIN, "Refuse unapproved Supabase origin.");
  // This batch pins the matching legacy anon key; no service-role or opaque secret keys.
  requireSafe(typeof key === "string" && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key), "Expected matching legacy anon key.");
  let claims;
  try { claims = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString("utf8")); } catch { throw new ImportError("Invalid anon key."); }
  requireSafe(claims.role === "anon" && claims.ref === PROJECT, "Refuse privileged or wrong-project key.");
  return { url, key };
}
function guardedFetch(fetcher = fetch) {
  return async (input, init = {}) => {
    const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
    const method = (init.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
    const rpc = url.pathname.startsWith("/rest/v1/rpc/") && RPCS.has(url.pathname.slice("/rest/v1/rpc/".length));
    const auth = (url.pathname === "/auth/v1/token" && url.search === "?grant_type=password" && method === "POST") ||
      (url.pathname === "/auth/v1/user" && !url.search && method === "GET") ||
      (url.pathname === "/auth/v1/logout" && url.search === "?scope=local" && method === "POST");
    requireSafe(url.origin === ORIGIN && !url.username && !url.password && !url.hash && (auth || (rpc && method === "POST" && !url.search)), "Refuse unapproved request.");
    return fetcher(input, { ...init, redirect: "error", signal: AbortSignal.timeout(30_000) });
  };
}
function newManifest(rows, owner) {
  const payloads = rows.map((p) => ({ requestId: randomUUID(), ...p }));
  return { version: 1, project: PROJECT, sourceHash: SOURCE_HASH, owner, payloads, payloadHash: hash(JSON.stringify(payloads)) };
}
function validateManifest(value, rows, owner) {
  requireSafe(value && same(Object.keys(value).sort(), ["owner", "payloadHash", "payloads", "project", "sourceHash", "version"]), "Invalid manifest fields.");
  requireSafe(value.payloadHash === hash(JSON.stringify(value.payloads)), "Manifest payload/request IDs changed.");
  requireSafe(value.version === 1 && value.project === PROJECT && value.sourceHash === SOURCE_HASH && value.owner === owner, "Manifest target/source/owner mismatch.");
  requireSafe(Array.isArray(value.payloads) && value.payloads.length === rows.length, "Invalid manifest batch.");
  const payloads = value.payloads.map((p, i) => {
    const parsed = parse(CreateProductInputSchema, p, "Invalid manifest payload.");
    const row = { ...parsed };
    delete row.requestId;
    requireSafe(same(row, rows[i]), "Frozen manifest payload changed.");
    return parsed;
  });
  requireSafe(new Set(payloads.map((p) => p.requestId)).size === rows.length, "Duplicate request IDs.");
  return { ...value, payloads };
}
function durableWrite(file, value, append = false) {
  const fd = fs.openSync(file, append ? "a" : "wx", 0o600);
  try { fs.writeFileSync(fd, value); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
}
function acquireLock(dir) {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = path.join(dir, "run.lock");
  durableWrite(file, JSON.stringify({ pid: process.pid, started: new Date().toISOString() }));
  return () => fs.unlinkSync(file);
}
async function rpc(client, name, input, schema) {
  const result = await client.rpc(name, input === undefined ? undefined : { p_input: input });
  requireSafe(!result.error, `RPC ${name} failed; stop and resume with the same manifest.`);
  const failure = ProductRpcFailureSchema.safeParse(result.data);
  requireSafe(!failure.success, `RPC ${name}: ${failure.success ? failure.data.code : "INVALID_RESPONSE"}. Stop; retain manifest.`);
  if (name === "stockos_owner_session" || name === "stockos_create_product") return parse(schema, result.data, `Invalid ${name} response; retain manifest.`);
  requireSafe(result.data?.ok === true, `Invalid ${name} response.`);
  return parse(schema, result.data.data, `Invalid ${name} data.`);
}
async function snapshot(client) {
  const products = await rpc(client, "stockos_list_products", { archive: "all", page: 1, pageSize: 100, sort: "sku", direction: "asc" }, ProductsPageSchema);
  const events = await rpc(client, "stockos_list_inventory_events", { page: 1, pageSize: 100 }, ProductHistoryPageSchema);
  requireSafe(products.total === products.items.length && products.total <= 48 && events.total === events.items.length && events.total <= 48, "Unexpected remote rows/history; reconcile before resuming.");
  return { products: products.items, events: events.items };
}
function verifySnapshot(state, manifest, complete = false) {
  const { products, events } = state;
  requireSafe(!complete || products.length === 48, "Final product count is not 48.");
  requireSafe(products.length === events.length, "Unexpected opening history count.");
  const productIds = new Set();
  const eventIds = new Set();
  for (const product of products) {
    const payload = manifest.payloads.find((p) => p.sku === product.sku);
    requireSafe(payload && !productIds.has(product.id), "Unexpected remote product.");
    productIds.add(product.id);
    for (const key of ["sku", "name", "category", "unit", "minStock", "sellingPrice", "supplier", "shelfLocation", "barcode", "description"]) {
      requireSafe(product[key] === (payload[key] ?? null), "Remote metadata differs from frozen opening batch.");
    }
    requireSafe(product.archivedAt === null && product.currentStock === payload.openingQuantity && product.stockVersion === "1" && product.metadataVersion === "1" && decimal(product.inventoryCostValue) === decimal(payload.purchaseTotal), "Remote opening balance/version changed; stop for reconciliation.");
    requireSafe(decimal(product.potentialSellingValue) === BigInt(payload.openingQuantity) * decimal(payload.sellingPrice) && decimal(product.potentialGrossProfit) === decimal(product.potentialSellingValue) - decimal(payload.purchaseTotal), "Remote potential totals mismatch.");
    const event = events.find((e) => e.productId === product.id);
    requireSafe(event && !eventIds.has(event.id) && event.kind === "opening" && event.reference === `OPEN-${payload.requestId}` && event.stockVersion === "1" && event.quantityBefore === 0 && event.quantityAfter === payload.openingQuantity && event.quantityDelta === payload.openingQuantity && decimal(event.costBefore) === 0n && decimal(event.costAfter) === decimal(payload.purchaseTotal) && decimal(event.costDelta) === decimal(payload.purchaseTotal) && decimal(event.purchaseTotal) === decimal(payload.purchaseTotal), "Opening evidence does not match manifest.");
    eventIds.add(event.id);
  }
}
function checkCancelled(signal) {
  requireSafe(!signal?.aborted, "Import cancelled. Retain manifest; an in-flight request may have committed. Resume with the same IDs.");
}
async function applyBatch(client, manifest, receipt, log = console.log, signal) {
  for (const [i, payload] of manifest.payloads.entries()) {
    checkCancelled(signal);
    const result = await rpc(client, "stockos_create_product", payload, ProductMutationSuccessSchema);
    requireSafe(result.requestId === payload.requestId && result.data.eventId && result.data.administrativeEventId, "Mutation receipt mismatch; retain manifest.");
    verifySnapshot({ products: [result.data.product], events: [{
      id: result.data.eventId, productId: result.data.product.id, kind: "opening", reference: `OPEN-${payload.requestId}`, stockVersion: "1",
      quantityBefore: 0, quantityAfter: payload.openingQuantity, quantityDelta: payload.openingQuantity,
      costBefore: "0", costAfter: payload.purchaseTotal, costDelta: payload.purchaseTotal, purchaseTotal: payload.purchaseTotal,
    }] }, manifest);
    receipt({ requestId: payload.requestId, productId: result.data.product.id, eventId: result.data.eventId, replayed: result.replayed });
    log(`${i + 1}/48 ${payload.sku}: ${result.replayed ? "replayed" : "created"}`);
  }
}
async function persistAndApply(client, manifest, manifestFile, saved, receipt, log, signal) {
  checkCancelled(signal);
  if (!saved) durableWrite(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  await applyBatch(client, manifest, receipt, log, signal);
}
async function promptCredentials(ask) {
  const email = await ask("Email owner: ");
  const password = await ask("Password owner (tersembunyi): ", true);
  return parse(OwnerLoginSchema, { email, password }, "Invalid owner login input.");
}
function terminal(input = process.stdin, destination = process.stdout) {
  requireSafe(input.isTTY && destination.isTTY, "Apply requires a private interactive terminal; no piped credentials.");
  let hidden = false;
  const output = new Writable({ write(chunk, encoding, done) { if (!hidden) destination.write(chunk, encoding); done(); } });
  const rl = createInterface({ input, output, terminal: true, historySize: 0 });
  const controller = new AbortController();
  const cancel = () => { controller.abort(); rl.close(); };
  rl.on("SIGINT", cancel);
  rl.on("close", () => controller.abort());
  process.on("SIGINT", cancel);
  return {
    signal: controller.signal,
    async ask(label, secret = false) {
      checkCancelled(controller.signal);
      hidden = secret;
      if (secret) destination.write(label);
      try { return await rl.question(secret ? "" : label, { signal: controller.signal }); }
      finally { if (secret) destination.write("\n"); hidden = false; }
    },
    close() { process.off("SIGINT", cancel); rl.close(); },
  };
}
async function main(args) {
  requireSafe(args.length <= 1 && (args.length === 0 || ["--dry-run", "--apply", "--self-test"].includes(args[0])), "Usage: node scripts/import-opening-stock.mjs [--dry-run|--apply|--self-test]");
  if (args[0] === "--self-test") return selfTest();
  const rows = source();
  // Parse privately, never load or use the service-role key in the SDK.
  const env = parseEnv(fs.readFileSync(path.join(ROOT, ".env.local"), "utf8"));
  const { url, key } = config(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  console.log(`Target: ${PROJECT}\nSource SHA256: ${SOURCE_HASH}\n48 produk; 2325 unit dasar; modal Rp4.161.975; potensi pendapatan Rp6.093.500; potensi laba kotor Rp1.931.525.`);
  console.log("Nama gabungan, kategori, satuan dan minStock=0 dipertahankan. Bukan riwayat penjualan atau laba bersih.");
  const manifestFile = path.join(STATE, "manifest.json");
  const existing = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, "utf8")) : null;
  if (existing) validateManifest(existing, rows, existing.owner);
  if (args[0] !== "--apply") {
    for (const row of rows) console.log(`${row.sku} | ${row.name} | ${row.openingQuantity} ${row.unit}`);
    console.log(`Dry-run offline OK. ${existing ? "Resume manifest existing." : "Manifest belum dibuat."} Tidak ada login/network/write.`);
    return;
  }
  const tty = terminal();
  let unlock;
  let client;
  try {
    console.log("Hentikan transaksi toko selama impor. Batch tidak atomik; kegagalan parsial harus dilanjutkan dengan manifest sama. Backup/restore hosted belum terbukti.");
    const confirmation = `IMPORT ${PROJECT} 48 2325 4161975`;
    requireSafe(await tty.ask(`Ketik ${confirmation} untuk menerapkan stok awal ini: `) === confirmation, "Import cancelled before login/write.");
    unlock = acquireLock(STATE);
    // Re-read under lock; another run may have created the manifest during the prompt.
    const saved = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, "utf8")) : null;
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: guardedFetch() } });
    const credentials = await promptCredentials(tty.ask);
    checkCancelled(tty.signal);
    let signed;
    try { signed = await client.auth.signInWithPassword(credentials); } finally { credentials.password = ""; }
    requireSafe(!signed.error && signed.data.session, "Password login failed. No product writes.");
    const verified = await client.auth.getUser();
    requireSafe(!verified.error && verified.data.user?.email_confirmed_at, "Provider user/email verification failed.");
    const owner = await rpc(client, "stockos_owner_session", undefined, OwnerSchema);
    requireSafe(owner.id === verified.data.user.id && owner.email === verified.data.user.email, "Not the confirmed bound owner.");
    const manifest = saved ? validateManifest(saved, rows, owner.id) : newManifest(rows, owner.id);
    const initial = await snapshot(client);
    checkCancelled(tty.signal);
    if (saved) verifySnapshot(initial, manifest);
    else requireSafe(initial.products.length === 0 && initial.events.length === 0, "Missing manifest but remote data exists; stop for reconciliation. Never regenerate IDs.");
    // Flush immutable UUIDs/payloads before any product RPC; lost receipts are safe to replay.
    const receiptFile = path.join(STATE, "receipts.jsonl");
    await persistAndApply(client, manifest, manifestFile, saved, (value) => durableWrite(receiptFile, `${JSON.stringify(value)}\n`, true), console.log, tty.signal);
    checkCancelled(tty.signal);
    verifySnapshot(await snapshot(client), manifest, true);
    const metrics = await rpc(client, "stockos_product_metrics", { archive: "all" }, ProductMetricsSchema);
    requireSafe(metrics.totalProducts === 48 && decimal(metrics.totalValuation) === decimal("4161975"), "Final metrics mismatch.");
    console.log("Verified: 48 produk, 48 opening events, 2325 unit, modal Rp4.161.975, potensi pendapatan Rp6.093.500, potensi laba kotor Rp1.931.525. Simpan manifest; apply ulang hanya replay UUID sama.");
  } finally {
    if (client) {
      try { const result = await client.auth.signOut({ scope: "local" }); if (result.error) throw new Error(); }
      catch { console.error("Session cleanup not confirmed. Import result unchanged; do not delete manifest."); process.exitCode = 1; }
    }
    tty.close();
    if (unlock) unlock();
  }
}

async function selfTest() {
  const rows = source();
  assert.equal(decimal("1.000001"), 1000001n);
  assert.equal(decimal("-0.5"), -500000n);
  for (const change of [
    (r) => { r[0].extra = 1; }, (r) => { r[1].sku = r[0].sku.toLowerCase(); },
    (r) => { r[0].purchaseTotal = "1"; }, (r) => { r[0].openingQuantity = -1; },
    (r) => { r[0].sellingPrice = 5000; }, (r) => { r[0].requestId = randomUUID(); },
  ]) { const changed = structuredClone(rows); change(changed); assert.throws(() => validateRows(changed), ImportError); }
  const key = (role, ref = PROJECT) => `e30.${Buffer.from(JSON.stringify({ role, ref })).toString("base64url")}.signature`;
  config(ORIGIN, key("anon"));
  for (const url of ["http://localhost:3000", `${ORIGIN}/`, `${ORIGIN}?a=1`, `https://user@${PROJECT}.supabase.co`, `${ORIGIN}:443`]) assert.throws(() => config(url, key("anon")), ImportError);
  assert.throws(() => config(ORIGIN, key("service_role")), ImportError);
  assert.throws(() => config(ORIGIN, key("anon", "other")), ImportError);
  let fetchCalls = 0;
  const transport = guardedFetch(async (_input, init) => { fetchCalls++; assert.equal(init.redirect, "error"); return new Response("{}"); });
  await assert.rejects(transport("https://example.com/auth/v1/user"), ImportError);
  await assert.rejects(transport(`${ORIGIN}/auth/v1/logout?scope=global`, { method: "POST" }), ImportError);
  await transport(`${ORIGIN}/auth/v1/user`);
  assert.equal(fetchCalls, 1);
  const owner = randomUUID();
  const manifest = newManifest(rows, owner);
  validateManifest(manifest, rows, owner);
  assert.throws(() => validateManifest(manifest, rows, randomUUID()), ImportError);
  for (const field of ["project", "sourceHash", "version"]) assert.throws(() => validateManifest({ ...manifest, [field]: "changed" }, rows, owner), ImportError);
  const changedId = structuredClone(manifest); changedId.payloads[0].requestId = randomUUID();
  assert.throws(() => validateManifest(changedId, rows, owner), ImportError);
  const bad = structuredClone(manifest); bad.payloads[0].name = "changed";
  assert.throws(() => validateManifest(bad, rows, owner), ImportError);
  bad.payloads = manifest.payloads.map((p) => ({ ...p, requestId: manifest.payloads[0].requestId }));
  assert.throws(() => validateManifest(bad, rows, owner), ImportError);
  // Exercise the installed SDK, not hand-built URL assumptions. Transport stays synthetic.
  const access = `e30.${Buffer.from(JSON.stringify({ sub: owner, exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.signature`;
  const user = { id: owner, email: "owner@example.com", email_confirmed_at: "2026-10-17T00:00:00Z", aud: "authenticated", role: "authenticated" };
  const routes = [];
  const sdk = createClient(ORIGIN, key("anon"), { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: guardedFetch(async (input) => {
    const url = new URL(String(input));
    routes.push(url.pathname + url.search);
    const body = url.pathname.endsWith("/token") ? { access_token: access, refresh_token: "synthetic-refresh", token_type: "bearer", expires_in: 3600, user } :
      url.pathname.endsWith("/user") ? user : url.pathname.endsWith("/stockos_owner_session") ? { id: owner, email: user.email, name: "Owner" } : {};
    return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });
  }) } });
  assert.equal((await sdk.auth.signInWithPassword({ email: user.email, password: "synthetic-private-password" })).error, null);
  assert.equal((await sdk.auth.getUser()).data.user.id, owner);
  assert.equal((await rpc(sdk, "stockos_owner_session", undefined, OwnerSchema)).id, owner);
  assert.equal((await sdk.auth.signOut({ scope: "local" })).error, null);
  assert.deepEqual(routes, ["/auth/v1/token?grant_type=password", "/auth/v1/user", "/rest/v1/rpc/stockos_owner_session", "/auth/v1/logout?scope=local"]);
  // Stream-backed terminal exercises real readline echo suppression, paste, SIGINT and EOF.
  for (const ending of ["enter", "interrupt", "eof"]) {
    const input = new PassThrough(); input.isTTY = true; input.setRawMode = () => {};
    let rendered = "";
    const output = new Writable({ write(chunk, _encoding, done) { rendered += chunk.toString(); done(); } }); output.isTTY = true;
    const tty = terminal(input, output);
    const question = tty.ask("Private password: ", true);
    const observed = question.then((value) => ({ value }), () => ({ cancelled: true }));
    input.write("synthetic-pasted-secret");
    if (ending === "enter") input.write("\r");
    else if (ending === "interrupt") input.write("\x03");
    else input.end();
    const result = await observed;
    if (ending === "enter") assert.equal(result.value, "synthetic-pasted-secret");
    else { assert.equal(result.cancelled, true); assert.equal(tty.signal.aborted, true); }
    assert.ok(!rendered.includes("synthetic-pasted-secret"));
    tty.close(); input.destroy();
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stockos-opening-selftest-"));
  try {
    const release = acquireLock(dir);
    assert.throws(() => acquireLock(dir));
    release();
    const file = path.join(dir, "manifest.json");
    assert.throws(() => durableWrite(path.join(dir, "missing", "manifest.json"), "x"));
    durableWrite(file, JSON.stringify(manifest));
    assert.throws(() => durableWrite(file, "replacement"));
    assert.deepEqual(validateManifest(JSON.parse(fs.readFileSync(file)), rows, owner), manifest);
    const committed = new Map();
    const seen = [];
    let loseResponse = true;
    const client = { async rpc(name, { p_input: payload }) {
      assert.equal(name, "stockos_create_product");
      assert.ok(fs.existsSync(file), "Manifest must exist before product write");
      seen.push(payload.requestId);
      const previous = committed.get(payload.requestId);
      const product = {
        id: randomUUID(), ...Object.fromEntries(["sku", "name", "category", "unit", "minStock", "sellingPrice"].map((k) => [k, payload[k]])),
        supplier: payload.supplier ?? null, shelfLocation: payload.shelfLocation ?? null, barcode: payload.barcode ?? null, description: payload.description ?? null,
        currentStock: payload.openingQuantity, inventoryCostValue: payload.purchaseTotal,
        averagePurchaseCost: "1", potentialSellingValue: String(BigInt(payload.openingQuantity) * BigInt(payload.sellingPrice)),
        potentialGrossProfit: String(BigInt(payload.openingQuantity) * BigInt(payload.sellingPrice) - BigInt(payload.purchaseTotal)),
        stockStatus: "in_stock", archivedAt: null, metadataVersion: "1", stockVersion: "1", createdAt: "2026-10-17T00:00:00Z", updatedAt: "2026-10-17T00:00:00Z",
      };
      const result = previous || { ok: true, requestId: payload.requestId, replayed: false, data: { product, eventId: randomUUID(), administrativeEventId: randomUUID() } };
      committed.set(payload.requestId, result);
      if (loseResponse) { loseResponse = false; throw new Error("synthetic lost response"); }
      return { data: { ...result, replayed: !!previous }, error: null };
    } };
    await assert.rejects(persistAndApply(client, manifest, path.join(dir, "missing", "manifest.json"), false, () => {}, () => {}));
    assert.equal(seen.length, 0, "Failed manifest persistence must prevent all product RPCs");
    const realSync = fs.fsyncSync;
    try {
      fs.fsyncSync = () => { throw new Error("synthetic fsync failure"); };
      await assert.rejects(persistAndApply(client, manifest, path.join(dir, "failed-sync.json"), false, () => {}, () => {}));
      assert.equal(seen.length, 0, "Failed fsync must prevent all product RPCs");
    } finally { fs.fsyncSync = realSync; }
    await assert.rejects(applyBatch(client, manifest, () => {}, () => {}));
    assert.equal(seen.length, 1);
    assert.equal(committed.size, 1);
    let receipts = 0;
    await applyBatch(client, manifest, () => receipts++, () => {});
    assert.equal(seen[0], seen[1]);
    assert.equal(committed.size, 48);
    assert.equal(receipts, 48);
    await applyBatch(client, manifest, () => {}, () => {});
    assert.equal(committed.size, 48);
    const populated = {
      products: [...committed.values()].map((r) => r.data.product),
      events: [...committed.values()].map((r) => {
        const p = manifest.payloads.find((p) => p.requestId === r.requestId);
        return { id: r.data.eventId, productId: r.data.product.id, kind: "opening", reference: `OPEN-${p.requestId}`, stockVersion: "1", quantityBefore: 0, quantityAfter: p.openingQuantity, quantityDelta: p.openingQuantity, costBefore: "0", costAfter: p.purchaseTotal, costDelta: p.purchaseTotal, purchaseTotal: p.purchaseTotal };
      }),
    };
    verifySnapshot(populated, manifest, true);
    verifySnapshot({ products: populated.products.slice(0, 2), events: populated.events.slice(0, 2) }, manifest);
    for (const change of [
      (s) => { s.products[0].name = "changed"; }, (s) => { s.products[0].stockVersion = "2"; },
      (s) => { s.products[0].currentStock++; }, (s) => { s.events[0].reference = "unrelated"; },
      (s) => { s.events[0].costDelta = "1"; }, (s) => { s.events.pop(); },
    ]) { const changed = structuredClone(populated); change(changed); assert.throws(() => verifySnapshot(changed, manifest), ImportError); }
    const controller = new AbortController();
    const beforeCancel = seen.length;
    await assert.rejects(applyBatch(client, manifest, () => controller.abort(), () => {}, controller.signal), ImportError);
    assert.equal(seen.length, beforeCancel + 1, "Cancel must stop scheduling further products");
    let attempts = 0;
    const failed = { async rpc() { attempts++; return { error: null, data: { ok: false, code: "SKU_EXISTS", message: "do not log secret" } }; } };
    await assert.rejects(applyBatch(failed, manifest, () => {}, () => {}), (error) => error instanceof ImportError && !error.message.includes("do not log secret"));
    assert.equal(attempts, 1);
    await assert.rejects(applyBatch(client, manifest, () => { throw new Error("disk failure"); }, () => {}));
    assert.equal(committed.size, 48);
    const prompts = [];
    const credentials = await promptCredentials(async (label, secret) => { prompts.push({ label, secret }); return secret ? "synthetic-private-password" : "owner@example.com"; });
    assert.equal(credentials.password, "synthetic-private-password");
    assert.equal(prompts[1].secret, true);
    if (!process.stdin.isTTY || !process.stdout.isTTY) assert.throws(terminal, ImportError);
    verifySnapshot({ products: [], events: [] }, manifest);
    assert.throws(() => verifySnapshot({ products: [], events: [] }, manifest, true), ImportError);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  const nonInteractive = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "--apply"], { cwd: ROOT, encoding: "utf8", timeout: 15_000 });
  assert.equal(nonInteractive.status, 1);
  assert.ok(nonInteractive.stderr.includes("private interactive terminal"));
  console.log("Opening import self-test OK: source/money, SDK auth routes, hidden input/paste/interrupt/EOF, immutable manifest/lock, failed-persist zero writes, cancellation, lost-response same-ID replay, authoritative snapshots, non-TTY exit. No network.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof ImportError ? error.message : "Import stopped (transport, input or local I/O failure). Retain manifest and receipts; rerun the same command. Never regenerate request IDs.");
    process.exitCode = 1;
  });
}
