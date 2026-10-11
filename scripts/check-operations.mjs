// Run: node scripts/check-operations.mjs --self-test | --run
// Creates NEW local fixtures only. Dumps contain Auth credentials; never commit or share them.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, readdir, rmdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createClient } from '@supabase/supabase-js';

const root = resolve(import.meta.dirname, '..');
const cli = process.platform === 'win32' ? join(root, 'node_modules/@supabase/cli-windows-x64/bin/supabase.exe') : join(root, 'node_modules/.bin/supabase');
const projects = ['stockos-ops-source', 'stockos-ops-restore'];
const ports = [55741, 55841];
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const verifyBackup = (bytes, expected) => assert.equal(digest(bytes), expected, 'Backup checksum mismatch');

function guard(target) {
  const index = projects.indexOf(target.project);
  assert.ok(index >= 0, 'Unknown operational fixture');
  assert.equal(target.api, `http://127.0.0.1:${ports[index]}`, 'Refuse nonfixture URL');
  assert.equal(target.name, `/supabase_db_${target.project}`, 'Wrong container name');
  assert.equal(target.label, target.project, 'Wrong project label');
  assert.equal(target.running, true, 'Fixture not running');
  assert.equal(target.createdByRun, true, 'Refuse existing resource');
}

function command(binary, args, options = {}) {
  try {
    return execFileSync(binary, args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 300_000, maxBuffer: 32 * 1024 * 1024, ...options });
  } catch (error) {
    if (args.includes('pg_restore')) {
      const stderr = String(error.stderr ?? '');
      const denied = stderr.match(/permission denied for (schema|table|function) ([a-z_]+)/);
      if (denied && /^(auth|public|extensions|users|sessions|refresh_tokens|identities)$/.test(denied[2])) console.error(`Restore denied ${denied[1]} ${denied[2]}`);
      for (const kind of ['already exists', 'violates foreign key constraint', 'permission denied', 'duplicate key', 'does not exist']) {
        if (stderr.includes(kind)) console.error(`Restore diagnostic: ${kind}; object/values suppressed`);
      }
    }
    throw new Error('Operational command failed; provider output suppressed');
  }
}

async function selfTest() {
  const target = { project: projects[0], api: 'http://127.0.0.1:55741', name: '/supabase_db_stockos-ops-source', label: projects[0], running: true, createdByRun: true };
  const check = (input) => spawnSync(process.execPath, [import.meta.filename, '--check-target'], { input: JSON.stringify(input), encoding: 'utf8', timeout: 5000 });
  assert.equal(check(target).status, 0, 'Owned target accepted');
  for (const patch of [{ api: 'https://example.com' }, { api: 'http://127.0.0.1:55431' }, { project: 'stockos-auth' }, { label: 'other' }, { name: '/other' }, { running: false }, { createdByRun: false }]) {
    const result = check({ ...target, ...patch, secret: 'never-print-this-secret' });
    assert.equal(result.status, 1, 'Unsafe target rejected');
    assert.ok(!(result.stdout + result.stderr).includes('never-print-this-secret'), 'No secret in output');
  }
  console.log('PASS operations target guards');
}

async function run() {
  // Atomic lock across runners; retained containers/volumes require manual inspection, never reuse.
  const lock = join(tmpdir(), 'stockos-operations.lock');
  await mkdir(lock);
  try { await drill(); } finally { await rmdir(lock); }
}

