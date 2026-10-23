"""python -I scripts/test-inventory.py http://localhost:3002 <stock-proof-status.json>
Edge + Next Server Actions + real isolated Supabase for Ticket 4 persistent Inventory.
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
EMAIL, PASSWORD = f"inventory-browser-{RUN}@example.test", f"Local-proof-{uuid.uuid4()}!"
SHOP, PREFIX = f"Inventory browser proof {RUN}", f"INV-{RUN[:8].upper()}"
PRODUCTS, REQUESTS = set(), set()
USER = TOKEN = None
PREPARED = False
PINNED_CONTAINER_ID = None


def docker(*args):
    result = subprocess.run(["docker", *args], capture_output=True, text=True, timeout=30)
    assert result.returncode == 0, "Dedicated Docker command failed (output suppressed)"
    return result.stdout.strip()


def guard():
    global PINNED_CONTAINER_ID
    item = json.loads(docker("inspect", CONTAINER))[0]
    if PINNED_CONTAINER_ID is None:
        PINNED_CONTAINER_ID = item["Id"]
    assert item["Id"] == PINNED_CONTAINER_ID, "Fixture container changed; refuse writes"
    assert item["Name"] == f"/{CONTAINER}"
    assert item["Config"]["Labels"]["com.supabase.cli.project"] == "stockos-stock-proof"
    assert item["State"]["Running"] is True
    assert any(binding["HostPort"] == "55542" for binding in item["NetworkSettings"]["Ports"]["5432/tcp"])


def sql(statement):
    guard()
    result = subprocess.run(["docker", "exec", "-i", CONTAINER, "psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres"], input=statement, capture_output=True, text=True, timeout=30)
    assert result.returncode == 0, "Dedicated SQL failed (output suppressed)"
    return result.stdout.strip()


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
    claim = http("/rest/v1/rpc/stockos_claim_owner", {"p_email": EMAIL, "p_name": "Inventory browser proof", "p_shop": SHOP, "p_timezone": "Asia/Jakarta"}, admin=True)
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
      UPDATE stockos_private.owner_registration SET state = 'unclaimed', attempt_id = NULL,
        email = NULL, auth_user_id = NULL, provisioned_at = NULL, bound_at = NULL, updated_at = now() WHERE id = 1;
      DELETE FROM auth.users WHERE id = {user};
    COMMIT;""")


def login(context):
    page = context.new_page()
    page.goto(BASE + "/login")
    page.locator("#email").fill(EMAIL)
    page.locator("#password").fill(PASSWORD)
    page.locator('button[type="submit"]').click()
    page.wait_for_url(re.compile(r"/($|products|inventory)"), timeout=20000)
    return page


def is_mutation(request):
    if request.method != "POST" or not request.headers.get("next-action"):
        return False
    try:
        args = json.loads(request.post_data)
        return isinstance(args[0], dict) and "requestId" in args[0]
    except (TypeError, ValueError, IndexError):
        return False


def capture(request):
    if is_mutation(request):
        REQUESTS.add(str(uuid.UUID(json.loads(request.post_data)[0]["requestId"])))


def action_result(text):
    for line in text.splitlines():
        if ":" not in line:
            continue
        try:
            data = json.loads(line.split(":", 1)[1])
        except ValueError:
            continue
        if isinstance(data, dict) and isinstance(data.get("ok"), bool):
            return data
    raise AssertionError("Server Action response missing safe result")


def get_product(product_id):
    return rpc("get_product", {"id": product_id})


def history(product_id):
    return rpc("list_inventory_events", {"productId": product_id, "pageSize": 100})


def select_movement_product(page, product):
    page.locator("#itemSelect").click()
    page.get_by_role("option").filter(has_text=product["sku"]).click()


def open_opname(page, product):
    page.goto(BASE + "/inventory")
    row = page.get_by_role("row").filter(has=page.get_by_text(product["sku"], exact=True))
    row.locator("button[title*='Stock Adjustment'], button[title*='Penyesuaian']").click()
    expect(page.get_by_role("dialog")).to_be_visible()
    expect(page.get_by_role("dialog")).to_contain_text(product["sku"])


def assert_close_blocked(page):
    dialog = page.get_by_role("dialog")
    page.keyboard.press("Escape")
    expect(dialog).to_be_visible()
    dialog.get_by_role("button", name="Close dialog", exact=True).click()
    expect(dialog).to_be_visible()
    page.mouse.click(5, 5)
    expect(dialog).to_be_visible()
    expect(dialog.get_by_role("button", name=re.compile(r"^(Cancel|Batal)$"))).to_be_disabled()


def lost_response(page, product, opname=False):
    before = history(product["id"])["total"]
    stock_before = get_product(product["id"])["currentStock"]
    if opname:
        open_opname(page, product)
        page.locator("#newStock").fill(str(stock_before + 1))
    else:
        page.goto(BASE + "/inventory")
        page.get_by_role("button", name=re.compile(r"Record Stock Movement|Catat Pergerakan", re.I)).click()
        select_movement_product(page, product)
        page.locator("#quantity").fill("1")
        page.locator("#purchaseTotal").fill("0")
    dropped = []

    def lose(route):
        if is_mutation(route.request) and not dropped:
            result = route.fetch()
            assert action_result(result.text())["ok"] is True
            dropped.append(route.request)
            route.abort("failed")
        else:
            route.continue_()

    page.route("**/inventory*", lose)
    dialog = page.get_by_role("dialog")
    dialog.locator('button[type="submit"]').click()
    expect(dialog.get_by_role("alert")).to_be_visible(timeout=20000)
    assert_close_blocked(page)
    expect(page.locator("#newStock" if opname else "#quantity")).to_have_value(str(stock_before + 1) if opname else "1")
    page.unroute("**/inventory*", lose)
    with page.expect_request(is_mutation) as retry:
        dialog.get_by_role("button", name=re.compile(r"^(Retry same request|Ulangi permintaan sama)$")).click()
    assert json.loads(retry.value.post_data) == json.loads(dropped[0].post_data)
    expect(dialog).not_to_be_visible(timeout=20000)
    assert get_product(product["id"])["currentStock"] == stock_before + 1
    assert history(product["id"])["total"] == before + 1


