"""python -I scripts/test-reports.py http://localhost:3002 <stock-proof-status.json>
Edge + Next Server Actions + real isolated Supabase for Ticket 5 persistent Reports.
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
EMAIL, PASSWORD = f"reports-browser-{RUN}@example.test", f"Local-proof-{uuid.uuid4()}!"
SHOP, PREFIX = f"Reports browser proof {RUN}", f"RPT-{RUN[:8].upper()}"
PRODUCTS, REQUESTS = set(), set()
USER = TOKEN = None
PREPARED = False


def docker(*args):
    result = subprocess.run(["docker", *args], capture_output=True, text=True, timeout=30)
    assert result.returncode == 0, "Dedicated Docker command failed"
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
    except HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        raise AssertionError(f"Fixture provider request rejected ({e.code}): {err_body}") from None


def rpc(name, data):
    result = http(f"/rest/v1/rpc/stockos_{name}", {"p_input": data}, TOKEN)
    assert result.get("ok") is True, f"Public RPC rejected: {result}"
    return result["data"]


def provision():
    global USER, TOKEN, PREPARED
    snapshot = json.loads(sql("SELECT json_build_object('registration',(SELECT row_to_json(r) FROM stockos_private.owner_registration r WHERE id=1),'shops',(SELECT count(*) FROM stockos_private.shop_settings),'users',(SELECT count(*) FROM auth.users),'products',(SELECT count(*) FROM stockos_private.products),'requests',(SELECT count(*) FROM stockos_private.mutation_requests),'events',(SELECT count(*) FROM stockos_private.inventory_events),'administrative',(SELECT count(*) FROM stockos_private.administrative_events))"))
    assert snapshot["registration"]["state"] == "unclaimed", "Native suite must release empty fixture first"
    assert all(snapshot[key] == 0 for key in ("shops", "users", "products", "requests", "events", "administrative")), "Refuse unknown fixture records"
    PREPARED = True
    claim = http("/rest/v1/rpc/stockos_claim_owner", {"p_email": EMAIL, "p_name": "Reports browser proof", "p_shop": SHOP, "p_timezone": "Asia/Jakarta"}, admin=True)
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
    products = "ARRAY[" + ",".join(quote(value) for value in PRODUCTS) + "]::uuid[]" if PRODUCTS else "ARRAY[]::uuid[]"
    user = quote(USER) + "::uuid" if USER else "NULL::uuid"
    sql(f"""BEGIN;
      LOCK TABLE stockos_private.owner_registration, stockos_private.shop_settings IN EXCLUSIVE MODE;
      DELETE FROM stockos_private.inventory_events WHERE product_id = ANY({products}) OR actor_id = {user};
      DELETE FROM stockos_private.administrative_events WHERE product_id = ANY({products}) OR actor_id = {user};
      DELETE FROM stockos_private.products WHERE id = ANY({products});
      DELETE FROM stockos_private.mutation_requests WHERE actor_id = {user};
      DELETE FROM stockos_private.shop_settings WHERE id = 1;
      UPDATE stockos_private.owner_registration SET state = 'unclaimed', attempt_id = NULL,
        email = NULL, auth_user_id = NULL, provisioned_at = NULL, bound_at = NULL, updated_at = now() WHERE id = 1;
      DELETE FROM auth.users WHERE id = {user};
    COMMIT;""")


def login(context):
    page = context.new_page()
    page.goto(BASE + "/login")
    page.wait_for_function("Object.keys(document.querySelector('form')).some(key => key.startsWith('__reactProps$'))")
    page.locator("#email").fill(EMAIL)
    page.locator("#password").fill(PASSWORD)
    page.locator('button[type="submit"]').click()
    page.wait_for_url(re.compile(r"/($|products|inventory|reports)"), timeout=30000)
    assert any(cookie["name"].startswith("sb-") and cookie["httpOnly"] for cookie in context.cookies())
    return page


def create_fixture(suffix, category, opening_qty=10, purchase_total=50000, price=10000, min_stock=5):
    sku = f"{PREFIX}-{suffix}"
    req_id = str(uuid.uuid4())
    REQUESTS.add(req_id)
    payload = {
        "requestId": req_id,
        "sku": sku,
        "name": f"Test Report Item {suffix}",
        "category": category,
        "unit": "Pcs",
        "sellingPrice": str(price),
        "minStock": min_stock,
        "openingQuantity": opening_qty,
        "purchaseTotal": str(purchase_total),
    }
    result = rpc("create_product", payload)
    prod = result["product"]
    PRODUCTS.add(prod["id"])
    return prod


def run():
    provision()
    prod_a = create_fixture("A", "Makanan", opening_qty=10, purchase_total=50000, price=10000, min_stock=5)
    prod_b = create_fixture("B", "Minuman", opening_qty=0, purchase_total=0, price=15000, min_stock=5)
    prod_c = create_fixture("C", "Minuman", opening_qty=3, purchase_total=15000, price=8000, min_stock=10)

    # Add receipt on prod_a (+10 units)
    req_rec = str(uuid.uuid4())
    rpc("record_stock_in", {
        "requestId": req_rec,
        "productId": prod_a["id"],
        "quantity": 10,
        "purchaseTotal": "50000",
    })

    # Add sold on prod_a (-5 units)
    req_sold = str(uuid.uuid4())
    rpc("record_stock_out", {
        "requestId": req_sold,
        "productId": prod_a["id"],
        "quantity": 5,
    })

    # Read latest prod_a
    prod_a_latest = rpc("get_product", {"id": prod_a["id"]})

    # Opname on prod_a (actual 16, delta +1)
    req_opn = str(uuid.uuid4())
    rpc("record_opname", {
        "requestId": req_opn,
        "productId": prod_a["id"],
        "expectedStockVersion": prod_a_latest["stockVersion"],
        "countedQuantity": 16,
        "note": "Opname count",
    })

    # Test RPC: Valuation
    val = rpc("get_valuation_report", {})
    assert val["total"]["totalSKUs"] == 3
    assert len(val["categories"]) == 2
    cat_names = [c["categoryName"] for c in val["categories"]]
    assert "Makanan" in cat_names and "Minuman" in cat_names

    # Test RPC: Movement
    mov = rpc("get_movement_report", {"startDate": "2026-09-01", "endDate": "2026-10-15"})
    assert mov["summary"]["totalStockInQty"] >= 10
    assert mov["summary"]["totalStockOutQty"] >= 5
    assert mov["summary"]["totalOpnameDelta"] == 1
    item_a_mov = next((i for i in mov["items"] if i["productId"] == prod_a["id"]), None)
    assert item_a_mov is not None
    assert item_a_mov["stockInQty"] == 10
    assert item_a_mov["stockOutQty"] == 5
    assert item_a_mov["opnameDelta"] == 1

    # Test RPC: Low Stock
    low = rpc("get_low_stock_report", {})
    assert low["summary"]["outOfStockCount"] >= 1
    assert low["summary"]["lowStockCount"] >= 1
    item_ids = [i["id"] for i in low["items"]]
    assert prod_b["id"] in item_ids
    assert prod_c["id"] in item_ids

    # Browser UI Verification with Playwright
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="msedge")
        context = browser.new_context(viewport={"width": 1440, "height": 1000}, reduced_motion="reduce")
        page = login(context)

        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))

        # 1. Navigate to /reports
        page.goto(BASE + "/reports")
        page.wait_for_selector("table", timeout=20000)

        # 2. Check Valuation view (default)
        expect(page.get_by_role("cell", name="Makanan")).to_be_visible()
        expect(page.get_by_role("cell", name="Minuman")).to_be_visible()

        # 3. Switch to Stock Movement tab
        page.get_by_role("button", name=re.compile(r"(Stock Movement|Pergerakan)", re.I)).click()
        page.wait_for_selector(f"text={prod_a['sku']}", timeout=10000)
        expect(page.get_by_text(prod_a["sku"]).first).to_be_visible()
        expect(page.get_by_text("+10").first).to_be_visible()

        # 4. Switch to Low Stock Items tab
        page.get_by_role("button", name=re.compile(r"(Low Stock|Stok Menipis|Stok Kritis)", re.I)).click()
        page.wait_for_selector(f"text={prod_b['sku']}", timeout=10000)
        expect(page.get_by_text(prod_b["sku"]).first).to_be_visible()
        expect(page.get_by_text(prod_c["sku"]).first).to_be_visible()
        expect(page.get_by_text("STOK HABIS (0)").first).to_be_visible()
        expect(page.get_by_text("MENIPIS (≤ MIN)").first).to_be_visible()

        # 5. Open Export Modal
        page.get_by_role("button", name=re.compile(r"(Export|Ekspor)", re.I)).first.click()
        expect(page.get_by_text("Export Data Laporan")).to_be_visible()
        expect(page.get_by_text(re.compile(r"RFC 4180", re.I))).to_be_visible()
        # Close modal
        page.get_by_role("button", name=re.compile(r"(Batal|Cancel)", re.I)).click()

        browser.close()
        assert not errors, f"Page errors logged during test: {errors}"

    print("PASS: Reports RPC and browser flows verified against real isolated Supabase fixture.")


if __name__ == "__main__":
    try:
        run()
    finally:
        cleanup()
