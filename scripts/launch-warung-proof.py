"""python -I scripts/launch-warung-proof.py [--reset]
Launch local Next.js test environment for authentic Warung catalog and wording verification.
Spins up at http://localhost:3002 connected to isolated Supabase test fixture (port 55541/55542).
"""
import json
import os
import re
import secrets
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path("C:/Users/USER/Documents/ai-native/stockos")
STATUS_PATH = Path("C:/Users/USER/AppData/Local/Temp/stockos-stock-proof/status.json")
assert STATUS_PATH.exists(), f"Status file {STATUS_PATH} not found"
STATUS = json.loads(STATUS_PATH.read_text(encoding="utf-8-sig"))
assert STATUS["API_URL"] == "http://127.0.0.1:55541", "Refuse non-fixture API"
assert STATUS["DB_URL"] == "postgresql://postgres:postgres@127.0.0.1:55542/postgres", "Refuse non-fixture DB"

CONTAINER = "supabase_db_stockos-stock-proof"
EMAIL = "warung-owner@stockos.test"
PASSWORD = "Warung-Proof-2026!"
SHOP = "Warung Berkah Kelontong"


def docker(*args):
    res = subprocess.run(["docker", *args], capture_output=True, text=True, timeout=30)
    assert res.returncode == 0, f"Docker failed: {res.stderr}"
    return res.stdout.strip()


def sql(statement):
    return docker("exec", CONTAINER, "psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres", "-c", statement)


def ensure_migrations():
    migrations_dir = ROOT / "supabase/migrations"
    for sql_file in sorted(migrations_dir.glob("*.sql")):
        ver = sql_file.name[:14]
        applied = sql(f"SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '{ver}';")
        if applied != "1":
            print(f"Applying migration {sql_file.name}...")
            content = sql_file.read_text(encoding="utf-8")
            res = subprocess.run(
                ["docker", "exec", "-i", CONTAINER, "psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres"],
                input=content,
                text=True,
                capture_output=True,
            )
            assert res.returncode == 0, f"Failed migration {sql_file.name}: {res.stderr}"
            sql(f"INSERT INTO supabase_migrations.schema_migrations(version) VALUES('{ver}');")
    sql("NOTIFY pgrst, 'reload schema';")