async function drill() {
  {
    const existing = command('docker', ['ps', '-a', '--format', '{{.Names}}']);
    const volumes = command('docker', ['volume', 'ls', '--format', '{{.Name}}']);
    assert.ok(projects.every((project) => !(existing + '\n' + volumes).split(/\r?\n/).some((name) => name.endsWith(`_${project}`))), 'Existing operations resources; inspect before reuse');
  }
  const directory = await mkdtemp(join(tmpdir(), 'stockos-operations-'));
  if (process.platform === 'win32') {
    const sid = command('whoami', ['/user', '/fo', 'csv', '/nh']).match(/S-1-\d+(?:-\d+)+/)?.[0];
    assert.ok(sid, 'Cannot determine backup file owner');
    command('icacls', [directory, '/inheritance:r', '/grant:r', `*${sid}:(OI)(CI)F`]);
  } else command('chmod', ['700', directory]);
  const migrations = (await readdir(join(root, 'supabase/migrations'))).filter((name) => name.endsWith('.sql')).sort();
  const last = migrations.at(-1);
  assert.ok(last, 'No migrations');
  const fixtures = [];
  let phase = 'prepare';
  const started = Date.now();
  try {
    for (const [index, project] of projects.entries()) {
      const workdir = join(directory, project);
      await mkdir(join(workdir, 'supabase/migrations'), { recursive: true });
      await cp(join(root, 'supabase/templates'), join(workdir, 'supabase/templates'), { recursive: true });
      let config = await readFile(join(root, 'supabase/config.toml'), 'utf8');
      config = config.replace('stockos-auth', project).replaceAll('5543', index === 0 ? '5574' : '5584');
      if (index === 0) for (const file of migrations.slice(0, -1)) await cp(join(root, 'supabase/migrations', file), join(workdir, 'supabase/migrations', file));
      await writeFile(join(workdir, 'supabase/config.toml'), config, { mode: 0o600 });
      // Register only new resources; cleanup inspects their project label before stopping them.
      const fixture = { project, workdir, container: `supabase_db_${project}`, createdByRun: true };
      fixtures.push(fixture);
      command(cli, ['start', '--workdir', workdir, '--exclude', 'studio,realtime,storage-api,imgproxy,edge-runtime,logflare,vector,supavisor']);
      fixture.status = JSON.parse(command(cli, ['status', '--workdir', workdir, '-o', 'json']));
      const [created] = JSON.parse(command('docker', ['inspect', fixture.container]));
      fixture.containerId = created.Id;
      inspect(fixture);
      await writeFile(join(workdir, 'status.json'), JSON.stringify(fixture.status), { mode: 0o600 });
    }
    const [source, target] = fixtures;
    const options = { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(15_000), redirect: 'error' }) } };
    const client = (fixture, admin = false) => createClient(fixture.status.API_URL, admin ? fixture.status.SERVICE_ROLE_KEY : fixture.status.ANON_KEY, options);
    const good = (result, label) => { phase = label; assert.ok(!result.error, label); return result.data; };
    const email = `operations-${randomUUID()}@example.test`;
    const password = `Operations-${randomUUID()}!`;
    const admin = client(source, true);
    phase = 'owner invitation';
    const claim = good(await admin.rpc('stockos_claim_owner', { p_email: email, p_name: 'Operations proof', p_shop: 'Operations proof', p_timezone: 'Asia/Jakarta' }), 'Claim source');
    good(await admin.auth.admin.inviteUserByEmail(email, { redirectTo: 'http://localhost:3000/auth/confirm', data: { stockos_attempt_id: claim.attemptId } }), 'Invite source');
    good(await admin.rpc('stockos_reconcile_owner', { p_attempt: claim.attemptId }), 'Bind source');
    const invite = client(source);
    const session = good(await invite.auth.verifyOtp({ type: 'invite', token_hash: await invitationHash(source, email) }), 'Verify source invitation').session;
    const userId = session.user.id;
    const sessionId = JSON.parse(Buffer.from(session.access_token.split('.')[1], 'base64url')).session_id;
    good(await admin.rpc('stockos_register_password_purpose', { p_user: userId, p_session: sessionId, p_purpose: 'invite' }), 'Register verified invitation');
    good(await invite.auth.updateUser({ password }), 'Set initial password');
    good(await invite.auth.signOut(), 'Close invitation');
    const owner = client(source);
    const originalSession = good(await owner.auth.signInWithPassword({ email, password }), 'Source login').session;
    const call = (connection, name, input = {}) => connection.rpc(`stockos_${name}`, { p_input: input });
    const createInput = { requestId: randomUUID(), sku: 'OPS-PROOF', name: 'Beras uji', category: 'Sembako', unit: 'pcs', sellingPrice: '5000', minStock: 2, openingQuantity: 10, purchaseTotal: '40000' };
    const creation = good(await call(owner, 'create_product', createInput), 'Create fixture product');
    assert.equal(creation.ok, true, 'Create committed');
    const productId = creation.data.product.id;
    const receiptInput = { requestId: randomUUID(), productId, quantity: 10, purchaseTotal: '30000' };
    assert.equal(good(await call(owner, 'record_stock_in', receiptInput), 'Receive fixture').ok, true);
    assert.equal(good(await call(owner, 'record_stock_out', { requestId: randomUUID(), productId, quantity: 5 }), 'Sell fixture').ok, true);
    const before = good(await call(owner, 'get_product', { id: productId }), 'Read source');
    assert.equal(before.data.currentStock, 15, 'Worked quantity');
    assert.equal(before.data.inventoryCostValue, '52500.000000', 'Worked weighted modal');
    const settings = good(await call(owner, 'get_shop_settings'), 'Read settings');
    assert.equal(good(await call(owner, 'update_shop_settings', { requestId: randomUUID(), expectedVersion: settings.data.version, name: 'Operations proof updated', ownerName: settings.data.ownerName, timezone: settings.data.timezone, defaultUnit: settings.data.defaultUnit, defaultMinStock: settings.data.defaultMinStock }), 'Update settings').ok, true);
    phase = 'forward migration';
    const beforeHash = snapshot(source);
    await cp(join(root, 'supabase/migrations', last), join(source.workdir, 'supabase/migrations', last));
    command(cli, ['migration', 'up', '--local', '--workdir', source.workdir]);
    assert.equal(snapshot(source), beforeHash, 'Forward migration preserves domain data');
    assert.equal(sql(source, `select count(*) from supabase_migrations.schema_migrations where version='${last.split('_')[0]}'`), '1', 'Forward history recorded');
    command(cli, ['migration', 'up', '--local', '--workdir', source.workdir]);
    assert.equal(snapshot(source), beforeHash, 'Migration retry no-op');
    const failedPath = join(source.workdir, 'supabase/migrations/20261011000000_operations_failure.sql');
    await writeFile(failedPath, "create table public.operations_rollback_probe(id int); select 1/0;", { mode: 0o600 });
    assert.throws(() => command(cli, ['migration', 'up', '--local', '--workdir', source.workdir]), 'Injected migration fails');
    assert.equal(sql(source, "select to_regclass('public.operations_rollback_probe') is null"), 't', 'Failed migration DDL rolls back');
    assert.equal(sql(source, "select count(*) from supabase_migrations.schema_migrations where version='20261011000000'"), '0', 'Failed version not recorded');
    assert.equal(snapshot(source), beforeHash, 'Failed migration preserves data');
    phase = 'backup';
    for (const table of sql(source, "select tablename from pg_tables where schemaname='auth' and tablename in ('mfa_factors','mfa_challenges')").split('\n').filter(Boolean)) {
      assert.equal(sql(source, `select count(*) from auth.${table}`), '0', 'MFA restoration outside this password-only fixture proof');
    }
    phase = 'consistent dump';
    const backup = join(directory, 'stockos.dump');
    const bytes = command('docker', ['exec', source.container, 'pg_dump', '-U', 'postgres', '-d', 'postgres', '-Fc', '--schema=stockos_private', '--schema=public', '--schema=auth', '--schema=supabase_migrations'], { encoding: null });
    await writeFile(backup, bytes, { mode: 0o600 });
    const backupHash = digest(bytes);
    const backupTime = Date.now();
    verifyBackup(await readFile(backup), backupHash);
    assert.throws(() => verifyBackup(Buffer.concat([bytes, Buffer.from('corruption')]), backupHash), 'Corrupt backup rejected before restore');
    assert.equal(command('docker', ['exec', source.container, 'postgres', '--version']), command('docker', ['exec', target.container, 'postgres', '--version']), 'Same PostgreSQL version');
    phase = 'restore preflight';
    assert.equal(sql(target, 'select count(*) from auth.users'), '0', 'Refuse populated Auth target');
    assert.equal(sql(target, "select to_regnamespace('stockos_private') is null"), 't', 'Refuse existing application target');
    verifyBackup(await readFile(backup), backupHash);
    command('docker', ['cp', backup, `${target.container}:/tmp/stockos.dump`]);
    assert.equal(command('docker', ['exec', target.container, 'sha256sum', '/tmp/stockos.dump']).split(' ')[0], backupHash, 'Copied archive checksum');
    const toc = command('docker', ['exec', target.container, 'pg_restore', '--list', '/tmp/stockos.dump']);
    // Platform creates managed Auth schema. Restore its data, not platform-owned DDL/version table.
    // Local restore needs platform admin for managed Auth grants; never use this as cloud credentials.
    const selected = toc.split('\n').filter((line) => {
      if (line.startsWith(';') || !line.trim()) return false;
      if (/ SCHEMA - (auth|public) /.test(line)) return false;
      if (/ auth /.test(line)) return (/ TABLE DATA auth /.test(line) && !/ TABLE DATA auth schema_migrations /.test(line)) || / SEQUENCE SET auth /.test(line);
      return true;
    }).sort((left, right) => {
      // ponytail: password-only fixture without MFA factors/challenges; review dependencies before adding MFA.
      // Managed Auth foreign keys already exist: restore parent rows before children.
      const rank = (line) => {
        const table = line.match(/ TABLE DATA auth (\w+) /)?.[1];
        if (!table) return 6;
        const index = ['users', 'identities', 'sessions', 'refresh_tokens'].indexOf(table);
        return index < 0 ? 5 : index + 1;
      };
      return rank(left) - rank(right);
    }).join('\n');
    assert.ok(selected.includes('TABLE DATA auth users'), 'Backup includes owner identity');
    assert.ok(selected.includes('TABLE DATA stockos_private products'), 'Backup includes operational data');
    await writeFile(join(directory, 'restore.list'), selected, { mode: 0o600 });
    command('docker', ['cp', join(directory, 'restore.list'), `${target.container}:/tmp/restore.list`]);
    phase = 'restore';
    // Quarantine HTTP access while imported sessions could still authorize requests.
    command('docker', ['pause', `supabase_auth_${target.project}`, `supabase_rest_${target.project}`]);
    const restoreStarted = Date.now();
    command('docker', ['exec', target.container, 'pg_restore', '-U', 'supabase_admin', '-d', 'postgres', '--single-transaction', '--exit-on-error', '--use-list=/tmp/restore.list', '/tmp/stockos.dump']);
    assert.equal(snapshot(target), snapshot(source), 'Domain/owner/settings/evidence/retry restored exactly');
    assert.equal(sql(target, 'select string_agg(version,\',\' order by version) from supabase_migrations.schema_migrations'), sql(source, 'select string_agg(version,\',\' order by version) from supabase_migrations.schema_migrations'), 'Migration history restored');
    assert.equal(sql(target, 'select count(*) from auth.sessions'), sql(source, 'select count(*) from auth.sessions'), 'Session snapshot restored before quarantine');
    phase = 'JWT control before quarantine';
    const claims = JSON.parse(Buffer.from(originalSession.access_token.split('.')[1], 'base64url'));
    const jwtSql = `set local role authenticated; set local request.jwt.claims = '${JSON.stringify(claims).replaceAll("'", "''")}';`;
    assert.ok(sql(target, `begin; ${jwtSql} select stockos_owner_session(); rollback;`), 'Restored JWT claims authorize before quarantine');
    // Target has never been exposed to an app. Invalidate all restored login/token-purpose state now.
    sql(target, 'begin; delete from stockos_private.password_purposes; delete from auth.sessions; delete from auth.refresh_tokens; update auth.users set confirmation_token=\'\', recovery_token=\'\', email_change_token_new=\'\', email_change_token_current=\'\', reauthentication_token=\'\'; commit;');
    command('docker', ['unpause', `supabase_auth_${target.project}`, `supabase_rest_${target.project}`]);
    const restored = client(target);
    phase = 'old refresh denial';
    const oldRefresh = await restored.auth.refreshSession({ refresh_token: originalSession.refresh_token });
    assert.equal(oldRefresh.error?.status, 400, 'Old refresh rejected by Auth, not outage');
    assert.equal(oldRefresh.error?.code, 'refresh_token_not_found', 'Restored refresh token removed');
    assert.equal(sql(target, `begin; ${jwtSql} do $proof$ begin perform stockos_owner_session(); raise exception 'Unexpected access'; exception when sqlstate '42501' then null; end $proof$; rollback;`), '', 'Same claims receive authorization denial after quarantine');
    phase = 'old JWT denial';
    const retained = client(target);
    const denial = await fetch(`${target.status.API_URL}/rest/v1/rpc/stockos_owner_session`, { method: 'POST', headers: { apikey: target.status.ANON_KEY, Authorization: `Bearer ${originalSession.access_token}`, 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(15_000), redirect: 'error' });
    assert.equal(denial.status, 403, 'Retained authenticated JWT denied by owner authorization');
    assert.equal((await denial.json()).code, '42501', 'Live-session authorization denial');
    assert.ok((await retained.rpc('stockos_owner_session')).error, 'Anonymous owner access denied');
    good(await restored.auth.signInWithPassword({ email, password }), 'Fresh restored owner login');
    const after = good(await call(restored, 'get_product', { id: productId }), 'Read restored stock');
    assert.deepEqual(after, before, 'Owner sees exact restored product');
    const replay = good(await call(restored, 'record_stock_in', receiptInput), 'Replay restored request');
    assert.equal(replay.replayed, true, 'Retry identity restored');
    assert.equal(good(await call(restored, 'get_product', { id: productId }), 'Read after replay').data.currentStock, 15, 'Replay cannot duplicate stock');
    assert.equal(sql(target, "select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='stockos_private' and (has_function_privilege('anon',p.oid,'EXECUTE') or has_function_privilege('authenticated',p.oid,'EXECUTE'))"), '0', 'Private function grants preserved');
    assert.equal(sql(target, "select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='stockos_private' and c.relkind='r' and (not c.relrowsecurity or has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE') or has_table_privilege('authenticated',c.oid,'SELECT,INSERT,UPDATE,DELETE'))"), '0', 'Private table RLS/grants preserved');
    const evidence = { status: 'PASS_LOCAL_ONLY', capturedAt: new Date(backupTime).toISOString(), backupSha256: backupHash, postgresVersion: command('docker', ['exec', target.container, 'postgres', '--version']).trim(), migrations: migrations.length, stock: 15, inventoryCostValue: '52500.000000', restoreMilliseconds: Date.now() - restoreStarted, snapshotAgeMilliseconds: Date.now() - backupTime, totalMilliseconds: Date.now() - started, smtp: 'BLOCKED_NO_SEND', offHostBackup: 'NOT_PROVEN', deployment: 'NOT_AUTHORIZED' };
    await writeFile(join(directory, 'evidence.json'), JSON.stringify(evidence, null, 2), { mode: 0o600 });
    console.log('PASS local forward migration, independent dump/restore, owner/session/grant/retry checks');
    console.log(`Protected proof directory (sensitive dump; retain for review): ${directory}`);
    console.log(`Restore ${evidence.restoreMilliseconds}ms; SMTP/off-host recovery/deployment remain unproven`);
  } catch {
    console.error(`FAIL operations phase: ${phase}; raw output suppressed. Inspect protected directory: ${directory}`);
    process.exitCode = 1;
  } finally {
    for (const fixture of fixtures.reverse()) {
      try {
        inspect(fixture);
        command(cli, ['stop', '--workdir', fixture.workdir, '--no-backup']);
      } catch {
        console.error(`Fixture cleanup incomplete: ${fixture.project}; inspect before manual cleanup`);
        process.exitCode = 1;
      }
    }
  }
}

