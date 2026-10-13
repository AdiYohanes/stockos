# StockOS Operations

Ticket 12, 2026-10-11. Local proof only; not production readiness or deployment permission.

## Gate status

| Gate | Status |
| --- | --- |
| Tickets 9–11 | Completed local prerequisites |
| Forward migration and independent dump/restore | **PASS local-only**: final drill 4,536 ms restore plus validation, fresh login/revocation/grants/retry checks; not production RTO |
| Environment/secrets separation | Procedure and no-send preflight; no hosted environment configured |
| External SMTP invitation/recovery delivery | **BLOCKED**: provider, sender/domain, recipient and send permission not supplied |
| Capacity/cost | Public plan evaluation below; budget, account, region and load sign-off pending |
| Off-device encrypted backup and scheduled restore | Pending provider/storage/retention approval |
| Cloud Supabase/Vercel deployment and runtime compatibility | Not authorized; not proven |
| Real-shop data/import and production launch | Not authorized |

A passing local restore proves that a dump outside the database volume can recreate this fixture. It does not prove recovery after host loss, provider outage, geographic loss, or access to an external backup account. Never mark blocked gates complete because lint/build/local tests pass.

## Environment and secrets

- Keep local, private-test and production projects, database volumes, SMTP credentials, callback allowlists and setup secrets separate. Do not point local proof scripts at a hosted project.
- App uses the **five** server environment variables in `.env.example`, listed below; no `NEXT_PUBLIC_` credentials. Next.js embeds public values at build time. SMTP credentials belong to Supabase Auth configuration, not browser/app settings.
- Proof scripts do not load `.env.local`. They create fresh temp configurations and pass credentials through memory/process environment, never shell arguments or normal logs. Status files/dumps remain outside Git. Dumps contain password hashes, recovery material and shop data: treat them as credentials.
- Local proof directory is owner-only (`0700` on POSIX; inheritance removed and current user granted access on Windows). This does not replace disk encryption, malware protection or safe cloud-sync settings. Administrators can still access local files.
- Track B decision (2026-10-13): source secrets/recovery material live in an **owner-controlled encrypted password-manager vault** already available to the owner. Product/account, recovery custodian and access verification remain to be recorded under A1/A5 before cloud work; no new vault service or subscription provisioned. Vercel environment settings and Supabase Auth configuration hold runtime copies, not the only recoverable copy. Never paste secrets into tickets/chat, command histories, evidence or telemetry. Record secret names/rotation dates, not values. Rotate setup secret after bootstrap; rotate provider/service credentials after suspected exposure. Provider-managed JWT signing keys and Auth configuration are recovery dependencies, not contained in application SQL alone.
- `.gitignore` excludes env files, dumps and common operational artifacts. It is a safeguard, not protection for files outside those patterns. Inspect `git diff --cached` before every commit.

### Hosted secret-name inventory (no values)

| Name/material | Runtime destination | Handling |
| --- | --- | --- |
| `SUPABASE_URL` | Vercel server environment | Approved project HTTPS API origin; project reference is inventory metadata, not a credential |
| `SUPABASE_ANON_KEY` | Vercel server environment | Matching project key; not privileged, but kept server-only by this app |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel server environment | Privileged; provisioning/revocation only, never ordinary stock client/browser |
| `STOCKOS_SETUP_SECRET` | Vercel server environment | Unique per environment, at least 32 characters; rotate after binding owner |
| `STOCKOS_APP_URL` | Vercel server environment | Canonical approved HTTPS app origin; exact Auth callback host |
| SMTP host/port/user/password/sender | Supabase Auth configuration | Names for no-send preflight: `STOCKOS_SMTP_HOST`, `STOCKOS_SMTP_PORT`, `STOCKOS_SMTP_USER`, `STOCKOS_SMTP_PASSWORD`, `STOCKOS_SMTP_SENDER_EMAIL`, `STOCKOS_SMTP_SENDER_NAME`; not Vercel app variables |
| `STOCKOS_SMTP_TEST_RECIPIENT`, `STOCKOS_SMTP_ALLOWED_RECIPIENT` | Separate no-send preflight process | Approved exact inbox match; not proof or permission to send |
| Supabase CLI access token/database password; Vercel deploy credential | Approved operator tooling | Vault only; not app runtime, repository, shell arguments or shared logs |
| Backup storage credential/encryption key and account recovery material | Approved backup tooling/vault custody | A5 pending; keep key recoverable independently of failed host/storage |

