import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const directory = mkdtempSync(join(tmpdir(), "stockos-seeder-safety-"));
const statusFile = join(directory, "status.json");
const productsFile = join(directory, "products.json");
const token = "synthetic-owner-token-canary";
const key = "synthetic-anon-key-canary";
const marker = "SYNTHETIC_FETCH";
const preload = `
  import assert from "node:assert/strict";
  let requestCount = 0;
  globalThis.fetch = async (url, options) => {
    requestCount++;
    console.log("${marker}");
    assert.equal(url, process.env.SEED_EXPECTED_ENDPOINT);
    assert.equal(options.method, "POST");
    assert.equal(options.redirect, "error");
    assert.equal(options.headers.Authorization, "Bearer " + process.env.SEED_TEST_TOKEN);
    assert.equal(options.headers.apikey, process.env.SEED_TEST_KEY);
    assert.equal(options.headers["Content-Type"], "application/json");
    const payload = JSON.parse(options.body).p_input;
    assert.ok(payload.requestId && payload.sku && payload.name);
    if (process.env.SEED_REJECT_REDIRECT === "1") throw new TypeError("Synthetic redirect rejected");
    const failed = process.env.SEED_FAILURE_MODE === "all"
      || (process.env.SEED_FAILURE_MODE === "one" && requestCount === 2);
    return { ok: true, json: async () => ({ ok: !failed }) };
  };
`;
const scripts = ["seed-products-json.mjs", "seed-warung-catalog.mjs"];

function run(script, apiUrl, { dryRun = false, rejectRedirect = false, failureMode = "", args,
  endpoint = "http://127.0.0.1:55541/rest/v1/rpc/stockos_create_product" } = {}) {
  writeFileSync(statusFile, JSON.stringify({ API_URL: apiUrl, ANON_KEY: key }));
  const positional = [statusFile, token, ...(script === scripts[0] ? [productsFile] : [])];
  const result = spawnSync(process.execPath, [
    "--import", `data:text/javascript,${encodeURIComponent(preload)}`,
    join(root, "scripts", script), ...(args ?? [...positional, ...(dryRun ? ["--dry-run"] : [])]),
  ], {
    cwd: root, encoding: "utf8", timeout: 15_000,
    env: { ...process.env, SEED_EXPECTED_ENDPOINT: endpoint,
      SEED_TEST_TOKEN: token, SEED_TEST_KEY: key, SEED_REJECT_REDIRECT: rejectRedirect ? "1" : "0",
      SEED_FAILURE_MODE: failureMode },
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  const output = `${result.stdout}${result.stderr}`;
  assert.ok(!output.includes(token) && !output.includes(key), "Seeder output must not expose credentials");
  return { status: result.status, output };
}

try {
  writeFileSync(productsFile, JSON.stringify([{
    sku: "PROOF-001", name: "Synthetic product", category: "Bahan Pokok", unit: "Pcs",
    minStock: 0, sellingPrice: "1000", openingQuantity: 0, purchaseTotal: "0",
  }]));
  const invalidOrigins = [
    undefined, null, 123, {}, "", "not-a-url",
    "http://127.0.0.1.example.invalid:55541", "http://example.invalid:55541",
    "https://example.invalid", "https://127.0.0.1:55541", "http://localhost:55541",
    "http://[::1]:55541", "http://127.0.0.1:55541/rest/v1", "http://127.0.0.1:55541/../",
    `http://127.0.0.1:${token}@example.invalid:55541`,
    `http://${token}@127.0.0.1:55541`, `http://127.0.0.1:55541?token=${token}`,
    `http://127.0.0.1:55541#${token}`, "http://127.0.0.1:55541?", "http://127.0.0.1:55541#",
  ];
  for (const script of scripts) {
    for (const origin of invalidOrigins) {
      const result = run(script, origin);
      assert.notEqual(result.status, 0, `${script} must reject invalid origin`);
      assert.match(result.output, /Refuse (invalid|non-local) API origin/);
      assert.ok(!result.output.includes(marker), `${script} must reject origin before fetch`);
    }
    for (const origin of ["http://127.0.0.1:55541", "http://127.0.0.1:55541/", "http://127.0.0.1"]) {
      const accepted = run(script, origin, { endpoint: origin === "http://127.0.0.1"
        ? "http://127.0.0.1/rest/v1/rpc/stockos_create_product" : undefined });
      assert.equal(accepted.status, 0, `${script} must accept local origin: ${accepted.output}`);
      assert.equal((accepted.output.match(/^SYNTHETIC_FETCH\r?$/gm) ?? []).length, script === scripts[0] ? 1 : 18);
    }
    const redirect = run(script, "http://127.0.0.1:55541", { rejectRedirect: true });
    assert.notEqual(redirect.status, 0, `${script} must fail on redirect`);
    assert.match(redirect.output, /Synthetic redirect rejected/);
    assert.equal((redirect.output.match(/^SYNTHETIC_FETCH\r?$/gm) ?? []).length, 1, "Redirect must not retry another request");
    const dry = run(script, "http://127.0.0.1:55541", { dryRun: true });
    assert.equal(dry.status, 0);
    assert.ok(!dry.output.includes(marker), "Dry run must never fetch");
  }
  const partial = run(scripts[1], "http://127.0.0.1:55541", { failureMode: "one" });
  assert.equal(partial.status, 1, "Partial catalog seeding must exit 1");
  assert.match(partial.output, /Seeding completed: 17\/18 products created\./);
  const failed = run(scripts[1], "http://127.0.0.1:55541", { failureMode: "all" });
  assert.equal(failed.status, 1, "Failed catalog seeding must exit 1");
  assert.match(failed.output, /Seeding completed: 0\/18 products created\./);
  for (const args of [[], ["--dry-run"]]) {
    const dry = run(scripts[1], undefined, { args });
    assert.equal(dry.status, 0);
    assert.ok(!dry.output.includes(marker));
  }
  const dataset = run(scripts[0], "http://127.0.0.1:55541", {
    args: [statusFile, token, join(root, "stockos-products-seed.json"), "--dry-run"],
  });
  assert.equal(dataset.status, 0);
  assert.match(dataset.output, /Validated 48\/48 products/);
  assert.ok(!dataset.output.includes(marker));
  console.log("PASS: both seeders enforce local origins, reject redirects, preserve payloads and dry runs; catalog partial/total failures exit 1; offline only.");
} finally {
  rmSync(directory, { recursive: true, force: true });
}
