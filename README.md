# Destructure

**Unpack the decision.** An interactive teaching tool to feel the cost of data structure operations through real-time animated step-by-step visualizations.

## What is Destructure?

Destructure helps learners understand algorithmic complexity by *feeling* it. Instead of abstract Big-O notation, you watch every element move. Delete from the front of an array? Watch 9 elements shift. Delete from the end? Nothing moves. The visceral difference is the lesson.

Built with React, Framer Motion, and Vite.

## Getting Started

### Prerequisites
- Node.js 22+ 
- npm or yarn

### Installation

```bash
git clone https://github.com/adamsantoyo/destructure.git
cd destructure
npm install
```

### Development

```bash
npm run dev
```

Opens at `http://localhost:5173`. Hot reload enabled.

### Build & Deploy

```bash
npm run build
```

Outputs to `dist/`. Ready for static hosting (Netlify, Vercel, GitHub Pages).

## Features

### Current: Array Lesson (Scenario 01)

A **guided three-phase lesson**:

1. **Discover** — Delete from the front. Count the shifts. Feel O(n).
2. **Compare** — Delete from the end. Notice: O(1). Position matters.
3. **Explore** — Sandbox unlocks. Try middle inserts, deletions, stress tests up to 1,000 items.

**What you learn:**
- The cost of an operation depends on *where* you operate
- Array shifts are expensive for front operations, free for end operations
- Big-O makes sense when you watch it happen

### Coming Soon
- **Linked List** — Pointer rewiring vs. array shifts
- **Stack** — LIFO constraints with visualization
- **Queue** — FIFO constraints and performance trades
- **Hash Table** — Collisions and lookup strategies
- **Binary Search Tree** — Shape-sensitive performance

## Project Structure

```
destructure/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── Counter.jsx       # Operation counter (pulse animation)
│   │   ├── CtrlButton.jsx    # Pill-shaped control buttons
│   │   ├── Explainer.jsx     # Teaching panel with eyebrow/text/detail
│   │   ├── Grid.jsx          # Dot-grid background
│   │   ├── StatusPill.jsx    # Phase/cost badge
│   │   └── SectionCard.jsx   # Lesson section container
│   ├── scenarios/
│   │   └── 01-array/
│   │       └── ArrayScene.jsx # Main Array lesson (guided three-phase flow)
│   ├── structures/
│   │   └── array.js          # Pure step-generation logic (no React)
│   ├── styles/
│   │   └── tones.js          # Shared tone palettes (accent/danger/neutral)
│   ├── hooks/
│   │   └── useAnimationQueue.js # Reusable animation queue (for future scenarios)
│   ├── App.jsx               # Scenario router / sidebar nav
│   └── main.jsx, index.css, tokens.css
├── public/
│   └── fonts/                # Self-hosted JetBrains Mono
├── package.json
├── vite.config.js
├── eslint.config.js
└── README.md
```

## Design Principles

### 1. **Feel First, Understand Second**
Animations precede explanations. Learners see the cost *before* reading about O(n).

### 2. **Per-Step Visibility**
Each element shift is a separate animation step. The counter climbs visibly. You count along.

### 3. **Progressive Disclosure**
Phase 1 locks advanced controls. Only after the core comparison does full exploration unlock.

### 4. **Pure Logic, Pure Components**
`array.js` generates steps with zero React dependencies. Components are presentational. Separation enables reuse and testing.

### 5. **Shared UI Patterns**
Tone palettes, cards, and buttons are extracted and reused across all scenarios to maintain consistency.

## Development Workflow

### Lint
```bash
npm run lint
```
ESLint with React Hooks plugin enforces strict patterns (no render-time ref access, etc.).

### Build
```bash
npm run build
```
Vite bundles + minifies. ~108 KB gzipped.

### Add a New Scenario

1. Create `src/scenarios/02-linked-list/LinkedListScene.jsx`
2. Create `src/structures/linkedlist.js` with step-generation logic
3. Register in `src/App.jsx` with Scene component and ready flag
4. Reuse `StatusPill`, `SectionCard`, `CtrlButton`, `Explainer` components

All scenarios inherit the same animation queue, timing, and UI palette.

## Speed Tuning

Animation speeds are configured in `ArrayScene.jsx`:

```javascript
const SPEEDS = { slow: 8000, normal: 5000, fast: 2500 }
```

Each step delay is controlled by `SPEEDS[speed]` in the animation loop. Adjust for lesson pacing.

## Color & Design Tokens

All colors, sizes, and spacing live in `src/tokens.css`:

```css
--accent: #00FFC8     /* Teal — default action */
--danger: #FF3366     /* Pink — expensive operation */
--bg: #0A0A0F         /* Dark navy background */
```

Tone palettes (`src/styles/tones.js`) unify these into component-level theming.

## Browser Support

Modern browsers (ES2020+). Tested on Chrome, Firefox, Safari.

## Roadmap

- [ ] Linked List scenario with pointer visualization
- [ ] Stack / Queue with constraint enforcement
- [ ] Hash Table with collision animation
- [ ] Binary Search Tree with rebalancing
- [ ] Comparison mode: run same operation on multiple structures
- [ ] Code snippets: show language-specific syntax for each step
- [ ] Performance metrics: measure real vs. theoretical complexity
- [ ] Lesson progress tracking (local storage)

## License

MIT

## Contact & Feedback

Built by [@adamsantoyo](https://github.com/adamsantoyo). Questions or ideas? Open an issue.
