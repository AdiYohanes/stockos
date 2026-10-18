import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

// Local, destructive fixture test. Never point this at a shop or cloud project.
const status = JSON.parse(readFileSync(process.argv[2], "utf8").replace(/^﻿/, ""));
const recoveryFixture = status.API_URL === "http://127.0.0.1:55641";
assert.ok(recoveryFixture || status.API_URL === "http://127.0.0.1:55541", "Refuse nonfixture API URL");
assert.equal(status.DB_URL, recoveryFixture ? "postgresql://postgres:postgres@127.0.0.1:55642/postgres" : "postgresql://postgres:postgres@127.0.0.1:55542/postgres", "Refuse nonfixture DB URL");
assert.equal(typeof status.ANON_KEY, "string", "Missing local anon key");
assert.equal(typeof status.SERVICE_ROLE_KEY, "string", "Missing local service key");
assert.ok(status.ANON_KEY.length && status.SERVICE_ROLE_KEY.length, "Empty local keys");

const project = recoveryFixture ? "stockos-recovery-proof" : "stockos-stock-proof";
const container = `supabase_db_${project}`;
const mailUrl = recoveryFixture ? "http://127.0.0.1:55644" : "http://127.0.0.1:55544";
const emails = Array.from({ length: 6 }, () => `owner-${randomUUID()}@example.test`);
const createdUsers = new Set();
const createdProducts = new Set();
const createdRequests = new Set();
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const sqlString = (value) => `'${value.replaceAll("'", "''")}'`;

let prepared = false;
let failure;

function docker(args) {
  try {
    return execFileSync("docker", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 30_000 });
  } catch {
    throw new Error("Local fixture Docker command failed (output suppressed)");
  }
}

function assertContainer() {
  const [inspection] = JSON.parse(docker(["inspect", container]));
  assert.equal(inspection.Name, `/${container}`, "Wrong fixture container");
  assert.equal(inspection.Config.Labels?.["com.supabase.cli.project"], project, "Wrong fixture project label");
  assert.equal(inspection.State.Running, true, "Fixture database is not running");
}

function sql(statement) {
  return docker(["exec", container, "psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres", "-c", statement]).trim();
}

function fixtureGuard() {
  const userIds = [...createdUsers];
  const prodIds = [...createdProducts];
  const reqIds = [...createdRequests];
  const usersArray = userIds.length ? `ARRAY[${userIds.map(sqlString).join(",")}]::uuid[]` : "ARRAY[]::uuid[]";
  const prodsArray = prodIds.length ? `ARRAY[${prodIds.map(sqlString).join(",")}]::uuid[]` : "ARRAY[]::uuid[]";
  const reqsArray = reqIds.length ? `ARRAY[${reqIds.map(sqlString).join(",")}]::uuid[]` : "ARRAY[]::uuid[]";

  return `
    IF (SELECT count(*) FROM stockos_private.owner_registration) <> 1
      OR NOT EXISTS (SELECT 1 FROM stockos_private.owner_registration WHERE id = 1)
    THEN RAISE EXCEPTION 'Unexpected registration singleton'; END IF;
    IF EXISTS (
      SELECT 1 FROM stockos_private.owner_registration
      WHERE state <> 'unclaimed' AND (
        email IS NULL OR email NOT IN (${emails.map(sqlString).join(",")})
        OR (auth_user_id IS NOT NULL AND NOT (auth_user_id = ANY(${usersArray})))
      )
    ) THEN RAISE EXCEPTION 'Not an owned auth fixture'; END IF;
    IF EXISTS (
      SELECT 1 FROM stockos_private.shop_settings
      WHERE id <> 1 OR name NOT IN ('Warung Uji', 'StockOS stock proof test')
    ) THEN RAISE EXCEPTION 'Not test shop settings'; END IF;
    IF EXISTS (
      SELECT 1 FROM stockos_private.owner_registration r
      WHERE r.state <> 'unclaimed'
        AND NOT EXISTS (SELECT 1 FROM stockos_private.shop_settings s WHERE s.id = 1)
    ) THEN RAISE EXCEPTION 'Missing fixture shop marker'; END IF;
    IF EXISTS (
      SELECT 1 FROM auth.users WHERE (id = ANY(${usersArray}))
        AND (email IS NULL OR email NOT IN (${emails.map(sqlString).join(",")}))
    ) THEN RAISE EXCEPTION 'Captured fixture identity changed'; END IF;
    IF to_regclass('stockos_private.products') IS NOT NULL THEN
      IF EXISTS (SELECT 1 FROM stockos_private.products WHERE NOT (id = ANY(${prodsArray})))
      THEN RAISE EXCEPTION 'Uncaptured products exist'; END IF;
    END IF;
    IF to_regclass('stockos_private.mutation_requests') IS NOT NULL THEN
      IF EXISTS (SELECT 1 FROM stockos_private.mutation_requests WHERE NOT (request_id = ANY(${reqsArray})))
      THEN RAISE EXCEPTION 'Uncaptured requests exist'; END IF;
    END IF;`;
}

function inspectFixture() {
  assertContainer();
  const snapshot = JSON.parse(sql(`SELECT json_build_object(
    'registration', (SELECT row_to_json(r) FROM stockos_private.owner_registration r WHERE id = 1),
    'shops', (SELECT coalesce(json_agg(json_build_object('id', id, 'name', name)), '[]'::json) FROM stockos_private.shop_settings)
  )`));
  assert.ok(snapshot.registration, "Missing seeded registration");
  const registration = snapshot.registration;
  if (registration.state !== "unclaimed") {
    assert.match(registration.email ?? "", /^owner-[0-9a-f-]{36}@example\.test$/, "Existing owner is not dedicated fixture");
    assert.ok(registration.auth_user_id === null || createdUsers.has(registration.auth_user_id), "Refuse deleting uncaptured owner");
    assert.ok(snapshot.shops.some((shop) => shop.id === 1 && ["Warung Uji", "StockOS stock proof test"].includes(shop.name)), "Missing fixture shop marker");
  }
  assert.ok(snapshot.shops.every((shop) => shop.id === 1 && ["Warung Uji", "StockOS stock proof test"].includes(shop.name)), "Refuse unrelated settings");
  assert.ok(registration.state !== "unclaimed" || snapshot.shops.length === 0, "Refuse uncaptured settings without owner");
  if (registration.state !== "unclaimed") assert.ok(emails.includes(registration.email), "Refuse another run's provisioning attempt");
}