Legacy anon/service-role JWT keys are the locally proven path. New-format `sb_publishable_`/`sb_secret_` keys require hosted admin/RPC/session/recovery proof before substitution; installed SDK support alone is not compatibility evidence. Preview and Production must use distinct projects/secrets and separately scoped Vercel values, never Production secrets exposed to untrusted preview code. An approved private-test preview uses one stable, access-controlled HTTPS origin reachable by the designated inbox/browser; authenticate the test operator through hosting protection without disabling it globally.

`.env.example` contains empty hosted values, not deployable credentials. Local URLs are documented there separately. Hosted origin checks are operator prerequisites: `STOCKOS_APP_URL` must contain no credentials, path, query or fragment; HTTPS is required because cookie security follows its protocol. Existing application does not enforce these conditions at startup.

## Local forward migration and restore drill

Prerequisites: Docker running, installed Supabase CLI, Node.js 22; ports 55740–55744 and 55840–55844 free. No paid resources or external email required.

```sh
node scripts/check-operations.mjs --self-test
node scripts/check-operations.mjs --run
```

The runner acquires an exclusive local lock and refuses existing `stockos-ops-source`/`stockos-ops-restore` containers or retained volumes. Database container IDs are captured after start and checked before SQL/cleanup; unknown or replaced resources are not removed. It never resets `stockos-auth`, stock/recovery proof fixtures, or other projects. It creates a source with all but the final repository migration and a restore target with only the same platform baseline. The source owner verifies a local invitation, establishes a fresh password session, and records mixed-price stock/settings evidence.

Proof sequence:

1. Apply the final migration using `supabase migration up --local --workdir <owned-fixture>`. Compare domain data, migration history and grants. Repeat without another change. Inject a failing migration only into the disposable source; verify DDL/history/data rollback.
2. Create one `pg_dump -Fc` archive with a consistent PostgreSQL snapshot for `stockos_private`, `public`, `auth` and `supabase_migrations`. Record SHA-256, snapshot timestamp, PostgreSQL version and sanitized drill timings. The archive stays outside database volumes.
3. Inspect an empty, newly created target and matching platform version. Restore application schema/RPC/grants/history and compatible Auth data in one error-stopping transaction. Platform-managed Auth DDL is supplied by the installed Supabase image, not overwritten from the dump. Restore runs as `supabase_admin` inside the owned local database container because managed Auth grants need platform privileges; this is not a hosted credential/procedure. Do not modify archive TOC to bypass a real compatibility failure.
4. Pause target Auth and REST containers during import; before reopening them or exposing target to any app, clear restored sessions, refresh tokens, password-purpose evidence and outstanding provider user-token fields. Verify retained JWT and refresh token fail; verify a fresh password login works, owner identity/settings/balance/modal/evidence/retry results match, replay cannot duplicate stock, and anonymous/private helper access remains denied.
5. Inspect run-owned project labels before stopping fixture resources. On failure, never claim success; report failing phase without credential output. Retain the protected directory for review. If cleanup fails, inspect resource ownership before removing anything manually.

Restore scope exclusions: cluster roles/passwords, external Auth/SMTP settings, signing keys, DNS, storage blobs, Vault root keys, Edge Functions, app deployment and external backup credentials. Auth proof is password-only; populated MFA factors/challenges are rejected (password AMR claim rows are retained) because their managed-schema dependencies require a separately reviewed restore plan. Compatible Auth sequence values are retained in the archive restore. This app currently has no Storage/Vault/Edge Function operational data. Local same-version restore is not a cross-version/cloud migration certification.

Backup and status files retained by this runner are sensitive. After evidence review, inspect the exact printed directory and remove it explicitly; never delete arbitrary temp folders or another run's backups. Keep only sanitized `evidence.json` in a ticket if needed; do not publish the dump/status/TOC files.

## Future approved environment: migration procedure

