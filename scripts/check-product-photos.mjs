import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { createServerClient } from "@supabase/ssr";

// Imported only by the existing launcher-adapted owner contract suite.
export async function checkProductPhotos({ status, accessToken, ownerSession, secondOwnerSession, call, callSecond, success, failureResult, sql }) {
  assert.ok(process.env.STOCKOS_PROOF_MANIFEST, "Run through launch-hardening-proof.py only");
  const bytes = Buffer.from("UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA", "base64");
  const hash = createHash("sha256").update(bytes).digest("hex");
  const photo = { display: { hash, bytes: bytes.length, width: 1, height: 1 }, thumb: { hash, bytes: bytes.length, width: 1, height: 1 } };
  const paths = ["display", "thumb"].map(variant => `products/${variant}/${hash}`);
  async function storage(path, { method = "GET", body, token = status.SERVICE_ROLE_KEY } = {}) {
    return fetch(`${status.API_URL}/storage/v1/${path}`, {
      method, headers: { apikey: status.ANON_KEY, Authorization: `Bearer ${token}`, "Content-Type": body instanceof Buffer ? "image/webp" : "application/json" },
      body: body instanceof Buffer ? body : body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000), redirect: "error",
    });
  }
  const create = (sku, extra = {}) => ({ requestId: randomUUID(), sku, name: "Foto uji", category: "Uji", unit: "Pcs", sellingPrice: "1000", minStock: 0, ...extra });
  const remove = (product) => call("update_product", { requestId: randomUUID(), productId: product.id, expectedMetadataVersion: product.metadataVersion, patch: { photo: null } });
  const attached = [];
  try {
    for (const path of paths) {
      assert.equal((await storage(`object/product-photos/${path}`, { method: "POST", body: bytes })).ok, true, "Upload processed variant");
      assert.equal((await storage(`object/product-photos/${path}`, { method: "POST", body: bytes })).ok, false, "Immutable key rejects overwrite");
    }
    const list = await storage("object/list/product-photos", { method: "POST", body: { prefix: "products/display", limit: 100 } });
    assert.equal((await list.json()).filter(object => object.name === hash).length, 1, "Exact content stores one object");
    const input = create("PHOTO-ONE", { photo });
    const first = success(await call("create_product", input), "Create with photo").data.product;
    attached.push(first.id);
    assert.deepEqual(first.photo, photo);
    assert.equal(success(await call("create_product", input), "Photo durable replay").replayed, true);
    const second = success(await call("create_product", create("PHOTO-TWO", { photo })), "Shared photo").data.product;
    attached.push(second.id);
    assert.deepEqual(second.photo, photo);
    const history = success(await call("list_inventory_events", { productId: first.id }), "Photo creates no stock movement").data;
    assert.equal(history.total, 0);
    failureResult(await call("create_product", create("PHOTO-MISSING", { photo: { ...photo, display: { ...photo.display, hash: "a".repeat(64) } } })), "Missing object cannot attach", "VALIDATION_ERROR");
    failureResult(await call("create_product", create("PHOTO-BAD", { photo: { ...photo, display: { ...photo.display, hash: null } } })), "Null hash rejected", "VALIDATION_ERROR");
    const edited = success(await call("update_product", { requestId: randomUUID(), productId: first.id, expectedMetadataVersion: first.metadataVersion, patch: { photo: null } }), "Remove photo").data.product;
    assert.equal(edited.photo, null);
    assert.equal(BigInt(edited.metadataVersion), BigInt(first.metadataVersion) + 1n);
    assert.equal(edited.stockVersion, first.stockVersion);
    failureResult(await callSecond("update_product", { requestId: randomUUID(), productId: first.id, expectedMetadataVersion: first.metadataVersion, patch: { photo } }), "Second session stale photo edit", "VERSION_CONFLICT");
    const addInput = { requestId: randomUUID(), productId: first.id, expectedMetadataVersion: edited.metadataVersion, patch: { photo } };
    const added = success(await call("update_product", addInput), "Add photo to existing product").data.product;
    assert.equal(success(await call("update_product", addInput), "Photo add replay").replayed, true);
    success(await remove(added), "Remove reattached photo");
    assert.equal(sql(`select count(*) from stockos_private.administrative_events where product_id = '${first.id}'::uuid and kind='photo_added'`), "1");
    const released = success(await call("release_photo", { hashes: [hash] }), "Shared reference protection");
    assert.deepEqual(released.data.unreferenced, []);
    assert.deepEqual(success(await call("release_photo", { hashes: [] }), "Empty cleanup").data.unreferenced, []);
    failureResult(await call("release_photo", {}), "Missing cleanup input", "VALIDATION_ERROR");
    assert.equal((await storage("object/product-photos", { method: "DELETE", body: { prefixes: paths } })).ok, false, "Referenced object cannot delete");
    const retained = await storage(`object/authenticated/product-photos/${paths[0]}`);
    assert.equal(retained.ok, true, "Rejected delete preserves physical object");
    assert.deepEqual(Buffer.from(await retained.arrayBuffer()), bytes);
    assert.equal((await storage(`object/authenticated/product-photos/${paths[0]}`, { token: status.ANON_KEY })).ok, false, "Anonymous Storage denied");
    assert.equal((await storage(`object/authenticated/product-photos/${paths[0]}`, { token: accessToken })).ok, false, "Direct owner bucket delivery denied");
    const cookies = [];
    const client = createServerClient(status.API_URL, status.ANON_KEY, { cookies: { getAll: () => [], setAll: values => cookies.push(...values) } });
    const auth = await client.auth.setSession({ access_token: ownerSession.access_token, refresh_token: ownerSession.refresh_token });
    assert.equal(auth.error, null);
    const cookie = cookies.map(item => `${item.name}=${item.value}`).join("; ");
    const url = `http://localhost:3012/api/product-photos/display/${hash}`;
    assert.equal((await fetch(url, { redirect: "error" })).status, 401, "Anonymous app route denied");
    const image = await fetch(url, { headers: { Cookie: cookie }, redirect: "error" });
    assert.equal(image.status, 200);
    assert.deepEqual(Buffer.from(await image.arrayBuffer()), bytes);
    assert.equal(image.headers.get("etag"), `"${hash}"`);
    assert.match(image.headers.get("cache-control"), /private/);
    assert.match(image.headers.get("cache-control"), /immutable/);
    assert.equal((await fetch(url, { headers: { Cookie: cookie, "If-None-Match": `"${hash}"` }, redirect: "error" })).status, 304);
    assert.equal((await fetch(url, { headers: { "If-None-Match": `"${hash}"` }, redirect: "error" })).status, 401);
    const sessionId = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url")).session_id;
    assert.match(sessionId, /^[0-9a-f-]{36}$/);
    sql(`UPDATE auth.sessions SET not_after = now() - interval '1 second' WHERE id = '${sessionId}'::uuid`);
    try {
      assert.equal((await fetch(url, { headers: { Cookie: cookie, "If-None-Match": `"${hash}"` }, redirect: "error" })).status, 401, "Expired owner denied before 304");
    } finally { sql(`UPDATE auth.sessions SET not_after = NULL WHERE id = '${sessionId}'::uuid`); }
    const revokedCookies = [];
    const revokedClient = createServerClient(status.API_URL, status.ANON_KEY, { cookies: { getAll: () => [], setAll: values => revokedCookies.push(...values) } });
    assert.equal((await revokedClient.auth.setSession({ access_token: secondOwnerSession.access_token, refresh_token: secondOwnerSession.refresh_token })).error, null);
    const revokedCookie = revokedCookies.map(item => `${item.name}=${item.value}`).join("; ");
    const logout = await fetch(`${status.API_URL}/auth/v1/logout?scope=local`, { method: "POST", headers: { apikey: status.ANON_KEY, Authorization: `Bearer ${secondOwnerSession.access_token}` } });
    assert.equal(logout.ok, true);
    assert.equal((await fetch(url, { headers: { Cookie: revokedCookie, "If-None-Match": `"${hash}"` }, redirect: "error" })).status, 401, "Revoked owner denied before 304");
    success(await remove(second), "Remove final reference");
    assert.deepEqual(success(await call("release_photo", { hashes: [hash] }), "Last reference released").data.unreferenced, [hash]);
    assert.equal((await storage("object/product-photos", { method: "DELETE", body: { prefixes: paths } })).ok, true);
    assert.equal((await storage(`object/authenticated/product-photos/${paths[0]}`)).ok, false);
    assert.equal((await fetch(url, { headers: { Cookie: cookie, "If-None-Match": `"${hash}"` }, redirect: "error" })).status, 404, "Deleted photo cannot return 304");
    assert.equal(sql(`select count(*) from stockos_private.administrative_events where product_id = '${first.id}'::uuid and kind='photo_removed'`), "2");
  } finally {
    for (const id of attached) {
      const current = await call("get_product", { id });
      if (current.data?.ok && current.data.data.photo) success(await remove(current.data.data), "Fixture photo detachment");
    }
    const deleted = await storage("object/product-photos", { method: "DELETE", body: { prefixes: paths } });
    assert.equal(deleted.ok, true, "Captured photo objects cleaned");
  }
}
