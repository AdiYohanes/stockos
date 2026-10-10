"""python -I scripts/test-products.py http://localhost:3002 <stock-proof-status.json> [--vertical]
Edge + actual Next Server Action POSTs + real isolated Supabase. No mock cookies/env edits.
Native stock suite must release empty fixture first. Cleanup refuses uncaptured records.
"""
import json
import re
import subprocess
import sys
import time
import uuid
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from playwright.sync_api import expect, sync_playwright

BASE = sys.argv[1]
STATUS = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8-sig"))
assert BASE == "http://localhost:3002", "Dedicated app origin required"
assert STATUS["API_URL"] == "http://127.0.0.1:55541", "Refuse nonfixture API"
assert STATUS["DB_URL"] == "postgresql://postgres:postgres@127.0.0.1:55542/postgres", "Refuse nonfixture DB"
CONTAINER = "supabase_db_stockos-stock-proof"
RUN = str(uuid.uuid4())
EMAIL, PASSWORD = f"products-browser-{RUN}@example.test", f"Local-proof-{uuid.uuid4()}!"
SHOP, PREFIX = f"Products browser proof {RUN}", f"PB-{RUN[:8].upper()}"
PRODUCTS, REQUESTS = set(), set()
USER = TOKEN = None
PREPARED = False


def docker(*args):
    result = subprocess.run(["docker", *args], capture_output=True, text=True, timeout=30)
    assert result.returncode == 0, "Dedicated Docker command failed (output suppressed)"
    return result.stdout.strip()


def guard():
    item = json.loads(docker("inspect", CONTAINER))[0]
    assert item["Name"] == f"/{CONTAINER}"
    assert item["Config"]["Labels"]["com.supabase.cli.project"] == "stockos-stock-proof"
    assert item["State"]["Running"] is True
    assert any(binding["HostPort"] == "55542" for binding in item["NetworkSettings"]["Ports"]["5432/tcp"])


def sql(statement):
    guard()
    return docker("exec", CONTAINER, "psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres", "-c", statement)


def quote(value):
    return "'" + value.replace("'", "''") + "'"


def http(path, body=None, token=None, admin=False, method="POST"):
    key = STATUS["SERVICE_ROLE_KEY"] if admin else STATUS["ANON_KEY"]
    request = Request(STATUS["API_URL"] + path, method=method,
                      data=None if body is None else json.dumps(body).encode(),
                      headers={"apikey": key, "Authorization": f"Bearer {token or key}", "Content-Type": "application/json"})
    try:
        with urlopen(request, timeout=20) as response:
            text = response.read()
            return json.loads(text) if text else None
    except HTTPError:
        raise AssertionError("Fixture provider request rejected (response suppressed)") from None


def rpc(name, data):
    result = http(f"/rest/v1/rpc/stockos_{name}", {"p_input": data}, TOKEN)
    assert result.get("ok") is True, f"Public RPC rejected: {result.get('code')}"
    return result["data"]


