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


def close_context(context):
    context.unroute_all(behavior="wait")
    context.close()


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


def row_action(page, item, name):
    row(page, item).get_by_role("button", name=re.compile(r"^(Actions|Aksi):")).click()
    page.get_by_role("menuitem", name=name).click()


def table_layout(page, item):
    for language in ("id", "en"):
        page.evaluate("language => localStorage.setItem('stockos_language', language)", language)
        page.reload()
        for width in (1440, 1024, 768, 390, 320):
            page.set_viewport_size({"width": width, "height": 1000})
            found = row(page, item)
            trigger = found.get_by_role("button", name=re.compile(r"^Aksi:" if language == "id" else r"^Actions:"))
            expect(trigger).to_be_visible()
            assert found.bounding_box()["height"] <= 100, "Product actions inflated row height"
            overflow = page.evaluate("""() => ({width: innerWidth, scroll: document.documentElement.scrollWidth, outside: [...document.querySelectorAll('body *')].filter(el => { const r = el.getBoundingClientRect(); return r.right > innerWidth + 1 && r.width > 0; }).slice(0, 12).map(el => ({tag: el.tagName, class: String(el.className).slice(0, 120), path: (() => { let p = el.tagName; let n = el.parentElement; let d = 0; while (n && n !== document.body && d < 4) { p = n.tagName + '>' + p; n = n.parentElement; d++; } return p; })(), right: Math.round(el.getBoundingClientRect().right)}))})""")
            assert overflow["scroll"] <= width, f"Products overflow at {width}px: {overflow}"
            trigger.focus()
            trigger.press("ArrowDown")
            menu = page.get_by_role("menu")
            expect(menu).to_be_visible()
            expect(menu.get_by_role("menuitem")).to_have_count(5)
            sold = menu.get_by_role("menuitem", name=re.compile(r"^(Stock Out|Stok Keluar) —"))
            assert sold.is_disabled() == bool(item["archivedAt"] or item["currentStock"] == 0), "Sold action disabled rule changed"
            box = menu.bounding_box()
            assert box["x"] >= 0 and box["x"] + box["width"] <= width, "Actions menu outside viewport"
            page.keyboard.press("Escape")
            expect(menu).not_to_be_visible()
            expect(trigger).to_be_focused()
            if width in (1440, 390):
                page.screenshot(path=str(Path(sys.argv[2]).parent / f"products-layout-{language}-{width}.png"), full_page=True)
    page.evaluate("localStorage.setItem('stockos_language', 'id')")
    page.reload()
    page.set_viewport_size({"width": 1440, "height": 1000})
    row(page, item)
    print("PASS: compact product rows, five viewport widths, both languages, menu keyboard/bounds/disabled state")


def movement(page, item, kind, quantity, purchase=None, cartons=None):
    row_action(page, item, re.compile(r"^(Stock In|Stok Masuk) —" if kind == "in" else r"^(Stock Out|Stok Keluar) —"))
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
    row_action(page, item, re.compile(r"^(Edit|Ubah)$"))
    expect(page.locator("#edit-sku")).to_be_disabled()
    expect(page.locator("#edit-unit")).to_be_disabled()
    page.locator("#edit-selling-price").fill(str(price))
    with page.expect_request(is_mutation) as posted:
        page.get_by_role("dialog").locator('button[type="submit"]').click()
    request = posted.value
    expect(page.get_by_role("dialog")).not_to_be_visible(timeout=20000)
    return product(item["sku"]), request


