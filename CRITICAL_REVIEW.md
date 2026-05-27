# Critical Review: Structures & Representation

This review looks at how the project models each data structure (pure logic in `src/structures`) and how the scenes render and teach those rules (scenarios in `src/scenarios` plus Compare mode). The goal is to surface what works, where the current design might mislead learners, and which improvements unlock the most clarity.

## What is working
- Clear separation of concerns: cost math lives in `src/structures/*` and is fully unit-tested; scenes stay presentational.
- Step-driven narratives: every operation yields labelled steps with explanations, keeping animation and teaching in sync.
- Consistent interaction spine: click → preview popover → execute → diff → history; progress is persisted per structure.
- Compare mode already contrasts array vs linked list with synchronized playback to show why the same verb has different costs.
- UI tokens, tones, and motion rules are centralized, which keeps scenarios visually coherent.

## Findings and risks
1) Cost vocabulary drifts between structures  
`ops` represents shifts (array), traversals (linked list), probes (hash table), and path steps (BST). The UI counters and history reuse the generic label, so learners never see the per-structure meaning and may equate counts incorrectly.  
→ Expose a structure-specific cost label alongside counters/popovers (e.g., “shifts”, “traversals”, “probes”) and thread it through history entries.

2) Hash table stops short of load-factor teaching  
Fixed `TABLE_SIZE = 8` and no rehash path means the scene shows collisions but not why resize thresholds exist. The nudge copy mentions resizing, yet nothing visual happens as occupancy climbs.  
→ Surface a live load-factor meter and a “rehash” branch (even a mock animation) once occupancy crosses a threshold so the O(1) promise is grounded in the representation.

3) BST lacks shape feedback  
The logic is unbalanced BST insert/delete (`insert` and `deleteNode`), but the scene does not surface height, skew, or the “degenerates to linked list” story beyond text. Learners can miss why sorted inserts are bad.  
→ Add a live height vs. ideal log2(n) readout and a preset for sorted-insert stress so the cost counter and tree shape line up.

4) Linear structures underplay access constraints  
Stack and queue scenes show front/back/top labels, but the teaching moment (“middle is unreachable without popping/dequeuing”) relies on text nudges. There is no visual dead-zone or blocked-pointer indicator.  
→ Add an overlay or disabled-state treatment for buried items to reinforce the access rule without needing to read copy.

5) Compare mode is narrow  
Only array vs. linked list operations are contrasted. No coverage for “O(1) vs O(n) by design” cases (stack/queue) or “average O(1) with probe spikes” (hash table).  
→ Add at least one hash-table probe comparison and one “front vs. back” linear-time contrast to broaden the comparative mental model.

6) Progress metrics are hidden  
`progress.metrics` tracks operations and positions seen per structure, but nothing surfaces this to the learner. Insights could remind users to try both ends or different insert patterns.  
→ Use the metrics to drive contextual nudges (“You’ve only touched the tail—try the head”) and a lightweight streak/badge UI.

## Recommended next steps
- Near-term: introduce a cost-label prop so counters and popovers read “shifts/traversals/probes/path steps” instead of generic “ops”. Update history entries to match.  
- Near-term: add a small HUD for hash table load factor with a staged “rehash” explanation once a threshold is crossed.  
- Mid-term: add BST shape telemetry (height vs. ideal) and a “sorted insert” preset to dramatize degeneration.  
- Mid-term: widen Compare mode with one hash-table probe scenario and a constant-time vs. linear-time queue/stack example.  
- Ongoing: surface the existing progress metrics in the UI to steer exploration and reinforce the learning goals.