def hardening(page, browser, product, empty_product):
    lost_response(page, product)
    lost_response(page, product, opname=True)
    other_context = browser.new_context()
    other = login(other_context)
    other.on("request", capture)
    open_opname(other, product)
    other.locator("#newStock").fill("9")
    other.locator("#adjNote").fill("Keep physical-count draft")
    # Independent owner session sells all stock while stale count stays open.
    page.goto(BASE + "/inventory")
    page.get_by_role("button", name=re.compile(r"Record Stock Movement|Catat Pergerakan", re.I)).click()
    page.get_by_role("dialog").get_by_role("button", name=re.compile(r"Stock Out|Stok Keluar", re.I)).click()
    select_movement_product(page, product)
    page.locator("#quantity").fill(str(get_product(product["id"])["currentStock"]))
    page.get_by_role("dialog").locator('button[type="submit"]').click()
    expect(page.get_by_role("dialog")).not_to_be_visible(timeout=20000)
    failed_read = []

    def fail_conflict_read(route):
        if route.request.method == "POST" and route.request.headers.get("next-action"):
            try:
                args = json.loads(route.request.post_data)
            except (TypeError, ValueError):
                args = []
            if args and isinstance(args[0], dict) and args[0] == {"id": product["id"]} and not failed_read:
                failed_read.append(True)
                route.abort("failed")
                return
        route.continue_()

    other.route("**/inventory*", fail_conflict_read)
    dialog = other.get_by_role("dialog")
    dialog.locator('button[type="submit"]').click()
    expect(dialog.get_by_role("alert")).to_be_visible(timeout=20000)
    expect(dialog.locator('button[type="submit"]')).to_be_disabled()
    expect(other.locator("#newStock")).to_have_value("9")
    expect(other.locator("#adjNote")).to_have_value("Keep physical-count draft")
    assert failed_read, "Conflict latest-read failure was not exercised"
    other.unroute("**/inventory*", fail_conflict_read)
    dialog.get_by_role("button", name=re.compile(r"^(Retry same request|Ulangi permintaan sama)$")).click()
    reviewed = dialog.get_by_role("button", name=re.compile(r"Reviewed|Sudah ditinjau", re.I))
    expect(reviewed).to_be_visible(timeout=20000)
    expect(dialog.locator('button[type="submit"]')).to_be_disabled()
    reviewed.click()
    expect(other.locator("#newStock")).to_have_value("")
    expect(other.locator("#adjNote")).to_have_value("Keep physical-count draft")
    other.locator("#newStock").fill("2")
    expect(dialog.get_by_text("+2 Pcs", exact=True)).to_be_visible()
    expect(other.locator("#foundCost")).to_be_visible()
    other.locator("#foundCost").fill("6000")
    expected_version = get_product(product["id"])["stockVersion"]
    with other.expect_request(is_mutation) as posted:
        dialog.locator('button[type="submit"]').click()
    payload = json.loads(posted.value.post_data)[0]
    assert payload["expectedStockVersion"] == expected_version
    expect(dialog).not_to_be_visible(timeout=20000)
    latest = get_product(product["id"])
    assert latest["currentStock"] == 2 and latest["inventoryCostValue"] == "6000.000000"
    # Changing selection remounts count/review state belonging to previous product.
    other.locator("section").filter(has=other.locator("h2")).get_by_role("button", name=re.compile(r"^(Stock Adjustment|Penyesuaian Stok)$")).click()
    other.locator("#itemSelect").select_option(product["id"])
    other.locator("#newStock").fill("7")
    other.locator("#adjNote").fill("Previous product note")
    other.locator("#itemSelect").select_option(empty_product["id"])
    expect(other.locator("#newStock")).to_have_value("0")
    expect(other.locator("#adjNote")).to_have_value("")
    other.locator("#newStock").fill("1")
    expect(other.locator("#foundCost")).to_have_value("0")
    other.keyboard.press("Escape")
    expect(other.get_by_role("dialog")).not_to_be_visible()
    other.unroute_all(behavior="wait")
    other_context.unroute_all(behavior="wait")
    other_context.close()
    print("PASS: movement/opname lost-response close guards and exact replay; two-session conflict read retry, preserved note, explicit recount, current found-cost snapshot")


def open_cost(page, product):
    page.goto(BASE + "/inventory")
    row = page.get_by_role("row").filter(has=page.get_by_text(product["sku"], exact=True))
    row.get_by_role("button", name=re.compile(r"^(Koreksi modal|Correct inventory cost)$")).click()
    expect(page.get_by_role("dialog")).to_be_visible()
    expect(page.locator("#replacementTotalCost")).to_be_visible(timeout=20000)


def cost_validation(page, product, empty_product):
    before = get_product(product["id"])
    events = history(product["id"])
    posted = []
    page.on("request", lambda request: posted.append(request) if is_mutation(request) else None)
    open_cost(page, product)
    dialog = page.get_by_role("dialog")
    total, reason = page.locator("#replacementTotalCost"), page.locator("#costReason")
    total.fill("8000")
    dialog.locator('button[type="submit"]').click()
    expect(dialog).to_be_visible()
    assert not posted, "Missing reason must not submit"
    reason.fill("   ")
    dialog.locator('button[type="submit"]').click()
    expect(dialog.get_by_role("alert")).to_be_visible()
    reason.fill("Validation proof")
    for invalid in ("-1", "1.5", "1e3", "1,000", "1000000000001"):
        total.fill(invalid)
        dialog.locator('button[type="submit"]').click()
        expect(total).to_have_value(invalid)
        expect(dialog).to_be_visible()
        assert not posted, "Invalid whole-IDR total must not submit"
    total.fill("")
    total.focus()
    page.keyboard.insert_text("10000000000000")
    expect(total).to_have_value("10000000000000")
    dialog.locator('button[type="submit"]').click()
    assert not posted, "Oversized pasted total must not be truncated into a valid mutation"
    assert get_product(product["id"]) == before and history(product["id"]) == events
    page.keyboard.press("Escape")
    open_cost(page, empty_product)
    dialog = page.get_by_role("dialog")
    page.locator("#replacementTotalCost").fill("1")
    page.locator("#costReason").fill("Zero stock proof")
    dialog.locator('button[type="submit"]').click()
    expect(dialog.get_by_role("alert")).to_contain_text(re.compile(r"Stok nol|Zero stock"))
    assert not posted and get_product(empty_product["id"])["inventoryCostValue"] == "0.000000"
    empty_events = history(empty_product["id"])["total"]
    page.locator("#replacementTotalCost").fill("0")
    dialog.locator('button[type="submit"]').click()
    expect(dialog).not_to_be_visible(timeout=20000)
    assert history(empty_product["id"])["total"] == empty_events + 1
    open_cost(page, product)
    dialog = page.get_by_role("dialog")
    page.locator("#replacementTotalCost").fill("0")
    page.locator("#costReason").fill("Barang gratis pengujian")
    for width in (1440, 390):
        page.set_viewport_size({"width": width, "height": 1000})
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "Cost dialog overflow"
        assert dialog.evaluate("element => element.scrollWidth <= element.clientWidth"), "Cost content overflow"
        page.wait_for_function("element => { const r = element.getBoundingClientRect(); return r.left >= 15 && r.right <= innerWidth - 15 && Math.abs(r.width - Math.min(448, innerWidth - 32)) < 1; }", arg=dialog.element_handle())
        page.screenshot(path=str(Path(sys.argv[2]).parent / f"cost-dialog-{width}.png"))
    page.set_viewport_size({"width": 1440, "height": 1000})
    dialog.locator('button[type="submit"]').click()
    expect(dialog).not_to_be_visible(timeout=20000)
    latest = get_product(product["id"])
    assert latest["currentStock"] == 2 and latest["inventoryCostValue"] == "0.000000"
    assert latest["averagePurchaseCost"] == "0.000000"
    print("PASS: cost validation rejects invalid totals/reasons without mutations; zero stock and genuinely zero cost supported")


