"""Run with installed Playwright: python -I scripts/test-login.py [base_url] [capture_dir]."""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
captures = Path(sys.argv[2]) if len(sys.argv) > 2 else None
if captures:
    captures.mkdir(parents=True, exist_ok=True)


def contrast(foreground, background):
    def luminance(hex_color):
        channels = [int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
        linear = [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in channels]
        return sum(v * weight for v, weight in zip(linear, (0.2126, 0.7152, 0.0722)))
    light, dark = sorted((luminance(foreground), luminance(background)), reverse=True)
    return (light + 0.05) / (dark + 0.05)


def check_layout(page):
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "Horizontal overflow"
    assert page.locator("header").bounding_box()["y"] + page.locator("header").bounding_box()["height"] < page.locator("h1").bounding_box()["y"], "Logo overlaps form"
    if page.url.endswith("/login"):
        groups = [page.locator("form"), page.get_by_role("button", name="Google"), page.get_by_text("No account yet?", exact=False)]
        for previous, current in zip(groups, groups[1:]):
            above, below = previous.bounding_box(), current.bounding_box()
            assert above["y"] + above["height"] + 8 <= below["y"], "Footer groups overlap"


def capture(page, name):
    page.evaluate("document.fonts.ready")
    check_layout(page)
    if captures:
        page.screenshot(path=str(captures / f"{name}.png"), full_page=True)


for foreground, background in [("#ffffff", "#543AFD"), ("#ffffff", "#402AD4"), ("#ffffff", "#604BFF"), ("#ffffff", "#000000"), ("#9f1239", "#fff1f2"), ("#166534", "#dcfce7")]:
    ratio = contrast(foreground, background)
    assert ratio >= 4.5, f"Text contrast {foreground}/{background}: {ratio:.2f}"
    print(f"Contrast {foreground}/{background}: {ratio:.2f}:1")

with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context()
    page = context.new_page()
    page.goto(f"{base_url}/login")
    page.get_by_role("heading", name="Sign in to StockOS").wait_for()
    for name, width, height in [("desktop", 1440, 1000), ("tablet", 768, 1024), ("mobile", 390, 844), ("narrow", 320, 568)]:
        page.set_viewport_size({"width": width, "height": height})
        capture(page, name)
        dimensions = page.evaluate("({height: document.documentElement.scrollHeight, viewport: innerHeight})")
        print(f"{name}: {dimensions['height']}px / {dimensions['viewport']}px")
        assert dimensions['height'] <= dimensions['viewport'], f"{name}: default login needs scroll"
    # Half-width CSS viewport represents desktop reflow at 200% zoom.
    page.set_viewport_size({"width": 720, "height": 450})
    capture(page, "zoom-reflow")
    page.set_viewport_size({"width": 390, "height": 844})
    email = page.get_by_label("Email Address")
    password = page.get_by_label("Password", exact=True)
    submit = page.get_by_role("button", name="Sign in to Dashboard")
    submit.click()
    page.get_by_text("Email is required", exact=True).wait_for()
    assert email.get_attribute("aria-invalid") == "true"
    assert password.get_attribute("aria-describedby") == "password-error"
    capture(page, "validation")
    email.fill("invalid")
    submit.click()
    page.get_by_text("Invalid email format", exact=True).wait_for()
    email.fill("wrong@example.com")
    password.fill("wrong")
    submit.click()
    page.get_by_role("alert").wait_for()
    capture(page, "invalid-login")
    page.get_by_role("button", name="Auto Fill Demo").click()
    assert email.input_value() == "demo@stockos.com"
    assert password.input_value() == "demo123"
    password.focus()
    page.keyboard.press("Tab")
    assert page.get_by_role("button", name="Show password").evaluate("el => el === document.activeElement")
    assert page.get_by_role("button", name="Show password").evaluate("el => getComputedStyle(el).outlineStyle") != "none"
    page.keyboard.press("Enter")
    assert password.get_attribute("type") == "text"
    page.get_by_role("button", name="Hide password").click()
    checkbox = page.get_by_role("checkbox", name="Keep me signed in")
    checkbox.focus()
    page.keyboard.press("Space")
    assert not checkbox.is_checked()
    email.focus()
    capture(page, "focused")
    page.evaluate("document.documentElement.classList.add('dark')")
    capture(page, "dark-mobile")
    page.evaluate("document.documentElement.classList.remove('dark')")
    for route in ("signup", "reset", "newpassword"):
        page.goto(f"{base_url}/{route}")
        page.locator("h1").wait_for()
        page.set_viewport_size({"width": 320, "height": 568})
        capture(page, route)
    page.goto(f"{base_url}/login")
    page.get_by_role("button", name="Auto Fill Demo").click()
    page.get_by_role("button", name="Sign in to Dashboard").click()
    assert page.get_by_label("Email Address").is_disabled()
    assert page.get_by_role("button", name="Show password").is_disabled()
    page.wait_for_url(f"{base_url}/", timeout=15000)
    assert any(cookie["name"] == "stockos_mock_auth" for cookie in context.cookies())
    browser.close()
print("PASS: login layout, validation, keyboard, demo, theme, related routes, and mock redirect")