function cleanup() {
  inspectFixture();
  const userIds = [...createdUsers];
  const prodIds = [...createdProducts];
  const reqIds = [...createdRequests];

  sql(`BEGIN;
    LOCK TABLE stockos_private.owner_registration, stockos_private.shop_settings IN EXCLUSIVE MODE;
    DO $fixture$ BEGIN ${fixtureGuard()} END $fixture$;
    DO $cleanup$ BEGIN
      IF to_regclass('stockos_private.inventory_events') IS NOT NULL THEN
        ${prodIds.length ? `DELETE FROM stockos_private.inventory_events WHERE product_id = ANY(ARRAY[${prodIds.map(sqlString).join(",")}]::uuid[]);` : ""}
      END IF;
      IF to_regclass('stockos_private.administrative_events') IS NOT NULL THEN
        ${reqIds.length ? `DELETE FROM stockos_private.administrative_events WHERE request_id = ANY(ARRAY[${reqIds.map(sqlString).join(",")}]::uuid[]);` : ""}
      END IF;
      IF to_regclass('stockos_private.products') IS NOT NULL THEN
        ${prodIds.length ? `DELETE FROM stockos_private.products WHERE id = ANY(ARRAY[${prodIds.map(sqlString).join(",")}]::uuid[]);` : ""}
      END IF;
      IF to_regclass('stockos_private.mutation_requests') IS NOT NULL THEN
        ${reqIds.length ? `DELETE FROM stockos_private.mutation_requests WHERE request_id = ANY(ARRAY[${reqIds.map(sqlString).join(",")}]::uuid[]);` : ""}
      END IF;
    END $cleanup$;
    DELETE FROM stockos_private.shop_settings WHERE id = 1 AND name IN ('Warung Uji', 'StockOS stock proof test');
    UPDATE stockos_private.owner_registration SET state = 'unclaimed', attempt_id = NULL,
      email = NULL, auth_user_id = NULL, provisioned_at = NULL, bound_at = NULL, updated_at = now()
      WHERE id = 1;
    ${userIds.length ? `DELETE FROM auth.users WHERE id = ANY(ARRAY[${userIds.map(sqlString).join(",")}]::uuid[]) AND email IN (${emails.map(sqlString).join(",")});` : ""}
    COMMIT;`);
  createdUsers.clear();
  createdProducts.clear();
  createdRequests.clear();
}