1. Confirm exact project/account/environment, operator, maintenance window and rollback owner. Stop writes, verify last successful backup and restoration evidence, and record repository commit/ordered migration checksums. Never run a reset on an operational database.
2. Compare installed migration history with repository; stop for missing/changed/applied-out-of-order versions. Preview SQL/grants and expected lock duration. Confirm compatibility of Auth/PostgreSQL/platform versions and app before applying.
3. Apply only pending forward migrations using the installed CLI. SQL and migration history must commit together. Serialize operators; do not split direct `psql` execution and history insertion. Keep migration files immutable once applied.
4. Verify migration history, owner/anonymous/grant boundaries, count/valuation/evidence/retry/settings and app health before resuming writes. Record version/timing/result only.
5. On failure, stop writes and inspect whether migration rolled back or history/data indicate partial external effects. Do not mark a version applied, edit an applied file, reset the DB, or replay business requests with new IDs. Correct through a new reviewed forward migration, or restore the verified backup into a quarantined new target with separate permission. Resume only after checks; report any post-backup loss explicitly.

## Hosted deployment procedure — draft only (Track B3)

This section authorizes no cloud changes, purchases, email or launch. Track B prepares local files only. C requires recorded A1–A3 (accounts/operator/recovery, budget/tier, region) plus explicit provisioning/deployment permission. D requires A4 and explicit sending permission. E2 requires A5 and approved backup/restore targets. First hosted release is private testing with synthetic data; real-shop import/go-live needs a separate go/no-go.

1. **Freeze candidate and gates.** Record reviewed commit, checks, ordered migration checksums and responsible operator. Exclude unrelated dirty files. Confirm separate private-test/production accounts/projects, vault recovery access and cost alerts. Proposed Supabase Singapore/Vercel `sin1` and ~$45/month baseline remain unapproved choices, not configured resources; confirm current provider terms/limits before purchase.
2. **C1: provision approved private-test Supabase.** Verify account, region, tier and project reference before changes; put keys/tooling credentials in approved vault, not evidence. Keep public signup and anonymous sign-ins disabled, email/password provider enabled, confirmations enabled, refresh rotation enabled; baseline password minimum is 12 and token expiry 3600 seconds. Keep signup closed even if provider defaults differ. Configure hosted Auth deliberately: local `supabase/config.toml` and templates do not automatically configure the hosted project. Do not send invites until A4/send permission and callback configuration are ready.
3. **C2: apply forward migrations.** Follow “Future approved environment: migration procedure” above against exact linked hosted reference with supported CLI. New empty private-test project must be confirmed empty; operational targets require verified backup first. Review pending migrations/history/grants, apply in order, verify owner/session/private boundaries and no-op rerun. Never run `db reset`, import sample seeds automatically, edit applied migrations, or insert history by hand. Stop on incompatible provider/Auth schema or missing privileged grants; no security bypass.
4. **C3: configure/deploy private-test Next.js on Vercel.** Use Next.js server hosting, `npm ci` and `npm run build`, not static export. Node.js 22 matches local proof and exceeds installed Next.js minimum 20.9.0; confirm provider support. Set exactly five server variables from inventory in Preview scope with matching private-test Supabase keys; leave Production scope untouched until separately approved. Set stable canonical HTTPS `STOCKOS_APP_URL`, configure/verify approved function region and runtime limits rather than assuming `sin1` from this document. Preserve normal same-origin Server Action protection; do not add wildcard origins or expose credentials via `NEXT_PUBLIC_`. Keep private deployment access-controlled; record deployed commit, region and sanitized health result only.
5. **Configure exact callback and templates before email.** Serialize Supabase Auth config changes with C/D operators. Hosted Site URL must equal approved app origin; redirect allowlist must include exact `https://<approved-host>/auth/confirm`, not wildcard preview hosts or `/auth/callback`. Install both `supabase/templates/invite.html` and `supabase/templates/recovery.html` as hosted templates. They use `.RedirectTo`, `.TokenHash` and `type=invite`/`type=recovery`; callback accepts those token-hash purposes, not a default `?code=...` flow or extra `next` parameter. Verify host/reachability without printing query strings/tokens. Do not weaken purpose/session checks to accommodate provider link rewriting.
6. **D1–D3, then C4: prove owner workflow with test inbox/data.** Configure approved external SMTP only after A4/send authorization and TLS/SPF/DKIM/DMARC checks; execute delivery acceptance below against hosted private-test project. Full password setup/recovery proof needs reachable C3 origin. Recovery globally revokes owner sessions: reserve a recovery window, pause same-owner authenticated C4/E1 work and log in fresh afterwards. SMTP preflight exit 2 stays BLOCKED; never manually confirm email, paste token links or reopen owner slot. Once D passes, C4 verifies setup outcome, fresh login, one stock mutation/read, anonymous/private denial and replay/session behavior using synthetic data only. Retain minimal sanitized evidence; no data deletion or blind bootstrap retry outside reviewed procedure.
7. **E1/E2 and release gates.** Run only approved light staging workload; inspect DB connections, function duration/errors, disk/egress, email limits and spend alerts. No DoS/stress or production stock changes. A5 must be complete before first encrypted off-device backup and restore into approved quarantined target; verify checksum, exact settings/balances/evidence/retry identity and old-session rejection before opening restored target. Local same-version drill is a template, not certified hosted Auth restore: verify provider privileges/version/signing/config compatibility first. Record snapshot/RPO/RTO/cleanup and schedule responsibilities. Never overwrite operational target or mark launch ready based on local checks.
8. **Failure/redeploy.** Keep gate blocked and freeze affected writes; use trace IDs and redacted provider metrics, not raw payloads. An app-only rollback may redeploy previous reviewed commit only if compatible with current forward schema, with operator approval; never down-migrate/reset DB. Provider/email/restore failures follow incident runbook and require new proof. No Production promotion, real-data import or go-live without all launch gates and explicit approval.

