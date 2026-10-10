// Run: node scripts/setup-recovery-proof.mjs. Creates a NEW disposable local fixture; never resets existing resources.
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, cp } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const existing = execFileSync('docker', ['ps', '-a', '--format', '{{.Names}}'], { encoding: 'utf8' });
assert.ok(!existing.includes('stockos-recovery-proof'), 'Recovery fixture already exists; inspect before reuse');
const directory = await mkdtemp(join(tmpdir(), 'stockos-recovery-proof-'));
await mkdir(join(directory, 'supabase'));
await cp(join(root, 'supabase', 'migrations'), join(directory, 'supabase', 'migrations'), { recursive: true });
await cp(join(root, 'supabase', 'templates'), join(directory, 'supabase', 'templates'), { recursive: true });
let config = await readFile(join(root, 'supabase', 'config.toml'), 'utf8');
config = config.replace('stockos-auth', 'stockos-recovery-proof').replaceAll('5543', '5564').replaceAll('localhost:3000', 'localhost:3004');
await writeFile(join(directory, 'supabase', 'config.toml'), config);
const cli = join(root, 'node_modules', '@supabase', 'cli-windows-x64', 'bin', 'supabase.exe');
try {
  execFileSync(cli, ['start', '--workdir', directory, '--exclude', 'studio,realtime,storage-api,imgproxy,edge-runtime,logflare,vector,supavisor'], { stdio: ['ignore', 'pipe', 'pipe'], timeout: 300000 });
  const output = execFileSync(cli, ['status', '--workdir', directory, '-o', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const status = JSON.parse(output);
  assert.equal(status.API_URL, 'http://127.0.0.1:55641');
  status.MAILPIT_URL = 'http://127.0.0.1:55644';
  await writeFile(join(directory, 'status.json'), JSON.stringify(status));
  console.log(`Recovery fixture directory: ${directory}`);
} catch {
  console.error(`Fixture creation failed; inspect ${directory}. Provider output suppressed to protect local keys.`);
  process.exitCode = 1;
}