function inspect(fixture) {
  assert.ok(fixture.containerId, 'No captured run-owned container ID');
  const [inspection] = JSON.parse(command('docker', ['inspect', fixture.container]));
  assert.equal(inspection.Id, fixture.containerId, 'Resource replaced since creation');
  guard({ project: fixture.project, api: fixture.status?.API_URL, name: inspection.Name, label: inspection.Config.Labels?.['com.supabase.cli.project'], running: inspection.State.Running, createdByRun: fixture.createdByRun });
}
function sql(fixture, statement) {
  inspect(fixture);
  return command('docker', ['exec', fixture.container, 'psql', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-U', 'supabase_admin', '-d', 'postgres', '-c', statement]).trim();
}
function snapshot(fixture) {
  // Exact stable inventory of domain rows; digest only, never print credentials or row content.
  const rows = sql(fixture, "select tablename from pg_tables where schemaname='stockos_private' and tablename not in ('auth_throttle','password_purposes') order by tablename").split('\n');
  return digest(rows.map((table) => sql(fixture, `select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from stockos_private.${table} t`)).join('\n'));
}
async function invitationHash(fixture, email) {
  const mail = `http://127.0.0.1:${fixture.project === projects[0] ? 55744 : 55844}`;
  for (let attempt = 0; attempt < 60; attempt++) {
    const inbox = await fetch(`${mail}/api/v1/messages`, { signal: AbortSignal.timeout(5000), redirect: 'error' }).then((response) => response.json());
    for (const message of inbox.messages ?? []) {
      if (!message.To?.some((recipient) => recipient.Address === email)) continue;
      const detail = await fetch(`${mail}/api/v1/message/${encodeURIComponent(message.ID)}`, { signal: AbortSignal.timeout(5000), redirect: 'error' }).then((response) => response.json());
      const hash = detail.HTML?.match(/token_hash=([a-f0-9]+)/)?.[1];
      if (hash) return hash;
    }
    await delay(250);
  }
  throw new Error('Local invitation did not arrive');
}

try {
  const mode = process.argv[2];
  if (mode === '--check-target' && process.argv.length === 3) {
    let input = '';
    for await (const chunk of process.stdin) { input += chunk; assert.ok(input.length <= 4096, 'Oversized input'); }
    guard(JSON.parse(input));
    console.log('Target accepted');
  } else if (mode === '--self-test' && process.argv.length === 3) await selfTest();
  else if (mode === '--run' && process.argv.length === 3) await run();
  else throw new Error('Usage');
} catch {
  console.error('FAIL operations input/preflight; details suppressed');
  process.exitCode = 1;
}
