"""Process-only local proof launcher for reports; no env-file writes."""
import json
import os
import secrets
import shutil
import subprocess
import tempfile
from pathlib import Path

root = Path("C:/Users/USER/Documents/ai-native/stockos")
status = json.loads(Path("C:/Users/USER/AppData/Local/Temp/stockos-stock-proof/status.json").read_text(encoding="utf-8-sig"))
assert status["API_URL"] == "http://127.0.0.1:55541"
assert status["DB_URL"] == "postgresql://postgres:postgres@127.0.0.1:55542/postgres"
env = dict(os.environ, SUPABASE_URL=status["API_URL"], SUPABASE_ANON_KEY=status["ANON_KEY"],
           SUPABASE_SERVICE_ROLE_KEY=status["SERVICE_ROLE_KEY"], STOCKOS_APP_URL="http://localhost:3002",
           STOCKOS_SETUP_SECRET=secrets.token_urlsafe(48), NEXT_TELEMETRY_DISABLED="1")
scratch = Path(tempfile.mkdtemp(prefix="stockos-reports-browser-"))
for name in ("src", "public"):
    shutil.copytree(root / name, scratch / name)
for name in ("package.json", "tsconfig.json", "postcss.config.mjs"):
    shutil.copy2(root / name, scratch / name)
(scratch / "next.config.js").write_text("module.exports = {distDir: '.next-reports-proof'};\n")
result = subprocess.run(["cmd", "/c", "mklink", "/J", str(scratch / "node_modules"), str(root / "node_modules")], capture_output=True)
assert result.returncode == 0, "Proof dependency junction failed"
print(f"Proof snapshot: {scratch}", flush=True)
raise SystemExit(subprocess.call(["node", str(root / "node_modules/next/dist/bin/next"), "dev", "--webpack", "--port", "3002"], env=env, cwd=str(scratch)))
