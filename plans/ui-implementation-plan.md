# Implementation Plan: Concept C "Soft Organic"

This plan details the technical steps to implement the "Soft Organic" design language selected by the user.

## 1. Typography Setup
### Goal
Establish the typographic hierarchy using **Merriweather** (Serif) for warmth/headings and **Nunito** (Rounded Sans) for approachability/body.

### Actions
1.  **Modify `src/app/layout.tsx`:**
    *   Import `Merriweather` and `Nunito` from `next/font/google`.
    *   Define CSS variables: `--font-heading` (Merriweather) and `--font-body` (Nunito).
    *   Apply these variables to the `<body>` tag.
2.  **Update `tailwind.config.ts`:**
    *   Map `fontFamily.sans` to `var(--font-body)`.
    *   Map `fontFamily.heading` (new) to `var(--font-heading)`.
3.  **Update `src/app/globals.css`:**
    *   Set global font rules.
    *   Ensure headings (h1-h6) use `font-heading`.

## 2. Color Palette & Theming
### Goal
Implement the "Warm Sand & Earth" palette.

### Actions (in `src/app/globals.css`)
1.  **Light Mode (`:root`):**
    *   `--background`: `#FDFCF8` (Warm Sand) -> `hsl(48, 20%, 98%)`
    *   `--foreground`: `#4B5563` (Warm Grey) -> `hsl(215, 14%, 34%)`
    *   `--card`: `#FFFFFF` (White/Cream) -> `hsl(0, 0%, 100%)`
    *   `--card-foreground`: `#4B5563`
    *   `--primary`: `#059669` (Earth Green) -> `hsl(161, 94%, 30%)`
    *   `--primary-foreground`: `#FFFFFF`
    *   `--secondary`: `#F3F4F6` (Light Grey/Stone) -> `hsl(220, 13%, 91%)`
    *   `--accent`: `#D97706` (Terracotta) -> `hsl(32, 95%, 44%)`
    *   `--border`: `#E5E7EB` (Soft Grey) -> `hsl(220, 13%, 91%)`
    *   `--radius`: `1.5rem` (24px - for that soft, organic feel)
    *   `--sidebar-background`: `#FDFCF8`
    *   `--sidebar-foreground`: `#4B5563`

2.  **Dark Mode (`.dark`):**
    *   `--background`: `#1C1917` (Warm Black/Stone 900)
    *   `--foreground`: `#E7E5E4` (Stone 200)
    *   `--card`: `#292524` (Stone 800)
    *   `--primary`: `#10B981` (Emerald 500)
    *   `--sidebar-background`: `#1C1917`

## 3. Component Styling
### Goal
Soften the edges and interactions to match the organic vibe.

### Actions
1.  **Buttons (`src/components/ui/button.tsx`):**
    *   Change default radius to `rounded-full` (Pill shape).
    *   Ensure hover states are soft fades, not harsh color swaps.
2.  **Cards (`src/components/ui/card.tsx`):**
    *   Increase `border-radius` (via variable).
    *   Use deeper, softer shadows (`shadow-lg` with low opacity) instead of borders where possible.
3.  **Inputs (`src/components/ui/input.tsx`):**
    *   `rounded-full` or highly rounded `rounded-2xl` inputs.
    *   Soft borders.

## 4. Execution Order
1.  **Font Migration:** `layout.tsx` -> `tailwind.config.ts`.
2.  **Theme Application:** `globals.css` (Colors & Radius).
3.  **Component Refinement:** Button & Input shapes.
4.  **Verification:** Check visual consistency.
