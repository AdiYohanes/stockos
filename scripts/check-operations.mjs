// Run: node scripts/check-operations.mjs --self-test | --run
// Creates NEW local fixtures only. Dumps contain Auth credentials; never commit or share them.
import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, readdir, rmdir, symlink, writeFile } from 'node:fs/promises';
import { createServerClient } from '@supabase/ssr';
import { tmpdir } from 'node:os';
import { createServer } from 'node:net';
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createClient } from '@supabase/supabase-js';

const root = resolve(import.meta.dirname, '..');
const cli = process.platform === 'win32' ? join(root, 'node_modules/@supabase/cli-windows-x64/bin/supabase.exe') : join(root, 'node_modules/.bin/supabase');
const projects = ['stockos-ops-source', 'stockos-ops-restore'];
const ports = [55741, 55841];
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const verifyBackup = (bytes, expected) => assert.equal(digest(bytes), expected, 'Backup checksum mismatch');

function verifyPhotos(manifest, content) {
  assert.equal(manifest.bucket, 'product-photos', 'Unexpected photo bucket');
  const paths = new Set();
  for (const object of manifest.objects) {
    const match = /^products\/(display|thumb)\/([0-9a-f]{64})$/.exec(object.path);
    assert.ok(match && match[2] === object.sha256, 'Unsafe photo path/hash');
    assert.ok(!paths.has(object.path), 'Duplicate photo object');
    paths.add(object.path);
    assert.ok(Number.isInteger(object.bytes) && object.bytes > 0 && object.bytes <= 131072, 'Invalid photo size');
    const bytes = content.get(object.path);
    assert.ok(bytes && bytes.length === object.bytes, 'Photo missing or truncated');
    verifyBackup(bytes, object.sha256);
  }
  assert.ok(['display', 'thumb'].every(variant => manifest.objects.some(object => object.path.startsWith(`products/${variant}/`))), 'Both photo variants required');
  assert.equal(content.size, paths.size, 'Unexpected photo content');
}

function guard(target) {
  const index = projects.indexOf(target.project);
  assert.ok(index >= 0, 'Unknown operational fixture');
  assert.equal(target.api, `http://127.0.0.1:${ports[index]}`, 'Refuse nonfixture URL');
  assert.equal(target.name, `/supabase_db_${target.project}`, 'Wrong container name');
  assert.equal(target.label, target.project, 'Wrong project label');
  assert.equal(target.running, true, 'Fixture not running');
  assert.equal(target.createdByRun, true, 'Refuse existing resource');
}

// Synthetic rollback probe must be unique against every real migration and sort after the latest.
function probeMigration(migrations) {
  assert.ok(migrations.length, 'No migrations');
  const latest = migrations.at(-1).split('_')[0];
  assert.ok(/^\d{14}$/.test(latest), 'Unexpected migration version');
  const version = String(BigInt(latest) + 1n).padStart(14, '0');
  assert.ok(!migrations.some((name) => name.startsWith(version)), 'Probe version collision');
  return { version, name: `${version}_operations_failure.sql` };
}

// Evidence must never claim PASS when any cleanup step failed.
function evidenceStatus(cleanupOk) {
  return cleanupOk ? 'PASS_LOCAL_ONLY' : 'FAIL_CLEANUP';
}