def full(page, context, browser, item, create_request):
    zero, _ = add(page, "ZERO-" + "X" * 35, name="Produk uji dengan nama panjang " * 3)
    assert zero["currentStock"] == 0 and history(zero)["total"] == 0
    table_layout(page, zero)
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
    close_context(anonymous)
    other_context = browser.new_context()
    other = login(other_context)
    # Two real sessions: stale draft remains open after metadata changed elsewhere.
    row_action(other, item, re.compile(r"^(Edit|Ubah)$"))
    other.locator("#edit-selling-price").fill("77777")
    item, _ = edit(page, item, 88888)
    stale = dict(json.loads(edit_request.post_data)[0], requestId=str(uuid.uuid4()))
    print("REGRESSION secondary POST /products before context shutdown", flush=True)
    assert direct(other_context, edit_request, stale)["code"] == "VERSION_CONFLICT"
    other.get_by_role("dialog").locator('button[type="submit"]').click()
    expect(other.get_by_role("alert")).to_be_visible(timeout=20000)
    assert other.locator("#edit-selling-price").input_value() == "77777"
    assert product(item["sku"])["sellingPrice"] == "88888"
    close_context(other_context)
    print("REGRESSION primary POST /products after secondary context shutdown", flush=True)
    assert direct(context, edit_request, stale)["code"] == "VERSION_CONFLICT"
    # Replay old committed receipt after later sale/edit: old snapshot must not replace current state.
    before = history(item)
    replayed = direct(context, receipt)
    assert replayed["ok"] is True and replayed["replayed"] is True
    assert history(item) == before and product(item["sku"])["currentStock"] == 15
    # Drop browser response only after actual server commit; retry must preserve payload/request ID.
    row_action(page, item, re.compile(r"^(Stock In|Stok Masuk) —"))
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