C1/C2 and Auth configuration are serialized. D email setup can be prepared separately from Vercel build, but full D proof waits for C3 callback reachability. Independent capacity observation can run alongside D; authenticated same-owner work pauses during recovery/revocation. E2 waits for A5. Do not run concurrent local proof suites; their dedicated ports/resources remain local-only.

## SMTP: harness only

The approved mode is **no send**. `scripts/check-smtp-readiness.mjs` checks process configuration without opening a connection or proving credentials. Exit code 2 means blocked delivery proof, including a complete configuration. Exit code 1 means invalid configuration. Preflight success is never inbox-delivery success.

```sh
node scripts/check-smtp-readiness.mjs --self-test
node scripts/check-smtp-readiness.mjs
```

Process env: `STOCKOS_SMTP_HOST`, `STOCKOS_SMTP_PORT`, `STOCKOS_SMTP_USER`, `STOCKOS_SMTP_PASSWORD`, `STOCKOS_SMTP_SENDER_EMAIL`, `STOCKOS_SMTP_SENDER_NAME`, `STOCKOS_SMTP_TEST_RECIPIENT`, `STOCKOS_SMTP_ALLOWED_RECIPIENT`. Port must be 465 (implicit TLS) or 587 (STARTTLS before authentication); harness does not establish or test TLS. Test and allowed recipient must match exactly; wildcard/list addresses and control characters are rejected. Any `NEXT_PUBLIC_*SMTP*` variable is rejected. Keep SMTP configuration separate from app `.env.local`; do not print values. Future external proof requires explicit provider/sender/recipient permission, TLS configuration, provider sender/domain verification (SPF/DKIM/DMARC), rate limits, and access to the designated recipient inbox. Supabase's built-in mail service is not an operational SMTP plan.

Future authorized delivery acceptance:

- Use a separate local/private-test Auth project and designated test inbox; no real owner credentials/data. Do not create hosted resources merely to prove SMTP.
- Send invitation through the actual provider, verify inbox receipt, approved sender, link/callback host, token purpose, expiry and single-use behavior. SMTP acceptance/provider message ID alone is not delivery or inbox placement.
- Complete password setup through the verified callback, require fresh password login, verify recovery mail through the same external path, complete recovery and deny old JWT/refresh sessions. Preserve generic unknown-account acknowledgement and failure drafts; do not weaken signup/owner/session checks.
- Confirm sending limits, bounce/spam handling, provider link rewriting and token leakage protection. Keep mail tokens, recipient details and provider credentials out of evidence. Record sanitized pass/fail, time and provider choice.
- Failure keeps the SMTP gate blocked. No fallback to public signup, manual email confirmation or logged token links.

## Capacity and cost assessment

Public documentation checked **2026-10-11**, USD before tax/foreign exchange; estimates are not purchases or approved budget. One warung owner does not imply zero-cost hosting eligibility or guaranteed capacity.

