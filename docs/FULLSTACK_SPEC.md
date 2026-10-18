## Problem Statement

The single warung owner cannot rely on StockOS mock balances: Products and Inventory hold independent, session-scoped data; reload loses changes, and Dashboard/Reports display fixtures. Demo revenue/net-profit labels imply sales/accounting data that is not recorded. The owner needs one durable stock source, explainable purchase cost, and manual recording of sold quantities without a POS or enterprise ERP.

## Solution

Deliver one online web application for one owner/warung using Next.js, Supabase PostgreSQL/Auth, and Vercel. Persist products, integer stock, exact weighted-average inventory cost, and append-only evidence atomically. Manual Stock Out records sold quantities; opname reconciles physical discrepancies separately. Show Potensi Pendapatan and Potensi Laba Kotor of remaining stock at current prices, not realized revenue/net profit. Replace unsupported mock controls and predictions with live inventory reports and straightforward settings.

## User Stories

1. As the owner, I want setup-code-protected registration, so that strangers cannot claim my shop.
2. As the owner, I want only one registration to succeed under simultaneous requests, so that shop ownership stays unambiguous.
3. As the owner, I want failed/partial setup to be recoverable without creating another owner, so that provider outages do not compromise ownership.
4. As the owner, I want email verification and password login, so that only my verified account can access shop data.
5. As the owner, I want email password recovery, so that I can regain access securely.
6. As the owner, I want logout and recovery to invalidate the appropriate sessions, so that old access cannot continue silently.
7. As the owner, I want unauthorized direct calls denied, so that hiding a screen is not my only data protection.
8. As the owner, I want products with unique normalized SKUs and base units, so that records refer to the right goods.
9. As the owner, I want category/supplier text suggestions and optional rack information, so that product entry fits a small shop without extra management modules.
10. As the owner, I want product creation and opening stock/cost saved together, so that incomplete registration cannot create inconsistent stock.
11. As the owner, I want products with zero opening stock, so that I can prepare the catalog before receiving goods.
12. As the owner, I want cartons converted to whole base units, so that receipt entry is fast without a second stock balance.
13. As the owner, I want search, filters, sorting, and bounded pagination, so that I can find products quickly.
14. As the owner, I want existing-product selection to record restock by ID/SKU, so that similar names never merge distinct goods.
15. As the owner, I want every receipt to include its total purchase cost, so that modal is known rather than guessed.
16. As the owner, I want zero-cost goods explicitly recorded, so that free stock contributes correctly to weighted-average cost.
17. As the owner, I want receipt references reused across separately entered products, so that I can trace a paper nota without purchase orders or batch workflows.
18. As the owner, I want receipt costs to update weighted-average modal, so that different purchase prices value remaining stock consistently.
19. As the owner, I want metadata/selling-price edits separated from stock/modal changes, so that editing a product cannot rewrite inventory history.
20. As the owner, I want SKU/base unit locked once history exists, so that old quantities and references retain their meaning.
21. As the owner, I want manual Stock Out for sold quantities only, so that stock stays updated without a POS.
22. As the owner, I want overselling rejected under concurrent submissions, so that stock never becomes negative.
23. As the owner, I want retries to return the same committed outcome, so that network errors cannot double-add or double-remove goods.
24. As the owner, I want Products/Inventory/Reports to share persisted balances, so that navigation and reload do not change the truth.
25. As the owner, I want physical opname separated from sold quantity, so that discrepancies never inflate sales-volume reports.
26. As the owner, I want unchanged physical counts recorded, so that verification has evidence even without a stock adjustment.
27. As the owner, I want stale opname rejected, so that sales occurring during counting are not overwritten.
28. As the owner, I want found stock with no current balance to require purchase cost, so that its value is not fabricated.
29. As the owner, I want quantity corrections linked to original entries, so that mistakes remain explainable.
30. As the owner, I want reasoned present-value cost adjustments, so that modal mistakes can be fixed without rewriting historical movements.
31. As the owner, I want zero-stock products archived/reactivated with SKU/history retained, so that discontinued goods do not clutter active work.
32. As the owner, I want current Potensi Pendapatan/Potensi Laba Kotor including negative margins, so that estimates do not misrepresent realized sales or hide loss risk.
33. As the owner, I want stock-low/stock-empty alerts based on product thresholds, so that replenishment decisions use real quantities.
34. As the owner, I want valuation and received/sold-volume reports, so that I can monitor stock without unsupported supplier scores or forecasts.
35. As the owner, I want UTC evidence displayed and filtered in the shop timezone, so that daily reports use the right calendar boundaries.
36. As the owner, I want safe CSV exports matching report data, so that spreadsheet inspection does not introduce misleading totals or formula execution.
37. As the owner, I want drafts retained when online requests fail, so that retrying does not require retyping or pretend the write succeeded.
38. As the owner, I want shop settings separated from local display preferences, so that changing defaults does not alter historical products or destroy records.
39. As the owner, I want unsupported team/notification/currency/costing controls removed, so that the UI only promises features that work.
40. As the owner, I want a private test and proven recovery before operational launch, so that my real shop records are not the first deployment experiment.

## Implementation Decisions