def cost_lost_response(page, browser, product):
    before = get_product(product["id"])
    events = history(product["id"])["total"]
    open_cost(page, product)
    page.locator("#replacementTotalCost").fill("10000")
    page.locator("#costReason").fill("Frozen cost draft")
    dropped = []

    def lose(route):
        if is_mutation(route.request) and not dropped:
            response = route.fetch()
            assert action_result(response.text())["ok"] is True
            dropped.append(json.loads(route.request.post_data))
            route.abort("failed")
        else:
            route.continue_()

    page.route("**/inventory*", lose)
    dialog = page.get_by_role("dialog")
    dialog.locator('button[type="submit"]').evaluate("button => { button.click(); button.click(); }")
    expect(dialog.get_by_role("alert")).to_be_visible(timeout=20000)
    assert_close_blocked(page)
    expect(page.locator("#replacementTotalCost")).to_be_disabled()
    expect(page.locator("#replacementTotalCost")).to_have_value("10000")
    expect(page.locator("#costReason")).to_be_disabled()
    expect(page.locator("#costReason")).to_have_value("Frozen cost draft")
    committed = get_product(product["id"])
    assert int(committed["stockVersion"]) == int(before["stockVersion"]) + 1
    assert history(product["id"])["total"] == events + 1
    # Live value advances beyond the frozen successful receipt before replay.
    other_context = browser.new_context()
    other = None
    try:
        other = login(other_context)
        other.on("request", capture)
        open_cost(other, product)
        other.locator("#replacementTotalCost").fill("12000")
        other.locator("#costReason").fill("Later cost correction")
        other.get_by_role("dialog").locator('button[type="submit"]').click()
        expect(other.get_by_role("dialog")).not_to_be_visible(timeout=20000)
    finally:
        if other:
            other.unroute_all(behavior="wait")
        other_context.unroute_all(behavior="wait")
        other_context.close()
    live = get_product(product["id"])
    assert live["inventoryCostValue"] == "12000.000000"
    page.unroute_all(behavior="wait")
    with page.expect_request(is_mutation) as retry:
        dialog.get_by_role("button", name=re.compile(r"^(Retry same request|Ulangi permintaan sama)$")).click()
    assert json.loads(retry.value.post_data) == dropped[0], "Cost replay changed UUID/payload/intent"
    expect(dialog).not_to_be_visible(timeout=20000)
    assert get_product(product["id"]) == live and history(product["id"])["total"] == events + 2
    open_cost(page, product)
    expect(page.get_by_role("dialog")).to_contain_text("Rp 12.000")
    expect(page.locator("#replacementTotalCost")).to_have_value("")
    page.keyboard.press("Escape")
    print("PASS: lost cost response freezes drafts/close guards; identical replay adds no evidence and reopen reads live value")


def cost_conflict(page, browser, product):
    other_context = browser.new_context()
    other = None
    try:
        other = login(other_context)
        other.on("request", capture)
        open_cost(other, product)
        other.locator("#replacementTotalCost").fill("15000")
        other.locator("#costReason").fill("Keep cost reason")
        open_opname(page, product)
        page.locator("#newStock").fill("3")
        page.locator("#adjNote").fill("Concurrent physical count")
        page.get_by_role("dialog").locator('button[type="submit"]').click()
        expect(page.get_by_role("dialog")).not_to_be_visible(timeout=20000)
        current = get_product(product["id"])
        events = history(product["id"])
        assert current["currentStock"] == 3 and current["inventoryCostValue"] == "18000.000000"
        failed_read = []

        def fail_read(route):
            request = route.request
            if request.method == "POST" and request.headers.get("next-action") and not is_mutation(request) and not failed_read:
                if json.loads(request.post_data)[0] == {"id": product["id"]}:
                    failed_read.append(True)
                    route.abort("failed")
                    return
            route.continue_()

        other.route("**/inventory*", fail_read)
        dialog = other.get_by_role("dialog")
        with other.expect_request(is_mutation) as stale:
            dialog.locator('button[type="submit"]').click()
        expect(dialog.get_by_role("alert")).to_be_visible(timeout=20000)
        expect(dialog.locator('button[type="submit"]')).to_be_disabled()
        expect(other.locator("#replacementTotalCost")).to_have_value("15000")
        expect(other.locator("#costReason")).to_have_value("Keep cost reason")
        assert failed_read and get_product(product["id"]) == current and history(product["id"]) == events
        other.unroute_all(behavior="wait")
        retries = []
        other.on("request", lambda request: retries.append(request) if is_mutation(request) else None)
        dialog.get_by_role("button", name=re.compile(r"^(Retry same request|Ulangi permintaan sama)$")).click()
        reviewed = dialog.get_by_role("button", name=re.compile(r"Reviewed|Sudah ditinjau", re.I))
        expect(reviewed).to_be_visible(timeout=20000)
        assert not retries, "Conflict reload must read only"
        expect(dialog).to_contain_text("Rp 18.000")
        expect(dialog.locator('button[type="submit"]')).to_be_disabled()
        reviewed.click()
        expect(other.locator("#replacementTotalCost")).to_have_value("")
        expect(other.locator("#costReason")).to_have_value("Keep cost reason")
        expect(dialog).to_contain_text("3 Pcs")
        other.locator("#replacementTotalCost").fill("15000")
        with other.expect_request(is_mutation) as fresh:
            dialog.locator('button[type="submit"]').click()
        old_payload = json.loads(stale.value.post_data)[0]
        payload = json.loads(fresh.value.post_data)[0]
        assert payload["requestId"] != old_payload["requestId"]
        assert payload["expectedStockVersion"] == current["stockVersion"]
        expect(dialog).not_to_be_visible(timeout=20000)
        latest = get_product(product["id"])
        assert latest["currentStock"] == 3 and latest["inventoryCostValue"] == "15000.000000"
        assert latest["averagePurchaseCost"] == "5000.000000"
        assert int(latest["stockVersion"]) == int(current["stockVersion"]) + 1
        assert history(product["id"])["total"] == events["total"] + 1
    finally:
        if other:
            other.unroute_all(behavior="wait")
        other_context.unroute_all(behavior="wait")
        other_context.close()
    print("PASS: stale cost draft preserves reason/total; failed latest read retries read-only; explicit review adopts current quantity/version with new UUID")