function command(binary, args, options = {}) {
  try {
    return execFileSync(binary, args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 300_000, maxBuffer: 32 * 1024 * 1024, ...options });
  } catch (error) {
    if (args.includes('migration') && args.includes('--workdir')) {
      writeFileSync(join(args[args.indexOf('--workdir') + 1], 'migration-error.log'), JSON.stringify({ status: error.status, code: error.code, signal: error.signal }) + '\n' + String(error.stderr ?? '') + '\n' + String(error.stdout ?? ''), { mode: 0o600 });
    }
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
  // Probe selection: unique successor of the latest real version, never colliding.
  const probe = probeMigration(['20261013000000_dashboard_zero_stock_value.sql']);
  assert.equal(probe.version, '20261013000001');
  assert.equal(probe.name, '20261013000001_operations_failure.sql');
  assert.equal(probeMigration(['20261011000000_report_accuracy.sql', '20261013000000_dashboard_zero_stock_value.sql']).version, '20261013000001', 'Probe ignores stale earlier versions');
  // Sorted input can never collide (probe = max + 1); collision guard defends unsorted input.
  assert.throws(() => probeMigration(['20261013000001_existing.sql', '20261013000000_report_accuracy.sql']), 'Collision selection refused');
  assert.throws(() => probeMigration([]), 'Empty migration list refused');
  // Evidence status: cleanup failure must never report PASS.
  assert.equal(evidenceStatus(true), 'PASS_LOCAL_ONLY');
  assert.equal(evidenceStatus(false), 'FAIL_CLEANUP');
  const image = Buffer.from('synthetic-photo');
  const hash = digest(image);
  const objects = ['display', 'thumb'].map(variant => ({ path: `products/${variant}/${hash}`, sha256: hash, bytes: image.length }));
  const manifest = { bucket: 'product-photos', objects };
  const content = new Map(objects.map(object => [object.path, image]));
  verifyPhotos(manifest, content);
  assert.throws(() => verifyPhotos(manifest, new Map([[objects[0].path, Buffer.from('corrupt')], [objects[1].path, image]])), 'Corrupt photo refused');
  assert.throws(() => verifyPhotos({ ...manifest, objects: [objects[0]] }, content), 'Missing variant refused');
  assert.throws(() => verifyPhotos({ ...manifest, objects: [{ ...objects[0], path: '../escape' }, objects[1]] }, content), 'Unsafe object path refused');
  assert.throws(() => verifyPhotos({ ...manifest, objects: [objects[0], objects[0], objects[1]] }, content), 'Duplicate object refused');
  console.log('PASS operations target guards, probe selection, evidence status, photo backup integrity');
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
    // Absolute path: Git's POSIX whoami in PATH rejects Windows flags.
    const whoami = join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'whoami.exe');
    const sid = command(whoami, ['/user', '/fo', 'csv', '/nh']).match(/S-1-\d+(?:-\d+)+/)?.[0];
    assert.ok(sid, 'Cannot determine backup file owner');
    command('icacls', [directory, '/inheritance:r', '/grant:r', `*${sid}:(OI)(CI)F`]);
  } else command('chmod', ['700', directory]);
  const migrations = (await readdir(join(root, 'supabase/migrations'))).filter((name) => name.endsWith('.sql')).sort();
  const last = migrations.at(-1);
  assert.ok(last, 'No migrations');
  const fixtures = [];
  let phase = 'prepare';
  const started = Date.now();
  let backupHash = null;
  let backupTime = null;
  let restoreStarted = null;
  let drillResult = null;
  let appServer = null;
  const cleanupOutcomes = [];
  try {
    for (const [index, project] of projects.entries()) {
      const workdir = join(directory, project);
      await mkdir(join(workdir, 'supabase/migrations'), { recursive: true });
      await cp(join(root, 'supabase/templates'), join(workdir, 'supabase/templates'), { recursive: true });
      let config = await readFile(join(root, 'supabase/config.toml'), 'utf8');
      config = config.replace('stockos-auth', project).replaceAll('5543', index === 0 ? '5574' : '5584');
      // Photo fixture/restore needs the storage schema; the source template ships without it.
      config = config.replace('[storage]\nenabled = false', '[storage]\nenabled = true');
      if (index === 0) for (const file of migrations.slice(0, -1)) await cp(join(root, 'supabase/migrations', file), join(workdir, 'supabase/migrations', file));
      await writeFile(join(workdir, 'supabase/config.toml'), config, { mode: 0o600 });
      // Register only new resources; cleanup inspects their project label before stopping them.
      const fixture = { project, workdir, container: `supabase_db_${project}`, createdByRun: true };
      fixtures.push(fixture);
      command(cli, ['start', '--workdir', workdir, '--exclude', 'studio,realtime,imgproxy,edge-runtime,logflare,vector,supavisor']);
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
    const beforeHash = snapshot(source, true);
    await cp(join(root, 'supabase/migrations', last), join(source.workdir, 'supabase/migrations', last));
    command(cli, ['migration', 'up', '--local', '--workdir', source.workdir]);
    phase = 'forward migration domain preservation';
    assert.equal(snapshot(source, true), beforeHash, 'Forward migration preserves domain data');
    assert.equal(sql(source, `select count(*) from supabase_migrations.schema_migrations where version='${last.split('_')[0]}'`), '1', 'Forward history recorded');
    command(cli, ['migration', 'up', '--local', '--workdir', source.workdir]);
    assert.equal(snapshot(source, true), beforeHash, 'Migration retry no-op');
    phase = 'photo fixture';
    const image = Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA', 'base64');
    const photoHash = digest(image);
    const photo = { display: { hash: photoHash, bytes: image.length, width: 1, height: 1 }, thumb: { hash: photoHash, bytes: image.length, width: 1, height: 1 } };
    for (const variant of ['display', 'thumb']) {
      good(await admin.storage.from('product-photos').upload(`products/${variant}/${photoHash}`, image, { contentType: 'image/webp', upsert: false }), 'Upload source photo');
    }
    const attached = good(await call(owner, 'update_product', { requestId: randomUUID(), productId, expectedMetadataVersion: before.data.metadataVersion, patch: { photo } }), 'Attach source photo');
    assert.equal(attached.ok, true);
    const shared = good(await call(owner, 'create_product', { ...createInput, requestId: randomUUID(), sku: 'OPS-SHARED', openingQuantity: 0, purchaseTotal: '0', photo }), 'Shared source photo');
    assert.equal(shared.ok, true);
    const photoProduct = good(await call(owner, 'get_product', { id: productId }), 'Read source photo');
    const photoSnapshot = snapshot(source);
    phase = 'rollback probe';
    const probe = probeMigration(migrations);
    const failedPath = join(source.workdir, 'supabase/migrations', probe.name);
    await writeFile(failedPath, "create table public.operations_rollback_probe(id int); select 1/0;", { mode: 0o600 });
    assert.throws(() => command(cli, ['migration', 'up', '--local', '--workdir', source.workdir]), 'Injected migration fails');
    assert.equal(sql(source, "select to_regclass('public.operations_rollback_probe') is null"), 't', 'Failed migration DDL rolls back');
    assert.equal(sql(source, `select count(*) from supabase_migrations.schema_migrations where version='${probe.version}'`), '0', 'Failed version not recorded');
    assert.equal(snapshot(source), photoSnapshot, 'Failed migration preserves data');
    phase = 'backup';
    for (const table of sql(source, "select tablename from pg_tables where schemaname='auth' and tablename in ('mfa_factors','mfa_challenges')").split('\n').filter(Boolean)) {
      assert.equal(sql(source, `select count(*) from auth.${table}`), '0', 'MFA restoration outside this password-only fixture proof');
    }
    phase = 'consistent photo snapshot';
    // Maintenance window: no app uses these fixtures; freeze source API writes across SQL and bytes capture.
    command('docker', ['pause', `supabase_auth_${source.project}`, `supabase_rest_${source.project}`]);
    const bucketConfig = JSON.parse(sql(source, "select json_build_object('id',id,'name',name,'public',public,'file_size_limit',file_size_limit,'allowed_mime_types',allowed_mime_types) from storage.buckets where id='product-photos'"));
    const photoObjects = JSON.parse(sql(source, "select json_agg(json_build_object('path',name,'sha256',split_part(name,'/',3),'bytes',(metadata->>'size')::int) order by name) from storage.objects where bucket_id='product-photos'"));
    assert.equal(photoObjects.length, 2, 'Shared photos deduplicate both variants');
    const photoContent = new Map();
    await mkdir(join(directory, 'photos'));
    for (const object of photoObjects) {
      const blob = good(await admin.storage.from('product-photos').download(object.path), 'Download snapshot photo');
      const bytes = Buffer.from(await blob.arrayBuffer());
      photoContent.set(object.path, bytes);
      await writeFile(join(directory, 'photos', `${object.path.split('/')[1]}-${object.sha256}.webp`), bytes, { mode: 0o600 });
    }
    const photoManifest = { bucket: 'product-photos', config: bucketConfig, objects: photoObjects };
    verifyPhotos(photoManifest, photoContent);
    await writeFile(join(directory, 'photos.json'), JSON.stringify(photoManifest), { mode: 0o600 });
    const storageTrigger = sql(source, "select pg_get_triggerdef(t.oid) from pg_trigger t where t.tgrelid='storage.objects'::regclass and t.tgname='guard_photo_delete' and not t.tgisinternal");
    assert.match(storageTrigger, /^CREATE TRIGGER guard_photo_delete BEFORE DELETE ON storage.objects /);
    await writeFile(join(directory, 'storage-trigger.sql'), storageTrigger + ';', { mode: 0o600 });
    const storagePolicies = sql(source, "select coalesce(jsonb_agg(to_jsonb(p) order by policyname),'[]'::jsonb) from pg_policies p where schemaname='storage' and tablename in ('objects','buckets')");
    assert.equal(storagePolicies, '[]', 'No client Storage policies in approved design');
    command('docker', ['pause', `supabase_storage_${source.project}`]);
    phase = 'consistent dump';
    const backup = join(directory, 'stockos.dump');
    const bytes = command('docker', ['exec', source.container, 'pg_dump', '-U', 'postgres', '-d', 'postgres', '-Fc', '--schema=stockos_private', '--schema=public', '--schema=auth', '--schema=supabase_migrations'], { encoding: null });
    await writeFile(backup, bytes, { mode: 0o600 });
    backupHash = digest(bytes);
    backupTime = Date.now();
    verifyBackup(await readFile(backup), backupHash);
    assert.throws(() => verifyBackup(Buffer.concat([bytes, Buffer.from('corruption')]), backupHash), 'Corrupt backup rejected before restore');
    assert.equal(command('docker', ['exec', source.container, 'postgres', '--version']), command('docker', ['exec', target.container, 'postgres', '--version']), 'Same PostgreSQL version');
    phase = 'restore preflight';
    assert.equal(sql(target, 'select count(*) from auth.users'), '0', 'Refuse populated Auth target');
    assert.equal(sql(target, "select to_regnamespace('stockos_private') is null"), 't', 'Refuse existing application target');
    assert.equal(sql(target, 'select count(*) from storage.buckets'), '0', 'Refuse existing Storage target');
    const restoredManifest = JSON.parse(await readFile(join(directory, 'photos.json'), 'utf8'));
    const restoredContent = new Map();
    // Validate paths before using any manifest field in a local filename.
    verifyPhotos(restoredManifest, photoContent);
    for (const object of restoredManifest.objects) {
      restoredContent.set(object.path, await readFile(join(directory, 'photos', `${object.path.split('/')[1]}-${object.sha256}.webp`)));
    }
    verifyPhotos(restoredManifest, restoredContent);
    assert.deepEqual(restoredManifest.config, { id: 'product-photos', name: 'product-photos', public: false, file_size_limit: 131072, allowed_mime_types: ['image/webp'] });
    assert.equal(sql(target, "select coalesce(jsonb_agg(to_jsonb(p) order by policyname),'[]'::jsonb) from pg_policies p where schemaname='storage' and tablename in ('objects','buckets')"), storagePolicies, 'Storage policy baseline matches');
    const targetAdmin = client(target, true);
    good(await targetAdmin.storage.createBucket('product-photos', { public: false, fileSizeLimit: 131072, allowedMimeTypes: ['image/webp'] }), 'Restore private bucket');
    for (const object of restoredManifest.objects) {
      good(await targetAdmin.storage.from('product-photos').upload(object.path, restoredContent.get(object.path), { contentType: 'image/webp', upsert: false }), 'Restore immutable photo');
    }
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
    command('docker', ['pause', `supabase_auth_${target.project}`, `supabase_rest_${target.project}`, `supabase_storage_${target.project}`]);
    restoreStarted = Date.now();
    command('docker', ['exec', target.container, 'pg_restore', '-U', 'supabase_admin', '-d', 'postgres', '--single-transaction', '--exit-on-error', '--use-list=/tmp/restore.list', '/tmp/stockos.dump']);
    const restoredTrigger = await readFile(join(directory, 'storage-trigger.sql'), 'utf8');
    assert.equal(restoredTrigger, storageTrigger + ';', 'Storage trigger artifact preserved');
    sql(target, restoredTrigger);
    assert.equal(snapshot(target), snapshot(source), 'Domain/owner/settings/evidence/retry restored exactly');
    assert.equal(sql(target, 'select string_agg(version,\',\' order by version) from supabase_migrations.schema_migrations'), sql(source, 'select string_agg(version,\',\' order by version) from supabase_migrations.schema_migrations'), 'Migration history restored');
    assert.equal(sql(target, 'select count(*) from auth.sessions'), sql(source, 'select count(*) from auth.sessions'), 'Session snapshot restored before quarantine');
    phase = 'JWT control before quarantine';
    const claims = JSON.parse(Buffer.from(originalSession.access_token.split('.')[1], 'base64url'));
    const jwtSql = `set local role authenticated; set local request.jwt.claims = '${JSON.stringify(claims).replaceAll("'", "''")}';`;
    assert.ok(sql(target, `begin; ${jwtSql} select stockos_owner_session(); rollback;`), 'Restored JWT claims authorize before quarantine');
    // Target has never been exposed to an app. Invalidate all restored login/token-purpose state now.
    sql(target, 'begin; delete from stockos_private.password_purposes; delete from auth.sessions; delete from auth.refresh_tokens; update auth.users set confirmation_token=\'\', recovery_token=\'\', email_change_token_new=\'\', email_change_token_current=\'\', reauthentication_token=\'\'; commit;');
    command('docker', ['unpause', `supabase_auth_${target.project}`, `supabase_rest_${target.project}`, `supabase_storage_${target.project}`]);
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
    assert.deepEqual(after, photoProduct, 'Owner sees exact restored product and photo references');
    assert.deepEqual(good(await call(restored, 'get_product', { id: shared.data.product.id }), 'Read shared restored photo').data.photo, photo);
    for (const object of restoredManifest.objects) {
      const restoredBlob = good(await targetAdmin.storage.from('product-photos').download(object.path), 'Read restored bytes');
      assert.deepEqual(Buffer.from(await restoredBlob.arrayBuffer()), restoredContent.get(object.path), 'Restored photo bytes exact');
      assert.ok((await restored.storage.from('product-photos').download(object.path)).error, 'Direct owner Storage denied');
      assert.ok((await retained.storage.from('product-photos').download(object.path)).error, 'Anonymous Storage denied');
    }
    const restoredBucket = good(await targetAdmin.storage.getBucket('product-photos'), 'Read restored bucket');
    assert.equal(restoredBucket.public, false);
    assert.equal(restoredBucket.file_size_limit, 131072);
    assert.deepEqual(restoredBucket.allowed_mime_types, ['image/webp']);
    assert.ok((await targetAdmin.storage.from('product-photos').remove(restoredManifest.objects.map(object => object.path))).error, 'Restored delete trigger protects shared references');
    phase = 'restored app photo access';
    appServer = await startPhotoApp(directory, target);
    for (let attempt = 0; ; attempt++) {
      assert.equal(appServer.exitCode, null, 'Restored app still running');
      try {
        const ready = await fetch('http://127.0.0.1:55951/api/product-photos/display/' + photoHash, { redirect: 'error', signal: AbortSignal.timeout(2000) });
        if (ready.status === 401) break;
      } catch { /* Server may still be starting. */ }
      assert.ok(attempt < 60, 'Restored app did not become ready');
      await delay(500);
    }
    const authCookies = [];
    const cookieClient = createServerClient(target.status.API_URL, target.status.ANON_KEY, { cookies: { getAll: () => [], setAll: values => authCookies.push(...values) } });
    const freshSession = (await restored.auth.getSession()).data.session;
    good(await cookieClient.auth.setSession({ access_token: freshSession.access_token, refresh_token: freshSession.refresh_token }), 'Restore app session');
    const cookie = authCookies.map(item => `${item.name}=${item.value}`).join('; ');
    for (const variant of ['display', 'thumb']) {
      const url = `http://127.0.0.1:55951/api/product-photos/${variant}/${photoHash}`;
      assert.equal((await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000) })).status, 401, 'Anonymous restored app photo denied');
      const response = await fetch(url, { headers: { Cookie: cookie }, redirect: 'error', signal: AbortSignal.timeout(30000) });
      assert.equal(response.status, 200, 'Fresh owner reads restored app photo');
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), image);
      assert.match(response.headers.get('cache-control'), /private/);
    }
    const replay = good(await call(restored, 'record_stock_in', receiptInput), 'Replay restored request');
    assert.equal(replay.replayed, true, 'Retry identity restored');
    assert.equal(good(await call(restored, 'get_product', { id: productId }), 'Read after replay').data.currentStock, 15, 'Replay cannot duplicate stock');
    assert.equal(sql(target, "select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='stockos_private' and (has_function_privilege('anon',p.oid,'EXECUTE') or has_function_privilege('authenticated',p.oid,'EXECUTE'))"), '0', 'Private function grants preserved');
    assert.equal(sql(target, "select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='stockos_private' and c.relkind='r' and (not c.relrowsecurity or has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE') or has_table_privilege('authenticated',c.oid,'SELECT,INSERT,UPDATE,DELETE'))"), '0', 'Private table RLS/grants preserved');
    drillResult = {
      backupSha256: backupHash, capturedAt: new Date(backupTime).toISOString(),
      postgresVersion: command('docker', ['exec', target.container, 'postgres', '--version']).trim(),
      migrations: migrations.length, stock: 15, inventoryCostValue: '52500.000000',
      photoObjects: restoredManifest.objects.length, photoReferences: 2, photoManifestSha256: digest(await readFile(join(directory, 'photos.json'))),
      restoreMilliseconds: Date.now() - restoreStarted, snapshotAgeMilliseconds: Date.now() - backupTime,
    };
    console.log('PASS local forward migration, independent dump/restore, owner/session/grant/retry checks');
  } catch {
    console.error(`FAIL operations phase: ${phase}; raw output suppressed. Inspect protected directory: ${directory}`);
    process.exitCode = 1;
  } finally {
    // Cleanup runs before evidence is written so evidence can never claim PASS with failed cleanup.
    if (appServer) {
      try {
        const exited = new Promise(resolve => appServer.once('exit', resolve));
        if (appServer.exitCode === null) {
          appServer.kill();
          await Promise.race([exited, delay(10000).then(() => { throw new Error('App cleanup timed out'); })]);
        }
        cleanupOutcomes.push({ project: 'restore-photo-app', status: 'PASS' });
      } catch {
        cleanupOutcomes.push({ project: 'restore-photo-app', status: 'FAIL' });
        process.exitCode = 1;
      }
    }
    for (const fixture of fixtures.reverse()) {
      try {
        inspect(fixture);
        command(cli, ['stop', '--workdir', fixture.workdir, '--no-backup']);
        cleanupOutcomes.push({ project: fixture.project, status: 'PASS' });
      } catch (cleanupError) {
        cleanupOutcomes.push({ project: fixture.project, status: 'FAIL', error: cleanupError instanceof Error ? cleanupError.message : 'unknown' });
        console.error(`Fixture cleanup incomplete: ${fixture.project}; inspect before manual cleanup`);
        process.exitCode = 1;
      }
    }
    if (drillResult) {
      const evidence = {
        status: evidenceStatus(cleanupOutcomes.every((outcome) => outcome.status === 'PASS')),
        capturedAt: drillResult.capturedAt, backupSha256: drillResult.backupSha256,
        postgresVersion: drillResult.postgresVersion, migrations: drillResult.migrations,
        stock: drillResult.stock, inventoryCostValue: drillResult.inventoryCostValue,
        photoObjects: drillResult.photoObjects, photoReferences: drillResult.photoReferences, photoManifestSha256: drillResult.photoManifestSha256,
        restoreMilliseconds: drillResult.restoreMilliseconds, snapshotAgeMilliseconds: drillResult.snapshotAgeMilliseconds,
        totalMilliseconds: Date.now() - started,
        cleanup: cleanupOutcomes,
        smtp: 'BLOCKED_NO_SEND', offHostBackup: 'NOT_PROVEN', deployment: 'NOT_AUTHORIZED',
      };
      await writeFile(join(directory, 'evidence.json'), JSON.stringify(evidence, null, 2), { mode: 0o600 });
      console.log(`Protected proof directory (sensitive dump; retain for review): ${directory}`);
      console.log(`Restore ${drillResult.restoreMilliseconds}ms; SMTP/off-host recovery/deployment remain unproven`);
    } else {
      await writeFile(join(directory, 'evidence.json'), JSON.stringify({ status: 'FAIL', phase, totalMilliseconds: Date.now() - started, cleanup: cleanupOutcomes }, null, 2), { mode: 0o600 });
      console.error(`Protected proof directory (sensitive dump; retain for review): ${directory}`);
    }
  }
}

