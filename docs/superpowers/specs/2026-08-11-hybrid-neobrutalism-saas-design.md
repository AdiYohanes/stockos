# Hybrid Neo-SaaS Design System Specification (70% Clean SaaS + 30% Neobrutalism)

**Date**: 2026-08-11  
**Project**: StockOS (Stock Management System / Mini ERP)  
**Status**: Approved Spec  

---

## 1. Overview & Philosophy

StockOS balances high-efficiency enterprise ERP usability with distinct modern branding by blending **70% Clean SaaS / Dashboard UI** and **30% Neobrutalism**.

- **70% Clean SaaS Baseline**: Clean neutral backgrounds, subtle 1px structural container borders, balanced spacing, modern rounded corners (`rounded-lg` / `rounded-md`), high-density data presentation, clear visual hierarchy, and refined typography.
- **30% Neobrutal Accents**: High-contrast electric purple (`#543AFD`) and pure ink black accents, crisp tactile micro-shadows (`2px 2px 0px #000000` / `3px 3px 0px #000000`) on CTAs and interactive elements, uppercase monospace tags for SKUs/status badges, and snappy micro-press interactions (`translate(1px, 1px)`).

---

## 2. Color Palette & Tokens

| Role | Token / Hex | Usage |
|---|---|---|
| **Background** | `#f8f9fa` (`--background`) | Clean, neutral, glare-free light canvas |
| **Surface / Card** | `#ffffff` (`--card`) | Pure flat white for cards, panels, and dropdowns |
| **Border (SaaS Neutral)** | `#e2e8f0` (`--border`) | Subtle structural dividers and default container edges |
| **Border (Neobrutal Accent)**| `#000000` | High-contrast borders on primary CTAs and active tags |
| **Text Primary** | `#09090b` (`--foreground`)| Deep high-contrast ink for headlines and primary text |
| **Text Secondary / Muted** | `#64748b` (`--muted-foreground`)| Refined Slate for metadata, labels, and helper text |
| **Primary Accent** | `#543afd` (`--primary`) | Electric purple for brand actions, links, and focus rings |
| **Primary Accent Hover** | `#462ee0` | Deeper purple for button hover states |
| **Input Focus Shadow** | `#543afd` + `#000000` | Crisp hard offset focus ring (`2px 2px 0px #543afd`) |

---

## 3. Radii & Elevation

### Border Radii
- **Cards / Containers**: `8px` (`rounded-lg` / `--radius: 0.5rem`)
- **Buttons / Inputs / Modals**: `6px` (`rounded-md`)
- **Badges / Status Pills / SKU Tags**: `4px` (`rounded-sm`)

### Micro-Shadows (Neobrutal Accent)
- **`shadow-neo-sm`**: `2px 2px 0px #000000;` (Badges, icon action buttons, table action triggers)
- **`shadow-neo`**: `3px 3px 0px #000000;` (Primary action buttons, floating menus)
- **`shadow-neo-primary`**: `3px 3px 0px #543AFD, 3px 3px 0px 1px #000000;` (Focus states, active card accents)
- **Default Containers / Cards**: No heavy drop shadows. Clean `1px solid #e2e8f0` border for maximum data readability.

---

## 4. Typography

1. **Space Grotesk** (UI Headlines, Body, Labels, Navigation):
   - Weights: `400` (Regular), `500` (Medium), `600` (SemiBold), `700` (Bold)
   - Clean, highly legible sans-serif with subtle geometric character fitting the Neo-SaaS identity.
2. **Space Mono** (Badges, SKU Codes, Metrics, Eyebrows, Status Pills):
   - Weights: `400`, `700`
   - Uppercase tracking (`tracking-wider`), structured alignment for numerical and tabular metadata.

---

## 5. Component Specifications

### 5.1 Buttons (`src/components/ui/button.tsx`)
- **Primary**: Electric purple background (`#543AFD`), white text, `1.5px solid #000000`, `rounded-md`, `shadow-neo-sm` (`2px 2px 0px #000`).
  - Hover: `transform: translate(-1px, -1px); box-shadow: 3px 3px 0px #000; background: #462ee0;`
  - Active: `transform: translate(1px, 1px); box-shadow: 0px 0px 0px #000;`
- **Secondary / Black**: Solid black background (`#000000`), white text, `rounded-md`, `shadow-neo-sm`.
- **Outline / Ghost**: Flat white/transparent, `1px solid #e2e8f0`, dark text, subtle gray hover fill.