def cost_read_retry(page, product):
    open_cost(page, product)
    page.locator("#replacementTotalCost").fill("21000")
    page.locator("#costReason").fill("Known commit read retry")
    mutations, reads = [], []

    def fail_read(route):
        request = route.request
        if is_mutation(request):
            mutations.append(request)
        elif request.method == "POST" and request.headers.get("next-action"):
            if json.loads(request.post_data)[0] == {"id": product["id"]}:
                reads.append(request)
                route.abort("failed")
                return
        route.continue_()

    page.route("**/inventory*", fail_read)
    dialog = page.get_by_role("dialog")
    dialog.locator('button[type="submit"]').click()
    expect(dialog.get_by_role("alert")).to_contain_text(re.compile(r"mutasi tidak diulang|no duplicate mutation"), timeout=20000)
    assert len(mutations) == 1 and reads
    assert_close_blocked(page)
    expect(page.locator("#replacementTotalCost")).to_be_disabled()
    expect(page.locator("#replacementTotalCost")).to_have_value("21000")
    expect(page.locator("#costReason")).to_have_value("Known commit read retry")
    committed, events = get_product(product["id"]), history(product["id"])
    assert committed["inventoryCostValue"] == "21000.000000"
    page.unroute_all(behavior="wait")
    read_retries = []

    def observe(route):
        if is_mutation(route.request):
            mutations.append(route.request)
        elif route.request.method == "POST" and route.request.headers.get("next-action"):
            read_retries.append(route.request)
        route.continue_()

    page.route("**/inventory*", observe)
    dialog.get_by_role("button", name=re.compile(r"^(Retry same request|Ulangi permintaan sama)$")).click()
    expect(dialog).not_to_be_visible(timeout=20000)
    assert len(mutations) == 1 and read_retries, "Known commit retry must read without another mutation"
    assert get_product(product["id"]) == committed and history(product["id"]) == events
    page.unroute_all(behavior="wait")
    # Initial read failure exposes no stale editable form; retry reads current state.
    page.goto(BASE + "/inventory")
    failed = []

    def fail_initial(route):
        request = route.request
        if request.method == "POST" and request.headers.get("next-action") and not is_mutation(request):
            if json.loads(request.post_data)[0] == {"id": product["id"]}:
                failed.append(True)
                route.abort("failed")
                return
        route.continue_()

    page.route("**/inventory*", fail_initial)
    row = page.get_by_role("row").filter(has=page.get_by_text(product["sku"], exact=True))
    row.get_by_role("button", name=re.compile(r"^(Koreksi modal|Correct inventory cost)$")).click()
    expect(dialog.get_by_role("alert")).to_be_visible(timeout=20000)
    expect(page.locator("#replacementTotalCost")).to_have_count(0)
    assert failed
    page.unroute_all(behavior="wait")
    dialog.get_by_role("button", name=re.compile(r"^(Retry same request|Ulangi permintaan sama)$")).click()
    expect(page.locator("#replacementTotalCost")).to_have_value("", timeout=20000)
    expect(dialog).to_contain_text("Rp 21.000")
    page.locator("#replacementTotalCost").focus()
    expect(page.locator("#replacementTotalCost")).to_be_focused()
    page.keyboard.press("Tab")
    expect(page.locator("#costReason")).to_be_focused()
    page.keyboard.press("Escape")
    expect(dialog).not_to_be_visible()
    page.reload()
    open_cost(page, product)
    expect(dialog).to_contain_text("Rp 21.000")
    page.keyboard.press("Escape")
    assert get_product(product["id"]) == committed and history(product["id"]) == events
    print("PASS: known cost commit retries read-only; initial read failure has no stale form, retry/reload and keyboard focus work")


def cost_hardening(page, product):
    before = get_product(product["id"])
    events = history(product["id"])
    assert before["currentStock"] == 2 and before["inventoryCostValue"] == "6000.000000"
    open_cost(page, product)
    page.locator("#replacementTotalCost").fill("8000")
    page.locator("#costReason").fill("Koreksi modal pengujian")
    page.get_by_role("dialog").locator('button[type="submit"]').click()
    expect(page.get_by_role("dialog")).not_to_be_visible(timeout=20000)
    latest = get_product(product["id"])
    assert latest["currentStock"] == 2
    assert latest["inventoryCostValue"] == "8000.000000"
    assert latest["averagePurchaseCost"] == "4000.000000"
    assert latest["metadataVersion"] == before["metadataVersion"]
    assert int(latest["stockVersion"]) == int(before["stockVersion"]) + 1
    after = history(product["id"])
    assert after["total"] == events["total"] + 1
    event = after["items"][0]
    assert event["kind"] == "cost_adjustment" and event["quantityDelta"] == 0
    assert event["costBefore"] == "6000.000000" and event["costAfter"] == "8000.000000"
    assert event["note"] == "Koreksi modal pengujian"
    assert after["items"][1:] == events["items"], "Cost correction must preserve original history"
    open_cost(page, product)
    expect(page.get_by_role("dialog")).to_contain_text("Rp 8.000")
    expect(page.locator("#replacementTotalCost")).to_have_value("")
    page.keyboard.press("Escape")
    page.reload()
    row = page.get_by_role("row").filter(has=page.get_by_text(product["sku"], exact=True))
    row.get_by_title(re.compile(r"Details|Detail", re.I)).click()
    valuation = page.get_by_role("heading", name=re.compile(r"Valuasi & Ekonomi Unit|Valuation & Unit Economics")).locator("..")
    valuation.get_by_role("button", name=re.compile(r"^(Koreksi modal|Correct inventory cost)$")).click()
    expect(page.locator("#replacementTotalCost")).to_be_visible(timeout=20000)
    expect(page.get_by_role("dialog")).to_contain_text("Rp 8.000")
    page.keyboard.press("Escape")
    print("PASS: cost correction changes present valuation only; immutable history and both entrypoints persist")


def open_quantity_correction(page, event):
    page.goto(BASE + "/inventory?tab=movements&pageSize=100")
    row = page.get_by_role("row").filter(has=page.get_by_text(event["reference"], exact=True))
    row.get_by_role("button", name=re.compile(r"^(Koreksi jumlah|Correct quantity)")).click()
    expect(page.locator("#newStock")).to_be_visible(timeout=20000)
    return page.get_by_role("dialog")


