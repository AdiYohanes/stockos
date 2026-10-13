# StockOS — Product Requirements Document

## 1. Product Overview

StockOS is a lightweight stock management web application for one small shop (warung). It helps one owner manage products, stock levels, and daily stock movements through a simple interface. The confirmed initial fullstack scope has one owner account, not staff accounts.

All stock belongs to one shop. Warehouses, multiple locations, inter-warehouse transfers, and purchase orders are outside product scope. Incoming goods are recorded directly as stock-in movements with receipt references, without a purchasing lifecycle.

---

## 2. Product Goal

The primary goal of StockOS is to make stock management:

- Easy to understand
- Fast to operate
- Easy to monitor
- Reliable
- Accessible to non-technical users

Users should be able to quickly answer questions such as:

- What products do I currently have?
- Which products are low on stock?
- Which products are out of stock?
- What stock movements happened recently?
- Which products require attention?

---

## 3. Target Users

Initial target users:

- Owners of a single small shop or warung
- The same owner receiving goods, manually recording sold quantities, and counting stock; no staff onboarding in the initial release

Initial product scope should prioritize simple operational workflows rather than enterprise ERP requirements.

---

## 4. MVP Scope

### Authentication

Frontend flows:

- Login
- Signup
- Forgot password
- Reset password
- Logout

Tickets 1–8 implement isolated local Supabase authentication and persistent feature integrations. Ticket 9 completes Gate D private fullstack release and comprehensive verification: full repository zero-warning ESLint, private schema grant hardening, clean Next.js build, domain/store schema checks, and two-axis review; cloud and operational launch remain outside this slice.

Target authentication is Supabase email/password with verified email and password recovery. Owner signup requires a server setup secret, atomically claims the only owner slot, and closes after binding. Public provider signup is disabled; no staff/team accounts. Partial provider setup must recover the same attempt, not create another owner. Ticket 1 uses invitation-mode setup without collecting a password until email verification; implementation approved for isolated local tests only.

---

### Dashboard

Confirmed target dashboard cards: Total Products, Potensi Pendapatan, Potensi Laba Kotor, and Out of Stock. Low-stock alerts remain in stock health and the attention list.

Potensi Pendapatan is the selling value of current available stock at current selling prices, assuming all units are sold. Potensi Laba Kotor subtracts the weighted-average purchase-cost value of that stock. Both are current-stock estimates without a month-to-date sales period; negative potential margin remains visible. They are not actual revenue or net profit. Stock Out records sold quantities manually, not payment or actual sales prices; no POS, expense, shipping, or accounting module is approved.

Current Dashboard uses persistent stock potentials from owner-checked PostgreSQL reads. Money remains exact decimal text through display; negative potential gross profit stays visible.

Potential information includes:

- Total products
- Total stock
- Low-stock items
- Out-of-stock items
- Recent stock activity
- Inventory status summaries

The dashboard should prioritize actionable information rather than decorative analytics.

---

### Product Management

Users should eventually be able to:

- View products
- Search products
- Filter products
- View product details
- Add products
- Edit products
- Archive or deactivate products

Basic product information may include:

- Product name
- SKU
- Category
- Current stock
- Unit
- Minimum stock threshold
- Status

Confirmed product fields and constraints are specified in `docs/DATABASE.md`. SKU is trimmed/uppercase/unique across archives; SKU/base unit lock after inventory history exists. Names/category/supplier use text suggestions rather than fixed technical enums; supplier and shelf are optional. Archive requires zero stock and preserves identity/history; reactivation reuses the SKU. No permanent product/history deletion through the app. Existing-product restock selects ID/SKU, never merges by name alone.

---

### Inventory

Users should eventually be able to monitor inventory quantities.

Core concepts:

- Current quantity
- Available stock
- Low-stock status
- Out-of-stock status

