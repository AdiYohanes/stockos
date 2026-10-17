"""python -I scripts/launch-hardening-proof.py --self-test | --run [--baseline-dir DIR] [--only SUITE]
Fresh synthetic local fixtures only; never reuse/reset retained resources. Provider output stays private.
"""
import argparse
import hashlib
import json
import os
import re
import runpy
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import uuid
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener, urlopen
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
RAW_RUN = subprocess.run
SUITES = {
    "auth": ("check-owner-auth.mjs", []),
    "stock": ("check-stock-foundation.mjs", []),
    "recovery": ("check-owner-recovery.mjs", []),
    "reports-contract": ("check-reports-contract.mjs", []),
    "products": ("test-products.py", []),
    "defaults": ("test-products.py", ["--defaults"]),
    "lifecycle": ("test-products.py", ["--lifecycle"]),
    "inventory": ("test-inventory.py", ["--hardening"]),
    "reports": ("test-reports.py", []),
    "settings": ("test-settings.py", []),
    "hydration": ("test-hydration.py", []),
}
EXCLUDED = "studio,realtime,storage-api,imgproxy,edge-runtime,logflare,vector,supavisor"
BASELINE_LAST = "20261010050000"
COMMAND_LOG = None


def command(args, *, cwd=ROOT, env=None, timeout=300, input=None):
    result = RAW_RUN(args, cwd=str(cwd), env=env, input=input,
                            capture_output=True, text=True, timeout=timeout)
    if COMMAND_LOG:
        with COMMAND_LOG.open("a", encoding="utf-8") as log:
            log.write(f"\nCOMMAND {Path(str(args[0])).name} exit={result.returncode}\n")
            log.write(result.stdout + "\n" + result.stderr)
    if result.returncode:
        raise RuntimeError("Local proof command failed; raw output retained privately")
    return result.stdout.strip()


def protect(directory):
    if os.name == "nt":
        sid = re.search(r"S-1-\d+(?:-\d+)+", command(["whoami", "/user", "/fo", "csv", "/nh"]))
        assert sid, "Cannot determine file owner"
        command(["icacls", str(directory), "/inheritance:r", "/grant:r", f"*{sid[0]}:(OI)(CI)F"])
    else:
        directory.chmod(0o700)


def cli():
    candidates = [ROOT / "node_modules/@supabase/cli-windows-x64/bin/supabase.exe",
                  ROOT / "node_modules/.bin/supabase"]
    binary = next((path for path in candidates if path.is_file()), None)
    assert binary, "Installed Supabase CLI missing"
    return str(binary)


def listen_check(ports):
    for port in ports:
        with socket.socket() as probe:
            probe.settimeout(0.1)
            if probe.connect_ex(("127.0.0.1", port)) == 0:
                raise OSError(f"Port {port} already accepts TCP connections")
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", port))


def fixture_ports(excluded=()):
    for base in range(54000, 59000, 10):
        ports = (base + 1, base + 2, base + 4, base, base + 3)
        if set(ports).intersection(excluded):
            continue
        try:
            listen_check(ports)
        except OSError:
            continue
        return ports
    raise RuntimeError("No available local fixture port block")


def resource_names(project):
    names = command(["docker", "ps", "-a", "--format", "{{.Names}}"])
    volumes = command(["docker", "volume", "ls", "--format", "{{.Name}}"])
    return [name for name in (names + "\n" + volumes).splitlines() if name.endswith("_" + project)]


def volume_identity(project):
    names = command(["docker", "volume", "ls", "--format", "{{.Name}}"])
    owned = [name for name in names.splitlines() if name.endswith("_" + project)]
    return {name: json.loads(command(["docker", "volume", "inspect", name]))[0] for name in owned}


def guard(manifest, *, cleanup=False):
    assert re.fullmatch(r"stockos-hardening-[a-f0-9]{12}-(upgrade|clean)", manifest["project"]), "Unknown project"
    assert manifest["createdByRun"] is True, "Refuse retained resource"
    assert manifest["api"] == f"http://127.0.0.1:{manifest['apiPort']}", "Nonfixture API"
    assert manifest["db"] == f"postgresql://postgres:postgres@127.0.0.1:{manifest['dbPort']}/postgres", "Nonfixture DB"
    assert manifest["containers"], "No captured resource identity"
    assert volume_identity(manifest["project"]) == manifest["volumes"], "Volume identity changed"
    names = command(["docker", "ps", "-a", "--filter", "label=com.supabase.cli.project=" + manifest["project"], "--format", "{{.Names}}"])
    assert set(names.splitlines()) == set(manifest["containers"]), "Unexpected project container"
    for name, expected in manifest["containers"].items():
        item = json.loads(command(["docker", "inspect", name]))[0]
        assert item["Id"] == expected, "Resource replaced since creation"
        assert item["Name"] == "/" + name, "Container name mismatch"
        assert item["Config"]["Labels"].get("com.supabase.cli.project") == manifest["project"], "Project label mismatch"
        if not cleanup:
            assert item["State"]["Running"] is True, "Fixture stopped unexpectedly"
        if name == "supabase_db_" + manifest["project"]:
            bindings = item["HostConfig"]["PortBindings"]["5432/tcp"] if cleanup else item["NetworkSettings"]["Ports"].get("5432/tcp")
            assert any(binding["HostPort"] == str(manifest["dbPort"]) for binding in (bindings or [])), "DB port mismatch"


def sql(manifest, statement):
    guard(manifest)
    return command(["docker", "exec", "supabase_db_" + manifest["project"], "psql", "-X", "-qAt",
                    "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres", "-c", statement])