def http_req(path, body=None, token=None, admin=False, method="POST"):
    key = STATUS["SERVICE_ROLE_KEY"] if admin else STATUS["ANON_KEY"]
    req = Request(
        STATUS["API_URL"] + path,
        method=method,
        data=None if body is None else json.dumps(body).encode(),
        headers={
            "apikey": key,
            "Authorization": f"Bearer {token or key}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urlopen(req, timeout=20) as response:
            text = response.read()
            return json.loads(text) if text else None
    except HTTPError as err:
        body_text = err.read().decode(errors="replace")
        raise AssertionError(f"HTTP request to {path} failed ({err.code}): {body_text}") from None


def prepare_data():
    ensure_migrations()
    owner_state = sql("SELECT state FROM stockos_private.owner_registration WHERE id = 1;")
    prod_count = int(sql("SELECT count(*) FROM stockos_private.products;"))
    need_reset = "--reset" in sys.argv or owner_state != "claimed" or prod_count != 18

    if need_reset:
        print("[1/2] Resetting and provisioning owner & 18 warung catalog products...")
        sql("""BEGIN;
          LOCK TABLE stockos_private.owner_registration, stockos_private.shop_settings IN EXCLUSIVE MODE;
          DELETE FROM stockos_private.inventory_events;
          DELETE FROM stockos_private.administrative_events;
          DELETE FROM stockos_private.products;
          DELETE FROM stockos_private.mutation_requests;
          DELETE FROM stockos_private.shop_settings;
          UPDATE stockos_private.owner_registration SET state = 'unclaimed', attempt_id = NULL,
            email = NULL, auth_user_id = NULL, provisioned_at = NULL, bound_at = NULL, updated_at = now() WHERE id = 1;
          DELETE FROM auth.users;
        COMMIT;""")

        claim = http_req(
            "/rest/v1/rpc/stockos_claim_owner",
            {"p_email": EMAIL, "p_name": "Ibu Maryam", "p_shop": SHOP, "p_timezone": "Asia/Jakarta"},
            admin=True,
        )
        attempt_id = claim["attemptId"]
        invitation = http_req("/auth/v1/invite", {"email": EMAIL, "data": {"stockos_attempt_id": attempt_id}}, admin=True)
        http_req("/rest/v1/rpc/stockos_reconcile_owner", {"p_attempt": attempt_id}, admin=True)

        token_hash = None
        for _ in range(40):
            with urlopen("http://127.0.0.1:55544/api/v1/messages", timeout=5) as resp:
                messages = json.load(resp)["messages"]
            for msg in messages:
                if any(rcpt["Address"] == EMAIL for rcpt in msg["To"]):
                    with urlopen(f"http://127.0.0.1:55544/api/v1/message/{msg['ID']}", timeout=5) as mresp:
                        match = re.search(r"token_hash=([a-f0-9]+)", json.load(mresp)["HTML"])
                    if match:
                        token_hash = match[1]
                        break
            if token_hash:
                break
            time.sleep(0.25)
        assert token_hash, "Invitation token not found in Mailpit"

        verified = http_req("/auth/v1/verify", {"token_hash": token_hash, "type": "invite"})
        http_req("/auth/v1/user", {"password": PASSWORD}, verified["access_token"], method="PUT")
        http_req("/auth/v1/logout?scope=local", token=verified["access_token"])

        login_res = http_req("/auth/v1/token?grant_type=password", {"email": EMAIL, "password": PASSWORD})
        access_token = login_res["access_token"]

        seed_res = subprocess.run(
            ["node", str(ROOT / "scripts/seed-warung-catalog.mjs"), str(STATUS_PATH), access_token],
            capture_output=True,
            text=True,
            timeout=60,
        )
        assert seed_res.returncode == 0, f"Seed failed: {seed_res.stderr}"
        print("      Provisioned owner and 18 products successfully.")
    else:
        print("[1/2] Existing claimed owner and 18 warung catalog products retained.")


def launch_server():
    print("[2/2] Starting Next.js test environment on http://localhost:3002...")
    env = dict(
        os.environ,
        SUPABASE_URL=STATUS["API_URL"],
        SUPABASE_ANON_KEY=STATUS["ANON_KEY"],
        SUPABASE_SERVICE_ROLE_KEY=STATUS["SERVICE_ROLE_KEY"],
        STOCKOS_APP_URL="http://localhost:3002",
        STOCKOS_SETUP_SECRET=secrets.token_urlsafe(48),
        NEXT_TELEMETRY_DISABLED="1",
    )
    scratch = Path(tempfile.mkdtemp(prefix="stockos-warung-env-"))
    for name in ("src", "public"):
        shutil.copytree(ROOT / name, scratch / name)
    for name in ("package.json", "tsconfig.json", "postcss.config.mjs"):
        shutil.copy2(ROOT / name, scratch / name)
    (scratch / "next.config.js").write_text("module.exports = {distDir: '.next-warung-env'};\n")
    res = subprocess.run(["cmd", "/c", "mklink", "/J", str(scratch / "node_modules"), str(ROOT / "node_modules")], capture_output=True)
    assert res.returncode == 0, "Junction failed"

    print("\n" + "=" * 60)
    print("STOCKOS WARUNG LOCAL TEST ENVIRONMENT READY")
    print("=" * 60)
    print(f"URL:      http://localhost:3002/login")
    print(f"Email:    {EMAIL}")
    print(f"Password: {PASSWORD}")
    print(f"Toko:     {SHOP}")
    print("Catalog:  18 authentic Indonesian warung products")
    print("          (Indomie, Beras Ramos, Minyak Bimoli, Teh Celup SariWangi, etc.)")
    print("Press Ctrl+C to terminate server.")
    print("=" * 60 + "\n")

    raise SystemExit(subprocess.call(["node", str(ROOT / "node_modules/next/dist/bin/next"), "dev", "--webpack", "--port", "3002"], env=env, cwd=str(scratch)))


if __name__ == "__main__":
    prepare_data()
    launch_server()
