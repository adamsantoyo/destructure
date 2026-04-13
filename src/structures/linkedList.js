/**
 * Linked List structure — pure logic.
 * Returns an array of steps. Zero rendering, zero React.
 *
 * Step shape: { type, ...payload, ops, explanation }
 * Types: 'highlight' | 'relink' | 'remove' | 'insert' | 'done' | 'info'
 *
 * Key difference from Array: no shifting. Deleting/inserting only
 * costs pointer changes — O(1) for the operation itself.
 * The cost is *finding* the node: O(n) traversal.
 */

/* ── Pure cost calculators (no steps, no animation) ── */

/**
 * Delete cost = number of traversal steps to reach the node.
 * The delete itself is O(1) pointer rewiring.
 */
export function getDeleteCost(length, index) {
  if (index < 0 || index >= length) return 0
  return index // traverse to the node
}

/**
 * Insert cost = number of traversal steps to reach the insertion point.
 * The insert itself is O(1) pointer rewiring.
 */
export function getInsertCost(length, index) {
  if (index < 0 || index > length) return 0
  return index // traverse to the position
}

/* ── Step generators (for Compare mode) ── */

export function deleteFirst(list) {
  if (!list.length) return [{ type: 'info', explanation: 'The list is already empty.', ops: 0 }]

  const removed = list[0]

  return [
    {
      type: 'highlight',
      index: 0,
      variant: 'danger',
      explanation: `"${removed}" is the head. No traversal needed.`,
      ops: 0,
    },
    {
      type: 'relink',
      explanation: 'Move head pointer to the next node.',
      ops: 0,
    },
    {
      type: 'remove',
      index: 0,
      explanation: `"${removed}" is unlinked. The old second node is now the head.`,
      ops: 0,
    },
    {
      type: 'done',
      ops: 0,
      explanation: 'Done. Deleting the head is O(1) — no traversal, just rewire one pointer.',
    },
  ]
}

export function deleteLast(list) {
  if (!list.length) return [{ type: 'info', explanation: 'The list is already empty.', ops: 0 }]

  if (list.length === 1) {
    return [
      {
        type: 'highlight',
        index: 0,
        variant: 'danger',
        explanation: `"${list[0]}" is the only node — it's both head and tail.`,
        ops: 0,
      },
      {
        type: 'remove',
        index: 0,
        explanation: 'Removed. Head is now null.',
        ops: 0,
      },
      {
        type: 'done',
        ops: 0,
        explanation: 'Done. Only one node, no traversal needed. O(1).',
      },
    ]
  }

  const removed = list[list.length - 1]
  const traversals = list.length - 1

  const steps = [
    {
      type: 'info',
      explanation: `Need to find the node before "${removed}" to unlink the tail. Must traverse from head.`,
      ops: 0,
    },
  ]

  // Traverse to the second-to-last node
  for (let i = 0; i < traversals; i++) {
    steps.push({
      type: 'highlight',
      index: i,
      variant: i === traversals - 1 ? 'accent' : 'muted',
      explanation: i === traversals - 1
        ? `"${list[i]}" is the node before the tail. Found it after ${traversals} step${traversals !== 1 ? 's' : ''}.`
        : `Traversing: "${list[i]}" at position ${i}.`,
      ops: i + 1,
    })
  }

  steps.push({
    type: 'relink',
    explanation: `Set "${list[traversals - 1]}".next = null. The tail is now unlinked.`,
    ops: traversals,
  })

  steps.push({
    type: 'remove',
    index: list.length - 1,
    explanation: `"${removed}" is gone.`,
    ops: traversals,
  })

  steps.push({
    type: 'done',
    ops: traversals,
    explanation: `Done. Had to traverse ${traversals} node${traversals !== 1 ? 's' : ''} just to find the tail. The delete itself was instant — the cost is the walk. O(n).`,
  })

  return steps
}

