# StockOS Server Operation Contract

Status: confirmed target, 2026-10-09; not implemented. Despite this filename, the transport is Next.js Server Actions for mutations and server-only queries consumed by Server Components. No REST resource API, client database mutation, or public integration API is required. [Database design](DATABASE.md) defines persistence and arithmetic; [Glossary](../GLOSSARY.md) defines business terms.

## 1. Common Boundary

Every query/action verifies the provider session with a provider-backed check (not `getSession` cookie contents or `getClaims` signature verification alone) and confirmed email, then matches its subject to the bound single owner. PostgreSQL RPC authorization also checks the signed session identifier is still live; provider logout does not instantly invalidate already-issued access JWT signatures. Unauthorized direct calls fail even when navigation hides the action. Auth setup/login/recovery are the explicit pre-owner exceptions. Never accept `actorId`, `ownerId`, timestamps, current balance, calculated average, versions to assign, or audit rows from clients.

Use strict Zod input schemas and PostgreSQL constraints. Reject unknown fields; trim normalized text; do not silently round fractional quantity/money input. Forms may send strings; convert only after validating lexical form and bounds.

### Scalar and DTO conventions

- `id`, `requestId`: UUID strings. Each logical submission gets a request ID in an event handler, reused unchanged for retries; changed input requires a new ID.
- `quantity`: integer number from 0 to 1,000,000,000; receipt/sold quantities must exceed zero.
- Whole IDR inputs: decimal digit strings, e.g. `"10000"`, range 0–1,000,000,000,000. No decimal point, currency sign, separators, exponent, or whitespace after canonical normalization.
- Calculated money: exact decimal strings with up to six fractional places; no JavaScript float conversion for domain arithmetic. UI rounds only for display; CSV declares units and retains required precision.
- Versions: decimal integer strings. UTC ISO timestamps in output only. Nullable optional fields use null in output; absent update fields mean unchanged, explicit null clears allowed fields.
- Text limits and SKU syntax follow DATABASE.md. Category required text; supplier optional text. No fixed technical-category enum.

### Result shape

Mutations return a serializable discriminated result: success has `ok=true`, `requestId`, committed `data`, and `replayed`; failure has `ok=false`, stable `code`, safe `message`, optional `fieldErrors`, and a support `traceId` for unexpected errors. No provider token, raw SQL error, setup secret, or password is returned. Auth actions use the same error semantics without storing secrets/idempotency payloads.

Errors: `VALIDATION_ERROR`, `UNAUTHENTICATED`, `EMAIL_UNVERIFIED`, `FORBIDDEN`, `NOT_FOUND`, `SKU_EXISTS`, `PRODUCT_ARCHIVED`, `PRODUCT_HAS_STOCK`, `IDENTITY_LOCKED`, `INSUFFICIENT_STOCK`, `VERSION_CONFLICT`, `REQUEST_ID_CONFLICT`, `SETUP_CLOSED`, `SETUP_PENDING`, `RATE_LIMITED`, `LIMIT_EXCEEDED`, `INTERNAL_ERROR`. Unauthorized checks precede resource existence disclosure. Expected errors preserve form drafts; unexpected errors provide a retry/support message.

These are application codes, not HTTP-status promises for the framework's Server Action protocol. Framework redirects remain framework control flow; do not catch redirects as ordinary internal failures. An expired mutation session returns a recoverable auth failure before UI offers login; server page reads can redirect safely.

### Retry and stale state

All business mutations require `requestId`. Identical replay returns the original committed result without another write even if its expected version is now old. Same request ID with different actor, operation, or normalized input fails. Failed validations/conflicts do not consume successful request identity. Network uncertainty retries the same request; do not issue a new ID because the response was lost.

Receipt/sold apply quantity deltas to locked current stock. Opname and cost correction require expected stock version; metadata edits require expected metadata version. On conflict, retain draft and show current state, but never automatically reapply physical counts/cost corrections against a new version. Require review/recount and new submission.

After success or replay, refresh affected product/inventory/dashboard/report views and use authoritative current data. Success DTO is a transaction snapshot, especially on replay, not a live balance subscription.

## 2. Product DTO

Product returns: `id`, `sku`, `name`, `category`, `unit`, optional `supplier`, `shelfLocation`, `barcode`, `description`; `sellingPrice`, `minStock`, `currentStock`, `inventoryCostValue`, `averagePurchaseCost` as cost value / quantity rounded to six decimal places when stock is positive, null when stock is zero; `potentialSellingValue`, `potentialGrossProfit`; derived `stockStatus`; `archivedAt`, `metadataVersion`, `stockVersion`, `createdAt`, `updatedAt`.

History is separately paginated, not embedded as an unbounded product array. No reserved/available split; available quantity equals current stock because there are no reservations.

## 3. Read Contracts

