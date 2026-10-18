"""Hydration diagnostics on real Next.js pages with an isolated synthetic owner.
Run through launch-hardening-proof.py --run --only hydration (optionally --prod).
"""
import json
import re
import runpy
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

proof = runpy.run_path(str(Path(__file__).with_name("test-products.py")))
g = proof["run"].__globals__
HYDRATION = re.compile(r"hydrat|server rendered|server-rendered|did not match|does not match|Minified React error #(418|423|425)", re.I)
ROUTES = ("/", "/products", "/inventory", "/reports", "/settings")
TITLES = {
    "/": r"Dashboard",
    "/products": r"Produk|Products",
    "/inventory": r"Stok Inventaris|Inventory Stock",
    "/reports": r"Laporan & Analitik|Reports & Analytics",
    "/settings": r"Pengaturan Sistem|System Settings",
}
def watch(context, diagnostics):
    def attach(page):
        page.on("console", lambda message: diagnostics.append((page.url.split("?", 1)[0], message.type, message.text))
                if message.type in ("warning", "error") else None)
        page.on("pageerror", lambda error: diagnostics.append((page.url.split("?", 1)[0], "pageerror", str(error))))
    context.on("page", attach)


def settled(page):
    expect(page.locator("h1").first).to_be_visible(timeout=30000)
    page.wait_for_function("Array.from(document.querySelectorAll('button, input, a')).some(el => Object.keys(el).some(k => k.startsWith('__reactProps$')))")
    # Allow deferred hydration and persisted-language updates to finish before checking diagnostics.
    page.wait_for_timeout(500)


def check_timestamp(page, saved, language):
    expected = page.evaluate("""([settings, language]) => new Intl.DateTimeFormat(
        language === 'en' ? 'en-US' : 'id-ID',
        {hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: settings.timezone}
    ).format(new Date(settings.updatedAt))""", [saved, language])
    timestamp = page.locator("span.font-semibold.text-slate-900").filter(has_text=re.compile(r"\d{2}[.:]\d{2}[.:]\d{2}"))
    expect(timestamp).to_have_text(expected)