def quantity_correction(page, product):
    # Establish a known current baseline after older movements, through normal opname.
    open_opname(page, product)
    page.locator("#newStock").fill("5")
    page.locator("#adjNote").fill("Current quantity baseline")
    page.get_by_role("dialog").locator('button[type="submit"]').click()
    expect(page.get_by_role("dialog")).not_to_be_visible(timeout=20000)
    open_cost(page, product)
    page.locator("#replacementTotalCost").fill("15000")
    page.locator("#costReason").fill("Current cost baseline")
    page.get_by_role("dialog").locator('button[type="submit"]').click()
    expect(page.get_by_role("dialog")).not_to_be_visible(timeout=20000)
    before, events = get_product(product["id"]), history(product["id"])
    original = next(event for event in events["items"] if event["kind"] == "opening")
    assert before["currentStock"] == 5 and before["inventoryCostValue"] == "15000.000000"
    assert events["items"][1]["correctionOfEventId"] is None, "Normal opname must remain unlinked"
    dialog = open_quantity_correction(page, original)
    expect(dialog).to_contain_text(original["id"])
    expect(page.locator("#newStock")).to_have_value("")
    page.locator("#newStock").fill("4")
    page.locator("#adjNote").fill("Correct original quantity against current count")
    with page.expect_request(is_mutation) as posted:
        dialog.locator('button[type="submit"]').click()
    payload = json.loads(posted.value.post_data)[0]
    assert payload["correctionOfEventId"] == original["id"]
    assert payload["productId"] == product["id"] and payload["expectedStockVersion"] == before["stockVersion"]
    expect(dialog).not_to_be_visible(timeout=20000)
    latest, after = get_product(product["id"]), history(product["id"])
    event = after["items"][0]
    assert latest["currentStock"] == 4 and latest["inventoryCostValue"] == "12000.000000"
    assert latest["metadataVersion"] == before["metadataVersion"]
    assert int(latest["stockVersion"]) == int(before["stockVersion"]) + 1
    assert after["total"] == events["total"] + 1 and after["items"][1:] == events["items"]
    assert event["kind"] == "opname" and event["correctionOfEventId"] == original["id"]
    assert (event["quantityBefore"], event["quantityAfter"], event["quantityDelta"]) == (5, 4, -1)
    assert event["note"] == payload["note"]
    page.reload()
    row = page.get_by_role("row").filter(has=page.get_by_text(event["reference"], exact=True))
    expect(row).to_contain_text(original["id"])
    # Correction of correction: the linked opname itself becomes a parent; repeated parent stays allowed.
    dialog = open_quantity_correction(page, event)
    expect(dialog).to_contain_text(event["id"])
    page.locator("#newStock").fill("4")
    page.locator("#adjNote").fill("Repeated parent still allowed")
    with page.expect_request(is_mutation) as second:
        dialog.locator('button[type="submit"]').click()
    second_payload = json.loads(second.value.post_data)[0]
    assert second_payload["correctionOfEventId"] == event["id"] and second_payload["requestId"] != payload["requestId"]
    expect(dialog).not_to_be_visible(timeout=20000)
    latest2, after2 = get_product(product["id"]), history(product["id"])
    assert after2["total"] == after["total"] + 1 and after2["items"][0]["correctionOfEventId"] == event["id"]
    assert after2["items"][1:] == after["items"] and latest2["currentStock"] == 4
    print("PASS: linked quantity correction reconciles current stock/cost and preserves every original event; correction-of-correction and repeated parent allowed; normal opname remains unlinked")


def quantity_history(page, product):
    events = history(product["id"])
    correction = events["items"][0]
    parent = correction["correctionOfEventId"]
    page.goto(BASE + "/inventory")
    row = page.get_by_role("row").filter(has=page.get_by_text(product["sku"], exact=True))
    row.get_by_title(re.compile(r"Details|Detail", re.I)).click()
    timeline = page.get_by_text(correction["reference"], exact=True).locator("../..")
    expect(timeline).to_contain_text(parent)
    timeline.get_by_role("button", name=re.compile(r"^(Koreksi jumlah|Correct quantity)")).click()
    expect(page.locator("#newStock")).to_have_value("", timeout=20000)
    expect(page.get_by_role("dialog")).to_contain_text(correction["id"])
    page.keyboard.press("Escape")
    page.goto(BASE + "/products")
    row = page.get_by_role("row").filter(has=page.get_by_text(product["sku"], exact=True))
    row.get_by_role("button", name=product["name"], exact=True).click()
    dialog = page.get_by_role("dialog")
    dialog.get_by_role("button", name=re.compile(r"^(Riwayat inventaris|Inventory history)$", re.I)).click()
    expect(dialog).to_contain_text(parent, timeout=20000)
    expect(dialog.get_by_role("button", name=re.compile(r"^(Koreksi jumlah|Correct quantity)"))).to_have_count(0)
    page.keyboard.press("Escape")
    print("PASS: quantity correction entrypoint in Inventory detail and full parent UUID on all history surfaces")


def quantity_correction_validation(page, product, empty_product):
    posted = []
    page.on("request", lambda request: posted.append(request) if is_mutation(request) else None)
    current = get_product(product["id"])
    events = history(product["id"])
    dialog = open_quantity_correction(page, events["items"][0])
    page.locator("#newStock").fill(str(current["currentStock"]))
    dialog.locator('button[type="submit"]').click()
    expect(dialog).to_be_visible()
    assert not posted, "Blank reason must not submit"
    page.locator("#adjNote").fill("   ")
    dialog.locator('button[type="submit"]').click()
    expect(dialog.get_by_role("alert")).to_be_visible()
    assert not posted, "Whitespace reason must not submit"
    for invalid in ("-1", "1.5", "1000000001"):
        page.locator("#newStock").fill(invalid)
        dialog.locator('button[type="submit"]').click()
        expect(dialog).to_be_visible()
        assert not posted, "Invalid count must not submit"
    expect(page.locator("#adjNote")).to_have_value("   ")
    # Zero delta still records linked evidence without changing stock.
    page.locator("#adjNote").fill("Zero delta evidence")
    page.locator("#newStock").fill(str(current["currentStock"]))
    dialog.locator('button[type="submit"]').click()
    expect(dialog).not_to_be_visible(timeout=20000)
    zero = get_product(product["id"])
    assert zero["currentStock"] == current["currentStock"]
    assert int(zero["stockVersion"]) == int(current["stockVersion"]) + 1
    zero_events = history(product["id"])
    assert zero_events["total"] == events["total"] + 1 and zero_events["items"][0]["correctionOfEventId"] == events["items"][0]["id"]
    # Found goods from zero stock require an explicit whole-IDR total. A zero-opening product
    # has no opening event, so first record an unlinked normal opname as eligible parent.
    open_opname(page, empty_product)
    page.locator("#newStock").fill("0")
    page.locator("#adjNote").fill("Unlinked zero evidence parent")
    page.get_by_role("dialog").locator('button[type="submit"]').click()
    expect(page.get_by_role("dialog")).not_to_be_visible(timeout=20000)
    opening = next(event for event in history(empty_product["id"])["items"] if event["kind"] == "opname" and event["correctionOfEventId"] is None)
    dialog = open_quantity_correction(page, opening)
    baseline = len(posted)  # Unlinked parent opname above committed; guards below assert no NEW mutation.
    page.locator("#newStock").fill("3")
    expect(page.locator("#foundCost")).to_be_visible()
    dialog.locator('button[type="submit"]').click()
    expect(dialog).to_be_visible()
    assert len(posted) == baseline, "Missing found cost must not submit"
    for invalid in ("1.5", "1,000", "-5"):
        page.locator("#foundCost").fill(invalid)
        dialog.locator('button[type="submit"]').click()
        expect(page.locator("#foundCost")).to_have_value(invalid)
        expect(dialog).to_be_visible()
        assert len(posted) == baseline, "Invalid found cost must not submit"
    page.locator("#foundCost").fill("")
    page.locator("#foundCost").focus()
    page.keyboard.insert_text("10000000000000")
    expect(page.locator("#foundCost")).to_have_value("10000000000000")
    dialog.locator('button[type="submit"]').click()
    assert len(posted) == baseline, "Oversized pasted found cost must not be truncated into a valid mutation"
    page.locator("#foundCost").fill("0")
    page.locator("#adjNote").fill("Found free goods")
    with page.expect_request(is_mutation) as found:
        dialog.locator('button[type="submit"]').click()
    payload = json.loads(found.value.post_data)[0]
    assert payload["foundPurchaseTotal"] == "0" and payload["correctionOfEventId"] == opening["id"]
    expect(dialog).not_to_be_visible(timeout=20000)
    latest = get_product(empty_product["id"])
    assert latest["currentStock"] == 3 and latest["inventoryCostValue"] == "0.000000"    # Initial live-read failure exposes no stale form; retry reads current state.
    failed = []

    def fail_read(route):
        request = route.request
        if request.method == "POST" and request.headers.get("next-action") and not is_mutation(request):
            try:
                body = json.loads(request.post_data)[0]
            except (TypeError, ValueError):
                body = None
            if body == {"id": product["id"]}:
                # Abort every matching read, not just the first: StrictMode
                # double-fires the modal's initial read and letting the second
                # through would render the form instead of the expected alert.
                failed.append(True)
                route.abort("failed")
                return
        route.continue_()

    page.route("**/inventory*", fail_read)
    # Route the navigation without the shared helper: it waits for #newStock,
    # which must NOT render when the initial read is failed.
    page.goto(BASE + "/inventory?tab=movements&pageSize=100")
    row = page.get_by_role("row").filter(has=page.get_by_text(history(product["id"])["items"][0]["reference"], exact=True))
    row.get_by_role("button", name=re.compile(r"^(Koreksi jumlah|Correct quantity)")).click()
    dialog = page.get_by_role("dialog")
    expect(dialog.get_by_role("alert")).to_be_visible(timeout=20000)
    expect(page.locator("#newStock")).to_have_count(0)
    assert failed
    page.unroute_all(behavior="wait")
    dialog.get_by_role("button", name=re.compile(r"^(Retry same request|Ulangi permintaan sama)$")).click()
    expect(page.locator("#newStock")).to_have_value("", timeout=20000)
    # Correction dialog stays inside bounds at desktop and mobile widths.
    for width in (1440, 390):
        page.set_viewport_size({"width": width, "height": 1000})
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "Correction page overflow"
        assert dialog.evaluate("element => element.scrollWidth <= element.clientWidth"), "Correction content overflow"
        page.wait_for_function("element => { const r = element.getBoundingClientRect(); return r.left >= 15 && r.right <= innerWidth - 15 && Math.abs(r.width - Math.min(448, innerWidth - 32)) < 1; }", arg=dialog.element_handle())
        page.screenshot(path=str(Path(sys.argv[2]).parent / f"quantity-dialog-{width}.png"))
    page.set_viewport_size({"width": 1440, "height": 1000})
    page.keyboard.press("Escape")
    expect(page.get_by_role("dialog")).not_to_be_visible()
    print("PASS: correction validation blocks blank/invalid input without mutations; zero delta appends linked evidence; found goods require explicit whole-IDR total; failed initial read retries cleanly at both widths")


