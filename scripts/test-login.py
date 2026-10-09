"""Run: python -I scripts/test-login.py [base_url] [fixture_path]. Dedicated local auth DB only."""
import json
import sys
import time
import uuid
from pathlib import Path
from urllib.request import urlopen
import subprocess
import re
from playwright.sync_api import sync_playwright, expect

base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
assert base_url == "http://localhost:3000", "Local auth callback origin only"
fixture_path = Path(sys.argv[2]) if len(sys.argv) > 2 else None
env = dict(line.split("=", 1) for line in Path(".env.local").read_text().splitlines() if "=" in line and not line.startswith("#"))
assert env["SUPABASE_URL"] == "http://127.0.0.1:55431"
# Refuse real owners; singleton cleanup is restricted to this dedicated browser fixture.
container = "supabase_db_stockos-auth"
inspection = json.loads(subprocess.check_output(["docker", "inspect", container]))[0]
assert inspection["Config"]["Labels"]["com.supabase.cli.project"] == "stockos-auth"
registration = subprocess.check_output(["docker", "exec", container, "psql", "-U", "postgres", "-d", "postgres", "-qAt", "-c", "select row_to_json(r) from stockos_private.owner_registration r where id=1"], text=True).strip()
registration = json.loads(registration)
if registration["state"] != "unclaimed":
    assert re.fullmatch(r"browser-[0-9a-f-]{36}@example\.test", registration["email"])
    user_id = registration["auth_user_id"]
    assert user_id is None or str(uuid.UUID(user_id)) == user_id
    command = "begin; lock table stockos_private.owner_registration in exclusive mode; delete from stockos_private.shop_settings where id=1 and name='Warung Uji'; update stockos_private.owner_registration set state='unclaimed',attempt_id=null,email=null,auth_user_id=null,provisioned_at=null,bound_at=null where id=1;"
    if user_id:
        command += f"delete from auth.users where id='{user_id}' and email='{registration['email']}';"
    command += "commit;"
    subprocess.run(["docker", "exec", container, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-c", command], check=True, capture_output=True)
email = f"browser-{uuid.uuid4()}@example.test"
password = f"Local-check-{uuid.uuid4()}"


def inbox_token():
    for _ in range(30):
        with urlopen("http://127.0.0.1:55434/api/v1/messages") as response:
            messages = json.load(response)["messages"]
        for message in messages:
            if any(recipient["Address"] == email for recipient in message["To"]):
                with urlopen(f"http://127.0.0.1:55434/api/v1/message/{message['ID']}") as response:
                    html = json.load(response)["HTML"]
                import re
                return re.search(r"token_hash=([a-f0-9]+)", html)[1]
        time.sleep(0.2)
    raise AssertionError("Local invitation missing")


with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge")
    context = browser.new_context()
    context.add_cookies([{"name": "stockos_mock_auth", "value": "true", "url": base_url}])
    page = context.new_page()
    page.goto(f"{base_url}/")
    page.wait_for_url(f"{base_url}/login")
    for route in ("newpassword", "auth/confirm?token_hash=invalid&type=invite&next=https://example.com"):
        page.goto(f"{base_url}/{route}")
        page.wait_for_url(f"{base_url}/login*", timeout=15000)
    page.goto(f"{base_url}/login")
    for width, height in ((1440, 1000), (768, 1024), (390, 844), (320, 568)):
        page.set_viewport_size({"width": width, "height": height})
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "Horizontal overflow"
    page.set_viewport_size({"width": 1440, "height": 1000})
    assert page.get_by_role("button", name="Auto Fill Demo").count() == 0
    page.locator("#email").fill("wrong@example.test")
    page.locator("#password").fill("wrong-password")
    page.locator('button[type="submit"]').click()
    expect(page.get_by_role("alert")).to_be_visible()
    assert page.locator("#email").input_value() == "wrong@example.test"
    expect(page.locator("#password")).to_be_enabled()
    page.locator("#password").focus()
    page.keyboard.press("Tab")
    toggle = page.locator('button[aria-pressed="false"]')
    assert toggle.evaluate("el => el === document.activeElement")
    page.keyboard.press("Enter")
    assert page.locator("#password").get_attribute("type") == "text"
    page.goto(f"{base_url}/signup")
    for field, value in {"setupCode": "wrong", "name": "Pemilik Uji", "email": email, "shopName": "Warung Uji"}.items():
        page.locator(f"#{field}").fill(value)
    page.locator('button[type="submit"]').click()
    expect(page.get_by_role("alert")).to_be_visible()
    assert page.locator("#email").input_value() == email
    page.locator("#setupCode").fill(env["STOCKOS_SETUP_SECRET"])
    page.locator('button[type="submit"]').click()
    expect(page.get_by_role("status")).to_be_visible(timeout=20000)
    assert page.locator("#setupCode").input_value() == ""
    token = inbox_token()
    callback = f"{base_url}/auth/confirm?token_hash={token}&type=invite"
    response = page.goto(callback)
    page.wait_for_url(f"{base_url}/newpassword")
    redirect_request = response.request
    while redirect_request.redirected_from:
        redirect_request = redirect_request.redirected_from
    assert "no-store" in redirect_request.response().headers.get("cache-control", "")
    cookies = context.cookies()
    assert any(cookie["name"].startswith("sb-") and cookie["httpOnly"] and cookie["sameSite"] == "Lax" for cookie in cookies)
    invitation_cookies = cookies
    other = browser.new_context()
    other.add_cookies(invitation_cookies)
    other_page = other.new_page()
    other_page.goto(f"{base_url}/")
    other_page.wait_for_url(f"{base_url}/login")
    other_page.goto(callback)
    assert other_page.url.startswith(f"{base_url}/login"), "Replayed token denied"
    other.close()
    page.locator("#password").fill(password)
    page.locator("#confirmPassword").fill(password)
    page.locator('button[type="submit"]').click()
    page.wait_for_url(f"{base_url}/login", timeout=20000)
    page.goto(f"{base_url}/")
    page.wait_for_url(f"{base_url}/login")
    page.locator("#email").fill(email)
    page.locator("#password").fill(password)
    page.locator('button[type="submit"]').click()
    page.wait_for_url(f"{base_url}/", timeout=20000)
    retained = context.cookies()
    expect(page.locator("body")).to_contain_text("Pemilik Uji", timeout=15000)
    if fixture_path:
        fixture_path.write_text(json.dumps({"email": email, "password": password}))
    page.get_by_role("button", name=re.compile(r"^(Sign Out|Keluar)$")).click()
    page.wait_for_url(f"{base_url}/login", timeout=20000)
    assert not any(cookie["name"].startswith("sb-") for cookie in context.cookies())
    stale = browser.new_context()
    stale.add_cookies(retained)
    stale_page = stale.new_page()
    stale_page.goto(f"{base_url}/")
    stale_page.wait_for_url(f"{base_url}/login")
    stale.close()
    browser.close()
print("PASS: real app setup, invitation, password, login/logout, revoked-cookie denial, bounds, keyboard and mobile")