export function deleteAtIndex(list, index) {
  if (index < 0 || index >= list.length) {
    return [{ type: 'info', explanation: `Index ${index} is out of range (0–${list.length - 1}).`, ops: 0 }]
  }
  if (index === 0) return deleteFirst(list)
  if (index === list.length - 1) return deleteLast(list)

  const removed = list[index]
  const traversals = index

  const steps = [
    {
      type: 'info',
      explanation: `Need to reach position ${index} to delete "${removed}". Must traverse from head.`,
      ops: 0,
    },
  ]

  for (let i = 0; i < traversals; i++) {
    steps.push({
      type: 'highlight',
      index: i,
      variant: 'muted',
      explanation: `Traversing: "${list[i]}" at position ${i}.`,
      ops: i + 1,
    })
  }

  steps.push({
    type: 'highlight',
    index,
    variant: 'danger',
    explanation: `Found "${removed}" at position ${index} after ${traversals} step${traversals !== 1 ? 's' : ''}.`,
    ops: traversals,
  })

  steps.push({
    type: 'relink',
    explanation: `Rewire: "${list[index - 1]}".next now points to "${list[index + 1]}". Skips right over "${removed}".`,
    ops: traversals,
  })

  steps.push({
    type: 'remove',
    index,
    explanation: `"${removed}" is unlinked and gone.`,
    ops: traversals,
  })

  steps.push({
    type: 'done',
    ops: traversals,
    explanation: `Done. ${traversals} traversal step${traversals !== 1 ? 's' : ''} to find the node, then instant rewire. The delete is O(1) — the walk is O(n).`,
  })

  return steps
}

export function insertFirst(list, value) {
  return [
    {
      type: 'insert',
      value,
      index: 0,
      explanation: `"${value}" becomes the new head. Its .next points to the old head. No traversal.`,
      ops: 0,
    },
    {
      type: 'done',
      ops: 0,
      explanation: 'Done. Inserting at the head is always O(1) — just set two pointers.',
    },
  ]
}

export function insertLast(list, value) {
  if (list.length === 0) return insertFirst(list, value)

  const traversals = list.length

  const steps = [
    {
      type: 'info',
      explanation: `Need to find the current tail to append "${value}". Must traverse from head.`,
      ops: 0,
    },
  ]

  for (let i = 0; i < list.length; i++) {
    steps.push({
      type: 'highlight',
      index: i,
      variant: i === list.length - 1 ? 'accent' : 'muted',
      explanation: i === list.length - 1
        ? `"${list[i]}" is the tail. Found it after ${traversals} step${traversals !== 1 ? 's' : ''}.`
        : `Traversing: "${list[i]}" at position ${i}.`,
      ops: i + 1,
    })
  }

  steps.push({
    type: 'insert',
    value,
    index: list.length,
    explanation: `"${value}" is linked at the end. "${list[list.length - 1]}".next now points to it.`,
    ops: traversals,
  })

  steps.push({
    type: 'done',
    ops: traversals,
    explanation: `Done. ${traversals} traversal step${traversals !== 1 ? 's' : ''} to find the tail, then O(1) to link. Without a tail pointer, appending is O(n).`,
  })

  return steps
}

export function insertAtIndex(list, index, value) {
  if (index < 0 || index > list.length) {
    return [{ type: 'info', explanation: `Index ${index} is out of range (0–${list.length}).`, ops: 0 }]
  }
  if (index === 0) return insertFirst(list, value)
  if (index === list.length) return insertLast(list, value)

  const traversals = index

  const steps = [
    {
      type: 'info',
      explanation: `Need to reach position ${index} to insert "${value}". Must traverse from head.`,
      ops: 0,
    },
  ]

  for (let i = 0; i < traversals; i++) {
    steps.push({
      type: 'highlight',
      index: i,
      variant: 'muted',
      explanation: i === traversals - 1
        ? `"${list[i]}" at position ${i} — this is where we insert after.`
        : `Traversing: "${list[i]}" at position ${i}.`,
      ops: i + 1,
    })
  }

  steps.push({
    type: 'insert',
    value,
    index,
    explanation: `"${value}" inserted at position ${index}. Pointer rewired: "${list[index - 1]}" → "${value}" → "${list[index]}".`,
    ops: traversals,
  })

  steps.push({
    type: 'done',
    ops: traversals,
    explanation: `Done. ${traversals} step${traversals !== 1 ? 's' : ''} to walk there, then O(1) to insert. Finding the spot is the expensive part.`,
  })

  return steps
}
