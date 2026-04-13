/**
 * Queue structure — pure logic.
 * Returns an array of steps. Zero rendering, zero React.
 *
 * Step shape: { type, ...payload, ops, explanation }
 * Types: 'highlight' | 'remove' | 'insert' | 'done' | 'info'
 *
 * Queue is FIFO — enqueue at the back, dequeue from the front.
 * Both operations are always O(1). The lesson isn't cost — it's access order.
 */

/* ── Pure cost calculators (no steps, no animation) ── */

/**
 * Dequeue cost is always O(1) — just remove the front.
 */
export function getDequeueCost(length) {
  if (length <= 0) return 0
  return 0
}

/**
 * Enqueue cost is always O(1) — just add to the back.
 */
export function getEnqueueCost() {
  return 0
}

/* ── Step generators (for Compare mode) ── */

export function enqueue(queue, value) {
  const backIndex = queue.length

  return [
    {
      type: 'insert',
      index: backIndex,
      value,
      explanation: `"${value}" joins the back of the queue at position ${backIndex}.`,
      ops: 0,
    },
    {
      type: 'done',
      ops: 0,
      explanation: 'Done. Enqueue is always O(1) — just add to the back.',
    },
  ]
}

export function dequeue(queue) {
  if (!queue.length) return [{ type: 'info', explanation: 'The queue is already empty.', ops: 0 }]

  const removed = queue[0]

  return [
    {
      type: 'highlight',
      index: 0,
      variant: 'danger',
      explanation: `"${removed}" is at the front — first in line.`,
      ops: 0,
    },
    {
      type: 'remove',
      index: 0,
      explanation: `"${removed}" leaves the front. The next item becomes the new front.`,
      ops: 0,
    },
    {
      type: 'done',
      ops: 0,
      explanation: 'Done. Dequeue is always O(1) — just remove the front element.',
    },
  ]
}