def empty(manifest):
    snapshot = json.loads(sql(manifest, """select json_build_object(
      'registration',(select state from stockos_private.owner_registration where id=1),
      'users',(select count(*) from auth.users), 'shops',(select count(*) from stockos_private.shop_settings),
      'products',(select count(*) from stockos_private.products), 'requests',(select count(*) from stockos_private.mutation_requests),
      'events',(select count(*) from stockos_private.inventory_events), 'admin',(select count(*) from stockos_private.administrative_events))"""))
    assert snapshot.pop("registration") == "unclaimed", "Refuse bound fixture between suites"
    assert all(count == 0 for count in snapshot.values()), "Refuse uncaptured fixture records"


def native_grants(manifest):
    assert sql(manifest, """select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='stockos_private' and (has_function_privilege('anon',p.oid,'EXECUTE')
      or has_function_privilege('authenticated',p.oid,'EXECUTE'))""") == "0", "Private function grant leak"
    assert sql(manifest, """select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='stockos_private' and c.relkind='r' and (not c.relrowsecurity
      or has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE')
      or has_table_privilege('authenticated',c.oid,'SELECT,INSERT,UPDATE,DELETE'))""") == "0", "Private table grant/RLS leak"


def snapshot_hash(manifest):
    tables = sql(manifest, "select tablename from pg_tables where schemaname='stockos_private' and tablename not in ('auth_throttle','password_purposes') order by tablename").splitlines()
    contents = []
    for table in tables:
        assert re.fullmatch(r"[a-z_]+", table)
        contents.append(sql(manifest, f"select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from stockos_private.{table} t"))
    return hashlib.sha256("\n".join(contents).encode()).hexdigest()


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, *_args):
        raise RuntimeError("Fixture provider redirect refused")


def fixture_urlopen(request, *, timeout):
    return build_opener(NoRedirect).open(request, timeout=timeout)


def http(manifest, path, body, *, token=None, admin=False):
    guard(manifest)
    status = manifest["status"]
    key = status["SERVICE_ROLE_KEY"] if admin else status["ANON_KEY"]
    request = Request(manifest["api"] + path, method="POST", data=json.dumps(body).encode(),
                      headers={"apikey": key, "Authorization": "Bearer " + (token or key), "Content-Type": "application/json"})
    try:
        with fixture_urlopen(request, timeout=20) as response:
            data = response.read()
            return json.loads(data) if data else None
    except HTTPError:
        raise RuntimeError("Fixture provider rejected request; response suppressed") from None


def seed_upgrade(manifest):
    empty(manifest)
    email, password = f"hardening-{uuid.uuid4()}@example.test", f"Local-proof-{uuid.uuid4()}!"
    claim = http(manifest, "/rest/v1/rpc/stockos_claim_owner", {"p_email": email, "p_name": "Hardening proof", "p_shop": "Hardening proof", "p_timezone": "Asia/Jakarta"}, admin=True)
    http(manifest, "/auth/v1/invite", {"email": email, "data": {"stockos_attempt_id": claim["attemptId"]}}, admin=True)
    http(manifest, "/rest/v1/rpc/stockos_reconcile_owner", {"p_attempt": claim["attemptId"]}, admin=True)
    token_hash = None
    inbox = f"http://127.0.0.1:{manifest['mailPort']}"
    for _ in range(60):
        with urlopen(inbox + "/api/v1/messages", timeout=5) as response:
            messages = json.load(response)["messages"]
        for message in messages:
            if not any(recipient["Address"] == email for recipient in message["To"]):
                continue
            with urlopen(inbox + "/api/v1/message/" + message["ID"], timeout=5) as response:
                match = re.search(r"token_hash=([a-f0-9]+)", json.load(response)["HTML"])
            if match:
                token_hash = match[1]
                break
        if token_hash:
            break
        time.sleep(0.25)
    assert token_hash, "Local invitation missing"
    invite = http(manifest, "/auth/v1/verify", {"token_hash": token_hash, "type": "invite"})
    status = manifest["status"]
    request = Request(manifest["api"] + "/auth/v1/user", method="PUT", data=json.dumps({"password": password}).encode(),
                      headers={"apikey": status["ANON_KEY"], "Authorization": "Bearer " + invite["access_token"], "Content-Type": "application/json"})
    try:
        guard_write(manifest, request.full_url, request.get_method())
        with fixture_urlopen(request, timeout=20):
            pass
    except HTTPError:
        raise RuntimeError("Fixture password setup rejected; response suppressed") from None
    owner = http(manifest, "/auth/v1/token?grant_type=password", {"email": email, "password": password})["access_token"]
    def rpc(name, payload):
        result = http(manifest, "/rest/v1/rpc/stockos_" + name, {"p_input": payload}, token=owner)
        assert result.get("ok") is True, "Seed RPC rejected"
        return result
    creation = rpc("create_product", {"requestId": str(uuid.uuid4()), "sku": "HARDENING-UPGRADE", "name": "Beras uji", "category": "Sembako", "unit": "Pcs", "sellingPrice": "5000", "minStock": 2, "openingQuantity": 10, "purchaseTotal": "30000"})
    product_id = creation["data"]["product"]["id"]
    receipt = {"requestId": str(uuid.uuid4()), "productId": product_id, "quantity": 10, "purchaseTotal": "40000"}
    rpc("record_stock_in", receipt)
    rpc("record_stock_out", {"requestId": str(uuid.uuid4()), "productId": product_id, "quantity": 5})
    before = rpc("get_product", {"id": product_id})
    assert before["data"]["currentStock"] == 15 and before["data"]["inventoryCostValue"] == "52500.000000"
    return rpc, receipt, before


