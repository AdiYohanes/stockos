# StockOS 📦

StockOS is a lightweight web-based stock management application for one small shop (warung). Warehouse management, transfers between locations, and purchase orders are outside the current scope.

It bridges the gap between basic spreadsheet inventory trackers and complex enterprise ERPs by focusing on **simplicity, speed, and clear operational visibility**.

## 🚀 Current Phase: Frontend Foundation
The project is currently in the **Frontend Foundation** phase. 
- The UI and core frontend flows are built.
- It uses **mock data** to simulate behavior.
- **No production backend or database yet** (planned for the next phase).

## 🛠 Tech Stack
- **Framework:** Next.js (App Router)
- **UI/Styling:** React, Tailwind CSS, shadcn/ui
- **Language:** TypeScript

## 🌟 Core Features
- **Dashboard:** Mock overview of inventory health, low stock, and stock movements.
- **Products:** Catalog management, SKU tracking, minimum thresholds, and a success animation after creation.
- **Inventory:** Shop stock levels, direct stock in/out, adjustments, and movement logs.
- **Reports:** Mock valuation, velocity, reorder, and supplier performance summaries.
- **Settings:** Shop profile, inventory rules, and team roles saved locally in the browser.

Products and Inventory use independent session-scoped mock stores. Dashboard and Reports use fixtures, not live aggregates. Supplier metadata remains; no standalone supplier management screen is active.

## 📂 Project Structure
This project uses a feature-based architecture. If you need to find something, start here:
- `src/features/` - Feature modules (Dashboard, Products, Inventory, etc.). **All domain logic and feature UI lives here.**
- `src/app/` - Next.js routes and page composition.
- `src/components/` - Shared UI primitives (buttons, tables, layout).
- `src/lib/` - Utilities and translations (i18n).
- Root documentation: `PRD.md`, `ARCHITECTURE.md`, `PROGRESS.md`, and `design.md`.
- `docs/` - Agent references and historical plans.

## 💻 Getting Started

```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
