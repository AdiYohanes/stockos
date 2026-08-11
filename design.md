# Design System: Hybrid Neo-SaaS (70% Clean SaaS + 30% Neobrutalism)

## 1. Core Philosophy

StockOS balances high-efficiency enterprise ERP usability with distinct modern branding by blending **70% Clean SaaS / Dashboard UI** and **30% Neobrutalism**.

- **70% Clean SaaS Baseline**: Clean neutral backgrounds, subtle 1px structural container borders, balanced spacing, modern rounded corners (`rounded-lg` / `rounded-md`), high-density data presentation, clear visual hierarchy, and refined typography.
- **30% Neobrutal Accents**: High-contrast electric purple (`#543AFD`) and pure ink black accents, crisp tactile micro-shadows (`2px 2px 0px #000000` / `3px 3px 0px #000000`) on CTAs and interactive elements, uppercase monospace tags for SKUs/status badges, and snappy micro-press interactions (`translate(1px, 1px)`).

---

## 2. Color Palette

| Role | Token / Hex | Description |
|---|---|---|
| **Background / Canvas** | `#f8f9fa` (`--background`) | Clean, neutral, glare-free light canvas |
| **Surface / Card** | `#ffffff` (`--card`) | Pure flat white for cards, panels, and dropdowns |
| **Border (SaaS Neutral)** | `#e2e8f0` (`--border`) | Subtle structural dividers and default container edges |
| **Border (Neobrutal Accent)** | `#000000` | High-contrast borders on primary CTAs and active tags |
| **Text Primary** | `#09090b` (`--foreground`) | Deep high-contrast ink for headlines and primary text |
| **Text Secondary / Muted** | `#64748b` (`--muted-foreground`) | Refined slate for metadata, labels, and helper text |
| **Primary Accent** | `#543afd` (`--primary`) | Electric purple for brand actions, links, and focus rings |
| **Primary Accent Hover** | `#462ee0` | Deeper purple for button hover states |
| **Input Focus Shadow** | `#543afd` | Crisp hard offset focus ring (`2px 2px 0px #543afd`) |
| **Placeholder Text** | `rgba(0, 0, 0, 0.45)` | Subtle readable placeholder text |

---

## 3. Radii, Borders & Micro-Shadows

### Border Radii
- **Cards / Main Containers**: `8px` (`rounded-lg` / `--radius: 0.5rem`)
- **Buttons / Inputs / Dialogs**: `6px` (`rounded-md`)
- **Badges / Status Pills / SKU Tags**: `4px` (`rounded-sm`)

### Micro-Shadows (30% Neobrutal Accent)
- **Small (`shadow-neo-sm`)**: `box-shadow: 2px 2px 0px #000000;` (Badges, small action buttons)
- **Default (`shadow-neo`)**: `box-shadow: 3px 3px 0px #000000;` (Primary action buttons, floating menus)
- **Primary Accent (`shadow-neo-primary`)**: `box-shadow: 2px 2px 0px #543afd, 2px 2px 0px 1px #000000;` (Active card accents, focus states)
- **Default Containers / Cards**: No heavy drop shadows. Clean `1px solid #e2e8f0` border for maximum data readability.

---

## 4. Typography

### Font Hierarchy
1. **Space Grotesk** (UI Headlines, Body & Forms):
   - Weights: `400` (Regular), `500` (Medium), `600` (SemiBold), `700` (Bold)
   - Clean, highly legible sans-serif with subtle geometric character fitting the Neo-SaaS identity.

2. **Space Mono** (Eyebrows, Badges, SKU Codes, Metrics & Structural Meta):
   - Weights: `400`, `700`
   - Styling: `UPPERCASE`, tracking `0.08em` to `0.14em` (`tracking-wider`) for tabular data and status tags.

---

## 5. Interaction Model

### Tactile Button / Card 'Press'
- **Resting State**: `border: 1.5px solid #000000; box-shadow: 2px 2px 0px #000000;`
- **Hover State**: `transform: translate(-1px, -1px); box-shadow: 3px 3px 0px #000000;`
- **Active / Press State**: `transform: translate(1px, 1px); box-shadow: 0px 0px 0px #000000;`

### Input Focus
- **Resting State**: `border: 1px solid #cbd5e1; background-color: #ffffff; border-radius: 0.375rem;`
- **Focus State**: `border-color: #000000; outline: none; box-shadow: 2px 2px 0px #543afd;`
