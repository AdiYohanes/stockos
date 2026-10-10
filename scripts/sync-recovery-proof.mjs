// Run: node scripts/sync-recovery-proof.mjs <fixture-directory>. Forward migrations only; no reset.
import assert from 'node:assert/strict';
import { cp, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const directory = resolve(process.argv[2]);
let config = await readFile(join(directory, 'supabase/config.toml'), 'utf8');
assert.ok(config.includes('project_id = "stockos-recovery-proof"') && config.includes('port = 55641'));
const [inspection] = JSON.parse(execFileSync('docker', ['inspect', 'supabase_db_stockos-recovery-proof'], { encoding: 'utf8' }));
assert.equal(inspection.Config.Labels['com.supabase.cli.project'], 'stockos-recovery-proof');
await cp(join(root, 'supabase/migrations'), join(directory, 'supabase/migrations'), { recursive: true });
await cp(join(root, 'supabase/templates'), join(directory, 'supabase/templates'), { recursive: true });
if (!config.includes('[auth.email.template.recovery]')) {
  config = config.replace('[auth.rate_limit]', '[auth.email.template.recovery]\nsubject = "StockOS recovery"\ncontent_path = "./supabase/templates/recovery.html"\n\n[auth.rate_limit]');
  await writeFile(join(directory, 'supabase/config.toml'), config);
}
const cli = join(root, 'node_modules/@supabase/cli-windows-x64/bin/supabase.exe');
try {
  execFileSync(cli, ['migration', 'up', '--local', '--workdir', directory], { stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000 });
  // Template configuration is read at provider startup. Only restart the captured disposable project.
  execFileSync(cli, ['stop', '--workdir', directory], { stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000 });
  execFileSync(cli, ['start', '--workdir', directory, '--exclude', 'studio,realtime,storage-api,imgproxy,edge-runtime,logflare,vector,supavisor'], { stdio: ['ignore', 'pipe', 'pipe'], timeout: 300000 });
  console.log('PASS: disposable recovery fixture forward migration and template sync');
} catch { console.error('Recovery fixture migration/restart failed (provider output suppressed)'); process.exitCode = 1; }