def provision():
    global USER, TOKEN, PREPARED
    snapshot = json.loads(sql("SELECT json_build_object('registration',(SELECT row_to_json(r) FROM stockos_private.owner_registration r WHERE id=1),'shops',(SELECT count(*) FROM stockos_private.shop_settings),'users',(SELECT count(*) FROM auth.users),'products',(SELECT count(*) FROM stockos_private.products),'requests',(SELECT count(*) FROM stockos_private.mutation_requests),'events',(SELECT count(*) FROM stockos_private.inventory_events),'administrative',(SELECT count(*) FROM stockos_private.administrative_events))"))
    assert snapshot["registration"]["state"] == "unclaimed", "Native suite must release empty fixture first"
    assert all(snapshot[key] == 0 for key in ("shops", "users", "products", "requests", "events", "administrative")), "Refuse unknown fixture records"
    PREPARED = True
    claim = http("/rest/v1/rpc/stockos_claim_owner", {"p_email": EMAIL, "p_name": "Products browser proof", "p_shop": SHOP, "p_timezone": "Asia/Jakarta"}, admin=True)
    assert str(uuid.UUID(claim["attemptId"])) == claim["attemptId"]
    invitation = http("/auth/v1/invite", {"email": EMAIL, "data": {"stockos_attempt_id": claim["attemptId"]}}, admin=True)
    USER = invitation.get("user", invitation)["id"]
    assert str(uuid.UUID(USER)) == USER
    assert http("/rest/v1/rpc/stockos_reconcile_owner", {"p_attempt": claim["attemptId"]}, admin=True) == USER
    token_hash = None
    for _ in range(60):
        with urlopen("http://127.0.0.1:55544/api/v1/messages", timeout=5) as response:
            messages = json.load(response)["messages"]
        for message in messages:
            if not any(recipient["Address"] == EMAIL for recipient in message["To"]):
                continue
            with urlopen(f"http://127.0.0.1:55544/api/v1/message/{message['ID']}", timeout=5) as response:
                match = re.search(r"token_hash=([a-f0-9]+)", json.load(response)["HTML"])
            if match:
                token_hash = match[1]
                break
        if token_hash:
            break
        time.sleep(0.25)
    assert token_hash, "Dedicated invitation missing"
    verified = http("/auth/v1/verify", {"token_hash": token_hash, "type": "invite"})
    http("/auth/v1/user", {"password": PASSWORD}, verified["access_token"], method="PUT")
    http("/auth/v1/logout?scope=local", token=verified["access_token"])
    login_result = http("/auth/v1/token?grant_type=password", {"email": EMAIL, "password": PASSWORD})
    TOKEN = login_result["access_token"]
    assert login_result["user"]["email_confirmed_at"]


def cleanup():
    if not PREPARED:
        return
    products = "ARRAY[" + ",".join(quote(value) for value in PRODUCTS) + "]::uuid[]"
    requests = "ARRAY[" + ",".join(quote(value) for value in REQUESTS) + "]::uuid[]"
    user = quote(USER) + "::uuid" if USER else "NULL::uuid"
    sql(f"""BEGIN;
      LOCK TABLE stockos_private.owner_registration, stockos_private.shop_settings IN EXCLUSIVE MODE;
      DO $guard$ BEGIN
        IF (SELECT count(*) FROM stockos_private.owner_registration)<>1
          OR NOT EXISTS(SELECT 1 FROM stockos_private.owner_registration WHERE id=1)
          OR EXISTS(SELECT 1 FROM stockos_private.owner_registration WHERE id<>1 OR
          (state<>'unclaimed' AND (email IS DISTINCT FROM {quote(EMAIL)} OR
           (auth_user_id IS NOT NULL AND auth_user_id IS DISTINCT FROM {user}))))
          OR EXISTS(SELECT 1 FROM stockos_private.shop_settings WHERE id<>1 OR name<>{quote(SHOP)})
          OR EXISTS(SELECT 1 FROM auth.users WHERE id IS DISTINCT FROM {user} OR email IS DISTINCT FROM {quote(EMAIL)})
          OR EXISTS(SELECT 1 FROM stockos_private.products WHERE NOT(id=ANY({products})) OR sku NOT LIKE {quote(PREFIX + '-%')})
          OR EXISTS(SELECT 1 FROM stockos_private.mutation_requests WHERE NOT(request_id=ANY({requests})))
          OR EXISTS(SELECT 1 FROM stockos_private.inventory_events WHERE NOT(product_id=ANY({products})) OR NOT(request_id=ANY({requests})))
          OR EXISTS(SELECT 1 FROM stockos_private.administrative_events WHERE NOT(request_id=ANY({requests})))
        THEN RAISE EXCEPTION 'Uncaptured fixture records; cleanup refused'; END IF;
      END $guard$;
      DELETE FROM stockos_private.inventory_events WHERE product_id=ANY({products});
      DELETE FROM stockos_private.administrative_events WHERE request_id=ANY({requests});
      DELETE FROM stockos_private.products WHERE id=ANY({products});
      DELETE FROM stockos_private.mutation_requests WHERE request_id=ANY({requests});
      DELETE FROM stockos_private.shop_settings WHERE id=1 AND name={quote(SHOP)};
      UPDATE stockos_private.owner_registration SET state='unclaimed',attempt_id=NULL,email=NULL,
        auth_user_id=NULL,provisioned_at=NULL,bound_at=NULL,updated_at=now() WHERE id=1;
      DELETE FROM auth.users WHERE id={user} AND email={quote(EMAIL)};
      COMMIT;""")