def lifecycle(page, context, browser):
    # Archive/reactivate round trip: zero-stock gate, identity/history retention, stale/uncertain handling.
    zero, _ = add(page, "ZERO")
    assert zero["currentStock"] == 0 and zero["archivedAt"] is None
    before_history = history(zero)

    # Nonzero-stock rejection: dialog blocks submit, product unchanged.
    free, _ = add(page, "FREE", 2, 0)
    assert free["currentStock"] == 2 and free["archivedAt"] is None
    row_action(page, free, re.compile(r"^(Archive|Arsipkan)$"))
    dialog = page.get_by_role("dialog")
    expect(dialog.get_by_text(re.compile(r"Stock must be zero|Stok harus nol"))).to_be_visible()
    expect(dialog.get_by_role("button", name=re.compile(r"^(Archive|Arsipkan)$"))).to_be_disabled()
    page.keyboard.press("Escape")
    expect(dialog).not_to_be_visible()
    assert product(free["sku"])["archivedAt"] is None

    # Zero-stock archive: committed, keeps identity/history, disappears from active view.
    row_action(page, zero, re.compile(r"^(Archive|Arsipkan)$"))
    expect(dialog.get_by_text(re.compile(r"keeps SKU and history|Arsip mempertahankan"))).to_be_visible()
    with page.expect_request(is_mutation) as archived_request:
        dialog.get_by_role("button", name=re.compile(r"^(Archive|Arsipkan)$")).click()
    expect(dialog).not_to_be_visible(timeout=20000)
    captured_zero = product(zero["sku"])
    assert captured_zero["archivedAt"]
    assert history(zero)["total"] == before_history["total"]
    assert product(free["sku"])["archivedAt"] is None
    row(page, captured_zero).get_by_role("button", name=re.compile(r"^(Actions|Aksi):")).click()
    for label in (r"^(Edit|Ubah)$", r"^(Stock In|Stok Masuk) —", r"^(Stock Out|Stok Keluar) —"):
        expect(page.get_by_role("menuitem", name=re.compile(label))).to_have_attribute("aria-disabled", "true")
    page.keyboard.press("Escape")

    # Active list hides it; archived view shows it; identity (sku, id) unchanged.
    page.goto(BASE + "/products")
    # Table rendered with data (free is active) before asserting zero's absence.
    expect(page.get_by_role("cell", name=free["sku"], exact=False).first).to_be_visible()
    assert page.get_by_role("cell", name=zero["sku"], exact=False).count() == 0
    row(page, zero)
    assert product(zero["sku"])["id"] == zero["id"]

    # Detail sheet for archived product: movement/edit disabled, reactivate offered.
    row_action(page, zero, re.compile(r"^(Details|Detail)$"))
    sheet = page.get_by_role("dialog")
    expect(sheet.get_by_text(re.compile(r"Archived|Diarsipkan"))).to_be_visible()
    expect(sheet.get_by_role("button", name=re.compile(r"^(Stock In|Stok Masuk)$"))).to_be_disabled()
    expect(sheet.get_by_role("button", name=re.compile(r"^(Stock Out|Stok Keluar)"))).to_be_disabled()
    expect(sheet.get_by_role("button", name=re.compile(r"^(Edit Item|Edit|Ubah Item)$"))).to_be_disabled()
    page.keyboard.press("Escape")
    expect(sheet).not_to_be_visible()

    # Cross-route reload: archived state survives navigation.
    page.reload()
    row(page, zero)
    assert product(zero["sku"])["archivedAt"]

    # Same committed archive request replays idempotently; identity unchanged.
    replayed_archive = direct(context, archived_request.value)
    assert replayed_archive["ok"] is True and replayed_archive["replayed"] is True
    assert product(zero["sku"])["id"] == zero["id"]

    # Stale archive replay (new ID, bumped version) on archived product: guard order rejects as archived.
    stale = dict(json.loads(archived_request.value.post_data)[0])
    stale["requestId"] = str(uuid.uuid4())
    stale["expectedMetadataVersion"] = str(int(zero["metadataVersion"]) + 5)
    assert direct(context, archived_request.value, stale)["code"] == "PRODUCT_ARCHIVED"

    # Reactivate: same row button flips label, archivedAt cleared, identity/history retained.
    row_action(page, zero, re.compile(r"^(Reactivate|Aktifkan kembali)$"))
    with page.expect_request(is_mutation) as reactivated_request:
        dialog.get_by_role("button", name=re.compile(r"^(Reactivate|Aktifkan kembali)$")).click()
    expect(dialog).not_to_be_visible(timeout=20000)
    revived = product(zero["sku"])
    assert revived["archivedAt"] is None and revived["id"] == zero["id"]
    assert history(zero)["total"] == before_history["total"]

    # Same stale replay on now-active product (reactivate bumped metadata): version guard fires.
    assert direct(context, archived_request.value, stale)["code"] == "VERSION_CONFLICT"

    # Lost response after server commit: uncertain state, frozen retry payload/ID.
    page.goto(BASE + "/products")
    row_action(page, zero, re.compile(r"^(Archive|Arsipkan)$"))
    expect(dialog.get_by_role("button", name=re.compile(r"^(Archive|Arsipkan)$"))).to_be_enabled()
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
    dialog.get_by_role("button", name=re.compile(r"^(Archive|Arsipkan)$")).click()
    expect(page.get_by_role("alert")).to_be_visible(timeout=20000)
    page.unroute("**/products*", lose_response)
    with page.expect_request(is_mutation) as retry:
        page.get_by_role("dialog").get_by_role("button", name=re.compile(r"^(Retry same request|Ulangi permintaan sama)$")).click()
    assert json.loads(retry.value.post_data) == json.loads(dropped[0].post_data), "Lifecycle retry changed payload/ID"
    expect(page.get_by_role("dialog")).not_to_be_visible(timeout=20000)
    assert product(zero["sku"])["archivedAt"]
    # Pending uncertainty resolved: product stays archived until explicit reactivate.
    print("PASS: zero-stock archive gate, nonzero rejection, identity/history retention, reload/cross-route, stale VERSION_CONFLICT, lost-response retry")

