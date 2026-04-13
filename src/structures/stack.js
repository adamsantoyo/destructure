/**
 * Stack structure — pure logic.
 * Returns an array of steps. Zero rendering, zero React.
 *
 * Step shape: { type, ...payload, ops, explanation }
 * Types: 'highlight' | 'remove' | 'insert' | 'done' | 'info'
 *
 * Stack is LIFO — push and pop from the top only.
 * Both operations are always O(1). The lesson isn't cost — it's access order.
 */

/* ── Pure cost calculators (no steps, no animation) ── */

/**
 * Pop cost is always O(1) — just remove the top.
 */
export function getPopCost(length) {
  if (length <= 0) return 0
  return 1
}

/**
 * Push cost is always O(1) — just add to the top.
 */
export function getPushCost() {
  return 0
}

/* ── Step generators (for Compare mode) ── */

export function push(stack, value) {
  const topIndex = stack.length

  return [
    {
      type: 'highlight',
      index: topIndex,
      variant: 'accent',
      explanation: `Position ${topIndex} is the new top of the stack.`,
      ops: 0,
    },
    {
      type: 'insert',
      index: topIndex,
      value,
      explanation: `"${value}" is pushed onto the top. No other elements move.`,
      ops: 0,
    },
    {
      type: 'done',
      ops: 0,
      explanation: 'Done. Push is always O(1) — just place it on top.',
    },
  ]
}

export function pop(stack) {
  if (!stack.length) return [{ type: 'info', explanation: 'The stack is already empty.', ops: 0 }]

  const topIndex = stack.length - 1
  const removed = stack[topIndex]

  return [
    {
      type: 'highlight',
      index: topIndex,
      variant: 'danger',
      explanation: `"${removed}" is at the top — position ${topIndex}.`,
      ops: 0,
    },
    {
      type: 'remove',
      index: topIndex,
      explanation: `"${removed}" is removed from the top. Nothing else moves.`,
      ops: 0,
    },
    {
      type: 'done',
      ops: 0,
      explanation: 'Done. Pop is always O(1) — just remove the top element.',
    },
  ]
}