def quantity_lost_response(page, browser, product):
    before = get_product(product["id"])
    events = history(product["id"])["total"]
    parent = next(event for event in history(product["id"])["items"] if event["kind"] == "sold")
    dialog = open_quantity_correction(page, parent)
    count = before["currentStock"] + 1
    page.locator("#newStock").fill(str(count))
    page.locator("#adjNote").fill("Frozen quantity draft")
    dropped = []

    def lose(route):
        if is_mutation(route.request) and not dropped:
            response = route.fetch()
            assert action_result(response.text())["ok"] is True
            dropped.append(json.loads(route.request.post_data))
            route.abort("failed")
        else:
            route.continue_()

    page.route("**/inventory*", lose)
    dialog.locator('button[type="submit"]').evaluate("button => { button.click(); button.click(); }")
    expect(dialog.get_by_role("alert")).to_be_visible(timeout=20000)
    assert_close_blocked(page)
    expect(page.locator("#newStock")).to_be_disabled()
    expect(page.locator("#newStock")).to_have_value(str(count))
    expect(page.locator("#adjNote")).to_have_value("Frozen quantity draft")
    committed = get_product(product["id"])
    assert committed["currentStock"] == count
    assert int(committed["stockVersion"]) == int(before["stockVersion"]) + 1
    assert history(product["id"])["total"] == events + 1
    # Live state advances beyond the frozen successful receipt before replay.
    other_context = browser.new_context()
    other = None
    try:
        other = login(other_context)
        other.on("request", capture)
        open_cost(other, product)
        other.locator("#replacementTotalCost").fill("13000")
        other.locator("#costReason").fill("Later cost proof")
        other.get_by_role("dialog").locator('button[type="submit"]').click()
        expect(other.get_by_role("dialog")).not_to_be_visible(timeout=20000)
    finally:
        if other:
            other.unroute_all(behavior="wait")
        other_context.unroute_all(behavior="wait")
        other_context.close()
    live = get_product(product["id"])
    page.unroute_all(behavior="wait")
    with page.expect_request(is_mutation) as retry:
        dialog.get_by_role("button", name=re.compile(r"^(Retry same request|Ulangi permintaan sama)$")).click()
    assert json.loads(retry.value.post_data) == dropped[0], "Quantity replay changed UUID/payload/intent"
    expect(dialog).not_to_be_visible(timeout=20000)
    assert get_product(product["id"]) == live and history(product["id"])["total"] == events + 2
    print("PASS: lost quantity response freezes drafts/close guards; identical replay adds no evidence and later live cost stays")


def quantity_conflict(page, browser, product):
    other_context = browser.new_context()
    other = None
    try:
        other = login(other_context)
        other.on("request", capture)
        parent = next(event for event in history(product["id"])["items"] if event["kind"] == "sold")
        dialog = open_quantity_correction(other, parent)
        other.locator("#newStock").fill("2")
        other.locator("#adjNote").fill("Keep quantity reason")
        # Independent owner session moves stock while the stale correction stays open.
        open_opname(page, product)
        page.locator("#newStock").fill("6")
        page.locator("#adjNote").fill("Concurrent count")
        page.get_by_role("dialog").locator('button[type="submit"]').click()
        expect(page.get_by_role("dialog")).not_to_be_visible(timeout=20000)
        current = get_product(product["id"])
        events = history(product["id"])
        assert current["currentStock"] == 6
        failed_read = []

        def fail_read(route):
            request = route.request
            if request.method == "POST" and request.headers.get("next-action") and not is_mutation(request) and not failed_read:
                if json.loads(request.post_data)[0] == {"id": product["id"]}:
                    failed_read.append(True)
                    route.abort("failed")
                    return
            route.continue_()

        other.route("**/inventory*", fail_read)
        with other.expect_request(is_mutation) as stale:
            dialog.locator('button[type="submit"]').click()
        expect(dialog.get_by_role("alert")).to_be_visible(timeout=20000)
        expect(dialog.locator('button[type="submit"]')).to_be_disabled()
        expect(other.locator("#newStock")).to_have_value("2")
        expect(other.locator("#adjNote")).to_have_value("Keep quantity reason")
        assert failed_read and get_product(product["id"]) == current and history(product["id"]) == events
        other.unroute_all(behavior="wait")
        retries = []
        other.on("request", lambda request: retries.append(request) if is_mutation(request) else None)
        dialog.get_by_role("button", name=re.compile(r"^(Retry same request|Ulangi permintaan sama)$")).click()
        reviewed = dialog.get_by_role("button", name=re.compile(r"Reviewed|Sudah ditinjau", re.I))
        expect(reviewed).to_be_visible(timeout=20000)
        assert not retries, "Conflict reload must read only"
        expect(dialog.locator('button[type="submit"]')).to_be_disabled()
        reviewed.click()
        expect(other.locator("#newStock")).to_have_value("")
        expect(other.locator("#adjNote")).to_have_value("Keep quantity reason")
        expect(dialog).to_contain_text("6 Pcs")
        other.locator("#newStock").fill("5")
        with other.expect_request(is_mutation) as fresh:
            dialog.locator('button[type="submit"]').click()
        old_payload = json.loads(stale.value.post_data)[0]
        payload = json.loads(fresh.value.post_data)[0]
        assert payload["requestId"] != old_payload["requestId"]
        assert payload["expectedStockVersion"] == current["stockVersion"]
        assert payload["correctionOfEventId"] == old_payload["correctionOfEventId"]
        expect(dialog).not_to_be_visible(timeout=20000)
        latest = get_product(product["id"])
        assert latest["currentStock"] == 5
        assert int(latest["stockVersion"]) == int(current["stockVersion"]) + 1
        assert history(product["id"])["total"] == events["total"] + 1
    finally:
        if other:
            other.unroute_all(behavior="wait")
        other_context.unroute_all(behavior="wait")
        other_context.close()
    print("PASS: stale quantity correction preserves parent/reason/count; failed latest read retries read-only; explicit review adopts current version with new UUID")


