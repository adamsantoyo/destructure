# Destructure

**Unpack the decision.** An interactive learning tool for understanding how data-structure rules create operation cost.

## What is Destructure?

Destructure helps learners understand data structures by making their rules visible. Instead of starting with abstract Big-O notation, you click the structure, preview the operation, and watch the work it must do. Delete from the front of an array? Watch elements shift. Probe past a collision in a hash table? Watch the path grow. The mechanism comes first; the complexity label comes second.

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

### Current Scenarios
- **Array** — feel shift cost by deleting or inserting at different positions
- **Linked List** — compare traversal cost against cheap pointer rewiring
- **Stack** — learn LIFO by seeing what is reachable from the top
- **Queue** — learn FIFO by seeing who is allowed to leave first
- **Hash Table** — watch collisions trigger linear probing and displace items from their home bucket
- **Binary Search Tree** — see how tree shape controls search, insert, and delete cost

### Coming Next
- **Comparison mode** — run the same operation on multiple structures side by side

## Project Structure

```
destructure/
├── src/
│   ├── components/
│   │   ├── CellPopover.jsx
│   │   ├── Counter.jsx
│   │   ├── CtrlButton.jsx
│   │   ├── Explainer.jsx
│   │   ├── Grid.jsx
│   │   ├── OperationHistory.jsx
│   │   ├── SectionCard.jsx
│   │   └── StatusPill.jsx
│   ├── scenarios/
│   │   ├── 01-array/ArrayScene.jsx
│   │   ├── 02-linked-list/LinkedListScene.jsx
│   │   ├── 03-stack/StackScene.jsx
│   │   ├── 04-queue/QueueScene.jsx
│   │   ├── 05-hash-table/HashTableScene.jsx
│   │   └── 06-bst/BSTScene.jsx
│   ├── structures/
│   │   ├── array.js
│   │   ├── bst.js
│   │   ├── hashTable.js
│   │   ├── linkedList.js
│   │   ├── queue.js
│   │   └── stack.js
│   ├── styles/
│   │   └── tones.js
│   ├── App.jsx
│   └── main.jsx, index.css, tokens.css
├── package.json
├── vite.config.js
├── eslint.config.js
└── README.md
```

## Design Principles

### 1. **Feel First, Understand Second**
Animations precede explanations. Learners see the cost *before* reading about O(n).

### 2. **Cost Visibility**
Every interaction previews its cost before you commit. Arrays show shifts, linked lists show traversal steps, stacks and queues show direct access, and hash tables show extra probes.

### 3. **Direct Manipulation**
You click the structure itself, preview the operation, then watch the result. The interface teaches by interaction instead of command lists.

### 4. **Pure Logic, Pure Components**
`array.js` generates steps with zero React dependencies. Components are presentational. Separation enables reuse and testing.

### 5. **Shared UI Patterns**
Tone palettes, cards, and buttons are extracted and reused across all scenarios to maintain consistency.

### 6. **Structure-Specific Truth**
The interaction loop is shared across scenarios, but the visuals must match the structure. Arrays teach shifts. Linked lists teach traversal and rewiring. Stacks and queues teach access constraints. Hash tables teach probing and displacement.

## Development Workflow

### Lint
```bash
npm run lint
```
ESLint with React Hooks plugin enforces strict patterns (no render-time ref access, etc.).

### Test
```bash
npm test
```
Vitest covers the pure logic in `src/structures/*` so semantic refactors do not silently change the teaching math.

### Build
```bash
npm run build
```
Vite bundles + minifies for static hosting.

### Add a New Scenario

1. Create `src/scenarios/NN-name/NameScene.jsx`
2. Create `src/structures/name.js` with pure cost/step logic
3. Register it in `src/App.jsx`
4. Reuse the shared click → preview → act interaction pattern

Each scenario should preserve the same teaching spine: click a thing, preview cost, execute, compare before/after, then learn from the history.

For Stack and Queue, the lesson is the abstract data type first: who is reachable, who is blocked, and why. Language-specific implementation details should only appear when they prevent misunderstanding.

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

- [x] Array scenario
- [x] Linked List scenario
- [x] Stack / Queue scenarios
- [x] Hash Table scenario with linear probing
- [x] Tests for `structures/*` logic
- [x] Binary Search Tree scenario with shape-sensitive cost
- [x] Pre-BST readiness gate (`PRE_BST_CHECKLIST.md`) and manual review (`MANUAL_REVIEW.md`)
- [ ] Comparison mode: run same operation on multiple structures
- [ ] Challenge / Break It modes
- [ ] README hero GIF and deployment polish

## License

MIT

## Contact & Feedback

Built by [@adamsantoyo](https://github.com/adamsantoyo). Questions or ideas? Open an issue.