async function request(path, { key = status.ANON_KEY, token, body, method = "POST" } = {}) {
  const response = await fetch(`${status.API_URL}${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${token ?? key}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
    redirect: "error",
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  return { ok: response.ok, status: response.status, data };
}

const rpc = (name, body = {}, token, key = status.SERVICE_ROLE_KEY) => request(`/rest/v1/rpc/${name}`, { key, token, body });

function success(result, label) {
  assert.ok(result.ok, `${label}: HTTP ${result.status}`);
  assert.ok(result.data?.ok !== false, `${label}: ${result.data?.code ?? "domain error"}`);
  return result.data;
}

function failureResult(result, label, expectedCode) {
  assert.equal(result.data?.ok, false, `${label}: unexpectedly allowed`);
  if (expectedCode) {
    assert.equal(result.data?.code, expectedCode, `${label}: wrong error code`);
  }
}

function captureUser(data) {
  const user = data.user ?? data;
  assert.match(user.id ?? "", uuid, "Provider missing fixture user ID");
  assert.ok(emails.includes(user.email), "Provider returned unrelated email");
  createdUsers.add(user.id);
  return user;
}

const claimOwner = (email) => rpc("stockos_claim_owner", { p_email: email, p_name: "StockOS stock proof test", p_shop: "StockOS stock proof test", p_timezone: "Asia/Jakarta" });

async function invitationHash(email, excluded = new Set()) {
  for (let attempt = 0; attempt < 60; attempt++) {
    const response = await fetch(`${mailUrl}/api/v1/messages`, { signal: AbortSignal.timeout(5_000), redirect: "error" });
    assert.ok(response.ok, "Mailpit list failed");
    const messages = (await response.json()).messages ?? [];
    for (const message of messages) {
      if (!message.To?.some((to) => to.Address === email)) continue;
      const detail = await fetch(`${mailUrl}/api/v1/message/${encodeURIComponent(message.ID)}`, { signal: AbortSignal.timeout(5_000), redirect: "error" });
      assert.ok(detail.ok, "Mailpit message failed");
      const { HTML } = await detail.json();
      const hash = HTML?.match(/token_hash=([a-f0-9]+)/)?.[1];
      if (hash && !excluded.has(hash)) return hash;
    }
    await delay(250);
  }
  throw new Error("Fixture invitation mail did not arrive");
}

async function setupOwnerSession() {
  const ownerEmail = emails[0];
  const attemptId = success(await claimOwner(ownerEmail), "Claim owner").attemptId;
  captureUser(success(await request("/auth/v1/invite", {
    key: status.SERVICE_ROLE_KEY,
    body: { email: ownerEmail, data: { stockos_attempt_id: attemptId } },
  }), "Admin invite"));
  success(await rpc("stockos_reconcile_owner", { p_attempt: attemptId }), "Bind owner");
  const hash = await invitationHash(ownerEmail);
  const invitation = success(await request("/auth/v1/verify", { body: { token_hash: hash, type: "invite" } }), "Verify invitation");
  captureUser(invitation);
  failureResult(await rpc("stockos_get_product", { p_input: { id: randomUUID() } }, invitation.access_token, status.ANON_KEY), "Invitation business access", "FORBIDDEN");
  for (const name of ["stockos_product_metrics", "stockos_text_suggestions"]) {
    failureResult(await rpc(name, { p_input: { injected: true } }, invitation.access_token, status.ANON_KEY), "OTP catalog access before validation", "FORBIDDEN");
  }
  const password = `StockOS-test-${randomUUID()}!`;
  success(await request("/auth/v1/user", { method: "PUT", token: invitation.access_token, body: { password } }), "Initial password");
  success(await request("/auth/v1/logout?scope=local", { token: invitation.access_token }), "Logout invitation session");
  const login = success(await request("/auth/v1/token?grant_type=password", { body: { email: ownerEmail, password } }), "Fresh owner password login");
  return login.access_token;
}

try {
  inspectFixture();
  cleanup();
  prepared = true;

  const accessToken = await setupOwnerSession();

  const call = async (name, input) => {
    if (input?.requestId) createdRequests.add(input.requestId);
    const res = await rpc(`stockos_${name}`, { p_input: input }, accessToken, status.ANON_KEY);
    if (name === "create_product" && res.data?.data?.product?.id) {
      createdProducts.add(res.data.data.product.id);
    }
    return res;
  };

  assert.deepEqual(success(await call("product_metrics", {}), "Empty catalog metrics").data, {
    totalProducts: 0, inStockCount: 0, lowStockCount: 0, outOfStockCount: 0, totalValuation: "0.000000",
  });

  // Metrics span more than a page; expected modal uses the worked 1/3 residual.
  const readFixtures = [];
  for (let i = 0; i < 28; i++) {
    readFixtures.push(success(await call("create_product", {
      requestId: randomUUID(), sku: `TEST-READ-${String(i).padStart(2, "0")}`, name: `Catalog proof ${i}`,
      category: `Proof ${String(i).padStart(2, "0")}`, supplier: `Vendor ${String(i).padStart(2, "0")}`,
      unit: "Pcs", sellingPrice: "0", minStock: i === 27 ? 1 : 0,
      openingQuantity: i === 26 ? 3 : i === 27 ? 1 : 0,
      ...(i === 26 ? { purchaseTotal: "1" } : i === 27 ? { purchaseTotal: "2" } : {}),
    }), "Create catalog read fixture").data.product);
  }
  success(await call("record_stock_out", { requestId: randomUUID(), productId: readFixtures[26].id, quantity: 1 }), "Fractional remaining modal");
  success(await call("archive_product", {
    requestId: randomUUID(), productId: readFixtures[0].id,
    expectedMetadataVersion: readFixtures[0].metadataVersion, expectedStockVersion: readFixtures[0].stockVersion,
  }), "Archive catalog read fixture");
  const activeMetrics = { totalProducts: 27, inStockCount: 1, lowStockCount: 1, outOfStockCount: 25, totalValuation: "2.666667" };
  assert.deepEqual(success(await call("product_metrics", {}), "Default active metrics").data, activeMetrics);
  assert.deepEqual(success(await call("product_metrics", { archive: "active" }), "Explicit active metrics").data, activeMetrics);
  assert.deepEqual(success(await call("product_metrics", { archive: "archived" }), "Archived metrics").data, {
    totalProducts: 1, inStockCount: 0, lowStockCount: 0, outOfStockCount: 1, totalValuation: "0.000000",
  });
  assert.deepEqual(success(await call("product_metrics", { archive: "all" }), "All catalog metrics").data, {
    ...activeMetrics, totalProducts: 28, outOfStockCount: 26,
  });
  const readPage = success(await call("list_products", { pageSize: 25 }), "Bounded catalog page").data;
  assert.equal(readPage.items.length, 25);
  assert.equal(readPage.total, 27);
  assert.equal(success(await call("list_products", { search: "TEST-READ-27" }), "Search subset").data.total, 1);
  assert.deepEqual(success(await call("product_metrics", {}), "Metrics after filtered read").data, activeMetrics);
  for (const input of [null, [], "active", { archive: "deleted" }, { archive: 1 }, { archive: "x".repeat(21) }, { page: 1 }, { search: "Catalog" }, { injected: "x".repeat(20001) }]) {
    failureResult(await call("product_metrics", input), "Invalid metrics input", "VALIDATION_ERROR");
  }

  assert.deepEqual(success(await call("text_suggestions", { kind: "category", prefix: "Proof 0" }), "Category suggestions include archive").data,
    ["Proof 00", "Proof 01", "Proof 02", "Proof 03", "Proof 04", "Proof 05", "Proof 06", "Proof 07", "Proof 08", "Proof 09"]);

  const suggestionTail = ["28", "29", "30", "% literal", "_ literal", "duplicate", "duplicate"];
  for (let i = 0; i < suggestionTail.length; i++) {
    success(await call("create_product", {
      requestId: randomUUID(), sku: `TEST-SUGGEST-${i}`, name: `Suggestion proof ${i}`,
      category: `Proof ${suggestionTail[i]}`, supplier: `Vendor ${suggestionTail[i]}`,
      unit: "Pcs", sellingPrice: "0", minStock: 0,
    }), "Create text suggestion fixture");
  }
  const cappedCategories = ["Proof % literal", "Proof 00", "Proof 01", "Proof 02", "Proof 03", "Proof 04", "Proof 05", "Proof 06", "Proof 07", "Proof 08", "Proof 09", "Proof 10", "Proof 11", "Proof 12", "Proof 13", "Proof 14", "Proof 15", "Proof 16", "Proof 17", "Proof 18", "Proof 19", "Proof 20", "Proof 21", "Proof 22", "Proof 23", "Proof 24", "Proof 25", "Proof 26", "Proof 27", "Proof 28"];
  for (const kind of ["category", "supplier"]) {
    const prefix = kind === "category" ? "Proof" : "Vendor";
    const expected = kind === "category" ? cappedCategories : cappedCategories.map((value) => value.replace("Proof", "Vendor"));
    assert.deepEqual(success(await call("text_suggestions", { kind }), "Distinct deterministic capped suggestions").data, expected);
    assert.deepEqual(success(await call("text_suggestions", { kind, prefix: "" }), "Empty suggestion prefix").data, expected);
    assert.deepEqual(success(await call("text_suggestions", { kind, prefix: `${prefix} %` }), "Literal percent prefix").data, [`${prefix} % literal`]);
    assert.deepEqual(success(await call("text_suggestions", { kind, prefix: `${prefix} _` }), "Literal underscore prefix").data, [`${prefix} _ literal`]);
    assert.deepEqual(success(await call("text_suggestions", { kind, prefix: `${prefix} duplicate` }), "Duplicate suggestions collapse").data, [`${prefix} duplicate`]);
    assert.deepEqual(success(await call("text_suggestions", { kind, prefix: prefix.slice(1) }), "Prefix not substring").data, []);
    assert.deepEqual(success(await call("text_suggestions", { kind, prefix: "x".repeat(120) }), "Maximum suggestion prefix").data, []);
  }
  for (const input of [null, [], "category", {}, { kind: "unit" }, { kind: 1 }, { kind: "category", prefix: 1 }, { kind: "category", prefix: "x".repeat(121) }, { kind: "category", injected: true }, { kind: "category", archive: "active" }]) {
    failureResult(await call("text_suggestions", input), "Invalid suggestion input", "VALIDATION_ERROR");
  }

  // ----------------------------------------------------
  // INITIAL TRACER TEST
  // ----------------------------------------------------
  const req1 = randomUUID();
  const createResult = success(await call("create_product", {
    requestId: req1, sku: "TEST-SKU-1", name: "Test Product", category: "Test Category",
    unit: "Pcs", sellingPrice: "15000", minStock: 10, openingQuantity: 100, purchaseTotal: "1000000"
  }), "Create Product");

  assert.equal(createResult.ok, true);
  assert.equal(createResult.replayed, false);
  const product = createResult.data.product;
  assert.equal(product.sku, "TEST-SKU-1");
  assert.equal(product.currentStock, 100);

  const replayResult = success(await call("create_product", {
    requestId: req1, sku: "TEST-SKU-1", name: "Test Product", category: "Test Category",
    unit: "Pcs", sellingPrice: "15000", minStock: 10, openingQuantity: 100, purchaseTotal: "1000000"
  }), "Create Product Replay");
  assert.equal(replayResult.replayed, true);

  const getResult = success(await call("get_product", { id: product.id }), "Get Product");
  assert.equal(getResult.data.id, product.id);

  const listResult = success(await call("list_products", { search: "TEST-SKU-1", page: 1, pageSize: 25 }), "List Products");
  assert.ok(listResult.data.items.length >= 1);

  const eventsResult = success(await call("list_inventory_events", { productId: product.id, page: 1, pageSize: 25 }), "List Events");
  assert.equal(eventsResult.data.items.length, 1);
  assert.equal(eventsResult.data.items[0].kind, "opening");
  assert.equal(eventsResult.data.items[0].quantityDelta, 100);

  // ----------------------------------------------------
  // RECEIPT/SOLD, CONCURRENCY, EXACT SPEC EXAMPLES
  // ----------------------------------------------------
  const reqCost1 = randomUUID();
  const costProd1 = success(await call("create_product", {
    requestId: reqCost1, sku: "TEST-COST-1", name: "Cost Test 1", category: "Test",
    unit: "Pcs", sellingPrice: "10000", minStock: 0, openingQuantity: 10, purchaseTotal: "30000"
  }), "Create Cost 1").data.product;

  const receipt1 = success(await call("record_stock_in", {
    requestId: randomUUID(), productId: costProd1.id, quantity: 10, purchaseTotal: "40000", cartonCount: 2, unitsPerCarton: 5
  }), "Receipt Carton Mode").data.product;
  assert.equal(receipt1.currentStock, 20);
  assert.equal(receipt1.inventoryCostValue, "70000.000000");

  const sell1 = success(await call("record_stock_out", {
    requestId: randomUUID(), productId: costProd1.id, quantity: 5
  }), "Sell 5 units").data.product;
  assert.equal(sell1.currentStock, 15);
  assert.equal(sell1.inventoryCostValue, "52500.000000");

  const freeGoods = success(await call("record_stock_in", {
    requestId: randomUUID(), productId: costProd1.id, quantity: 5, purchaseTotal: "0"
  }), "Free goods").data.product;
  assert.equal(freeGoods.currentStock, 20);
  assert.equal(freeGoods.inventoryCostValue, "52500.000000");

  const costProd2 = success(await call("create_product", {
    requestId: randomUUID(), sku: "TEST-RESIDUAL", name: "Residual Test", category: "Test",
    unit: "Pcs", sellingPrice: "5000", minStock: 0, openingQuantity: 3, purchaseTotal: "10000"
  }), "Create Residual Prod").data.product;

  const res1 = success(await call("record_stock_out", { requestId: randomUUID(), productId: costProd2.id, quantity: 1 }), "Res Sell 1").data.product;
  assert.equal(res1.inventoryCostValue, "6666.666667");
  const res2 = success(await call("record_stock_out", { requestId: randomUUID(), productId: costProd2.id, quantity: 1 }), "Res Sell 2").data.product;
  assert.equal(res2.inventoryCostValue, "3333.333333");
  const res3 = success(await call("record_stock_out", { requestId: randomUUID(), productId: costProd2.id, quantity: 1 }), "Res Sell 3").data.product;
  assert.equal(res3.currentStock, 0);
  assert.equal(res3.inventoryCostValue, "0.000000");

  const costProd3 = success(await call("create_product", {
    requestId: randomUUID(), sku: "TEST-CONCURRENCY", name: "Concurrency", category: "Test",
    unit: "Pcs", sellingPrice: "2000", minStock: 0, openingQuantity: 5, purchaseTotal: "5000"
  }), "Create Concurrency Prod").data.product;

  const reqSell4_A = randomUUID();
  const reqSell4_B = randomUUID();
  createdRequests.add(reqSell4_A);
  createdRequests.add(reqSell4_B);

  // Test concurrency of distinct requests (4 units requested twice from 5)
  const [sell4A, sell4B] = await Promise.all([
    rpc("stockos_record_stock_out", { p_input: { requestId: reqSell4_A, productId: costProd3.id, quantity: 4 } }, accessToken, status.ANON_KEY),
    rpc("stockos_record_stock_out", { p_input: { requestId: reqSell4_B, productId: costProd3.id, quantity: 4 } }, accessToken, status.ANON_KEY)
  ]);
  const aOk = sell4A.data?.ok;
  const bOk = sell4B.data?.ok;
  assert.ok(aOk !== bOk, "Concurrency failed: exactly one should succeed");
  if (aOk) {
    assert.equal(sell4A.data.data.product.currentStock, 1);
    failureResult(sell4B, "Sell 4 (B)", "INSUFFICIENT_STOCK");
  } else {
    assert.equal(sell4B.data.data.product.currentStock, 1);
    failureResult(sell4A, "Sell 4 (A)", "INSUFFICIENT_STOCK");
  }

  // Test concurrency of SAME request (replay idempotency under concurrency)
  const reqSellSame = randomUUID();
  createdRequests.add(reqSellSame);
  const [sellSame1, sellSame2] = await Promise.all([
    rpc("stockos_record_stock_out", { p_input: { requestId: reqSellSame, productId: costProd3.id, quantity: 1 } }, accessToken, status.ANON_KEY),
    rpc("stockos_record_stock_out", { p_input: { requestId: reqSellSame, productId: costProd3.id, quantity: 1 } }, accessToken, status.ANON_KEY)
  ]);
  assert.equal(sellSame1.data?.ok, true, "Same request 1 failed");
  assert.equal(sellSame2.data?.ok, true, "Same request 2 failed");
  assert.ok(sellSame1.data?.replayed || sellSame2.data?.replayed, "One should be marked replayed");
  assert.equal(sellSame1.data.data.product.currentStock, 0, "Stock should drop by 1");
  assert.equal(sellSame2.data.data.product.currentStock, 0, "Stock should drop by 1");

  const sell4Replay = success(await call("record_stock_out", {
    requestId: aOk ? reqSell4_A : reqSell4_B, productId: costProd3.id, quantity: 4
  }), "Sell 4 Replay");
  assert.equal(sell4Replay.replayed, true);

  // ----------------------------------------------------
  // METADATA LIFECYCLE, OPNAME, AND COST
  // ----------------------------------------------------

  // 1. Zero opening / no event / normalized SKU
  const reqZero = randomUUID();
  const zeroProdRes = success(await call("create_product", {
    requestId: reqZero, sku: "   TEST-Zero-SKU  ", name: "Zero Stock", category: "Cat",
    unit: "Pcs", sellingPrice: "1000", minStock: 5, openingQuantity: 0
  }), "Create Zero Stock");
  const zeroProd = zeroProdRes.data.product;
  assert.equal(zeroProd.currentStock, 0);
  assert.equal(zeroProd.sku, "TEST-ZERO-SKU", "SKU not normalized");
  const zeroEvents = success(await call("list_inventory_events", { productId: zeroProd.id, page: 1, pageSize: 25 }), "Zero events");
  assert.equal(zeroEvents.data.items.length, 0, "Zero opening should not create event");

  // 2. Price edit preserves cost / Locked sku/unit / version conflict
  const updateReq = randomUUID();
  const updatedProdRes = success(await call("update_product", {
    requestId: updateReq, productId: costProd1.id, expectedMetadataVersion: costProd1.metadataVersion,
    patch: { sellingPrice: "99999" }
  }), "Update Price");
  assert.equal(updatedProdRes.data.product.sellingPrice, "99999");
  assert.equal(updatedProdRes.data.product.inventoryCostValue, "52500.000000", "Price edit altered cost");

  const updateConflict = await call("update_product", {
    requestId: randomUUID(), productId: costProd1.id, expectedMetadataVersion: costProd1.metadataVersion,
    patch: { sellingPrice: "88888" }
  });
  failureResult(updateConflict, "Update Version Conflict", "VERSION_CONFLICT");

  const updateConflictReplay = success(await call("update_product", {
    requestId: updateReq, productId: costProd1.id, expectedMetadataVersion: costProd1.metadataVersion,
    patch: { sellingPrice: "99999" }
  }), "Update Replay Old Version");
  assert.equal(updateConflictReplay.replayed, true, "Replay of successful update with old version should succeed");

  const updateLocked = await call("update_product", {
    requestId: randomUUID(), productId: costProd1.id, expectedMetadataVersion: updatedProdRes.data.product.metadataVersion,
    patch: { sku: "CHANGED-SKU" }
  });
  failureResult(updateLocked, "Locked SKU", "IDENTITY_LOCKED");

  // 3. Archive only zero / archived blocking / reactivation
  const archiveHasStock = await call("archive_product", {
    requestId: randomUUID(), productId: costProd1.id, expectedMetadataVersion: updatedProdRes.data.product.metadataVersion,
    expectedStockVersion: updatedProdRes.data.product.stockVersion
  });
  failureResult(archiveHasStock, "Archive Has Stock", "PRODUCT_HAS_STOCK");

  const archiveZero = success(await call("archive_product", {
    requestId: randomUUID(), productId: zeroProd.id, expectedMetadataVersion: zeroProd.metadataVersion,
    expectedStockVersion: zeroProd.stockVersion
  }), "Archive Zero");
  assert.ok(archiveZero.data.product.archivedAt !== null, "Product should be archived");

  const updateArchived = await call("update_product", {
    requestId: randomUUID(), productId: zeroProd.id, expectedMetadataVersion: archiveZero.data.product.metadataVersion,
    patch: { name: "Archived Name" }
  });
  failureResult(updateArchived, "Update Archived", "PRODUCT_ARCHIVED");

  const reactivate = success(await call("reactivate_product", {
    requestId: randomUUID(), productId: zeroProd.id, expectedMetadataVersion: archiveZero.data.product.metadataVersion
  }), "Reactivate");
  assert.ok(reactivate.data.product.archivedAt === null, "Product should be active again");

  // 4. Opname samecount / stale / foundStock / linked explanation / same-product constraint
  const opnameProd = success(await call("create_product", {
    requestId: randomUUID(), sku: "TEST-OPNAME", name: "Opname Test", category: "Cat",
    unit: "Pcs", sellingPrice: "1000", minStock: 0, openingQuantity: 10, purchaseTotal: "50000"
  }), "Create Opname Prod").data.product;

  const opnameSame = success(await call("record_opname", {
    requestId: randomUUID(), productId: opnameProd.id, expectedStockVersion: opnameProd.stockVersion,
    countedQuantity: 10, note: "Same count"
  }), "Opname Same Count");
  assert.equal(opnameSame.data.product.inventoryCostValue, "50000.000000");

  const opnameStale = await call("record_opname", {
    requestId: randomUUID(), productId: opnameProd.id, expectedStockVersion: opnameProd.stockVersion,
    countedQuantity: 5
  });
  failureResult(opnameStale, "Opname Stale", "VERSION_CONFLICT");

  const opnameChange = success(await call("record_opname", {
    requestId: randomUUID(), productId: opnameProd.id, expectedStockVersion: opnameSame.data.product.stockVersion,
    countedQuantity: 5, note: "Lost 5"
  }), "Opname Change");
  assert.equal(opnameChange.data.product.currentStock, 5);
  assert.equal(opnameChange.data.product.inventoryCostValue, "25000.000000"); // 50000 * 5/10

  const opnameZero = success(await call("record_opname", {
    requestId: randomUUID(), productId: opnameProd.id, expectedStockVersion: opnameChange.data.product.stockVersion,
    countedQuantity: 0, note: "Lost all"
  }), "Opname to Zero");
  assert.equal(opnameZero.data.product.inventoryCostValue, "0.000000");

  const opnameFoundMissingCost = await call("record_opname", {
    requestId: randomUUID(), productId: opnameProd.id, expectedStockVersion: opnameZero.data.product.stockVersion,
    countedQuantity: 2, note: "Found 2 missing cost"
  });
  assert.equal(opnameFoundMissingCost.data?.ok, false, "Opname from zero without foundPurchaseTotal unexpectedly allowed");

  const opnameFound = success(await call("record_opname", {
    requestId: randomUUID(), productId: opnameProd.id, expectedStockVersion: opnameZero.data.product.stockVersion,
    countedQuantity: 2, note: "Found 2", foundPurchaseTotal: "12000"
  }), "Opname Found");
  assert.equal(opnameFound.data.product.inventoryCostValue, "12000.000000");

  // Linked correction constraint
  // We need an event ID from opnameProd
  const opnameEvents = success(await call("list_inventory_events", { productId: opnameProd.id, page: 1, pageSize: 25 }), "Opname events");
  const validEventId = opnameEvents.data.items[0].id;

  const opnameLinked = success(await call("record_opname", {
    requestId: randomUUID(), productId: opnameProd.id, expectedStockVersion: opnameFound.data.product.stockVersion,
    countedQuantity: 4, note: "Correction", correctionOfEventId: validEventId
  }), "Opname Linked Correction");
  assert.equal(opnameLinked.data.product.currentStock, 4);

  // Link to another product's event
  const otherProdEvent = success(await call("list_inventory_events", { productId: costProd1.id, page: 1, pageSize: 25 }), "Other events").data.items[0].id;
  const opnameBadLink = await call("record_opname", {
    requestId: randomUUID(), productId: opnameProd.id, expectedStockVersion: opnameLinked.data.product.stockVersion,
    countedQuantity: 5, note: "Bad correction", correctionOfEventId: otherProdEvent
  });
  assert.equal(opnameBadLink.data?.ok, false, "Cross-product correction unexpectedly allowed");

  // 5. Cost zero / positive / missingreason / stale
  const costProd4 = success(await call("create_product", {
    requestId: randomUUID(), sku: "TEST-COST-ADJ", name: "Cost Adj Test", category: "Cat",
    unit: "Pcs", sellingPrice: "1000", minStock: 0, openingQuantity: 5, purchaseTotal: "10000"
  }), "Create Cost Adj Prod").data.product;

  const costMissingReason = await call("adjust_inventory_cost", {
    requestId: randomUUID(), productId: costProd4.id, expectedStockVersion: costProd4.stockVersion,
    replacementTotalCost: "15000"
  });
  // Reason is required by contract
  assert.equal(costMissingReason.data?.ok, false, "Cost adjust without reason unexpectedly allowed");

  const costPositive = success(await call("adjust_inventory_cost", {
    requestId: randomUUID(), productId: costProd4.id, expectedStockVersion: costProd4.stockVersion,
    replacementTotalCost: "15000", reason: "Revaluation"
  }), "Cost Adj Positive");
  assert.equal(costPositive.data.product.inventoryCostValue, "15000.000000");

  const costStale = await call("adjust_inventory_cost", {
    requestId: randomUUID(), productId: costProd4.id, expectedStockVersion: costProd4.stockVersion,
    replacementTotalCost: "20000", reason: "Stale"
  });
  failureResult(costStale, "Cost Adj Stale", "VERSION_CONFLICT");

  // Cost to zero when stock > 0
  const costZeroPositiveStock = success(await call("adjust_inventory_cost", {
    requestId: randomUUID(), productId: costProd4.id, expectedStockVersion: costPositive.data.product.stockVersion,
    replacementTotalCost: "0", reason: "Written off value"
  }), "Cost Zero Positive Stock");
  assert.equal(costZeroPositiveStock.data.product.inventoryCostValue, "0.000000");
  assert.equal(costZeroPositiveStock.data.product.currentStock, 5);

  const costProdZeroStock = success(await call("create_product", {
    requestId: randomUUID(), sku: "TEST-COST-ZERO", name: "Cost Zero Stock", category: "Cat",
    unit: "Pcs", sellingPrice: "1000", minStock: 0, openingQuantity: 0
  }), "Create Cost Zero Stock Prod").data.product;

  const costPositiveZeroStock = await call("adjust_inventory_cost", {
    requestId: randomUUID(), productId: costProdZeroStock.id, expectedStockVersion: costProdZeroStock.stockVersion,
    replacementTotalCost: "10000", reason: "Should fail"
  });
  assert.equal(costPositiveZeroStock.data?.ok, false, "Cost adjustment to positive on zero stock unexpectedly allowed");

  // Strict inputs and durable request identity are checked through owner RPCs.
  const receiptInput = { requestId: randomUUID(), productId: costProd4.id, quantity: 1, purchaseTotal: "0" };
  for (const patch of [
    { quantity: -1 }, { quantity: 1.5 }, { quantity: "1" }, { quantity: 1000000001 },
    { purchaseTotal: "1000000000001" }, { purchaseTotal: "10.5" }, { purchaseTotal: 10 },
    { actorId: randomUUID() }, { cartonCount: 2, unitsPerCarton: 2 },
  ]) {
    failureResult(await call("record_stock_in", { ...receiptInput, ...patch }), "Strict receipt input", "VALIDATION_ERROR");
  }
  const corrected = success(await call("record_stock_in", receiptInput), "Reuse failed request identity");
  assert.equal(corrected.ok, true);
  const canonical = success(await call("record_stock_in", { ...receiptInput, purchaseTotal: "000", note: null, reference: null }), "Canonical replay");
  assert.equal(canonical.replayed, true);
  failureResult(await call("record_stock_in", { ...receiptInput, quantity: 2 }), "Changed payload", "REQUEST_ID_CONFLICT");
  failureResult(await call("record_stock_out", { requestId: receiptInput.requestId, productId: costProd4.id, quantity: 1 }), "Changed operation", "REQUEST_ID_CONFLICT");

  for (const input of [{ page: 0 }, { pageSize: 101 }, { sort: "cost" }, { injected: true }]) {
    failureResult(await call("list_products", input), "Invalid product page", "VALIDATION_ERROR");
  }
  for (const input of [
    { startDate: "2026-10-10", endDate: "2026-10-09" },
    { startDate: "2024-01-01", endDate: "2026-01-01" },
    { startDate: "2026-02-30", endDate: "2026-03-02" }, { pageSize: 101 },
  ]) {
    failureResult(await call("list_inventory_events", input), "Invalid history page", "VALIDATION_ERROR");
  }
  assert.equal(success(await call("list_products", { search: "%" }), "Literal percent").data.total, 0);
  const page1 = success(await call("list_products", { sort: "sku", pageSize: 2 }), "First page").data;
  const page2 = success(await call("list_products", { sort: "sku", pageSize: 2, page: 2 }), "Second page").data;
  assert.equal(page1.total, page2.total);
  assert.equal(new Set([...page1.items, ...page2.items].map((p) => p.id)).size, 4);
  for (const p of page1.items) {
    for (const field of ["sellingPrice", "inventoryCostValue", "potentialSellingValue", "potentialGrossProfit", "metadataVersion", "stockVersion"]) assert.equal(typeof p[field], "string", field);
  }
  assert.equal(opnameSame.data.product.stockVersion, "2");
  assert.equal(opnameEvents.data.total, 5);

  const skuInput = { sku: "TEST-SKU-RACE", name: "SKU race", category: "Cat", unit: "Pcs", sellingPrice: "0", minStock: 0 };
  const races = await Promise.all([call("create_product", { ...skuInput, requestId: randomUUID() }), call("create_product", { ...skuInput, requestId: randomUUID() })]);
  assert.equal(races.filter((r) => r.data?.ok === true).length, 1);
  failureResult(races.find((r) => r.data?.ok === false), "Duplicate SKU race", "SKU_EXISTS");

  const archiveRace = await Promise.all([
    call("archive_product", { requestId: randomUUID(), productId: costProdZeroStock.id, expectedMetadataVersion: "1", expectedStockVersion: "0" }),
    call("record_stock_in", { requestId: randomUUID(), productId: costProdZeroStock.id, quantity: 1, purchaseTotal: "0" }),
  ]);
  assert.equal(archiveRace.filter((r) => r.data?.ok === true).length, 1);
  assert.ok(["PRODUCT_ARCHIVED", "VERSION_CONFLICT"].includes(archiveRace.find((r) => r.data?.ok === false)?.data.code));

  // Inject an evidence-write failure, then prove balance/history/retry roll back together.
  const beforeFailure = success(await call("get_product", { id: product.id }), "Before failure").data;
  const beforeHistory = success(await call("list_inventory_events", { productId: product.id }), "Before failure history").data;
  const failureInput = { requestId: randomUUID(), productId: product.id, quantity: 1, purchaseTotal: "1" };
  assertContainer();
  sql(`CREATE FUNCTION stockos_private.test_reject_event() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'secret SQL evidence failure'; END $$;
    CREATE TRIGGER test_reject_event BEFORE INSERT ON stockos_private.inventory_events FOR EACH ROW EXECUTE FUNCTION stockos_private.test_reject_event();`);
  try {
    const rejected = await call("record_stock_in", failureInput);
    failureResult(rejected, "Injected failure", "INTERNAL_ERROR");
    assert.equal(rejected.data.message, "Request failed. Retry with the same request ID.");
    assert.match(rejected.data.traceId, uuid);
    assert.deepEqual(success(await call("get_product", { id: product.id }), "Rolled back balance").data, beforeFailure);
    assert.deepEqual(success(await call("list_inventory_events", { productId: product.id }), "Rolled back history").data, beforeHistory);
  } finally {
    sql("DROP TRIGGER test_reject_event ON stockos_private.inventory_events; DROP FUNCTION stockos_private.test_reject_event();");
  }
  assert.equal(success(await call("record_stock_in", failureInput), "Retry after injected failure").ok, true);

  // Catalog proof: no direct table/helper access; public operation search paths are fixed.
  assert.equal(sql(`SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'stockos_private' AND c.relname IN ('products','inventory_events','mutation_requests','administrative_events')
      AND c.relrowsecurity AND NOT has_table_privilege('authenticated',c.oid,'SELECT,INSERT,UPDATE,DELETE')
      AND NOT has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE')`), "4");
  assert.equal(sql(`SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'stockos_private'
    AND (has_function_privilege('authenticated',p.oid,'EXECUTE') OR has_function_privilege('anon',p.oid,'EXECUTE'))`), "0");
  assert.equal(sql(`SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public'
    AND p.proname IN ('stockos_create_product','stockos_update_product','stockos_archive_product','stockos_reactivate_product','stockos_record_stock_in','stockos_record_stock_out','stockos_record_opname','stockos_adjust_inventory_cost','stockos_get_product','stockos_list_products','stockos_list_inventory_events','stockos_product_metrics','stockos_text_suggestions')
    AND p.prosecdef AND p.proconfig = ARRAY['search_path=""'] AND has_function_privilege('authenticated',p.oid,'EXECUTE') AND NOT has_function_privilege('anon',p.oid,'EXECUTE')`), "13");
  assert.equal(sql(`SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace,
    LATERAL aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
    WHERE n.nspname = 'public' AND p.proname IN ('stockos_product_metrics','stockos_text_suggestions')
      AND acl.grantee = 0 AND acl.privilege_type = 'EXECUTE'`), "0");
  for (const name of ["stockos_product_metrics", "stockos_text_suggestions"]) {
    const denied = await rpc(name, { p_input: { injected: true } }, undefined, status.ANON_KEY);
    assert.equal(denied.status, 401, "Anonymous catalog grant denied");
    assert.equal(denied.data?.code, "42501", "Anonymous denied by function grant");
  }
  assert.equal((await rpc("stockos_get_product", { p_input: { id: product.id } }, undefined, status.ANON_KEY)).ok, false, "Anonymous access denied");

  const outsider = captureUser(success(await request("/auth/v1/admin/users", {
    key: status.SERVICE_ROLE_KEY, body: { email: emails[1], password: "StockOS-outsider-test!", email_confirm: true },
  }), "Create unbound fixture user"));
  const outsiderLogin = success(await request("/auth/v1/token?grant_type=password", { body: { email: outsider.email, password: "StockOS-outsider-test!" } }), "Unbound password login");
  failureResult(await rpc("stockos_get_product", { p_input: { id: randomUUID() } }, outsiderLogin.access_token, status.ANON_KEY), "Unbound existence protection", "FORBIDDEN");
  for (const name of ["stockos_product_metrics", "stockos_text_suggestions"]) {
    failureResult(await rpc(name, { p_input: { injected: true } }, outsiderLogin.access_token, status.ANON_KEY), "Unbound catalog authorization before validation", "FORBIDDEN");
  }

  const ownerId = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString()).sub;
  assert.ok(createdUsers.has(ownerId));
  sql(`UPDATE auth.users SET email_confirmed_at = NULL WHERE id = ${sqlString(ownerId)}::uuid`);
  try {
    failureResult(await call("get_product", { id: randomUUID() }), "Unverified existence protection", "FORBIDDEN");
    for (const name of ["product_metrics", "text_suggestions"]) {
      failureResult(await call(name, { injected: true }), "Unverified catalog authorization before validation", "FORBIDDEN");
    }
  } finally {
    sql(`UPDATE auth.users SET email_confirmed_at = now() WHERE id = ${sqlString(ownerId)}::uuid`);
  }

  // Controlled fixture timestamps prove shop-local [start,end) filtering.
  sql(`UPDATE stockos_private.inventory_events SET recorded_at = '2026-10-08T17:00:00Z' WHERE id = ${sqlString(createResult.data.eventId)}::uuid;
    UPDATE stockos_private.inventory_events SET recorded_at = '2026-10-09T17:00:00Z' WHERE request_id = ${sqlString(failureInput.requestId)}::uuid;`);
  const dated = success(await call("list_inventory_events", { productId: product.id, startDate: "2026-10-09", endDate: "2026-10-10" }), "Shop timezone boundaries").data;
  assert.deepEqual(dated.items.map((e) => e.id), [createResult.data.eventId]);

  const sessionId = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString()).session_id;
  assert.match(sessionId, uuid);
  sql(`UPDATE auth.sessions SET not_after = now() - interval '1 second' WHERE id = ${sqlString(sessionId)}::uuid AND user_id = ANY(ARRAY[${[...createdUsers].map(sqlString).join(",")}]::uuid[])`);
  failureResult(await call("get_product", { id: product.id }), "Expired live session", "UNAUTHENTICATED");
  for (const name of ["product_metrics", "text_suggestions"]) {
    failureResult(await call(name, { injected: true }), "Expired catalog authorization before validation", "UNAUTHENTICATED");
  }
  sql(`UPDATE auth.sessions SET not_after = NULL WHERE id = ${sqlString(sessionId)}::uuid`);
  success(await request("/auth/v1/logout?scope=local", { token: accessToken }), "Owner provider logout");
  failureResult(await call("get_product", { id: randomUUID() }), "Revoked existence protection", "UNAUTHENTICATED");
  for (const name of ["product_metrics", "text_suggestions"]) {
    failureResult(await call(name, { injected: true }), "Revoked catalog authorization before validation", "UNAUTHENTICATED");
  }

} catch (error) {
  failure = error instanceof Error ? error.message : "Stock foundation fixture test failed";
} finally {
  if (prepared) {
    try { cleanup(); } catch { failure = `${failure ? `${failure}; ` : ""}fixture cleanup failed; inspect dedicated local fixture before retry`; }
  }
}

if (failure) {
  console.error(failure);
  process.exitCode = 1;
} else {
  console.log("Stock foundation RPC checks passed; dedicated fixture cleared.");
}