def quantity_read_retry(page, product):
    before = get_product(product["id"])
    parent = next(event for event in history(product["id"])["items"] if event["kind"] == "sold")
    open_quantity_correction(page, parent)
    page.locator("#newStock").fill(str(before["currentStock"] - 1))
    page.locator("#adjNote").fill("Known commit read retry")
    mutations, reads = [], []

    def fail_read(route):
        request = route.request
        if is_mutation(request):
            mutations.append(request)
        elif request.method == "POST" and request.headers.get("next-action"):
            if json.loads(request.post_data)[0] == {"id": product["id"]}:
                reads.append(request)
                route.abort("failed")
                return
        route.continue_()

    page.route("**/inventory*", fail_read)
    dialog = page.get_by_role("dialog")
    dialog.locator('button[type="submit"]').click()
    expect(dialog.get_by_role("alert")).to_contain_text(re.compile(r"mutasi tidak diulang|no duplicate mutation"), timeout=20000)
    assert len(mutations) == 1 and reads
    assert_close_blocked(page)
    expect(page.locator("#newStock")).to_be_disabled()
    expect(page.locator("#newStock")).to_have_value(str(before["currentStock"] - 1))
    expect(page.locator("#adjNote")).to_have_value("Known commit read retry")
    committed, events = get_product(product["id"]), history(product["id"])
    assert committed["currentStock"] == before["currentStock"] - 1
    page.unroute_all(behavior="wait")
    read_retries = []

    def observe(route):
        if is_mutation(route.request):
            mutations.append(route.request)
        elif route.request.method == "POST" and route.request.headers.get("next-action"):
            read_retries.append(route.request)
        route.continue_()

    page.route("**/inventory*", observe)
    dialog.get_by_role("button", name=re.compile(r"^(Retry same request|Ulangi permintaan sama)$")).click()
    expect(dialog).not_to_be_visible(timeout=20000)
    assert len(mutations) == 1 and read_retries, "Known commit retry must read without another mutation"
    assert get_product(product["id"]) == committed and history(product["id"]) == events
    page.unroute_all(behavior="wait")
    print("PASS: known quantity commit retries read-only with frozen draft and unchanged evidence")


def create_fixture(suffix, opening_qty=10, purchase_total=50000, min_stock=5):
    sku = f"{PREFIX}-{suffix}"
    req_id = str(uuid.uuid4())
    REQUESTS.add(req_id)
    payload = {
        "requestId": req_id,
        "sku": sku,
        "name": f"Test Item {suffix}",
        "category": "Snacks",
        "unit": "Pcs",
        "sellingPrice": "10000",
        "minStock": min_stock,
        "openingQuantity": opening_qty,
        "purchaseTotal": str(purchase_total),
    }
    result = rpc("create_product", payload)
    prod = result["product"]
    PRODUCTS.add(prod["id"])
    return prod


def catalog_picker(page):
    # Global actions must search beyond both table pages and Dashboard's first 100 rows.
    for index in range(101):
        target = create_fixture(f"CATALOG-{index:03}", opening_qty=0, purchase_total=0)
    page.goto(BASE + "/inventory")
    page.get_by_role("button", name=re.compile(r"Record Stock Movement|Catat Pergerakan", re.I)).click()
    dialog = page.get_by_role("dialog")
    page_label = dialog.get_by_text(re.compile(r"(?:Page|Halaman) 1 /", re.I))
    expect(page_label).to_be_visible()
    dialog.get_by_role("button", name=re.compile(r"^(Next|Selanjutnya)$", re.I)).click()
    expect(dialog.get_by_text(re.compile(r"(?:Page|Halaman) 2 /", re.I))).to_be_visible()
    search = dialog.get_by_role("textbox", name=re.compile(r"Search product|Cari nama produk", re.I))
    search.fill("NO-MATCH-" + PREFIX)
    expect(dialog.get_by_role("status")).to_contain_text(re.compile(r"No matching products|Tidak ada produk", re.I))
    def fail_picker(route):
        if route.request.method == "POST" and route.request.headers.get("next-action"):
            route.abort("failed")
        else:
            route.continue_()
    page.route("**/inventory*", fail_picker)
    try:
        search.fill(target["sku"])
        expect(dialog.get_by_role("alert")).to_be_visible()
    finally:
        page.unroute("**/inventory*", fail_picker)
    dialog.get_by_role("button", name=re.compile(r"Ulangi permintaan sama|Retry same request", re.I)).click()
    select_movement_product(page, target)
    page.keyboard.press("Escape")
    expect(dialog).not_to_be_visible()
    for route in ("/inventory?q=Test%20Item%20A&page=2", "/"):
        page.goto(BASE + route)
        page.get_by_role("button", name=re.compile(r"Record Stock Movement|Catat Pergerakan", re.I)).click()
        dialog = page.get_by_role("dialog")
        search = dialog.get_by_role("textbox", name=re.compile(r"Search product|Cari nama produk", re.I))
        expect(search).to_be_visible()
        search.fill(target["sku"])
        select_movement_product(page, target)
        expect(dialog).to_contain_text(target["sku"])
        expect(dialog.locator("#quantity")).to_be_enabled()
        page.keyboard.press("Escape")
        expect(dialog).not_to_be_visible()
    page.goto(BASE + "/inventory?q=Test%20Item%20A&page=2")
    page.get_by_role("button", name=re.compile(r"^(Stock Adjustment|Penyesuaian Stok)$")).first.click()
    dialog = page.get_by_role("dialog")
    dialog.get_by_role("textbox", name=re.compile(r"Search product|Cari nama produk", re.I)).fill(target["sku"])
    expect(dialog.locator("#itemSelect option").filter(has_text=target["sku"])).to_have_count(1)
    dialog.locator("#itemSelect").select_option(target["id"])
    expect(dialog.locator("#newStock")).to_have_value("0")
    page.keyboard.press("Escape")
    page.goto(BASE + "/inventory?q=Test%20Item%20A")
    expect(page.get_by_text(re.compile(r"Page stock units|Unit stok halaman ini", re.I))).to_be_visible()
    page.goto(BASE + "/inventory?tab=movements")
    expect(page.get_by_text(re.compile(r"Page stock units|Unit stok halaman ini", re.I))).to_have_count(0)
    print("PASS: global stock/opname pickers reach products beyond filtered pages and first 100 Dashboard products; quantity label is page-only and hidden on history")


