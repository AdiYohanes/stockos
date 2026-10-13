"""python -I scripts/test-settings.py http://localhost:3002 <stock-proof-status.json>
Real Settings Server Actions/browser against explicitly guarded empty local fixture.
Reuse Products proof owner setup, request capture, and refuse-unknown cleanup.
"""
import json
import re
import runpy
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

proof = runpy.run_path(str(Path(__file__).with_name("test-products.py")))
g = proof["run"].__globals__
g["SHOP"] = "Warung Berkah"


def button(page, name):
    return page.get_by_role("button", name=re.compile(name, re.I))


def settings(g):
    return g["rpc"]("get_shop_settings", {})


def save(page):
    with page.expect_request(g["is_mutation"]) as posted:
        button(page, "^Simpan Pengaturan$|^Save Settings$").click()
    response = posted.value.response()
    assert response and g["action_result"](response.text())["ok"], "Settings save rejected"
    expect(page.get_by_role("status")).to_contain_text(re.compile("Pengaturan berhasil diperbarui|Settings updated successfully"), timeout=30000)


def run():
    g["provision"]()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="msedge")
        context = browser.new_context(viewport={"width": 1440, "height": 1000})
        page = g["login"](context)
        page.goto(g["BASE"] + "/settings")
        page.locator("#phone").fill("08123456789")
        lost = []

        def lose(route):
            if g["is_mutation"](route.request) and not lost:
                response = route.fetch()
                assert g["action_result"](response.text())["ok"]
                lost.append(route.request)
                route.abort("failed")
            else:
                route.continue_()

        page.route("**/settings*", lose)
        button(page, "^Simpan Pengaturan$|^Save Settings$").dblclick()
        expect(page.get_by_role("alert")).to_be_visible(timeout=30000)
        expect(page.locator("#phone")).to_be_disabled()
        expect(button(page, "Reset Data & Standar|Reset System Data")).to_be_disabled()
        expect(button(page, "Aturan Stok & Valuasi|Stock Rules & Valuation")).to_be_disabled()
        assert page.locator("#phone").input_value() == "08123456789"
        committed = settings(g)
        page.unroute("**/settings*", lose)
        with page.expect_request(g["is_mutation"]) as retry:
            button(page, "^Ulangi permintaan sama$|^Retry same request$").click()
        assert json.loads(retry.value.post_data) == json.loads(lost[0].post_data)
        expect(page.get_by_role("status")).to_contain_text(re.compile("Pengaturan berhasil diperbarui|Settings updated successfully"), timeout=30000)
        expect(page.locator("#phone")).to_be_enabled(timeout=30000)
        assert settings(g)["version"] == committed["version"]
        assert g["direct"](context, lost[0])["replayed"]

        other_context = browser.new_context()
        other = g["login"](other_context)
        other.goto(g["BASE"] + "/settings")
        other.locator("#phone").fill("08999999999")
        page.locator("#phone").fill("08111111111")
        save(page)
        latest = settings(g)
        assert latest["phone"] == "08111111111"
        failed_read = []

        def lose_current(route):
            if route.request.method == "POST" and route.request.headers.get("next-action") and not g["is_mutation"](route.request):
                failed_read.append(route.request)
                route.abort("failed")
            else:
                route.continue_()

        other.route("**/settings*", lose_current)
        button(other, "^Simpan Pengaturan$|^Save Settings$").click()
        expect(other.get_by_role("alert").first).to_be_visible(timeout=30000)
        expect(button(other, "^Simpan Pengaturan$|^Save Settings$")).to_be_disabled()
        assert other.locator("#phone").input_value() == "08999999999"
        assert settings(g)["version"] == latest["version"]
        other.unroute("**/settings*", lose_current)
        button(other, "^Tinjau data terkini$|^Review current state$").click()
        expect(other.locator("#settings-current")).to_contain_text("08111111111", timeout=30000)
        button(other, "^Sudah ditinjau|^Reviewed").click()
        assert other.locator("#phone").input_value() == "08999999999"
        save(other)
        assert settings(g)["phone"] == "08999999999"
        # An older successful replay must not roll pristine browser values/version back.
        replay = g["direct"](other_context, lost[0])
        assert replay["replayed"] and replay["data"]["settings"]["phone"] == "08123456789"
        other.reload()
        expect(other.locator("#phone")).to_have_value("08999999999")
        assert settings(g)["phone"] == "08999999999"
        assert failed_read, "Conflict read failure was not exercised"
        g["close_context"](other_context)

        page.reload()
        page.locator("#phone").fill("08222222222")
        mutations, read_failures = [], []

        def fail_commit_refresh(route):
            if g["is_mutation"](route.request):
                mutations.append(route.request)
                route.continue_()
            elif route.request.method == "POST" and route.request.headers.get("next-action"):
                read_failures.append(route.request)
                route.abort("failed")
            else:
                route.continue_()

        page.route("**/settings*", fail_commit_refresh)
        button(page, "^Simpan Pengaturan$|^Save Settings$").click()
        expect(page.get_by_role("alert").filter(has_text=re.compile("mutasi tidak diulang|no duplicate mutation"))).to_be_visible(timeout=30000)
        assert len(mutations) == 1 and read_failures
        committed = settings(g)
        assert committed["phone"] == "08222222222"
        expect(page.locator("#phone")).to_be_disabled()
        page.unroute("**/settings*", fail_commit_refresh)
        read_retries = []

        def capture_refresh(route):
            if g["is_mutation"](route.request):
                mutations.append(route.request)
            elif route.request.method == "POST" and route.request.headers.get("next-action"):
                read_retries.append(route.request)
            route.continue_()

        page.route("**/settings*", capture_refresh)
        button(page, "^Ulangi permintaan sama$|^Retry same request$").click()
        expect(page.get_by_role("status")).to_contain_text(re.compile("Pengaturan berhasil diperbarui|Settings updated successfully"), timeout=30000)
        expect(page.locator("#phone")).to_be_enabled(timeout=30000)
        assert len(mutations) == 1 and len(read_retries) == 1, "Known commit retry repeated mutation"
        assert settings(g)["version"] == committed["version"]
        page.unroute("**/settings*", capture_refresh)

        button(page, "Aturan Stok & Valuasi|Stock Rules & Valuation").click()
        page.locator("#defaultLowStockThreshold").fill("27")
        page.locator("#defaultUnit").fill("Bungkus")
        save(page)
        assert settings(g)["defaultMinStock"] == 27
        button(page, "Reset Data & Standar|Reset System Data").click()
        page.locator("#confirmReset").fill("RESET")
        lost.clear()
        page.route("**/settings*", lose)
        button(page, "^Reset Standar Toko$|^Reset shop defaults$").click()
        dialog = page.get_by_role("dialog")
        expect(dialog.get_by_role("alert")).to_be_visible(timeout=30000)
        expect(page.locator("#confirmReset")).to_be_disabled()
        expect(page.locator("#confirmReset")).to_have_value("RESET")
        page.keyboard.press("Escape")
        expect(dialog).to_be_visible()
        expect(dialog.get_by_role("button", name=re.compile("Batal|Cancel")).filter(has_text=re.compile("Batal|Cancel"))).to_be_disabled()
        committed = settings(g)
        page.unroute("**/settings*", lose)
        with page.expect_request(g["is_mutation"]) as retry:
            dialog.get_by_role("button", name=re.compile("^Ulangi permintaan sama$|^Retry same request$")).click()
        assert json.loads(retry.value.post_data) == json.loads(lost[0].post_data), "Reset retry changed payload/intent/ID"
        expect(dialog).not_to_be_visible(timeout=30000)
        assert settings(g)["version"] == committed["version"]
        assert settings(g)["defaultMinStock"] == 15 and settings(g)["defaultUnit"] == "Pcs"
        expect(page.locator("#defaultLowStockThreshold")).to_have_value("15")
        expect(page.locator("#defaultUnit")).to_have_value("Pcs")
        for width in (1440, 390):
            page.set_viewport_size({"width": width, "height": 1000})
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "Settings overflow"
        browser.close()
    print("PASS: Settings frozen save/reset retry, double-click guards, known-commit read-only refresh retry, two-session conflict/read retry/review, controlled forms and reset")


if __name__ == "__main__":
    try:
        run()
    finally:
        g["cleanup"]()