def prepare_fixture(directory, suffix, ports, migrations, fixtures):
    project = f"stockos-hardening-{uuid.uuid4().hex[:12]}-{suffix}"
    assert not resource_names(project), "Refuse existing project containers/volumes"
    listen_check(ports)
    workdir = directory / project
    (workdir / "supabase/migrations").mkdir(parents=True)
    shutil.copytree(ROOT / "supabase/templates", workdir / "supabase/templates")
    config = (ROOT / "supabase/config.toml").read_text(encoding="utf-8").replace('"stockos-auth"', json.dumps(project))
    for old, new in zip((55431, 55432, 55434, 55430, 55433), ports):
        config = config.replace(f"port = {old}", f"port = {new}")
    config = config.replace("http://localhost:3000", "http://localhost:3012")
    (workdir / "supabase/config.toml").write_text(config, encoding="utf-8")
    manifest = {"project": project, "workdir": str(workdir), "apiPort": ports[0], "dbPort": ports[1], "mailPort": ports[2],
                "api": f"http://127.0.0.1:{ports[0]}", "db": f"postgresql://postgres:postgres@127.0.0.1:{ports[1]}/postgres",
                "createdByRun": True, "containers": {}}
    (workdir / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
    fixtures.append(manifest)
    try:
        command([cli(), "start", "--workdir", str(workdir), "--exclude", EXCLUDED])
    finally:
        names = command(["docker", "ps", "-a", "--filter", "label=com.supabase.cli.project=" + project, "--format", "{{.Names}}"])
        for name in names.splitlines():
            item = json.loads(command(["docker", "inspect", name]))[0]
            assert item["Config"]["Labels"].get("com.supabase.cli.project") == project
            manifest["containers"][name] = item["Id"]
        manifest["volumes"] = volume_identity(project)
        (workdir / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
    manifest["status"] = json.loads(command([cli(), "status", "--workdir", str(workdir), "-o", "json"]))
    assert manifest["status"]["API_URL"] == manifest["api"]
    assert manifest["status"]["DB_URL"] == manifest["db"]
    guard(manifest)
    (workdir / "status.json").write_text(json.dumps(manifest["status"]), encoding="utf-8")
    for migration in migrations:
        shutil.copy2(migration, workdir / "supabase/migrations" / migration.name)
    guard(manifest)
    command([cli(), "migration", "up", "--local", "--workdir", str(workdir)])
    return manifest


def fixture_replacements(manifest, source):
    for old in ("55431", "55541", "55641"):
        source = source.replace(old, str(manifest["apiPort"]))
    for old in ("55432", "55542", "55642"):
        source = source.replace(old, str(manifest["dbPort"]))
    for old in ("55434", "55544", "55644"):
        source = source.replace(old, str(manifest["mailPort"]))
    for old in ("stockos-recovery-proof", "stockos-stock-proof", "stockos-auth"):
        source = source.replace(old, manifest["project"])
    return source.replace("localhost:3002", "localhost:3012").replace("localhost:3004", "localhost:3012")


def guard_write(manifest, url, method):
    if method.upper() in ("GET", "HEAD", "OPTIONS"):
        return
    target = urlsplit(url)
    allowed = {manifest["api"], "http://localhost:3012", "http://127.0.0.1:3012"}
    assert target.scheme == "http" and not target.username and not target.password, "Unsafe write URL"
    assert f"{target.scheme}://{target.netloc}" in allowed, "Write outside owned fixture/app"
    guard(manifest)


def guarded_api_request(manifest, send, context, url, method, **kwargs):
    target = url if isinstance(url, str) else url.url
    method = kwargs.get("method") or method
    guard_write(manifest, target, method)
    kwargs["max_redirects"] = 0
    kwargs["max_retries"] = 0
    response = send(context, url, **kwargs)
    if method.upper() not in ("GET", "HEAD", "OPTIONS"):
        assert not 300 <= response.status < 400, "API write redirect refused"
    return response


def execute_suite(manifest_path, suite_name):
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    guard(manifest)
    empty(manifest)
    filename, extra = SUITES[suite_name]
    original = ROOT / "scripts" / filename
    assert original.is_file(), "Required suite missing"
    source = fixture_replacements(manifest, original.read_text(encoding="utf-8-sig"))
    status_path = str(Path(manifest["workdir"]) / "status.json")
    if filename.endswith(".py"):
        raw_run = subprocess.run
        raw_run_path = runpy.run_path
        raw_urlopen = urllib.request.urlopen
        raw_redirect = HTTPRedirectHandler.redirect_request
        from playwright.sync_api import APIRequestContext, Browser, Route
        api_methods = {name: getattr(APIRequestContext, name) for name in ("fetch", "get", "head", "post", "put", "patch", "delete")}
        def pin_api(send, method):
            def pinned(context, url, **kwargs):
                request_method = method or ("GET" if isinstance(url, str) else url.method)
                return guarded_api_request(manifest, send, context, url, request_method, **kwargs)
            return pinned
        for name, send in api_methods.items():
            setattr(APIRequestContext, name, pin_api(send, None if name == "fetch" else name.upper()))
        raw_context = Browser.new_context
        raw_continue = Route.continue_
        raw_fetch = Route.fetch
        def pinned_urlopen(url, data=None, *positional, **kwargs):
            request = url if isinstance(url, Request) else Request(url, data=data)
            guard_write(manifest, request.full_url, request.get_method())
            return raw_urlopen(url, data, *positional, **kwargs)
        def pinned_redirect(handler, request, fp, code, msg, headers, newurl):
            # Fail closed before urllib can silently replay credentials/writes elsewhere.
            if request.get_method().upper() not in ("GET", "HEAD", "OPTIONS"):
                raise RuntimeError("Fixture write redirect refused")
            return raw_redirect(handler, request, fp, code, msg, headers, newurl)
        def pinned_fetch(route, **kwargs):
            guard_write(manifest, kwargs.get("url") or route.request.url, kwargs.get("method") or route.request.method)
            kwargs["max_redirects"] = 0
            response = raw_fetch(route, **kwargs)
            if (kwargs.get("method") or route.request.method).upper() not in ("GET", "HEAD", "OPTIONS"):
                assert response.status not in (307, 308), "Browser write replay redirect refused"
                if 300 <= response.status < 400:
                    from urllib.parse import urljoin
                    guard_write(manifest, urljoin(route.request.url, response.headers.get("location", "")), kwargs.get("method") or route.request.method)
            return response
        def pinned_continue(route, **kwargs):
            method = kwargs.get("method") or route.request.method
            if method.upper() in ("GET", "HEAD", "OPTIONS"):
                return raw_continue(route, **kwargs)
            # Page routes can bypass context routes with continue_; intercept that path too.
            response = pinned_fetch(route, **kwargs)
            assert response.status not in (307, 308), "Browser write replay redirect refused"
            if 300 <= response.status < 400:
                from urllib.parse import urljoin
                guard_write(manifest, urljoin(route.request.url, response.headers.get("location", "")), method)
            return route.fulfill(response=response)
        def pinned_context(browser, **kwargs):
            kwargs["service_workers"] = "block"
            context = raw_context(browser, **kwargs)
            context.route("**/*", lambda route: route.continue_())
            return context
        urllib.request.urlopen = pinned_urlopen
        HTTPRedirectHandler.redirect_request = pinned_redirect
        Browser.new_context = pinned_context
        Route.continue_ = pinned_continue
        Route.fetch = pinned_fetch
        def adapted_run_path(path, init_globals=None, run_name=None):
            path = Path(path).resolve()
            assert path.parent == ROOT / "scripts", "Imported harness outside repository scripts"
            assert path.name in {entry[0] for entry in SUITES.values()}, "Imported harness not allowlisted"
            globals_dict = dict(init_globals or {}, __name__=run_name or "<run_path>", __file__=str(path))
            harness = fixture_replacements(manifest, path.read_text(encoding="utf-8-sig"))
            exec(compile(harness, str(path), "exec"), globals_dict)
            return globals_dict
        runpy.run_path = adapted_run_path
        def pinned_run(args, *positional, **kwargs):
            if isinstance(args, (list, tuple)) and str(args[0]).lower() in ("docker", "docker.exe"):
                guard(manifest)
                if len(args) > 2 and args[1] in ("exec", "pause", "unpause", "stop", "kill", "rm", "cp"):
                    target = next((str(arg) for arg in args[2:] if str(arg) in manifest["containers"]), None)
                    assert target, "Docker mutation must target captured fixture"
            return raw_run(args, *positional, **kwargs)
        subprocess.run = pinned_run
        try:
            sys.argv = [str(original), "http://localhost:3012", status_path, *extra]
            exec(compile(source, str(original), "exec"), {"__name__": "__main__", "__file__": str(original)})
        finally:
            subprocess.run = raw_run
            runpy.run_path = raw_run_path
            urllib.request.urlopen = raw_urlopen
            HTTPRedirectHandler.redirect_request = raw_redirect
            Browser.new_context = raw_context
            Route.continue_ = raw_continue
            Route.fetch = raw_fetch
            for name, send in api_methods.items():
                setattr(APIRequestContext, name, send)
    else:
        # Trusted repository scripts keep their original strict fixture assertions; substitutions only change owned identity/ports.
        source = source.replace("import { execFileSync } from", "import { execFileSync as rawExecFileSync } from")
        if "rawExecFileSync" not in source:
            source = "import { execFileSync as rawExecFileSync } from 'node:child_process';\n" + source
        if "rawExecFileSync" in source:
            guard_js = """
const fixture = JSON.parse(rawExecFileSync(process.env.STOCKOS_PROOF_PYTHON, ['-I', process.env.STOCKOS_PROOF_RUNNER, '--inspect', process.env.STOCKOS_PROOF_MANIFEST], {encoding:'utf8'}));
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const request = new Request(input, init);
  if (!['GET','HEAD','OPTIONS'].includes(request.method.toUpperCase())) {
    if (![fixture.api,'http://localhost:3012','http://127.0.0.1:3012'].includes(new URL(request.url).origin)) throw new Error('Write outside owned fixture/app');
    rawExecFileSync(process.env.STOCKOS_PROOF_PYTHON, ['-I', process.env.STOCKOS_PROOF_RUNNER, '--inspect', process.env.STOCKOS_PROOF_MANIFEST], {stdio:'pipe'});
  }
  return originalFetch(request, {redirect:'error'});
};
function execFileSync(binary, args, options) {
  if (binary === 'docker') {
    rawExecFileSync(process.env.STOCKOS_PROOF_PYTHON, ['-I', process.env.STOCKOS_PROOF_RUNNER, '--inspect', process.env.STOCKOS_PROOF_MANIFEST], {stdio:'pipe'});
    if (['exec','pause','unpause','stop','kill','rm','cp'].includes(args[0]) && !args.some(arg => Object.hasOwn(fixture.containers, arg))) throw new Error('Docker mutation target not captured');
  }
  return rawExecFileSync(binary,args,options);
}
"""
            imports = list(re.finditer(r"^import[^;]+;", source, re.MULTILINE))
            insert = imports[-1].end()
            source = source[:insert] + guard_js + source[insert:]
        adapted = ROOT / "scripts" / (".hardening-" + uuid.uuid4().hex + ".mjs")
        try:
            adapted.write_text(source, encoding="utf-8")
            env = dict(os.environ, STOCKOS_PROOF_PYTHON=sys.executable, STOCKOS_PROOF_RUNNER=str(Path(__file__)), STOCKOS_PROOF_MANIFEST=str(manifest_path))
            command(["node", str(adapted), status_path, *extra], env=env, timeout=600)
        finally:
            adapted.unlink(missing_ok=True)
    empty(manifest)
    print("PASS " + suite_name)


def launch_server(directory, manifest, production=False):
    listen_check([3012])
    app = directory / "app"
    app.mkdir()
    for name in ("src", "public"):
        shutil.copytree(ROOT / name, app / name)
    for name in ("package.json", "tsconfig.json", "postcss.config.mjs", "next.config.ts"):
        shutil.copy2(ROOT / name, app / name)
    if os.name == "nt":
        command(["cmd", "/c", "mklink", "/J", str(app / "node_modules"), str(ROOT / "node_modules")])
    else:
        (app / "node_modules").symlink_to(ROOT / "node_modules", target_is_directory=True)
    env = dict(os.environ, SUPABASE_URL=manifest["api"], SUPABASE_ANON_KEY=manifest["status"]["ANON_KEY"],
               SUPABASE_SERVICE_ROLE_KEY=manifest["status"]["SERVICE_ROLE_KEY"], STOCKOS_APP_URL="http://localhost:3012",
               STOCKOS_SETUP_SECRET=uuid.uuid4().hex + uuid.uuid4().hex, NEXT_TELEMETRY_DISABLED="1")
    log = (directory / "next.log").open("w", encoding="utf-8")
    next_bin = ["node", str(ROOT / "node_modules/next/dist/bin/next")]
    if production:
        # Isolated next build + next start; same app copy, same synthetic env, same guards.
        try:
            command(next_bin + ["build", "--webpack"], cwd=app, env=env, timeout=900)
        except BaseException:
            log.close()
            raise
        server = subprocess.Popen(next_bin + ["start", "--hostname", "127.0.0.1", "--port", "3012"],
                                  cwd=str(app), env=env, stdout=log, stderr=log)
    else:
        server = subprocess.Popen(next_bin + ["dev", "--webpack", "--hostname", "127.0.0.1", "--port", "3012"],
                                  cwd=str(app), env=env, stdout=log, stderr=log)
    try:
        for _ in range(180):
            assert server.poll() is None, "Next server exited; private log retained"
            try:
                with urlopen("http://localhost:3012/login", timeout=2) as response:
                    if response.status == 200:
                        return server, log
            except (URLError, TimeoutError):
                pass
            time.sleep(0.5)
        raise RuntimeError("Next server readiness timed out")
    except BaseException:
        server.terminate()
        server.wait(timeout=15)
        log.close()
        raise


def proof_evidence(requested, completed, failure_phase, cleanup_failures, baseline):
    failed = [failure_phase] if failure_phase in requested and failure_phase not in completed else []
    passed = not failure_phase and not cleanup_failures and set(completed) == set(requested)
    return {"status": "PASS_LOCAL_ONLY" if passed else "FAIL_LOCAL_ONLY",
            "coverage": "full" if set(completed) == set(SUITES) else "partial",
            "requestedSuites": requested, "completedSuites": completed, "failedSuites": failed,
            "notRunSuites": [name for name in requested if name not in completed and name not in failed],
            "failurePhase": failure_phase or ("cleanup" if cleanup_failures else None),
            "cleanup": {"status": "FAIL" if cleanup_failures else "PASS", "failedSteps": cleanup_failures},
            "commandArgs": ["--run", *[arg for name in requested for arg in ("--only", name)]],
            "testedBaseline": baseline, "cloud": "NOT_AUTHORIZED", "smtp": "NOT_SENT", "realShopData": "NOT_USED"}


def run(args):
    global COMMAND_LOG
    directory = Path(tempfile.mkdtemp(prefix="stockos-hardening-"))
    COMMAND_LOG = directory / "commands.log"
    fixtures = []
    server = log = None
    suites = list(dict.fromkeys(args.only or list(SUITES)))
    completed, cleanup_failures, success_messages = [], [], []
    baseline_evidence = {}
    failure_phase = None
    phase = "preflight"
    try:
        protect(directory)
        # Hash source only; never publish raw diff, untracked content, or private paths.
        def git_bytes(*arguments):
            result = RAW_RUN(["git", *arguments], cwd=str(ROOT), capture_output=True, timeout=30)
            assert result.returncode == 0, "Cannot capture tested baseline"
            return result.stdout
        digest = hashlib.sha256(git_bytes("diff", "--binary", "HEAD", "--"))
        for raw_path in sorted(git_bytes("ls-files", "--others", "--exclude-standard", "-z").split(b"\0")):
            if not raw_path:
                continue
            path = ROOT / os.fsdecode(raw_path)
            if path.suffix.lower() not in {".py", ".mjs", ".js", ".ts", ".tsx", ".jsx", ".sql", ".css", ".html", ".md"}:
                continue
            content = path.read_bytes()
            digest.update(len(raw_path).to_bytes(8, "big") + raw_path)
            digest.update(len(content).to_bytes(8, "big") + content)
        baseline_evidence = {"commit": git_bytes("rev-parse", "HEAD").decode("ascii").strip(),
                             "diffSha256": digest.hexdigest(), "includesUntrackedSource": True}
        migrations = sorted((ROOT / "supabase/migrations").glob("*.sql"))
        assert migrations, "No current migrations"
        baseline = sorted(Path(args.baseline_dir).resolve().glob("*.sql")) if args.baseline_dir else [path for path in migrations if path.name[:14] <= BASELINE_LAST]
        assert baseline, "Baseline migrations missing"
        current = {path.name: path.read_bytes() for path in migrations}
        assert all(path.name in current and path.read_bytes() == current[path.name] for path in baseline), "Historical migration changed"
        assert [path.name for path in baseline] == [path.name for path in migrations[:len(baseline)]], "Baseline must be unchanged prefix"
        assert len(baseline) < len(migrations), "No forward migration supplied"
        phase = "seeded forward upgrade"
        upgrade_ports = fixture_ports()
        upgrade = prepare_fixture(directory, "upgrade", upgrade_ports, baseline, fixtures)
        rpc, receipt, before = seed_upgrade(upgrade)
        prior = snapshot_hash(upgrade)
        for migration in migrations[len(baseline):]:
            shutil.copy2(migration, Path(upgrade["workdir"]) / "supabase/migrations" / migration.name)
        guard(upgrade)
        command([cli(), "migration", "up", "--local", "--workdir", upgrade["workdir"]])
        assert snapshot_hash(upgrade) == prior, "Upgrade changed domain/evidence/retry rows"
        assert rpc("get_product", {"id": before["data"]["id"]}) == before, "Upgrade changed stock DTO"
        assert rpc("record_stock_in", receipt)["replayed"] is True, "Upgrade lost retry identity"
        assert snapshot_hash(upgrade) == prior, "Replay duplicated evidence"
        guard(upgrade)
        command([cli(), "migration", "up", "--local", "--workdir", upgrade["workdir"]])
        assert snapshot_hash(upgrade) == prior, "No-op migration changed data"
        native_grants(upgrade)
        success_messages.append("PASS seeded forward upgrade, no-op/replay, native grants")
        phase = "clean migration replay"
        clean = prepare_fixture(directory, "clean", fixture_ports(upgrade_ports), migrations, fixtures)
        native_grants(clean)
        empty(clean)
        success_messages.append("PASS clean CLI migration replay, native grants")
        manifest_path = Path(clean["workdir"]) / "manifest.json"
        manifest_path.write_text(json.dumps(clean), encoding="utf-8")
        assert all((ROOT / "scripts" / SUITES[name][0]).is_file() for name in suites), "Required regression suite missing; do not claim full proof"
        if any(SUITES[name][0].endswith(".py") for name in suites):
            phase = "Next startup"
            server, log = launch_server(directory, clean, production=args.prod)
        for name in suites:
            phase = name
            print("RUN " + name, flush=True)
            guard(clean)
            command([sys.executable, "-I", str(Path(__file__)), "--execute-test", str(manifest_path), name], timeout=600)
            completed.append(name)
            success_messages.append("PASS " + name)
    except BaseException:
        failure_phase = phase
        import traceback
        with COMMAND_LOG.open("a", encoding="utf-8") as private_log:
            traceback.print_exc(file=private_log)
    finally:
        if server:
            try:
                server.terminate()
                try:
                    server.wait(timeout=15)
                except subprocess.TimeoutExpired:
                    server.kill()
                    server.wait(timeout=15)
                assert server.poll() is not None, "Run-owned server still running"
            except BaseException:
                cleanup_failures.append("server")
        if log:
            try:
                log.close()
            except BaseException:
                cleanup_failures.append("server-log")
        for fixture in reversed(fixtures):
            try:
                guard(fixture, cleanup=True)
                command([cli(), "stop", "--workdir", fixture["workdir"], "--no-backup"])
                assert not resource_names(fixture["project"]), "Run-owned project resources remain"
                assert not command(["docker", "ps", "-a", "--filter", "label=com.supabase.cli.project=" + fixture["project"], "--format", "{{.Names}}"]), "Run-owned labeled container remains"
            except BaseException:
                cleanup_failures.append("fixture")
        link = directory / "app/node_modules"
        try:
            if os.path.lexists(link):
                if os.name == "nt":
                    command(["cmd", "/c", "rmdir", str(link)])
                else:
                    link.unlink()
            assert not os.path.lexists(link), "Run-owned dependency link remains"
        except BaseException:
            cleanup_failures.append("link")
        evidence = proof_evidence(suites, completed, failure_phase, cleanup_failures, baseline_evidence)
        evidence["commandArgs"] = ["--run", *(["--prod"] if args.prod else []), *[arg for name in (args.only or []) for arg in ("--only", name)]]
        (directory / "evidence.json").write_text(json.dumps(evidence, indent=2), encoding="utf-8")
    if evidence["status"] != "PASS_LOCAL_ONLY":
        print("FAIL proof phase: " + str(evidence["failurePhase"]) + "; raw output suppressed. Protected evidence: " + str(directory), file=sys.stderr)
        raise RuntimeError("Local hardening proof failed") from None
    for message in success_messages:
        print(message, flush=True)
    print("PASS local hardening proof (" + evidence["coverage"] + "); protected evidence directory: " + str(directory))


def self_test():
    # Evidence seam: subset coverage, interrupted suites, and cleanup cannot imply full PASS.
    subset = proof_evidence(["products"], ["products"], None, [], {})
    assert subset["status"] == "PASS_LOCAL_ONLY" and subset["coverage"] == "partial"
    assert subset["requestedSuites"] == subset["completedSuites"] == ["products"]
    assert subset["failedSuites"] == subset["notRunSuites"] == []
    failure = proof_evidence(["products", "settings", "defaults"], [], "products", ["fixture"], {})
    assert failure["status"] == "FAIL_LOCAL_ONLY" and failure["failurePhase"] == "products"
    assert failure["failedSuites"] == ["products"] and failure["notRunSuites"] == ["settings", "defaults"]
    assert failure["cleanup"] == {"status": "FAIL", "failedSteps": ["fixture"]}
    full = proof_evidence(list(SUITES), list(SUITES), None, [], {})
    assert full["status"] == "PASS_LOCAL_ONLY" and full["coverage"] == "full"
    for step in ("server", "server-log", "fixture", "link"):
        cleanup = proof_evidence(list(SUITES), list(SUITES), None, [step], {})
        assert cleanup["status"] == "FAIL_LOCAL_ONLY" and cleanup["failurePhase"] == "cleanup"
    interrupted = proof_evidence(list(SUITES), ["auth"], "Next startup", [], {})
    assert interrupted["coverage"] == "partial" and interrupted["failedSuites"] == []
    assert interrupted["notRunSuites"] == list(SUITES)[1:]
    assert proof_evidence(["products"], [], None, [], {})["status"] == "FAIL_LOCAL_ONLY"
    global command, listen_check
    original_listen_check = listen_check
    probed = []
    def reserved_first(ports):
        probed.append(ports)
        if ports[0] == 54001:
            raise OSError(10013, "Reserved test port")
    listen_check = reserved_first
    try:
        assert fixture_ports((54011,)) == (54021, 54022, 54024, 54020, 54023)
        assert len(probed) == 2, "Excluded port block was probed"
        def unavailable(_ports):
            raise OSError("Unavailable test ports")
        listen_check = unavailable
        try:
            fixture_ports()
        except RuntimeError:
            pass
        else:
            raise AssertionError("Exhausted ports accepted")
    finally:
        listen_check = original_listen_check
    for method in ("GET", "POST", "PUT", "PATCH", "DELETE"):
        for status in (301, 302, 303, 307, 308):
            request = Request("http://127.0.0.1:54001/test", method=method)
            try:
                NoRedirect().redirect_request(request, None, status, "redirect", {}, "https://example.test")
            except RuntimeError:
                pass
            else:
                raise AssertionError("Provider redirect accepted")
    fixture = {"project": "stockos-hardening-0123456789ab-clean", "apiPort": 56041, "dbPort": 56042, "mailPort": 56044}
    source = "stockos-stock-proof stockos-auth stockos-recovery-proof 55541 55542 55544 55641 55431 localhost:3002 localhost:3004"
    expected = " ".join([fixture["project"]] * 3) + " 56041 56042 56044 56041 56041 localhost:3012 localhost:3012"
    assert fixture_replacements(fixture, source) == expected
    for patch in ({"createdByRun": False}, {"project": "stockos-auth"}, {"api": "https://example.com"}, {"db": "postgresql://cloud"}):
        invalid = dict(fixture, createdByRun=True, api="http://127.0.0.1:56041", db="postgresql://postgres:postgres@127.0.0.1:56042/postgres", containers={})
        invalid.update(patch)
        try:
            guard(invalid)
        except AssertionError:
            continue
        raise AssertionError("Unsafe fixture accepted")
    assert "test-warung-catalog.py" not in [filename for filename, _ in SUITES.values()]
    project = fixture["project"]
    name = "supabase_db_" + project
    volume = {"Name": name, "CreatedAt": "2026-10-11T00:00:00Z", "Labels": {"com.supabase.cli.project": project}}
    inspection = {"Id": "captured-id", "Name": "/" + name, "Config": {"Labels": {"com.supabase.cli.project": project}},
                  "State": {"Running": True}, "HostConfig": {"PortBindings": {"5432/tcp": [{"HostPort": "56042"}]}},
                  "NetworkSettings": {"Ports": {"5432/tcp": [{"HostPort": "56042"}]}}}
    valid = dict(fixture, createdByRun=True, api="http://127.0.0.1:56041", db="postgresql://postgres:postgres@127.0.0.1:56042/postgres",
                 containers={name: "captured-id"}, volumes={name: volume})
    def fake_command(args, **_kwargs):
        if args[1:3] == ["volume", "ls"]:
            return name
        if args[1:3] == ["volume", "inspect"]:
            return json.dumps([volume])
        if args[1] == "ps":
            return name
        if args[1] == "inspect":
            return json.dumps([inspection])
        raise AssertionError("Unexpected self-test command")
    original_command = command
    command = fake_command
    try:
        guard(valid)
        guard_write(valid, valid["api"] + "/rest/v1/rpc/test", "POST")
        for method in ("POST", "PUT", "PATCH", "DELETE"):
            for url in ("https://example.com/write", "http://127.0.0.1:55431/write"):
                try:
                    guard_write(valid, url, method)
                except AssertionError:
                    pass
                else:
                    raise AssertionError("Nonfixture HTTP write accepted")
        inspection["Id"] = "replacement-id"
        try:
            guard_write(valid, valid["api"] + "/rest/v1/rpc/test", "POST")
        except AssertionError:
            pass
        else:
            raise AssertionError("HTTP write accepted after container replacement")
        inspection["Id"] = "captured-id"
        inspection["State"]["Running"] = False
        inspection["NetworkSettings"]["Ports"]["5432/tcp"] = None
        guard(valid, cleanup=True)
        try:
            guard_write(valid, valid["api"] + "/rest/v1/rpc/test", "POST")
        except AssertionError:
            pass
        else:
            raise AssertionError("Cleanup guard relaxed normal write guard")
        inspection["HostConfig"]["PortBindings"]["5432/tcp"][0]["HostPort"] = "55432"
        try:
            guard(valid, cleanup=True)
        except AssertionError:
            pass
        else:
            raise AssertionError("Cleanup accepted wrong configured port")
        inspection["HostConfig"]["PortBindings"]["5432/tcp"][0]["HostPort"] = "56042"
        inspection["State"]["Running"] = True
        inspection["NetworkSettings"]["Ports"]["5432/tcp"] = [{"HostPort": "56042"}]
        for key, changed in (("Id", "replacement-id"), ("Name", "/wrong")):
            original = inspection[key]
            inspection[key] = changed
            try:
                guard(valid)
            except AssertionError:
                pass
            else:
                raise AssertionError("Changed container accepted")
            inspection[key] = original
        stale_volume = json.loads(json.dumps(valid))
        stale_volume["volumes"][name]["CreatedAt"] = "older"
        try:
            guard(stale_volume)
        except AssertionError:
            pass
        else:
            raise AssertionError("Replaced volume accepted")
    finally:
        command = original_command
    # APIRequestContext writes bypass browser routes; test guard before dispatch.
    from types import SimpleNamespace
    sent = []
    status = 200
    def send(_context, url, **kwargs):
        sent.append((url, kwargs))
        return SimpleNamespace(status=status)
    command = fake_command
    try:
        for method in ("POST", "PUT", "PATCH", "DELETE"):
            guarded_api_request(valid, send, None, valid["api"] + "/test", method)
            assert sent[-1][1] == {"max_redirects": 0, "max_retries": 0}
            count = len(sent)
            for url in ("https://example.test/write", "http://127.0.0.1:55431/write"):
                try:
                    guarded_api_request(valid, send, None, url, method)
                except AssertionError:
                    pass
                else:
                    raise AssertionError("Unsafe APIRequestContext write accepted")
            inspection["Id"] = "replacement-id"
            try:
                guarded_api_request(valid, send, None, valid["api"] + "/test", method)
            except AssertionError:
                pass
            else:
                raise AssertionError("Replaced identity accepted by APIRequestContext")
            finally:
                inspection["Id"] = "captured-id"
            assert len(sent) == count, "Unsafe API write dispatched"
            for status in (307, 308):
                try:
                    guarded_api_request(valid, send, None, valid["api"] + "/test", method, max_redirects=20, max_retries=5)
                except AssertionError:
                    pass
                else:
                    raise AssertionError("API write redirect accepted")
                assert sent[-1][1] == {"max_redirects": 0, "max_retries": 0}
            status = 200
    finally:
        command = original_command
    print("PASS proof substitution, pinned container/volume identity, unsafe-target denial, auto-reset exclusion, guarded API writes")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fresh local synthetic hardening proof; never reuses retained resources")
    parser.add_argument("--run", action="store_true")
    parser.add_argument("--prod", action="store_true", help="With --run: isolated next build + next start instead of dev")
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--baseline-dir")
    parser.add_argument("--only", choices=list(SUITES), action="append")
    parser.add_argument("--inspect", type=Path)
    parser.add_argument("--cleanup", type=Path)
    parser.add_argument("--execute-test", nargs=2, metavar=("MANIFEST", "SUITE"))
    options = parser.parse_args()
    try:
        assert sum((options.run, options.self_test, bool(options.inspect), bool(options.cleanup), bool(options.execute_test))) == 1, "Choose one explicit mode"
        assert not (options.prod and not options.run), "--prod requires --run"
        if options.self_test:
            self_test()
        elif options.cleanup:
            target = json.loads(options.cleanup.read_text(encoding="utf-8"))
            guard(target, cleanup=True)
            workdir = Path(target["workdir"])
            assert options.cleanup.resolve().parent == workdir.resolve(), "Cleanup manifest/workdir mismatch"
            config = (workdir / "supabase/config.toml").read_text(encoding="utf-8")
            assert f'project_id = "{target["project"]}"' in config, "Cleanup config project mismatch"
            COMMAND_LOG = workdir.parent / "cleanup.log"
            command([cli(), "stop", "--workdir", str(workdir), "--no-backup"])
            print("PASS captured fixture cleanup")
        elif options.inspect:
            target = json.loads(options.inspect.read_text(encoding="utf-8"))
            guard(target)
            print(json.dumps({"containers": target["containers"], "api": target["api"]}))
        elif options.execute_test:
            assert options.execute_test[1] in SUITES
            manifest_path = Path(options.execute_test[0])
            COMMAND_LOG = manifest_path.parents[1] / (options.execute_test[1] + ".log")
            try:
                execute_suite(manifest_path, options.execute_test[1])
            except BaseException:
                import traceback
                with COMMAND_LOG.open("a", encoding="utf-8") as private_log:
                    traceback.print_exc(file=private_log)
                raise
        else:
            run(options)
    except BaseException:
        print("FAIL local proof; diagnostic/provider details suppressed", file=sys.stderr)
        sys.exit(1)
