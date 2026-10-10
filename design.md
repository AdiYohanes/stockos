---
name: StockOS
description: Hard Neobrutalist stock management for one small shop
---

<!-- SEED: established with the user before implementation; re-run /impeccable document once there's code to capture the actual tokens and components. -->

# Design System: StockOS

## Overview

**Creative North Star: "Hard Neobrutalism & Tactile Logistics"**

StockOS is an operational inventory console engineered with a striking, unapologetic hard-neobrutalist visual system. The system rejects soft modern SaaS aesthetics—subtle drop shadows, rounded corners, and low-contrast greys—in favor of loud, high-contrast, tactile components that mimic physical printed forms and mechanical switches.

The design relies on a strict "Paper, Ink, and Acid" palette: stark grid-dot backgrounds, aggressive heavy black borders, hard offset shadows, and vibrant purple highlights. 

**Key Characteristics:**
- **Paper & Grid Canvas**: The background utilizes rigid grid-dots or paper-like textures to anchor the interface as a physical workspace.
- **Heavy Structural Framing**: 3px solid black borders define all containers, tables, and interactive elements.
- **Hard Offset Shadows**: No soft blur. Depth is created using solid black offset shadows (e.g., `4px 4px 0px #000`).
- **Tactile Press Effects**: Interactive elements feel physical, depressing physically when clicked (moving to replace their shadow).
- **Square-Only Geometry**: Strict adherence to sharp 90-degree corners. Zero border radius.

## Colors

The palette is aggressive, high-contrast, and strictly limited to maximize impact.

### Core Theme
- **Paper Canvas** (`#f8f9fa` or clean white `#ffffff`): The base layer. Often overlaid with a dotted grid pattern.
- **Heavy Ink** (`#000000`): Primary text, all borders, hard shadows, and high-contrast containers.
- **Electric Purple Highlight** (`#543AFD`): Primary brand color, primary action buttons, active states, and critical highlights.

### Functional Status (Semantic Only)
- **Healthy / In-Stock** (Vibrant Green: `#00e676` or similar)
- **Warning / Low Stock** (Bright Orange: `#ff9100`)
- **Critical / Out of Stock** (Loud Red: `#ff1744`)
- **Info / Stock Activity** (Electric Blue: `#2979ff`)

## Typography

Loud, technical, and mechanical.

**Display / Header Font:** Archivo (Loud, wide, commanding).
**Body / UI Font:** Space Grotesk (Quirky, technical sans).
**Data / Tabular Font:** Space Mono (Strict monospace for all operational data).

### Hierarchy
- **Page Title** (Archivo, Bold/Black, uppercase styling common).
- **Section Title** (Archivo, Bold).
- **Body & Controls** (Space Grotesk, Medium/Bold).
- **Tabular Figures & Badges** (Space Mono, Regular/Bold). All SKUs, counts, dates, and currency.

## Layout & Elevation

The spatial model relies on distinct, physical-looking blocks placed on a raw canvas.

- **Workspace Frame**: Grid-dot background, solid bordered sidebar, mobile bottom navigation.
- **Neobrutalist Cards & Tables**: Elements exist as distinct blocks with heavy borders (`border-black border-[3px]`) and solid drop shadows.
- **Table Density**: Tables maintain heavy internal borders separating columns and rows.
- **Tactile Interactions**: Buttons and cards must have active states that translate the element `translate-x-[2px] translate-y-[2px]` and reduce the box shadow, mimicking a physical button press.

## Shapes & Geometry

- **Containers, Buttons, & Badges**: Strict `rounded-none` (0px radius). 
- **Prohibitions**: No `rounded-md`, `rounded-full`, or soft borders anywhere.

## Do's and Don'ts

### Do:
- **Do** use heavy 3px black borders for all cards, inputs, and buttons.
- **Do** apply hard, unblurred black offset shadows to elevated elements.
- **Do** use Electric Purple as the primary highlight and action color.
- **Do** implement tactile active press states on interactive elements.
- **Do** stick to sharp, square corners (`rounded-none`).
- **Do** use Archivo for headers and Space Mono for technical labels.
- **Do** add a dotted grid texture to the main background.

### Don't:
- **Don't** use soft, blurry drop shadows.
- **Don't** use rounded corners on any element.
- **Don't** use subtle gray borders; borders must be stark and black.
- **Don't** use generic system sans-serifs; stick to the Archivo/Space Grotesk/Space Mono stack.
- **Don't** use subtle background gradients.