def creation_defaults(page):
    settings = rpc("get_shop_settings", {})
    request_id = str(uuid.uuid4())
    REQUESTS.add(request_id)
    payload = {key: settings[key] for key in ("name", "ownerName", "address", "phone", "timezone")}
    payload.update(requestId=request_id, expectedVersion=settings["version"], defaultUnit="Bungkus", defaultMinStock=27)
    rpc("update_shop_settings", payload)
    created = []
    for path in ("/products", "/"):
        page.goto(BASE + path)
        for width in (1440, 390):
            page.set_viewport_size({"width": width, "height": 1000})
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"Defaults route {path} overflow at {width}px"
        page.set_viewport_size({"width": 1440, "height": 1000})
        page.get_by_role("button", name=re.compile(r"Tambah Produk Baru|Tambah Produk|Add Product")).first.click()
        dialog = page.get_by_role("dialog")
        expect(dialog.locator("#product-name")).to_be_visible()
        expect(dialog.locator("#product-lookup, #product-selection")).to_have_count(0)
        expect(dialog.get_by_role("button", name=re.compile(r"Restock|Isi ulang", re.I))).to_have_count(0)
        expect(page.locator("#product-pcs")).to_have_value("0")
        expect(page.locator("#product-unit")).to_have_value("Bungkus")
        expect(page.locator("#product-min-stock")).to_have_value("27")
        page.locator("#product-unit").fill("Botol")
        page.locator("#product-min-stock").fill("3")
        sku = f"{PREFIX}-DEFAULT-{'HOME' if path == '/' else 'PRODUCTS'}"
        for field, value in {"name": "Creation defaults proof", "sku": sku, "category": "Browser proof", "sell": "10000"}.items():
            page.locator(f"#product-{field}").fill(value)
        page.get_by_role("dialog").locator('button[type="submit"]').click()
        expect(page.get_by_role("heading", name=re.compile(r"Produk Berhasil Ditambahkan|Product Added Successfully"))).to_be_visible(timeout=30000)
        item = product(sku)
        assert item["unit"] == "Botol" and item["minStock"] == 3
        created.append(sku)
        page.get_by_role("button", name=re.compile(r"Tambah Produk Lain|Add Another", re.I)).click()
        expect(page.locator("#product-unit")).to_have_value("Bungkus")
        expect(page.locator("#product-min-stock")).to_have_value("27")
        page.keyboard.press("Escape")
        expect(page.get_by_role("dialog")).not_to_be_visible()
    latest = rpc("get_shop_settings", {})
    request_id = str(uuid.uuid4())
    REQUESTS.add(request_id)
    payload.update(requestId=request_id, expectedVersion=latest["version"], defaultUnit="Pcs", defaultMinStock=15)
    rpc("update_shop_settings", payload)
    for sku in created:
        item = product(sku)
        assert item["unit"] == "Botol" and item["minStock"] == 3, "New Settings changed existing product"
    print("PASS: Settings defaults on Products/Dashboard, user overrides, Add Another, existing products unchanged, desktop/mobile")


def run():
    provision()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="msedge")
        context = browser.new_context(viewport={"width": 1440, "height": 1000}, reduced_motion="reduce")
        page = login(context)
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        if "--defaults" in sys.argv:
            creation_defaults(page)
            browser.close()
            return
        if "--lifecycle" in sys.argv:
            lifecycle(page, context, browser)
            browser.close()
            return
        item, request = add(page, "VERTICAL", 10, 30000)
        assert item["currentStock"] == 10 and item["inventoryCostValue"] == "30000.000000"
        page.reload()
        page.goto(BASE + "/inventory")
        expect(page.locator("body")).not_to_contain_text(re.compile(r"demo", re.I))
        row(page, item)
        second = browser.new_context()
        other = login(second)
        row(other, item)
        assert product(item["sku"])["id"] == item["id"]
        close_context(second)
        print("PASS: verified login, actual action create, exact opening cost, reload/navigation/new-session persistence")
        if "--vertical" not in sys.argv:
            full(page, context, browser, item, request)
        row_action(page, item, re.compile(r"^(Details|Detail)$"))
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
