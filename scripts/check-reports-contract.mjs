import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

// Isolated synthetic fixture only. Runner pins unique container/volume before adapting these ports.
const status = JSON.parse(readFileSync(process.argv[2], "utf8").replace(/^﻿/, ""));
assert.equal(status.API_URL, "http://127.0.0.1:55541");
assert.equal(status.DB_URL, "postgresql://postgres:postgres@127.0.0.1:55542/postgres");
const mailUrl = "http://127.0.0.1:55544";
const container = "supabase_db_stockos-stock-proof";
const project = "stockos-stock-proof";
const run = randomUUID();
const email = `reports-contract-${run}@example.test`;
const shop = `Reports contract ${run}`;
const prefix = `RC-${run.slice(0, 8).toUpperCase()}`;
const products = new Set();
let user, token, prepared = false;
const quote = value => `'${String(value).replaceAll("'", "''")}'`;

function docker(args, input) {
  try { return execFileSync("docker", args, { input, encoding: "utf8", stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"], timeout: 60_000 }).trim(); }
  catch { throw new Error("Dedicated reports fixture Docker command failed (output suppressed)"); }
}
function guard() {
  const [item] = JSON.parse(docker(["inspect", container]));
  assert.equal(item.Name, `/${container}`);
  assert.equal(item.Config.Labels?.["com.supabase.cli.project"], project);
  assert.equal(item.State.Running, true);
  assert.ok(item.NetworkSettings.Ports["5432/tcp"].some(binding => binding.HostPort === "55542"));
}
function sql(statement) {
  guard();
  return docker(["exec", "-i", container, "psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres"], statement);
}
async function http(path, body, { admin = false, bearer = token, method = "POST" } = {}) {
  const key = admin ? status.SERVICE_ROLE_KEY : status.ANON_KEY;
  const response = await fetch(status.API_URL + path, {
    method, headers: { apikey: key, Authorization: `Bearer ${admin ? key : bearer || key}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30_000), redirect: "error",
  });
  const data = await response.json();
  return { status: response.status, data };
}
async function rpc(name, input = {}, bearer = token) {
  const response = await http(`/rest/v1/rpc/stockos_${name}`, { p_input: input }, { bearer });
  assert.equal(response.status, 200, `${name}: HTTP ${response.status}`);
  return response.data;
}
async function good(name, input = {}) {
  const result = await rpc(name, input);
  assert.equal(result.ok, true, `${name}: ${result.code ?? "unexpected failure"}`);
  return result.data;
}
async function bad(name, input, code) { assert.equal((await rpc(name, input)).code, code, name); }
async function provision() {
  const snapshot = JSON.parse(sql(`select json_build_object('state',(select state from stockos_private.owner_registration where id=1),
    'users',(select count(*) from auth.users),'shops',(select count(*) from stockos_private.shop_settings),
    'products',(select count(*) from stockos_private.products),'requests',(select count(*) from stockos_private.mutation_requests),
    'events',(select count(*) from stockos_private.inventory_events),'audit',(select count(*) from stockos_private.administrative_events))`));
  assert.equal(snapshot.state, "unclaimed", "Refuse retained owner");
  for (const key of ["users", "shops", "products", "requests", "events", "audit"]) assert.equal(snapshot[key], 0, `Refuse existing ${key}`);
  prepared = true;
  const claim = await http("/rest/v1/rpc/stockos_claim_owner", { p_email: email, p_name: "Reports proof", p_shop: shop, p_timezone: "Asia/Jakarta" }, { admin: true });
  assert.equal(claim.status, 200);
  const invitation = await http("/auth/v1/invite", { email, data: { stockos_attempt_id: claim.data.attemptId } }, { admin: true });
  assert.equal(invitation.status, 200);
  user = (invitation.data.user ?? invitation.data).id;
  assert.match(user, /^[0-9a-f-]{36}$/);
  const bound = await http("/rest/v1/rpc/stockos_reconcile_owner", { p_attempt: claim.data.attemptId }, { admin: true });
  assert.equal(bound.data, user);
  let hash;
  for (let i = 0; i < 80 && !hash; i++) {
    const messages = await (await fetch(`${mailUrl}/api/v1/messages`)).json();
    for (const message of messages.messages) {
      if (!message.To.some(recipient => recipient.Address === email)) continue;
      const content = await (await fetch(`${mailUrl}/api/v1/message/${message.ID}`)).json();
      hash = content.HTML.match(/token_hash=([a-f0-9]+)/)?.[1];
    }
    if (!hash) await delay(250);
  }
  assert.ok(hash, "Fixture invitation missing");
  const verified = await http("/auth/v1/verify", { token_hash: hash, type: "invite" }, { bearer: null });
  assert.equal(verified.status, 200);
  const password = `Local-${randomUUID()}!`;
  assert.equal((await http("/auth/v1/user", { password }, { bearer: verified.data.access_token, method: "PUT" })).status, 200);
  const login = await http("/auth/v1/token?grant_type=password", { email, password }, { bearer: null });
  assert.equal(login.status, 200);
  assert.ok(login.data.user.email_confirmed_at);
  token = login.data.access_token;
}
function cleanup() {
  if (!prepared) return;
  const ids = products.size ? `array[${[...products].map(quote).join(",")}]::uuid[]` : "array[]::uuid[]";
  const actor = user ? `${quote(user)}::uuid` : "null::uuid";
  sql(`begin;
    lock table stockos_private.owner_registration, stockos_private.shop_settings, stockos_private.products in exclusive mode;
    do $guard$ begin
      if exists(select 1 from stockos_private.owner_registration where state <> 'unclaimed' and (email is distinct from ${quote(email)} or auth_user_id is distinct from ${actor}))
        or exists(select 1 from stockos_private.shop_settings where id <> 1 or name <> ${quote(shop)})
        or exists(select 1 from auth.users where id is distinct from ${actor} or email <> ${quote(email)})
        or exists(select 1 from stockos_private.products where not(id=any(${ids})))
        or exists(select 1 from stockos_private.mutation_requests where actor_id is distinct from ${actor})
        or exists(select 1 from stockos_private.inventory_events where actor_id is distinct from ${actor})
        or exists(select 1 from stockos_private.administrative_events where actor_id is distinct from ${actor})
      then raise exception 'Refuse cleanup of unknown fixture state'; end if;
    end $guard$;
    delete from stockos_private.inventory_events where product_id=any(${ids});
    delete from stockos_private.administrative_events where actor_id=${actor};
    delete from stockos_private.products where id=any(${ids});
    delete from stockos_private.mutation_requests where actor_id=${actor};
    delete from stockos_private.shop_settings where id=1 and name=${quote(shop)};
    update stockos_private.owner_registration set state='unclaimed',attempt_id=null,email=null,auth_user_id=null,provisioned_at=null,bound_at=null,updated_at=now() where id=1;
    delete from auth.users where id=${actor} and email=${quote(email)};
    commit;`);
}
async function create(suffix, name, qty = 1, price = "100") {
  const result = await good("create_product", { requestId: randomUUID(), sku: `${prefix}-${suffix}`, name, category: "Proof", unit: "Pcs", sellingPrice: price, minStock: 5, openingQuantity: qty, purchaseTotal: qty ? "1" : "0" });
  products.add(result.product.id);
  return result.product;
}
const dates = { startDate: "2026-10-01", endDate: "2026-10-08", expectedTimezone: "Asia/Jakarta" };
async function check() {
  await provision();
  const big = await create("BIG", "Besar", 1_000_000_000, "1000000000000");
  const literal = await create("LITERAL", "Literal %_", 1);
  await create("NORMAL", "Literal normal", 1);
  let value = await good("get_valuation_report", { mode: "summary" });
  assert.equal(value.total.totalValuation, "1000000000000000000200");
  assert.deepEqual(Object.keys(value).sort(), ["mode", "total"]);
  const margin = await create("NEGATIVE", "Modal lebih tinggi", 1, "1");
  sql(`update stockos_private.products set inventory_cost_value=2 where id=${quote(margin.id)}::uuid`);
  value = await good("get_valuation_report", { mode: "screen", search: margin.sku });
  assert.ok(value.total.grossMargin.startsWith("-"));
  assert.ok(value.total.marginPercent.startsWith("-"));
  for (const name of ["get_valuation_report", "get_low_stock_report"]) {
    assert.equal((await good(name, { mode: "screen", search: "%_" })).count, 1);
    await bad(name, { mode: "screen", pageSize: 101 }, "VALIDATION_ERROR");
    await bad(name, { mode: "summary", page: 1 }, "VALIDATION_ERROR");
    await bad(name, { mode: "export", limit: 20000 }, "VALIDATION_ERROR");
  }
  sql(`update stockos_private.inventory_events set recorded_at='2026-10-07T16:30:00Z' where product_id=${quote(literal.id)}::uuid;
    update stockos_private.inventory_events set recorded_at='2026-09-01T00:00:00Z' where product_id<>${quote(literal.id)}::uuid;`);
  let movement = await good("get_movement_report", { mode: "screen", ...dates, search: "%_" });
  assert.equal(movement.summary.totalOpeningQty, 1);
  assert.equal(movement.trends.length, 1);
  assert.equal(movement.trends[0].date, "2026-10-07");
  assert.equal(movement.items[0].productId, literal.id);
  await bad("get_movement_report", { mode: "screen", ...dates, expectedTimezone: "Asia/Makassar" }, "VERSION_CONFLICT");
  sql("update stockos_private.shop_settings set timezone='Asia/Makassar' where id=1");
  movement = await good("get_movement_report", { mode: "screen", ...dates, expectedTimezone: "Asia/Makassar", search: "%_" });
  assert.equal(movement.summary.totalOpeningQty, 0, "Makassar midnight excludes Oct8 event");
  sql("update stockos_private.shop_settings set timezone='Asia/Jakarta' where id=1");
  await bad("get_movement_report", { mode: "screen", ...dates, startDate: "2026-02-30" }, "VALIDATION_ERROR");
  await bad("get_movement_report", { mode: "summary", ...dates, pageSize: 25 }, "VALIDATION_ERROR");
  const anon = await http("/rest/v1/rpc/stockos_get_valuation_report", { p_input: { mode: "summary" } }, { bearer: null });
  assert.ok(anon.status === 401 || anon.status === 403, "Anonymous execute denied");
  const outsideEmail = `outside-${run}@example.test`;
  const outsidePassword = `Local-${randomUUID()}!`;
  const outsider = await http("/auth/v1/admin/users", { email: outsideEmail, password: outsidePassword, email_confirm: true }, { admin: true });
  assert.equal(outsider.status, 200);
  const outsideId = (outsider.data.user ?? outsider.data).id;
  try {
    const outsideLogin = await http("/auth/v1/token?grant_type=password", { email: outsideEmail, password: outsidePassword }, { bearer: null });
    assert.equal(outsideLogin.status, 200);
    assert.equal((await rpc("get_valuation_report", { mode: "summary" }, outsideLogin.data.access_token)).code, "FORBIDDEN", "Real nonowner session denied");
  } finally {
    assert.equal((await http(`/auth/v1/admin/users/${outsideId}`, undefined, { admin: true, method: "DELETE" })).status, 200);
  }
  const permissions = JSON.parse(sql("select json_build_object('private',has_table_privilege('authenticated','stockos_private.products','select'),'anon',has_function_privilege('anon','public.stockos_get_valuation_report(jsonb)','execute'))"));
  assert.deepEqual(permissions, { private: false, anon: false });

  // Bulk synthetic records bypass mutation cost only; constraints and public read authorization stay real.
  const bulk = [];
  for (let i = 1; i <= 10001; i++) { const id = randomUUID(); products.add(id); bulk.push([id, i]); }
  for (let offset = 0; offset < bulk.length; offset += 250) {
    const chunk = bulk.slice(offset, offset + 250);
    sql(`begin; insert into stockos_private.products(id,sku,name,category,unit,selling_price,min_stock,current_stock,inventory_cost_value,stock_version)
      values ${chunk.map(([id,i]) => `(${quote(id)}::uuid,${quote(`${prefix}-B${i}`)},'Same name',${quote(`Bulk${String(i).padStart(5,"0")}`)},'Pcs',1,5,1,0,1)`).join(",")};
      with requests as (insert into stockos_private.mutation_requests(request_id,actor_id,operation,payload_hash,result,completed_at)
        select id,${quote(user)}::uuid,'create_product','synthetic','{"ok":true}'::jsonb,now() from stockos_private.products where id=any(array[${chunk.map(([id])=>quote(id)).join(",")}]::uuid[]) returning request_id)
      insert into stockos_private.inventory_events(product_id,kind,stock_version,quantity_before,quantity_after,quantity_delta,cost_before,cost_after,cost_delta,purchase_total,reference,actor_id,request_id,sku_snapshot,name_snapshot,unit_snapshot,selling_price_snapshot,recorded_at)
        select p.id,'opening',1,0,1,1,0,0,0,0,'synthetic',${quote(user)}::uuid,p.id,p.sku,p.name,p.unit,p.selling_price,'2026-10-02T00:00:00Z'
        from stockos_private.products p join requests r on r.request_id=p.id; commit;`);
  }
  for (const name of ["get_valuation_report", "get_low_stock_report", "get_movement_report"]) {
    const base = { search: "Same name", ...(name === "get_movement_report" ? dates : {}) };
    const first = await good(name, { ...base, mode: "screen", page: 1, pageSize: 100 });
    const second = await good(name, { ...base, mode: "screen", page: 2, pageSize: 100 });
    const repeat = await good(name, { ...base, mode: "screen", page: 1, pageSize: 100 });
    const rows = report => report.items ?? report.categories;
    assert.equal(first.count, 10001);
    assert.equal(rows(first).length, 100);
    assert.deepEqual(rows(first), rows(repeat));
    const identity = row => row.id ?? row.productId ?? row.categoryName;
    assert.equal(new Set([...rows(first), ...rows(second)].map(identity)).size, 200);
    const totals = report => Object.fromEntries(Object.entries(report.summary ?? report.total).filter(([key]) => key !== "asOf"));
    const seen = new Set();
    for (let page = 1; page <= Math.ceil(first.count / 100); page++) {
      const detail = page === 1 ? first : page === 2 ? second : await good(name, { ...base, mode: "screen", page, pageSize: 100 });
      assert.deepEqual(totals(detail), totals(first));
      for (const row of rows(detail)) { const id = identity(row); assert.ok(!seen.has(id), "No repeated identity across all report pages"); seen.add(id); }
    }
    assert.equal(seen.size, first.count, "All filtered detail rows traversed");
    assert.deepEqual(totals(first), totals(second));
    const summary = await good(name, { ...base, mode: "summary" });
    assert.deepEqual(totals(summary), totals(first));
    assert.equal(summary.items, undefined);
    assert.equal(summary.categories, undefined);
    await bad(name, { ...base, mode: "export" }, "LIMIT_EXCEEDED");
    const last = bulk.at(-1)[0];
    sql(`update stockos_private.products set name='Excluded bulk' where id=${quote(last)}::uuid`);
    const exported = await good(name, { ...base, mode: "export" });
    assert.equal(rows(exported).length, 10000);
    assert.equal(exported.count, 10000);
    sql(`update stockos_private.products set name='Same name' where id=${quote(last)}::uuid`);
  }
  // First 30d bucket includes today-29 and today-28, never today-30.
  sql(`update stockos_private.inventory_events set recorded_at=now()-interval '60 days';
    update stockos_private.inventory_events set recorded_at=(((now() at time zone 'Asia/Jakarta')::date-30)::timestamp at time zone 'Asia/Jakarta') where product_id=${quote(big.id)}::uuid;
    update stockos_private.inventory_events set recorded_at=(((now() at time zone 'Asia/Jakarta')::date-29)::timestamp at time zone 'Asia/Jakarta') where product_id=${quote(literal.id)}::uuid;
    update stockos_private.inventory_events set recorded_at=(((now() at time zone 'Asia/Jakarta')::date-28)::timestamp at time zone 'Asia/Jakarta') where product_id=${quote(margin.id)}::uuid;`);
  const dashboard = await good("get_dashboard");
  const activity = dashboard.movements.days30;
  assert.equal(activity.data.length, 4);
  assert.equal(activity.data[0].stockIn, 2, "First bucket covers today-29 and today-28, excluding today-30");
  assert.ok(activity.data.every(bucket => bucket.period.includes("–")), "Actual date-range labels required");
  console.log("Reports contract: exact numeric/literal search/timezone/date/paging/10000 boundary/security passed");
}
let error;
try { await check(); } catch (caught) { error = caught; }
try { cleanup(); } catch (caught) { error ??= caught; }
if (error) throw error;