def login(context):
    page = context.new_page()
    page.goto(BASE + "/login")
    page.wait_for_function("Object.keys(document.querySelector('form')).some(key => key.startsWith('__reactProps$'))")
    page.locator("#email").fill(EMAIL)
    page.locator("#password").fill(PASSWORD)
    page.locator('button[type="submit"]').click()
    page.wait_for_url(BASE + "/", timeout=30000)
    assert any(cookie["name"].startswith("sb-") and cookie["httpOnly"] for cookie in context.cookies())
    page.on("request", capture)
    return page


def is_mutation(request):
    if request.method != "POST" or not request.headers.get("next-action"):
        return False
    try:
        args = json.loads(request.post_data)
    except (TypeError, ValueError):
        return False
    return isinstance(args, list) and bool(args) and isinstance(args[0], dict) and bool(args[0].get("requestId"))


def capture(request):
    if is_mutation(request):
        REQUESTS.add(str(uuid.UUID(json.loads(request.post_data)[0]["requestId"])))


def action_result(text):
    # ponytail: plain JSON action arguments/results only; add Flight reference decoding if DTO transport changes.
    for line in text.splitlines():
        try:
            value = json.loads(line.partition(":")[2])
        except ValueError:
            continue
        if isinstance(value, dict) and isinstance(value.get("ok"), bool):
            return value
    raise AssertionError("Actual action response missing safe result envelope")


def direct(context, request, payload=None):
    args = json.loads(request.post_data)
    if payload is not None:
        args[0] = payload
    if isinstance(args[0], dict) and args[0].get("requestId"):
        REQUESTS.add(str(uuid.UUID(args[0]["requestId"])))
    headers = {key: value for key, value in request.headers.items() if key in ("next-action", "content-type", "accept", "next-router-state-tree")}
    headers["origin"] = BASE
    response = context.request.post(request.url, headers=headers, data=json.dumps(args))
    assert response.status == 200, f"Action HTTP {response.status}"
    return action_result(response.text())


def product(sku):
    exact = [item for item in rpc("list_products", {"search": sku, "archive": "all"})["items"] if item["sku"] == sku]
    assert len(exact) == 1, "Committed product missing or duplicated"
    item = exact[0]
    assert item["sku"].startswith(PREFIX + "-")
    PRODUCTS.add(str(uuid.UUID(item["id"])))
    return item


def history(item):
    return rpc("list_inventory_events", {"productId": item["id"], "pageSize": 100})


def add(page, suffix, opening=0, purchase=None, name=None):
    sku = f"{PREFIX}-{suffix}"
    page.goto(BASE + "/products")
    page.get_by_role("button", name=re.compile(r"Tambah Produk Baru|Tambah Produk|Add Product")).first.click()
    for field, value in {"name": name or f"Browser proof {suffix}", "sku": sku, "category": "Browser proof", "unit": "Pcs", "min-stock": "0", "sell": "10000", "pcs": str(opening)}.items():
        page.locator(f"#product-{field}").fill(value)
    if purchase is not None:
        page.locator("#product-purchase").fill(str(purchase))
    if "--layers" in sys.argv:
        print(json.dumps(page.get_by_role("dialog").locator('button[type="submit"]').evaluate("""el => {const r=el.getBoundingClientRect(); return document.elementsFromPoint(r.x+r.width/2,r.y+r.height/2).map(e=>({html:e.outerHTML.slice(0,500),box:e.getBoundingClientRect().toJSON(),z:getComputedStyle(e).zIndex,pointer:getComputedStyle(e).pointerEvents,parent:e.parentElement?.outerHTML.slice(0,300)}));}""")))
    with page.expect_request(is_mutation) as posted:
        submit = page.get_by_role("dialog").locator('button[type="submit"]')
        submit.click()
    request = posted.value
    result = request.response()
    assert result and action_result(result.text())["ok"] is True
    item = product(sku)  # capture before UI assertion, so failed success UI can still clean owned records
    expect(page.get_by_role("heading", name=re.compile(r"Produk Berhasil Ditambahkan|Product Added Successfully"))).to_be_visible(timeout=30000)
    page.get_by_role("button", name=re.compile(r"^(Selesai|Done)$")).click()
    return item, request