async function startPhotoApp(directory, target) {
  inspect(target);
  await new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(55951, '127.0.0.1', () => probe.close(resolve));
  });
  const app = join(directory, 'app');
  await mkdir(app);
  await cp(join(root, 'src'), join(app, 'src'), { recursive: true });
  for (const name of ['package.json', 'tsconfig.json', 'next-env.d.ts', 'postcss.config.mjs', 'next.config.ts']) await cp(join(root, name), join(app, name));
  await symlink(join(root, 'node_modules'), join(app, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^(SUPABASE_|STOCKOS_|NEXT_PUBLIC_)/.test(key)));
  Object.assign(env, { NEXT_TELEMETRY_DISABLED: '1', SUPABASE_URL: target.status.API_URL, SUPABASE_ANON_KEY: target.status.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: target.status.SERVICE_ROLE_KEY, STOCKOS_APP_URL: 'http://127.0.0.1:55951' });
  const server = spawn(process.execPath, [join(root, 'node_modules/next/dist/bin/next'), 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', '55951'], { cwd: app, env, stdio: 'ignore' });
  server.on('error', () => { /* Readiness check fails without leaking environment/provider output. */ });
  return server;
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
function snapshot(fixture, beforePhotoMigration = false) {
  // Forward comparison ignores only new nullable photo fields; restore comparison keeps every field.
  const rows = sql(fixture, "select tablename from pg_tables where schemaname='stockos_private' and tablename not in ('auth_throttle','password_purposes') order by tablename").split('\n');
  return digest(rows.map((table) => {
    const row = beforePhotoMigration && table === 'products'
      ? "to_jsonb(t) - array['photo_display_hash','photo_display_bytes','photo_display_width','photo_display_height','photo_thumb_hash','photo_thumb_bytes','photo_thumb_width','photo_thumb_height']"
      : 'to_jsonb(t)';
    return sql(fixture, `select coalesce(jsonb_agg(${row} order by (${row})::text),'[]'::jsonb) from stockos_private.${table} t`);
  }).join('\n'));
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
