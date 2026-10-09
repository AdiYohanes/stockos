"""Run: python -I scripts/test-shop-scope.py [base_url] [fixture_path]. Requires installed Playwright."""
import json
import re
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
fixture_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(".fixture-auth.json")
assert fixture_path.exists(), f"Fixture file {fixture_path} required (run test-login.py with fixture path first)"
credentials = json.loads(fixture_path.read_text())

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge")
    context = browser.new_context()
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(f"{base_url}/login")
    page.locator("#email").fill(credentials["email"])
    page.locator("#password").fill(credentials["password"])
    page.locator('button[type="submit"]').click()
    page.wait_for_url(f"{base_url}/", timeout=20000)

    for route in ("/", "/products", "/inventory", "/reports", "/settings"):
        response = page.goto(f"{base_url}{route}")
        assert response.status == 200, (route, response.status)
        expect(page.locator("h1:visible, h2:visible").first).to_be_visible()
        assert page.locator('a[href="/warehouses"], a[href="/purchase-orders"]').count() == 0
        for width, height in ((1440, 1000), (390, 844)):
            page.set_viewport_size({"width": width, "height": height})
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (route, width)

    for route in ("/warehouses", "/purchase-orders"):
        response = page.goto(f"{base_url}{route}")
        assert response.status == 404, (route, response.status)

    page.goto(f"{base_url}/products")
    page.set_viewport_size({"width": 1440, "height": 1000})
    page.get_by_role("button", name=re.compile(r"Tambah Produk Baru|Tambah Produk")).first.click()
    page.locator("#product-supplier").fill("Supplier Uji")
    page.locator("#product-name").fill("Shop scope smoke product")
    page.locator("#product-pcs").fill("10")
    page.locator("#product-purchase").fill("50000")
    page.locator("#product-sell").fill("7000")
    page.locator("#product-barcode").fill("SHOP-SMOKE-001")
    page.get_by_role("button", name=re.compile(r"Tambah Produk|Add Product")).last.click()
    expect(page.get_by_role("heading", name=re.compile(r"Produk Berhasil Ditambahkan!|Product Added Successfully!"))).to_be_visible()
    page.get_by_role("button", name=re.compile(r"^(Selesai|Done)$")).click()
    page.locator('input[placeholder*="Cari"], input[placeholder*="Search"]').fill("Shop scope smoke product")
    expect(page.get_by_role("cell", name="Shop scope smoke product", exact=False)).to_be_visible()
    assert not errors, errors
    browser.close()

print("PASS: shop routes desktop/mobile, removed routes 404, product creation, no page errors.")