### 5.2 Cards & Containers (`src/components/ui/card.tsx`)
- Surface: `#ffffff`
- Border: `1px solid #e2e8f0`
- Radius: `rounded-lg` (`8px`)
- Padding: Standard SaaS spacing (`p-5` or `p-6`)
- Header: Bold Space Grotesk title, muted Space Grotesk/Space Mono subtitle.

### 5.3 Inputs & Form Fields (`src/components/ui/input.tsx`)
- Surface: `#ffffff`
- Border: `1px solid #cbd5e1` (or `#e2e8f0`), `rounded-md` (`6px`)
- Focus State: `outline: none; border-color: #000000; box-shadow: 2px 2px 0px #543afd; background-color: #ffffff;`

### 5.4 Badges & Status Pills (`src/components/ui/badge.tsx`)
- Radius: `rounded-sm` (`4px`)
- Border: `1px solid #000000`
- Font: `Space Mono`, uppercase, `text-xs`, `tracking-wider`
- Variants:
  - Default: Light purple fill (`#ede9fe`), text `#543afd`
  - Success: Mint/green fill (`#dcfce7`), text `#15803d`
  - Warning: Amber fill (`#fef3c7`), text `#b45309`
  - Destructive: Rose/red fill (`#ffe4e6`), text `#be123c`
  - Neutral / SKU: `#f1f5f9`, text `#0f172a`

### 5.5 Data Tables & Grids (`src/features/dashboard/components/need-attention-table.tsx`)
- Container: Clean card with `1px solid #e2e8f0`, `rounded-lg`.
- Table Header: Uppercase muted Space Mono (`text-xs font-semibold text-slate-500 bg-slate-50/75`).
- Rows: `1px solid #f1f5f9` horizontal dividers, hover highlight `bg-slate-50/50`.
- Data Cells: Space Grotesk product names, Space Mono SKU badges and quantities.

### 5.6 Shell & Navigation (`src/components/layout/`)
- Sidebar: Solid `#ffffff` or clean `#f8f9fa`, `1px solid #e2e8f0` border right, `rounded-none` layout frame.
- Active Nav Link: Solid `#543AFD` pill or clean black pill with white text, `rounded-md`.
- Navbar: Clean white top bar with `1px solid #e2e8f0` bottom border, user avatar and quick actions.

### 5.7 Auth Pages (`src/features/auth/components/`)
- Centered auth card: `#ffffff`, `rounded-xl`, `1px solid #e2e8f0`, `shadow-neo` (`3px 3px 0px #000000`).
- Clean brand header with purple accent badge and Space Grotesk heading.

---

## 6. Files to Update

1. `design.md`: Overwrite with new Hybrid Neo-SaaS specification.
2. `AGENTS.md`: Update Design System section to document 70% SaaS + 30% Neobrutalism rules.
3. `src/app/globals.css`: Update CSS variables, border radius, shadows (`shadow-neo-sm`, `shadow-neo`, `shadow-neo-primary`), button styles, input focus styles, remove full-screen dot-grid.
4. `src/components/ui/button.tsx`: Update button variants for rounded-md, 1.5px border, and neo-shadows.
5. `src/components/ui/card.tsx`: Update card border, radius (`rounded-lg`), and padding.
6. `src/components/ui/input.tsx`: Update input border, radius, and neo-focus state.
7. `src/components/ui/badge.tsx`: Update badge border, radius, and Space Mono styling.
8. `src/components/layout/sidebar.tsx` & `navbar.tsx` & `app-shell.tsx`: Align with 1px border dividers and rounded active states.
9. `src/features/dashboard/components/*`: Update dashboard cards, metrics, chart container, table styling, and quick action buttons.
10. `src/features/auth/components/*`: Update auth card, inputs, and submit buttons.

---

## 7. Verification Plan

1. Verify Next.js dev server runs without build or styling errors (`npm run build` or inspect runtime).
2. Inspect Dashboard page (`/`):
   - Neutral `#f8f9fa` canvas background.
   - Clean white `rounded-lg` cards with `1px solid #e2e8f0` borders.
   - Snappy `shadow-neo-sm` on action buttons with `1px` press effect.
   - Crisp uppercase `Space Mono` badges on table rows and metric indicators.
3. Inspect Auth page (`/login`):
   - Centered `rounded-xl` clean card with subtle `3px 3px 0px #000000` shadow.
   - Neo-focus ring on inputs (`2px 2px 0px #543afd`).
