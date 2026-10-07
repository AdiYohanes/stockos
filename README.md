# StockOS 📦

StockOS is a lightweight web-based Stock Management System / Mini ERP designed for small businesses, retail, and small warehouses.

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
- **Dashboard:** Real-time overview of inventory health, low stock, and stock movements.
- **Products:** Catalog management with SKU tracking and minimum thresholds.
- **Inventory:** Real-time stock levels, movement logs (stock in/out), and adjustments.
- **Warehouses:** Multi-location capacity tracking and stock transfers.
- **Suppliers:** Supplier performance, tiers, and contact management.
- **Purchase Orders:** End-to-end PO lifecycle, from creation to receiving goods.
- **Settings:** Company profile, inventory rules, dan team roles.

## 📂 Project Structure
This project uses a feature-based architecture. If you need to find something, start here:
- `src/features/` - Feature modules (Dashboard, Products, Inventory, etc.). **All domain logic and feature UI lives here.**
- `src/app/` - Next.js routes and page composition.
- `src/components/` - Shared UI primitives (buttons, tables, layout).
- `src/lib/` - Utilities and translations (i18n).
- `docs/` - Extensive project documentation (`PRD.md`, `ARCHITECTURE.md`, `design.md`).

## 💻 Getting Started

```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
