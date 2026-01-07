# Kiosk & Landscape Optimization Design

## Overview
Optimize the main navigation pages (`Index`, `Pegawai`, `Umum`) for kiosk devices, tablets, and landscape orientations. The goal is to eliminate scrolling ("fit to screen"), simplify the UI, and ensure large touch targets across a wide range of devices (800x480 to 1920x1080).

## Design Decisions

### 1. Layout Strategy: "Fit to Screen"
- **Container:** Use `h-screen`, `w-screen`, and `overflow-hidden` to prevent scrolling.
- **Flex Column:**
  - **Header:** Compact, fixed or minimal height.
  - **Main:** `flex-1` with `flex-center` to vertically align content.
  - **Footer:** Minimal or hidden on very small screens.
- **Grid:**
  - **Portrait:** Standard stacked or 2-column grid.
  - **Landscape:** Force `grid-cols-2` side-by-side to utilize horizontal space and reduce vertical stacking.

### 2. Component Adaptability
- **Cards (Buttons):**
  - Switch from fixed height (`h-32`) to responsive/flexible height or reduced fixed height in landscape.
  - Reduce padding (`p-4` vs `p-8`) in landscape mode.
  - Icon sizes scale with viewport.
- **Typography:**
  - Use responsive classes (`text-sm landscape:text-base`) to prevent text overflow.
  - Hide "subtitle" text on extremely small screens if necessary (though likely not needed with side-by-side layout).

### 3. Responsive Breakpoints
- **Mobile Portrait:** Standard stacked layout.
- **Tablet/Kiosk Landscape (The Focus):**
  - Breakpoint: `landscape:` media query.
  - Behavior: Reduce vertical margins (`my-2` instead of `my-8`), reduce font sizes slightly, force side-by-side grid.

## Implementation Steps

### 1. Index.tsx (Main Menu)
- **Container:** Ensure `h-screen flex flex-col`.
- **Title Section:** Reduce `mb` (margin-bottom) in landscape.
- **Grid:** `grid-cols-1 sm:grid-cols-2` -> `grid-cols-1 landscape:grid-cols-2`.
- **Cards:**
  - Height: `h-32 sm:h-40` -> `landscape:h-auto landscape:min-h-[120px]`.
  - Content: Flex column layout.

### 2. Pegawai.tsx & Umum.tsx (Sub-menus)
- Apply the same pattern as `Index.tsx`.
- **Back Button:** Ensure it remains accessible but compact in landscape.

### 3. Footer
- Add `landscape:hidden` or `landscape:text-[10px]` for very small height screens (`h < 600px`) using arbitrary media queries if needed, or just keep it small.

## Success Criteria
- No scrollbars on 1024x768 (iPad Landscape).
- No scrollbars on 800x480 (Small Kiosk).
- Buttons remain large enough to tap easily.
- UI elements do not overlap.
