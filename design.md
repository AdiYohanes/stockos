---
name: StockOS
description: Lightweight operational inventory management and Mini ERP
---

<!-- SEED: established with the user before implementation; re-run /impeccable document once there's code to capture the actual tokens and components. -->

# Design System: StockOS

## Overview

**Creative North Star: "The Precision Ledger"**

StockOS is an operational inventory console engineered for high-velocity scanning, immediate status comprehension, and frictionless stock movements. The system rejects generic AI SaaS aesthetics—oversized typography, decorative card mosaics, gradient fills, thick neobrutalist borders, and glassmorphic blurs—in favor of an unpretentious, quiet, and disciplined operational interface.

The design behaves like a modern digital ledger: dense yet breathable, utilitarian, and predictable. Workspaces favor unified full-bleed tabular containers over fragmented cards-inside-cards. Hierarchy is established through typographic weight, subtle 1px hairline dividers, and disciplined semantic indicators rather than decorative elevation. The interface recedes into the background so operational data—SKUs, stock thresholds, bin locations, and supplier receipts—commands absolute focus.

**Key Characteristics:**
- **Single-Surface Containment**: Tables, toolbars, and filters live inside unified, crisp containers (`border border-slate-200 bg-white rounded-md`) rather than scattered floating card tiles.
- **Utilitarian Calm Neutrality**: A cool slate-zinc foundation provides high contrast with zero visual fatigue during prolonged daily operations.
- **Monospace Precision for Logistics**: Clear sans-serif typography for navigation and labeling, paired strictly with tabular monospace figures for SKUs, counts, dates, and currency.
- **Hairline Structural Framing**: 1px subtle divider lines provide architectural discipline without visual heaviness.
- **Disciplined Status Signaling**: Micro-dots and restrained status indicators replace bulky, loud pill badges to maximize table row scanability.

## Colors

The palette is restrained, calm, and functional: 90% neutral slate-zinc foundations with 10% purposeful semantic state indicators.

### Primary
- **Deep Slate Ink** (`#0f172a` / `slate-900`): Primary actions, high-contrast headings, active navigation states, and authoritative table text.
- **Deep Slate Hover** (`#1e293b` / `slate-800`): Hover and focus states for primary action triggers.

### Neutral
- **Canvas Ground** (`#f8fafc` / `slate-50`): Neutral, glare-free light canvas for whole-app background.
- **Surface Panel** (`#ffffff`): Pure flat white for data tables, form panels, and slide-over drawers.
- **Hairline Border** (`#e2e8f0` / `slate-200`): Subtle 1px structural container edges and table row dividers.
- **Muted Border** (`#cbd5e1` / `slate-300`): Input borders, active tab dividers, and interactive container outlines.
- **Text Primary** (`#0f172a` / `slate-900`): High-contrast ink for table values, titles, and data metrics.
- **Text Secondary / Muted** (`#64748b` / `slate-500`): Column headers, secondary metadata, unit labels, and timestamps.
- **Subtle Surface** (`#f1f5f9` / `slate-100`): Table header rows, zebra hover states, and inactive tag backgrounds.

### Functional Status (Semantic Only)
- **Healthy Stock / Completed** (`#059669` / `emerald-600`): In-stock status, successful transfers, received POs.
- **Low Stock / Reorder Trigger** (`#d97706` / `amber-600`): Low-stock warnings, draft orders, pending inspections.
- **Critical / Out of Stock** (`#dc2626` / `red-600`): Depleted inventory, overdue orders, destructive actions.
- **In Transit / Active Movement** (`#2563eb` / `blue-600`): Inter-warehouse transfers, active shipments.

### Named Rules
**The Signal Rarity Rule.** Semantic colors (emerald, amber, red, blue) are strictly reserved for operational state indicators (status dots, threshold warnings, active alerts). They must never appear as decorative accents, illustrations, or background fills.

**The Zero-Gradient Rule.** Surfaces, borders, buttons, and status chips are strictly solid flat colors. No linear, radial, or mesh gradients are permitted anywhere in the system.

## Typography

**Display / Interface Font:** Inter (or modern system UI sans-serif stack: `system-ui, -apple-system, sans-serif`)
**Data / Tabular Font:** Monospace with tabular numerals (Geist Mono, Space Mono, or `ui-monospace, monospace`)

**Character:** Calm, structured, unpretentious. Clear contrast between medium (500) structural labels and regular (400) data rows.

### Hierarchy
- **Page Title** (Semi-bold 600, 24px–26px, line-height 32px): Clear, compact screen title; never oversized hero typography.
- **Section Title / H2** (Semi-bold 600, 18px–20px, line-height 26px): Form section and sheet header markers.
- **Table Data / Cell Text** (Regular 400, 14px, line-height 20px): Baseline readability for product names, descriptions, and categories.
- **Column Header / Meta Label** (Medium 500, 12px–13px, tracking-wide): Subtle uppercase or sentence-case table column anchors.
- **Tabular Figures** (Regular 400 / Medium 500, 13px–14px, monospace tabular numerals): SKUs, quantities, batch codes, monetary totals, and timestamps.
- **KPI Summary Metric** (Semi-bold 600, 24px–28px, line-height 32px): Compact, readable metric cards; strictly no oversized display sizes.