| Query | Input | Result / rules |
| --- | --- | --- |
| `getOwnerSession` | None | Verified owner display/session state without tokens; never trust client cookie contents alone |
| `listProducts` | Search <=120 chars, optional category, health `all/in_stock/low_stock/out_of_stock`, archive `active/archived/all`, allowlisted sort, page/pageSize | Product DTO page and matching count; default active, pageSize 25, maximum 100 |
| `getProduct` | Product UUID | Product DTO including archived product when explicitly inspected; missing -> NOT_FOUND |
| `listInventoryEvents` | Optional product, kind, inclusive start date, exclusive end date; page/pageSize | Event DTO page; default newest first by recordedAt + ID; maximum 100 per page |
| `getTextSuggestions` | Category or supplier plus optional prefix | At most 30 distinct existing values; no standalone management operations |
| `getDashboard` | None | Active-product count, potential selling value/gross profit, stock-health counts, bounded attention/recent-event lists; current snapshot, not month-to-date revenue |
| `getValuationReport` | Optional category/search | Active-product/category quantities, cost value, potential selling value/gross profit; include aggregate as of server timestamp |
| `getMovementReport` | Required date interval, optional product/category | Opening/receipt additions, sold units, opname deltas/counts, cost adjustments reported separately; no financial sales totals or predictive velocity |
| `getLowStockReport` | Optional category/search | Active products with zero or <=threshold stock; no days-remaining, lead-time, or invented reorder predictions |
| `getShopSettings` | None | Profile, IANA timezone, creation defaults, version; no secrets or provider config |

Sort allowlist: name, sku, currentStock, sellingPrice, createdAt; asc/desc with ID tiebreak. Search uses literal text matching, not raw SQL/pattern injection. Product pages are live snapshots, not frozen across concurrent updates. Validate page bounds; no unbounded reads on normal screens.

Report dates are shop-local YYYY-MM-DD. Query `[startDate at local midnight, endDate at local midnight)` converted to UTC; endDate is exclusive. UI inclusive end-day selection adds one calendar day in shop timezone. Reject reversed/empty intervals; limit movement queries to 366 days and export separately bounded. Aggregate one report in one statement/consistent database snapshot, not several independently timed totals.

Event DTO returns kind, before/after/delta quantities and cost, purchase total when relevant, physical count, original carton metadata, reference/note, optional linked correction ID, product snapshots, actor display, server timestamp, and stock version. Sold quantity is reported positive in recorded-sold-volume summaries; stored event delta remains negative. These totals count immutable manual sold entries, not verified sales. A later opname correction is shown separately and does not rewrite earlier sold-period totals; a linked correction remains visible so the owner can identify erroneous original entries. Opening quantity is shown separately from subsequent receipts and never described as goods sold.

## 4. Mutation Contracts

Every row below also takes `requestId`; returns committed Product/Settings data and event/admin-evidence IDs as applicable.

| Action | Input | Atomic behavior and checks |
| --- | --- | --- |
| `createProduct` | Required SKU/name/category/unit/sellingPrice/minStock; optional supplier/shelf/barcode/description; opening quantity default zero, purchaseTotal required when positive; optional carton input | Unique normalized SKU across archive; create product and positive opening event/cost together. Zero opening requires zero/absent purchase total; no stock event then |
| `updateProduct` | Product ID, expectedMetadataVersion, allowlisted metadata patch | Cannot change stock/cost/history; SKU/unit changes rejected once any inventory event exists; selling-price edit changes potentials, not modal |
| `archiveProduct` | Product ID, expectedMetadataVersion, expectedStockVersion | Locked quantity must be zero; retain SKU/history; same-request replay returns original success; a fresh request for an already archived product returns PRODUCT_ARCHIVED |
| `reactivateProduct` | Product ID, expectedMetadataVersion | Restore active lifecycle without renaming/reassigning identity |
| `recordStockIn` | Product ID, positive quantity, required whole-IDR purchaseTotal, optional reference/note, optional carton pair | Reject archived; update stock and exact cost under row lock; preserve receipt cost; auto-generate reference when absent |
| `recordStockOut` | Product ID, positive sold quantity, optional reference/note | Sold-only; reject archived or insufficient stock; consume weighted-average cost; no reason selector, payment, customer, or actual-sale-price input |
| `recordOpname` | Product ID, expectedStockVersion, countedQuantity, optional note, optional correctionOfEventId, foundPurchaseTotal required only when prior quantity zero and count positive | Retain zero-difference evidence; reject stale; derive delta/cost. Linked correction requires same-product earlier event and nonblank explanation. Opname is not sold volume |
| `adjustInventoryCost` | Product ID, expectedStockVersion, replacementTotalCost, required reason, optional correctionOfEventId | Preserve quantity, adjust present valuation, append evidence; no history replay. Zero stock only permits zero total; linked event must belong to product |
| `updateShopSettings` | Expected settings version, profile/default/timezone patch | Versioned update plus administrative audit. Defaults never rewrite existing products or past timestamps |

Carton mode accepts positive integer `cartonCount` and `unitsPerCarton`; server checks multiplication is bounded and equals quantity. Both fields absent means direct base-unit count. No fractional carton, second stock balance, or silent quantity conflict. Use the same validated operation from every entry point, including dashboard quick actions and add-product restock selection.