def run():
    provision()
    prod_a = create_fixture("A", opening_qty=10, purchase_total=50000, min_stock=5)
    prod_b = create_fixture("B", opening_qty=0, purchase_total=0, min_stock=2)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="msedge")
        context = browser.new_context(viewport={"width": 1440, "height": 1000}, reduced_motion="reduce")
        page = login(context)
        page.on("request", capture)
        if "--hardening" in sys.argv:
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            try:
                hardening(page, browser, prod_a, prod_b)
                cost_hardening(page, prod_a)
                cost_validation(page, prod_a, prod_b)
                cost_lost_response(page, browser, prod_a)
                cost_conflict(page, browser, prod_a)
                cost_read_retry(page, prod_a)
                quantity_correction(page, prod_a)
                quantity_history(page, prod_a)
                quantity_correction_validation(page, prod_a, prod_b)
                quantity_lost_response(page, browser, prod_a)
                quantity_conflict(page, browser, prod_a)
                quantity_read_retry(page, prod_a)
                catalog_picker(page)
                for width in (1440, 390):
                    page.set_viewport_size({"width": width, "height": 1000})
                    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"Inventory overflow at {width}px"
                assert not errors, "Browser page errors observed"
            finally:
                page.unroute_all(behavior="wait")
                context.unroute_all(behavior="wait")
                context.close()
                browser.close()
            return

        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))

        # 1. Navigate to /inventory
        page.goto(BASE + "/inventory")
        page.wait_for_selector("table", timeout=20000)

        # 2. Verify demo notice is REMOVED
        body_text = page.locator("body").inner_text()
        assert "inventoryDemo" not in body_text, "Demo notice must not appear"

        # 3. Check fixtures appear in inventory table
        expect(page.get_by_text(prod_a["sku"])).to_be_visible()
        expect(page.get_by_text(prod_b["sku"])).to_be_visible()

        # 4. Physical stock adjustment (Stok Opname) on item A
        # Find item A row and click adjust stock button (pencil)
        row_a = page.locator("tr", has=page.locator(f"text={prod_a['sku']}"))
        row_a.locator("button[title*='Stock Adjustment'], button[title*='Penyesuaian']").click()

        dialog = page.get_by_role("dialog")
        expect(dialog).to_be_visible()

        # Verify current count is 10, set count to 12 (+2 delta)
        actual_input = dialog.locator("#newStock")
        actual_input.fill("12")
        expect(dialog.get_by_text("+2 Pcs")).to_be_visible()

        dialog.locator("#adjNote").fill("Physical count discrepancy check")
        with page.expect_request(is_mutation):
            dialog.locator('button[type="submit"]').click()
        expect(dialog).not_to_be_visible(timeout=20000)

        # Verify balance updated in table
        page.wait_for_timeout(1000)
        expect(row_a.get_by_text("12")).to_be_visible()

        # 5. Stock In on item A with carton mode
        row_a = page.locator("tr", has=page.locator(f"text={prod_a['sku']}"))
        # Open movement modal from header
        page.get_by_role("button", name=re.compile(r"(Record Stock Movement|Catat Pergerakan)", re.I)).click()
        mov_dialog = page.get_by_role("dialog")
        expect(mov_dialog).to_be_visible()

        # Select item A from dropdown if not already selected
        select_movement_product(page, prod_a)
        # Toggle carton mode
        mov_dialog.locator('input[type="checkbox"]').check()
        mov_dialog.locator("input[type='number']").nth(0).fill("2")  # 2 cartons
        mov_dialog.locator("input[type='number']").nth(1).fill("5")  # 5 units/carton -> 10 units
        mov_dialog.locator("#purchaseTotal").fill("40000")
        mov_dialog.locator("#reference").fill("NOTA-RESTOCK-1")

        with page.expect_request(is_mutation):
            mov_dialog.locator('button[type="submit"]').click()
        expect(mov_dialog).not_to_be_visible(timeout=20000)

        # Verify balance updated (12 + 10 = 22)
        page.wait_for_timeout(1000)
        expect(row_a.get_by_text("22")).to_be_visible()

        # 6. Sold-only Stock Out on item A
        page.get_by_role("button", name=re.compile(r"(Record Stock Movement|Catat Pergerakan)", re.I)).click()
        mov_dialog = page.get_by_role("dialog")
        expect(mov_dialog).to_be_visible()

        # Switch to stock out
        mov_dialog.get_by_role("button", name=re.compile(r"(Stock Out|Stok Keluar)", re.I)).click()
        select_movement_product(page, prod_a)
        mov_dialog.locator("#quantity").fill("5")
        mov_dialog.locator("#reference").fill("STRUK-001")

        with page.expect_request(is_mutation):
            mov_dialog.locator('button[type="submit"]').click()
        expect(mov_dialog).not_to_be_visible(timeout=20000)

        # Balance should now be 22 - 5 = 17
        page.wait_for_timeout(1000)
        expect(row_a.get_by_text("17")).to_be_visible()

        # 7. Test movements tab & live audit logs
        page.locator('button[data-tab="movements"]').click()
        page.wait_for_timeout(1000)
        expect(page.locator("body")).to_contain_text("NOTA-RESTOCK-1")
        expect(page.locator("body")).to_contain_text("STRUK-001")

        # 8. Test detail sheet live event history
        # Switch back to stock levels
        page.locator('button[data-tab="stock_levels"]').click()
        page.wait_for_timeout(1000)
        row_a = page.locator("tr", has=page.locator(f"text={prod_a['sku']}"))
        row_a.locator("button[title*='Details'], button[title*='Detail']").click()

        # Drawer should be open
        expect(page.get_by_text(re.compile(r"(Valuation & Unit Economics|Valuasi & Ekonomi Unit)", re.I))).to_be_visible()
        expect(page.get_by_text("NOTA-RESTOCK-1")).to_be_visible()

        # Press Escape to close
        page.keyboard.press("Escape")
        page.wait_for_timeout(500)

        # 9. Responsive layout tests (1440px and 390px without horizontal page scroll)
        for width, height in ((1440, 1000), (390, 844)):
            page.set_viewport_size({"width": width, "height": height})
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"Horizontal scroll overflow at {width}px"

        assert not errors, f"Browser errors observed: {errors}"
        browser.close()

    print("PASS: persistent inventory reads, opname delta reconciliation, carton stock in, sold stock out, movements tab audit, detail sheet live history, mobile overflow-free")


if __name__ == "__main__":
    try:
        run()
    finally:
        cleanup()
