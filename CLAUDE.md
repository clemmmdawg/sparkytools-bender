# CLAUDE.md — Sparky Tools: Bender

This file is the primary reference for Claude Code when working on this project. Read it fully before making any changes.

---

## Project Overview

**Sparky Tools: Bender** is a mobile-first Progressive Web App (PWA) for electricians to calculate conduit bends on the job site. It is a spiritual successor to QuickBend, rebuilt from scratch with a modern React stack.

The app performs accurate bend calculations using the **centerline radius algorithm** (not just the cosecant/multiplier method) and accounts for bender shoe radius, conduit type, and conduit size in every calculation. All math should run in real time as the user inputs values.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| **React** | UI framework |
| **Vite** | Build tool / dev server |
| **Ionic Framework** (`@ionic/react`) | Mobile-first UI components, routing, and PWA shell |
| **Capacitor** | Optional native bridge (keep architecture compatible, but don't configure it initially) |
| **TypeScript** | Required — all files must be `.tsx` or `.ts`, no plain `.js` |
| **CSS Modules** or **Ionic CSS Variables** | Styling — prefer Ionic's theming system with CSS variable overrides |
| **Vite PWA Plugin** (`vite-plugin-pwa`) | Service worker + manifest generation |

Do **not** introduce Tailwind, Chakra, MUI, or any additional component library. Ionic is the only UI component system.

---

## Project Structure

```
sparky-tools-bender/
├── public/
│   └── icons/               # PWA icons (192x192, 512x512, maskable)
├── src/
│   ├── main.tsx
│   ├── App.tsx              # Root: IonApp + IonReactRouter
│   ├── theme/
│   │   └── variables.css    # Ionic CSS variable overrides (brand colors, fonts)
│   ├── data/
│   │   └── benders.ts       # Static bender database (specs keyed by manufacturer/model/size)
│   ├── lib/
│   │   ├── bendMath.ts      # ALL calculation logic — pure functions, no React imports
│   │   ├── svgPath.ts       # Pure function: builds SVG path `d` string from bend segments
│   │   └── units.ts         # Unit conversion helpers (toInches, fromInches)
│   ├── hooks/
│   │   └── useBender.ts     # Hook to load/save selected bender from localStorage
│   ├── components/
│   │   ├── ConduitStrip/    # Vertical conduit-with-marks visualizer (left-rail UI)
│   │   ├── BendDiagram/     # SVG top-down/side-view shape of the completed bend
│   │   └── InputRow/        # Reusable labeled input with unit toggle
│   └── pages/
│       ├── Home/            # Bender selector + bend type picker
│       ├── Calculator/      # Active bend calculator (dynamic route by bend type)
│       ├── BenderSpecs/     # View/edit bender deduct, gain, setback, travel, radius adj.
│       └── Settings/        # Units toggle (in / ft-in / cm), multiplier method toggle
├── vite.config.ts
├── tsconfig.json
└── CLAUDE.md
```

---

## Core Concepts (Read Before Writing Math)

All calculation logic lives in `src/lib/bendMath.ts` as **pure exported functions**. No side effects, no React. This makes them independently testable.

### Centerline Radius Algorithm

This is the primary calculation method. Every bend result must account for:
- The **centerline radius** of the selected bender shoe
- The **outside diameter** of the conduit size and type
- The **theta** (bend angle in degrees)

### Key Formulas

```ts
// Developed Length — arc of conduit consumed by the bend
developedLength(radius: number, thetaDeg: number): number
// = (theta / 360) * (2 * radius * Math.PI)

// Gain — conduit saved vs a square right-angle path
gain(radius: number, thetaDeg: number): number
// X = Math.tan(toRad(theta / 2)) * radius
// gain = developedLength - (X * 2)

// Setback — distance from bend mark to start of 90° leg
setback(radius: number): number
// = radius * Math.tan(toRad(45))  →  radius * 1

// Shrink (multiplier method fallback)
shrink(thetaDeg: number, rise: number): number
// = Math.tan(toRad(theta / 2)) * rise

// Distance between bends (multiplier method fallback)
distanceBetweenBends(thetaDeg: number, rise: number): number
// = (1 / Math.sin(toRad(theta))) * rise
```

### Cosecant / Multiplier Method (fallback)

A simpler method used when no bender is selected or when the user toggles "Multiplier Method" in Settings. Uses the common multiplier table below. Less accurate for large conduit sizes.

| Theta | Multiplier | Shrink Constant |
|-------|-----------|----------------|
| 5°    | 11.47     | 0.04 |
| 10°   | 5.75      | 0.08 |
| 15°   | 3.86      | 0.13 |
| 22.5° | 2.61     | 0.20 |
| 30°   | 2.00      | 0.27 |
| 45°   | 1.41      | 0.41 |
| 60°   | 1.15      | 0.58 |

---

## Bender Data Model

```ts
// src/data/benders.ts

export interface BenderShoe {
  conduitType: 'EMT' | 'IMC' | 'Rigid' | 'PVC';
  tradeSize: string;           // e.g. "1/2", "3/4", "1", "1-1/4"
  outsideDiameter: number;     // inches
  centerlineRadius: number;    // inches — from manufacturer specs
  deduct: number;              // inches
}

export interface Bender {
  id: string;
  manufacturer: string;        // e.g. "Klein", "Greenlee", "Ideal"
  model: string;               // e.g. "51605", "1800", "1801"
  type: 'hand' | 'mechanical' | 'electric' | 'hydraulic';
  shoes: BenderShoe[];
}

export interface CustomBender extends Bender {
  isCustom: true;
}
```

Pre-populate `benders.ts` with accurate manufacturer data for the most common benders:

- **Klein 51605** — 1/2" EMT hand bender
- **Klein 51606** — 3/4" EMT hand bender
- **Klein 51607** — 1" EMT hand bender
- **Greenlee 851** series — 1/2"–1-1/4" hand benders
- **Greenlee 1800** — mechanical, 1/2"–1" rigid
- **Greenlee 1801** — mechanical, 1-1/4"–1-1/2" rigid

Use manufacturer spec sheets for exact centerline radius and deduct values. Do not guess — if a value is uncertain, mark it with a `// TODO: verify` comment.

Standard hand bender deducts (well-established, safe to hardcode):

| Trade Size | EMT Deduct |
|---|---|
| 1/2" | 5" |
| 3/4" | 6" |
| 1"   | 8" |
| 1-1/4" | 11" |

---

## Bend Types

All bend types must be implemented. Each has its own calculator view under `src/pages/Calculator/`. Route: `/calculator/:bendType`.

### Group 1 — Offsets
- `offset` — Standard offset (2 bends, same angle, opposite directions)
- `rolling-offset` — Offset that travels diagonally; requires true offset + rolling component
- `matching-bends-offset` — Match existing offset by bend marks
- `matching-centers-offset` — Match existing offset by centers
- `parallel-offset` — Multiple parallel conduits, consistent spacing

### Group 2 — Saddles
- `three-point-saddle` — Center bend is 2× the outer bends
- `four-point-saddle` — Four equal bends

### Group 3 — 90° Bends
- `90-bend` — Standard stub-up 90°
- `kick-with-90` — 90° with a kick at the base
- `matching-bend-kick` — Match an existing kick by bend marks
- `matching-center-kick` — Match an existing kick by centers
- `parallel-kick` — Parallel conduit kicks
- `parallel-kick-forward` — Parallel kick in forward orientation

### Group 4 — Compound 90°
- `compound-90-circle` — Route around a circular obstruction
- `compound-90-rectangle` — Route around a rectangular obstruction
- `compound-90-square` — Route around a square obstruction

### Group 5 — Segmented
- `segmented-90` — Multiple small bends to approximate a 90°; required for 5" hydraulic rigid

Each calculator page must output:
1. All marks to place on the conduit (distances from end or reference point)
2. Bend angles at each mark
3. Which direction to bend at each mark (↑ or ↓)
4. Whether to flip the conduit between marks (with clear instruction)
5. A `CompositeVisualizer` SVG containing the `ConduitStrip` (left rail) and `BendDiagram` (geometry + callouts) side by side — this is the primary, hero-sized output
6. A scrollable mark list below the visualizer with per-mark labels, distances, and direction arrows
7. Floating result cards anchored to the diagram's dimension lines showing key output values

---

## Bender Specs Page

Route: `/bender-specs`

Displays and allows editing of all specs for the currently selected bender/shoe:

- Centerline Radius
- Deduct
- Gain (calculated, not editable — show formula)
- Setback (calculated, not editable — show formula)
- Travel (developed length) — show as a table or scrollable list for degrees 1°–90° in 1° increments, or at common angles (10°, 15°, 22.5°, 30°, 45°, 60°, 90°)
- Radius Adjustment — the per-degree correction applied to measurements

For **custom benders**, all fields are editable and saved to `localStorage`. For built-in benders, show a "Customize / Override" option that clones the bender into a user-editable copy.

---

## QuickCheck (Input Validation)

Inputs should have live visual feedback:

- **Red**: Bend is geometrically impossible (e.g. stub shorter than deduct, bends would overlap)
- **Orange**: Bend is technically possible but unlikely to be practical (very tight radius, extreme angles)
- **Normal**: Valid input

Implement this as a pure function `checkValidity(bendType, inputs, benderShoe): 'ok' | 'warning' | 'error'` in `bendMath.ts`, and apply the result to input field styling via Ionic's `color` prop or CSS class.

---

## Unit System

Support three unit modes, toggled globally from Settings:

- `inches` — default, decimal inches (e.g. `12.5"`)
- `ft-in` — feet and fractional inches (e.g. `1' 0-1/2"`)
- `cm` — centimeters

All internal math must use **decimal inches**. Unit conversion happens only at the input/display layer. Implement `toInches(value, mode)` and `fromInches(value, mode)` helpers in `src/lib/units.ts`.

---

## State Management

No Redux or Zustand. Use the following simple state approach:

- **Selected bender/shoe** — `localStorage` via `useBender` hook, available globally
- **Current calculator inputs** — local `useState` in each calculator page (not persisted)
- **Settings** (units, multiplier mode) — `localStorage` via `useSettings` hook
- **Custom benders** — `localStorage` array, merged with static bender list at runtime

---

## PWA Requirements

Configure `vite-plugin-pwa` with:

```ts
// vite.config.ts (partial)
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['icons/*.png'],
  manifest: {
    name: 'Sparky Tools: Bender',
    short_name: 'Bender',
    description: 'Conduit bending calculator for electricians',
    theme_color: '#1a1a2e',        // adjust to match final brand color
    background_color: '#1a1a2e',
    display: 'standalone',
    orientation: 'portrait',
    start_url: '/',
    icons: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    runtimeCaching: []   // app is fully offline — no external fetches needed
  }
})
```

The app must be **fully functional offline**. No external API calls. No CDN fonts — bundle all fonts.

---

## Conduit Visualizer Components

The calculator results screen is dominated by a **single large composite SVG visualizer** that fills most of the screen. This is not a small diagram tucked below a list — it is the primary output. Two sub-components live inside it and must be understood separately even though they render into the same SVG viewport.

The overall layout of a calculator page is:

```
┌─────────────────────────────┐
│  [Bender selector bar]      │  ← fixed top bar
├─────────────────────────────┤
│                             │
│   COMPOSITE VISUALIZER      │  ← fills ~70-75% of screen height
│   (ConduitStrip + Diagram   │     single SVG element
│    side by side)            │
│                             │
├─────────────────────────────┤
│  [Scrollable mark list]     │  ← Mark 1 · 22.5° / 8 1/8" rows
│  [Result value cards]       │     (from first screenshot)
└─────────────────────────────┘
```

The user **scrolls the bottom section** to see all mark rows and result cards. The visualizer SVG stays fixed (or sticky) at the top of the content area so it is always visible as a reference.

---

### 1. `ConduitStrip` — The Mark Rail (left edge of visualizer)

The conduit strip is the **narrow vertical element on the far left of the composite visualizer SVG**. It is always visible as the leftmost element regardless of bend type.

#### Appearance

- The strip is rendered as a **rounded-rectangle tube shape** — not a flat bar. Use a subtle horizontal linear gradient (lighter center, darker edges) to simulate a cylindrical cross-section. The color is a neutral dark gray (approximately `#3a3a3c` center, `#1c1c1e` edges).
- Width of the strip in the SVG is proportional to the conduit's outside diameter at diagram scale
- The strip represents the **full length of the conduit** from top to bottom of the SVG viewport
- **No end caps are visible** — the strip bleeds off both edges of the viewport, implying a longer stick of conduit than shown

#### Mark Ticks

- Each mark is a **short horizontal white line** (1–2px, full width of the strip) with a small **inward-pointing arrowhead** or chevron on the right edge of the strip, pointing toward the bend
- Ticks are precisely positioned at `(distanceFromEnd / conduitLengthIn) * viewportHeight` — proportional placement is critical for the diagram to communicate correct spacing between bends
- There are **no labels on the strip itself** — labels live in the scrollable mark list below

#### Bend Blocks

- At each mark's position, a **colored filled rectangle** is overlaid on the strip, centered on the tick, with height equal to `(developedLength / conduitLengthIn) * viewportHeight`
- The block represents the arc of conduit consumed by that bend
- **Color coding** by QuickCheck validity:
  - `ok` → `--ion-color-success` (green)
  - `warning` → `--ion-color-warning` (amber)
  - `error` → `--ion-color-danger` (red)
- The block should render with **full opacity**, not transparent — it sits on top of the strip and visually replaces that section of gray tube, showing that portion of the conduit is "used up" by the bend
- Blocks must not overlap each other; if calculated positions would cause overlap, trigger a `warning` or `error` validity state

---

### 2. `BendDiagram` — The Geometry View (main body of visualizer)

This occupies the **large center and right area of the composite visualizer SVG**, to the right of the ConduitStrip. It shows the true geometric shape of the completed bend.

#### Conduit Tube Rendering

The conduit is rendered as a **thick, rounded, 3D-looking tube path** — not a simple SVG stroke. Achieve this with:

- Two parallel offset paths forming the outer edges of the tube wall
- A **linear gradient fill** between them — lighter in the center to simulate cylindrical highlight, darker at edges. Base color approximately `#555` (straight sections) or `--ion-color-success` green (bend arc sections)
- A **subtle drop shadow** (`filter: drop-shadow(0 2px 6px rgba(0,0,0,0.6))`) on the tube to lift it off the dark background
- Straight sections: neutral gray gradient
- Bend arc sections: the QuickCheck validity color (green/amber/red) with the same gradient treatment — the highlight should follow the curve

The tube width in SVG units must be proportional to the conduit's outside diameter relative to the diagram's overall scale. A 3" rigid conduit should look visibly thicker than a 1/2" EMT.

#### Geometry Accuracy

- All geometry is derived from `buildConduitPath()` in `src/lib/svgPath.ts` — **not hand-drawn or hardcoded per bend type**
- Straight sections are `L` commands, bend arcs are `A` commands using the actual centerline radius scaled to diagram units
- A 45° offset must look like a 45° offset. An 11.6° bend must look notably shallower than a 22.5° bend. Geometric accuracy is non-negotiable.
- The viewBox auto-fits to the bounding box of the completed path with ~10% padding on all sides

#### Dimension Callouts — Two Visual Layers

This is the most visually complex part. There are **two distinct types of lines** in the diagram, both observed in the reference screenshots:

**Layer 1 — White geometric construction lines:**
- Thin white lines (1px, solid) showing the theoretical straight-line projections of the conduit's straight sections extended through the bend zone
- These are the geometric construction lines an electrician would draw on paper — they show where the conduit *would* go if it didn't bend
- They cross each other at the theoretical corner point, forming an X or V shape at the bend
- Small **inward-pointing white arrowheads** on these lines indicate the direction along the conduit
- Do not label these lines

**Layer 2 — Blue measurement dimension lines:**
- Thin blue dashed lines (`--ion-color-secondary`) with double-ended arrowheads, showing the key output measurements
- Each blue dimension line connects to a **floating result card** on the right side of the screen via a thin dashed blue leader line
- The arrowheads are clean and sharp — use SVG `<marker>` definitions, not emoji or Unicode arrows
- Draw blue dimension lines only for the primary user-facing outputs:
  - **Offset**: rise (perpendicular distance between the two parallel runs), distance between bends
  - **90° bend**: stub length (vertical), distance from end to mark (horizontal)
  - **Saddle**: saddle height, distance between outer marks
  - **Compound 90°**: obstruction dimensions
  - **Segmented 90°**: each segment angle, total developed length

#### Floating Result Cards

Result values float as **labeled cards** positioned to the right of the diagram, connected to their dimension lines. Each card contains:

- A small label in the secondary color (e.g. "Adjacent", "Rise", "Bend") — matches `--ion-color-secondary` blue for input-derived values, white for calculated outputs
- The numeric value in large monospace text with fractional display (`15 ½"`)
- Rounded rectangle background in a slightly elevated surface color (`--ion-surface-color` + slight opacity)
- Cards are positioned so their leader lines don't cross each other — stack them vertically on the right edge

The cards in the scrollable list below the visualizer show the same values in a more detailed format (with more context). The floating cards are a quick glance reference while reading the diagram.

---

### `buildConduitPath` — Path Construction

Implement in `src/lib/svgPath.ts` as a pure function:

```ts
type Segment =
  | { type: 'line'; length: number }          // straight run, in diagram units
  | { type: 'arc'; radius: number; angleDeg: number; sweepFlag: 0 | 1 };

interface PathResult {
  d: string;              // SVG path `d` attribute string
  boundingBox: { x: number; y: number; width: number; height: number };
  segmentEndpoints: Array<{ x: number; y: number; headingDeg: number }>;
  // ^ one entry per segment end, used to position construction lines and callouts
}

function buildConduitPath(
  segments: Segment[],
  startX: number,
  startY: number,
  startHeadingDeg: number,  // 0 = rightward, 90 = downward
  diagramScale: number      // inches-per-SVG-unit ratio
): PathResult
```

The `segmentEndpoints` output is used by the diagram layer to position the white construction lines and blue dimension callouts without re-computing geometry from scratch.

---

### Component Relationship & Data Flow

```
CalculatorPage
│
├── [Input fields]  →  calcResult = computeBend(inputs, benderShoe)
│
├── CompositeVisualizer (single <svg>)
│   ├── ConduitStrip (left ~15% of SVG width)
│   │   ├── tube gradient rect
│   │   ├── bend blocks (colored, height = developedLength proportion)
│   │   └── tick marks + arrowheads at each mark position
│   └── BendDiagram (remaining ~85% of SVG width)
│       ├── tube path (offset parallel paths + gradient fill + drop shadow)
│       ├── white construction lines (geometric projections)
│       ├── blue dimension lines (double-ended arrows + dashed leaders)
│       └── floating result cards (positioned SVG foreignObject or <g> elements)
│
└── ScrollableMarkList (below the SVG)
    ├── Mark rows (label · angle / distance value / direction arrow)
    └── Full result card list (all outputs with labels)
```

Both `ConduitStrip` and `BendDiagram` receive the same `calcResult` object — they do not perform any math. The `CompositeVisualizer` parent component is responsible for computing `diagramScale` from the available SVG viewport size and the physical dimensions of the bend.

---

### What NOT to Do in the Visualizer

- Do not use `<canvas>` — everything is pure SVG for crispness at all screen densities
- Do not hardcode shapes per bend type — all geometry flows from `buildConduitPath()`
- Do not place text labels directly on the conduit tube — they go in the floating cards or the mark list below
- Do not use CSS `transform: rotate()` on the whole diagram to "fake" a different bend angle — compute correct coordinates
- Do not render the diagram until `calcResult` is valid — show an empty state prompt instead

---

**Tone**: Industrial utilitarian — this is a tool used on dusty job sites with dirty hands and bright sunlight. Dark theme is primary. High contrast. Large tap targets (minimum 48×48px). No decorative flourishes that add visual noise.

**Color palette** (Ionic CSS variables to set in `theme/variables.css`):

```css
:root {
  --ion-background-color: #0f0f0f;
  --ion-surface-color: #1c1c1e;
  --ion-color-primary: #f5a623;      /* electrical yellow/amber */
  --ion-color-primary-contrast: #000;
  --ion-color-secondary: #4a9eff;    /* conduit blue accent */
  --ion-color-danger: #ff453a;       /* QuickCheck error */
  --ion-color-warning: #ff9f0a;      /* QuickCheck warning */
  --ion-color-success: #30d158;
  --ion-text-color: #f0f0f0;
  --ion-text-color-secondary: #8e8e93;
}
```

**Typography**: Use a single variable font loaded from the project (not Google Fonts CDN). Suggested: `IBM Plex Sans` (bundled) or `DM Mono` for numerical outputs. Numbers in results should feel like instrument readouts — monospace, large, high contrast.

**Layout rules**:
- Bottom tab bar for main navigation (Home, Specs, Settings)
- Calculator pages: fixed bender selector bar at top → large composite visualizer SVG (~70% of screen height, sticky) → scrollable mark list and result cards below
- The visualizer is the hero of every calculator screen — it is not a small supplement to a list, it IS the primary output
- No horizontal scrolling anywhere
- Inputs live in a collapsible or slide-up sheet so they don't compete with the visualizer for space

---

## Coding Conventions

- All components are functional React components with typed props interfaces
- No `any` types — use `unknown` and narrow, or define proper interfaces
- File names: PascalCase for components (`BendDiagram.tsx`), camelCase for utilities (`bendMath.ts`)
- Each component folder contains: `index.tsx`, `ComponentName.module.css`, optional `ComponentName.test.tsx`
- Import order: React → Ionic → local components → local lib/hooks → styles
- All magic numbers must be named constants — no raw `57.2958` floating around
- Comments on any formula: include the formula in a `// Formula: ...` comment above the line

---

## Testing

- Pure math functions in `src/lib/bendMath.ts` must have unit tests
- Use **Vitest** (already ships with Vite ecosystem)
- Test file convention: `bendMath.test.ts` co-located with the source file, or in `src/lib/__tests__/`
- At minimum, test every bend type's primary calculation with known good values (verify against a physical bender or QuickBend output)

---

## What NOT to Do

- Do not fetch anything from the network at runtime — fully offline app
- Do not use the multiplier method as the primary calculation — it is a fallback only
- Do not render results before the user has selected a bender (show a prompt instead)
- Do not use `alert()` or `confirm()` — use Ionic's `IonAlert` or `IonToast`
- Do not store sensitive data — there is none, but don't add any external analytics or tracking
- Do not hardcode units — all display goes through the unit conversion layer

---

## Getting Started Checklist (for Claude Code)

When beginning a new session, complete these in order before touching feature code:

1. `npm create vite@latest sparky-tools-bender -- --template react-ts`
2. `npm install @ionic/react @ionic/react-router ionicons react-router react-router-dom`
3. `npm install -D vite-plugin-pwa workbox-core workbox-precaching vitest`
4. Set up `vite.config.ts` with PWA plugin
5. Set up `src/theme/variables.css` with the color palette above
6. Set up `IonApp` + `IonReactRouter` in `App.tsx` with bottom tab navigation
7. Create `src/lib/bendMath.ts` with core math functions and their tests
8. Create `src/data/benders.ts` with the static bender database
9. Build `Home` page (bender selector)
10. Build the first calculator (`offset`) end-to-end before moving to others

---

## Reference Material

The following concepts are documented in the project's `/docs` folder and should be consulted when implementing calculations:

- `docs/Benders.md` — bender types, deduct benchmarks, shoe descriptions
- `docs/BenderSpecs.md` — charting, centerline radius, deduct, gain, setback, travel
- `docs/CenterlineRadius.md` — developed length and gain formulas
- `docs/Trigonometry.md` — multiplier method, shrink constant, common multiplier table
- `docs/BendingOnCenters.md` — QuickCenter concept, center-finding methodology

When in doubt about a formula, refer to these docs. If the docs conflict with a known-good physical result, flag it with a `// VERIFY` comment and use the physical result.
