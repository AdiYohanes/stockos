// Run: node scripts/check-owner-provider.mjs <local Supabase status JSON>
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const config = JSON.parse(await readFile(process.argv[2], "utf8"));
assert.equal(new URL(config.API_URL).hostname, "127.0.0.1", "Provider proof must be local");
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(config.API_URL, config.SERVICE_ROLE_KEY, options);
const client = createClient(config.API_URL, config.ANON_KEY, options);
const email = `owner-proof-${randomUUID()}@example.test`;
const password = `Local-proof-${randomUUID()}`;
let userId;

async function invitationHash() {
  const inbox = await fetch(`${config.MAILPIT_URL}/api/v1/messages`).then((r) => r.json());
  const message = inbox.messages.find((item) => item.To.some((to) => to.Address === email));
  assert.ok(message, "Invitation reaches local inbox");
  const mail = await fetch(`${config.MAILPIT_URL}/api/v1/message/${message.ID}`).then((r) => r.json());
  const hash = mail.HTML.match(/token_hash=([^&"\s]+)/)?.[1];
  assert.ok(hash, "Invitation template contains provider token hash");
  return hash;
}

try {
  const signup = await client.auth.signUp({ email, password });
  assert.ok(signup.error, "Public signup must be disabled");
  console.log("PASS: provider rejects public signup");

  const invite = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: "http://localhost:3000/auth/confirm",
    data: { stockos_attempt_id: randomUUID() },
  });
  assert.ifError(invite.error);
  userId = invite.data.user.id;
  assert.equal(invite.data.user.email_confirmed_at, undefined);
  console.log("PASS: admin invitation works with public signup disabled");
  let hash = await invitationHash();

  const resend = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: "http://localhost:3000/auth/confirm",
  });
  assert.ifError(resend.error);
  assert.equal(resend.data.user.id, userId, "Resend preserves provider identity");
  hash = await invitationHash();
  console.log("PASS: invitation resend preserves same unconfirmed identity");

  const wrongPurpose = await client.auth.verifyOtp({ token_hash: hash, type: "recovery" });
  assert.ok(wrongPurpose.error, "Invitation cannot be verified as recovery");
  const verified = await client.auth.verifyOtp({ token_hash: hash, type: "invite" });
  assert.ifError(verified.error);
  assert.equal(verified.data.user.id, userId);
  assert.ok(verified.data.user.email_confirmed_at);
  const inviteClaims = JSON.parse(Buffer.from(verified.data.session.access_token.split(".")[1], "base64url"));
  console.log("PASS: invitation verifies email; AMR:", JSON.stringify(inviteClaims.amr));
  const replay = await createClient(config.API_URL, config.ANON_KEY, options).auth.verifyOtp({ token_hash: hash, type: "invite" });
  assert.ok(replay.error, "Invitation token is single use");

  const update = await client.auth.updateUser({ password });
  assert.ifError(update.error);
  const logout = await client.auth.signOut({ scope: "local" });
  assert.ifError(logout.error);

  const signedIn = await client.auth.signInWithPassword({ email, password });
  assert.ifError(signedIn.error);
  const session = signedIn.data.session;
  const claims = JSON.parse(Buffer.from(session.access_token.split(".")[1], "base64url"));
  assert.ok(claims.amr.some((entry) => entry.method === "password"));
  assert.ok(!inviteClaims.amr.some((entry) => entry.method === "password"));
  console.log("PASS: fresh password session distinct from invitation; AMR:", JSON.stringify(claims.amr));

  const refresh = await client.auth.refreshSession();
  assert.ifError(refresh.error);
  assert.equal(JSON.parse(Buffer.from(refresh.data.session.access_token.split(".")[1], "base64url")).session_id, claims.session_id);
  const retainedToken = refresh.data.session.access_token;
  const retainedRefresh = refresh.data.session.refresh_token;
  const signedOut = await client.auth.signOut({ scope: "local" });
  assert.ifError(signedOut.error);
  const oldRefresh = await client.auth.refreshSession({ refresh_token: retainedRefresh });
  assert.ok(oldRefresh.error, "Logged-out refresh token must fail");
  const oldUser = await client.auth.getUser(retainedToken);
  console.log("PASS: refresh rotation and logout; retained JWT getUser rejects:", Boolean(oldUser.error));
  console.log("PASS: local invitation/password/session provider proof (external SMTP unverified)");
} finally {
  if (userId) {
    const removed = await admin.auth.admin.deleteUser(userId);
    assert.ifError(removed.error);
  }
}
