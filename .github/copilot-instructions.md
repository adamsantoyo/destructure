# Copilot Instructions for Destructure

## Commands

```bash
npm run dev        # Dev server at localhost:5173
npm run build      # Production build to dist/
npm run lint       # ESLint (React Hooks plugin, react-refresh)
npm test           # Vitest — all structure logic tests
npx vitest run src/structures/array.test.js  # Single test file
```

## Architecture

Destructure is an interactive data-structure learning tool. The codebase has three layers:

1. **Pure logic** (`src/structures/*.js`) — Cost calculators and step generators with zero React dependencies. These are the "teaching math" and are unit tested.
2. **Scene containers** (`src/scenarios/NN-name/NameScene.jsx`) — Each data structure gets one scene that manages local state and implements the interaction loop: click → popover preview → execute → cascade animation → snapshot diff → history append.
3. **Shared components** (`src/components/`) — Reusable presentational components (Counter, Explainer, CtrlButton, StatusPill, CellPopover, OperationHistory, Grid, InfoPanel) used across all scenes.

Navigation is tab-based (modes × scenarios), managed in `App.jsx` via a `SCENARIOS` array and `MODES` array. No router.

## Key Conventions

### Structure logic contract (`src/structures/*.js`)

Every structure module exports:
- **Cost calculators** (e.g., `getDeleteCost(length, index)`) — pure math returning a number. Used by popovers to preview cost before execution.
- **Step generators** (e.g., `deleteAtIndex(arr, index)`) — return arrays of `{ type, payload, ops, explanation }` steps. Used by Compare mode for synchronized playback.
- Cost is named per-structure: shifts (array), traversal steps (linked list), probes (hash table), path steps (BST). Never generic "operations."

### Scene contract (`src/scenarios/*/Scene.jsx`)

Every scene:
- Uses stable item IDs via `makeItem()` (object with `{ id, value }`), never raw values as keys.
- Manages its own state locally (no shared state store, no custom hooks).
- Implements a nudge system (`getNudge(tried, lastOp)`) that adapts hints based on which operations the user has performed.
- Appends to operation history with `{ action, label, cost, costText }`.
- Takes a before-state snapshot for diff coloring after each operation.

### Styling

- **Design tokens** live in `src/tokens.css` as CSS custom properties — colors, sizes, spacing, motion timings.
- **Tone system** (`src/styles/tones.js`) — `getTone(tone)` returns `{ text, border, background, glow }` for semantic theming (accent, danger, success, neutral, muted). Used by Explainer, StatusPill, and other components.
- Components use **inline styles** referencing CSS variables (`var(--accent)`). No per-component CSS files, no Tailwind.

### Animation

- Framer Motion for everything: `motion` components, `AnimatePresence`, layout animations, `useMotionValue` for counter.
- Cascade stagger: `0.055s` delay per cell from the operation origin. Spring physics: `stiffness: 400–500`, `damping: 28–30`.
- Counter animates in sync with cascade timing for visual coherence.

### Testing

- Vitest tests are collocated with structure logic: `src/structures/*.test.js`.
- Tests verify cost calculators return correct numbers and step generators produce correct sequences. No UI/snapshot tests.

### Adding a new structure

1. Create `src/structures/name.js` with cost calculators and step generators.
2. Create `src/scenarios/NN-name/NameScene.jsx` using the shared components and interaction loop.
3. Add reference data to `src/data/dictionary.js` (`STRUCTURE_INFO` keyed by scenario ID).
4. Register in `App.jsx`'s `SCENARIOS` array.

### Design spine

Every interaction must answer four learner questions: what is directly accessible, what extra work happened, why, and what complexity that implies. The popover, counter, StatusPill, history, snapshot, and nudge must all tell the same story — never contradicting each other.