| Service | Relevant published plan | Operational implication |
| --- | --- | --- |
| Supabase Free | $0; 500 MB DB; 50,000 monthly active Auth users; 5 GB ordinary egress; inactive projects pause after one week; no included automatic backups | Suitable for disposable proof, not evidence of required availability/recoverability |
| Supabase Pro, one Micro | $25/month baseline ($25 subscription + $10 Micro compute − $10 organization compute credit); 8 GB disk, 100,000 Auth MAU, 250 GB ordinary egress; daily backups retained 7 days; Micro 60 direct/200 pooler connections | Baseline candidate only; independent backup still needed; overages and additional projects cost extra |
| Supabase PITR | Paid add-on from $100/month per 7-day retention window | Not selected; daily backup does not establish sub-day recovery |
| Vercel Hobby | Free, **non-commercial personal use only** | Not appropriate for a warung's operational business use |
| Vercel Pro | $20/month platform fee, one deploying seat, $20 usage credit; additional deploying seats $20 each; overage usage extra | Baseline candidate; resource limits, spend alerts and region/runtime proof required |
| External SMTP | Provider not selected | Cost/throughput/sender DNS/deliverability blocked |
| Independent encrypted off-device backup | Storage/key custody not selected | Cost/retention/access/restore scheduling blocked |

Indicative Supabase Pro + Vercel Pro floor: **$45/month**, excluding SMTP, independent backup storage, domain renewals, overages and taxes. No tier purchase authorized. Supabase backups and Vercel account roles are platform operations, not a staff/team feature in StockOS.

Before deployment approval, confirm account ownership, named operator, region/latency from shop, dataset/event growth with no audit/retry expiry, connection usage, RPC/export bounds (10,000 rows/5 MiB), build/function duration/memory, email limits, and alert/spend cap behavior. Measure an approved workload on an isolated target, not an unapproved stress test or DoS. Track DB disk/egress/auth-email consumption; do not claim one-owner capacity from plan tables alone.

Sources:
- [Supabase pricing](https://supabase.com/pricing)
- [Supabase backup/restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
- [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Vercel Hobby](https://vercel.com/docs/plans/hobby)
- [Vercel Pro](https://vercel.com/docs/plans/pro-plan)

## Recovery and incident runbook

Proposed targets from `BACKEND_PLAN.md`: **RPO ≤24 hours, RTO ≤one business day**. Local measured restoration is not an availability commitment. Production operator, escalation contact, backup schedule, storage location, encryption/key custodian and retention approval remain unassigned; user must name them before launch. Suggested daily independent backups plus regular restore drills must be confirmed against actual cost/risk/retention needs. Never automatically expire audit/retry identity or delete operational records.

| Signal | Immediate response | Recovery evidence |
| --- | --- | --- |
| Auth/SMTP outage or missing email | Keep signup/recovery fail-closed; inspect provider health and sending quota using redacted logs; generic account acknowledgement remains generic | Real inbox proof after resolution; never token bypass |
| Pending owner bootstrap | Reconcile the same recorded attempt/email/provider subject with privileged server-only tools | Exact owner binding preserved; no blind slot reset or new identity |
| Owner forgot password | Approved Auth recovery link, verified purpose/session and password completion; all-session revocation before fresh login | Old JWT/refresh denied, new login succeeds |
| Credential exposure | Isolate app/provider access; rotate impacted secrets/signing material with approved operator; revoke sessions | Secret scan/redaction, verified recovery and denied old sessions |
| Migration failure | Freeze writes, inspect history/schema/grants; forward-fix or quarantined verified restore | Data integrity and owner/grant checks before reopening |
| Database loss/corruption | Preserve failed target for investigation; restore independently stored backup to a new quarantined target with compatible platform/Auth config | Owner identity, exact balances/evidence/retries/settings and session revocation; declared snapshot time/data loss |
| Disk/quota/latency growth | Inspect DB/egress/Auth/function metrics and cost alerts; pause noncritical proof/export work if needed | Capacity/budget change explicitly approved; no audit deletion |
| Unexpected app error | Use support trace ID, timestamp and environment; exclude tokens/passwords/SQL data from logs | Reproduce at approved seam; no speculative retry with fresh mutation ID |

Monitoring scope is a checklist, not deployed infrastructure: backup age/restore success, Auth availability/SMTP bounces, DB disk/connections/latency, function errors, costs and owner-access denials. Do not log passwords, callback tokens, service credentials, raw provider/SQL errors or inventory payloads. Existing application safe trace IDs can be used. No email/webhook stock-notification feature is introduced.

## Release decision

Do not launch while external SMTP, named responsibility, off-device encrypted restore, budget/region/capacity, hosted runtime/callback/session proof, deployment approval or real-data permission is missing. Tickets 9–11 and a passing ticket 12 local drill cannot close these gates by themselves.