def row(page, item):
    page.goto(BASE + "/products?search=" + item["sku"] + "&archive=all")
    found = page.get_by_role("row").filter(has=page.get_by_role("cell", name=item["sku"], exact=False))
    expect(found).to_be_visible(timeout=20000)
    return found


def movement(page, item, kind, quantity, purchase=None, cartons=None):
    row(page, item).get_by_role("button", name=re.compile(r"^(Stock In|Stok Masuk) —" if kind == "in" else r"^(Stock Out|Stok Keluar) —")).click()
    page.locator("#mov-qty").fill(str(quantity))
    if cartons:
        page.get_by_role("dialog").get_by_role("checkbox").check()
        page.locator("#mov-cartons").fill(str(cartons[0]))
        page.locator("#mov-carton-units").fill(str(cartons[1]))
    if purchase is not None:
        page.locator("#mov-purchase").fill(str(purchase))
    with page.expect_request(is_mutation) as posted:
        page.get_by_role("dialog").locator('button[type="submit"]').click()
    request = posted.value
    expect(page.get_by_role("dialog")).not_to_be_visible(timeout=20000)
    return product(item["sku"]), request


def edit(page, item, price):
    row(page, item).get_by_role("button", name=re.compile(r"^(Edit|Ubah)$")).click()
    expect(page.locator("#edit-sku")).to_be_disabled()
    expect(page.locator("#edit-unit")).to_be_disabled()
    page.locator("#edit-selling-price").fill(str(price))
    with page.expect_request(is_mutation) as posted:
        page.get_by_role("dialog").locator('button[type="submit"]').click()
    request = posted.value
    expect(page.get_by_role("dialog")).not_to_be_visible(timeout=20000)
    return product(item["sku"]), request