### Named Rules
**The Compact Scale Rule.** Operational desktop screens must never use font sizes exceeding 28px. Screen real estate belongs to data rows and operational controls, not oversized headers.

**The Tabular Number Rule.** All quantities, stock counts, monetary values, dates, and SKU identifiers must be rendered in monospace with tabular figures (`font-mono tabular-nums`) to maintain strict vertical column alignment during rapid scanning.

## Layout

The spatial model is organized around a unified operational workspace rather than a grid of disconnected tiles.

- **Workspace Frame**: Persistent compact left navigation rail (~240px wide, collapsible to 64px icon rail), unified top utility header (search, warehouse selector, user profile), and a clean main operational viewport.
- **Unified Table Containers**: Data tables, instant search inputs, filter selectors, and pagination controls are unified into a single bounded box (`border border-slate-200 bg-white rounded-md overflow-hidden`).
- **Table Density & Row Rhythm**:
  - Row height: ~44px–48px compact operational density (`py-2.5 px-3.5`).
  - Header row: ~38px–40px with distinct muted background (`bg-slate-50 border-b border-slate-200`).
  - Column alignment: Text and names align left; statuses, dates, and SKUs align left/center; quantities, prices, and totals align right.
- **Metric Ribbons**: Overview metrics (Total Products, Inventory Value, Low Stock Alerts) sit in a connected horizontal ribbon with subtle vertical dividers (`divide-x divide-slate-200`) rather than isolated floating cards.
- **Slide-Over Detail Drawers**: Inspection sheets (Product details, Warehouse zone breakdown, PO line items) slide in from the right over the active table, preserving table scroll position and operational context.

### Named Rules
**The Single-Container Rule.** Never nest cards inside cards. A table, its toolbar, and its pagination must live inside one continuous container boundary.

**The Right-Aligned Number Rule.** Numerical quantities, inventory units, and financial sums must always align right in tables to enable instant vertical visual comparison.

## Elevation & Depth

StockOS uses a flat, planar surface architecture. Depth is communicated through 1px border contrast and intentional background tones rather than fuzzy ambient shadows.

### Surface Vocabulary
- **Resting Canvas**: Flat `#f8fafc` background.
- **Resting Panels & Tables**: Flat `#ffffff` surface bounded by `1px solid #e2e8f0` (`border border-slate-200`). No drop shadow.
- **Interactive Controls (Inputs, Buttons)**: Flat resting state with 1px border. Hover introduces a subtle border darkening (`border-slate-400`); focus uses a crisp 1px–2px focus ring (`ring-1 ring-slate-900`).
- **Modals & Slide-Over Sheets**: Clean structural elevation (`shadow-lg` / `box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08)`) with a calm semi-transparent backdrop (`bg-slate-900/30`).

### Named Rules
**The Border-Over-Shadow Rule.** Component and section boundaries must be defined by 1px hairline borders (`border-slate-200`), never by box shadows.

**The Flat-By-Default Rule.** All resting containers, tables, and cards have `box-shadow: none`. Shadows appear only on floating overlays (dialogs, dropdown menus, slide-over sheets).

## Shapes

Form geometry is restrained, clean, and modern.

- **Containers & Tables**: `rounded-md` (6px radius) — subtle, professional, structured.
- **Inputs & Action Buttons**: `rounded-md` (6px radius) — ergonomic shadcn/ui standard.
- **Badges & Tags**: `rounded-sm` (4px radius) or `rounded-md` (6px radius). Never full circular pill capsules (`rounded-full`) for operational tags.
- **Prohibitions**: No playful `rounded-2xl` or `rounded-3xl` bubbly silhouettes. No neobrutalist heavy black borders.

## Do's and Don'ts

### Do:
- **Do** prioritize table scanning speed: keep rows compact (~44px), pad cells comfortably (`py-2.5 px-3.5`), and align numbers right.
- **Do** use subtle status indicator dots (6px colored dot + neutral text) instead of high-saturation pill badges.
- **Do** group search, filter dropdowns, and active count badges into a single unified toolbar docked directly to the table header.
- **Do** format SKUs, batch codes, and quantities with `font-mono tabular-nums`.
- **Do** present KPI metrics in a unified single-row ribbon with subtle vertical hairlines rather than scattered cards.
- **Do** use responsive slide-over sheets for entity details so users never lose their place in the table.

### Don't:
- **Don't** nest cards inside cards.
- **Don't** use purple/blue gradients, colored shadows, or glassmorphic blur effects.
- **Don't** use heavy Neobrutalist borders (`3px 3px 0px #000000`) or springy button translate press effects.
- **Don't** use oversized typography (titles over 28px, giant 48px KPI numbers).
- **Don't** clutter table rows with brightly colored background badge pills.
- **Don't** use decorative illustrations, empty-state mascots, or gratuitous entrance animations.
- **Don't** hide critical inventory counts or action buttons behind multi-level nested menus.
