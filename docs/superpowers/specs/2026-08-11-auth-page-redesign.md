# Design Spec: Minimalist Split-Studio Authentication Experience

## 1. Overview
Redesign StockOS authentication pages (`/login`, `/signup`, `/reset`, `/newpassword`) into a clean, modern, minimalist Split-Studio layout. Replace heavy walls of text with clean whitespace, polished typography, subtle micro-animations, and the illustrated warehouse visual asset (`/assets/login-background.png`).

## 2. Visual & Layout Architecture

### 2.1 Layout (`src/app/(auth)/layout.tsx`)
- **Desktop (Split-Screen `min-h-screen lg:grid lg:grid-cols-12 p-4 lg:p-6 gap-6 bg-slate-50/60`)**:
  - **Left Hero Panel (`lg:col-span-6 xl:col-span-7`)**:
    - Rounded visual container (`rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden relative`)
    - Hero image: `public/assets/login-background.png` rendered with Next.js `<Image fill priority className="object-cover object-center" />`
    - Top branding badge: Minimal glass pill with StockOS logo (`/stockos-logo.png` or clean icon + "StockOS")
    - Floating animated micro-chips:
      - Top-right/floating: Subtle glass badge with pulse dot (`● Live Sync Active`) with gentle vertical floating animation (`animate-[float_4s_ease-in-out_infinite]`)
      - Bottom overlay card: Compact glass card with one concise line: "Smart inventory tracking & multi-warehouse sync." Zero paragraph clutter.
  - **Right Form Panel (`lg:col-span-6 xl:col-span-5 flex flex-col justify-between py-6 px-4 sm:px-8`)**:
    - Centered form container (`w-full max-w-[420px] mx-auto my-auto`)
    - Top mobile logo (hidden on desktop)
    - Subtle smooth page entry transition animation (`animate-in fade-in slide-in-from-bottom-3 duration-500`)
    - Bottom minimal footer: Copyright & links (Privacy, Terms, Help).

### 2.2 Auth Form Refinements
- **`login-form.tsx`**:
  - Clean card with subtle shadow and border.
  - Compact, elegant demo account banner with quick 1-click auto-fill pill.
  - Crisp input fields with clear icons and focus-visible glow ring (`focus-visible:ring-[#543afd]/20`).
  - Subtle interactive micro-animations (button hover/press, smooth loading spinner).
- **`signup-form.tsx`**:
  - Minimalist 2-column/1-column responsive input structure with clean labels and helper text.
- **`reset-form.tsx` & `new-password-form.tsx`**:
  - Consistent minimalist cards with back-to-login links and smooth state alerts.

### 2.3 Animations & Micro-Interactions
- Custom CSS keyframe in `src/app/globals.css` or Tailwind utilities for gentle floating badge effect (`@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }`).
- Smooth button press feedback (`active:scale-[0.98] transition-transform`).
- Clean error/success alert transitions.

## 3. Verification Plan
- Verify all auth routes render properly: `/login`, `/signup`, `/reset`, `/newpassword`.
- Verify responsive layout on mobile, tablet, and desktop viewports.
- Run `npm run build` or lint/typecheck to verify no broken types or references.
