"""Run: python -I scripts/test-recovery.py base_url local-status.json. Disposable recovery fixture only."""
import json
import base64
import re
import sys
import subprocess
import time
import uuid
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from playwright.sync_api import sync_playwright, expect

base_url = sys.argv[1]
assert urlparse(base_url).hostname == 'localhost', 'Local browser proof only'
status = json.loads(open(sys.argv[2], encoding='utf-8-sig').read()) if len(sys.argv) > 2 else None
email = f'recovery-browser-{uuid.uuid4()}@example.test'
password = f'Old-local-{uuid.uuid4()}!'
new_password = f'New-local-{uuid.uuid4()}!'
created_user = None
action_request = None


def api(path, body=None, token=None, admin=False, method='POST'):
    key = status['SERVICE_ROLE_KEY'] if admin else status['ANON_KEY']
    request = Request(status['API_URL'] + path, data=json.dumps(body).encode() if body is not None else None,
                      headers={'apikey': key, 'Authorization': 'Bearer ' + (token or key), 'Content-Type': 'application/json'}, method=method)
    try:
        with urlopen(request, timeout=15) as response:
            raw = response.read()
            return response.status, json.loads(raw) if raw else None
    except HTTPError as error:
        return error.code, None


def sql(statement):
    result = subprocess.run(['docker', 'exec', 'supabase_db_stockos-recovery-proof', 'psql', '-X', '-qAt', '-U', 'supabase_admin', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', statement], capture_output=True)
    assert result.returncode == 0, 'Recovery fixture SQL failed: ' + result.stderr.decode()


def recovery_link(purpose='recovery'):
    for _ in range(60):
        with urlopen(status['MAILPIT_URL'] + '/api/v1/messages', timeout=5) as response:
            messages = json.load(response).get('messages', [])
        for message in messages:
            if not any(recipient['Address'] == email for recipient in message['To']):
                continue
            with urlopen(status['MAILPIT_URL'] + '/api/v1/message/' + message['ID'], timeout=5) as response:
                html = json.load(response)['HTML']
            match = re.search(r'token_hash=((?:pkce_)?[a-f0-9]+)', html)
            if match and f'type={purpose}' in html:
                return f"{base_url}/auth/confirm?token_hash={match[1]}&type={purpose}"
        time.sleep(.2)
    raise AssertionError('Local recovery email missing')


try:
    if status:
        assert status['API_URL'] == 'http://127.0.0.1:55641', 'Disposable recovery fixture only'
        assert status['MAILPIT_URL'] == 'http://127.0.0.1:55644', 'Local mail only'
        inspection = json.loads(subprocess.check_output(['docker', 'inspect', 'supabase_db_stockos-recovery-proof'], text=True))[0]
        assert inspection['Config']['Labels']['com.supabase.cli.project'] == 'stockos-recovery-proof'
        assert inspection['State']['Running'] is True
        sql("do $$ begin if not exists(select 1 from stockos_private.owner_registration where id=1 and state='unclaimed') or exists(select 1 from stockos_private.products) then raise exception 'Fixture occupied'; end if; end $$; update stockos_private.auth_throttle set window_started_at=now()-interval '6 minutes' where bucket in ('recovery','login');")
        # Prepare through trusted bootstrap operations; never overwrite an existing owner.
        code, claim = api('/rest/v1/rpc/stockos_claim_owner', {'p_email': email, 'p_name': 'Recovery browser', 'p_shop': 'Recovery browser proof', 'p_timezone': 'Asia/Jakarta'}, admin=True)
        assert code == 200 and claim['state'] == 'claimed', 'Fixture must be unclaimed'
        code, invited = api('/auth/v1/invite', {'email': email, 'data': {'stockos_attempt_id': claim['attemptId']}}, admin=True)
        assert code == 200, 'Fixture invitation failed'
        created_user = invited.get('user', invited)['id']
        assert api('/rest/v1/rpc/stockos_reconcile_owner', {'p_attempt': claim['attemptId']}, admin=True)[0] == 200
        invitation_link = recovery_link('invite')
        # Invitation verification below confirms owner through provider, not an admin email override.

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel='msedge')
        context = browser.new_context()
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        if status:
            invitation_context = browser.new_context()
            invitation_page = invitation_context.new_page()
            invitation_page.goto(invitation_link)
            invitation_page.wait_for_url(base_url + '/newpassword', timeout=20000)
            assert api('/auth/v1/admin/users/' + created_user, {'password': password}, admin=True, method='PUT')[0] == 200
        page.goto(f'{base_url}/reset')
        expect(page.locator('#email')).to_be_visible()
        if status:
            auth_container = 'supabase_auth_stockos-recovery-proof'
            inspection = json.loads(subprocess.check_output(['docker', 'inspect', auth_container], text=True))[0]
            assert inspection['Config']['Labels']['com.supabase.cli.project'] == 'stockos-recovery-proof'
            subprocess.run(['docker', 'stop', auth_container], check=True, capture_output=True)
            try:
                for address in ('unknown-recovery@example.test', email):
                    page.goto(base_url + '/reset')
                    page.locator('#email').fill(address)
                    page.locator('button[type="submit"]').click()
                    expect(page.locator('main [role="alert"]')).to_contain_text('Permintaan gagal', timeout=25000)
                    assert page.locator('#email').input_value() == address
                    expect(page.locator('button[type="submit"]')).to_be_enabled()
            finally:
                subprocess.run(['docker', 'start', auth_container], check=True, capture_output=True)
            for _ in range(60):
                try:
                    with urlopen(status['API_URL'] + '/auth/v1/health', timeout=2) as response:
                        if response.status == 200:
                            break
                except (HTTPError, OSError):
                    pass
                time.sleep(.2)
            # Healthy Auth with failed SMTP must not reveal matching owner existence.
            mail_container = 'supabase_inbucket_stockos-recovery-proof'
            inspection = json.loads(subprocess.check_output(['docker', 'inspect', mail_container], text=True))[0]
            assert inspection['Config']['Labels']['com.supabase.cli.project'] == 'stockos-recovery-proof'
            subprocess.run(['docker', 'stop', mail_container], check=True, capture_output=True)
            delivery_ack = []
            try:
                for address in ('unknown-delivery@example.test', email):
                    page.goto(base_url + '/reset')
                    page.locator('#email').fill(address)
                    page.locator('button[type="submit"]').click()
                    expect(page.get_by_role('status')).to_be_visible(timeout=30000)
                    delivery_ack.append(page.get_by_role('status').inner_text())
                assert delivery_ack[0] == delivery_ack[1], 'Delivery failure cannot enumerate owner'
            finally:
                subprocess.run(['docker', 'start', mail_container], check=True, capture_output=True)
            page.goto(base_url + '/reset')
        page.locator('#email').fill('unknown-recovery@example.test')
        page.locator('button[type="submit"]').click()
        expect(page.get_by_role('status')).to_be_visible(timeout=20000)
        generic = page.get_by_role('status').inner_text()
        assert page.locator('#email').input_value() == 'unknown-recovery@example.test'
        for width, height in ((1440, 1000), (390, 844), (320, 568)):
            page.set_viewport_size({'width': width, 'height': height})
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Recovery page overflow'
        page.set_viewport_size({'width': 1440, 'height': 1000})
        if status:
            old_contexts = []
            for _ in range(2):
                old = browser.new_context()
                old_page = old.new_page()
                old_page.goto(f'{base_url}/login')
                old_page.locator('#email').fill(email)
                old_page.locator('#password').fill(password)
                old_page.locator('button[type="submit"]').click()
                old_page.wait_for_url(base_url + '/', timeout=25000)
                old_contexts.append((old, old_page))
            page.goto(f'{base_url}/reset')
            page.locator('#email').fill('invalid')
            page.locator('button[type="submit"]').click()
            expect(page.locator('#email-error')).to_be_visible()
            page.locator('#email').fill(email)
            page.locator('button[type="submit"]').click()
            expect(page.get_by_role('status')).to_be_visible(timeout=20000)
            assert page.get_by_role('status').inner_text() == generic, 'Owner email response must remain generic'
            link = recovery_link()
            wrong = browser.new_context()
            wrong_page = wrong.new_page()
            wrong_page.goto(link.replace('type=recovery', 'type=invite'))
            wrong_page.wait_for_url(f'{base_url}/login*')
            wrong.close()
            for suffix in ('&type=recovery', '&token_hash=invalid', '&next=https://example.com'):
                invalid = browser.new_context()
                invalid_page = invalid.new_page()
                invalid_page.goto(link + suffix)
                invalid_page.wait_for_url(f'{base_url}/login*')
                invalid.close()
            context.close()
            context = browser.new_context()
            page = context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(link)
            page.wait_for_url(f'{base_url}/newpassword', timeout=20000)
            retained_recovery = context.cookies()
            replay = browser.new_context()
            replay_page = replay.new_page()
            replay_page.goto(link)
            replay_page.wait_for_url(f'{base_url}/login*')
            replay.close()
            constrained = browser.new_context()
            constrained.add_cookies(retained_recovery)
            constrained_page = constrained.new_page()
            constrained_page.goto(base_url + '/')
            constrained_page.wait_for_url(f'{base_url}/login*')
            constrained.close()
            page.locator('#password').focus()
            page.keyboard.press('Tab')
            page.keyboard.press('Enter')
            assert page.locator('#password').get_attribute('type') == 'text', 'Keyboard password toggle'
            page.keyboard.press('Enter')
            assert page.locator('#password').get_attribute('type') == 'password'
            page.locator('#password').fill(password)
            page.locator('#confirmPassword').fill(password)
            page.locator('button[type="submit"]').click()
            expect(page.locator('main [role="alert"]')).to_contain_text('Periksa isian', timeout=25000)
            assert page.locator('#password').input_value() == password, 'Provider rejection preserves draft'
            page.locator('#password').fill(new_password)
            page.locator('#confirmPassword').fill('mismatch-value')
            page.locator('button[type="submit"]').click()
            expect(page.locator('#confirmPassword-error')).to_be_visible()
            assert page.locator('#password').input_value() == new_password, 'Validation preserves password draft'
            page.locator('#confirmPassword').fill(new_password)
            # Real provider failure at public action seam; fixture-only trigger blocks session deletion.
            sql(f"""create function auth.recovery_proof_block_revoke() returns trigger language plpgsql security definer set search_path='' as $$ begin
              if old.user_id='{created_user}' and exists (select 1 from stockos_private.password_purposes where user_id=old.user_id and phase='password_updated')
              then raise exception 'Recovery proof revoke unavailable'; end if; return old; end $$;
              create trigger recovery_proof_block_revoke before delete on auth.sessions for each row execute function auth.recovery_proof_block_revoke();""")
            def capture_action(request):
                global action_request
                if request.method == 'POST' and request.headers.get('next-action'):
                    action_request = (request.headers['next-action'], request.post_data)
            page.on('request', capture_action)
            try:
                page.locator('button[type="submit"]').click()
                expect(page.locator('main [role="alert"]')).to_contain_text('pencabutan sesi belum selesai', timeout=25000)
                assert page.locator('#password').input_value() == new_password, 'Revocation failure preserves draft'
            finally:
                sql('drop trigger if exists recovery_proof_block_revoke on auth.sessions; drop function if exists auth.recovery_proof_block_revoke();')
            assert action_request, 'Capture public reset Server Action'
            denied_headers = {'Next-Action': action_request[0], 'Content-Type': 'text/plain;charset=UTF-8', 'Origin': base_url}
            anonymous = browser.new_context()
            denied = anonymous.request.post(base_url + '/newpassword', headers=denied_headers, data=action_request[1])
            assert 'RECOVERY_INCOMPLETE' in denied.text(), 'Direct anonymous reset denied'
            anonymous.close()
            denied = old_contexts[0][0].request.post(base_url + '/newpassword', headers=denied_headers, data=action_request[1])
            assert 'RECOVERY_INCOMPLETE' in denied.text(), 'Direct password-purpose reset denied'
            denied = invitation_context.request.post(base_url + '/newpassword', headers=denied_headers, data=action_request[1])
            assert 'RECOVERY_INCOMPLETE' in denied.text(), 'Invitation cannot call recovery Server Action'
            invitation_action = []
            invitation_page.on('request', lambda request: invitation_action.append((request.headers['next-action'], request.post_data)) if request.method == 'POST' and request.headers.get('next-action') else None)
            invitation_page.locator('#password').fill(new_password)
            invitation_page.locator('#confirmPassword').fill(new_password)
            invitation_page.locator('button[type="submit"]').click()
            expect(invitation_page.locator('main [role="alert"]')).to_be_visible(timeout=25000)
            assert invitation_action
            denied = context.request.post(base_url + '/newpassword', headers={**denied_headers, 'Next-Action': invitation_action[-1][0]}, data=invitation_action[-1][1])
            assert 'UNAUTHENTICATED' in denied.text(), 'Recovery cannot call invitation Server Action'
            invitation_context.close()
            code, outsider = api('/auth/v1/admin/users', {'email': f'unbound-{uuid.uuid4()}@example.test', 'password': password, 'email_confirm': True}, admin=True)
            assert code == 200
            outsider_id = outsider.get('user', outsider)['id']
            try:
                code, outsider_session = api('/auth/v1/token?grant_type=password', {'email': outsider.get('user', outsider)['email'], 'password': password})
                assert code == 200
                encoded = 'base64-' + base64.urlsafe_b64encode(json.dumps(outsider_session).encode()).decode().rstrip('=')
                outsider_context = browser.new_context()
                for cookie in retained_recovery:
                    if cookie['name'].endswith('-auth-token') or cookie['name'].endswith('-auth-token.0'):
                        outsider_context.add_cookies([{**cookie, 'value': encoded}])
                denied = outsider_context.request.post(base_url + '/newpassword', headers=denied_headers, data=action_request[1])
                assert 'RECOVERY_INCOMPLETE' in denied.text(), 'Direct unbound owner reset denied'
                outsider_context.close()
            finally:
                assert api('/auth/v1/admin/users/' + outsider_id, admin=True, method='DELETE')[0] == 200
            # Retry must revoke only, not apply this different draft password.
            page.locator('#password').fill(new_password + '-not-applied')
            page.locator('#confirmPassword').fill(new_password + '-not-applied')
            page.locator('button[type="submit"]').click()
            page.wait_for_url(f'{base_url}/login', timeout=25000)
            for old, old_page in old_contexts:
                old_page.goto(base_url + '/')
                old_page.wait_for_url(f'{base_url}/login*')
                old.close()
            stale = browser.new_context()
            stale.add_cookies(retained_recovery)
            stale_page = stale.new_page()
            stale_page.goto(base_url + '/')
            stale_page.wait_for_url(f'{base_url}/login*')
            stale.close()
            page.locator('#email').fill(email)
            page.locator('#password').fill(password)
            page.locator('button[type="submit"]').click()
            expect(page.get_by_role('alert')).to_be_visible(timeout=20000)
            page.locator('#password').fill(new_password)
            page.locator('button[type="submit"]').click()
            page.wait_for_url(base_url + '/', timeout=25000)
            # Provider write succeeds but completion evidence fails: never report success or repeat write.
            page.goto(base_url + '/reset')
            page.locator('#email').fill(email)
            page.locator('button[type="submit"]').click()
            expect(page.get_by_role('status')).to_be_visible(timeout=20000)
            page.goto(recovery_link())
            page.wait_for_url(base_url + '/newpassword', timeout=20000)
            ambiguous_password = new_password + '-ambiguous'
            page.locator('#password').fill(ambiguous_password)
            page.locator('#confirmPassword').fill(ambiguous_password)
            sql(f"""create function stockos_private.recovery_proof_block_mark() returns trigger language plpgsql as $$ begin
              if new.user_id='{created_user}' and new.phase='password_updated' then raise exception 'Recovery proof evidence unavailable'; end if; return new; end $$;
              create trigger recovery_proof_block_mark before update on stockos_private.password_purposes for each row execute function stockos_private.recovery_proof_block_mark();""")
            try:
                page.locator('button[type="submit"]').click()
                expect(page.locator('main [role="alert"]')).to_contain_text('pencabutan semua sesi belum terkonfirmasi', timeout=25000)
                assert page.locator('#password').input_value() == ambiguous_password
                expect(page.locator('button[type="submit"]')).to_be_disabled()
            finally:
                sql('drop trigger if exists recovery_proof_block_mark on stockos_private.password_purposes; drop function if exists stockos_private.recovery_proof_block_mark();')
            assert api('/auth/v1/token?grant_type=password', {'email': email, 'password': ambiguous_password})[0] == 200, 'Ambiguous UI did not falsely claim unchanged password'
            retry = context.request.post(base_url + '/newpassword', headers=denied_headers, data=action_request[1])
            assert 'RECOVERY_INCOMPLETE' in retry.text(), 'Ambiguous action retry remains closed'
            page.goto(base_url + '/reset')
            page.locator('#email').fill(email)
            page.locator('button[type="submit"]').click()
            expect(page.get_by_role('status')).to_be_visible(timeout=20000)
            page.goto(recovery_link())
            page.wait_for_url(base_url + '/newpassword', timeout=20000)
            final_password = new_password + '-fresh-recovery'
            page.locator('#password').fill(final_password)
            page.locator('#confirmPassword').fill(final_password)
            page.locator('button[type="submit"]').click()
            page.wait_for_url(base_url + '/login', timeout=25000)
            assert api('/auth/v1/token?grant_type=password', {'email': email, 'password': ambiguous_password})[0] != 200
            page.locator('#email').fill(email)
            page.locator('#password').fill(final_password)
            page.locator('button[type="submit"]').click()
            page.wait_for_url(base_url + '/', timeout=25000)
        assert not errors, 'Browser page errors occurred'
        browser.close()
    print('PASS: recovery outage/generic response, provider rejection, revoke-only retry, direct action denial, ambiguous outcome/fresh recovery, keyboard, responsive UI')
except Exception as error:
    message = re.sub(r'token_hash=[^&\s"\']+', 'token_hash=[redacted]', str(error))
    for secret in (password, new_password):
        message = message.replace(secret, '[redacted]')
    raise AssertionError(message) from None
finally:
    if created_user:
        assert str(uuid.UUID(created_user)) == created_user
        container = 'supabase_db_stockos-recovery-proof'
        inspection = json.loads(subprocess.check_output(['docker', 'inspect', container], text=True))[0]
        assert inspection['Config']['Labels']['com.supabase.cli.project'] == 'stockos-recovery-proof'
        # Captured fixture owner only. Never reset an existing shop or operational records.
        statement = f"""begin;
          lock table stockos_private.owner_registration in exclusive mode;
          do $guard$ begin
            if not exists (select 1 from stockos_private.owner_registration where id=1 and email='{email}' and auth_user_id='{created_user}')
              or not exists (select 1 from stockos_private.shop_settings where id=1 and name='Recovery browser proof')
              or exists (select 1 from stockos_private.products)
            then raise exception 'Not captured empty recovery fixture'; end if;
          end $guard$;
          delete from stockos_private.shop_settings where id=1;
          update stockos_private.owner_registration set state='unclaimed',attempt_id=null,email=null,auth_user_id=null,provisioned_at=null,bound_at=null where id=1;
          delete from auth.users where id='{created_user}' and email='{email}';
          commit;"""
        result = subprocess.run(['docker', 'exec', container, 'psql', '-X', '-qAt', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', statement], capture_output=True)
        assert result.returncode == 0, 'Captured recovery browser fixture cleanup failed'