Inventory remains simple: one authoritative balance per product, whole base-unit quantities, no reservations or weighed/fractional goods. Cartons are receiving-input conversion only. Stock below zero is rejected. Receipt/opening-stock total purchase cost is required in whole IDR; zero means genuinely free goods. Exact weighted-average modal is updated atomically with quantity and evidence.

---

### Stock Movements

StockOS should track stock quantity changes.

Initial movement types may include:

- Stock in
- Stock out
- Stock Opname (Adjustment)

Each movement should eventually record enough information to understand:

- What changed
- Which product changed
- Quantity change
- When it happened
- Who initiated it

Confirmed rules: Stock In adds received goods and total purchase cost; Stock Out removes sold quantities only, manually recorded without a POS. Opname reconciles physical stock and quantity-entry errors separately from sold volume, retaining even unchanged counts. A changed stock version requires review/recount. Found positive stock after zero requires purchase cost; other counts preserve average modal.

Quantity corrections append a linked opname record. Modal corrections append a reasoned present-value adjustment without replaying prior sales/receipts. Preserve original history. Stock/modal/evidence and retry result succeed or fail together; concurrent stock out cannot oversell and request retries cannot duplicate changes.

### Reports and Settings

Live reports cover stock valuation/potentials, opening/received/sold volume by shop-timezone date period, separate count/modal evidence, and threshold-based low/zero stock. Export safe CSV from the same source. Supplier scores, lead-time/days-to-empty predictions, and unsupported velocity tiers are removed during integration.

Shared settings contain shop profile, IANA timezone (`Asia/Jakarta`, `Asia/Makassar`, `Asia/Jayapura`), and new-product unit/threshold defaults. IDR/weighted costing/no-negative-stock/audit are fixed rules. Display/language preferences stay browser-local. No team management, email/webhook stock delivery, expiry tracking, or operational data wipe. Preference/default reset never deletes products, history, or the owner.

---

## 5. Frontend Phase Scope

Frontend Foundation is prior work. Tickets 1–11 implement isolated local authentication/recovery and persistent Products, Inventory, Reports, Settings, and Dashboard. Ticket 12 local operations proof is complete. Approved hardening retains these boundaries; cloud, deployment, external SMTP, paid resources, production launch, and real-shop use require separate approval.

Frontend objectives:

- Validate information architecture
- Validate primary user flows
- Establish reusable UI components
- Establish the StockOS design system
- Build responsive interfaces
- Build realistic mock interactions

Mock data was used during Frontend Foundation. Current operational routes use isolated local persistence; retained mock datasets are regression fixtures only.

Backend implementation should not be inferred solely from temporary frontend mock structures.

---

## 6. Out of Scope for Current Phase

The following are not part of the current frontend phase unless explicitly requested:

- Production database
- Production authentication
- API implementation
- Database migrations
- Accounting
- General ledger
- Purchasing workflow
- Sales order management
- Warehouse management, multiple locations, and stock transfers
- Purchase orders and purchasing lifecycle
- Multi-company ERP
- Advanced forecasting
- Enterprise approval workflows

These capabilities may be evaluated later.

---

## 7. UX Principles

StockOS should prioritize:

### Simplicity

Common actions should require minimal steps.

### Visibility

Important inventory conditions should be immediately recognizable.

### Consistency

Similar actions should behave consistently across features.

### Feedback

Users should receive clear feedback for:

- Loading
- Success
- Failure
- Empty states
- Validation errors

### Accessibility

Interactive elements should:

- Be keyboard accessible
- Have visible focus states
- Maintain sufficient contrast
- Use meaningful labels

---

## 8. Responsive Requirements

The application should support:

- Desktop
- Tablet
- Mobile

Desktop is the primary operational experience.

Mobile layouts should remain usable for monitoring and common lightweight actions.

---

## 9. Performance Expectations

Frontend should:

- Avoid unnecessary client-side JavaScript
- Avoid unnecessary dependencies
- Keep interactions responsive
- Avoid excessive animation
- Avoid rendering large unnecessary component trees