A bare category/supplier name never creates a new managed entity. Existing-product restock selects product ID/SKU; duplicate name does not merge goods. Barcode is optional and not an approved unique identity; SKU is.

Archive and lifecycle operations fail for conflicting revisions. Inventory events for archived products are rejected; reactivate before accepting new stock or corrections. Audited replacement total cost is whole IDR by design, even when prior weighted cost value has fractional residuals.

## 5. Authentication and Setup Contracts

- `registerOwner`: setup code, owner name, normalized email, password/confirmation, shop name, IANA timezone. Validate setup secret server-side, throttle abuse, atomically claim singleton registration, provision one provider identity, then bind it. Business access remains blocked until email verified. Return setup/email-confirmation state, never provider tokens or the setup secret.
- Single-owner creation and Supabase Auth are not one distributed transaction. A durable provisioning attempt blocks new claimants. A retry with matching setup secret and candidate email reconciles the same attempt/provider identity; mismatching email returns SETUP_PENDING. Only a definitive provider rejection proving no user exists releases that exact claim. Timeout/crash retains pending state; provider lookup alone must not authorize concurrent retry creation while an earlier provider request remains unresolved. See DATABASE.md for fail-closed recovery. Bound signup redirects to login with registration-closed explanation.
- Public Supabase signup must be disabled independently of the UI. Initial user provisioning uses server-only admin APIs (invitation/verification plus password setup); no manual `email_confirm=true` bypass. Prove this provider flow in the first isolated integration check. If signup-password provisioning is incompatible with current admin APIs, retain the single-owner setup and use an explicitly invitation-mode registerOwner contract that omits password/confirmation; the same candidate sets the password through the verified invitation landing flow. Do not collect then discard a password or open public signup.
- `resendOwnerConfirmation`: normalized email and setup secret for an invitation-mode bootstrap without password, or a provider-authenticated unconfirmed owner session. Return generic success, enforce shared throttling, and resend only for the same bound unconfirmed owner using the proven provisioning flow's supported provider API (signup confirmation versus invitation must not be confused). Never reassign the owner or create another identity on resend.
- `signIn`: normalized email/password, generic credentials failure. Verify provider identity/email and owner binding before accessing shop. Failed auth never leaks shop existence/data.
- `signOut`: revoke applicable provider session and clear server cookies; logout/reset password must honor revoked-session state in later server reads/writes.
- `requestPasswordReset`: email, generic success whether matching or not, rate limiting. Send provider recovery link only with allowlisted application callback; no user-controlled redirect.
- Auth confirmation/recovery callback Route Handler verifies provider token/code and intended purpose through supported provider APIs, then establishes constrained session/redirect. It is not an alternative CRUD API. Never trust an unverified recovery query/hash or log tokens.
- `resetPassword`: new password/confirmation accepted only after valid provider recovery verification and owner match. Clear recovery state and require login after completion; expire/revoke old sessions according to supported provider configuration, with integration proof.

Provider SMTP/email delivery and invitation/reset token behavior must be verified before declaring auth ready. Setup code, credentials, and auth tokens are never stored in mutation_requests/audit. Secrets stay outside public environment variables. Provider password policy is used, at least 12 characters, with confirmation and bounded input; no custom password hashing/store.

## 6. CSV Export and Settings Reset

`exportReport` is an authenticated bounded server read callable from a Server Action: report kind (`valuation`, `movements`, `low_stock`), the same validated filters/date rules, returns filename/content/type for browser download. Limit 10,000 rows and 5 MiB; exceed limit returns LIMIT_EXCEEDED rather than silently truncate. No separate public export endpoint is needed for these small-shop limits.

CSV has fixed headers, explicit IDR/quantity semantics, UTC timestamps plus declared shop timezone/interval where relevant, standard quoting/escaping, and spreadsheet-formula neutralization for user-entered text beginning with `=`, `+`, `-`, `@`, or leading control/whitespace followed by such prefixes. Negative numeric outputs remain numeric, not transformed as untrusted text. No auth/setup details in exports.

Local display preference reset stays browser-local. Shared default reset, if exposed, is a versioned update of permitted default fields through `updateShopSettings`, explicitly confirmed in UI. Neither deletes products/events nor changes owner/auth settings.

## 7. UI Failure and Freshness Rules

Disable pending submission as convenience, not sole duplicate protection. Preserve drafts on validation, session expiry, network error, or conflict. Reconcile successful mutation via server refresh/revalidation across all affected features; browser Zustand state never becomes an independent persistent balance. No optimistic stock success before database commit.

Use current Next.js cookie/Server Action/revalidation APIs verified against installed docs. Keep native origin protection; allow only intended hosts, prohibit state changes via GET, and keep auth callbacks allowlisted. Do not use page/layout/proxy redirects as permission enforcement. Errors/not-found/empty states remain accessible and translated in the existing UI pattern.