def full(page, context, browser, item, create_request):
    zero, _ = add(page, "ZERO")
    assert zero["currentStock"] == 0 and history(zero)["total"] == 0
    free, _ = add(page, "FREE", 2, 0, name=item["name"])
    assert free["id"] != item["id"] and free["inventoryCostValue"] == "0.000000"
    item, receipt = movement(page, item, "in", 10, 40000, cartons=(2, 5))
    assert item["currentStock"] == 20 and item["inventoryCostValue"] == "70000.000000"
    item, sold = movement(page, item, "out", 5)
    assert item["currentStock"] == 15 and item["inventoryCostValue"] == "52500.000000"
    item, edit_request = edit(page, item, 99999)
    assert item["sellingPrice"] == "99999" and item["inventoryCostValue"] == "52500.000000"
    before = history(item)
    invalid = dict(json.loads(sold.post_data)[0], requestId=str(uuid.uuid4()), quantity=999999999)
    assert direct(context, sold, invalid)["code"] == "INSUFFICIENT_STOCK"
    invalid["quantity"] = 1.5
    assert direct(context, sold, invalid)["code"] == "VALIDATION_ERROR"
    invalid.update(quantity=1, actorId=str(uuid.uuid4()))
    assert direct(context, sold, invalid)["code"] == "VALIDATION_ERROR"
    assert history(item) == before
    anonymous = browser.new_context()
    assert direct(anonymous, create_request)["code"] == "UNAUTHENTICATED"
    anonymous.close()
    other_context = browser.new_context()
    other = login(other_context)
    # Two real sessions: stale draft remains open after metadata changed elsewhere.
    row(other, item).get_by_role("button", name=re.compile(r"^(Edit|Ubah)$")).click()
    other.locator("#edit-selling-price").fill("77777")
    item, _ = edit(page, item, 88888)
    other.get_by_role("dialog").locator('button[type="submit"]').click()
    expect(other.get_by_role("alert")).to_be_visible(timeout=20000)
    assert other.locator("#edit-selling-price").input_value() == "77777"
    assert product(item["sku"])["sellingPrice"] == "88888"
    other_context.close()
    stale = dict(json.loads(edit_request.post_data)[0], requestId=str(uuid.uuid4()))
    assert direct(context, edit_request, stale)["code"] == "VERSION_CONFLICT"
    # Replay old committed receipt after later sale/edit: old snapshot must not replace current state.
    before = history(item)
    replayed = direct(context, receipt)
    assert replayed["ok"] is True and replayed["replayed"] is True
    assert history(item) == before and product(item["sku"])["currentStock"] == 15
    # Drop browser response only after actual server commit; retry must preserve payload/request ID.
    row(page, item).get_by_role("button", name=re.compile(r"^(Stock In|Stok Masuk) —")).click()
    page.locator("#mov-qty").fill("1")
    page.locator("#mov-purchase").fill("0")
    dropped = []

    def lose_response(route):
        if route.request.method == "POST" and route.request.headers.get("next-action") and not dropped:
            result = route.fetch()
            assert action_result(result.text())["ok"] is True
            dropped.append(route.request)
            route.abort("failed")
        else:
            route.continue_()

    page.route("**/products*", lose_response)
    page.get_by_role("dialog").locator('button[type="submit"]').click()
    expect(page.get_by_role("alert")).to_be_visible(timeout=20000)
    assert page.locator("#mov-qty").input_value() == "1"
    page.unroute("**/products*", lose_response)
    with page.expect_request(is_mutation) as retry:
        page.get_by_role("dialog").get_by_role("button", name=re.compile(r"^(Retry same request|Ulangi permintaan sama)$")).click()
    assert json.loads(retry.value.post_data) == json.loads(dropped[0].post_data), "Lost-response retry changed payload/ID"
    expect(page.get_by_role("dialog")).not_to_be_visible(timeout=20000)
    assert product(item["sku"])["currentStock"] == 16
    assert history(item)["total"] == before["total"] + 1
    kinds = [event["kind"] for event in history(item)["items"]]
    assert kinds.count("opening") == 1 and kinds.count("receipt") == 2 and kinds.count("sold") == 1
    print("PASS: zero/free opening, duplicate names, carton receipt, sold/cost, price edit, strict/anonymous actions, two-session conflict, lost-response retry/replay")


def run():
    provision()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="msedge")
        context = browser.new_context(viewport={"width": 1440, "height": 1000}, reduced_motion="reduce")
        page = login(context)
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        item, request = add(page, "VERTICAL", 10, 30000)
        assert item["currentStock"] == 10 and item["inventoryCostValue"] == "30000.000000"
        page.reload()
        page.goto(BASE + "/inventory")
        expect(page.locator("body")).to_contain_text(re.compile(r"demo", re.I))
        row(page, item)
        second = browser.new_context()
        other = login(second)
        row(other, item)
        assert product(item["sku"])["id"] == item["id"]
        second.close()
        print("PASS: verified login, actual action create, exact opening cost, reload/navigation/new-session persistence")
        if "--vertical" not in sys.argv:
            full(page, context, browser, item, request)
        row(page, item).get_by_role("button", name=re.compile(r"^(Details|Detail)$")).click()
        dialog = page.get_by_role("dialog")
        expect(dialog).to_be_visible()
        for _ in range(10):
            page.keyboard.press("Tab")
            assert dialog.evaluate("el => el.contains(document.activeElement)"), "Detail focus escaped"
        page.keyboard.press("Escape")
        expect(dialog).not_to_be_visible()
        assert page.evaluate("document.activeElement.tagName === 'BUTTON'"), "Detail did not return focus"
        for width, height in ((1440, 1000), (390, 844)):
            page.set_viewport_size({"width": width, "height": height})
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "Products page overflow"
        assert not errors, "Browser page errors observed"
        browser.close()
    print("PASS: Products desktop/mobile, reduced motion, detail keyboard/Escape/focus return; captured fixture cleanup")


if __name__ == "__main__":
    try:
        run()
    finally:
        cleanup()
