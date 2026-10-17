// Run: node scripts/launch-recovery-proof.mjs <fixture status.json>. Process-only env; existing .env.local untouched.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { resolve, join } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const status = JSON.parse(await readFile(process.argv[2], 'utf8'));
assert.equal(status.API_URL, 'http://127.0.0.1:55641');
const child = spawn(process.execPath, [join(root, 'node_modules/next/dist/bin/next'), 'dev', '--webpack', '--port', '3004'], {
  cwd: root, stdio: 'inherit', env: { ...process.env, SUPABASE_URL: status.API_URL,
    SUPABASE_ANON_KEY: status.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
    STOCKOS_APP_URL: 'http://localhost:3004', STOCKOS_SETUP_SECRET: randomBytes(48).toString('hex'), NEXT_TELEMETRY_DISABLED: '1' },
});
child.on('exit', (code) => { process.exitCode = code ?? 1; });
process.on('SIGTERM', () => child.kill());
process.on('SIGINT', () => child.kill());
