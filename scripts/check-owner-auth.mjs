import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

// Local, destructive fixture test. Never point this at a shop or cloud project.
// Usage: node scripts/check-owner-auth.mjs <local-supabase-status.json>
// status file: output of `supabase status -o json`; keys never printed.
const status = JSON.parse(readFileSync(process.argv[2], "utf8").replace(/^﻿/, ""));
assert.ok(["http://127.0.0.1:55431", "http://127.0.0.1:55641"].includes(status.API_URL), "Refuse nonfixture API URL");
assert.equal(typeof status.ANON_KEY, "string", "Missing local anon key");
assert.equal(typeof status.SERVICE_ROLE_KEY, "string", "Missing local service key");
assert.ok(status.ANON_KEY.length && status.SERVICE_ROLE_KEY.length, "Empty local keys");
const project = status.API_URL.endsWith(":55641") ? "stockos-recovery-proof" : "stockos-auth";
const container = `supabase_db_${project}`;
const mailUrl = project === "stockos-recovery-proof" ? "http://127.0.0.1:55644" : "http://127.0.0.1:55434";
const runId = randomUUID();
const emails = Array.from({ length: 6 }, () => `owner-${randomUUID()}@example.test`);
const createdUsers = new Set();
const throttleBuckets = [`stockos-auth-test:${runId}`, `stockos-auth-test:${runId}:other`];
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
  const ids = [...createdUsers];
  ids.forEach((id) => assert.match(id, uuid, "Invalid captured fixture user ID"));
  const captured = ids.length ? ids.map(sqlString).join(",") : "NULL";
  return `
    IF (SELECT count(*) FROM stockos_private.owner_registration) <> 1
      OR NOT EXISTS (SELECT 1 FROM stockos_private.owner_registration WHERE id = 1)
    THEN RAISE EXCEPTION 'Unexpected registration singleton'; END IF;
    IF EXISTS (
      SELECT 1 FROM stockos_private.owner_registration
      WHERE state <> 'unclaimed' AND (
        email IS NULL OR email !~ '^owner-[0-9a-f-]{36}@example[.]test$'
        OR (auth_user_id IS NOT NULL AND auth_user_id NOT IN (${captured}))
      )
    ) THEN RAISE EXCEPTION 'Not an owned auth fixture'; END IF;
    IF EXISTS (
      SELECT 1 FROM stockos_private.shop_settings
      WHERE id <> 1 OR name NOT IN ('Warung Uji', 'StockOS auth test')
    ) THEN RAISE EXCEPTION 'Not test shop settings'; END IF;
    IF EXISTS (
      SELECT 1 FROM stockos_private.owner_registration r
      WHERE r.state <> 'unclaimed'
        AND NOT EXISTS (SELECT 1 FROM stockos_private.shop_settings s WHERE s.id = 1)
    ) THEN RAISE EXCEPTION 'Missing fixture shop marker'; END IF;
    IF EXISTS (
      SELECT 1 FROM auth.users WHERE id IN (${captured})
        AND (email IS NULL OR email NOT IN (${emails.map(sqlString).join(",")}))
    ) THEN RAISE EXCEPTION 'Captured fixture identity changed'; END IF;`;
}

function inspectFixture() {
  assertContainer();
  // Inspection precedes cleanup; return values stay private, never printed.
  const snapshot = JSON.parse(sql(`SELECT json_build_object(
    'registration', (SELECT row_to_json(r) FROM stockos_private.owner_registration r WHERE id = 1),
    'shops', (SELECT coalesce(json_agg(json_build_object('id', id, 'name', name)), '[]'::json) FROM stockos_private.shop_settings)
  )`));
  assert.ok(snapshot.registration, "Missing seeded registration");
  const registration = snapshot.registration;
  if (registration.state !== "unclaimed") {
    assert.match(registration.email ?? "", /^owner-[0-9a-f-]{36}@example\.test$/, "Existing owner is not dedicated fixture");
    assert.ok(registration.auth_user_id === null || createdUsers.has(registration.auth_user_id), "Refuse deleting uncaptured owner");
    assert.ok(snapshot.shops.some((shop) => shop.id === 1 && ["Warung Uji", "StockOS auth test"].includes(shop.name)), "Missing fixture shop marker");
  }
  assert.ok(snapshot.shops.every((shop) => shop.id === 1 && ["Warung Uji", "StockOS auth test"].includes(shop.name)), "Refuse unrelated settings");
}