---

## 10. MVP Success Criteria

The frontend MVP should allow a user to understand and navigate the expected StockOS workflow without requiring a production backend.

A successful frontend foundation should demonstrate:

1. Authentication experience
2. Dashboard experience
3. Product management flow
4. Inventory visibility
5. Stock movement flow
6. Consistent responsive design

---

## 11. Future Product Areas

Possible future capabilities may include:

- Sales integration
- Barcode support
- Additional reporting beyond the approved inventory valuation/volume/threshold scope
- Staff accounts and enforced multi-role permissions
- Real notifications

Warehouses, multiple locations, transfers, and purchase orders are not an approved roadmap; adding them requires an explicit scope change.

These are future considerations and should not automatically be treated as approved MVP requirements.

---

## 12. Current Status

Current development phase:

**Backend Foundation local correctness hardening — approved 2026-10-11**

Authorized repair scope: reliable mutation retry/conflict review, exact shop-local reports, bounded report detail/export, shared new-product defaults, unused-runtime cleanup, and isolated synthetic-data regression proof. Ticket 12 local operations proof is complete; external operational gates remain blocked. No cloud, deployment, external SMTP, paid resources, production launch, or real-shop data.

Tickets 1–11 connect authentication and all feature screens to local Supabase and verify the sample warung catalog. Implementation approved 2026-10-11 for local forward migration and independent backup/restore proof, environment/secrets separation, capacity/cost evaluation, and operations/recovery runbook. External SMTP delivery remains blocked; only a no-send readiness harness is approved. Cloud provisioning, deployment, paid resources, real-shop data/import, production launch, and domain feature changes remain excluded.

Implemented:

- Authentication UI
- Local Supabase single-owner authentication
- Local private product/stock database, lifecycle/stock/modal RPCs, and bounded reads wired into feature UI
- Protected dashboard area
- Dashboard UI
- Persistent product catalog, add/edit/archive/reactivate, and stock-in/out flows
- Brief success animation only after successful product creation
- Single-shop inventory levels, adjustments, and movement history
- Persistent valuation, recorded movement, and threshold-based low-stock reports
- Persistent shop profile/timezone/creation defaults and browser-local display/language preferences; no team roles

Active dashboard navigation: Dashboard, Products, Inventory, Reports, Settings. No warehouse or purchase-order module.

Local Supabase Auth/PostgreSQL is authoritative for all five feature routes. Products and Inventory share one persistent stock balance; Dashboard/Reports consume owner-checked aggregates. Browser storage contains display/language preferences only. Retained mock stores serve regression checks, not application data. Production deployment is not delivered.

## 13. Backend Preparation — Documentation Only

Backend design is confirmed for the single-owner workflows above, not ERP/accounting. `docs/DATABASE.md` specifies native constraints and transactions; `docs/API_CONTRACT.md` specifies server queries/actions; `ARCHITECTURE.md` defines boundaries; `docs/FULLSTACK_SPEC.md` is the issue specification; `docs/BACKEND_PLAN.md` sequences implementation, proof, and release gates.

Remaining work is implementation approval and provider/operational proof, not unapproved business-feature expansion. Supabase owner provisioning with public signup disabled, email delivery/recovery, session revocation, native decimal transactions, and access restrictions must be verified in isolated resources before claiming delivery.

Acceptance expectations for the proposed backend:

- Authorized changes survive reload and are visible consistently across features and sessions.
- A stock change and its audit record succeed or fail together; concurrent or repeated submissions cannot silently lose or duplicate stock changes.
- Unauthorized or invalid requests do not mutate data. Error states preserve unsaved form input.
- Historical records remain explainable after product edits, archival, or stock corrections.
- Reports identify their data sources and do not present demo values as production results.

Design/scope and the testing seam are approved. Backend implementation still requires separate explicit approval; initial deployment is private testing, with operational readiness/backup/restore and applicable deployment permission required before real-shop use.
