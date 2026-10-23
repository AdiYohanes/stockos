"""Read-only regression for late Next.js debug frames after mobile camera resume."""
import re
import sys
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

origin = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
parsed = urlparse(origin)
if parsed.scheme not in ("http", "https") or parsed.hostname not in ("localhost", "127.0.0.1", "::1") or parsed.username or parsed.password or parsed.path not in ("", "/") or parsed.query or parsed.fragment:
    raise SystemExit("Use a loopback app origin only; no hosted requests or credentials.")

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="msedge", headless=True)
    context = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(error.message))
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.add_init_script("""
        window.__debugFrames = [];
        const NativeSocket = WebSocket;
        window.WebSocket = class extends NativeSocket {
            constructor(...args) {
                super(...args);
                window.__hmrSocket = this;
                this.addEventListener('message', event => {
                    if (event.data instanceof ArrayBuffer && new Uint8Array(event.data)[0] === 0) {
                        window.__debugFrames.push(event.data.slice(0));
                        window.__debugSocket = this;
                    }
                });
            }
        };
    """)
    try:
        response = page.goto(origin.rstrip("/") + "/login", wait_until="networkidle")
        assert response.status == 200, f"Login HTTP {response.status}"
        page.wait_for_function("window.__hmrSocket?.readyState === WebSocket.OPEN")
        assert page.evaluate("!!self.__next_r"), "Expected development page request ID"
        email = page.locator('input[type="email"]')
        email.fill("camera-resume@example.invalid")
        # Reproduce delayed/replayed debug delivery without invoking native camera or auth.
        page.evaluate("""() => {
            const frames = window.__debugFrames.slice();
            if (!frames.length) return;
            const socket = window.__debugSocket;
            const emit = data => socket.dispatchEvent(new MessageEvent('message', {data}));
            const end = frames.find(data => data.byteLength === 2 + new Uint8Array(data)[1]);
            if (!end) throw new Error('Expected completed initial debug stream');
            const id = new TextDecoder().decode(new Uint8Array(end, 2));
            const packet = (requestId, chunk = []) => {
                const bytes = new TextEncoder().encode(requestId);
                const data = new Uint8Array(2 + bytes.length + chunk.length);
                data[1] = bytes.length;
                data.set(bytes, 2);
                data.set(chunk, 2 + bytes.length);
                return data.buffer;
            };
            emit(end.slice(0));
            emit(packet(id, [10]));
            const lateId = 'camera-resume-' + crypto.randomUUID();
            emit(packet(lateId));
            emit(packet(lateId, [10]));
        }""")
        page.wait_for_timeout(250)
        stream_errors = [error for error in errors if re.search(r"Cannot (?:close|write to) a (?:CLOSED|closing) writable stream", error)]
        assert not stream_errors, "\n".join(stream_errors)
        assert not errors, "\n".join(errors)
        assert email.input_value() == "camera-resume@example.invalid", "Resume lost draft input"
        assert page.locator('button[type="submit"]').is_enabled(), "Form stopped responding"
        assert page.evaluate("window.__debugFrames.length") == 0, "Separate React debug transport must stay disabled"
        print("PASS: mobile debug-frame regression; no closed/closing stream errors; draft retained")
    finally:
        context.close()
        browser.close()