- One shop and one bound verified owner; no staff, role administration, public multi-shop signup, or tenant partitions.
- Existing Next.js feature boundaries remain. Server Components use server-only queries; Server Actions validate mutations. Provider callback Route Handlers are narrow auth integration, not a second REST CRUD API.
- Supabase PostgreSQL/Auth and Vercel are approved targets. Use session-scoped Supabase access and transactional PostgreSQL RPC operations; no ORM/repository framework is required for this scope.
- Public provider signup is disabled. A secret-protected singleton bootstrap claim serializes registration; provider provisioning is recoverable and fails closed. Verified invitation/password setup is allowed if admin provisioning requires it; no email-verification bypass.
- Every server read/mutation checks verified provider identity, active session, and singleton owner binding. PostgreSQL RPCs also reject revoked sessions even if an issued access JWT has not expired. Proxy/layout redirects alone are never authorization. Privileged provisioning credentials stay server-only; normal stock operations cannot bypass owner checks.
- One product balance stores quantity and exact inventory cost value. Append-only inventory and administrative evidence explains changes; a separate immutable retry-result record prevents duplicate committed mutations.
- Quantities and carton inputs are bounded whole units. Selling-price and purchase-total inputs are bounded whole IDR; PostgreSQL exact decimals handle weighted cost, and DTOs serialize decimal money as strings.
- Receipts add quantity and their purchase total. Sold operations consume proportional current modal; selling all units clears all residual cost. Opname retains current average, requires cost for found stock after zero balance, and records unchanged counts.
- Modal corrections replace current total value with a reason; quantity corrections use linked opname. No historical reversal/replay or editing/deleting old movements.
- Row locks protect current mutations; expected revisions reject stale opname/modal/metadata changes. Stock, modal, audit, and retry result commit or roll back together.
- SKU is normalized/unique across archives and locked with base unit once history exists. Archive requires zero stock; restoration reuses original identity.
- Sold-only Stock Out has no price/payment/customer capture. Financial cards value remaining stock at current selling prices minus modal; no month-to-date or net-profit claim.
- Reports contain current valuation, opening/receipt/sold quantities by period, opname/cost events separately, and threshold alerts. Remove supplier scores and invented lead times/days-to-empty/velocity tiers.
- Shared settings contain profile/timezone and creation defaults. IDR/weighted costing/no negative stock/audit are fixed; display preferences stay local. Reset is not a factory data wipe.
- Strict contracts define allowed fields, limits, pagination, deterministic ordering, exact money serialization, errors, retry semantics, freshness, and spreadsheet-safe CSV. No raw DB errors or client-supplied actor/balance/history fields.

## Testing Decisions

- The owner approved one primary seam: authenticated server operations against real isolated PostgreSQL/Auth resources. Verify observable results and persistence rather than hooks, component internals, table-call order, or fake database behavior.
- Cover auth/bootstrap/recovery, product lifecycle, stock/modal operations, reports, exports, and settings through this boundary; test direct anonymous/unbound-owner requests, not only visible UI controls.
- Existing assert-based domain/store checks, schema checks, and browser scope smoke tests provide prior art. Keep those useful frontend checks, but they cannot prove production transactions or provider authorization.
- Verify quantity/cost/audit rollback, same/different-payload retry identity, simultaneous sold requests, stale opname/cost correction, archive-vs-receipt races, precision/free goods/final cost residuals, and same-SKU races.
- Verify exact report totals, separate sold/opname quantities, timezone intervals, negative potential margin, CSV quoting/formula neutralization, and bounded output.
- Browser smoke coverage exercises owner setup/login/recovery, create/restock/sold/opname/cost correction/archive/reactivation, reports/CSV, error-draft preservation, and desktop/mobile keyboard-accessible controls.
- Finish pending lint/type/build/frontend checks before claiming frontend verified. Test provider email delivery, disabled public signup, partial bootstrap recovery, secret isolation, and revoked-session behavior before declaring auth ready.
- Production readiness additionally requires agreed service capacity/cost, migrations, independent backups, and a successful restore drill; none is implied by mock tests or document approval.

## Out of Scope

- Multiple shops/warehouses/locations, transfers, staff accounts/roles/invitations, and purchasing/purchase-order workflows.
- POS, payments, customer invoices, realized revenue, general ledger, operating expenses, net profit, shipping allocation, and additional receipt charges.
- Fractional/weighed stock, reservations, independent carton balances, automatic historical reversal/revaluation, hard-deleting audit history, and backdated entries.
- FIFO/LIFO selection, multi-currency, batch expiry, supplier management/scores, automatic forecasting, email/webhook stock notifications, and offline sync.
- Separate REST API/service for hypothetical clients; generic repository/event/queue infrastructure; operational deployment in the first private test.
- Application code, executable database schemas/migrations, dependency installation, provisioning, deployment, git commit/push, and real-data import in this documentation task.

## Further Notes

- Ready-for-agent means sufficiently specified, NOT permission to start implementation. Separate explicit user approval is required before runtime code, migrations, dependency/infrastructure changes, or deployment.
- Target architecture is documented but not implemented. Existing mock flows remain until separately authorized integration; no real-data migration from fixtures/localStorage is assumed.
- Delivery is incremental: prove auth/provisioning and transaction boundaries first, then products/shared stock, frontend wiring, reports/settings, and release verification. Preserve existing design language and focused feature ownership.
