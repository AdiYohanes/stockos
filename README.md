# StockOS 📦

StockOS is a lightweight web-based stock management application for one small shop (warung). Warehouse management, transfers between locations, and purchase orders are outside the current scope.

It bridges the gap between basic spreadsheet inventory trackers and complex enterprise ERPs by focusing on **simplicity, speed, and clear operational visibility**.

## 🚀 Current Phase: Backend Foundation — local correctness hardening
- Owner authentication, products, inventory, reports, settings, and dashboard persist to **local Supabase PostgreSQL** (Docker).
- Frontend flows use real local persistence; production/deployment is **not** implemented.
- Money is stored and displayed as **exact decimal values** (no float rounding).

## 🛠 Tech Stack
- **Framework:** Next.js 16 (App Router), React 19
- **UI/Styling:** Tailwind CSS 4, shadcn/ui patterns, neobrutalist design system
- **Language:** TypeScript 5
- **Backend:** Supabase (PostgreSQL + Auth), local via Docker

## 🖥 Runtime Requirements (tested environment)
| Tool | Tested version |
| --- | --- |
| Node.js | 22.20.0 |
| npm | 11.6.1 |
| Python | 3.14.6 (run scripts with `python -I`) |
| Playwright | 1.62.0 (browsers installed via `npx playwright install`) |
| Docker (server API) | 29.4.1 |

These are the versions this environment was verified against — not guaranteed minimums.

## 🌟 Core Features
- **Dashboard:** Live inventory health, Potensi Pendapatan / Potensi Laba Kotor, bounded attention items, quick actions.
- **Products:** Persistent catalog, SKU tracking, archive/reactivate lifecycle, exact cost fields.
- **Inventory:** Stock levels, stock in/out, opname adjustments, cost corrections, movement history.
- **Reports:** Valuation, movement velocity, low-stock reorder — bounded reads, CSV export with formula defense.
- **Settings:** Shop profile, timezone-driven report dates, product creation defaults.
- **Auth:** Owner-only access; invitation, password setup, login, recovery with session revocation.

## 📂 Project Structure
- `src/features/` - Feature modules (Dashboard, Products, Inventory, etc.). **All domain logic and feature UI lives here.**
- `src/app/` - Next.js routes and page composition.
- `src/components/` - Shared UI primitives (buttons, tables, layout).
- `src/lib/` - Utilities and translations (i18n: Indonesian + English).
- `supabase/migrations/` - Forward-only PostgreSQL migrations.
- `scripts/` - Proof, seeding, and verification tooling.
- Root documentation: `PRD.md`, `ARCHITECTURE.md`, `PROGRESS.md`, and `design.md`.
- `docs/` - Agent references and plans.

## 💻 Getting Started

```bash
npm install
npx supabase start        # local Supabase stack (Docker)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The owner account is created through the local setup flow on first run.

## ✅ Verification

Fast checks (no Docker fixtures required):

```bash
npm run check             # domain stores, dashboard exact money, catalog, SMTP self-test, reports, proof guard, settings, seeder safety, operations self-test
npm run typecheck
npm run lint -- --max-warnings 0
```

Full local proof (serial; creates and destroys its own Docker fixtures):

```bash
python -I scripts/launch-hardening-proof.py --run     # 9-suite Auth/PostgreSQL/browser proof
node scripts/check-operations.mjs --run               # forward migration + dump/restore drill
```

The operations drill writes `evidence.json` with a final status (`PASS_LOCAL_ONLY` only when cleanup also passed) into a protected temp directory. **Proof directories and dumps contain Auth credentials — never commit or share them.**

## 🚫 Blocked Gates (external, currently HOLD)
Cloud provisioning, Vercel deployment, external SMTP delivery, paid resources, production launch, and real-shop data remain excluded pending the A1–A5 decisions in `docs/DEPLOY_PLAN.md`.