def run():
    g["provision"]()
    request_id = str(g["uuid"].uuid4())
    seeded = g["rpc"]("create_product", {
        "requestId": request_id,
        "sku": g["PREFIX"] + "-HYDRATION",
        "name": "Hydration proof product",
        "category": "Browser proof",
        "unit": "Pcs",
        "sellingPrice": "10000",
        "minStock": 1,
        "openingQuantity": 3,
        "purchaseTotal": "15000",
    })["product"]
    g["PRODUCTS"].add(str(g["uuid"].UUID(seeded["id"])))
    g["REQUESTS"].add(request_id)
    failures = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="msedge")
        try:
            for language, timezone, locale in ((None, "UTC", "en-US"), ("id", "Asia/Jakarta", "id-ID"),
                                                ("en", "Asia/Jayapura", "en-US"), ("invalid", "Asia/Makassar", "en-US"),
                                                ("blocked", "Asia/Jakarta", "id-ID")):
                diagnostics = []
                context = browser.new_context(viewport={"width": 1440, "height": 1000}, timezone_id=timezone, locale=locale,
                                              reduced_motion="reduce")
                watch(context, diagnostics)
                if language == "blocked":
                    context.add_init_script("Object.defineProperty(window, 'localStorage', {get() { throw new DOMException('Storage blocked', 'SecurityError'); }});")
                elif language is not None:
                    context.add_init_script(f"if (location.origin === {json.dumps(g['BASE'])}) localStorage.setItem('stockos_language', {json.dumps(language)})")
                try:
                    anonymous = context.new_page()
                    for route in ("/login", "/signup", "/reset", "/newpassword"):
                        anonymous.goto(g["BASE"] + route)
                        settled(anonymous)
                        assert anonymous.url.startswith(g["BASE"] + ("/login" if route == "/newpassword" else route))
                    anonymous.close()
                    page = g["login"](context)
                    settled(page)
                    saved = g["rpc"]("get_shop_settings", {})
                    for route in ("/settings", "/", "/products", "/inventory", "/reports"):
                        page.goto(g["BASE"] + route)
                        settled(page)
                        assert page.url == g["BASE"] + route, "Protected route redirected"
                        expect(page.locator("main").get_by_role("heading", name=re.compile(TITLES[route])).first).to_be_visible()
                        if route == "/settings":
                            check_timestamp(page, saved, language)
                        page.reload()
                        settled(page)
                        assert page.url == g["BASE"] + route
                        expect(page.locator("main").get_by_role("heading", name=re.compile(TITLES[route])).first).to_be_visible()
                        if route == "/settings":
                            check_timestamp(page, saved, language)
                    page.goto(g["BASE"] + "/inventory")
                    settled(page)
                    inventory_row = page.locator("tbody tr").filter(has=page.locator("button[title*='Detail']")).first
                    expect(inventory_row).to_be_visible()
                    inventory_row.locator("button[title*='Detail']").click()
                    sheet = page.get_by_role("dialog")
                    expect(sheet).to_be_visible()
                    expect(sheet.get_by_text(re.compile(r"Timeline Pergerakan Terbaru|Recent Movement Timeline"))).to_be_visible()
                    page.keyboard.press("Escape")
                    expect(sheet).not_to_be_visible()
                    for route in ("/inventory?tab=movements", "/reports?tab=velocity", "/reports?tab=reorder"):
                        page.goto(g["BASE"] + route)
                        settled(page)
                        page.reload()
                        settled(page)
                    # Shared navigation uses Next Link, not another full document load.
                    for route in ROUTES:
                        link = page.locator(f'nav a[href="{route}"]:visible').first
                        expect(link).to_be_visible()
                        link.click()
                        page.wait_for_url(g["BASE"] + route)
                        settled(page)
                    page.goto(g["BASE"] + "/hydration-proof-missing")
                    expect(page.get_by_text("Halaman Tidak Ditemukan", exact=True)).to_be_visible()
                    page.wait_for_timeout(500)
                    page.goto(g["BASE"] + "/")
                    settled(page)
                    page.locator('nav a[href="/settings"]:visible').first.click()
                    page.wait_for_url(g["BASE"] + "/settings")
                    settled(page)
                    page.screenshot(path=str(Path(g["sys"].argv[2]).parent / f"hydration-settings-{language}.png"))
                    if language == "en":
                        expect(page.locator("main h1").first).to_have_text("System Settings")
                    else:
                        expect(page.locator("main h1").first).to_have_text("Pengaturan Sistem")
                    check_timestamp(page, saved, language)
                    timezone_select = page.get_by_role("combobox")
                    timezone_select.focus()
                    page.keyboard.press("ArrowDown")
                    expect(page.get_by_role("listbox")).to_be_visible()
                    page.keyboard.press("Escape")
                    expect(page.get_by_role("listbox")).not_to_be_visible()
                    expect(timezone_select).to_be_focused()
                    for width in (390, 1440):
                        page.set_viewport_size({"width": width, "height": 1000})
                        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "Settings page overflow"
                    hydration = [(url, kind, text) for url, kind, text in diagnostics if HYDRATION.search(text)]
                    other = [(url, kind, text) for url, kind, text in diagnostics if kind == "pageerror" and not HYDRATION.search(text)]
                    unrelated = [(url, kind, text) for url, kind, text in diagnostics
                                 if not HYDRATION.search(text) and kind != "pageerror"]
                    for url, kind, text in unrelated:
                        print(f"BROWSER: {url}: {kind}: {text[:300]}", flush=True)
                    if hydration or other:
                        # Diagnostics can contain source snippets; never print complete action/network payloads.
                        failures.append(f"language={language}, timezone={timezone}: " + " | ".join(
                            f"{url}: {kind}: {text[:1600]}" for url, kind, text in hydration + other))
                    print(f"CHECK: language={language}, timezone={timezone}, hydration={len(hydration)}, pageerrors={len(other)}")
                finally:
                    g["close_context"](context)
                if failures:
                    break
        finally:
            browser.close()
    for failure in failures:
        print("FAIL hydration check: " + failure, flush=True)
    assert not failures, "Hydration regression; sanitized diagnostics printed above"
    print("PASS: auth, five protected routes, reload/client navigation, persisted languages and alternate timezones")


if __name__ == "__main__":
    try:
        run()
    finally:
        g["cleanup"]()
