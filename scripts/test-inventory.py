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
    page.locator("#email").fill(EMAIL)
    page.locator("#password").fill(PASSWORD)
    page.locator('button[type="submit"]').click()
    page.wait_for_url(re.compile(r"/($|products|inventory)"), timeout=20000)
    return page


def is_mutation(request):
    return request.method == "POST" and request.headers.get("next-action")


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


def run():
    provision()
    prod_a = create_fixture("A", opening_qty=10, purchase_total=50000, min_stock=5)
    prod_b = create_fixture("B", opening_qty=0, purchase_total=0, min_stock=2)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="msedge")
        context = browser.new_context(viewport={"width": 1440, "height": 1000}, reduced_motion="reduce")
        page = login(context)

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
        mov_dialog.locator("#itemSelect").select_option(value=prod_a["id"])
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
        mov_dialog.locator("#itemSelect").select_option(value=prod_a["id"])
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
