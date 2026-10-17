// Run: node scripts/check-owner-recovery.mjs <disposable recovery status.json>
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { createClient } from '@supabase/supabase-js';

const status = JSON.parse(await readFile(process.argv[2], 'utf8'));
assert.equal(status.API_URL, 'http://127.0.0.1:55641');
const container = 'supabase_db_stockos-recovery-proof';
const [inspection] = JSON.parse(execFileSync('docker', ['inspect', container], { encoding: 'utf8' }));
assert.equal(inspection.Config.Labels['com.supabase.cli.project'], 'stockos-recovery-proof');
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(status.API_URL, status.SERVICE_ROLE_KEY, options);
const client = () => createClient(status.API_URL, status.ANON_KEY, options);
const email = `recovery-proof-${randomUUID()}@example.test`;
const password = `Old-proof-${randomUUID()}!`;
const newPassword = `New-proof-${randomUUID()}!`;
let userId;
const sql = (statement) => execFileSync('docker', ['exec', container, 'psql', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres', '-c', statement], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const claims = (token) => JSON.parse(Buffer.from(token.split('.')[1], 'base64url'));
function good(result, label) { assert.ok(!result.error, label); return result.data; }
async function hash(type) {
  for (let n = 0; n < 60; n++) {
    const inbox = await fetch(status.MAILPIT_URL + '/api/v1/messages').then((r) => r.json());
    for (const message of inbox.messages) {
      if (!message.To.some((to) => to.Address === email)) continue;
      const mail = await fetch(status.MAILPIT_URL + '/api/v1/message/' + message.ID).then((r) => r.json());
      if (!mail.HTML.includes(`type=${type}`)) continue;
      const value = mail.HTML.match(/token_hash=([a-f0-9]+)/)?.[1];
      if (value) return value;
    }
    await delay(200);
  }
  throw new Error('Local purpose email missing');
}
async function register(session, purpose) {
  return admin.rpc('stockos_register_password_purpose', { p_user: userId, p_session: claims(session.access_token).session_id, p_purpose: purpose });
}
try {
  const claim = good(await admin.rpc('stockos_claim_owner', { p_email: email, p_name: 'Recovery proof', p_shop: 'Recovery contract proof', p_timezone: 'Asia/Jakarta' }), 'Claim fixture');
  assert.equal(claim.state, 'claimed', 'Refuse occupied fixture');
  const invite = good(await admin.auth.admin.inviteUserByEmail(email, { redirectTo: 'http://localhost:3004/auth/confirm', data: { stockos_attempt_id: claim.attemptId } }), 'Invite fixture');
  userId = invite.user.id;
  good(await admin.rpc('stockos_reconcile_owner', { p_attempt: claim.attemptId }), 'Bind fixture');
  const invitation = client();
  const inviteHash = await hash('invite');
  assert.ok((await invitation.auth.verifyOtp({ token_hash: inviteHash, type: 'recovery' })).error, 'Wrong purpose denied');
  const verified = good(await invitation.auth.verifyOtp({ token_hash: inviteHash, type: 'invite' }), 'Verify invite');
  // RED seam: provider OTP alone must never be sufficient to complete app password setup.
  assert.ok((await invitation.rpc('stockos_owner_invitation')).error, 'Unregistered OTP must be denied');
  good(await register(verified.session, 'invite'), 'Register invitation purpose');
  good(await invitation.rpc('stockos_owner_invitation'), 'Registered invitation permitted');
  assert.ok((await invitation.rpc('stockos_owner_recovery')).error, 'Invitation cannot complete recovery');
  good(await invitation.auth.updateUser({ password }), 'Set initial password');
  good(await invitation.auth.signOut({ scope: 'local' }), 'Close invite');
  const first = client(), second = client();
  const session1 = good(await first.auth.signInWithPassword({ email, password }), 'First login').session;
  const session2 = good(await second.auth.signInWithPassword({ email, password }), 'Second login').session;
  assert.ok((await register(session1, 'recovery')).error, 'Password session cannot register OTP purpose');
  good(await client().auth.resetPasswordForEmail(email, { redirectTo: 'http://localhost:3004/auth/confirm' }), 'Recovery request');
  const recoveryHash = await hash('recovery');
  const recovery = client();
  assert.ok((await recovery.auth.verifyOtp({ token_hash: recoveryHash, type: 'invite' })).error, 'Recovery cannot verify as invite');
  const recoverySession = good(await recovery.auth.verifyOtp({ token_hash: recoveryHash, type: 'recovery' }), 'Verify recovery').session;
  assert.ok((await recovery.rpc('stockos_owner_recovery')).error, 'Recovery requires registered evidence');
  good(await register(recoverySession, 'recovery'), 'Register recovery');
  good(await recovery.rpc('stockos_owner_recovery'), 'Owner recovery context');
  const recoveryId = claims(recoverySession.access_token).session_id;
  sql(`update stockos_private.password_purposes set expires_at=now()-interval '1 second' where session_id='${recoveryId}'`);
  assert.ok((await recovery.rpc('stockos_owner_recovery')).error, 'Expired purpose evidence denied');
  sql(`update stockos_private.password_purposes set expires_at=now()+interval '1 hour' where session_id='${recoveryId}'`);
  assert.ok((await client().rpc('stockos_register_password_purpose', { p_user: userId, p_session: recoveryId, p_purpose: 'recovery' })).error, 'Anonymous cannot register purpose');
  assert.equal(sql("select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='stockos_private' and c.relname='password_purposes' and c.relrowsecurity and not has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE') and not has_table_privilege('authenticated',c.oid,'SELECT,INSERT,UPDATE,DELETE')"), '1', 'Purpose evidence private and RLS');
  assert.ok((await recovery.rpc('stockos_owner_invitation')).error, 'Recovery cannot complete invitation');
  assert.ok((await recovery.rpc('stockos_owner_session')).error, 'Recovery cannot read owner business context');
  assert.ok((await client().auth.verifyOtp({ token_hash: recoveryHash, type: 'recovery' })).error, 'Recovery token single use');
  const starts = await Promise.all([recovery.rpc('stockos_begin_password_completion', { p_purpose: 'recovery' }), recovery.rpc('stockos_begin_password_completion', { p_purpose: 'recovery' })]);
  assert.equal(starts.filter((result) => !result.error && result.data === 'claimed').length, 1, 'Only one password writer');
  assert.equal(good(await recovery.rpc('stockos_begin_password_completion', { p_purpose: 'recovery' }), 'Pending provider outcome'), 'updating', 'Ambiguous phase never grants a second writer');
  good(await admin.rpc('stockos_finish_password_completion', { p_user: userId, p_session: recoveryId, p_purpose: 'recovery', p_updated: false }), 'Release deterministic no-write failure');
  assert.equal(good(await recovery.rpc('stockos_begin_password_completion', { p_purpose: 'recovery' }), 'Retry after confirmed no-write'), 'claimed');
  good(await recovery.auth.updateUser({ password: newPassword }), 'Change recovery password');
  good(await admin.rpc('stockos_finish_password_completion', { p_user: userId, p_session: claims(recoverySession.access_token).session_id, p_purpose: 'recovery', p_updated: true }), 'Persist updated phase');
  assert.equal(good(await recovery.rpc('stockos_begin_password_completion', { p_purpose: 'recovery' }), 'Retry completion'), 'password_updated');
  const same = await recovery.auth.updateUser({ password: newPassword });
  assert.ok(same.error, 'Native provider rejects same password; revocation retry cannot update again');
  const latest = good(await recovery.auth.getSession(), 'Latest recovery credentials').session;
  good(await recovery.auth.admin.signOut(latest.access_token, 'global'), 'Global revoke');
  for (const session of [session1, session2, recoverySession]) {
    const stale = client();
    const rpc = await fetch(status.API_URL + '/rest/v1/rpc/stockos_owner_session', { method: 'POST', headers: { apikey: status.ANON_KEY, Authorization: 'Bearer ' + session.access_token, 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(rpc.ok, false, 'Retained JWT denied by live-session check');
    assert.ok((await stale.auth.refreshSession({ refresh_token: session.refresh_token })).error, 'Every old refresh token denied');
  }
  assert.ok((await client().auth.signInWithPassword({ email, password })).error, 'Old password denied');
  good(await client().auth.signInWithPassword({ email, password: newPassword }), 'Fresh new password login');
  console.log('PASS: local recovery purpose, concurrency, native update, all-session JWT/refresh revocation, fresh login');
} finally {
  if (userId) {
    assert.match(userId, /^[a-f0-9-]{36}$/);
    sql(`begin; lock table stockos_private.owner_registration in exclusive mode; do $g$ begin if not exists(select 1 from stockos_private.owner_registration where id=1 and email='${email}' and auth_user_id='${userId}') or exists(select 1 from stockos_private.products) then raise exception 'Not captured empty fixture'; end if; end $g$; delete from stockos_private.shop_settings where id=1 and name='Recovery contract proof'; update stockos_private.owner_registration set state='unclaimed',attempt_id=null,email=null,auth_user_id=null,provisioned_at=null,bound_at=null where id=1; delete from auth.users where id='${userId}' and email='${email}'; commit;`);
  }
}
