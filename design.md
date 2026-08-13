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

## 4. Typography & Operational Type Scale

### Font Family Hierarchy
1. **Inter** (Primary UI — 90% Interface):
   - Weights: `400` (Regular), `500` (Medium), `600` (SemiBold), `700` (Bold)
   - Primary sans-serif for main body, table cells, form inputs, buttons, sidebar navigation, labels, and secondary copy.

2. **Space Grotesk** (Brand Headlines & Logo):
   - Weights: `600`, `700`
   - Used specifically for brand logos, authentication page headlines, and specific prominent headers.

3. **Space Mono** (SKU Codes, Badges & Structural Meta):
   - Weights: `400`, `700`
   - Styling: `UPPERCASE`, tracking `0.08em` to `0.14em` (`tracking-wider`) for SKU codes, status tags, and monospace data.

### Operational Type Scale Tokens

| Usage | Desktop | Mobile | Weight | Line-Height | Utility Class |
| :--- | ---: | ---: | ---: | ---: | :--- |
| **Page Title** | **30px** | 26px | 700 | 36px | `text-2xl sm:text-3xl font-bold tracking-tight` |
| **Section Title / H2** | **22px** | 20px | 600–700 | 28px | `text-xl sm:text-[22px] font-semibold` |
| **Card Title / H3** | **18px** | 18px | 600 | 24px | `text-lg font-semibold` |
| **Main Body / Baseline** | **16px** | 16px | 400 | 24px | `text-base` |
| **Table Content** | **15px** | 15px | 400–500 | 22px | `text-[15px]` |
| **Input Text** | **16px** | 16px | 400 | 24px | `text-base` |
| **Button Text** | **15–16px** | 16px | 500–600 | 20–24px | `text-[15px]` / `text-base` |
| **Sidebar Navigation** | **15px** | 16px | 500 | 22px | `text-[15px]` |
| **Label** | **14px** | 14px | 500–600 | 20px | `text-sm font-medium` |
| **Helper / Secondary** | **14px** | 14px | 400 | 20px | `text-sm text-muted-foreground` |
| **Badge / Status** | **13px** | 13px | 500–600 | 18px | `text-[13px] font-semibold` |
| **Tiny Metadata** | **12px** | 12px | 500 | 16px | `text-xs` (Exception only) |
| **KPI Numbers** | **28–32px** | 28px | 700 | 36px | `text-3xl font-bold` |

---

## 5. Component Dimensions & Spacing

- **Form Input Height**: `40px` (`h-10`) or `44px` (`h-11`) with `text-base` (16px) font size to avoid cramped controls.
- **Button Height**: `40px` (`h-10`) standard size, `36px` (`h-9`) small size, `44px` (`h-11`) large size.
- **Table Row Height**: Comfortable **~52px** height (`py-3.5 px-3` cell padding).
- **Card Padding**: Standard `p-5` container padding for spacious readability.

---

## 6. Interaction Model

### Tactile Button / Card 'Press'
- **Resting State**: `border: 1.5px solid #000000; box-shadow: 2px 2px 0px #000000;`
- **Hover State**: `transform: translate(-1px, -1px); box-shadow: 3px 3px 0px #000000;`
- **Active / Press State**: `transform: translate(1px, 1px); box-shadow: 0px 0px 0px #000000;`

### Input Focus
- **Resting State**: `border: 1px solid #cbd5e1; background-color: #ffffff; border-radius: 0.375rem;`
- **Focus State**: `border-color: #000000; outline: none; box-shadow: 2px 2px 0px #543afd;`

---

## 7. Page Header & Top Title Layout Standard

All application pages MUST follow the standard top header layout pattern:

```tsx
<header className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  {/* Left: Title + Badge + Dot + Description */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
    <div className="flex items-center gap-2.5">
      <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {pageTitle}
      </h1>
      <Badge className="border-black bg-emerald-100 font-mono text-[13px] uppercase tracking-wider text-emerald-900 shadow-neo-sm">
        {statusOrTypeTag}
      </Badge>
    </div>
    <span className="hidden sm:inline text-muted-foreground/30 text-base">•</span>
    <p className="text-sm sm:text-base text-muted-foreground">
      {pageDescription}
    </p>
  </div>

  {/* Right: Action Buttons Toolbar */}
  <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto max-w-full pb-0.5 sm:pb-0">
    {/* Page Action Buttons */}
  </div>
</header>
```

### Layout Rules:
1. **Title Typography**: Always `font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground` (30px).
2. **Monospace Tag**: Adjacent to title, using `font-mono text-[13px] uppercase tracking-wider border-black shadow-neo-sm`.
3. **Bullet Separator**: Hidden on mobile, visible on desktop (`hidden sm:inline text-muted-foreground/30 •`).
4. **Description Subtitle**: `text-base text-muted-foreground` (16px).
5. **Right Toolbar**: Horizontal scrollable container on mobile, right-aligned on desktop with action buttons (`border-black hover:bg-slate-50`).