function cleanup() {
  inspectFixture();
  const ids = [...createdUsers];
  sql(`BEGIN;
    LOCK TABLE stockos_private.owner_registration, stockos_private.shop_settings IN EXCLUSIVE MODE;
    DO $fixture$ BEGIN ${fixtureGuard()} END $fixture$;
    DELETE FROM stockos_private.shop_settings WHERE id = 1 AND name IN ('Warung Uji', 'StockOS auth test');
    UPDATE stockos_private.owner_registration SET state = 'unclaimed', attempt_id = NULL,
      email = NULL, auth_user_id = NULL, provisioned_at = NULL, bound_at = NULL, updated_at = now()
      WHERE id = 1;
    ${ids.length ? `DELETE FROM auth.users WHERE id IN (${ids.map(sqlString).join(",")}) AND email IN (${emails.map(sqlString).join(",")});` : ""}
    DELETE FROM stockos_private.auth_throttle WHERE bucket IN (${throttleBuckets.map(sqlString).join(",")});
    COMMIT;`);
  createdUsers.clear();
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

const rpc = (name, body = {}, token, key = status.SERVICE_ROLE_KEY) => request(`/rest/v1/rpc/stockos_${name}`, { key, token, body });
function success(result, label) {
  assert.ok(result.ok, `${label}: HTTP ${result.status}`);
  return result.data;
}
function forbidden(result, label) {
  assert.equal(result.ok, false, `${label}: unexpectedly allowed`);
  assert.equal(result.data?.code, "42501", `${label}: wrong denial code`);
}
function claims(token) {
  const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
  assert.match(payload.session_id ?? "", uuid, "Provider JWT missing session_id");
  return payload;
}
function captureUser(data) {
  const user = data.user ?? data;
  assert.match(user.id ?? "", uuid, "Provider missing fixture user ID");
  assert.ok(emails.includes(user.email), "Provider returned unrelated email");
  createdUsers.add(user.id);
  return user;
}
const claim = (email) => rpc("claim_owner", { p_email: email, p_name: "StockOS auth test", p_shop: "StockOS auth test", p_timezone: "Asia/Jakarta" });

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

function proveGrants() {
  const grantProof = JSON.parse(sql(`SELECT json_build_object(
    'private_schema', NOT has_schema_privilege('anon', 'stockos_private', 'USAGE')
      AND NOT has_schema_privilege('authenticated', 'stockos_private', 'USAGE'),
    'private_tables', NOT EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'stockos_private' AND c.relkind IN ('r', 'p')
        AND (has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE')
          OR has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE'))
    ),
    'helper', NOT has_function_privilege('anon', 'stockos_private.owner_context(boolean)', 'EXECUTE')
      AND NOT has_function_privilege('authenticated', 'stockos_private.owner_context(boolean)', 'EXECUTE'),
    'service_rpcs', NOT EXISTS (
      SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname IN ('stockos_claim_owner', 'stockos_reconcile_owner', 'stockos_pending_owner', 'stockos_auth_throttle')
        AND (NOT has_function_privilege('service_role', p.oid, 'EXECUTE')
          OR has_function_privilege('anon', p.oid, 'EXECUTE')
          OR has_function_privilege('authenticated', p.oid, 'EXECUTE'))
    ),
    'owner_rpcs', NOT EXISTS (
      SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname IN ('stockos_owner_session', 'stockos_owner_invitation')
        AND (has_function_privilege('anon', p.oid, 'EXECUTE')
          OR NOT has_function_privilege('authenticated', p.oid, 'EXECUTE'))
    ),
    'public_execute', NOT EXISTS (
      SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace,
        LATERAL aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
      WHERE ((n.nspname = 'public' AND p.proname LIKE 'stockos_%')
        OR (n.nspname = 'stockos_private' AND p.proname = 'owner_context'))
        AND a.grantee = 0 AND a.privilege_type = 'EXECUTE'
    )
  )`));
  for (const [name, passed] of Object.entries(grantProof)) assert.equal(passed, true, `Grant proof failed: ${name}`);
}

try {
  inspectFixture();
  proveGrants();
  cleanup();
  prepared = true;

  const same = await Promise.all(Array.from({ length: 8 }, () => claim(emails[0])));
  const sameClaims = same.map((result) => success(result, "Same-email claim"));
  assert.equal(sameClaims.filter((result) => result.state === "claimed").length, 1, "Same-email claim must have one winner");
  assert.equal(sameClaims.filter((result) => result.state === "resume").length, 7, "Same-email retries must resume");
  const firstAttempt = sameClaims[0].attemptId;
  assert.match(firstAttempt ?? "", uuid, "Claim missing attemptId");
  assert.ok(sameClaims.every((result) => result.attemptId === firstAttempt && result.email === emails[0]), "Same-email claims diverged");
  assert.equal(success(await claim(emails[1]), "Other-email claim").state, "pending");
  assert.equal(success(await rpc("reconcile_owner", { p_attempt: firstAttempt }), "Missing invited user"), null);
  assert.equal(success(await claim(emails[0]), "Claim retry").attemptId, firstAttempt);
  const wrongAttempt = await rpc("reconcile_owner", { p_attempt: randomUUID() });
  assert.equal(wrongAttempt.ok, false, "Wrong attempt unexpectedly reconciled");
  assert.ok(JSON.stringify(wrongAttempt.data).includes("SETUP_PENDING"), "Wrong attempt must report SETUP_PENDING");

  cleanup();
  const different = await Promise.all(emails.slice(0, 4).map(claim));
  const differentClaims = different.map((result) => success(result, "Different-email claim"));
  const winnerIndex = differentClaims.findIndex((result) => result.state === "claimed");
  assert.ok(winnerIndex >= 0, "Different-email claim missing winner");
  assert.equal(differentClaims.filter((result) => result.state === "claimed").length, 1);
  assert.equal(differentClaims.filter((result) => result.state === "pending").length, 3);
  const ownerEmail = emails[winnerIndex];
  const attemptId = differentClaims[winnerIndex].attemptId;
  assert.match(attemptId ?? "", uuid);

  const signup = await request("/auth/v1/signup", { body: { email: emails[5], password: `NoSignup-${randomUUID()}!` } });
  assert.equal(signup.ok, false, "Public signup unexpectedly enabled");
  const invited = captureUser(success(await request("/auth/v1/invite", {
    key: status.SERVICE_ROLE_KEY,
    body: { email: ownerEmail, data: { stockos_attempt_id: randomUUID() } },
  }), "Admin invite"));
  assert.equal(success(await rpc("reconcile_owner", { p_attempt: attemptId }), "Mismatched invite metadata"), null);
  assert.equal(success(await rpc("pending_owner", { p_email: ownerEmail }), "Unbound pending owner"), null);
  assert.equal(success(await claim(ownerEmail), "Mismatched metadata leaves resumable setup").state, "resume");
  captureUser(success(await request(`/auth/v1/admin/users/${invited.id}`, {
    key: status.SERVICE_ROLE_KEY, method: "PUT", body: { user_metadata: { stockos_attempt_id: attemptId } },
  }), "Correct fixture invite metadata"));
  assert.equal(success(await rpc("reconcile_owner", { p_attempt: attemptId }), "Bind invited owner"), invited.id);
  assert.equal(success(await rpc("reconcile_owner", { p_attempt: attemptId }), "Repeated reconciliation"), invited.id);
  assert.equal(success(await rpc("pending_owner", { p_email: ownerEmail }), "Bound pending owner"), invited.id);
  assert.equal(success(await rpc("pending_owner", { p_email: emails[4] }), "Other pending email"), null);
  const closed = await Promise.all([claim(ownerEmail), claim(emails[4])]);
  closed.forEach((result) => assert.equal(success(result, "Bound closes setup").state, "closed"));

  const anonymousCalls = [
    ["claim_owner", { p_email: ownerEmail, p_name: "Test", p_shop: "Test", p_timezone: "Asia/Jakarta" }],
    ["reconcile_owner", { p_attempt: attemptId }],
    ["pending_owner", { p_email: ownerEmail }],
    ["auth_throttle", { p_bucket: throttleBuckets[0], p_limit: 3, p_seconds: 60 }],
    ["owner_session", {}], ["owner_invitation", {}],
  ];
  for (const [name, body] of anonymousCalls) forbidden(await rpc(name, body, undefined, status.ANON_KEY), `Anon ${name}`);

  const hash = await invitationHash(ownerEmail);
  assert.equal((await request("/auth/v1/verify", { body: { token_hash: hash, type: "recovery" } })).ok, false, "Invite accepted as recovery");
  const invitation = success(await request("/auth/v1/verify", { body: { token_hash: hash, type: "invite" } }), "Verify invitation");
  captureUser(invitation);
  assert.ok(invitation.access_token && invitation.refresh_token, "Invite missing session");
  assert.ok(claims(invitation.access_token).amr.some((entry) => entry.method === "otp"), "Invitation AMR is not OTP");
  assert.equal((await request("/auth/v1/verify", { body: { token_hash: hash, type: "invite" } })).ok, false, "Invite replay accepted");
  forbidden(await rpc("owner_invitation", {}, invitation.access_token, status.ANON_KEY), "Unregistered OTP invitation");
  success(await rpc("register_password_purpose", { p_user: invited.id, p_session: claims(invitation.access_token).session_id, p_purpose: "invite" }), "Verified invitation purpose registration");
  assert.deepEqual(success(await rpc("owner_invitation", {}, invitation.access_token, status.ANON_KEY), "Invitation owner context"), { id: invited.id, email: ownerEmail, name: "StockOS auth test" });
  forbidden(await rpc("owner_session", {}, invitation.access_token, status.ANON_KEY), "OTP cannot authorize owner session");
  assert.equal(success(await rpc("pending_owner", { p_email: ownerEmail }), "Confirmed email no longer pending"), null);

  const password = `StockOS-test-${randomUUID()}!`;
  captureUser(success(await request("/auth/v1/user", { method: "PUT", token: invitation.access_token, body: { password } }), "Initial password"));
  forbidden(await rpc("owner_session", {}, invitation.access_token, status.ANON_KEY), "Initial password does not upgrade OTP JWT");
  assert.deepEqual(success(await rpc("owner_invitation", {}, invitation.access_token, status.ANON_KEY), "Setup session can retry logout after password save"), { id: invited.id, email: ownerEmail, name: "StockOS auth test" });
  success(await request("/auth/v1/logout?scope=local", { token: invitation.access_token }), "Logout invitation session");
  forbidden(await rpc("owner_session", {}, invitation.access_token, status.ANON_KEY), "Revoked invitation JWT");

  const login = success(await request("/auth/v1/token?grant_type=password", { body: { email: ownerEmail, password } }), "Fresh owner password login");
  captureUser(login);
  assert.ok(claims(login.access_token).amr.some((entry) => entry.method === "password"), "Fresh login missing password AMR");
  const owner = { id: invited.id, email: ownerEmail, name: "StockOS auth test" };
  assert.deepEqual(success(await rpc("owner_session", {}, login.access_token, status.ANON_KEY), "Password owner context"), owner);
  forbidden(await rpc("owner_invitation", {}, login.access_token, status.ANON_KEY), "Password login is not invitation");
  const refreshed = success(await request("/auth/v1/token?grant_type=refresh_token", { body: { refresh_token: login.refresh_token } }), "Owner refresh");
  assert.equal(claims(refreshed.access_token).session_id, claims(login.access_token).session_id, "Refresh changed session identity");
  assert.deepEqual(success(await rpc("owner_session", {}, refreshed.access_token, status.ANON_KEY), "Refreshed owner context"), owner);

  const outsiderPassword = `StockOS-unbound-${randomUUID()}!`;
  captureUser(success(await request("/auth/v1/admin/users", {
    key: status.SERVICE_ROLE_KEY,
    body: { email: emails[4], password: outsiderPassword, email_confirm: true },
  }), "Create dedicated unbound user"));
  const outsider = success(await request("/auth/v1/token?grant_type=password", { body: { email: emails[4], password: outsiderPassword } }), "Unbound password login");
  forbidden(await rpc("owner_session", {}, outsider.access_token, status.ANON_KEY), "Unbound owner session");
  forbidden(await rpc("owner_invitation", {}, outsider.access_token, status.ANON_KEY), "Unbound invitation context");
  for (const [name, body] of anonymousCalls.slice(0, 4)) forbidden(await rpc(name, body, outsider.access_token, status.ANON_KEY), `Authenticated ${name} grant`);

  const attempts = await Promise.all(Array.from({ length: 12 }, () => rpc("auth_throttle", { p_bucket: throttleBuckets[0], p_limit: 3, p_seconds: 60 })));
  const allowed = attempts.map((result) => success(result, "Shared throttle"));
  assert.ok(allowed.every((value) => typeof value === "boolean"), "Throttle must return bool");
  assert.equal(allowed.filter(Boolean).length, 3, "Shared concurrent throttle exceeded limit");
  assert.equal(success(await rpc("auth_throttle", { p_bucket: throttleBuckets[0], p_limit: 3, p_seconds: 60 }), "Shared throttle remains exhausted"), false);
  assert.equal(success(await rpc("auth_throttle", { p_bucket: throttleBuckets[1], p_limit: 3, p_seconds: 60 }), "Other throttle bucket independent"), true);

  success(await request("/auth/v1/logout?scope=local", { token: refreshed.access_token }), "Owner logout");
  forbidden(await rpc("owner_session", {}, login.access_token, status.ANON_KEY), "Retained pre-refresh JWT after logout");
  forbidden(await rpc("owner_session", {}, refreshed.access_token, status.ANON_KEY), "Retained refreshed JWT after logout");
  assert.equal((await request("/auth/v1/token?grant_type=refresh_token", { body: { refresh_token: refreshed.refresh_token } })).ok, false, "Logged-out refresh accepted");
  assert.equal((await request("/auth/v1/user", { method: "GET", token: refreshed.access_token })).ok, false, "Logged-out provider user accepted");
} catch (error) {
  // Never dump responses, JWTs, status JSON, provider errors, or Docker output.
  failure = error instanceof Error ? error.message : "Owner auth fixture test failed";
} finally {
  if (prepared) {
    try { cleanup(); } catch { failure = `${failure ? `${failure}; ` : ""}fixture cleanup failed; inspect dedicated local fixture before retry`; }
  }
}

if (failure) {
  console.error(failure);
  process.exitCode = 1;
} else {
  console.log("Owner auth RPC/provider checks passed; dedicated fixture cleared.");
}
